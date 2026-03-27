using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Veggio.Api.Data;
using Veggio.Api.DTOs;
using Veggio.Api.Models;
using Veggio.Api.Services;

namespace Veggio.Api.Controllers;

[ApiController]
[Route("api/auth")]
public class AuthController : ControllerBase
{
    private readonly AppDbContext  _db;
    private readonly ITokenService _tokenSvc;
    private readonly ILogger<AuthController> _logger;

    public AuthController(AppDbContext db, ITokenService tokenSvc, ILogger<AuthController> logger)
    {
        _db       = db;
        _tokenSvc = tokenSvc;
        _logger   = logger;
    }

    // POST /api/auth/register
    [HttpPost("register")]
    public async Task<IActionResult> Register([FromBody] RegisterRequest req)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        var emailLower = req.Email.Trim().ToLowerInvariant();

        if (await _db.Users.AnyAsync(u => u.Email == emailLower))
            return Conflict(new { message = "Email is already registered." });

        var user = new User
        {
            Name         = req.Name.Trim(),
            Email        = emailLower,
            PasswordHash = BCrypt.Net.BCrypt.HashPassword(req.Password, workFactor: 12),
            Role         = "Customer",
        };

        _db.Users.Add(user);
        await _db.SaveChangesAsync();
        _logger.LogInformation("New user registered: {Email}", emailLower);

        var token = _tokenSvc.GenerateToken(user);
        return Ok(new AuthResponse(token, MapUser(user)));
    }

    // POST /api/auth/login
    [HttpPost("login")]
    public async Task<IActionResult> Login([FromBody] LoginRequest req)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        var emailLower = req.Email.Trim().ToLowerInvariant();
        var user = await _db.Users.FirstOrDefaultAsync(u => u.Email == emailLower && u.IsActive);

        // Always verify hash to prevent timing attacks
        var hash   = user?.PasswordHash ?? BCrypt.Net.BCrypt.HashPassword("dummy");
        var valid  = BCrypt.Net.BCrypt.Verify(req.Password, hash);

        if (user is null || !valid)
        {
            _logger.LogWarning("Failed login attempt for: {Email}", emailLower);
            return Unauthorized(new { message = "Invalid email or password." });
        }

        _logger.LogInformation("User logged in: {Email}", emailLower);
        var token = _tokenSvc.GenerateToken(user);
        return Ok(new AuthResponse(token, MapUser(user)));
    }

    // GET /api/auth/me
    [HttpGet("me")]
    [Authorize]
    public async Task<IActionResult> Me()
    {
        var userId = GetUserId();
        var user   = await _db.Users.FindAsync(userId);
        if (user is null || !user.IsActive) return Unauthorized();
        return Ok(MapUser(user));
    }

    private Guid GetUserId()
    {
        var sub = User.FindFirst(System.Security.Claims.ClaimTypes.NameIdentifier)?.Value
               ?? User.FindFirst("sub")?.Value;
        return Guid.Parse(sub!);
    }

    private static UserDto MapUser(User u) =>
        new(u.Id, u.Name, u.Email, u.Phone, u.Address, u.Role, u.CreatedAt);
}
