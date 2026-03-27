using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using Veggio.Api.Data;
using Veggio.Api.DTOs;
using Veggio.Api.Models;

namespace Veggio.Api.Controllers;

[ApiController]
[Route("api/vegetables")]
public class VegetablesController : ControllerBase
{
    private readonly AppDbContext _db;
    private readonly ILogger<VegetablesController> _logger;

    public VegetablesController(AppDbContext db, ILogger<VegetablesController> logger)
    {
        _db     = db;
        _logger = logger;
    }

    // GET /api/vegetables
    [HttpGet]
    public async Task<IActionResult> List(
        [FromQuery] string? search,
        [FromQuery] string? category,
        [FromQuery] bool?   featured,
        [FromQuery] decimal? maxPrice,
        [FromQuery] string  sort   = "name_asc",
        [FromQuery] int     limit  = 50,
        [FromQuery] int     offset = 0)
    {
        if (limit > 200) limit = 200;

        var q = _db.Vegetables
            .Where(v => v.IsActive)
            .AsQueryable();

        if (!string.IsNullOrWhiteSpace(search))
            q = q.Where(v => EF.Functions.ILike(v.Name, $"%{search.Trim()}%") ||
                              EF.Functions.ILike(v.Category, $"%{search.Trim()}%"));

        if (!string.IsNullOrWhiteSpace(category) && category != "all")
            q = q.Where(v => EF.Functions.ILike(v.Category, category));

        if (featured == true)
            q = q.Where(v => v.IsFeatured);

        if (maxPrice.HasValue)
            q = q.Where(v => v.Price <= maxPrice.Value);

        q = sort switch
        {
            "price_asc"  => q.OrderBy(v => v.Price).ThenBy(v => v.Name),
            "price_desc" => q.OrderByDescending(v => v.Price).ThenBy(v => v.Name),
            "name_desc"  => q.OrderByDescending(v => v.Name),
            "newest"     => q.OrderByDescending(v => v.CreatedAt),
            _            => q.OrderBy(v => v.Name),
        };

        var vegs = await q.Skip(offset).Take(limit).ToListAsync();
        return Ok(vegs.Select(MapVegetable));
    }

    // GET /api/vegetables/categories
    [HttpGet("categories")]
    public async Task<IActionResult> Categories()
    {
        var cats = await _db.Vegetables
            .Where(v => v.IsActive)
            .Select(v => v.Category)
            .Distinct()
            .OrderBy(c => c)
            .ToListAsync();
        return Ok(cats);
    }

    // GET /api/vegetables/{id}
    [HttpGet("{id:guid}")]
    public async Task<IActionResult> Get(Guid id)
    {
        var v = await _db.Vegetables.FindAsync(id);
        if (v is null || !v.IsActive) return NotFound(new { message = "Vegetable not found." });
        return Ok(MapVegetable(v));
    }

    // POST /api/vegetables  [Admin]
    [HttpPost]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Create([FromBody] CreateVegetableRequest req)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        var veg = new Vegetable
        {
            Name          = req.Name.Trim(),
            Category      = req.Category.Trim(),
            Price         = req.Price,
            OriginalPrice = req.OriginalPrice,
            Unit          = req.Unit,
            Stock         = req.Stock,
            Description   = req.Description?.Trim(),
            NutritionInfo = req.NutritionInfo?.Trim(),
            ImageUrl      = req.ImageUrl?.Trim(),
            IsOrganic     = req.IsOrganic,
            IsFeatured    = req.IsFeatured,
            Discount      = req.Discount,
        };

        _db.Vegetables.Add(veg);
        await _db.SaveChangesAsync();
        _logger.LogInformation("Admin created vegetable: {Name}", veg.Name);

        return CreatedAtAction(nameof(Get), new { id = veg.Id }, MapVegetable(veg));
    }

    // PUT /api/vegetables/{id}  [Admin]
    [HttpPut("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Update(Guid id, [FromBody] UpdateVegetableRequest req)
    {
        if (!ModelState.IsValid) return ValidationProblem(ModelState);

        var veg = await _db.Vegetables.FindAsync(id);
        if (veg is null) return NotFound(new { message = "Vegetable not found." });

        if (req.Name          is not null) veg.Name          = req.Name.Trim();
        if (req.Category      is not null) veg.Category      = req.Category.Trim();
        if (req.Price         is not null) veg.Price         = req.Price.Value;
        if (req.OriginalPrice is not null) veg.OriginalPrice = req.OriginalPrice;
        if (req.Unit          is not null) veg.Unit          = req.Unit;
        if (req.Stock         is not null) veg.Stock         = req.Stock.Value;
        if (req.Description   is not null) veg.Description   = req.Description.Trim();
        if (req.NutritionInfo is not null) veg.NutritionInfo = req.NutritionInfo.Trim();
        if (req.ImageUrl      is not null) veg.ImageUrl      = req.ImageUrl.Trim();
        if (req.IsOrganic     is not null) veg.IsOrganic     = req.IsOrganic.Value;
        if (req.IsFeatured    is not null) veg.IsFeatured    = req.IsFeatured.Value;
        if (req.Discount      is not null) veg.Discount      = req.Discount;
        veg.UpdatedAt = DateTime.UtcNow;

        await _db.SaveChangesAsync();
        return Ok(MapVegetable(veg));
    }

    // DELETE /api/vegetables/{id}  [Admin] — soft delete
    [HttpDelete("{id:guid}")]
    [Authorize(Roles = "Admin")]
    public async Task<IActionResult> Delete(Guid id)
    {
        var veg = await _db.Vegetables.FindAsync(id);
        if (veg is null) return NotFound(new { message = "Vegetable not found." });

        veg.IsActive  = false;
        veg.UpdatedAt = DateTime.UtcNow;
        await _db.SaveChangesAsync();
        _logger.LogInformation("Admin soft-deleted vegetable: {Id}", id);

        return NoContent();
    }

    private static VegetableDto MapVegetable(Vegetable v) =>
        new(v.Id, v.Name, v.Category, v.Price, v.OriginalPrice,
            v.Unit, v.Stock, v.Description, v.NutritionInfo,
            v.ImageUrl, v.IsOrganic, v.IsFeatured, v.Discount, v.CreatedAt);
}
