namespace SpendWise.Application.DTOs;

public record ScannedItemDto(
    string Description,
    int Quantity,
    decimal UnitPrice,
    decimal TotalPrice
);

public record ReceiptScanResultDto(
    string Merchant,
    DateTime Date,
    decimal Total,
    decimal Tax,
    string CategorySuggestion,
    List<ScannedItemDto> Items
);

public record ScanPreviewDto(
    string Merchant,
    DateTime Date,
    decimal Total,
    decimal Tax,
    int SuggestedCategoryId,
    string SuggestedCategoryName,
    string? ReceiptImageUrl,
    bool BudgetWarning,
    decimal MonthlySpent,
    decimal MonthlyBudgetLimit,
    List<ScannedItemDto> Items
);
