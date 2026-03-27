using System.Text;
using AspNetCoreRateLimit;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.AspNetCore.ResponseCompression;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using Serilog;
using Veggio.Api.Data;
using Veggio.Api.Middleware;
using Veggio.Api.Services;
using EFCore.NamingConventions;

// ── Serilog bootstrap ──────────────────────────────────────────────
Log.Logger = new LoggerConfiguration()
    .WriteTo.Console()
    .WriteTo.File("logs/veggio-.log", rollingInterval: RollingInterval.Day, retainedFileCountLimit: 14)
    .Enrich.FromLogContext()
    .CreateLogger();

try
{
    var builder = WebApplication.CreateBuilder(args);
    builder.Host.UseSerilog();

    // ── Services ───────────────────────────────────────────────────
    var svc = builder.Services;

    // PostgreSQL + EF Core
    svc.AddDbContext<AppDbContext>(opt =>
        opt.UseNpgsql(
            builder.Configuration.GetConnectionString("DefaultConnection"),
            npg => npg.EnableRetryOnFailure(3)
        )
        .UseSnakeCaseNamingConvention()
    );

    // JWT Auth
    var jwtKey = builder.Configuration["Jwt:Key"]
        ?? throw new InvalidOperationException("Jwt:Key is required in configuration");

    svc.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
       .AddJwtBearer(opt =>
       {
           opt.TokenValidationParameters = new TokenValidationParameters
           {
               ValidateIssuerSigningKey = true,
               IssuerSigningKey        = new SymmetricSecurityKey(Encoding.UTF8.GetBytes(jwtKey)),
               ValidateIssuer          = true,
               ValidIssuer             = builder.Configuration["Jwt:Issuer"],
               ValidateAudience        = true,
               ValidAudience           = builder.Configuration["Jwt:Audience"],
               ValidateLifetime        = true,
               ClockSkew               = TimeSpan.FromMinutes(2),
           };
       });

    svc.AddAuthorization();

    // Rate limiting — protect auth endpoints
    svc.AddMemoryCache();
    svc.Configure<IpRateLimitOptions>(opt =>
    {
        opt.EnableEndpointRateLimiting = true;
        opt.StackBlockedRequests       = false;
        opt.GeneralRules = new List<RateLimitRule>
        {
            new() { Endpoint = "POST:/api/auth/*", Limit = 10, Period = "1m" },
            new() { Endpoint = "*",                Limit = 200, Period = "1m" },
        };
    });
    svc.AddSingleton<IIpPolicyStore, MemoryCacheIpPolicyStore>();
    svc.AddSingleton<IRateLimitCounterStore, MemoryCacheRateLimitCounterStore>();
    svc.AddSingleton<IRateLimitConfiguration, RateLimitConfiguration>();
    svc.AddSingleton<IProcessingStrategy, AsyncKeyLockProcessingStrategy>();
    svc.AddInMemoryRateLimiting();

    // Response compression (Brotli > Gzip)
    svc.AddResponseCompression(opt =>
    {
        opt.EnableForHttps = true;
        opt.Providers.Add<BrotliCompressionProvider>();
        opt.Providers.Add<GzipCompressionProvider>();
    });

    // CORS — allow only the frontend origin
    var frontendOrigin = builder.Configuration["AllowedOrigins"] ?? "http://localhost:3000";
    svc.AddCors(opt => opt.AddPolicy("Frontend", policy =>
        policy.WithOrigins(frontendOrigin.Split(',', StringSplitOptions.RemoveEmptyEntries))
              .AllowAnyHeader()
              .AllowAnyMethod()
              .WithExposedHeaders("Content-Disposition")
    ));

    // Controllers with strict model validation
    svc.AddControllers(opt => { opt.SuppressAsyncSuffixInActionNames = false; });

    // DI registrations
    svc.AddScoped<ITokenService, TokenService>();

    // Health checks
    svc.AddHealthChecks().AddDbContextCheck<AppDbContext>();

    // ── App pipeline ───────────────────────────────────────────────
    var app = builder.Build();

    // Auto-migrate on startup (disable in production if you manage migrations manually)
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();
        Log.Information("Database migrations applied.");
    }

    app.UseIpRateLimiting();
    app.UseMiddleware<GlobalExceptionMiddleware>();
    app.UseMiddleware<SecurityHeadersMiddleware>();
    app.UseResponseCompression();

    if (app.Environment.IsDevelopment())
    {
        app.UseDeveloperExceptionPage();
    }
    else
    {
        // Strict HSTS in production
        app.UseHsts();
        app.UseHttpsRedirection();
    }

    app.UseCors("Frontend");
    app.UseStaticFiles();          // serves React build from wwwroot
    app.UseAuthentication();
    app.UseAuthorization();

    app.MapControllers();
    app.MapHealthChecks("/health");

    // SPA fallback — serve React index.html for all non-API routes
    app.MapFallbackToFile("index.html");

    Log.Information("Veggio API starting up on {Env}", app.Environment.EnvironmentName);
    await app.RunAsync();
}
catch (Exception ex)
{
    Log.Fatal(ex, "Application terminated unexpectedly");
}
finally
{
    Log.CloseAndFlush();
}
