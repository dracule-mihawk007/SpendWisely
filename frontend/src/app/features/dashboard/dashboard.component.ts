import {
  Component,
  inject,
  signal,
  OnInit,
  AfterViewInit,
  OnDestroy,
  computed,
  effect,
  ViewChild,
  ElementRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { Chart, registerables, ChartConfiguration } from 'chart.js';
import { ExpenseService } from '../../core/services/expense.service';
import { CategoryService } from '../../core/services/category.service';
import { ThemeService } from '../../core/services/theme.service';
import { ExpenseDto } from '../../core/models/expense.model';
import { formatCategoryIcon } from '../../core/utils/icon.utils';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="container animate-fade-in">
      <div class="dashboard-header">
        <div>
          <div class="greeting-row">
            <h1>Dashboard</h1>
            <span class="month-pill">
              {{ currentMonthName() }} {{ currentYear() }}
            </span>
          </div>
          <p>Track your monthly spending, category budget limits, and scanned receipts.</p>
        </div>

        <div class="header-cta-group">
          <a routerLink="/scan" class="btn btn-primary">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/>
            </svg>
            <span>Scan Receipt</span>
          </a>
          <a routerLink="/expenses" class="btn btn-secondary">
            <span>All Expenses</span>
          </a>
        </div>
      </div>

      @if (overBudgetCategories().length > 0) {
        <div class="alert-banner animate-fade-in">
          <div class="alert-icon">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
          </div>
          <div class="alert-text">
            <strong>Budget Exceeded Alert</strong>
            <p>
              The following categories exceeded monthly limits:
              @for (c of overBudgetCategories(); track c.id; let last = $last) {
                <span><strong>{{ c.name }}</strong> (Spent: {{ getCategorySpent(c.id) | number:'1.0-0' }} / Limit: {{ c.monthlyBudgetLimit | number:'1.0-0' }}){{ last ? '' : ', ' }}</span>
              }
            </p>
          </div>
        </div>
      }

      <div class="grid-cols-4 stat-cards-row">
        <div class="glass-card stat-card">
          <div class="stat-card-top">
            <span class="stat-label">Spent This Month</span>
            <div class="stat-icon-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/></svg>
            </div>
          </div>
          <div class="stat-value">{{ totalSpentThisMonth() | number:'1.2-2' }}</div>
          <span class="stat-subtext">Across all categories</span>
        </div>

        <div class="glass-card stat-card">
          <div class="stat-card-top">
            <span class="stat-label">Total Monthly Budget</span>
            <div class="stat-icon-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/></svg>
            </div>
          </div>
          <div class="stat-value">{{ totalBudgetLimit() | number:'1.2-2' }}</div>
          <span class="stat-subtext">{{ categoryService.categories().length }} active categories</span>
        </div>

        <div class="glass-card stat-card">
          <div class="stat-card-top">
            <span class="stat-label">Remaining Budget</span>
            <div class="stat-icon-box" [class.icon-rose]="isOverallOverBudget()">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="23 6 13.5 15.5 8.5 10.5 1 18"/><polyline points="17 6 23 6 23 12"/></svg>
            </div>
          </div>
          <div class="stat-value" [class.text-danger]="isOverallOverBudget()">
            {{ remainingBudget() | number:'1.2-2' }}
          </div>
          <span class="stat-subtext" [class.text-danger]="isOverallOverBudget()">
            {{ isOverallOverBudget() ? 'Budget exceeded' : 'Available balance' }}
          </span>
        </div>

        <div class="glass-card stat-card">
          <div class="stat-card-top">
            <span class="stat-label">Logged Receipts</span>
            <div class="stat-icon-box">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/><polyline points="14 2 14 8 20 8"/></svg>
            </div>
          </div>
          <div class="stat-value">{{ expenseService.expenses().length }}</div>
          <span class="stat-subtext">{{ receiptCountWithImages() }} with receipt image</span>
        </div>
      </div>

      <div class="charts-grid">
        <div class="glass-card chart-card">
          <div class="card-title-row">
            <div>
              <h3>Category Breakdown</h3>
              <p>Spending distribution across active categories</p>
            </div>
            <span class="badge badge-primary">{{ categorySpendingData().labels.length }} Categories</span>
          </div>

          <div class="chart-wrapper">
            @if (hasCategorySpending()) {
              <div class="canvas-container">
                <canvas #categoryCanvas></canvas>
              </div>
              <div class="category-legend-list">
                @for (item of categorySpendingLegend(); track item.name) {
                  <div class="legend-row">
                    <div class="legend-left">
                      <span class="legend-color-dot" [style.background-color]="item.color"></span>
                      <span class="legend-label">{{ item.name }}</span>
                    </div>
                    <div class="legend-right">
                      <span class="legend-amount">{{ item.amount | number:'1.2-2' }}</span>
                      <span class="legend-pct">{{ item.percentage | number:'1.0-0' }}%</span>
                    </div>
                  </div>
                }
              </div>
            } @else {
              <div class="chart-empty-state">
                <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
                  <circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/>
                </svg>
                <p>No category spending recorded this month.</p>
                <a routerLink="/scan" class="btn btn-sm btn-primary">Scan First Receipt</a>
              </div>
            }
          </div>
        </div>

        <div class="glass-card chart-card">
          <div class="card-title-row">
            <div>
              <h3>Monthly Spending Trend</h3>
              <p>Total expenditure across the past 6 months</p>
            </div>
            <span class="badge badge-emerald">6-Month Trend</span>
          </div>

          <div class="chart-wrapper">
            <div class="canvas-container-full">
              <canvas #trendCanvas></canvas>
            </div>
          </div>
        </div>
      </div>

      <div class="dashboard-main-grid">
        <div class="glass-card category-breakdown-card">
          <div class="card-title-row">
            <div>
              <h3>Category Budget Health</h3>
              <p>Spending progress relative to monthly category limits</p>
            </div>
            <a routerLink="/categories" class="btn btn-sm btn-secondary">Manage Categories</a>
          </div>

          <div class="category-bars-list">
            @for (cat of categoryService.categories(); track cat.id) {
              @let spent = getCategorySpent(cat.id);
              @let pct = cat.monthlyBudgetLimit > 0 ? (spent / cat.monthlyBudgetLimit) * 100 : 0;
              <div class="category-bar-item">
                <div class="category-bar-header">
                  <div class="cat-title-group">
                    <span class="cat-icon-badge" [style.background-color]="cat.colorHex + '20'">
                      {{ getCategoryIcon(cat.icon) }}
                    </span>
                    <span class="cat-name">{{ cat.name }}</span>
                  </div>
                  <div class="cat-spending-text">
                    <span class="spent-number">{{ spent | number:'1.0-0' }}</span>
                    <span class="limit-divider">/ {{ cat.monthlyBudgetLimit | number:'1.0-0' }}</span>
                    <span class="pct-badge" [class.pct-over]="pct >= 100" [class.pct-warn]="pct >= 85 && pct < 100">
                      {{ pct | number:'1.0-0' }}%
                    </span>
                  </div>
                </div>

                <div class="progress-track">
                  <div 
                    class="progress-fill" 
                    [style.width.%]="pct > 100 ? 100 : pct"
                    [style.background-color]="getBarColor(pct, cat.colorHex)">
                  </div>
                </div>
              </div>
            }

            @if (categoryService.categories().length === 0) {
              <div class="empty-hint">
                <p>No categories found.</p>
                <a routerLink="/categories" class="btn btn-sm btn-primary">Create Category</a>
              </div>
            }
          </div>
        </div>

        <div class="glass-card scan-quick-card">
          <div class="card-title-row" style="margin-bottom: 0.75rem;">
            <div>
              <h3>Receipt Scanner</h3>
              <p>Upload a receipt image for automated itemization.</p>
            </div>
          </div>

          <div class="scan-upload-area" (click)="router.navigate(['/scan'])">
            <div class="scan-icon">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><polyline points="17 8 12 3 7 8"/><line x1="12" x2="12" y1="3" y2="15"/>
              </svg>
            </div>
            <span class="scan-area-title">Click to Upload Receipt</span>
            <span class="scan-area-sub">Supports PNG, JPG, WebP</span>
          </div>

          <div class="scan-features-list">
            <div class="scan-feature-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Automatic item & tax extraction</span>
            </div>
            <div class="scan-feature-item">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="20 6 9 17 4 12"/></svg>
              <span>Category auto-suggestion & budget verification</span>
            </div>
          </div>
        </div>
      </div>

      <div class="glass-card recent-expenses-card" style="margin-top: 1.5rem;">
        <div class="card-title-row">
          <div>
            <h3>Recent Transactions</h3>
            <p>Recently logged expenses</p>
          </div>
          <a routerLink="/expenses" class="btn btn-sm btn-secondary">View All</a>
        </div>

        @if (recentExpenses().length === 0) {
          <div class="empty-hint" style="padding: 2rem 1rem;">
            <p>No transactions logged yet.</p>
          </div>
        } @else {
          <div class="recent-list">
            @for (expense of recentExpenses(); track expense.id) {
              <div class="recent-row">
                <div class="recent-left">
                  <span class="recent-icon-badge" [style.background-color]="getCategoryColor(expense.categoryId) + '20'">
                    {{ getCategoryIconById(expense.categoryId) }}
                  </span>
                  <div>
                    <div class="recent-merchant">{{ expense.merchantName }}</div>
                    <span class="recent-meta">{{ expense.categoryName }} • {{ expense.expenseDate | date:'mediumDate' }}</span>
                  </div>
                </div>

                <div class="recent-right">
                  <span class="recent-amount">{{ expense.totalAmount | number:'1.2-2' }}</span>
                  @if (expense.receiptImageUrl) {
                    <span class="badge badge-primary">Receipt</span>
                  }
                </div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `,
  styles: [`
    .dashboard-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.75rem;
    }

    .greeting-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 0.25rem;
    }

    .month-pill {
      display: inline-flex;
      align-items: center;
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--text-secondary);
      background: var(--bg-card-hover);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-sm);
      padding: 0.2rem 0.6rem;
    }

    .header-cta-group {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .alert-banner {
      display: flex;
      align-items: flex-start;
      gap: 0.85rem;
      padding: 0.95rem 1.25rem;
      border-radius: var(--radius-md);
      background: var(--accent-rose-subtle);
      border: 1px solid rgba(239, 68, 68, 0.25);
      margin-bottom: 1.5rem;
      color: var(--accent-rose);
    }

    .alert-icon {
      flex-shrink: 0;
      margin-top: 1px;
    }

    .alert-text strong {
      display: block;
      font-size: 0.9rem;
      margin-bottom: 0.15rem;
    }

    .alert-text p {
      font-size: 0.85rem;
      color: inherit;
      margin: 0;
    }

    .stat-cards-row {
      margin-bottom: 1.5rem;
    }

    .stat-card {
      display: flex;
      flex-direction: column;
      gap: 0.35rem;
      padding: 1.25rem 1.35rem;
    }

    .stat-card-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.25rem;
    }

    .stat-label {
      font-size: 0.775rem;
      font-weight: 600;
      color: var(--text-secondary);
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }

    .stat-icon-box {
      width: 32px;
      height: 32px;
      border-radius: var(--radius-sm);
      background: var(--primary-subtle);
      color: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .icon-rose {
      background: var(--accent-rose-subtle);
      color: var(--accent-rose);
    }

    .stat-value {
      font-family: var(--font-heading);
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--text-primary);
      letter-spacing: -0.02em;
    }

    .stat-subtext {
      font-size: 0.775rem;
      color: var(--text-muted);
    }

    .text-danger {
      color: var(--accent-rose) !important;
    }

    .charts-grid {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 1.25rem;
      margin-bottom: 1.5rem;
    }

    .chart-card {
      padding: 1.35rem;
      display: flex;
      flex-direction: column;
    }

    .chart-wrapper {
      position: relative;
      flex: 1;
      min-height: 240px;
      display: flex;
      align-items: center;
    }

    .canvas-container {
      position: relative;
      height: 220px;
      width: 48%;
      flex-shrink: 0;
    }

    .canvas-container-full {
      position: relative;
      height: 220px;
      width: 100%;
    }

    .category-legend-list {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
      padding-left: 1rem;
      max-height: 220px;
      overflow-y: auto;
    }

    .legend-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      font-size: 0.8rem;
    }

    .legend-left {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      min-width: 0;
    }

    .legend-color-dot {
      width: 10px;
      height: 10px;
      border-radius: 50%;
      flex-shrink: 0;
    }

    .legend-label {
      color: var(--text-secondary);
      font-weight: 500;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .legend-right {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      flex-shrink: 0;
    }

    .legend-amount {
      font-weight: 600;
      color: var(--text-primary);
    }

    .legend-pct {
      font-size: 0.725rem;
      color: var(--text-muted);
      width: 28px;
      text-align: right;
    }

    .chart-empty-state {
      width: 100%;
      height: 200px;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      color: var(--text-muted);
      text-align: center;
    }

    .chart-empty-state svg {
      opacity: 0.4;
    }

    .dashboard-main-grid {
      display: grid;
      grid-template-columns: 1.6fr 1fr;
      gap: 1.25rem;
    }

    .card-title-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1.25rem;
    }

    .card-title-row h3 {
      font-size: 1.15rem;
      margin-bottom: 0.15rem;
    }

    .card-title-row p {
      font-size: 0.825rem;
      color: var(--text-secondary);
      margin: 0;
    }

    .category-bars-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .category-bar-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.35rem;
    }

    .cat-title-group {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      min-width: 0;
    }

    .cat-icon-badge {
      width: 30px;
      height: 30px;
      border-radius: var(--radius-sm);
      display: inline-flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      flex-shrink: 0;
    }

    .cat-name {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-primary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .cat-spending-text {
      font-size: 0.85rem;
      display: flex;
      align-items: center;
      gap: 0.35rem;
      flex-shrink: 0;
    }

    .spent-number {
      font-weight: 600;
      color: var(--text-primary);
    }

    .limit-divider {
      color: var(--text-muted);
      font-size: 0.8rem;
    }

    .pct-badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.1rem 0.45rem;
      border-radius: var(--radius-sm);
      background: var(--bg-card-hover);
      color: var(--text-secondary);
    }

    .pct-warn {
      background: var(--accent-amber-subtle);
      color: var(--accent-amber);
    }

    .pct-over {
      background: var(--accent-rose-subtle);
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

    .scan-quick-card {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .scan-upload-area {
      border: 1px dashed var(--border-subtle);
      border-radius: var(--radius-md);
      padding: 1.75rem 1rem;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      cursor: pointer;
      background: var(--bg-surface);
      transition: all var(--transition-fast);
    }

    .scan-upload-area:hover {
      border-color: var(--primary);
      background: var(--primary-subtle);
    }

    .scan-icon {
      color: var(--primary);
      margin-bottom: 0.25rem;
    }

    .scan-area-title {
      font-size: 0.925rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .scan-area-sub {
      font-size: 0.775rem;
      color: var(--text-muted);
    }

    .scan-features-list {
      display: flex;
      flex-direction: column;
      gap: 0.45rem;
    }

    .scan-feature-item {
      display: flex;
      align-items: center;
      gap: 0.45rem;
      font-size: 0.8rem;
      color: var(--text-secondary);
    }

    .scan-feature-item svg {
      color: var(--accent-emerald);
      flex-shrink: 0;
    }

    .recent-list {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .recent-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 0.95rem;
      border-radius: var(--radius-sm);
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
    }

    .recent-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .recent-icon-badge {
      width: 34px;
      height: 34px;
      border-radius: var(--radius-sm);
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1.1rem;
      flex-shrink: 0;
    }

    .recent-merchant {
      font-size: 0.9rem;
      font-weight: 600;
      color: var(--text-primary);
    }

    .recent-meta {
      font-size: 0.75rem;
      color: var(--text-muted);
    }

    .recent-right {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .recent-amount {
      font-family: var(--font-heading);
      font-weight: 600;
      font-size: 0.975rem;
      color: var(--text-primary);
    }

    .empty-hint {
      text-align: center;
      color: var(--text-muted);
      padding: 1rem;
    }

    @media (max-width: 900px) {
      .charts-grid { grid-template-columns: 1fr; }
      .dashboard-main-grid { grid-template-columns: 1fr; }
      .dashboard-header { flex-direction: column; align-items: flex-start; gap: 1rem; }
    }
  `]
})
export class DashboardComponent implements OnInit, AfterViewInit, OnDestroy {
  readonly expenseService = inject(ExpenseService);
  readonly categoryService = inject(CategoryService);
  readonly themeService = inject(ThemeService);
  readonly router = inject(Router);

  @ViewChild('categoryCanvas') categoryCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('trendCanvas') trendCanvas?: ElementRef<HTMLCanvasElement>;

  private categoryChartInstance?: Chart;
  private trendChartInstance?: Chart;

  readonly currentMonthName = signal<string>(new Date().toLocaleString('default', { month: 'long' }));
  readonly currentYear = signal<number>(new Date().getFullYear());

  constructor() {
    effect(() => {
      this.themeService.currentTheme();
      this.expenseService.expenses();
      this.categoryService.categories();

      setTimeout(() => {
        this.renderCharts();
      }, 50);
    });
  }

  ngOnInit(): void {
    this.expenseService.loadExpenses().subscribe();
    this.categoryService.loadCategories().subscribe();
  }

  ngAfterViewInit(): void {
    this.renderCharts();
  }

  ngOnDestroy(): void {
    this.destroyCharts();
  }

  getCategoryIcon(icon: string | null | undefined): string {
    return formatCategoryIcon(icon);
  }

  getCategoryIconById(catId: number): string {
    const cat = this.categoryService.categories().find(c => c.id === catId);
    return formatCategoryIcon(cat?.icon);
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

  totalSpentThisMonth = computed(() => {
    const expenses = this.expenseService.expenses();
    const now = new Date();
    const currentMonth = now.getMonth();
    const currentYear = now.getFullYear();

    return expenses
      .filter(e => {
        const d = new Date(e.expenseDate);
        return d.getMonth() === currentMonth && d.getFullYear() === currentYear;
      })
      .reduce((sum, e) => sum + e.totalAmount, 0);
  });

  totalBudgetLimit = computed(() => {
    return this.categoryService.categories().reduce((sum, c) => sum + (c.monthlyBudgetLimit || 0), 0);
  });

  remainingBudget = computed(() => {
    return Math.max(0, this.totalBudgetLimit() - this.totalSpentThisMonth());
  });

  isOverallOverBudget = computed(() => {
    return this.totalBudgetLimit() > 0 && this.totalSpentThisMonth() > this.totalBudgetLimit();
  });

  receiptCountWithImages = computed(() => {
    return this.expenseService.expenses().filter(e => !!e.receiptImageUrl).length;
  });

  overBudgetCategories = computed(() => {
    return this.categoryService.categories().filter(c => {
      const spent = this.getCategorySpent(c.id);
      return c.monthlyBudgetLimit > 0 && spent >= c.monthlyBudgetLimit;
    });
  });

  recentExpenses = computed(() => {
    return this.expenseService.expenses().slice(0, 5);
  });

  categorySpendingData = computed(() => {
    const categories = this.categoryService.categories();
    const labels: string[] = [];
    const values: number[] = [];
    const colors: string[] = [];

    for (const cat of categories) {
      const spent = this.getCategorySpent(cat.id);
      if (spent > 0) {
        labels.push(cat.name);
        values.push(spent);
        colors.push(cat.colorHex || '#4f46e5');
      }
    }

    return { labels, values, colors };
  });

  hasCategorySpending = computed(() => {
    return this.categorySpendingData().values.length > 0;
  });

  categorySpendingLegend = computed(() => {
    const data = this.categorySpendingData();
    const total = data.values.reduce((s, v) => s + v, 0);

    return data.labels.map((name, i) => {
      const amount = data.values[i];
      const percentage = total > 0 ? (amount / total) * 100 : 0;
      return {
        name,
        amount,
        percentage,
        color: data.colors[i]
      };
    });
  });

  sixMonthTrendData = computed(() => {
    const expenses = this.expenseService.expenses();
    const labels: string[] = [];
    const values: number[] = [];
    const now = new Date();

    for (let i = 5; i >= 0; i--) {
      const targetDate = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const m = targetDate.getMonth();
      const y = targetDate.getFullYear();
      const monthName = targetDate.toLocaleString('default', { month: 'short' });

      labels.push(monthName);

      const sum = expenses
        .filter(e => {
          const d = new Date(e.expenseDate);
          return d.getMonth() === m && d.getFullYear() === y;
        })
        .reduce((acc, e) => acc + e.totalAmount, 0);

      values.push(sum);
    }

    return { labels, values };
  });

  getBarColor(pct: number, defaultColor: string): string {
    if (pct >= 100) return 'var(--accent-rose)';
    if (pct >= 85) return 'var(--accent-amber)';
    return defaultColor || 'var(--primary)';
  }

  getCategoryColor(catId: number): string {
    const cat = this.categoryService.categories().find(c => c.id === catId);
    return cat?.colorHex || '#4f46e5';
  }

  private renderCharts(): void {
    const isDark = this.themeService.currentTheme() === 'dark';
    const textColor = isDark ? '#94a3b8' : '#64748b';
    const gridColor = isDark ? 'rgba(255, 255, 255, 0.06)' : 'rgba(0, 0, 0, 0.05)';
    const tooltipBg = isDark ? '#1e293b' : '#ffffff';
    const tooltipText = isDark ? '#f8fafc' : '#0f172a';

    if (this.categoryCanvas?.nativeElement && this.hasCategorySpending()) {
      if (this.categoryChartInstance) {
        this.categoryChartInstance.destroy();
      }

      const catData = this.categorySpendingData();
      const ctx = this.categoryCanvas.nativeElement.getContext('2d');

      if (ctx) {
        this.categoryChartInstance = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: catData.labels,
            datasets: [
              {
                data: catData.values,
                backgroundColor: catData.colors,
                borderWidth: isDark ? 2 : 1,
                borderColor: isDark ? '#0f172a' : '#ffffff',
                hoverOffset: 6
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            cutout: '72%',
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: tooltipBg,
                titleColor: tooltipText,
                bodyColor: tooltipText,
                borderColor: gridColor,
                borderWidth: 1,
                padding: 10,
                displayColors: true,
                callbacks: {
                  label: (ctx) => {
                    const val = Number(ctx.raw) || 0;
                    return ` ${ctx.label}: ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                  }
                }
              }
            }
          }
        });
      }
    }

    if (this.trendCanvas?.nativeElement) {
      if (this.trendChartInstance) {
        this.trendChartInstance.destroy();
      }

      const trendData = this.sixMonthTrendData();
      const ctx = this.trendCanvas.nativeElement.getContext('2d');

      if (ctx) {
        this.trendChartInstance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: trendData.labels,
            datasets: [
              {
                label: 'Monthly Spend',
                data: trendData.values,
                backgroundColor: isDark ? 'rgba(99, 102, 241, 0.85)' : 'rgba(79, 70, 229, 0.85)',
                hoverBackgroundColor: isDark ? '#818cf8' : '#6366f1',
                borderRadius: 6,
                borderSkipped: false
              }
            ]
          },
          options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
              x: {
                grid: { display: false },
                ticks: { color: textColor, font: { family: 'inherit', size: 11 } }
              },
              y: {
                grid: { color: gridColor },
                ticks: {
                  color: textColor,
                  font: { family: 'inherit', size: 11 },
                  callback: (val) => Number(val).toLocaleString('en-US')
                }
              }
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: tooltipBg,
                titleColor: tooltipText,
                bodyColor: tooltipText,
                borderColor: gridColor,
                borderWidth: 1,
                padding: 10,
                callbacks: {
                  label: (ctx) => {
                    const val = Number(ctx.raw) || 0;
                    return ` Spend: ${val.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
                  }
                }
              }
            }
          }
        });
      }
    }
  }

  private destroyCharts(): void {
    if (this.categoryChartInstance) {
      this.categoryChartInstance.destroy();
      this.categoryChartInstance = undefined;
    }
    if (this.trendChartInstance) {
      this.trendChartInstance.destroy();
      this.trendChartInstance = undefined;
    }
  }
}
