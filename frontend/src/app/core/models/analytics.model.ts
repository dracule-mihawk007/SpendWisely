export interface CategorySpendingDto {
  categoryId: number;
  categoryName: string;
  colorHex: string;
  icon: string;
  totalSpent: number;
  budgetLimit: number;
  percentageOfBudget: number;
}

export interface DailySpendingDto {
  date: string;
  amount: number;
}

export interface MonthlySpendingDto {
  month: string;
  monthNumber: number;
  year: number;
  amount: number;
}

export interface DashboardAnalyticsDto {
  totalSpentThisMonth: number;
  totalMonthlyBudget: number;
  remainingBudget: number;
  totalTransactions: number;
  receiptsWithImagesCount: number;
  categoryBreakdown: CategorySpendingDto[];
  dailyTrend: DailySpendingDto[];
  monthlyTrend: MonthlySpendingDto[];
}
