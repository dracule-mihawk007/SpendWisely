import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { ExpenseService } from '../../core/services/expense.service';
import { CategoryService } from '../../core/services/category.service';
import { NotificationService } from '../../core/services/notification.service';
import { ExpenseDto, CreateExpenseDto, CreateExpenseItemDto } from '../../core/models/expense.model';
import { formatCategoryIcon } from '../../core/utils/icon.utils';

export type SortField = 'date' | 'amount' | 'merchant';
export type SortDirection = 'asc' | 'desc';

@Component({
  selector: 'app-expense-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './expense-list.component.html',
  styleUrls: ['./expense-list.component.css']
})
export class ExpenseListComponent implements OnInit {
  readonly expenseService = inject(ExpenseService);
  readonly categoryService = inject(CategoryService);
  private readonly notificationService = inject(NotificationService);

  readonly searchQuery = signal<string>('');
  filterCategoryId: number | null = null;
  filterFromDate: string | null = null;
  filterToDate: string | null = null;

  readonly sortField = signal<SortField>('date');
  readonly sortDirection = signal<SortDirection>('desc');
  currentSortOption = 'date-desc';

  readonly isExporting = signal<boolean>(false);
  readonly expandedExpenseIds = signal<Set<number>>(new Set());
  readonly activeReceiptUrl = signal<string | null>(null);

  readonly isAddModalOpen = signal<boolean>(false);
  newMerchant = '';
  newDate = new Date().toISOString().substring(0, 10);
  newCategoryId = 1;
  newTax = 0;
  newTotal = 0;
  newItems = signal<CreateExpenseItemDto[]>([]);

  ngOnInit(): void {
    this.expenseService.loadExpenses().subscribe();
    this.categoryService.loadCategories().subscribe();
  }

  filteredExpenses = computed(() => {
    let list = this.expenseService.expenses();
    const query = this.searchQuery().toLowerCase().trim();
    const field = this.sortField();
    const dir = this.sortDirection();

    if (query) {
      list = list.filter(e =>
        e.merchantName.toLowerCase().includes(query) ||
        e.categoryName.toLowerCase().includes(query) ||
        (e.items && e.items.some(i => i.description.toLowerCase().includes(query)))
      );
    }

    return [...list].sort((a, b) => {
      let comparison = 0;
      if (field === 'date') comparison = new Date(a.expenseDate).getTime() - new Date(b.expenseDate).getTime();
      else if (field === 'amount') comparison = a.totalAmount - b.totalAmount;
      else if (field === 'merchant') comparison = a.merchantName.localeCompare(b.merchantName);
      return dir === 'asc' ? comparison : -comparison;
    });
  });

  totalFilteredAmount = computed(() => {
    return this.filteredExpenses().reduce((sum, e) => sum + e.totalAmount, 0);
  });

  hasActiveFilters(): boolean {
    return !!(this.searchQuery() || this.filterCategoryId !== null || this.filterFromDate || this.filterToDate);
  }

  getCategoryIcon(icon: string | null | undefined): string { return formatCategoryIcon(icon); }

  getCategoryIconById(catId: number): string {
    const cat = this.categoryService.categories().find(c => c.id === catId);
    return formatCategoryIcon(cat?.icon);
  }

  applyFilters(): void {
    this.expenseService.loadExpenses({
      categoryId: this.filterCategoryId,
      fromDate: this.filterFromDate ? new Date(this.filterFromDate + 'T00:00:00Z').toISOString() : null,
      toDate: this.filterToDate ? new Date(this.filterToDate + 'T23:59:59Z').toISOString() : null
    }).subscribe();
  }

  resetFilters(): void {
    this.searchQuery.set('');
    this.filterCategoryId = null;
    this.filterFromDate = null;
    this.filterToDate = null;
    this.currentSortOption = 'date-desc';
    this.sortField.set('date');
    this.sortDirection.set('desc');
    this.expenseService.loadExpenses({}).subscribe();
  }

  onSortOptionChange(): void {
    const [field, dir] = this.currentSortOption.split('-');
    this.sortField.set(field as SortField);
    this.sortDirection.set(dir as SortDirection);
  }

