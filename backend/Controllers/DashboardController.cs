using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DistributionApi.Data;
using DistributionApi.DTOs;

namespace DistributionApi.Controllers;

/// <summary>Provides dashboard / summary data.</summary>
[ApiController]
[Route("api/dashboard")]
public class DashboardController(AppDbContext db) : ControllerBase
{
    /// <summary>Returns key metrics for a given date.</summary>
    [HttpGet("daily")]
    public async Task<DashboardResponse> Daily([FromQuery] DateOnly? date)
    {
        var d = date ?? DateOnly.FromDateTime(DateTime.Today);

        var invoices = await db.Invoices
            .Include(i => i.Payments)
            .Where(i => i.Date == d)
            .ToListAsync();

        var chequesPending = await db.Cheques.CountAsync(c => c.Status == "pending");

        return new DashboardResponse(
            TotalInvoices: invoices.Count,
            TotalAmount: invoices.Sum(i => i.TotalAmount),
            CashCollected: invoices.SelectMany(i => i.Payments).Where(p => p.Type == "cash").Sum(p => p.Amount),
            ChequeAmount: invoices.SelectMany(i => i.Payments).Where(p => p.Type == "cheque").Sum(p => p.Amount),
            CreditAmount: invoices.Where(i => i.Status == "credit").Sum(i => i.TotalAmount - i.Paid),
            ChequesPending: chequesPending
        );
    }
}