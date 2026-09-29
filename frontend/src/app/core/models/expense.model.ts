export interface ExpenseItemDto {
  id: number;
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface ExpenseDto {
  id: number;
  merchantName: string;
  expenseDate: string;
  totalAmount: number;
  taxAmount: number;
  receiptImageUrl?: string | null;
  categoryId: number;
  categoryName: string;
  createdAt: string;
  items: ExpenseItemDto[];
}

export interface CreateExpenseItemDto {
  description: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
}

export interface CreateExpenseDto {
  merchantName: string;
  expenseDate: string;
  totalAmount: number;
  taxAmount: number;
  receiptImageUrl?: string | null;
  categoryId: number;
  items: CreateExpenseItemDto[];
}

export interface ExpenseFilterDto {
  fromDate?: string | null;
  toDate?: string | null;
  categoryId?: number | null;
}
