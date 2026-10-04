import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ExpenseService } from '../../core/services/expense.service';
import { CategoryService } from '../../core/services/category.service';
import { NotificationService } from '../../core/services/notification.service';
import { ScanPreviewDto, ScannedItemDto } from '../../core/models/receipt.model';
import { CreateExpenseDto } from '../../core/models/expense.model';
import { formatCategoryIcon } from '../../core/utils/icon.utils';

@Component({
  selector: 'app-receipt-scanner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './receipt-scanner.component.html',
  styleUrls: ['./receipt-scanner.component.css']
})
export class ReceiptScannerComponent implements OnInit {
  private readonly expenseService = inject(ExpenseService);
  readonly categoryService = inject(CategoryService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  readonly activeMode = signal<'scan' | 'manual'>('scan');
  readonly isDragging = signal<boolean>(false);
  readonly isScanning = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly scanPreview = signal<ScanPreviewDto | null>(null);
  readonly localImagePreviewUrl = signal<string | null>(null);

  formMerchant = '';
  formDate = new Date().toISOString().substring(0, 10);
  formCategoryId = 1;
  formTax = 0;
  formTotal = 0;
  items = signal<ScannedItemDto[]>([]);

  selectedCategory = computed(() => {
    const catId = Number(this.formCategoryId);
    return this.categoryService.categories().find(c => c.id === catId) || null;
  });

  ngOnInit(): void {
    if (this.categoryService.categories().length === 0) {
      this.categoryService.loadCategories().subscribe({
        next: (cats) => {
          if (cats.length > 0 && !this.formCategoryId) {
            this.formCategoryId = cats[0].id;
          }
        }
      });
    } else {
      this.formCategoryId = this.categoryService.categories()[0]?.id || 1;
    }
  }

  setMode(mode: 'scan' | 'manual'): void {
    this.activeMode.set(mode);
    if (mode === 'manual' && !this.formMerchant) {
      this.formDate = new Date().toISOString().substring(0, 10);
      const cats = this.categoryService.categories();
      if (cats.length > 0 && !this.formCategoryId) {
        this.formCategoryId = cats[0].id;
      }
    }
  }

  getCategoryIcon(icon: string | null | undefined): string {
    return formatCategoryIcon(icon);
  }

  onDragOver(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging.set(true);
  }

  onDragLeave(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging.set(false);
  }

  onDrop(e: DragEvent): void {
    e.preventDefault();
    e.stopPropagation();
    this.isDragging.set(false);

    if (e.dataTransfer?.files && e.dataTransfer.files.length > 0) {
      this.processFile(e.dataTransfer.files[0]);
    }
  }

  onFileSelected(e: Event): void {
    const input = e.target as HTMLInputElement;
    if (input.files && input.files.length > 0) {
      this.processFile(input.files[0]);
    }
  }

  private processFile(file: File): void {
    const validTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!validTypes.includes(file.type.toLowerCase())) {
      this.notificationService.error('Invalid File Type', 'Please upload a JPEG, PNG, or WebP image.');
      return;
    }

    if (file.size > 10 * 1024 * 1024) {
      this.notificationService.error('File Too Large', 'Maximum file size allowed is 10MB.');
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      this.localImagePreviewUrl.set(reader.result as string);
    };
    reader.readAsDataURL(file);

    this.isScanning.set(true);
    this.expenseService.scanReceipt(file).subscribe({
      next: (preview) => {
        this.isScanning.set(false);
        this.scanPreview.set(preview);

        this.formMerchant = preview.merchant || 'Unknown Merchant';
        this.formDate = preview.date ? preview.date.substring(0, 10) : new Date().toISOString().substring(0, 10);
        const categories = this.categoryService.categories();
        const matched = categories.find(c => c.id === preview.suggestedCategoryId);
        this.formCategoryId = matched ? matched.id : (categories[0]?.id || 1);
        this.formTax = preview.tax || 0;
        this.formTotal = preview.total || 0;
        this.items.set(preview.items ? [...preview.items] : []);

        if (preview.aiScanSuccessful === false) {
          this.notificationService.warning(
            'Processing Notice',
            preview.aiNotice || 'Receipt uploaded! Please review or enter values manually.'
          );
        } else if (preview.budgetWarning) {
          this.notificationService.warning(
            'Budget Warning',
            `This receipt exceeds the monthly budget for ${preview.suggestedCategoryName}.`
          );
        } else {
          this.notificationService.success('Receipt Processed', `Extracted details from ${this.formMerchant}.`);
        }
      },
      error: (err) => {
        this.isScanning.set(false);
        const errMsg = err?.error?.message || err?.error?.title || err?.message || 'Failed to scan receipt. Please ensure the backend is running.';
        this.notificationService.error('Scan Notice', errMsg);
      }
    });
  }

