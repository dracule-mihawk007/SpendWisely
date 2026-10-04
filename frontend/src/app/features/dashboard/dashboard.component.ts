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
import { Chart, registerables } from 'chart.js';
import { ExpenseService } from '../../core/services/expense.service';
import { CategoryService } from '../../core/services/category.service';
import { ThemeService } from '../../core/services/theme.service';
import { formatCategoryIcon } from '../../core/utils/icon.utils';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard.component.html',
  styleUrls: ['./dashboard.component.css']
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
  private renderTimer?: any;

  readonly currentMonthName = signal<string>(new Date().toLocaleString('default', { month: 'long' }));
  readonly currentYear = signal<number>(new Date().getFullYear());

  constructor() {
    effect(() => {
      this.themeService.currentTheme();
      this.expenseService.expenses();
      this.categoryService.categories();

      if (this.renderTimer) {
        clearTimeout(this.renderTimer);
      }
      this.renderTimer = setTimeout(() => {
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
    if (this.renderTimer) {
      clearTimeout(this.renderTimer);
    }
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
      return { name, amount, percentage, color: data.colors[i] };
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
      if (this.categoryChartInstance) { this.categoryChartInstance.destroy(); }
      const catData = this.categorySpendingData();
      const ctx = this.categoryCanvas.nativeElement.getContext('2d');
      if (ctx) {
        this.categoryChartInstance = new Chart(ctx, {
          type: 'doughnut',
          data: {
            labels: catData.labels,
            datasets: [{ data: catData.values, backgroundColor: catData.colors, borderWidth: isDark ? 2 : 1, borderColor: isDark ? '#0f172a' : '#ffffff', hoverOffset: 6 }]
          },
          options: {
            responsive: true, maintainAspectRatio: false, cutout: '72%',
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: tooltipBg, titleColor: tooltipText, bodyColor: tooltipText, borderColor: gridColor, borderWidth: 1, padding: 10, displayColors: true,
                callbacks: { label: (ctx) => ` ${ctx.label}: ${Number(ctx.raw).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
              }
            }
          }
        });
      }
    }

    if (this.trendCanvas?.nativeElement) {
      if (this.trendChartInstance) { this.trendChartInstance.destroy(); }
      const trendData = this.sixMonthTrendData();
      const ctx = this.trendCanvas.nativeElement.getContext('2d');
      if (ctx) {
        this.trendChartInstance = new Chart(ctx, {
          type: 'bar',
          data: {
            labels: trendData.labels,
            datasets: [{ label: 'Monthly Spend', data: trendData.values, backgroundColor: isDark ? 'rgba(99, 102, 241, 0.85)' : 'rgba(79, 70, 229, 0.85)', hoverBackgroundColor: isDark ? '#818cf8' : '#6366f1', borderRadius: 6, borderSkipped: false }]
          },
          options: {
            responsive: true, maintainAspectRatio: false,
            scales: {
              x: { grid: { display: false }, ticks: { color: textColor, font: { family: 'inherit', size: 11 } } },
              y: { grid: { color: gridColor }, ticks: { color: textColor, font: { family: 'inherit', size: 11 }, callback: (val) => Number(val).toLocaleString('en-US') } }
            },
            plugins: {
              legend: { display: false },
              tooltip: {
                backgroundColor: tooltipBg, titleColor: tooltipText, bodyColor: tooltipText, borderColor: gridColor, borderWidth: 1, padding: 10,
                callbacks: { label: (ctx) => ` Spend: ${Number(ctx.raw).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}` }
              }
            }
          }
        });
      }
    }
  }

  private destroyCharts(): void {
    if (this.categoryChartInstance) { this.categoryChartInstance.destroy(); this.categoryChartInstance = undefined; }
    if (this.trendChartInstance) { this.trendChartInstance.destroy(); this.trendChartInstance = undefined; }
  }
}
