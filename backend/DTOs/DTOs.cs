using System.ComponentModel.DataAnnotations;

namespace Veggio.Api.DTOs;

// ── Auth ──────────────────────────────────────────────────────────
public record LoginRequest(
    [Required, EmailAddress] string Email,
    [Required, MinLength(8)] string Password
);

public record RegisterRequest(
    [Required, MaxLength(100)] string Name,
    [Required, EmailAddress, MaxLength(254)] string Email,
    [Required, MinLength(8), MaxLength(100)] string Password
);

public record AuthResponse(string Token, UserDto User);

// ── User ──────────────────────────────────────────────────────────
public record UserDto(
    Guid   Id,
    string Name,
    string Email,
    string? Phone,
    string? Address,
    string Role,
    DateTime CreatedAt
);

public record UpdateUserRequest(
    [MaxLength(100)] string? Name,
    [MaxLength(20)]  string? Phone,
    [MaxLength(500)] string? Address
);

// ── Vegetable ──────────────────────────────────────────────────────
public record VegetableDto(
    Guid    Id,
    string  Name,
    string  Category,
    decimal Price,
    decimal? OriginalPrice,
    string  Unit,
    int     Stock,
    string? Description,
    string? NutritionInfo,
    string? ImageUrl,
    bool    IsOrganic,
    bool    IsFeatured,
    int?    Discount,
    DateTime CreatedAt
);

public record CreateVegetableRequest(
    [Required, MaxLength(100)] string Name,
    [Required, MaxLength(50)]  string Category,
    [Range(0.01, 999999.99)]   decimal Price,
    decimal?                   OriginalPrice,
    [Required, MaxLength(30)]  string Unit,
    [Range(0, int.MaxValue)]   int    Stock,
    [MaxLength(1000)] string? Description,
    [MaxLength(500)]  string? NutritionInfo,
    [MaxLength(2000)] string? ImageUrl,
    bool  IsOrganic  = false,
    bool  IsFeatured = false,
    int?  Discount   = null
);

public record UpdateVegetableRequest(
    [MaxLength(100)] string? Name,
    [MaxLength(50)]  string? Category,
    [Range(0.01, 999999.99)] decimal? Price,
    decimal? OriginalPrice,
    [MaxLength(30)]  string? Unit,
    [Range(0, int.MaxValue)] int? Stock,
    [MaxLength(1000)] string? Description,
    [MaxLength(500)]  string? NutritionInfo,
    [MaxLength(2000)] string? ImageUrl,
    bool? IsOrganic,
    bool? IsFeatured,
    int?  Discount
);

// ── Order ──────────────────────────────────────────────────────────
public record PlaceOrderRequest(
    [Required] List<OrderItemRequest> Items,
    [Required, MaxLength(500)] string DeliveryAddress,
    [MaxLength(20)] string? Phone,
    [MaxLength(500)] string? Notes,
    [Required, MaxLength(30)] string PaymentMethod
);

public record OrderItemRequest(
    [Required] Guid VegetableId,
    [Range(1, 999)] int Quantity
);

public record OrderDto(
    Guid   Id,
    string CustomerName,
    string DeliveryAddress,
    string? Phone,
    string? Notes,
    decimal Total,
    decimal DeliveryFee,
    string  Status,
    string  PaymentMethod,
    string  PaymentStatus,
    List<OrderItemDto> Items,
    DateTime CreatedAt,
    DateTime UpdatedAt
);

public record OrderItemDto(
    Guid    Id,
    Guid    VegetableId,
    string  VegetableName,
    int     Quantity,
    decimal Price
);

public record UpdateOrderStatusRequest(
    [Required] string Status
);

// ── Admin ──────────────────────────────────────────────────────────
public record AdminStatsDto(
    int   TotalOrders,
    decimal RevenueToday,
    int   ActiveUsers,
    int   LowStockCount,
    double? OrdersDelta,
    double? RevenueDelta,
    List<RecentOrderDto> RecentOrders
);

public record RecentOrderDto(
    Guid    Id,
    string  CustomerName,
    decimal Total,
    string  Status,
    DateTime CreatedAt
);

public record AdminUserDto(
    Guid   Id,
    string Name,
    string Email,
    string? Phone,
    string  Role,
    int     OrderCount,
    DateTime CreatedAt
);

public record PagedResult<T>(List<T> Items, int Total, int TotalPages, int Page, int PageSize);

public record OrderListDto(
    Guid    Id,
    string  CustomerName,
    int     ItemCount,
    decimal Total,
    string  Status,
    string  PaymentMethod,
    DateTime CreatedAt
);
