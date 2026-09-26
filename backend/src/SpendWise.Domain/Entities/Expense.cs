namespace SpendWise.Domain.Entities;

public class Expense
{
    public int Id { get; set; }
    public string MerchantName { get; set; } = string.Empty;
    public DateTime ExpenseDate { get; set; }
    public decimal TotalAmount { get; set; }
    public decimal TaxAmount { get; set; }
    public string? ReceiptImageUrl { get; set; }
    public int CategoryId { get; set; }
    public DateTime CreatedAt { get; set; } = DateTime.UtcNow;

    public Category Category { get; set; } = null!;
    public ICollection<ExpenseItem> Items { get; set; } = new List<ExpenseItem>();
}