  addItem(): void {
    this.items.update(list => [
      ...list,
      { description: 'Item', quantity: 1, unitPrice: 0, totalPrice: 0 }
    ]);
  }

  removeItem(index: number): void {
    this.items.update(list => list.filter((_, i) => i !== index));
    this.recalculateTotal();
  }

  updateItemTotal(index: number): void {
    this.items.update(list => {
      const copy = [...list];
      const it = copy[index];
      it.totalPrice = Math.round((it.quantity * it.unitPrice) * 100) / 100;
      return copy;
    });
    this.recalculateTotal();
  }

  recalculateTotal(): void {
    const itemsSum = this.items().reduce((sum, it) => sum + (Number(it.totalPrice) || 0), 0);
    if (itemsSum > 0) {
      this.formTotal = Math.round((itemsSum + (Number(this.formTax) || 0)) * 100) / 100;
    }
  }

  clearManualForm(): void {
    this.formMerchant = '';
    this.formDate = new Date().toISOString().substring(0, 10);
    this.formTax = 0;
    this.formTotal = 0;
    this.items.set([]);
  }

  resetScanner(): void {
    this.scanPreview.set(null);
    this.localImagePreviewUrl.set(null);
    this.items.set([]);
    this.clearManualForm();
  }

  saveExpense(): void {
    if (!this.formMerchant.trim()) {
      this.notificationService.error('Validation Error', 'Merchant name is required.');
      return;
    }

    if (this.formTotal <= 0) {
      this.notificationService.error('Validation Error', 'Total amount must be greater than zero.');
      return;
    }

    const selectedCatId = Number(this.formCategoryId);
    if (!selectedCatId || !this.categoryService.categories().some(c => c.id === selectedCatId)) {
      this.notificationService.error('Validation Error', 'Please select a valid category.');
      return;
    }

    const preview = this.scanPreview();
    const safeDate = this.formDate ? new Date(this.formDate + 'T12:00:00Z').toISOString() : new Date().toISOString();
    const dto: CreateExpenseDto = {
      merchantName: this.formMerchant.trim(),
      expenseDate: safeDate,
      totalAmount: Number(this.formTotal),
      taxAmount: Number(this.formTax) || 0,
      receiptImageUrl: preview?.receiptImageUrl ?? null,
      categoryId: selectedCatId,
      items: this.items().map(it => ({
        description: it.description,
        quantity: Number(it.quantity) || 1,
        unitPrice: Number(it.unitPrice) || 0,
        totalPrice: Number(it.totalPrice) || 0
      }))
    };

    this.isSaving.set(true);
    this.expenseService.createExpense(dto).subscribe({
      next: (created) => {
        this.isSaving.set(false);
        this.notificationService.success('Expense Created', `Saved ${created.totalAmount.toFixed(2)} from ${created.merchantName}.`);
        this.router.navigate(['/expenses']);
      },
      error: (err) => {
        this.isSaving.set(false);
        this.notificationService.error('Save Failed', err?.error?.title || 'Could not save expense.');
      }
    });
  }
}
