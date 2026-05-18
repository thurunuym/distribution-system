using Microsoft.EntityFrameworkCore;
using DistributionApi.Models;
using Route = DistributionApi.Models.Route;

using System.Diagnostics.CodeAnalysis;

namespace DistributionApi.Data;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options)
        : base(options)
    {
    }

    public DbSet<Route> Routes { get; set; }
    public DbSet<Shop> Shops { get; set; }
    public DbSet<Invoice> Invoices { get; set; }
    public DbSet<Payment> Payments { get; set; }
    public DbSet<Cheque> Cheques { get; set; }

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        base.OnModelCreating(modelBuilder);

        // Configure relationships
        modelBuilder.Entity<Shop>()
            .HasOne(s => s.Route)
            .WithMany(r => r.Shops)
            .HasForeignKey(s => s.RouteId);

        modelBuilder.Entity<Invoice>()
            .HasOne(i => i.Shop)
            .WithMany(s => s.Invoices)
            .HasForeignKey(i => i.ShopId);

        modelBuilder.Entity<Payment>()
            .HasOne(p => p.Invoice)
            .WithMany(i => i.Payments)
            .HasForeignKey(p => p.InvoiceId)
            .OnDelete(DeleteBehavior.Cascade);

        modelBuilder.Entity<Cheque>()
            .HasOne(c => c.Invoice)
            .WithMany(i => i.Cheques)
            .HasForeignKey(c => c.InvoiceId)
            .OnDelete(DeleteBehavior.Cascade);

        // Decimal precision
        modelBuilder.Entity<Invoice>()
            .Property(i => i.TotalAmount)
            .HasPrecision(18, 2);

        modelBuilder.Entity<Payment>()
            .Property(p => p.Amount)
            .HasPrecision(18, 2);

        modelBuilder.Entity<Cheque>()
            .Property(c => c.Amount)
            .HasPrecision(18, 2);
    }
}
