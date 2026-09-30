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

    public async Task<ScanPreviewDto> ScanAndPreviewAsync(byte[] imageBytes, string fileName, string contentType, int userId)
    {
        var uploadTask = _storage.UploadAsync(imageBytes, fileName, contentType);
        var scanTask = _gemini.ScanReceiptAsync(imageBytes, contentType);

        string imageUrl;
        try
        {
            imageUrl = await uploadTask;
        }
        catch
        {
            imageUrl = string.Empty;
        }

        ReceiptScanResultDto scan;
        bool aiSuccess = true;
        string? aiNotice = null;

        try
        {
            scan = await scanTask;
        }
        catch (Exception)
        {
            aiSuccess = false;
            aiNotice = "Google Gemini AI vision is currently experiencing high demand. Your receipt was uploaded; you may enter details manually or retry scanning.";
            scan = new ReceiptScanResultDto(
                "Uploaded Receipt",
                DateTime.UtcNow,
                0m,
                0m,
                "General",
                new List<ScannedItemDto>()
            );
        }

        var categories = await _context.Categories.Where(c => c.UserId == userId).ToListAsync();
        if (categories.Count == 0)
        {
            var defaultCat = new SpendWise.Domain.Entities.Category
            {
                Name = "General",
                MonthlyBudgetLimit = 500,
                ColorHex = "#4f46e5",
                Icon = "📁",
                UserId = userId
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
                     && e.UserId == userId
                     && e.ExpenseDate >= startOfMonth
                     && e.ExpenseDate < endOfMonth)
            .SumAsync(e => (decimal?)e.TotalAmount) ?? 0m;

        var projectedSpent = monthlySpent + scan.Total;
        var budgetWarning = matched.MonthlyBudgetLimit > 0 && projectedSpent > matched.MonthlyBudgetLimit;

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
            scan.Items,
            aiSuccess,
            aiNotice
        );
    }
}
