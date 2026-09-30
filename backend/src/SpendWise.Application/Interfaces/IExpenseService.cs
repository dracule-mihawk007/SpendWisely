using SpendWise.Application.DTOs;

namespace SpendWise.Application.Interfaces;

public interface IExpenseService
{
    Task<List<ExpenseDto>> GetAllAsync(ExpenseFilterDto filter, int userId);
    Task<ExpenseDto?> GetByIdAsync(int id, int userId);
    Task<ExpenseDto> CreateAsync(CreateExpenseDto dto, int userId);
    Task<bool> DeleteAsync(int id, int userId);
    Task<decimal> GetMonthlyTotalByCategoryAsync(int categoryId, int year, int month, int userId);
    Task<DashboardAnalyticsDto> GetAnalyticsAsync(int? year, int? month, int userId);
    Task<byte[]> ExportExpensesCsvAsync(ExpenseFilterDto filter, int userId);
}
