import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-page-wrapper">
      <div class="auth-ambient-glow glow-1"></div>
      <div class="auth-ambient-glow glow-2"></div>

      <div class="auth-card glass-card animate-fade-in">
        <!-- Brand Header -->
        <div class="auth-header">
          <div class="brand-logo-badge">
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
              <polygon points="12 2 2 7 12 12 22 7 12 2"/>
              <polyline points="2 17 12 22 22 17"/>
              <polyline points="2 12 12 17 22 12"/>
            </svg>
          </div>
          <h1>SpendWisely</h1>
          <p class="auth-subtitle">Smart Expense & Financial Management</p>
        </div>

        <!-- Mode Tabs -->
        <div class="tab-switch">
          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="activeTab() === 'login'"
            (click)="setTab('login')">
            Sign In
          </button>
          <button 
            type="button" 
            class="tab-btn" 
            [class.active]="activeTab() === 'register'"
            (click)="setTab('register')">
            Create Account
          </button>
        </div>

        <!-- Error Alert -->
        @if (errorMessage()) {
          <div class="alert-banner animate-fade-in">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
              <circle cx="12" cy="12" r="10"/><line x1="12" y1="8" x2="12" y2="12"/><line x1="12" y1="16" x2="12.01" y2="16"/>
            </svg>
            <span>{{ errorMessage() }}</span>
          </div>
        }

        <!-- LOGIN FORM -->
        @if (activeTab() === 'login') {
          <form (ngSubmit)="onLogin()" class="auth-form animate-fade-in">
            <div class="form-group">
              <label class="form-label" for="login-email">Email Address</label>
              <div class="input-with-icon">
                <svg class="input-icon-prefix" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input 
                  id="login-email" 
                  type="email" 
                  class="form-control" 
                  placeholder="name@example.com" 
                  [(ngModel)]="loginEmail" 
                  name="loginEmail" 
                  required 
                  autocomplete="email">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="login-password">Password</label>
              <div class="input-with-icon">
                <svg class="input-icon-prefix" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input 
                  id="login-password" 
                  [type]="showPassword() ? 'text' : 'password'" 
                  class="form-control" 
                  placeholder="••••••••" 
                  [(ngModel)]="loginPassword" 
                  name="loginPassword" 
                  required 
                  autocomplete="current-password">
                <button 
                  type="button" 
                  class="btn-toggle-eye" 
                  (click)="togglePasswordVisibility()" 
                  [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
                  title="Toggle password visibility">
                  @if (!showPassword()) {
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  } @else {
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                      <line x1="2" y1="2" x2="22" y2="22"/>
                    </svg>
                  }
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              class="btn btn-primary btn-block submit-btn" 
              [disabled]="isLoading() || !loginEmail || !loginPassword">
              @if (isLoading()) {
                <div class="spinner-sm"></div>
                <span>Signing in...</span>
              } @else {
                <span>Sign In</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M5 12h14M12 5l7 7-7 7"/>
                </svg>
              }
            </button>
          </form>
        }

        <!-- REGISTER FORM -->
        @if (activeTab() === 'register') {
          <form (ngSubmit)="onRegister()" class="auth-form animate-fade-in">
            <div class="form-group">
              <label class="form-label" for="reg-name">Your Name</label>
              <div class="input-with-icon">
                <svg class="input-icon-prefix" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/>
                </svg>
                <input 
                  id="reg-name" 
                  type="text" 
                  class="form-control" 
                  placeholder="e.g. Alex Johnson" 
                  [(ngModel)]="registerName" 
                  name="registerName" 
                  required 
                  autocomplete="name">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="reg-email">Email Address</label>
              <div class="input-with-icon">
                <svg class="input-icon-prefix" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/>
                  <polyline points="22,6 12,13 2,6"/>
                </svg>
                <input 
                  id="reg-email" 
                  type="email" 
                  class="form-control" 
                  placeholder="name@example.com" 
                  [(ngModel)]="registerEmail" 
                  name="registerEmail" 
                  required 
                  autocomplete="email">
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="reg-password">Password</label>
              <div class="input-with-icon">
                <svg class="input-icon-prefix" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input 
                  id="reg-password" 
                  [type]="showPassword() ? 'text' : 'password'" 
                  class="form-control" 
                  placeholder="At least 6 characters" 
                  [(ngModel)]="registerPassword" 
                  name="registerPassword" 
                  required 
                  autocomplete="new-password">
                <button 
                  type="button" 
                  class="btn-toggle-eye" 
                  (click)="togglePasswordVisibility()" 
                  [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
                  title="Toggle password visibility">
                  @if (!showPassword()) {
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  } @else {
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                      <line x1="2" y1="2" x2="22" y2="22"/>
                    </svg>
                  }
                </button>
              </div>
            </div>

            <div class="form-group">
              <label class="form-label" for="reg-confirm">Confirm Password</label>
              <div class="input-with-icon">
                <svg class="input-icon-prefix" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <rect x="3" y="11" width="18" height="11" rx="2" ry="2"/>
                  <path d="M7 11V7a5 5 0 0 1 10 0v4"/>
                </svg>
                <input 
                  id="reg-confirm" 
                  [type]="showPassword() ? 'text' : 'password'" 
                  class="form-control" 
                  placeholder="Re-enter password" 
                  [(ngModel)]="registerConfirm" 
                  name="registerConfirm" 
                  required 
                  autocomplete="new-password">
                <button 
                  type="button" 
                  class="btn-toggle-eye" 
                  (click)="togglePasswordVisibility()" 
                  [attr.aria-label]="showPassword() ? 'Hide password' : 'Show password'"
                  title="Toggle password visibility">
                  @if (!showPassword()) {
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/>
                      <circle cx="12" cy="12" r="3"/>
                    </svg>
                  } @else {
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                      <path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/>
                      <path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/>
                      <path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/>
                      <line x1="2" y1="2" x2="22" y2="22"/>
                    </svg>
                  }
                </button>
              </div>
            </div>

            <button 
              type="submit" 
              class="btn btn-primary btn-block submit-btn" 
              [disabled]="isLoading() || !registerName || !registerEmail || !registerPassword || !registerConfirm">
              @if (isLoading()) {
                <div class="spinner-sm"></div>
                <span>Creating Account...</span>
              } @else {
                <span>Create Account</span>
                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                  <path d="M16 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="8.5" cy="7" r="4"/><line x1="20" y1="8" x2="20" y2="14"/><line x1="23" y1="11" x2="17" y2="11"/>
                </svg>
              }
            </button>
          </form>
        }
      </div>
    </div>
  `,
  styles: [`
    .auth-page-wrapper {
      position: relative;
      min-height: calc(100vh - 80px);
      display: flex;
      align-items: center;
      justify-content: center;
      padding: 2rem 1rem;
      overflow: hidden;
    }

    .auth-ambient-glow {
      position: absolute;
      width: 450px;
      height: 450px;
      border-radius: 50%;
      filter: blur(120px);
      opacity: 0.18;
      pointer-events: none;
    }

    .glow-1 {
      top: 5%;
      left: 20%;
      background: radial-gradient(circle, var(--primary) 0%, transparent 70%);
    }

    .glow-2 {
      bottom: 5%;
      right: 20%;
      background: radial-gradient(circle, #845EF7 0%, transparent 70%);
    }

    .auth-card {
      position: relative;
      z-index: 2;
      width: 100%;
      max-width: 460px;
      padding: 2.25rem 2.5rem;
      border-radius: var(--radius-xl);
      background: var(--bg-card);
      backdrop-filter: blur(20px);
      border: 1px solid var(--border-subtle);
      box-shadow: 0 20px 45px rgba(0, 0, 0, 0.35);
    }

    .auth-header {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      margin-bottom: 1.75rem;
    }

    .brand-logo-badge {
      width: 54px;
      height: 54px;
      border-radius: 16px;
      background: linear-gradient(135deg, var(--primary) 0%, #845EF7 100%);
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 8px 20px rgba(99, 102, 241, 0.4);
      margin-bottom: 1rem;
    }

    .auth-header h1 {
      font-size: 1.75rem;
      font-weight: 700;
      letter-spacing: -0.02em;
      margin-bottom: 0.35rem;
    }

    .auth-subtitle {
      color: var(--text-secondary);
      font-size: 0.875rem;
      margin: 0;
    }

    .tab-switch {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.35rem;
      padding: 0.35rem;
      background: var(--bg-surface);
      border: 1px solid var(--border-subtle);
      border-radius: var(--radius-md);
      margin-bottom: 1.5rem;
    }

    .tab-btn {
      padding: 0.65rem 1rem;
      font-size: 0.875rem;
      font-weight: 600;
      border-radius: var(--radius-sm);
      border: none;
      background: transparent;
      color: var(--text-muted);
      cursor: pointer;
      transition: all var(--transition-fast);
    }

    .tab-btn.active {
      background: var(--bg-card);
      color: var(--text-primary);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.2);
    }

    .tab-btn:hover:not(.active) {
      color: var(--text-primary);
    }

    .alert-banner {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.75rem 1rem;
      margin-bottom: 1.25rem;
      border-radius: var(--radius-md);
      background: rgba(239, 68, 68, 0.12);
      border: 1px solid rgba(239, 68, 68, 0.3);
      color: var(--accent-rose);
      font-size: 0.85rem;
    }

    .auth-form {
      display: flex;
      flex-direction: column;
      gap: 1.15rem;
    }

    .input-with-icon {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-with-icon svg:first-child {
      position: absolute;
      left: 1rem;
      color: var(--text-muted);
      pointer-events: none;
    }

    .input-with-icon .form-control {
      padding-left: 2.75rem;
      padding-right: 2.75rem;
      width: 100%;
      height: 44px;
      font-size: 0.9rem;
    }

    .btn-toggle-eye {
      position: absolute;
      right: 0.75rem;
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.35rem;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color var(--transition-fast);
    }

    .btn-toggle-eye:hover {
      color: var(--text-primary);
    }

    .submit-btn {
      height: 46px;
      font-size: 0.95rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .btn-block {
      width: 100%;
    }

    .spinner-sm {
      width: 16px;
      height: 16px;
      border: 2px solid rgba(255, 255, 255, 0.3);
      border-top-color: currentColor;
      border-radius: 50%;
      animation: spin 0.7s linear infinite;
    }

    @keyframes spin {
      to { transform: rotate(360deg); }
    }

    .demo-account-box {
      margin-top: 0.75rem;
      display: flex;
      justify-content: center;
    }

    .demo-fill-btn {
      background: transparent;
      border: 1px solid var(--border-subtle);
      color: var(--text-secondary);
      font-size: 0.8rem;
      font-weight: 500;
      padding: 0.45rem 0.9rem;
      border-radius: var(--radius-sm);
      cursor: pointer;
      display: inline-flex;
      align-items: center;
      gap: 0.45rem;
      transition: all var(--transition-fast);
    }

    .demo-fill-btn:hover {
      background: var(--bg-surface);
      color: var(--primary);
      border-color: var(--primary);
    }

    @media (max-width: 480px) {
      .auth-card {
        padding: 1.75rem 1.25rem;
      }
    }
  `]
})
export class LoginComponent implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly activeTab = signal<'login' | 'register'>('login');
  readonly isLoading = signal<boolean>(false);
  readonly errorMessage = signal<string | null>(null);
  readonly showPassword = signal<boolean>(false);

  // Login inputs
  loginEmail = '';
  loginPassword = '';

  // Register inputs
  registerName = '';
  registerEmail = '';
  registerPassword = '';
  registerConfirm = '';

  private returnUrl = '/dashboard';

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  setTab(tab: 'login' | 'register'): void {
    this.activeTab.set(tab);
    this.errorMessage.set(null);
  }

  togglePasswordVisibility(): void {
    this.showPassword.update(v => !v);
  }

  fillDemoCredentials(): void {
    this.loginEmail = 'demo@spendwise.com';
    this.loginPassword = 'Demo@123';
    this.errorMessage.set(null);
  }

  onLogin(): void {
    if (!this.loginEmail.trim() || !this.loginPassword) {
      this.errorMessage.set('Please provide both email and password.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.login({
      email: this.loginEmail.trim(),
      password: this.loginPassword
    }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.notificationService.success('Welcome back!', `Signed in as ${res.name}.`);
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err?.error?.message || 'Invalid email or password. Please try again.';
        this.errorMessage.set(msg);
      }
    });
  }

  onRegister(): void {
    if (!this.registerName.trim()) {
      this.errorMessage.set('Please enter your name.');
      return;
    }

    if (!this.registerEmail.trim() || !this.registerEmail.includes('@')) {
      this.errorMessage.set('Please enter a valid email address.');
      return;
    }

    if (this.registerPassword.length < 6) {
      this.errorMessage.set('Password must be at least 6 characters.');
      return;
    }

    if (this.registerPassword !== this.registerConfirm) {
      this.errorMessage.set('Passwords do not match.');
      return;
    }

    this.isLoading.set(true);
    this.errorMessage.set(null);

    this.authService.register({
      name: this.registerName.trim(),
      email: this.registerEmail.trim(),
      password: this.registerPassword
    }).subscribe({
      next: (res) => {
        this.isLoading.set(false);
        this.notificationService.success('Account Created!', `Welcome to SpendWisely, ${res.name}!`);
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err) => {
        this.isLoading.set(false);
        const msg = err?.error?.message || 'Failed to create account. Email may already be in use.';
        this.errorMessage.set(msg);
      }
    });
  }
}
