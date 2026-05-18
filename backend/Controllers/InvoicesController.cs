using Microsoft.AspNetCore.Mvc;
using Microsoft.EntityFrameworkCore;
using DistributionApi.Data;
using DistributionApi.DTOs;
using DistributionApi.Services;

namespace DistributionApi.Controllers;

/// <summary>Manages invoices.</summary>
[ApiController]
[Route("api/invoices")]
public class InvoicesController(InvoiceService svc, AppDbContext db) : ControllerBase
{
    /// <summary>Returns invoices with optional filters.</summary>
    [HttpGet]
    public async Task<IEnumerable<InvoiceResponse>> GetAll(
        [FromQuery] DateOnly? date,
        [FromQuery] int? shopId,
        [FromQuery] string? status) =>
        await svc.GetInvoicesAsync(date, shopId, status);

    /// <summary>Returns a single invoice with payments and cheques.</summary>
    [HttpGet("{id}")]
    public async Task<ActionResult<InvoiceResponse>> GetById(int id)
    {
        var result = await svc.GetInvoiceByIdAsync(id);
        return result is null ? NotFound() : Ok(result);
    }

    /// <summary>Returns daily summary totals for a given date.</summary>
    [HttpGet("summary")]
    public async Task<InvoiceSummaryResponse> GetSummary([FromQuery] DateOnly? date) =>
        await svc.GetSummaryAsync(date ?? DateOnly.FromDateTime(DateTime.Today));

    /// <summary>Creates an invoice with payments and optional cheque atomically.</summary>
    [HttpPost]
    public async Task<ActionResult<InvoiceResponse>> Create([FromBody] CreateInvoiceRequest req)
    {
        // TODO: auth guard
        var result = await svc.CreateInvoiceAsync(req);
        return CreatedAtAction(nameof(GetById), new { id = result.Id }, result);
    }

    /// <summary>Updates invoice remarks or status.</summary>
    [HttpPut("{id}")]
    public async Task<ActionResult<InvoiceResponse>> Update(int id, [FromBody] UpdateInvoiceRequest req)
    {
        // TODO: auth guard
        var invoice = await db.Invoices.FindAsync(id);
        if (invoice is null) return NotFound();
        if (req.Remarks is not null) invoice.Remarks = req.Remarks;
        if (req.Status is not null) invoice.Status = req.Status;
        await db.SaveChangesAsync();
        return Ok(await svc.GetInvoiceByIdAsync(id));
    }
}