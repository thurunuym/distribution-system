using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DistributionApi.Data;
using DistributionApi.DTOs;
using DistributionApi.Models;
using DistributionApi.Services;

namespace DistributionApi.Controllers;

/// <summary>Manages credits.</summary>
[ApiController]
[Route("api/credits")]
public class CreditsController(AppDbContext db) : ControllerBase
{
    /// <summary>Returns credit invoices with optional filters.</summary>
    [HttpGet]
    public async Task<IEnumerable<InvoiceResponse>> GetAll(
        [FromQuery] int? routeId,
        [FromQuery] int? agingMonths,
        [FromQuery] DateOnly? specificDate)
    {
        var q = db.Invoices
            .Include(i => i.Shop).ThenInclude(s => s.Route)
            .Include(i => i.Payments)
            .Include(i => i.Cheques)
            .Where(i => i.Status == "credit")
            .AsQueryable();

        if (routeId.HasValue)
        {
            q = q.Where(i => i.Shop.RouteId == routeId.Value);
        }

        if (specificDate.HasValue)
        {
            q = q.Where(i => i.Date == specificDate.Value);
        }

        if (agingMonths.HasValue)
        {
            var cutoffDate = DateOnly.FromDateTime(DateTime.Today).AddMonths(-agingMonths.Value);
            q = q.Where(i => i.Date <= cutoffDate);
        }

        var list = await q.OrderByDescending(i => i.Date).ThenByDescending(i => i.Id).ToListAsync();
        return list.Select(InvoiceService.MapInvoice).ToList();
    }
}
