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
    /// <summary>Returns dashboard summary metrics for a given date.</summary>
    [HttpGet("summary")]
    public async Task<DashboardSummaryResponse> Summary([FromQuery] DateOnly? date)
    {
        var d = date ?? DateOnly.FromDateTime(DateTime.Today);

        var invoices = await db.Invoices
            .Include(i => i.Payments)
            .Where(i => i.Date == d)
            .ToListAsync();

        var chequeCount = await db.Cheques.CountAsync(c =>
            c.Status == "pending" &&
            c.DueDate.HasValue &&
            c.DueDate.Value == d);

        var totalOutstandingCredit = await db.Invoices
            .Where(i => i.Status == "credit")
            .SumAsync(i => i.TotalAmount - i.Paid);

        return new DashboardSummaryResponse(
            TotalAmount: invoices.Sum(i => i.TotalAmount),
            CashCollected: invoices.SelectMany(i => i.Payments).Where(p => p.Type == "cash").Sum(p => p.Amount),
            ChequeAmount: invoices.SelectMany(i => i.Payments).Where(p => p.Type == "cheque").Sum(p => p.Amount),
            ChequeCount: chequeCount,
            CreditAmount: invoices.Where(i => i.Status == "credit").Sum(i => i.TotalAmount - i.Paid),
            TotalOutstandingCredit: totalOutstandingCredit
        );
    }

    /// <summary>Returns pending cheques due on a given date.</summary>
    [HttpGet("cheques-due")]
    public async Task<IEnumerable<DashboardChequeDueResponse>> ChequesDue([FromQuery] DateOnly? date)
    {
        var d = date ?? DateOnly.FromDateTime(DateTime.Today);

        var cheques = await db.Cheques
            .Include(c => c.Invoice)
                .ThenInclude(i => i.Shop)
            .Where(c => c.Status == "pending" && c.DueDate.HasValue && c.DueDate.Value == d)
            .OrderBy(c => c.ChequeNo)
            .ToListAsync();

        return cheques.Select(c => new DashboardChequeDueResponse(
            Id: c.Id,
            ChequeNo: c.ChequeNo,
            Bank: c.Bank,
            ShopName: c.Invoice.Shop.Name,
            Amount: c.Amount,
            Status: c.Status
        ));
    }

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
