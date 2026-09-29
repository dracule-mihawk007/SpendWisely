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
  template: `
    <div class="container animate-fade-in">
      <div class="page-header">
        <div class="header-titles">
          <h1>Expenses & Transactions</h1>
          <p>Review all logged transactions, view receipts, and filter by category or date.</p>
        </div>
        <div class="header-actions">
          <button class="btn btn-secondary" (click)="exportToCsv()" [disabled]="isExporting() || filteredExpenses().length === 0" title="Export transactions to CSV">
            @if (isExporting()) {
              <div class="spinner-sm"></div>
              <span>Exporting...</span>
            } @else {
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="7 10 12 15 17 10"/><line x1="12" x2="12" y1="15" y2="3"/>
              </svg>
              <span>Export CSV</span>
            }
          </button>
          <a routerLink="/scan" class="btn btn-secondary">
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/>
            </svg>
            <span>Scan Receipt</span>
          </a>
          <button class="btn btn-primary" (click)="openAddModal()">
            + Add Manually
          </button>
        </div>
      </div>

      <div class="glass-card filter-card">
        <div class="filter-grid">
          <div class="filter-item">
            <label class="form-label">Search Merchant</label>
            <input type="text" class="form-control" placeholder="Search merchant..." [(ngModel)]="searchQuery">
          </div>

          <div class="filter-item">
            <label class="form-label">Category</label>
            <select class="form-select" [(ngModel)]="filterCategoryId" (change)="applyFilters()">
              <option [ngValue]="null">All Categories</option>
              @for (cat of categoryService.categories(); track cat.id) {
                <option [ngValue]="cat.id">{{ getCategoryIcon(cat.icon) }} {{ cat.name }}</option>
              }
            </select>
          </div>

          <div class="filter-item">
            <label class="form-label">From Date</label>
            <input type="date" class="form-control" [(ngModel)]="filterFromDate" (change)="applyFilters()">
          </div>

          <div class="filter-item">
            <label class="form-label">To Date</label>
            <input type="date" class="form-control" [(ngModel)]="filterToDate" (change)="applyFilters()">
          </div>

          <div class="filter-item">
            <label class="form-label">Sort By</label>
            <select class="form-select" [(ngModel)]="currentSortOption" (change)="onSortOptionChange()">
              <option value="date-desc">Date (Newest first)</option>
              <option value="date-asc">Date (Oldest first)</option>
              <option value="amount-desc">Total Amount (Highest)</option>
              <option value="amount-asc">Total Amount (Lowest)</option>
              <option value="merchant-asc">Merchant (A to Z)</option>
            </select>
          </div>
        </div>

        <div class="filter-summary-row">
          <div class="filter-badges">
            <span class="badge badge-primary">{{ filteredExpenses().length }} Records</span>
            <span class="badge badge-emerald">Total: {{ totalFilteredAmount() | number:'1.2-2' }}</span>
          </div>

          @if (hasActiveFilters()) {
            <button class="btn btn-sm btn-secondary" (click)="resetFilters()">Reset Filters</button>
          }
        </div>
      </div>

      <div class="glass-card table-card" style="margin-top: 1.25rem;">
        @if (expenseService.loading()) {
          <div class="loading-state">
            <div class="circular-spinner circular-spinner-sm"></div>
            <span>Loading transactions...</span>
          </div>
        } @else if (filteredExpenses().length === 0) {
          <div class="empty-state">
            <h3>No Expenses Found</h3>
            <p>No transactions match the selected filters.</p>
            <a routerLink="/scan" class="btn btn-primary" style="margin-top: 0.5rem;">Scan Receipt</a>
          </div>
        } @else {
          <div class="table-responsive">
            <table class="data-table">
              <thead>
                <tr>
                  <th (click)="toggleSort('merchant')" class="sortable-th">
                    <div class="th-content">
                      <span>Merchant & Items</span>
                      @if (sortField === 'merchant') {
                        <span class="sort-indicator">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                      }
                    </div>
                  </th>
                  <th>Category</th>
                  <th (click)="toggleSort('date')" class="sortable-th">
                    <div class="th-content">
                      <span>Date</span>
                      @if (sortField === 'date') {
                        <span class="sort-indicator">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                      }
                    </div>
                  </th>
                  <th>Receipt</th>
                  <th class="text-right">Tax</th>
                  <th (click)="toggleSort('amount')" class="text-right sortable-th">
                    <div class="th-content th-content-right">
                      <span>Total</span>
                      @if (sortField === 'amount') {
                        <span class="sort-indicator">{{ sortDirection === 'asc' ? '↑' : '↓' }}</span>
                      }
                    </div>
                  </th>
                  <th class="text-center" style="width: 50px;"></th>
                </tr>
              </thead>
              <tbody>
                @for (expense of filteredExpenses(); track expense.id) {
                  <tr>
                    <td>
                      <div class="merchant-cell">
                        <span class="merchant-name">{{ expense.merchantName }}</span>
                        @if (expense.items && expense.items.length > 0) {
                          <button class="items-toggle-btn" (click)="toggleExpand(expense.id)">
                            {{ expense.items.length }} {{ expense.items.length === 1 ? 'item' : 'items' }}
                            <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" [class.rotated]="expandedExpenseIds().has(expense.id)"><path d="m6 9 6 6 6-6"/></svg>
                          </button>
                        }
                      </div>

                      @if (expandedExpenseIds().has(expense.id)) {
                        <div class="expanded-items-box animate-fade-in">
                          @for (it of expense.items; track it.id) {
                            <div class="item-line">
                              <span class="item-desc">{{ it.description }}</span>
                              <span class="item-calc">{{ it.quantity }} × {{ it.unitPrice | number:'1.2-2' }}</span>
                              <span class="item-sum">{{ it.totalPrice | number:'1.2-2' }}</span>
                            </div>
                          }
                        </div>
                      }
                    </td>

                    <td>
                      <span class="cat-pill" [style.background-color]="getCategoryColor(expense.categoryId) + '15'" [style.color]="getCategoryColor(expense.categoryId)">
                        {{ getCategoryIconById(expense.categoryId) }} {{ expense.categoryName }}
                      </span>
                    </td>

                    <td>
                      <span class="date-text">{{ expense.expenseDate | date:'mediumDate' }}</span>
                    </td>

                    <td>
                      @if (expense.receiptImageUrl) {
                        <button class="receipt-link-btn" (click)="openReceiptModal(expense.receiptImageUrl)" title="View Receipt">
                          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>
                          <span>Receipt</span>
                        </button>
                      } @else {
                        <span class="no-receipt">—</span>
                      }
                    </td>

                    <td class="text-right">
                      <span class="tax-text">{{ expense.taxAmount | number:'1.2-2' }}</span>
                    </td>

                    <td class="text-right">
                      <strong class="total-text">{{ expense.totalAmount | number:'1.2-2' }}</strong>
                    </td>

                    <td class="text-center">
                      <button class="btn-icon-subtle btn-danger-hover" (click)="deleteExpense(expense)" title="Delete Expense">
                        <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                      </button>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        }
      </div>

      @if (activeReceiptUrl()) {
        <div class="modal-backdrop animate-fade-in" (click)="closeReceiptModal()">
          <div class="receipt-lightbox glass-card" (click)="$event.stopPropagation()">
            <div class="lightbox-header">
              <h4>Scanned Receipt</h4>
              <button class="modal-close" (click)="closeReceiptModal()">✕</button>
            </div>
            <div class="lightbox-body">
              <img [src]="activeReceiptUrl()" alt="Receipt image" class="lightbox-img">
            </div>
          </div>
        </div>
      }

      @if (isAddModalOpen()) {
        <div class="modal-backdrop animate-fade-in" (click)="closeAddModal()">
          <div class="modal-dialog glass-card" (click)="$event.stopPropagation()" style="max-width: 580px;">
            <div class="modal-header">
              <h3>Add Expense Manually</h3>
              <button class="modal-close" (click)="closeAddModal()">✕</button>
            </div>

            <div class="modal-body">
              <div class="grid-cols-2">
                <div class="form-group">
                  <label class="form-label">Merchant Name</label>
                  <input type="text" class="form-control" placeholder="Store or vendor" [(ngModel)]="newMerchant">
                </div>

                <div class="form-group">
                  <label class="form-label">Expense Date</label>
                  <input type="date" class="form-control" [(ngModel)]="newDate">
                </div>
              </div>

              <div class="grid-cols-3">
                <div class="form-group">
                  <label class="form-label">Category</label>
                  <select class="form-select" [(ngModel)]="newCategoryId">
                    @for (cat of categoryService.categories(); track cat.id) {
                      <option [value]="cat.id">{{ getCategoryIcon(cat.icon) }} {{ cat.name }}</option>
                    }
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Tax Amount</label>
                  <input type="number" step="0.01" min="0" class="form-control" [(ngModel)]="newTax" (ngModelChange)="recalcNewTotal()">
                </div>

                <div class="form-group">
                  <label class="form-label">Total Amount</label>
                  <input type="number" step="0.01" min="0" class="form-control" [(ngModel)]="newTotal" style="font-weight: 600;">
                </div>
              </div>

              <div class="manual-items-box">
                <div class="items-header">
                  <label class="form-label">Item Breakdown (Optional)</label>
                  <button type="button" class="btn btn-sm btn-secondary" (click)="addManualItem()">+ Add Item</button>
                </div>

                @for (it of newItems(); track $index) {
                  <div class="manual-item-row">
                    <input type="text" class="form-control" placeholder="Description" [(ngModel)]="it.description">
                    <input type="number" min="1" class="form-control" style="width: 65px;" placeholder="Qty" [(ngModel)]="it.quantity" (ngModelChange)="updateManualItemTotal($index)">
                    <input type="number" step="0.01" min="0" class="form-control" style="width: 90px;" placeholder="Price" [(ngModel)]="it.unitPrice" (ngModelChange)="updateManualItemTotal($index)">
                    <span class="manual-item-total">{{ it.totalPrice | number:'1.2-2' }}</span>
                    <button type="button" class="btn-icon-subtle btn-danger-hover" (click)="removeManualItem($index)">✕</button>
                  </div>
                }
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeAddModal()">Cancel</button>
              <button type="button" class="btn btn-primary" (click)="saveManualExpense()">Save Expense</button>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.5rem;
    }

    .header-titles h1 {
      font-size: 1.6rem;
      margin-bottom: 0.2rem;
    }

    .header-titles p {
      color: var(--text-secondary);
      font-size: 0.875rem;
      margin: 0;
    }

    .header-actions {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .spinner-sm {
      width: 13px;
      height: 13px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: currentColor;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .filter-card {
      padding: 1.25rem;
    }

    .filter-grid {
      display: grid;
      grid-template-columns: 1.4fr 1fr 1fr 1fr 1fr;
      gap: 0.85rem;
      align-items: flex-end;
    }

    .filter-item {
      display: flex;
      flex-direction: column;
    }

    .filter-summary-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-top: 1rem;
      padding-top: 0.85rem;
      border-top: 1px solid var(--border-subtle);
    }

    .filter-badges {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .table-card {
      padding: 0;
      overflow: hidden;
    }

    .table-responsive {
      overflow-x: auto;
    }

    .data-table {
      width: 100%;
      border-collapse: collapse;
      text-align: left;
      font-size: 0.875rem;
    }

    .data-table th {
      padding: 0.85rem 1.15rem;
      background: var(--bg-card-hover);
      color: var(--text-secondary);
      font-weight: 600;
      font-size: 0.775rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      border-bottom: 1px solid var(--border-subtle);
    }

    .sortable-th {
      cursor: pointer;
      user-select: none;
      transition: color var(--transition-fast);
    }

    .sortable-th:hover {
      color: var(--text-primary);
    }

    .th-content {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
    }

    .th-content-right {
      justify-content: flex-end;
      width: 100%;
    }

    .sort-indicator {
      font-size: 0.85rem;
      color: var(--primary);
    }

    .data-table td {
      padding: 0.95rem 1.15rem;
      border-bottom: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      vertical-align: top;
    }

    .data-table tbody tr {
      transition: background-color var(--transition-fast);
    }

    .data-table tbody tr:hover {
      background-color: var(--bg-card-hover);
    }

    .merchant-cell {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .merchant-name {
      font-weight: 600;
      color: var(--text-primary);
    }

    .items-toggle-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      font-size: 0.75rem;
      color: var(--primary);
      background: transparent;
      border: none;
      padding: 0;
      cursor: pointer;
      width: fit-content;
    }

    .items-toggle-btn svg {
      transition: transform var(--transition-fast);
    }

    .items-toggle-btn svg.rotated {
      transform: rotate(180deg);
    }

    .expanded-items-box {
      margin-top: 0.5rem;
      padding: 0.6rem 0.75rem;
      border-radius: var(--radius-sm);
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      font-size: 0.8rem;
    }

    .item-line {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
    }

    .item-desc {
      color: var(--text-primary);
      flex: 1;
    }

    .item-calc {
      color: var(--text-muted);
      font-size: 0.75rem;
    }

    .item-sum {
      font-weight: 600;
      color: var(--text-primary);
    }

    .cat-pill {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.2rem 0.6rem;
      border-radius: var(--radius-sm);
      font-size: 0.8rem;
      font-weight: 600;
    }

    .date-text {
      white-space: nowrap;
      font-size: 0.825rem;
    }

    .tax-text {
      font-size: 0.825rem;
      color: var(--text-muted);
    }

    .total-text {
      font-family: var(--font-heading);
      color: var(--text-primary);
      font-size: 0.95rem;
    }

    .receipt-link-btn {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.25rem 0.55rem;
      border-radius: var(--radius-sm);
      background: var(--primary-subtle);
      color: var(--primary);
      border: 1px solid transparent;
      font-size: 0.75rem;
      font-weight: 600;
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .receipt-link-btn:hover {
      border-color: var(--primary);
    }

    .no-receipt {
      color: var(--text-muted);
    }

    .text-right { text-align: right; }
    .text-center { text-align: center; }

    .loading-state, .empty-state {
      padding: 3rem 1.5rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      color: var(--text-muted);
    }

    .empty-state h3 {
      color: var(--text-primary);
      font-size: 1.15rem;
    }

    .receipt-lightbox {
      max-width: 600px;
      width: 90%;
      max-height: 85vh;
      display: flex;
      flex-direction: column;
      padding: 0;
      overflow: hidden;
    }

    .lightbox-header {
      padding: 0.85rem 1.25rem;
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-subtle);
    }

    .lightbox-header h4 {
      font-size: 1rem;
      margin: 0;
    }

    .lightbox-body {
      padding: 1rem;
      overflow-y: auto;
      display: flex;
      justify-content: center;
      background: var(--bg-surface);
    }

    .lightbox-img {
      max-width: 100%;
      max-height: 70vh;
      object-fit: contain;
      border-radius: var(--radius-sm);
    }

    .manual-items-box {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .items-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.25rem;
    }

    .manual-item-row {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .manual-item-total {
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--text-primary);
      min-width: 60px;
      text-align: right;
    }

    @media (max-width: 950px) {
      .filter-grid { grid-template-columns: 1fr; }
      .page-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
    }
  `]
})
export class ExpenseListComponent implements OnInit {
  readonly expenseService = inject(ExpenseService);
  readonly categoryService = inject(CategoryService);
  private readonly notificationService = inject(NotificationService);

