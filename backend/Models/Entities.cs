using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;

namespace DistributionApi.Models;

public class Route
{
    public int Id { get; set; }
    [MaxLength(100)] public string Name { get; set; } = string.Empty;
    public ICollection<Shop> Shops { get; set; } = [];
}

public class Shop
{
    public int Id { get; set; }
    [MaxLength(150)] public string Name { get; set; } = string.Empty;
    public string? Address { get; set; }
    public int RouteId { get; set; }
    public Route Route { get; set; } = null!;
    public ICollection<Invoice> Invoices { get; set; } = [];
}

public enum InvoiceStatus { Settled, Credit }

public class Invoice
{
    public int Id { get; set; }
    [MaxLength(50)] public string Number { get; set; } = string.Empty;
    public int ShopId { get; set; }
    public DateOnly Date { get; set; }
    [Column(TypeName = "numeric(12,2)")] public decimal TotalAmount { get; set; }
    [Column(TypeName = "numeric(12,2)")] public decimal Paid { get; set; }
    [MaxLength(10)] public string Status { get; set; } = "credit";
    public string? Remarks { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    [NotMapped] public decimal Due => TotalAmount - Paid;

    public Shop Shop { get; set; } = null!;
    public ICollection<Payment> Payments { get; set; } = [];
    public ICollection<Cheque> Cheques { get; set; } = [];
}

public enum PaymentType { Cash, Cheque }

public class Payment
{
    public int Id { get; set; }
    public int InvoiceId { get; set; }
    [Column(TypeName = "numeric(12,2)")] public decimal Amount { get; set; }
    [MaxLength(10)] public string Type { get; set; } = string.Empty;
    public DateOnly Date { get; set; }
    public int? ChequeId { get; set; }

    public Invoice Invoice { get; set; } = null!;
    public Cheque? Cheque { get; set; }
}

public enum ChequeStatus { Pending, Paid, Returned }

public class Cheque
{
    public int Id { get; set; }
    public int InvoiceId { get; set; }
    [MaxLength(50)] public string ChequeNo { get; set; } = string.Empty;
    [MaxLength(100)] public string? Bank { get; set; }
    [Column(TypeName = "numeric(12,2)")] public decimal Amount { get; set; }
    public DateOnly DateReceived { get; set; }
    public DateOnly? DueDate { get; set; }
    public DateOnly? ClearedDate { get; set; }
    [MaxLength(10)] public string Status { get; set; } = "pending";
    public string? ReturnReason { get; set; }
    public DateTimeOffset UpdatedAt { get; set; }

    public Invoice Invoice { get; set; } = null!;
    public ICollection<Payment> Payments { get; set; } = [];
}