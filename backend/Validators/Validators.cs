using FluentValidation;
using DistributionApi.DTOs;

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
        RuleForEach(x => x.Payments).ChildRules(p =>
        {
            p.RuleFor(x => x.Amount).GreaterThanOrEqualTo(0);
            p.RuleFor(x => x.Type).Must(t => t == "cash" || t == "cheque");
        });
        When(x => x.Payments.Any(p => p.Type == "cheque"), () =>
        {
            RuleFor(x => x.Cheque).NotNull().WithMessage("Cheque details required when cheque payment exists.");
            RuleFor(x => x.Cheque!.ChequeNo).NotEmpty().MaximumLength(50);
            RuleFor(x => x.Cheque!.Amount).GreaterThan(0);
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
            RuleFor(x => x.ReturnReason).NotEmpty().WithMessage("Return reason required when returning a cheque.");
        });
    }
}