namespace SpendWise.Application.DTOs;

public record CategoryDto(
    int Id,
    string Name,
    decimal MonthlyBudgetLimit,
    string ColorHex,
    string Icon
);

public record CreateCategoryDto(
    string Name,
    decimal MonthlyBudgetLimit,
    string ColorHex,
    string Icon
);

public record UpdateCategoryDto(
    string Name,
    decimal MonthlyBudgetLimit,
    string ColorHex,
    string Icon
);
