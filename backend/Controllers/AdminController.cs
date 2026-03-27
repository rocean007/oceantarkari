using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Veggio.Api.Data;
using Veggio.Api.DTOs;

namespace Veggio.Api.Controllers;

// ── Admin Controller ──────────────────────────────────────────────
[ApiController]
[Route("api/admin")]
[Authorize(Roles = "Admin")]
public class AdminController : ControllerBase
{
    private readonly AppDbContext _db;

    public AdminController(AppDbContext db) => _db = db;

    // GET /api/admin/stats
    [HttpGet("stats")]
    public async Task<IActionResult> Stats()
    {
        var today     = DateTime.UtcNow.Date;
        var yesterday = today.AddDays(-1);

        var totalOrders   = await _db.Orders.CountAsync();
        var activeUsers   = await _db.Users.CountAsync(u => u.IsActive);
        var lowStock      = await _db.Vegetables.CountAsync(v => v.IsActive && v.Stock < 10);
        var revenueToday  = await _db.Orders
            .Where(o => o.CreatedAt >= today && o.Status != "Cancelled")
            .SumAsync(o => (decimal?)o.Total) ?? 0m;
        var revenueYest   = await _db.Orders
            .Where(o => o.CreatedAt >= yesterday && o.CreatedAt < today && o.Status != "Cancelled")
            .SumAsync(o => (decimal?)o.Total) ?? 0m;
        var ordersToday   = await _db.Orders.CountAsync(o => o.CreatedAt >= today);
        var ordersYest    = await _db.Orders.CountAsync(o => o.CreatedAt >= yesterday && o.CreatedAt < today);

        double? revDelta   = revenueYest  > 0 ? Math.Round((double)((revenueToday - revenueYest) / revenueYest * 100), 1) : null;
        double? orderDelta = ordersYest   > 0 ? Math.Round((double)((ordersToday - ordersYest) / (double)ordersYest * 100), 1) : null;

        var recent = await _db.Orders
            .Include(o => o.User)
            .OrderByDescending(o => o.CreatedAt)
            .Take(10)
            .Select(o => new RecentOrderDto(o.Id, o.User.Name, o.Total, o.Status, o.CreatedAt))
            .ToListAsync();

        return Ok(new AdminStatsDto(totalOrders, revenueToday, activeUsers, lowStock, orderDelta, revDelta, recent));
    }

    // GET /api/admin/orders
    [HttpGet("orders")]
    public async Task<IActionResult> Orders(
        [FromQuery] string? status,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        if (pageSize > 100) pageSize = 100;

        var q = _db.Orders.Include(o => o.User).AsQueryable();
        if (!string.IsNullOrEmpty(status)) q = q.Where(o => o.Status == status);

        var total = await q.CountAsync();
        var items = await q
            .OrderByDescending(o => o.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(o => new OrderListDto(o.Id, o.User.Name, o.Items.Count, o.Total, o.Status, o.PaymentMethod, o.CreatedAt))
            .ToListAsync();

        return Ok(new { orders = items, total, totalPages = (int)Math.Ceiling(total / (double)pageSize) });
    }

    // PUT /api/admin/orders/{id}/status
    [HttpPut("orders/{id:guid}/status")]
    public async Task<IActionResult> UpdateOrderStatus(Guid id, [FromBody] UpdateOrderStatusRequest req)
    {
        var allowed = new[] { "Pending", "Confirmed", "Processing", "Delivered", "Cancelled" };
        if (!allowed.Contains(req.Status))
            return BadRequest(new { message = "Invalid status value." });

        var order = await _db.Orders.FindAsync(id);
        if (order is null) return NotFound(new { message = "Order not found." });

        order.Status    = req.Status;
        order.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Status updated.", order.Status });
    }

    // GET /api/admin/users
    [HttpGet("users")]
    public async Task<IActionResult> Users(
        [FromQuery] string? search,
        [FromQuery] int page     = 1,
        [FromQuery] int pageSize = 20)
    {
        if (pageSize > 100) pageSize = 100;

        var q = _db.Users.AsQueryable();
        if (!string.IsNullOrEmpty(search))
            q = q.Where(u => EF.Functions.ILike(u.Name, $"%{search}%") ||
                              EF.Functions.ILike(u.Email, $"%{search}%"));

        var total = await q.CountAsync();
        var users = await q
            .OrderByDescending(u => u.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .Select(u => new AdminUserDto(u.Id, u.Name, u.Email, u.Phone, u.Role,
                u.Orders.Count, u.CreatedAt))
            .ToListAsync();

        return Ok(new { users, total, totalPages = (int)Math.Ceiling(total / (double)pageSize) });
    }
}

// ── Users Controller (self) ────────────────────────────────────────
[ApiController]
[Route("api/users")]
[Authorize]
public class UsersController : ControllerBase
{
    private readonly AppDbContext _db;

    public UsersController(AppDbContext db) => _db = db;

    private Guid UserId => Guid.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier)
     ?? User.FindFirstValue("sub")
     ?? throw new UnauthorizedAccessException());

    // PUT /api/users/me
    [HttpPut("me")]
    public async Task<IActionResult> Update([FromBody] UpdateUserRequest req)
    {
        var user = await _db.Users.FindAsync(UserId);
        if (user is null) return NotFound();

        if (req.Name    is not null) user.Name    = req.Name.Trim();
        if (req.Phone   is not null) user.Phone   = req.Phone.Trim();
        if (req.Address is not null) user.Address = req.Address.Trim();
        user.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(new { message = "Profile updated." });
    }
}
