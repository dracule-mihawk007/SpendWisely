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

        var matched = categories.FirstOrDefault(c =>
            c.Name.Equals(scan.CategorySuggestion, StringComparison.OrdinalIgnoreCase))
            ?? categories.First();

        var now = DateTime.UtcNow;
        var monthlySpent = await _context.Expenses
            .Where(e => e.CategoryId == matched.Id
                     && e.ExpenseDate.Year == now.Year
                     && e.ExpenseDate.Month == now.Month)
            .SumAsync(e => e.TotalAmount);

        var projectedSpent = monthlySpent + scan.Total;
        var budgetWarning = projectedSpent > matched.MonthlyBudgetLimit;
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
