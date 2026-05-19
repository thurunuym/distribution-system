using Microsoft.EntityFrameworkCore;
using DistributionApi.Data;
using DistributionApi.DTOs;
using DistributionApi.Models;
using Route = DistributionApi.Models.Route;

namespace DistributionApi.Services;

public class InvoiceService(AppDbContext db)
{
    public async Task<InvoiceResponse> CreateInvoiceAsync(CreateInvoiceRequest req)
    {
        await using var tx = await db.Database.BeginTransactionAsync();

        var invoice = new Invoice
        {
            Number = req.Number,
            ShopId = req.ShopId,
            Date = req.Date,
            TotalAmount = req.TotalAmount,
            Paid = req.Payments.Sum(p => p.Amount),
            Remarks = req.Remarks,
            UpdatedAt = DateTimeOffset.UtcNow
        };
        invoice.Status = invoice.Paid >= invoice.TotalAmount ? "settled" : "credit";

        db.Invoices.Add(invoice);
        await db.SaveChangesAsync();

        foreach (var payment in req.Payments)
        {
            int? chequeId = null;

            if (payment.Type == "cheque")
            {
                if (payment.Cheque is null)
                    throw new ArgumentException("Cheque details required for cheque payment.");

                var cheque = new Cheque
                {
                    InvoiceId = invoice.Id,
                    ChequeNo = payment.Cheque.ChequeNo,
                    Bank = payment.Cheque.Bank,
                    Amount = payment.Cheque.Amount,
                    DateReceived = payment.Cheque.DateReceived,
                    DueDate = payment.Cheque.DueDate,
                    Status = "pending",
                    UpdatedAt = DateTimeOffset.UtcNow
                };
                db.Cheques.Add(cheque);
                await db.SaveChangesAsync();
                chequeId = cheque.Id;
            }

            db.Payments.Add(new Payment
            {
                InvoiceId = invoice.Id,
                Amount = payment.Amount,
                Type = payment.Type,
                Date = req.Date,
                ChequeId = chequeId
            });
        }

        await db.SaveChangesAsync();
        await tx.CommitAsync();

        return await GetInvoiceByIdAsync(invoice.Id)
               ?? throw new InvalidOperationException("Invoice not found after create.");
    }

    public async Task<InvoiceResponse?> GetInvoiceByIdAsync(int id)
    {
        var inv = await db.Invoices
            .Include(i => i.Shop).ThenInclude(s => s.Route)
            .Include(i => i.Payments)
            .Include(i => i.Cheques)
            .FirstOrDefaultAsync(i => i.Id == id);

        return inv is null ? null : MapInvoice(inv);
    }

    public async Task<List<InvoiceResponse>> GetInvoicesAsync(
        DateOnly? date, int? shopId, string? status)
    {
        var q = db.Invoices
            .Include(i => i.Shop).ThenInclude(s => s.Route)
            .Include(i => i.Payments)
            .Include(i => i.Cheques)
            .AsQueryable();

        if (date.HasValue) q = q.Where(i => i.Date == date.Value);
        if (shopId.HasValue) q = q.Where(i => i.ShopId == shopId.Value);
        if (!string.IsNullOrEmpty(status)) q = q.Where(i => i.Status == status);

        var list = await q.OrderByDescending(i => i.Date).ThenByDescending(i => i.Id).ToListAsync();
        return list.Select(MapInvoice).ToList();
    }

    public async Task<InvoiceSummaryResponse> GetSummaryAsync(DateOnly date)
    {
        var invoices = await db.Invoices
            .Include(i => i.Payments)
            .Where(i => i.Date == date)
            .ToListAsync();

        return new InvoiceSummaryResponse(
            TotalInvoiced: invoices.Sum(i => i.TotalAmount),
            CashCollected: invoices.SelectMany(i => i.Payments).Where(p => p.Type == "cash").Sum(p => p.Amount),
            ChequeAmount: invoices.SelectMany(i => i.Payments).Where(p => p.Type == "cheque").Sum(p => p.Amount),
            CreditAmount: invoices.Where(i => i.Status == "credit").Sum(i => i.Due),
            TotalInvoices: invoices.Count
        );
    }

    private static InvoiceResponse MapInvoice(Invoice inv) => new(
        inv.Id, inv.Number, inv.ShopId,
        inv.Shop?.Name ?? "", inv.Shop?.Route?.Name ?? "",
        inv.Date, inv.TotalAmount, inv.Paid, inv.Due,
        inv.Status, inv.Remarks, inv.UpdatedAt,
        inv.Payments.Select(p => new PaymentResponse(p.Id, p.Amount, p.Type, p.Date, p.ChequeId)).ToList(),
        inv.Cheques.Select(c => new ChequeResponse(
            c.Id, c.InvoiceId, c.ChequeNo, c.Bank, c.Amount,
            c.DateReceived, c.DueDate, c.ClearedDate, c.Status,
            c.ReturnReason, c.UpdatedAt, inv.Number, inv.Shop?.Name)).ToList()
    );
}