  toggleSort(field: SortField): void {
    if (this.sortField() === field) {
      this.sortDirection.update(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortField.set(field);
      this.sortDirection.set(field === 'date' || field === 'amount' ? 'desc' : 'asc');
    }
    this.currentSortOption = `${this.sortField()}-${this.sortDirection()}`;
  }

  toggleExpand(id: number): void {
    this.expandedExpenseIds.update(set => {
      const copy = new Set(set);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  }

  openReceiptModal(url: string): void { this.activeReceiptUrl.set(url); }
  closeReceiptModal(): void { this.activeReceiptUrl.set(null); }

  getCategoryColor(catId: number): string {
    const cat = this.categoryService.categories().find(c => c.id === catId);
    return cat?.colorHex || '#4f46e5';
  }

  deleteExpense(expense: ExpenseDto): void {
    if (confirm(`Delete transaction from "${expense.merchantName}"?`)) {
      this.expenseService.deleteExpense(expense.id).subscribe({
        next: () => {
          this.expandedExpenseIds.update(set => { const copy = new Set(set); copy.delete(expense.id); return copy; });
          this.notificationService.success('Deleted', `Transaction removed.`);
        },
        error: () => this.notificationService.error('Error', 'Failed to delete expense.')
      });
    }
  }

  exportToCsv(): void {
    const expenses = this.filteredExpenses();
    if (expenses.length === 0) { this.notificationService.info('Export', 'No transactions to export.'); return; }
    this.isExporting.set(true);
    try {
      const escape = (str: string | null | undefined): string => {
        if (!str) return '""';
        return `"${str.toString().replace(/"/g, '""')}"`;
      };
      const rows: string[] = ['Date,Merchant,Category,Items Count,Tax,Total,Receipt Image'];
      for (const e of expenses) {
        rows.push(`${new Date(e.expenseDate).toISOString().substring(0, 10)},${escape(e.merchantName)},${escape(e.categoryName)},${e.items ? e.items.length : 0},${e.taxAmount.toFixed(2)},${e.totalAmount.toFixed(2)},${escape(e.receiptImageUrl || '')}`);
      }
      const blob = new Blob(['\uFEFF' + rows.join('\r\n')], { type: 'text/csv;charset=utf-8;' });
      this.expenseService.downloadCsvBlob(blob, `spendwisely-transactions-${new Date().toISOString().substring(0, 10)}.csv`);
      this.notificationService.success('Export Successful', `Exported ${expenses.length} transactions to CSV.`);
    } catch {
      this.notificationService.error('Export Failed', 'An error occurred while generating CSV.');
    } finally {
      this.isExporting.set(false);
    }
  }

  openAddModal(): void {
    this.newMerchant = '';
    this.newDate = new Date().toISOString().substring(0, 10);
    this.newCategoryId = this.categoryService.categories()[0]?.id || 1;
    this.newTax = 0;
    this.newTotal = 0;
    this.newItems.set([]);
    this.isAddModalOpen.set(true);
  }

  closeAddModal(): void { this.isAddModalOpen.set(false); }

  addManualItem(): void {
    this.newItems.update(list => [...list, { description: '', quantity: 1, unitPrice: 0, totalPrice: 0 }]);
  }

  removeManualItem(index: number): void {
    this.newItems.update(list => list.filter((_, i) => i !== index));
    this.recalcNewTotal();
  }

  updateManualItemTotal(index: number): void {
    this.newItems.update(list => {
      const copy = [...list];
      const item = copy[index];
      item.totalPrice = Math.round((item.quantity * item.unitPrice) * 100) / 100;
      return copy;
    });
    this.recalcNewTotal();
  }

  recalcNewTotal(): void {
    const itemsSum = this.newItems().reduce((s, it) => s + (Number(it.totalPrice) || 0), 0);
    if (itemsSum > 0) this.newTotal = Math.round((itemsSum + (Number(this.newTax) || 0)) * 100) / 100;
  }

  saveManualExpense(): void {
    if (!this.newMerchant.trim()) { this.notificationService.error('Validation', 'Merchant name is required.'); return; }
    if (this.newTotal <= 0) { this.notificationService.error('Validation', 'Total amount must be greater than zero.'); return; }
    const selectedCatId = Number(this.newCategoryId);
    if (!selectedCatId || !this.categoryService.categories().some(c => c.id === selectedCatId)) {
      this.notificationService.error('Validation', 'Please select a valid category.'); return;
    }
    const dto: CreateExpenseDto = {
      merchantName: this.newMerchant.trim(),
      expenseDate: this.newDate ? new Date(this.newDate + 'T12:00:00Z').toISOString() : new Date().toISOString(),
      totalAmount: Number(this.newTotal),
      taxAmount: Number(this.newTax) || 0,
      receiptImageUrl: null,
      categoryId: selectedCatId,
      items: this.newItems().map(it => ({ description: it.description || 'Item', quantity: Number(it.quantity) || 1, unitPrice: Number(it.unitPrice) || 0, totalPrice: Number(it.totalPrice) || 0 }))
    };
    this.expenseService.createExpense(dto).subscribe({
      next: (created) => { this.notificationService.success('Expense Created', `Saved ${created.totalAmount} for ${created.merchantName}.`); this.closeAddModal(); },
      error: () => this.notificationService.error('Error', 'Failed to save expense.')
    });
  }
}
