using Microsoft.EntityFrameworkCore;
using SpendWise.Domain.Entities;

namespace SpendWise.Infrastructure.Persistence;

public class AppDbContext : DbContext
{
    public AppDbContext(DbContextOptions<AppDbContext> options) : base(options) { }

    public DbSet<Category> Categories => Set<Category>();
    public DbSet<Expense> Expenses => Set<Expense>();
    public DbSet<ExpenseItem> ExpenseItems => Set<ExpenseItem>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Category>(entity =>
        {
            entity.HasKey(c => c.Id);
            entity.Property(c => c.Name).IsRequired().HasMaxLength(100);
            entity.Property(c => c.ColorHex).IsRequired().HasMaxLength(7);
            entity.Property(c => c.Icon).IsRequired().HasMaxLength(50);
            entity.Property(c => c.MonthlyBudgetLimit).HasColumnType("decimal(18,2)");
        });

        modelBuilder.Entity<Expense>(entity =>
        {
            entity.HasKey(e => e.Id);
            entity.Property(e => e.MerchantName).IsRequired().HasMaxLength(200);
            entity.Property(e => e.TotalAmount).HasColumnType("decimal(18,2)");
            entity.Property(e => e.TaxAmount).HasColumnType("decimal(18,2)");
            entity.HasOne(e => e.Category)
                  .WithMany(c => c.Expenses)
                  .HasForeignKey(e => e.CategoryId)
                  .OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<ExpenseItem>(entity =>
        {
            entity.HasKey(i => i.Id);
            entity.Property(i => i.Description).IsRequired().HasMaxLength(300);
            entity.Property(i => i.UnitPrice).HasColumnType("decimal(18,2)");
            entity.Property(i => i.TotalPrice).HasColumnType("decimal(18,2)");
            entity.HasOne(i => i.Expense)
                  .WithMany(e => e.Items)
                  .HasForeignKey(i => i.ExpenseId)
                  .OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<Category>().HasData(
            new Category { Id = 1, Name = "Dining", MonthlyBudgetLimit = 500, ColorHex = "#FF6B6B", Icon = "restaurant" },
            new Category { Id = 2, Name = "Groceries", MonthlyBudgetLimit = 800, ColorHex = "#51CF66", Icon = "shopping_cart" },
            new Category { Id = 3, Name = "Travel", MonthlyBudgetLimit = 1500, ColorHex = "#339AF0", Icon = "flight" },
            new Category { Id = 4, Name = "Utilities", MonthlyBudgetLimit = 300, ColorHex = "#F59F00", Icon = "bolt" },
            new Category { Id = 5, Name = "Electronics", MonthlyBudgetLimit = 1000, ColorHex = "#845EF7", Icon = "devices" }
        );
    }
}
