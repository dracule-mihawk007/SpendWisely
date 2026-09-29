using SpendWise.Application.DTOs;

namespace SpendWise.Application.Interfaces;

public interface IExpenseService
{
    Task<List<ExpenseDto>> GetAllAsync(ExpenseFilterDto filter);
    Task<ExpenseDto?> GetByIdAsync(int id);
    Task<ExpenseDto> CreateAsync(CreateExpenseDto dto);
    Task<bool> DeleteAsync(int id);
    Task<decimal> GetMonthlyTotalByCategoryAsync(int categoryId, int year, int month);
    Task<DashboardAnalyticsDto> GetAnalyticsAsync(int? year, int? month);
    Task<byte[]> ExportExpensesCsvAsync(ExpenseFilterDto filter);
}

