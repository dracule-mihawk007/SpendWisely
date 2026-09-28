using Microsoft.EntityFrameworkCore;
using SpendWise.Application.DTOs;
using SpendWise.Application.Interfaces;
using SpendWise.Domain.Entities;
using SpendWise.Infrastructure.Persistence;

namespace SpendWise.Infrastructure.Services;

public class CategoryService : ICategoryService
{
    private readonly AppDbContext _context;

    public CategoryService(AppDbContext context)
    {
        _context = context;
    }

    public async Task<List<CategoryDto>> GetAllAsync()
    {
        return await _context.Categories
            .Select(c => new CategoryDto(c.Id, c.Name, c.MonthlyBudgetLimit, c.ColorHex, c.Icon))
            .ToListAsync();
    }

    public async Task<CategoryDto?> GetByIdAsync(int id)
    {
        var c = await _context.Categories.FindAsync(id);
        return c is null ? null : new CategoryDto(c.Id, c.Name, c.MonthlyBudgetLimit, c.ColorHex, c.Icon);
    }

    public async Task<CategoryDto> CreateAsync(CreateCategoryDto dto)
    {
        var category = new Category
        {
            Name = dto.Name,
            MonthlyBudgetLimit = dto.MonthlyBudgetLimit,
            ColorHex = dto.ColorHex,
            Icon = dto.Icon
        };

        _context.Categories.Add(category);
        await _context.SaveChangesAsync();

        return new CategoryDto(category.Id, category.Name, category.MonthlyBudgetLimit, category.ColorHex, category.Icon);
    }

    public async Task<CategoryDto?> UpdateAsync(int id, UpdateCategoryDto dto)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category is null) return null;

        category.Name = dto.Name;
        category.MonthlyBudgetLimit = dto.MonthlyBudgetLimit;
        category.ColorHex = dto.ColorHex;
        category.Icon = dto.Icon;

        await _context.SaveChangesAsync();

        return new CategoryDto(category.Id, category.Name, category.MonthlyBudgetLimit, category.ColorHex, category.Icon);
    }

    public async Task<bool> DeleteAsync(int id)
    {
        var category = await _context.Categories.FindAsync(id);
        if (category is null) return false;

        var hasExpenses = await _context.Expenses.AnyAsync(e => e.CategoryId == id);
        if (hasExpenses)
        {
            throw new InvalidOperationException("Cannot delete category because it has active expenses.");
        }

        _context.Categories.Remove(category);
        await _context.SaveChangesAsync();
        return true;
    }
}
