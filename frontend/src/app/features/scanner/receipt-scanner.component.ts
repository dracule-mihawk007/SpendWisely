import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { ExpenseService } from '../../core/services/expense.service';
import { CategoryService } from '../../core/services/category.service';
import { NotificationService } from '../../core/services/notification.service';
import { ScanPreviewDto, ScannedItemDto } from '../../core/models/receipt.model';
import { CreateExpenseDto } from '../../core/models/expense.model';

@Component({
  selector: 'app-receipt-scanner',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container animate-fade-in">
      <div class="page-header">
        <div class="header-titles">
          <h1>Receipt Scanner</h1>
          <p>Upload a receipt image. Merchant details, items, tax, and totals will be automatically extracted.</p>
        </div>
      </div>

      <!-- Upload Drop Zone (Visible when not scanning and no preview yet) -->
      @if (!scanPreview() && !isScanning()) {
        <div 
          class="upload-dropzone" 
          [class.drag-over]="isDragging()"
          (dragover)="onDragOver($event)"
          (dragleave)="onDragLeave($event)"
          (drop)="onDrop($event)"
          (click)="fileInput.click()">
          
          <input 
            #fileInput 
            type="file" 
            accept="image/jpeg,image/png,image/webp" 
            style="display: none" 
            (change)="onFileSelected($event)">
          
          <div class="upload-icon-wrapper">
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.75" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" x2="12" y1="3" y2="15"/>
            </svg>
          </div>

          <h3>Drag and drop your receipt here, or <span class="highlight">browse</span></h3>
          <p class="dropzone-hints">Supports PNG, JPG, JPEG, and WebP (up to 10MB)</p>
        </div>
      }

      <!-- Clean Circular Loading Spinner during scanning -->
      @if (isScanning()) {
        <div class="glass-card loading-card">
          <div class="circular-spinner"></div>
          <div class="loading-text">
            <h3>Scanning Receipt...</h3>
            <p>Processing image and extracting itemized details</p>
          </div>
        </div>
      }

      <!-- Scan Result & Verification Form -->
      @if (scanPreview(); as preview) {
        <div class="preview-layout">
          <!-- Left Column: Receipt Image & Budget Warning -->
          <div class="preview-sidebar">
            <div class="glass-card receipt-preview-card">
              <div class="card-header-row">
                <h4>Receipt Preview</h4>
                <button class="btn btn-sm btn-secondary" (click)="resetScanner()">Scan Another</button>
              </div>

              @if (localImagePreviewUrl()) {
                <div class="image-viewport">
                  <img [src]="localImagePreviewUrl()" alt="Receipt preview" class="receipt-image">
                </div>
              } @else if (preview.receiptImageUrl) {
                <div class="image-viewport">
                  <img [src]="preview.receiptImageUrl" alt="Receipt preview" class="receipt-image">
                </div>
              }

              <!-- Budget Warning Alert Box (NO CURRENCY SYMBOLS) -->
              @if (preview.budgetWarning) {
                <div class="budget-alert-box alert-danger">
                  <div class="alert-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  </div>
                  <div class="alert-body">
                    <strong>Budget Exceeded</strong>
                    <p>Total monthly spending will reach {{ (preview.monthlySpent + preview.total) | number:'1.2-2' }}, exceeding the {{ preview.monthlyBudgetLimit | number:'1.2-2' }} limit for {{ preview.suggestedCategoryName }}.</p>
                  </div>
                </div>
              } @else {
                <div class="budget-alert-box alert-safe">
                  <div class="alert-icon">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
                  </div>
                  <div class="alert-body">
                    <strong>Within Budget</strong>
                    <p>Current spent: {{ preview.monthlySpent | number:'1.2-2' }} / Limit: {{ preview.monthlyBudgetLimit | number:'1.2-2' }}</p>
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Right Column: Verification & Editable Form (NO CURRENCY SYMBOLS) -->
          <div class="preview-main">
            <div class="glass-card">
              <div class="form-section-title">
                <h3>Extracted Details</h3>
                <span class="badge badge-primary">Review & Confirm</span>
              </div>

              <div class="grid-cols-2" style="margin-top: 1rem;">
                <div class="form-group">
                  <label class="form-label">Merchant Name</label>
                  <input type="text" class="form-control" [(ngModel)]="formMerchant">
                </div>

                <div class="form-group">
                  <label class="form-label">Expense Date</label>
                  <input type="date" class="form-control" [(ngModel)]="formDate">
                </div>
              </div>

              <div class="grid-cols-3">
                <div class="form-group">
                  <label class="form-label">Category</label>
                  <select class="form-select" [(ngModel)]="formCategoryId">
                    @for (cat of categoryService.categories(); track cat.id) {
                      <option [value]="cat.id">{{ cat.name }} (Limit: {{ cat.monthlyBudgetLimit }})</option>
                    }
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Tax Amount</label>
                  <input type="number" step="0.01" min="0" class="form-control" [(ngModel)]="formTax" (ngModelChange)="recalculateTotal()">
                </div>

                <div class="form-group">
                  <label class="form-label">Total Amount</label>
                  <input type="number" step="0.01" min="0" class="form-control" [(ngModel)]="formTotal" style="font-weight: 600;">
                </div>
              </div>

              <!-- Itemized Table (NO CURRENCY SYMBOLS) -->
              <div class="items-section">
                <div class="items-header">
                  <h4>Item Breakdown ({{ items().length }})</h4>
                  <button type="button" class="btn btn-sm btn-secondary" (click)="addItem()">
                    + Add Item
                  </button>
                </div>

                <div class="items-table-wrapper">
                  <table class="items-table">
                    <thead>
                      <tr>
                        <th>Description</th>
                        <th style="width: 70px;">Qty</th>
                        <th style="width: 100px;">Unit Price</th>
                        <th style="width: 100px;">Total</th>
                        <th style="width: 45px;"></th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of items(); track $index) {
                        <tr>
                          <td>
                            <input type="text" class="form-control table-input" [(ngModel)]="item.description">
                          </td>
                          <td>
                            <input type="number" min="1" class="form-control table-input text-center" [(ngModel)]="item.quantity" (ngModelChange)="updateItemTotal($index)">
                          </td>
                          <td>
                            <input type="number" step="0.01" min="0" class="form-control table-input" [(ngModel)]="item.unitPrice" (ngModelChange)="updateItemTotal($index)">
                          </td>
                          <td>
                            <input type="number" step="0.01" min="0" class="form-control table-input" [(ngModel)]="item.totalPrice" (ngModelChange)="recalculateTotal()">
                          </td>
                          <td class="text-center">
                            <button type="button" class="btn-icon-danger" (click)="removeItem($index)" title="Remove item">
                              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/></svg>
                            </button>
                          </td>
                        </tr>
                      }
                      @if (items().length === 0) {
                        <tr>
                          <td colspan="5" class="empty-items-cell">
                            No individual items parsed. You can add items manually.
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Form Actions -->
              <div class="form-actions-bar">
                <button type="button" class="btn btn-secondary" (click)="resetScanner()">Discard</button>
                <button type="button" class="btn btn-primary" [disabled]="isSaving()" (click)="saveExpense()">
                  @if (isSaving()) {
                    <span>Saving...</span>
                  } @else {
                    <span>Save Expense</span>
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: [`
    .page-header {
      margin-bottom: 1.75rem;
    }

    .header-titles h1 {
      margin-bottom: 0.25rem;
    }

    /* Dropzone */
    .upload-dropzone {
      border: 1px dashed var(--border-subtle);
      border-radius: var(--radius-lg);
      background: var(--bg-card);
      padding: 3.5rem 1.5rem;
      text-align: center;
      cursor: pointer;
      transition: all var(--transition-fast);
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
    }

    .upload-dropzone:hover, .upload-dropzone.drag-over {
      border-color: var(--primary);
      background: var(--primary-subtle);
    }

    .upload-icon-wrapper {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      background: var(--primary-subtle);
      color: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1rem;
    }

    .upload-dropzone h3 {
      font-size: 1.15rem;
      margin-bottom: 0.35rem;
    }

    .upload-dropzone .highlight {
      color: var(--primary);
      text-decoration: underline;
    }

    .dropzone-hints {
      font-size: 0.85rem;
      color: var(--text-muted);
    }

    /* Loading state with clean circular spinner */
    .loading-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3.5rem 1.5rem;
      text-align: center;
      gap: 1.25rem;
    }

    .loading-text h3 {
      font-size: 1.15rem;
      margin-bottom: 0.25rem;
    }

    .loading-text p {
      color: var(--text-secondary);
      font-size: 0.875rem;
      margin: 0;
    }

    /* Preview Layout */
    .preview-layout {
      display: grid;
      grid-template-columns: 320px 1fr;
      gap: 1.5rem;
      align-items: start;
    }

    .receipt-preview-card {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .card-header-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
    }

    .image-viewport {
      width: 100%;
      max-height: 400px;
      overflow: hidden;
      border-radius: var(--radius-md);
      border: 1px solid var(--border-subtle);
      background: var(--bg-surface);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .receipt-image {
      max-width: 100%;
      max-height: 400px;
      object-fit: contain;
    }

    .budget-alert-box {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      padding: 0.85rem;
      border-radius: var(--radius-md);
      font-size: 0.825rem;
    }

    .budget-alert-box.alert-danger {
      background: var(--accent-rose-subtle);
      border: 1px solid rgba(239, 68, 68, 0.25);
      color: var(--accent-rose);
    }

    .budget-alert-box.alert-safe {
      background: var(--accent-emerald-subtle);
      border: 1px solid rgba(16, 185, 129, 0.25);
      color: var(--accent-emerald);
    }

    .alert-body strong {
      display: block;
      margin-bottom: 0.15rem;
    }

    .alert-body p {
      color: inherit;
      margin: 0;
    }

    /* Form Section */
    .form-section-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 1px solid var(--border-subtle);
      padding-bottom: 0.75rem;
    }

    .items-section {
      margin-top: 1.25rem;
    }

    .items-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }

    .items-table-wrapper {
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      overflow-x: auto;
      background: var(--bg-surface);
    }

    .items-table {
      width: 100%;
      border-collapse: collapse;
      font-size: 0.875rem;
    }

    .items-table th {
      text-align: left;
      padding: 0.65rem 0.75rem;
      background: var(--bg-card-hover);
      color: var(--text-secondary);
      font-weight: 500;
      border-bottom: 1px solid var(--border-subtle);
      font-size: 0.8rem;
    }

    .items-table td {
      padding: 0.45rem 0.6rem;
      border-bottom: 1px solid var(--border-subtle);
    }

    .table-input {
      padding: 0.35rem 0.55rem;
      font-size: 0.85rem;
    }

    .text-center { text-align: center; }

    .btn-icon-danger {
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.3rem;
      border-radius: var(--radius-sm);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      transition: all var(--transition-fast);
    }

    .btn-icon-danger:hover {
      color: var(--accent-rose);
    }

    .empty-items-cell {
      text-align: center;
      color: var(--text-muted);
      padding: 1.25rem !important;
    }

    .form-actions-bar {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 0.75rem;
      margin-top: 1.75rem;
      padding-top: 1.25rem;
      border-top: 1px solid var(--border-subtle);
    }

    @media (max-width: 900px) {
      .preview-layout { grid-template-columns: 1fr; }
    }
  `]
})
export class ReceiptScannerComponent implements OnInit {
  private readonly expenseService = inject(ExpenseService);
  readonly categoryService = inject(CategoryService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);

  readonly isDragging = signal<boolean>(false);
  readonly isScanning = signal<boolean>(false);
  readonly isSaving = signal<boolean>(false);
  readonly scanPreview = signal<ScanPreviewDto | null>(null);
  readonly localImagePreviewUrl = signal<string | null>(null);

  // Form Fields
  formMerchant = '';
  formDate = new Date().toISOString().substring(0, 10);
  formCategoryId = 1;
  formTax = 0;
  formTotal = 0;
  items = signal<ScannedItemDto[]>([]);

  ngOnInit(): void {
    if (this.categoryService.categories().length === 0) {
      this.categoryService.loadCategories().subscribe();
    }
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

        if (preview.budgetWarning) {
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
        const errMsg = err?.error?.title || err?.message || 'Failed to scan receipt. Please ensure the backend is running.';
        this.notificationService.error('Scan Failed', errMsg);
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
    this.formTotal = Math.round((itemsSum + (Number(this.formTax) || 0)) * 100) / 100;
  }

  resetScanner(): void {
    this.scanPreview.set(null);
    this.localImagePreviewUrl.set(null);
    this.items.set([]);
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
