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
  templateUrl: './category-list.component.html',
  styleUrls: ['./category-list.component.css']
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
