using SpendWise.Application.DTOs;

namespace SpendWise.Application.Interfaces;

public interface ICategoryService
{
    Task<List<CategoryDto>> GetAllAsync(int userId);
    Task<CategoryDto?> GetByIdAsync(int id, int userId);
    Task<CategoryDto> CreateAsync(CreateCategoryDto dto, int userId);
    Task<CategoryDto?> UpdateAsync(int id, UpdateCategoryDto dto, int userId);
    Task<bool> DeleteAsync(int id, int userId);
}
