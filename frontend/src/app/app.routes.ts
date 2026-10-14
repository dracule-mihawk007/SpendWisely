import { Routes } from '@angular/router';
import { authGuard, unauthGuard } from './core/guards/auth.guard';

export const routes: Routes = [
  {
    path: '',
    redirectTo: 'dashboard',
    pathMatch: 'full'
  },
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent),
    canActivate: [unauthGuard],
    title: 'SpendWisely | Sign In'
  },
  {
    path: 'dashboard',
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
    canActivate: [authGuard],
    title: 'SpendWisely | Dashboard'
  },
  {
    path: 'scan',
    loadComponent: () => import('./features/scanner/receipt-scanner.component').then(m => m.ReceiptScannerComponent),
    canActivate: [authGuard],
    title: 'SpendWisely | Receipt Scanner'
  },
  {
    path: 'expenses',
    loadComponent: () => import('./features/expenses/expense-list.component').then(m => m.ExpenseListComponent),
    canActivate: [authGuard],
    title: 'SpendWisely | Expenses & Transactions'
  },
  {
    path: 'categories',
    loadComponent: () => import('./features/categories/category-list.component').then(m => m.CategoryListComponent),
    canActivate: [authGuard],
    title: 'SpendWisely | Categories & Budgets'
  },
  {
    path: 'privacy-policy',
    loadComponent: () => import('./features/legal/privacy-policy.component').then(m => m.PrivacyPolicyComponent),
    title: 'SpendWisely | Privacy Policy'
  },
  {
    path: 'privacy',
    redirectTo: 'privacy-policy',
    pathMatch: 'full'
  },
  {
    path: 'terms',
    loadComponent: () => import('./features/legal/terms-conditions.component').then(m => m.TermsConditionsComponent),
    title: 'SpendWisely | Terms & Conditions'
  },
  {
    path: 'terms-and-conditions',
    redirectTo: 'terms',
    pathMatch: 'full'
  },
  {
    path: '**',
    redirectTo: 'dashboard'
  }
];
