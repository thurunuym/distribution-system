using FluentValidation;
using FluentValidation.AspNetCore;
using Microsoft.EntityFrameworkCore;
using DistributionApi.Data;
using DistributionApi.Services;
using DistributionApi.Validators;


var builder = WebApplication.CreateBuilder(args);

// ─── Database ──────────────────────────────────────────────────────────────────
builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(
        builder.Configuration.GetConnectionString("DefaultConnection"),
        npgsql => npgsql.EnableRetryOnFailure(
            maxRetryCount: 5,
            maxRetryDelay: TimeSpan.FromSeconds(10),
            errorCodesToAdd: null
        )
    ));

// ─── Services ─────────────────────────────────────────────────────────────────
builder.Services.AddScoped<InvoiceService>();
builder.Services.AddScoped<ChequeService>();

// ─── FluentValidation ─────────────────────────────────────────────────────────
builder.Services.AddFluentValidationAutoValidation();
builder.Services.AddValidatorsFromAssemblyContaining<CreateInvoiceValidator>();

// ─── Controllers ──────────────────────────────────────────────────────────────
builder.Services.AddControllers()
    .AddJsonOptions(o =>
    {
        o.JsonSerializerOptions.PropertyNamingPolicy =
            System.Text.Json.JsonNamingPolicy.CamelCase;
    });

// ─── Swagger ──────────────────────────────────────────────────────────────────
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();

// ─── CORS ─────────────────────────────────────────────────────────────────────
builder.Services.AddCors(options =>
{
    options.AddDefaultPolicy(policy =>
        policy.WithOrigins("http://localhost:3000")
              .AllowAnyHeader()
              .AllowAnyMethod());
});

// ─── Problem Details ──────────────────────────────────────────────────────────
builder.Services.AddProblemDetails();

var app = builder.Build();

// ─── Database Migration ────────────────────────────────────────────────────────
try
{
    using (var scope = app.Services.CreateScope())
    {
        var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
        await db.Database.MigrateAsync();
    }
}
catch (Exception ex)
{
    Console.WriteLine($"Database migration failed: {ex.Message}");
}

app.UseExceptionHandler();
app.UseStatusCodePages();

// Always enable Swagger for development and testing
app.UseSwagger();
app.UseSwaggerUI(c =>
{
    c.SwaggerEndpoint("/swagger/v1/swagger.json", "Distribution Agency Invoice Tracker API");
});

app.UseCors();
app.MapControllers();

app.Run();