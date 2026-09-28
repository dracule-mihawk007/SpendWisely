import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <header class="navbar-wrapper">
      <nav class="navbar container">
        <div class="brand">
          <a routerLink="/dashboard" class="brand-link">
            <div class="brand-icon">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
                <rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" y1="10" x2="22" y2="10"/>
              </svg>
            </div>
            <span class="brand-title">SpendWisely</span>
          </a>
        </div>

        <!-- Navigation Links -->
        <ul class="nav-links">
          <li>
            <a routerLink="/dashboard" routerLinkActive="active" [routerLinkActiveOptions]="{exact: true}" class="nav-link">
              Dashboard
            </a>
          </li>
          <li>
            <a routerLink="/expenses" routerLinkActive="active" class="nav-link">
              Expenses
            </a>
          </li>
          <li>
            <a routerLink="/categories" routerLinkActive="active" class="nav-link">
              Categories
            </a>
          </li>
        </ul>

        <!-- Action Items (Theme toggle & Scan button) -->
        <div class="nav-actions">
          <!-- Theme Toggle Button -->
          <button 
            type="button" 
            class="theme-toggle-btn" 
            (click)="themeService.toggleTheme()" 
            [title]="themeService.currentTheme() === 'dark' ? 'Switch to Light Mode' : 'Switch to Dark Mode'"
            aria-label="Toggle theme">
            @if (themeService.currentTheme() === 'dark') {
              <!-- Sun Icon for switching to light -->
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/>
              </svg>
            } @else {
              <!-- Moon Icon for switching to dark -->
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/>
              </svg>
            }
          </button>

          <a routerLink="/scan" class="btn btn-primary btn-sm">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
              <path d="M3 7V5a2 2 0 0 1 2-2h2"/><path d="M17 3h2a2 2 0 0 1 2 2v2"/><path d="M21 17v2a2 2 0 0 1-2 2h-2"/><path d="M7 21H5a2 2 0 0 1-2-2v-2"/><circle cx="12" cy="12" r="3"/>
            </svg>
            <span>Scan Receipt</span>
          </a>

          <!-- Mobile Menu Trigger -->
          <button class="mobile-toggle" (click)="toggleMobileMenu()" aria-label="Toggle navigation menu">
            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="4" x2="20" y1="12" y2="12"/><line x1="4" x2="20" y1="6" y2="6"/><line x1="4" x2="20" y1="18" y2="18"/></svg>
          </button>
        </div>
      </nav>

      <!-- Mobile Dropdown -->
      @if (mobileMenuOpen()) {
        <div class="mobile-menu animate-fade-in">
          <a routerLink="/dashboard" (click)="closeMobileMenu()" routerLinkActive="active" class="mobile-link">Dashboard</a>
          <a routerLink="/expenses" (click)="closeMobileMenu()" routerLinkActive="active" class="mobile-link">Expenses</a>
          <a routerLink="/categories" (click)="closeMobileMenu()" routerLinkActive="active" class="mobile-link">Categories</a>
          <a routerLink="/scan" (click)="closeMobileMenu()" class="btn btn-primary btn-sm" style="margin-top: 0.5rem; justify-content: center;">
            Scan Receipt
          </a>
        </div>
      }
    </header>
  `,
  styles: [`
    .navbar-wrapper {
      position: sticky;
      top: 0;
      z-index: 1000;
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border-subtle);
      height: var(--navbar-height);
      transition: background-color var(--transition-normal), border-color var(--transition-normal);
    }

    .navbar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 100%;
      padding-top: 0;
      padding-bottom: 0;
    }

    .brand-link {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      text-decoration: none;
    }

    .brand-icon {
      width: 34px;
      height: 34px;
      border-radius: var(--radius-sm);
      background: var(--primary);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #fff;
    }

    .brand-title {
      font-family: var(--font-heading);
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--text-primary);
    }

    .nav-links {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      list-style: none;
    }

    .nav-link {
      padding: 0.45rem 0.85rem;
      border-radius: var(--radius-sm);
      color: var(--text-secondary);
      font-size: 0.875rem;
      font-weight: 500;
      transition: all var(--transition-fast);
    }

    .nav-link:hover {
      color: var(--text-primary);
      background: var(--bg-card-hover);
    }

    .nav-link.active {
      color: var(--primary);
      background: var(--primary-subtle);
      font-weight: 600;
    }

    .nav-actions {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .mobile-toggle {
      display: none;
      background: transparent;
      border: none;
      color: var(--text-primary);
      cursor: pointer;
      padding: 0.4rem;
    }

    .mobile-menu {
      display: none;
      flex-direction: column;
      gap: 0.5rem;
      padding: 1rem 1.25rem;
      background: var(--bg-surface);
      border-bottom: 1px solid var(--border-subtle);
    }

    .mobile-link {
      padding: 0.5rem 0.75rem;
      color: var(--text-secondary);
      font-weight: 500;
      border-radius: var(--radius-sm);
    }

    .mobile-link.active {
      color: var(--primary);
      background: var(--primary-subtle);
    }

    @media (max-width: 768px) {
      .nav-links { display: none; }
      .mobile-toggle { display: block; }
      .mobile-menu { display: flex; }
    }
  `]
})
export class NavbarComponent {
  readonly themeService = inject(ThemeService);
  readonly mobileMenuOpen = signal<boolean>(false);

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }
}
