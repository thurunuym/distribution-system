using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DistributionApi.Data;
using DistributionApi.DTOs;
using DistributionApi.Models;
using Route = DistributionApi.Models.Route;

namespace DistributionApi.Controllers;

/// <summary>Manages delivery routes.</summary>
[ApiController]
[Route("api/routes")]
public class RoutesController(AppDbContext db) : ControllerBase
{
    /// <summary>Returns all routes.</summary>
    [HttpGet]
    public async Task<IEnumerable<RouteResponse>> GetAll() =>
        await db.Routes.Select(r => new RouteResponse(r.Id, r.Name)).ToListAsync();

    /// <summary>Creates a new route.</summary>
    [HttpPost]
    [HttpPost("/api/route")]
    public async Task<ActionResult<RouteResponse>> Create([FromBody] CreateRouteRequest req)
    {
        // TODO: add auth guard — only admin can create routes
        var route = new Route { Name = req.Name };
        db.Routes.Add(route);
        await db.SaveChangesAsync();
        return CreatedAtAction(nameof(GetAll), null, new RouteResponse(route.Id, route.Name));
    }
}
