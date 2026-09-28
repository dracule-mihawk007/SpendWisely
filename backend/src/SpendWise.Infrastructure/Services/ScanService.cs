using Microsoft.EntityFrameworkCore;
using SpendWise.Application.DTOs;
using SpendWise.Application.Interfaces;
using SpendWise.Infrastructure.Persistence;

namespace SpendWise.Infrastructure.Services;

public class ScanService : IScanService
{
    private readonly IGeminiVisionService _gemini;
    private readonly IReceiptStorageService _storage;
    private readonly AppDbContext _context;

    public ScanService(IGeminiVisionService gemini, IReceiptStorageService storage, AppDbContext context)
    {
        _gemini = gemini;
        _storage = storage;
        _context = context;
    }

    public async Task<ScanPreviewDto> ScanAndPreviewAsync(byte[] imageBytes, string fileName, string contentType)
    {
        var uploadTask = _storage.UploadAsync(imageBytes, fileName, contentType);
        var scanTask = _gemini.ScanReceiptAsync(imageBytes, contentType);

        await Task.WhenAll(uploadTask, scanTask);

        var imageUrl = await uploadTask;
        var scan = await scanTask;

        var categories = await _context.Categories.ToListAsync();
        if (categories.Count == 0)
        {
            var defaultCat = new SpendWise.Domain.Entities.Category
            {
                Name = "General",
                MonthlyBudgetLimit = 500,
                ColorHex = "#4f46e5",
                Icon = "📁"
            };
            _context.Categories.Add(defaultCat);
            await _context.SaveChangesAsync();
            categories.Add(defaultCat);
        }

        var matched = categories.FirstOrDefault(c =>
            c.Name.Equals(scan.CategorySuggestion, StringComparison.OrdinalIgnoreCase))
            ?? categories.First();

        var targetDate = scan.Date;
        var startOfMonth = new DateTime(targetDate.Year, targetDate.Month, 1, 0, 0, 0, DateTimeKind.Utc);
        var endOfMonth = startOfMonth.AddMonths(1);

        var monthlySpent = await _context.Expenses
            .Where(e => e.CategoryId == matched.Id
                     && e.ExpenseDate >= startOfMonth
                     && e.ExpenseDate < endOfMonth)
            .SumAsync(e => (decimal?)e.TotalAmount) ?? 0m;

        var projectedSpent = monthlySpent + scan.Total;
        var budgetWarning = matched.MonthlyBudgetLimit > 0 && projectedSpent > matched.MonthlyBudgetLimit;
        var remaining = matched.MonthlyBudgetLimit - monthlySpent;

        return new ScanPreviewDto(
            scan.Merchant,
            scan.Date,
            scan.Total,
            scan.Tax,
            matched.Id,
            matched.Name,
            imageUrl,
            budgetWarning,
            monthlySpent,
            matched.MonthlyBudgetLimit,
            scan.Items
        );
    }
}
