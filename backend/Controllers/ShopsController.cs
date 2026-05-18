using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DistributionApi.Data;
using DistributionApi.DTOs;
using DistributionApi.Models;

namespace DistributionApi.Controllers;

/// <summary>Manages shops.</summary>
[ApiController]
[Route("api/shops")]
public class ShopsController(AppDbContext db) : ControllerBase
{
    /// <summary>Returns all shops, optionally filtered by route.</summary>
    [HttpGet]
    public async Task<IEnumerable<ShopResponse>> GetAll([FromQuery] int? routeId)
    {
        var q = db.Shops.Include(s => s.Route).AsQueryable();
        if (routeId.HasValue) q = q.Where(s => s.RouteId == routeId.Value);
        return await q.Select(s => new ShopResponse(
            s.Id, s.Name, s.Address, s.RouteId, s.Route.Name)).ToListAsync();
    }

    /// <summary>Creates a new shop.</summary>
    [HttpPost]
    public async Task<ActionResult<ShopResponse>> Create([FromBody] CreateShopRequest req)
    {
        // TODO: auth guard
        var shop = new Shop { Name = req.Name, Address = req.Address, RouteId = req.RouteId };
        db.Shops.Add(shop);
        await db.SaveChangesAsync();
        await db.Entry(shop).Reference(s => s.Route).LoadAsync();
        return CreatedAtAction(nameof(GetAll),
            new ShopResponse(shop.Id, shop.Name, shop.Address, shop.RouteId, shop.Route.Name));
    }

    /// <summary>Updates an existing shop.</summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<ShopResponse>> Update(int id, [FromBody] UpdateShopRequest req)
    {
        // TODO: auth guard
        var shop = await db.Shops.Include(s => s.Route).FirstOrDefaultAsync(s => s.Id == id);
        if (shop is null) return NotFound();
        shop.Name = req.Name;
        shop.Address = req.Address;
        shop.RouteId = req.RouteId;
        await db.SaveChangesAsync();
        await db.Entry(shop).Reference(s => s.Route).LoadAsync();
        return Ok(new ShopResponse(shop.Id, shop.Name, shop.Address, shop.RouteId, shop.Route.Name));
    }
}