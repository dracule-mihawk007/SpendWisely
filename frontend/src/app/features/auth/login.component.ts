import { Component, inject, signal, OnInit, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css']
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

  // Interaction tracking signals
  readonly loginPasswordInteracted = signal<boolean>(false);
  readonly registerPasswordInteracted = signal<boolean>(false);

  // Login inputs
  loginEmail = '';
  readonly loginPasswordSignal = signal<string>('');

  get loginPassword(): string {
    return this.loginPasswordSignal();
  }
  set loginPassword(val: string) {
    this.loginPasswordSignal.set(val || '');
    if (val && val.length > 0) {
      this.loginPasswordInteracted.set(true);
    }
  }

  // Register inputs
  registerName = '';
  registerEmail = '';
  readonly registerPasswordSignal = signal<string>('');
  registerConfirm = '';

  get registerPassword(): string {
    return this.registerPasswordSignal();
  }
  set registerPassword(val: string) {
    this.registerPasswordSignal.set(val || '');
    if (val && val.length > 0) {
      this.registerPasswordInteracted.set(true);
    }
  }

  // Active password string based on currently selected tab
  readonly activePassword = computed(() => {
    return this.activeTab() === 'login'
      ? this.loginPasswordSignal()
      : this.registerPasswordSignal();
  });

  // Password criteria computed signals (track activePassword reactively on every keystroke)
  readonly showPasswordCriteria = computed(() => {
    if (this.activeTab() === 'login') {
      return this.loginPasswordInteracted() || this.loginPasswordSignal().length > 0;
    } else {
      return this.registerPasswordInteracted() || this.registerPasswordSignal().length > 0;
    }
  });

  readonly hasMinLength = computed(() => this.activePassword().length >= 6);
  readonly hasUppercase = computed(() => /[A-Z]/.test(this.activePassword()));
  readonly hasNumber = computed(() => /[0-9]/.test(this.activePassword()));
  readonly hasSpecial = computed(() => /[^A-Za-z0-9\s]/.test(this.activePassword()));
  readonly areAllCriteriaMet = computed(() =>
    this.hasMinLength() && this.hasUppercase() && this.hasNumber() && this.hasSpecial()
  );

  private returnUrl = '/dashboard';

  ngOnInit(): void {
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  onLoginPasswordFocus(): void {
    this.loginPasswordInteracted.set(true);
  }

  onRegisterPasswordFocus(): void {
    this.registerPasswordInteracted.set(true);
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

    const password = this.registerPassword;

    if (password.length < 6) {
      this.errorMessage.set('Password must be at least 6 characters.');
      return;
    }

    if (!/[A-Z]/.test(password)) {
      this.errorMessage.set('Password must contain at least 1 uppercase letter.');
      return;
    }

    if (!/[0-9]/.test(password)) {
      this.errorMessage.set('Password must contain at least 1 number.');
      return;
    }

    if (!/[^A-Za-z0-9\s]/.test(password)) {
      this.errorMessage.set('Password must contain at least 1 special character.');
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
