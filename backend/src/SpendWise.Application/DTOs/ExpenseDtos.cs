namespace SpendWise.Application.DTOs;

public record ExpenseItemDto(
    int Id,
    string Description,
    int Quantity,
    decimal UnitPrice,
    decimal TotalPrice
);

public record ExpenseDto(
    int Id,
    string MerchantName,
    DateTime ExpenseDate,
    decimal TotalAmount,
    decimal TaxAmount,
    string? ReceiptImageUrl,
    int CategoryId,
    string CategoryName,
    DateTime CreatedAt,
    List<ExpenseItemDto> Items
);

public record CreateExpenseItemDto(
    string Description,
    int Quantity,
    decimal UnitPrice,
    decimal TotalPrice
);

public record CreateExpenseDto(
    string MerchantName,
    DateTime ExpenseDate,
    decimal TotalAmount,
    decimal TaxAmount,
    string? ReceiptImageUrl,
    int CategoryId,
    List<CreateExpenseItemDto> Items
);

public record ExpenseFilterDto(
    DateTime? FromDate,
    DateTime? ToDate,
    int? CategoryId
);
