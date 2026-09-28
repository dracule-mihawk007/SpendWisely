import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    title: 'SpendWisely — Dashboard'
  },
  {
    path: 'scan',
    loadComponent: () => import('./features/scanner/receipt-scanner.component').then(m => m.ReceiptScannerComponent),
    title: 'SpendWisely — Receipt Scanner'
  },
  {
    path: 'expenses',
    loadComponent: () => import('./features/expenses/expense-list.component').then(m => m.ExpenseListComponent),
    title: 'SpendWisely — Expenses & Transactions'
  },
  {
    path: 'categories',
    loadComponent: () => import('./features/categories/category-list.component').then(m => m.CategoryListComponent),
    title: 'SpendWisely — Categories & Budgets'
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
