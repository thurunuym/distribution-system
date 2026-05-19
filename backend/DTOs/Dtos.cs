using System.Text.Json.Serialization;

namespace DistributionApi.DTOs;

public record RouteResponse(int Id, string Name);

public record CreateRouteRequest(string Name);

public record ShopResponse(int Id, string Name, string? Address, int RouteId, string RouteName);

public record CreateShopRequest(string Name, string? Address, int RouteId);

public record UpdateShopRequest(string Name, string? Address, int RouteId);

public record ChequeRequest(
    string ChequeNo,
    string? Bank,
    decimal Amount,
    DateOnly DateReceived,
    DateOnly? DueDate
);

public record PaymentRequest(
    string Type,
    decimal Amount,
    ChequeRequest? Cheque
);

public record PaymentResponse(int Id, decimal Amount, string Type, DateOnly Date, int? ChequeId);

public record ChequeResponse(
    int Id,
    int InvoiceId,
    string ChequeNo,
    string? Bank,
    decimal Amount,
    DateOnly DateReceived,
    DateOnly? DueDate,
    DateOnly? ClearedDate,
    string Status,
    string? ReturnReason,
    DateTimeOffset UpdatedAt,
    string? InvoiceNumber,
    string? ShopName
);

public record UpdateChequeRequest(string Status, string? ReturnReason, DateOnly? ClearedDate);

public record CreateInvoiceRequest(
    string Number,
    int ShopId,
    DateOnly Date,
    decimal TotalAmount,
    string? Remarks,
    List<PaymentRequest> Payments
);

public record UpdateInvoiceRequest(string? Remarks, string? Status);

public record InvoiceResponse(
    int Id,
    string Number,
    int ShopId,
    string ShopName,
    string RouteName,
    DateOnly Date,
    decimal TotalAmount,
    decimal Paid,
    decimal Due,
    string Status,
    string? Remarks,
    DateTimeOffset UpdatedAt,
    List<PaymentResponse> Payments,
    List<ChequeResponse> Cheques
);

public record InvoiceSummaryResponse(
    decimal TotalInvoiced,
    decimal CashCollected,
    decimal ChequeAmount,
    decimal CreditAmount,
    int TotalInvoices
);

public record DashboardResponse(
    int TotalInvoices,
    decimal TotalAmount,
    decimal CashCollected,
    decimal ChequeAmount,
    decimal CreditAmount,
    int ChequesPending
);

public record DashboardSummaryResponse(
    [property: JsonPropertyName("totalAmount")] decimal TotalAmount,
    [property: JsonPropertyName("cashCollected")] decimal CashCollected,
    [property: JsonPropertyName("chequeAmount")] decimal ChequeAmount,
    [property: JsonPropertyName("chequeCount")] int ChequeCount,
    [property: JsonPropertyName("creditAmount")] decimal CreditAmount,
    [property: JsonPropertyName("totalOutstandingCredit")] decimal TotalOutstandingCredit
);

public record DashboardChequeDueResponse(
    [property: JsonPropertyName("id")] int Id,
    [property: JsonPropertyName("cheque_no")] string ChequeNo,
    [property: JsonPropertyName("bank")] string? Bank,
    [property: JsonPropertyName("shop_name")] string ShopName,
    [property: JsonPropertyName("amount")] decimal Amount,
    [property: JsonPropertyName("status")] string Status
);
