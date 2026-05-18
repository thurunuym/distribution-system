using Microsoft.EntityFrameworkCore;
using DistributionApi.Data;
using DistributionApi.DTOs;
using DistributionApi.Models;

namespace DistributionApi.Services;

public class ChequeService(AppDbContext db)
{
    public async Task<List<ChequeResponse>> GetChequesAsync(string? status)
    {
        var q = db.Cheques
            .Include(c => c.Invoice).ThenInclude(i => i.Shop)
            .AsQueryable();

        if (!string.IsNullOrEmpty(status))
            q = q.Where(c => c.Status == status);

        var list = await q.OrderByDescending(c => c.DueDate).ToListAsync();
        return list.Select(c => new ChequeResponse(
            c.Id, c.InvoiceId, c.ChequeNo, c.Bank, c.Amount,
            c.DateReceived, c.DueDate, c.ClearedDate, c.Status,
            c.ReturnReason, c.UpdatedAt,
            c.Invoice?.Number, c.Invoice?.Shop?.Name)).ToList();
    }

    public async Task<ChequeResponse?> UpdateChequeAsync(int id, UpdateChequeRequest req)
    {
        var cheque = await db.Cheques
            .Include(c => c.Invoice).ThenInclude(i => i.Shop)
            .FirstOrDefaultAsync(c => c.Id == id);

        if (cheque is null) return null;

        cheque.Status = req.Status;
        if (req.Status == "returned") cheque.ReturnReason = req.ReturnReason;
        if (req.Status == "paid") cheque.ClearedDate = req.ClearedDate ?? DateOnly.FromDateTime(DateTime.Today);
        cheque.UpdatedAt = DateTimeOffset.UtcNow;

        await db.SaveChangesAsync();

        return new ChequeResponse(
            cheque.Id, cheque.InvoiceId, cheque.ChequeNo, cheque.Bank, cheque.Amount,
            cheque.DateReceived, cheque.DueDate, cheque.ClearedDate, cheque.Status,
            cheque.ReturnReason, cheque.UpdatedAt,
            cheque.Invoice?.Number, cheque.Invoice?.Shop?.Name);
    }
}