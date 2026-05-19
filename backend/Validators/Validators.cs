using DistributionApi.DTOs;
using FluentValidation;

namespace DistributionApi.Validators;

public class CreateRouteValidator : AbstractValidator<CreateRouteRequest>
{
    public CreateRouteValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(100);
    }
}

public class CreateShopValidator : AbstractValidator<CreateShopRequest>
{
    public CreateShopValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
        RuleFor(x => x.RouteId).GreaterThan(0);
    }
}

public class UpdateShopValidator : AbstractValidator<UpdateShopRequest>
{
    public UpdateShopValidator()
    {
        RuleFor(x => x.Name).NotEmpty().MaximumLength(150);
        RuleFor(x => x.RouteId).GreaterThan(0);
    }
}

/// <summary>
/// Isolated validator for Cheque details to safely prevent NullReferenceExceptions 
/// when processing non-cheque payment options.
/// </summary>
public class ChequeRequestValidator : AbstractValidator<ChequeRequest>
{
    public ChequeRequestValidator()
    {
        RuleFor(x => x.ChequeNo).NotEmpty().MaximumLength(50);
        RuleFor(x => x.Amount).GreaterThan(0).WithMessage("Cheque face amount must be greater than 0.");
        RuleFor(x => x.DateReceived).NotEmpty().WithMessage("Date received is required.");
    }
}

public class CreateInvoiceValidator : AbstractValidator<CreateInvoiceRequest>
{
    public CreateInvoiceValidator()
    {
        RuleFor(x => x.Number).NotEmpty().MaximumLength(50);
        RuleFor(x => x.ShopId).GreaterThan(0);
        RuleFor(x => x.TotalAmount).GreaterThan(0);
        RuleFor(x => x.Payments).NotNull();

        RuleFor(x => x.Payments)
            .Must((req, payments) => payments.Sum(p => p.Amount) <= req.TotalAmount)
            .WithMessage("Sum of payments cannot exceed total amount.");

        RuleForEach(x => x.Payments).ChildRules(payment =>
        {
            payment.RuleFor(x => x.Amount).GreaterThan(0)
                .WithMessage("Payment amount must be greater than 0.");

            payment.RuleFor(x => x.Type)
                .Must(type => string.Equals(type, "cash", StringComparison.OrdinalIgnoreCase) || 
                              string.Equals(type, "cheque", StringComparison.OrdinalIgnoreCase))
                .WithMessage("Payment type must be 'cash' or 'cheque'.");

            // --- CHEQUE TYPE RULES ---
            payment.When(x => string.Equals(x.Type, "cheque", StringComparison.OrdinalIgnoreCase), () =>
            {
                payment.RuleFor(x => x.Cheque).NotNull()
                    .WithMessage("Cheque details required for cheque payment.");

                // Validate individual properties cleanly without path compilation side-effects
                payment.RuleFor(x => x.Cheque)
                    .SetValidator(new ChequeRequestValidator()!)
                    .When(x => x.Cheque != null);

                // Safe structural equality matching using top-level element reference
                payment.RuleFor(x => x)
                    .Must(x => x.Cheque != null && x.Cheque.Amount == x.Amount)
                    .WithMessage("Cheque amount must match the payment amount.")
                    .When(x => x.Cheque != null);
            });

            // --- CASH TYPE RULES ---
            payment.When(x => string.Equals(x.Type, "cash", StringComparison.OrdinalIgnoreCase), () =>
            {
                payment.RuleFor(x => x.Cheque).Null()
                    .WithMessage("Cash payment should not include cheque details.");
            });
        });
    }
}

public class UpdateChequeValidator : AbstractValidator<UpdateChequeRequest>
{
    public UpdateChequeValidator()
    {
        RuleFor(x => x.Status).Must(s => s == "pending" || s == "paid" || s == "returned")
            .WithMessage("Status must be pending, paid, or returned.");

        When(x => x.Status == "returned", () =>
        {
            RuleFor(x => x.ReturnReason)
                .NotEmpty()
                .WithMessage("Return reason required when returning a cheque.");
        });
    }
}