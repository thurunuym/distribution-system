namespace DistributionApi.DTOs;

// ─── Routes ───────────────────────────────────────────────────────────────────
public record RouteResponse(int Id, string Name);
public record CreateRouteRequest(string Name);

// ─── Shops ────────────────────────────────────────────────────────────────────
public record ShopResponse(int Id, string Name, string? Address, int RouteId, string RouteName);
public record CreateShopRequest(string Name, string? Address, int RouteId);
public record UpdateShopRequest(string Name, string? Address, int RouteId);

// ─── Payments ─────────────────────────────────────────────────────────────────
public record PaymentRequest(string Type, decimal Amount);
public record PaymentResponse(int Id, decimal Amount, string Type, DateOnly Date, int? ChequeId);

// ─── Cheques ──────────────────────────────────────────────────────────────────
public record ChequeRequest(
    string ChequeNo, string? Bank, decimal Amount,
    DateOnly DateReceived, DateOnly? DueDate);

public record ChequeResponse(
    int Id, int InvoiceId, string ChequeNo, string? Bank, decimal Amount,
    DateOnly DateReceived, DateOnly? DueDate, DateOnly? ClearedDate,
    string Status, string? ReturnReason, DateTimeOffset UpdatedAt,
    string? InvoiceNumber, string? ShopName);

public record UpdateChequeRequest(string Status, string? ReturnReason, DateOnly? ClearedDate);

// ─── Invoices ─────────────────────────────────────────────────────────────────
public record CreateInvoiceRequest(
    string Number, int ShopId, DateOnly Date, decimal TotalAmount, string? Remarks,
    List<PaymentRequest> Payments, ChequeRequest? Cheque);

public record UpdateInvoiceRequest(string? Remarks, string? Status);

public record InvoiceResponse(
    int Id, string Number, int ShopId, string ShopName, string RouteName,
    DateOnly Date, decimal TotalAmount, decimal Paid, decimal Due,
    string Status, string? Remarks, DateTimeOffset UpdatedAt,
    List<PaymentResponse> Payments, List<ChequeResponse> Cheques);

public record InvoiceSummaryResponse(
    decimal TotalInvoiced, decimal CashCollected, decimal ChequeAmount,
    decimal CreditAmount, int TotalInvoices);

// ─── Dashboard ────────────────────────────────────────────────────────────────
public record DashboardResponse(
    int TotalInvoices, decimal TotalAmount, decimal CashCollected,
    decimal ChequeAmount, decimal CreditAmount, int ChequesPending);