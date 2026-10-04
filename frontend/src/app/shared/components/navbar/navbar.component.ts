import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { ThemeService } from '../../../core/services/theme.service';
import { AuthService } from '../../../core/services/auth.service';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-navbar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.css']
})
export class NavbarComponent {
  readonly themeService = inject(ThemeService);
  readonly authService = inject(AuthService);
  private readonly notificationService = inject(NotificationService);

  readonly mobileMenuOpen = signal<boolean>(false);
  readonly showDeleteConfirm = signal<boolean>(false);
  readonly isDeleting = signal<boolean>(false);

  toggleMobileMenu(): void {
    this.mobileMenuOpen.update(v => !v);
  }

  closeMobileMenu(): void {
    this.mobileMenuOpen.set(false);
  }

  getInitials(name: string): string {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
    return (parts[0][0] + parts[1][0]).toUpperCase();
  }

  onLogout(): void {
    this.authService.logout();
    this.notificationService.info('Signed Out', 'You have been signed out successfully.');
  }

  confirmDeleteAccount(): void {
    this.showDeleteConfirm.set(true);
  }

  cancelDeleteAccount(): void {
    if (!this.isDeleting()) {
      this.showDeleteConfirm.set(false);
    }
  }

  onDeleteAccount(): void {
    this.isDeleting.set(true);
    this.authService.deleteAccount().subscribe({
      next: () => {
        this.isDeleting.set(false);
        this.showDeleteConfirm.set(false);
        this.notificationService.success('Account Deleted', 'Your account has been permanently deleted.');
        this.authService.logout();
      },
      error: (err) => {
        this.isDeleting.set(false);
        const msg = err?.error?.message || 'Failed to delete account. Please try again.';
        this.notificationService.error('Deletion Failed', msg);
      }
    });
  }
}
