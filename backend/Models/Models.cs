using System.ComponentModel.DataAnnotations;

namespace Veggio.Api.Models;

// ── User ──────────────────────────────────────────────────────────
public class User
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(254), EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string PasswordHash { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Phone { get; set; }

    [MaxLength(500)]
    public string? Address { get; set; }

    [Required, MaxLength(20)]
    public string Role { get; set; } = "Customer"; // Customer | Admin

    public bool IsActive { get; set; } = true;
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<Order> Orders { get; set; } = new List<Order>();
}

// ── Vegetable ──────────────────────────────────────────────────────
public class Vegetable
{
    public Guid Id { get; set; } = Guid.NewGuid();

    [Required, MaxLength(100)]
    public string Name { get; set; } = string.Empty;

    [Required, MaxLength(50)]
    public string Category { get; set; } = string.Empty;

    [Range(0.01, 999999.99)]
    public decimal Price { get; set; }

    public decimal? OriginalPrice { get; set; }

    [Required, MaxLength(30)]
    public string Unit { get; set; } = "kg"; // kg, g, bunch, piece, pack, dozen

    [Range(0, int.MaxValue)]
    public int Stock { get; set; }

    [MaxLength(1000)]
    public string? Description { get; set; }

    [MaxLength(500)]
    public string? NutritionInfo { get; set; }

    [MaxLength(2000)]
    public string? ImageUrl { get; set; }

    public bool IsOrganic { get; set; }
    public bool IsFeatured { get; set; }
    public bool IsActive { get; set; } = true;

    public int? Discount { get; set; } // percent

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<OrderItem> OrderItems { get; set; } = new List<OrderItem>();
}

// ── Order ──────────────────────────────────────────────────────────
public class Order
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid UserId { get; set; }
    public User User { get; set; } = null!;

    [Required, MaxLength(500)]
    public string DeliveryAddress { get; set; } = string.Empty;

    [MaxLength(20)]
    public string? Phone { get; set; }

    [MaxLength(500)]
    public string? Notes { get; set; }

    public decimal Total { get; set; }
    public decimal DeliveryFee { get; set; }

    [Required, MaxLength(30)]
    public string Status { get; set; } = "Pending";
    // Pending | Confirmed | Processing | Delivered | Cancelled

    [Required, MaxLength(30)]
    public string PaymentMethod { get; set; } = "cod";
    // cod | esewa | khalti

    [MaxLength(30)]
    public string PaymentStatus { get; set; } = "Pending";
    // Pending | Paid | Failed | Refunded

    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;
    public DateTime UpdatedAt { get; set; } = DateTime.UtcNow;

    // Navigation
    public ICollection<OrderItem> Items { get; set; } = new List<OrderItem>();
}

// ── OrderItem ──────────────────────────────────────────────────────
public class OrderItem
{
    public Guid Id { get; set; } = Guid.NewGuid();

    public Guid OrderId { get; set; }
    public Order Order { get; set; } = null!;

    public Guid VegetableId { get; set; }
    public Vegetable Vegetable { get; set; } = null!;

    // Snapshot at time of order
    [Required, MaxLength(100)]
    public string VegetableName { get; set; } = string.Empty;

    [Range(1, int.MaxValue)]
    public int Quantity { get; set; }

    [Range(0.01, 999999.99)]
    public decimal Price { get; set; }  // price at time of order
}
