using System.Globalization;
using System.Text;
using Microsoft.EntityFrameworkCore;
using SpendWise.Application.DTOs;
using SpendWise.Application.Interfaces;
using SpendWise.Domain.Entities;
using SpendWise.Infrastructure.Persistence;

namespace SpendWise.Infrastructure.Services;

public class ExpenseService : IExpenseService
{
    private readonly AppDbContext _context;

    public ExpenseService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<ExpenseDto>> GetAllAsync(ExpenseFilterDto filter)
    {
        var query = _context.Expenses
            .Include(e => e.Category)
            .Include(e => e.Items)
            .AsQueryable();

        if (filter.FromDate.HasValue)
            query = query.Where(e => e.ExpenseDate >= filter.FromDate.Value);

        if (filter.ToDate.HasValue)
        {
            var endOfDay = filter.ToDate.Value.Date.AddDays(1).AddTicks(-1);
            query = query.Where(e => e.ExpenseDate <= endOfDay);
        }

        if (filter.CategoryId.HasValue)
            query = query.Where(e => e.CategoryId == filter.CategoryId.Value);

        var list = await query
            .OrderByDescending(e => e.ExpenseDate)
            .ToListAsync();

        return list.Select(MapToDto).ToList();
    }

    public async Task<ExpenseDto?> GetByIdAsync(int id)
    {
        var expense = await _context.Expenses
            .Include(e => e.Category)
            .Include(e => e.Items)
            .FirstOrDefaultAsync(e => e.Id == id);

        return expense is null ? null : MapToDto(expense);
    }

    public async Task<ExpenseDto> CreateAsync(CreateExpenseDto dto)
    {
        var expense = new Expense
        {
            MerchantName = dto.MerchantName,
            ExpenseDate = DateTime.SpecifyKind(dto.ExpenseDate, DateTimeKind.Utc),
            TotalAmount = dto.TotalAmount,
            TaxAmount = dto.TaxAmount,
            ReceiptImageUrl = dto.ReceiptImageUrl,
            CategoryId = dto.CategoryId,
            CreatedAt = DateTime.UtcNow,
            Items = dto.Items.Select(i => new ExpenseItem
            {
                Description = i.Description,
                Quantity = i.Quantity,
                UnitPrice = i.UnitPrice,
                TotalPrice = i.TotalPrice
            }).ToList()
        };

        _context.Expenses.Add(expense);
        await _context.SaveChangesAsync();

        await _context.Entry(expense).Reference(e => e.Category).LoadAsync();

        return MapToDto(expense);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var expense = await _context.Expenses.FindAsync(id);
        if (expense is null) return false;

        _context.Expenses.Remove(expense);
        await _context.SaveChangesAsync();
        return true;
    }

    public async Task<decimal> GetMonthlyTotalByCategoryAsync(int categoryId, int year, int month)
    {
        var start = new DateTime(year, month, 1, 0, 0, 0, DateTimeKind.Utc);
        var end = start.AddMonths(1);

        return await _context.Expenses
            .Where(e => e.CategoryId == categoryId
                     && e.ExpenseDate >= start
                     && e.ExpenseDate < end)
            .SumAsync(e => (decimal?)e.TotalAmount) ?? 0m;
    }

