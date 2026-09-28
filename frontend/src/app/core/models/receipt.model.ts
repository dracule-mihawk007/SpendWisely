export interface ScannedItemDto {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ScanPreviewDto {
  merchant: string;
  date: string;
  total: number;
  tax: number;
  suggestedCategoryId: number;
  suggestedCategoryName: string;
  receiptImageUrl?: string | null;
  budgetWarning: boolean;
  monthlySpent: number;
  monthlyBudgetLimit: number;
  items: ScannedItemDto[];
}