  searchQuery = '';
  filterCategoryId: number | null = null;
  filterFromDate: string | null = null;
  filterToDate: string | null = null;

  sortField: SortField = 'date';
  sortDirection: SortDirection = 'desc';
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
    const query = this.searchQuery.toLowerCase().trim();

    if (query) {
      list = list.filter(e => 
        e.merchantName.toLowerCase().includes(query) ||
        e.categoryName.toLowerCase().includes(query) ||
        (e.items && e.items.some(i => i.description.toLowerCase().includes(query)))
      );
    }

    return [...list].sort((a, b) => {
      let comparison = 0;
      if (this.sortField === 'date') {
        comparison = new Date(a.expenseDate).getTime() - new Date(b.expenseDate).getTime();
      } else if (this.sortField === 'amount') {
        comparison = a.totalAmount - b.totalAmount;
      } else if (this.sortField === 'merchant') {
        comparison = a.merchantName.localeCompare(b.merchantName);
      }
      return this.sortDirection === 'asc' ? comparison : -comparison;
    });
  });

  totalFilteredAmount = computed(() => {
    return this.filteredExpenses().reduce((sum, e) => sum + e.totalAmount, 0);
  });

  hasActiveFilters(): boolean {
    return !!(this.searchQuery || this.filterCategoryId !== null || this.filterFromDate || this.filterToDate);
  }

  getCategoryIcon(icon: string | null | undefined): string {
    return formatCategoryIcon(icon);
  }

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
    this.searchQuery = '';
    this.filterCategoryId = null;
    this.filterFromDate = null;
    this.filterToDate = null;
    this.currentSortOption = 'date-desc';
    this.sortField = 'date';
    this.sortDirection = 'desc';
    this.expenseService.loadExpenses({}).subscribe();
  }

  onSortOptionChange(): void {
    const [field, dir] = this.currentSortOption.split('-');
    this.sortField = field as SortField;
    this.sortDirection = dir as SortDirection;
  }

  toggleSort(field: SortField): void {
    if (this.sortField === field) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortField = field;
      this.sortDirection = field === 'date' || field === 'amount' ? 'desc' : 'asc';
    }
    this.currentSortOption = `${this.sortField}-${this.sortDirection}`;
  }

  toggleExpand(id: number): void {
    this.expandedExpenseIds.update(set => {
      const copy = new Set(set);
      if (copy.has(id)) copy.delete(id);
      else copy.add(id);
      return copy;
    });
  }

  openReceiptModal(url: string): void {
    this.activeReceiptUrl.set(url);
  }

  closeReceiptModal(): void {
    this.activeReceiptUrl.set(null);
  }

  getCategoryColor(catId: number): string {
    const cat = this.categoryService.categories().find(c => c.id === catId);
    return cat?.colorHex || '#4f46e5';
  }

  deleteExpense(expense: ExpenseDto): void {
    if (confirm(`Delete transaction from "${expense.merchantName}"?`)) {
      this.expenseService.deleteExpense(expense.id).subscribe({
        next: () => {
          this.expandedExpenseIds.update(set => {
            const copy = new Set(set);
            copy.delete(expense.id);
            return copy;
          });
          this.notificationService.success('Deleted', `Transaction removed.`);
        },
        error: () => this.notificationService.error('Error', 'Failed to delete expense.')
      });
    }
  }

  exportToCsv(): void {
    const expenses = this.filteredExpenses();
    if (expenses.length === 0) {
      this.notificationService.info('Export', 'No transactions to export.');
      return;
    }

    this.isExporting.set(true);

    try {
      const escape = (str: string | null | undefined): string => {
        if (!str) return '""';
        const s = str.toString().replace(/"/g, '""');
        return `"${s}"`;
      };

      const rows: string[] = [];
      rows.push('Date,Merchant,Category,Items Count,Tax,Total,Receipt Image');

      for (const e of expenses) {
        const dateStr = new Date(e.expenseDate).toISOString().substring(0, 10);
        const merchant = escape(e.merchantName);
        const category = escape(e.categoryName);
        const itemsCount = e.items ? e.items.length : 0;
        const tax = e.taxAmount.toFixed(2);
        const total = e.totalAmount.toFixed(2);
        const receipt = escape(e.receiptImageUrl || '');

        rows.push(`${dateStr},${merchant},${category},${itemsCount},${tax},${total},${receipt}`);
      }

      const csvContent = '\uFEFF' + rows.join('\r\n');
      const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
      const filename = `spendwisely-transactions-${new Date().toISOString().substring(0, 10)}.csv`;

      this.expenseService.downloadCsvBlob(blob, filename);
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

  closeAddModal(): void {
    this.isAddModalOpen.set(false);
  }

  addManualItem(): void {
    this.newItems.update(list => [
      ...list,
      { description: '', quantity: 1, unitPrice: 0, totalPrice: 0 }
    ]);
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
    if (itemsSum > 0) {
      this.newTotal = Math.round((itemsSum + (Number(this.newTax) || 0)) * 100) / 100;
    }
  }

  saveManualExpense(): void {
    if (!this.newMerchant.trim()) {
      this.notificationService.error('Validation', 'Merchant name is required.');
      return;
    }

    if (this.newTotal <= 0) {
      this.notificationService.error('Validation', 'Total amount must be greater than zero.');
      return;
    }

    const selectedCatId = Number(this.newCategoryId);
    if (!selectedCatId || !this.categoryService.categories().some(c => c.id === selectedCatId)) {
      this.notificationService.error('Validation', 'Please select a valid category.');
      return;
    }

    const safeDate = this.newDate ? new Date(this.newDate + 'T12:00:00Z').toISOString() : new Date().toISOString();
    const dto: CreateExpenseDto = {
      merchantName: this.newMerchant.trim(),
      expenseDate: safeDate,
      totalAmount: Number(this.newTotal),
      taxAmount: Number(this.newTax) || 0,
      receiptImageUrl: null,
      categoryId: selectedCatId,
      items: this.newItems().map(it => ({
        description: it.description || 'Item',
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice) || 0,
        totalPrice: Number(it.totalPrice) || 0
      }))
    };

    this.expenseService.createExpense(dto).subscribe({
      next: (created) => {
        this.notificationService.success('Expense Created', `Saved ${created.totalAmount} for ${created.merchantName}.`);
        this.closeAddModal();
      },
      error: () => this.notificationService.error('Error', 'Failed to save expense.')
    });
  }
}