    public async Task<DashboardAnalyticsDto> GetAnalyticsAsync(int? year, int? month)
    {
        var now = DateTime.UtcNow;
        var targetYear = year ?? now.Year;
        var targetMonth = month ?? now.Month;

        var startOfMonth = new DateTime(targetYear, targetMonth, 1, 0, 0, 0, DateTimeKind.Utc);
        var endOfMonth = startOfMonth.AddMonths(1);

        var categories = await _context.Categories.AsNoTracking().ToListAsync();

        var monthExpenses = await _context.Expenses
            .AsNoTracking()
            .Where(e => e.ExpenseDate >= startOfMonth && e.ExpenseDate < endOfMonth)
            .ToListAsync();

        var sixMonthsAgo = startOfMonth.AddMonths(-5);
        var trendExpenses = await _context.Expenses
            .AsNoTracking()
            .Where(e => e.ExpenseDate >= sixMonthsAgo && e.ExpenseDate < endOfMonth)
            .ToListAsync();

        var totalSpentThisMonth = monthExpenses.Sum(e => e.TotalAmount);
        var totalMonthlyBudget = categories.Sum(c => c.MonthlyBudgetLimit);
        var remainingBudget = totalMonthlyBudget - totalSpentThisMonth;
        var totalTransactions = monthExpenses.Count;
        var receiptsWithImagesCount = monthExpenses.Count(e => !string.IsNullOrEmpty(e.ReceiptImageUrl));

        var categoryBreakdown = categories.Select(c =>
        {
            var spent = monthExpenses.Where(e => e.CategoryId == c.Id).Sum(e => e.TotalAmount);
            var pct = c.MonthlyBudgetLimit > 0 ? (double)(spent / c.MonthlyBudgetLimit * 100) : 0;
            return new CategorySpendingDto(c.Id, c.Name, c.ColorHex, c.Icon, spent, c.MonthlyBudgetLimit, Math.Round(pct, 1));
        }).OrderByDescending(c => c.TotalSpent).ToList();

        var dailyTrend = monthExpenses
            .GroupBy(e => e.ExpenseDate.ToString("yyyy-MM-dd"))
            .Select(g => new DailySpendingDto(g.Key, g.Sum(e => e.TotalAmount)))
            .OrderBy(d => d.Date)
            .ToList();

        var monthlyTrend = new List<MonthlySpendingDto>();
        for (int i = 0; i < 6; i++)
        {
            var mStart = sixMonthsAgo.AddMonths(i);
            var mEnd = mStart.AddMonths(1);
            var sum = trendExpenses
                .Where(e => e.ExpenseDate >= mStart && e.ExpenseDate < mEnd)
                .Sum(e => e.TotalAmount);

            monthlyTrend.Add(new MonthlySpendingDto(
                mStart.ToString("MMM", CultureInfo.InvariantCulture),
                mStart.Month,
                mStart.Year,
                sum
            ));
        }

        return new DashboardAnalyticsDto(
            totalSpentThisMonth,
            totalMonthlyBudget,
            remainingBudget,
            totalTransactions,
            receiptsWithImagesCount,
            categoryBreakdown,
            dailyTrend,
            monthlyTrend
        );
    }

    public async Task<byte[]> ExportExpensesCsvAsync(ExpenseFilterDto filter)
    {
        var expenses = await GetAllAsync(filter);
        var sb = new StringBuilder();

        sb.AppendLine("Date,Merchant,Category,Items Count,Tax,Total,Receipt Image");

        foreach (var e in expenses)
        {
            var dateStr = e.ExpenseDate.ToString("yyyy-MM-dd", CultureInfo.InvariantCulture);
            var merchant = EscapeCsvField(e.MerchantName);
            var category = EscapeCsvField(e.CategoryName);
            var itemsCount = e.Items?.Count ?? 0;
            var tax = e.TaxAmount.ToString("F2", CultureInfo.InvariantCulture);
            var total = e.TotalAmount.ToString("F2", CultureInfo.InvariantCulture);
            var receipt = EscapeCsvField(e.ReceiptImageUrl ?? string.Empty);

            sb.AppendLine($"{dateStr},{merchant},{category},{itemsCount},{tax},{total},{receipt}");
        }

        return Encoding.UTF8.GetBytes(sb.ToString());
    }

    private static string EscapeCsvField(string field)
    {
        if (string.IsNullOrEmpty(field)) return string.Empty;
        if (field.Contains(',') || field.Contains('"') || field.Contains('\n') || field.Contains('\r'))
        {
            return $"\"{field.Replace("\"", "\"\"")}\"";
        }
        return field;
    }

    private static ExpenseDto MapToDto(Expense e) => new(
        e.Id,
        e.MerchantName,
        e.ExpenseDate,
        e.TotalAmount,
        e.TaxAmount,
        e.ReceiptImageUrl,
        e.CategoryId,
        e.Category?.Name ?? "Uncategorized",
        e.CreatedAt,
        e.Items.Select(i => new ExpenseItemDto(i.Id, i.Description, i.Quantity, i.UnitPrice, i.TotalPrice)).ToList()
    );
}
