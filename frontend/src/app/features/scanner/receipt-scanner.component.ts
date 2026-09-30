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
  template: `
    <div class="container animate-fade-in">
      <div class="page-header">
        <div class="header-titles">
          <h1>Log Expense</h1>
          <p>Scan a receipt for automated extraction or manually log your transaction if you don't have a receipt.</p>
        </div>

        <!-- Mode Toggle Tabs -->
        <div class="mode-switch-wrapper">
          <div class="mode-tabs">
            <button 
              type="button" 
              class="mode-tab-btn" 
              [class.active]="activeMode() === 'scan'"
              (click)="setMode('scan')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/>
              </svg>
              <span>Scan Receipt</span>
            </button>

            <button 
              type="button" 
              class="mode-tab-btn" 
              [class.active]="activeMode() === 'manual'"
              (click)="setMode('manual')">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
              <span>Enter Manually</span>
            </button>
          </div>
        </div>
      </div>

      <!-- SCAN MODE: Upload Drop Zone -->
      @if (activeMode() === 'scan' && !scanPreview() && !isScanning()) {
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
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
              <polyline points="17 8 12 3 7 8"/>
              <line x1="12" x2="12" y1="3" y2="15"/>
            </svg>
          </div>

          <h3>Drag and drop your receipt here, or <span class="highlight">browse</span></h3>
          <p class="dropzone-hints">Supports PNG, JPG, JPEG, and WebP (up to 10MB)</p>

          <div class="dropzone-footer-hint" (click)="$event.stopPropagation()">
            <span>Forgot or lost your receipt?</span>
            <button type="button" class="link-btn" (click)="setMode('manual')">
              Enter details manually instead →
            </button>
          </div>
        </div>
      }

      <!-- Clean Circular Loading Spinner during scanning -->
      @if (activeMode() === 'scan' && isScanning()) {
        <div class="glass-card loading-card">
          <div class="circular-spinner"></div>
          <div class="loading-text">
            <h3>Processing Receipt...</h3>
            <p>Extracting merchant, date, tax, totals, and item breakdown</p>
          </div>
        </div>
      }

      <!-- SCAN MODE: Result & Verification Form -->
      @if (activeMode() === 'scan' && scanPreview(); as preview) {
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

              <!-- Budget Warning Alert Box -->
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

          <!-- Right Column: Verification & Editable Form -->
          <div class="preview-main">
            <div class="glass-card">
              <div class="form-section-title">
                <h3>Extracted Details</h3>
                <span class="badge badge-primary">Review & Confirm</span>
              </div>

              <div class="grid-cols-2" style="margin-top: 1.25rem;">
                <div class="form-group">
                  <label class="form-label">Merchant Name</label>
                  <input type="text" class="form-control" [(ngModel)]="formMerchant" placeholder="Merchant or Store name">
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
                      <option [value]="cat.id">{{ getCategoryIcon(cat.icon) }} {{ cat.name }} (Limit: {{ cat.monthlyBudgetLimit }})</option>
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

              <!-- Itemized Table -->
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
                        <th style="width: 105px;">Unit Price</th>
                        <th style="width: 105px;">Total</th>
                        <th style="width: 45px;"></th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of items(); track $index) {
                        <tr>
                          <td>
                            <input type="text" class="form-control table-input" [(ngModel)]="item.description" placeholder="Item description">
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

      <!-- MANUAL MODE: Direct Expense Entry (No Receipt Required) -->
      @if (activeMode() === 'manual') {
        <div class="preview-layout">
          <!-- Left Column: Helper Card & Category Insight -->
          <div class="preview-sidebar">
            <div class="glass-card receipt-preview-card">
              <div class="card-header-row">
                <h4>Manual Entry</h4>
                <span class="badge badge-primary">Direct Entry</span>
              </div>

              <div class="manual-info-panel">
                <div class="manual-info-icon">
                  <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                    <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/><line x1="16" y1="13" x2="8" y2="13"/><line x1="16" y1="17" x2="8" y2="17"/><polyline points="10 9 9 9 8 9"/>
                  </svg>
                </div>
                <h5>Forgot the receipt?</h5>
                <p>No problem! Log transactions anytime by typing the merchant, choosing the category, and entering the total.</p>
              </div>

              @if (selectedCategory(); as cat) {
                <div class="category-budget-card">
                  <div class="budget-card-title">
                    <span class="cat-chip" [style.background-color]="cat.colorHex + '20'" [style.color]="cat.colorHex">
                      {{ getCategoryIcon(cat.icon) }} {{ cat.name }}
                    </span>
                  </div>
                  <div class="budget-row">
                    <span>Monthly Limit:</span>
                    <strong>{{ cat.monthlyBudgetLimit | number:'1.2-2' }}</strong>
                  </div>
                  <div class="budget-tip">
                    <span>Logging {{ formTotal | number:'1.2-2' }} under {{ cat.name }}</span>
                  </div>
                </div>
              }

              <button type="button" class="btn btn-secondary btn-block" (click)="setMode('scan')" style="margin-top: 0.5rem;">
                <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/>
                </svg>
                <span>Found receipt? Scan image</span>
              </button>
            </div>
          </div>

          <!-- Right Column: Manual Entry Form -->
          <div class="preview-main">
            <div class="glass-card">
              <div class="form-section-title">
                <h3>Expense Details</h3>
                <span class="badge badge-emerald">Manual Mode</span>
              </div>

              <div class="grid-cols-2" style="margin-top: 1.25rem;">
                <div class="form-group">
                  <label class="form-label">Merchant / Store Name *</label>
                  <input 
                    type="text" 
                    class="form-control" 
                    placeholder="e.g. Starbucks, Uber, Walmart..." 
                    [(ngModel)]="formMerchant">
                </div>

                <div class="form-group">
                  <label class="form-label">Date *</label>
                  <input type="date" class="form-control" [(ngModel)]="formDate">
                </div>
              </div>

              <div class="grid-cols-3">
                <div class="form-group">
                  <label class="form-label">Category *</label>
                  <select class="form-select" [(ngModel)]="formCategoryId">
                    @for (cat of categoryService.categories(); track cat.id) {
                      <option [value]="cat.id">{{ getCategoryIcon(cat.icon) }} {{ cat.name }} (Limit: {{ cat.monthlyBudgetLimit }})</option>
                    }
                  </select>
                </div>

                <div class="form-group">
                  <label class="form-label">Tax Amount</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    class="form-control" 
                    [(ngModel)]="formTax" 
                    (ngModelChange)="recalculateTotal()"
                    placeholder="0.00">
                </div>

                <div class="form-group">
                  <label class="form-label">Total Amount *</label>
                  <input 
                    type="number" 
                    step="0.01" 
                    min="0" 
                    class="form-control" 
                    [(ngModel)]="formTotal" 
                    style="font-weight: 700; font-size: 1.05rem;"
                    placeholder="0.00">
                </div>
              </div>

              <!-- Item Breakdown (Optional) -->
              <div class="items-section">
                <div class="items-header">
                  <div>
                    <h4>Item Breakdown (Optional)</h4>
                    <small style="color: var(--text-muted); font-size: 0.775rem;">Add line items if you want detailed tracking</small>
                  </div>
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
                        <th style="width: 105px;">Unit Price</th>
                        <th style="width: 105px;">Total</th>
                        <th style="width: 45px;"></th>
                      </tr>
                    </thead>
                    <tbody>
                      @for (item of items(); track $index) {
                        <tr>
                          <td>
                            <input type="text" class="form-control table-input" [(ngModel)]="item.description" placeholder="Item description">
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
                            No individual items added yet. You can add items or just specify the total above.
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              </div>

              <!-- Form Actions -->
              <div class="form-actions-bar">
                <button type="button" class="btn btn-secondary" (click)="clearManualForm()">Clear</button>
                <button 
                  type="button" 
                  class="btn btn-primary" 
                  [disabled]="isSaving() || !formMerchant.trim() || formTotal <= 0" 
                  (click)="saveExpense()">
                  @if (isSaving()) {
                    <div class="spinner-sm"></div>
                    <span>Saving Expense...</span>
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
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.75rem;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .header-titles h1 {
      margin-bottom: 0.25rem;
    }

    .mode-switch-wrapper {
      display: flex;
      align-items: center;
    }

    .mode-tabs {
      display: flex;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 0.25rem;
      gap: 0.25rem;
    }

    .mode-tab-btn {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      padding: 0.5rem 0.95rem;
      font-size: 0.85rem;
      font-weight: 600;
      border-radius: var(--radius-sm);
      border: none;
      background: transparent;
      color: var(--text-secondary);
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .mode-tab-btn.active {
      background: var(--primary);
      color: #ffffff;
      box-shadow: 0 2px 8px rgba(99, 102, 241, 0.35);
    }

    .mode-tab-btn:hover:not(.active) {
      color: var(--text-primary);
      background: var(--bg-card-hover);
    }

    /* Dropzone */
    .upload-dropzone {
      border: 2px dashed var(--border-subtle);
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

    .dropzone-footer-hint {
      margin-top: 1.5rem;
      padding-top: 1rem;
      border-top: 1px dashed var(--border-subtle);
      display: flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.825rem;
      color: var(--text-secondary);
    }

    .link-btn {
      background: transparent;
      border: none;
      color: var(--primary);
      font-weight: 600;
      font-size: 0.825rem;
      cursor: pointer;
      padding: 0;
      text-decoration: underline;
    }

    .link-btn:hover {
      color: var(--primary-hover);
    }

    /* Loading state */
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

    /* Preview & Manual Layout */
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

    .manual-info-panel {
      padding: 1.25rem;
      border-radius: var(--radius-md);
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      text-align: center;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.5rem;
    }

    .manual-info-icon {
      color: var(--primary);
      margin-bottom: 0.25rem;
    }

    .manual-info-panel h5 {
      font-size: 0.95rem;
      margin: 0;
    }

    .manual-info-panel p {
      font-size: 0.8rem;
      color: var(--text-secondary);
      margin: 0;
      line-height: 1.4;
    }

    .category-budget-card {
      padding: 0.85rem;
      border-radius: var(--radius-md);
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      font-size: 0.825rem;
    }

    .cat-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      padding: 0.2rem 0.55rem;
      border-radius: var(--radius-sm);
      font-weight: 600;
      font-size: 0.8rem;
    }

    .budget-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      color: var(--text-secondary);
    }

    .budget-row strong {
      color: var(--text-primary);
    }

    .budget-tip {
      font-size: 0.75rem;
      color: var(--text-muted);
      border-top: 1px solid var(--border-subtle);
      padding-top: 0.4rem;
    }

    .btn-block {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.4rem;
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

    .spinner-sm {
      width: 14px;
      height: 14px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: currentColor;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
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
