namespace SpendWise.Domain.Entities;

public class Category
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public decimal MonthlyBudgetLimit { get; set; }
    public string ColorHex { get; set; } = string.Empty;
    public string Icon { get; set; } = string.Empty;

    public int UserId { get; set; }
    public AppUser User { get; set; } = null!;

    public ICollection<Expense> Expenses { get; set; } = new List<Expense>();
}
