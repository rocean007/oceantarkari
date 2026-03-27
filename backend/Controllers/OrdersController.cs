using System.Security.Claims;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Veggio.Api.Data;
using Veggio.Api.DTOs;
using Veggio.Api.Models;

namespace Veggio.Api.Controllers;

[ApiController]
[Route("api/orders")]
[Authorize]
public class OrdersController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ILogger<OrdersController> _logger;

    public OrdersController(AppDbContext db, ILogger<OrdersController> logger)
    {
        _db     = db;
        _logger = logger;
    }

    private Guid UserId => Guid.Parse(
        User.FindFirstValue(ClaimTypes.NameIdentifier)
     ?? User.FindFirstValue("sub")
     ?? throw new UnauthorizedAccessException());

    // POST /api/orders — place an order
    [HttpPost]
    public async Task<IActionResult> Place([FromBody] PlaceOrderRequest req)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);
        if (!req.Items.Any()) return BadRequest(new { message = "Order must have at least one item." });

        var vegIds = req.Items.Select(i => i.VegetableId).Distinct().ToList();
        var vegs   = await _db.Vegetables
            .Where(v => vegIds.Contains(v.Id) && v.IsActive)
            .ToDictionaryAsync(v => v.Id);

        // Validate all vegetables exist and have stock
        var errors = new List<string>();
        foreach (var item in req.Items)
        {
            if (!vegs.TryGetValue(item.VegetableId, out var veg))
                errors.Add($"Vegetable {item.VegetableId} not found.");
            else if (veg.Stock < item.Quantity)
                errors.Add($"{veg.Name}: only {veg.Stock} in stock.");
        }
        if (errors.Any()) return BadRequest(new { message = string.Join(" ", errors) });

        // Calculate totals
        var subtotal = req.Items.Sum(i => vegs[i.VegetableId].Price * i.Quantity);
        var delivery = subtotal >= 500 ? 0m : 50m;
        var total    = subtotal + delivery;

        // Build order
        var order = new Order
        {
            UserId          = UserId,
            DeliveryAddress = req.DeliveryAddress.Trim(),
            Phone           = req.Phone?.Trim(),
            Notes           = req.Notes?.Trim(),
            Total           = total,
            DeliveryFee     = delivery,
            PaymentMethod   = req.PaymentMethod,
            Status          = "Pending",
        };

        // Deduct stock
        foreach (var item in req.Items)
        {
            var veg = vegs[item.VegetableId];
            veg.Stock -= item.Quantity;
            order.Items.Add(new OrderItem
            {
                VegetableId   = veg.Id,
                VegetableName = veg.Name,
                Quantity      = item.Quantity,
                Price         = veg.Price,
            });
        }

        _db.Orders.Add(order);
        await _db.SaveChangesAsync();
        _logger.LogInformation("Order placed: {OrderId} by user {UserId}", order.Id, UserId);

        return CreatedAtAction(nameof(Get), new { id = order.Id }, await MapOrder(order));
    }

    // GET /api/orders — user's own orders
    [HttpGet]
    public async Task<IActionResult> List()
    {
        var orders = await _db.Orders
            .Include(o => o.Items)
            .Where(o => o.UserId == UserId)
            .OrderByDescending(o => o.CreatedAt)
            .ToListAsync();

        return Ok(orders.Select(MapOrderSimple));
    }

    // GET /api/orders/{id}
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var order = await _db.Orders
            .Include(o => o.Items)
            .Include(o => o.User)
            .FirstOrDefaultAsync(o => o.Id == id);

        if (order is null) return NotFound(new { message = "Order not found." });

        // Users can only see their own orders
        if (order.UserId != UserId && !User.IsInRole("Admin"))
            return Forbid();

        return Ok(await MapOrder(order));
    }

    // POST /api/orders/{id}/cancel
    [HttpPost("{id:guid}/cancel")]
    public async Task<IActionResult> Cancel(Guid id)
    {
        var order = await _db.Orders
            .Include(o => o.Items)
            .FirstOrDefaultAsync(o => o.Id == id && o.UserId == UserId);

        if (order is null) return NotFound(new { message = "Order not found." });
        if (order.Status != "Pending")
            return BadRequest(new { message = "Only pending orders can be cancelled." });

        // Restore stock
        var vegIds = order.Items.Select(i => i.VegetableId).ToList();
        var vegs   = await _db.Vegetables.Where(v => vegIds.Contains(v.Id)).ToDictionaryAsync(v => v.Id);
        foreach (var item in order.Items)
        {
            if (vegs.TryGetValue(item.VegetableId, out var veg))
                veg.Stock += item.Quantity;
        }

        order.Status    = "Cancelled";
        order.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();

        return Ok(new { message = "Order cancelled." });
    }

    private static OrderDto MapOrderSimple(Order o) =>
        new(o.Id, o.User?.Name ?? string.Empty, o.DeliveryAddress, o.Phone, o.Notes,
            o.Total, o.DeliveryFee, o.Status, o.PaymentMethod, o.PaymentStatus,
            o.Items.Select(i => new OrderItemDto(i.Id, i.VegetableId, i.VegetableName, i.Quantity, i.Price)).ToList(),
            o.CreatedAt, o.UpdatedAt);

    private async Task<OrderDto> MapOrder(Order o)
    {
        if (o.User is null) await _db.Entry(o).Reference(x => x.User).LoadAsync();
        if (!o.Items.Any()) await _db.Entry(o).Collection(x => x.Items).LoadAsync();
        return MapOrderSimple(o);
    }
}
