namespace SpendWise.Domain.Entities;

public class ExpenseItem
{
    public int Id { get; set; }
    public int ExpenseId { get; set; }
    public string Description { get; set; } = string.Empty;
    public int Quantity { get; set; }
    public decimal UnitPrice { get; set; }
    public decimal TotalPrice { get; set; }

    public Expense Expense { get; set; } = null!;
}
