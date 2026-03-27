using Microsoft.EntityFrameworkCore;
using Veggio.Api.Models;

namespace Veggio.Api.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<User>       Users       => Set<User>();
    public DbSet<Vegetable>  Vegetables  => Set<Vegetable>();
    public DbSet<Order>      Orders      => Set<Order>();
    public DbSet<OrderItem>  OrderItems  => Set<OrderItem>();

    protected override void OnModelCreating(ModelBuilder mb)
    {
        // ── User ──────────────────────────────────────────
        mb.Entity<User>(e =>
        {
            e.HasKey(u => u.Id);
            e.HasIndex(u => u.Email).IsUnique();
            e.Property(u => u.Email).IsRequired().HasMaxLength(254);
            e.Property(u => u.Name).IsRequired().HasMaxLength(100);
            e.Property(u => u.Role).HasDefaultValue("Customer");
            e.Property(u => u.IsActive).HasDefaultValue(true);
            e.Property(u => u.CreatedAt).HasDefaultValueSql("now()");
            e.Property(u => u.UpdatedAt).HasDefaultValueSql("now()");
        });

        // ── Vegetable ──────────────────────────────────────
        mb.Entity<Vegetable>(e =>
        {
            e.HasKey(v => v.Id);
            e.HasIndex(v => v.Category);
            e.HasIndex(v => v.IsActive);
            e.HasIndex(v => v.IsFeatured);
            e.Property(v => v.Price).HasColumnType("decimal(10,2)");
            e.Property(v => v.OriginalPrice).HasColumnType("decimal(10,2)");
            e.Property(v => v.IsActive).HasDefaultValue(true);
            e.Property(v => v.CreatedAt).HasDefaultValueSql("now()");
            e.Property(v => v.UpdatedAt).HasDefaultValueSql("now()");
        });

        // ── Order ──────────────────────────────────────────
        mb.Entity<Order>(e =>
        {
            e.HasKey(o => o.Id);
            e.HasIndex(o => o.UserId);
            e.HasIndex(o => o.Status);
            e.HasIndex(o => o.CreatedAt);
            e.Property(o => o.Total).HasColumnType("decimal(10,2)");
            e.Property(o => o.DeliveryFee).HasColumnType("decimal(10,2)");
            e.Property(o => o.Status).HasDefaultValue("Pending");
            e.Property(o => o.CreatedAt).HasDefaultValueSql("now()");
            e.Property(o => o.UpdatedAt).HasDefaultValueSql("now()");

            e.HasOne(o => o.User)
             .WithMany(u => u.Orders)
             .HasForeignKey(o => o.UserId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // ── OrderItem ──────────────────────────────────────
        mb.Entity<OrderItem>(e =>
        {
            e.HasKey(i => i.Id);
            e.Property(i => i.Price).HasColumnType("decimal(10,2)");

            e.HasOne(i => i.Order)
             .WithMany(o => o.Items)
             .HasForeignKey(i => i.OrderId)
             .OnDelete(DeleteBehavior.Cascade);

            e.HasOne(i => i.Vegetable)
             .WithMany(v => v.OrderItems)
             .HasForeignKey(i => i.VegetableId)
             .OnDelete(DeleteBehavior.Restrict);
        });

        // ── Seed data ──────────────────────────────────────
        SeedData(mb);
    }

    private static void SeedData(ModelBuilder mb)
    {
        // Seed admin user (password: Admin@123) — static date required by EF HasData
        var seedDate = new DateTime(2025, 1, 1, 0, 0, 0, DateTimeKind.Utc);
        mb.Entity<User>().HasData(new User
        {
            Id           = Guid.Parse("11111111-1111-1111-1111-111111111111"),
            Name         = "Veggio Admin",
            Email        = "admin@veggio.io",
            PasswordHash = BCrypt.Net.BCrypt.HashPassword("Admin@123"),
            Role         = "Admin",
            CreatedAt    = seedDate,
            UpdatedAt    = seedDate,
        });

        // Seed sample vegetables — IDs and dates MUST be static for EF HasData
        mb.Entity<Vegetable>().HasData(
            new Vegetable { Id = Guid.Parse("aaaaaaaa-0001-0000-0000-000000000000"), Name = "Fresh Broccoli",   Category = "Fresh",  Price = 120, Unit = "kg",    Stock = 50,  IsOrganic = true,  IsFeatured = true,  CreatedAt = seedDate, UpdatedAt = seedDate },
            new Vegetable { Id = Guid.Parse("aaaaaaaa-0002-0000-0000-000000000000"), Name = "Baby Carrots",     Category = "Root",   Price = 60,  Unit = "bunch", Stock = 80,  IsOrganic = false, IsFeatured = true,  CreatedAt = seedDate, UpdatedAt = seedDate },
            new Vegetable { Id = Guid.Parse("aaaaaaaa-0003-0000-0000-000000000000"), Name = "Cherry Tomatoes",  Category = "Fresh",  Price = 80,  Unit = "kg",    Stock = 60,  IsOrganic = false, IsFeatured = true,  CreatedAt = seedDate, UpdatedAt = seedDate },
            new Vegetable { Id = Guid.Parse("aaaaaaaa-0004-0000-0000-000000000000"), Name = "Spinach",          Category = "Leafy",  Price = 40,  Unit = "bunch", Stock = 100, IsOrganic = true,  IsFeatured = true,  CreatedAt = seedDate, UpdatedAt = seedDate },
            new Vegetable { Id = Guid.Parse("aaaaaaaa-0005-0000-0000-000000000000"), Name = "English Cucumber", Category = "Fresh",  Price = 50,  Unit = "piece", Stock = 120, IsOrganic = false, IsFeatured = false, CreatedAt = seedDate, UpdatedAt = seedDate },
            new Vegetable { Id = Guid.Parse("aaaaaaaa-0006-0000-0000-000000000000"), Name = "Red Onion",        Category = "Root",   Price = 45,  Unit = "kg",    Stock = 200, IsOrganic = false, IsFeatured = false, CreatedAt = seedDate, UpdatedAt = seedDate },
            new Vegetable { Id = Guid.Parse("aaaaaaaa-0007-0000-0000-000000000000"), Name = "Sweet Potato",     Category = "Root",   Price = 70,  Unit = "kg",    Stock = 90,  IsOrganic = true,  IsFeatured = true,  CreatedAt = seedDate, UpdatedAt = seedDate },
            new Vegetable { Id = Guid.Parse("aaaaaaaa-0008-0000-0000-000000000000"), Name = "Bell Pepper",      Category = "Exotic", Price = 90,  Unit = "kg",    Stock = 40,  IsOrganic = false, IsFeatured = false, CreatedAt = seedDate, UpdatedAt = seedDate },
            new Vegetable { Id = Guid.Parse("aaaaaaaa-0009-0000-0000-000000000000"), Name = "Fresh Coriander",  Category = "Herbs",  Price = 20,  Unit = "bunch", Stock = 150, IsOrganic = true,  IsFeatured = false, CreatedAt = seedDate, UpdatedAt = seedDate },
            new Vegetable { Id = Guid.Parse("aaaaaaaa-000a-0000-0000-000000000000"), Name = "Kale",             Category = "Leafy",  Price = 100, Unit = "bunch", Stock = 30,  IsOrganic = true,  IsFeatured = true,  CreatedAt = seedDate, UpdatedAt = seedDate }
        );
    }
}
