namespace SpendWise.Application.DTOs;

public record CategorySpendingDto(
    int CategoryId,
    string CategoryName,
    string ColorHex,
    string Icon,
    decimal TotalSpent,
    decimal BudgetLimit,
    double PercentageOfBudget
);

public record DailySpendingDto(
    string Date,
    decimal Amount
);

public record MonthlySpendingDto(
    string Month,
    int MonthNumber,
    int Year,
    decimal Amount
);

public record DashboardAnalyticsDto(
    decimal TotalSpentThisMonth,
    decimal TotalMonthlyBudget,
    decimal RemainingBudget,
    int TotalTransactions,
    int ReceiptsWithImagesCount,
    List<CategorySpendingDto> CategoryBreakdown,
    List<DailySpendingDto> DailyTrend,
    List<MonthlySpendingDto> MonthlyTrend
);
