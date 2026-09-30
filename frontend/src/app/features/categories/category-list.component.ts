import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { CategoryService } from '../../core/services/category.service';
import { ExpenseService } from '../../core/services/expense.service';
import { NotificationService } from '../../core/services/notification.service';
import { CategoryDto, CreateCategoryDto, UpdateCategoryDto } from '../../core/models/category.model';
import { formatCategoryIcon } from '../../core/utils/icon.utils';

@Component({
  selector: 'app-category-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container animate-fade-in">
      <div class="page-header">
        <div class="header-titles">
          <h1>Categories & Budgets</h1>
          <p>Organize spending categories and set monthly budget limits.</p>
        </div>
        <button class="btn btn-primary" (click)="openCreateModal()">
          + New Category
        </button>
      </div>

      <!-- Categories Grid -->
      <div class="grid-cols-3">
        @for (cat of categoryService.categories(); track cat.id) {
          <div class="glass-card category-card">
            <div class="category-header">
              <div class="cat-icon-avatar" [style.background-color]="cat.colorHex + '20'" [style.color]="cat.colorHex">
                <span>{{ getCategoryIcon(cat.icon) }}</span>
              </div>
              <div class="cat-info">
                <h3>{{ cat.name }}</h3>
                <span class="budget-limit-label">Limit: {{ cat.monthlyBudgetLimit | number:'1.2-2' }}/mo</span>
              </div>
              <div class="cat-actions">
                <button class="btn-icon-subtle" (click)="openEditModal(cat)" title="Edit">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/></svg>
                </button>
                <button class="btn-icon-subtle btn-danger-hover" (click)="confirmDelete(cat)" title="Delete">
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                </button>
              </div>
            </div>

            <!-- Spending Meter (NO CURRENCY SYMBOLS) -->
            @let spent = getCategorySpent(cat.id);
            @let percent = cat.monthlyBudgetLimit > 0 ? (spent / cat.monthlyBudgetLimit) * 100 : 0;
            <div class="category-progress-block">
              <div class="progress-labels">
                <span class="label-spent">Spent: <strong>{{ spent | number:'1.2-2' }}</strong></span>
                <span class="label-pct" [class.over-budget]="percent >= 100">{{ percent | number:'1.0-0' }}%</span>
              </div>
              <div class="progress-track">
                <div 
                  class="progress-fill" 
                  [style.width.%]="percent > 100 ? 100 : percent"
                  [style.background-color]="getProgressBarColor(percent, cat.colorHex)">
                </div>
              </div>
              <div class="progress-subtext">
                @if (percent >= 100) {
                  <span class="text-rose">Over limit by {{ (spent - cat.monthlyBudgetLimit) | number:'1.2-2' }}</span>
                } @else {
                  <span class="text-muted">{{ (cat.monthlyBudgetLimit - spent) | number:'1.2-2' }} remaining</span>
                }
              </div>
            </div>
          </div>
        }
      </div>

      @if (categoryService.categories().length === 0 && !categoryService.loading()) {
        <div class="empty-state glass-card">
          <h3>No Categories Found</h3>
          <p>Create a category to begin setting budget limits.</p>
          <button class="btn btn-primary" (click)="openCreateModal()">Create Category</button>
        </div>
      }

      <!-- Modal (NO CURRENCY SYMBOLS) -->
      @if (isModalOpen()) {
        <div class="modal-backdrop animate-fade-in" (click)="closeModal()">
          <div class="modal-dialog glass-card" (click)="$event.stopPropagation()">
            <div class="modal-header">
              <h3>{{ editingCategory() ? 'Edit Category' : 'Create Category' }}</h3>
              <button class="modal-close-btn" (click)="closeModal()" aria-label="Close dialog">
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            </div>

            <div class="modal-body">
              <div class="form-group">
                <label class="form-label">Category Name</label>
                <input type="text" class="form-control" placeholder="e.g. Groceries" [(ngModel)]="modalName">
              </div>

              <div class="form-group">
                <label class="form-label">Monthly Budget Limit</label>
                <input type="number" step="10" min="0" class="form-control" placeholder="500" [(ngModel)]="modalLimit">
              </div>

              <!-- Icon Selector -->
              <div class="form-group">
                <label class="form-label">Icon</label>
                <div class="icon-presets">
                  @for (icon of iconPresets; track icon) {
                    <button 
                      type="button" 
                      class="icon-preset-btn" 
                      [class.active]="modalIcon === icon"
                      (click)="modalIcon = icon">
                      {{ icon }}
                    </button>
                  }
                </div>
              </div>

              <!-- Color Preset Selector -->
              <div class="form-group">
                <label class="form-label">Color</label>
                <div class="color-presets">
                  @for (c of colorPresets; track c) {
                    <button 
                      type="button" 
                      class="color-preset-btn" 
                      [style.background-color]="c"
                      [class.active]="modalColor === c"
                      (click)="modalColor = c">
                    </button>
                  }
                </div>
              </div>
            </div>

            <div class="modal-footer">
              <button type="button" class="btn btn-secondary" (click)="closeModal()">Cancel</button>
              <button type="button" class="btn btn-primary" (click)="saveCategory()">
                {{ editingCategory() ? 'Update' : 'Create' }}
              </button>
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

    .category-card {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .category-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .cat-icon-avatar {
      width: 40px;
      height: 40px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.25rem;
      flex-shrink: 0;
      overflow: hidden;
    }

    .cat-info {
      flex: 1;
      min-width: 0;
    }

    .cat-info h3 {
      font-size: 1rem;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
      margin-bottom: 0.15rem;
    }

    .budget-limit-label {
      font-size: 0.775rem;
      color: var(--text-secondary);
    }

    .cat-actions {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .btn-icon-subtle {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.35rem;
      border-radius: var(--radius-sm);
      display: inline-flex;
      align-items: center;
      justify-content: center;
    }

    .btn-icon-subtle:hover {
      color: var(--text-primary);
      background: var(--bg-card-hover);
    }

    .btn-danger-hover:hover {
      color: var(--accent-rose);
      background: var(--accent-rose-subtle);
    }

    /* Progress */
    .category-progress-block {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      padding-top: 0.65rem;
      border-top: 1px solid var(--border-subtle);
    }

    .progress-labels {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.8rem;
    }

    .label-spent strong {
      color: var(--text-primary);
    }

    .label-pct {
      font-weight: 600;
      color: var(--accent-emerald);
    }

    .label-pct.over-budget {
      color: var(--accent-rose);
    }

    .progress-track {
      width: 100%;
      height: 6px;
      background: var(--border-subtle);
      border-radius: var(--radius-full);
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: var(--radius-full);
      transition: width var(--transition-normal);
    }

    .progress-subtext {
      font-size: 0.75rem;
      display: flex;
      justify-content: flex-end;
    }

    .text-rose { color: var(--accent-rose); }
    .text-muted { color: var(--text-muted); }

    /* Modal */
    .modal-backdrop {
      position: fixed;
      inset: 0;
      background: var(--bg-modal-backdrop);
      z-index: 2000;
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 1.25rem;
    }

    .modal-dialog {
      width: 100%;
      max-width: 440px;
      background: var(--bg-card);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-lg);
      padding: 1.5rem;
    }

    .modal-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;
    }

    .modal-close {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      font-size: 1rem;
    }

    .modal-footer {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.65rem;
      margin-top: 1.5rem;
    }

    .icon-presets {
      display: flex;
      flex-wrap: wrap;
      gap: 0.4rem;
    }

    .icon-preset-btn {
      width: 36px;
      height: 36px;
      font-size: 1.1rem;
      border-radius: var(--radius-sm);
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon-preset-btn.active {
      border-color: var(--primary);
      background: var(--primary-subtle);
    }

    .color-presets {
      display: flex;
      gap: 0.5rem;
    }

    .color-preset-btn {
      width: 26px;
      height: 26px;
      border-radius: 50%;
      border: 2px solid transparent;
      cursor: pointer;
    }

    .color-preset-btn.active {
      border-color: var(--text-primary);
    }

    .empty-state {
      text-align: center;
      padding: 3rem 1.5rem;
    }
  `]
})
export class CategoryListComponent implements OnInit {
  readonly categoryService = inject(CategoryService);
  private readonly expenseService = inject(ExpenseService);
  private readonly notificationService = inject(NotificationService);

  readonly isModalOpen = signal<boolean>(false);
  readonly editingCategory = signal<CategoryDto | null>(null);

  modalName = '';
  modalLimit = 500;
  modalIcon = '🛒';
  modalColor = '#4f46e5';

  readonly iconPresets = ['🛒', '🍽️', '✈️', '⚡', '💻', '🚗', '🏠', '🎬', '🏥', '☕'];
  readonly colorPresets = ['#4f46e5', '#06b6d4', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#3b82f6'];

  ngOnInit(): void {
    this.categoryService.loadCategories().subscribe();
    this.expenseService.loadExpenses().subscribe();
  }

  getCategoryIcon(icon: string | null | undefined): string {
    return formatCategoryIcon(icon);
  }

  getCategorySpent(categoryId: number): number {
    const expenses = this.expenseService.expenses();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return expenses
      .filter(e => {
        const d = new Date(e.expenseDate);
        return e.categoryId === categoryId && d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + e.totalAmount, 0);
  }

  getProgressBarColor(pct: number, defaultColor: string): string {
    if (pct >= 100) return 'var(--accent-rose)';
    if (pct >= 85) return 'var(--accent-amber)';
    return defaultColor || 'var(--primary)';
  }

  openCreateModal(): void {
    this.editingCategory.set(null);
    this.modalName = '';
    this.modalLimit = 500;
    this.modalIcon = '🛒';
    this.modalColor = '#4f46e5';
    this.isModalOpen.set(true);
  }

  openEditModal(category: CategoryDto): void {
    this.editingCategory.set(category);
    this.modalName = category.name;
    this.modalLimit = category.monthlyBudgetLimit;
    this.modalIcon = formatCategoryIcon(category.icon);
    this.modalColor = category.colorHex;
    this.isModalOpen.set(true);
  }

  closeModal(): void {
    this.isModalOpen.set(false);
  }

  saveCategory(): void {
    if (!this.modalName.trim()) {
      this.notificationService.error('Validation', 'Category name is required.');
      return;
    }

    if (this.modalLimit < 0) {
      this.notificationService.error('Validation', 'Monthly budget limit cannot be negative.');
      return;
    }

    const editing = this.editingCategory();
    if (editing) {
      const updateDto: UpdateCategoryDto = {
        name: this.modalName.trim(),
        monthlyBudgetLimit: Number(this.modalLimit),
        colorHex: this.modalColor,
        icon: this.modalIcon
      };
      this.categoryService.update(editing.id, updateDto).subscribe({
        next: () => {
          this.notificationService.success('Updated', `Category ${updateDto.name} updated.`);
          this.closeModal();
        },
        error: () => this.notificationService.error('Error', 'Failed to update category.')
      });
    } else {
      const createDto: CreateCategoryDto = {
        name: this.modalName.trim(),
        monthlyBudgetLimit: Number(this.modalLimit),
        colorHex: this.modalColor,
        icon: this.modalIcon
      };
      this.categoryService.create(createDto).subscribe({
        next: (created) => {
          this.notificationService.success('Created', `Category ${created.name} created.`);
          this.closeModal();
        },
        error: () => this.notificationService.error('Error', 'Failed to create category.')
      });
    }
  }

  confirmDelete(category: CategoryDto): void {
    if (confirm(`Delete category "${category.name}"?`)) {
      this.categoryService.delete(category.id).subscribe({
        next: () => this.notificationService.success('Deleted', `Category "${category.name}" removed.`),
        error: (err) => this.notificationService.error('Error', err?.error || 'Cannot delete category with active expenses.')
      });
    }
  }
}
