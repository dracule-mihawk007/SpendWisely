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
            ExpenseDate = dto.ExpenseDate,
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
