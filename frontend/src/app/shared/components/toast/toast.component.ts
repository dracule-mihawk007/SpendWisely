import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { NotificationService } from '../../../core/services/notification.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container" role="region" aria-live="polite">
      @for (toast of notificationService.toasts(); track toast.id) {
        <div class="toast-item" [ngClass]="'toast-' + toast.type">
          <div class="toast-icon">
            @switch (toast.type) {
              @case ('success') {
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
              }
              @case ('error') {
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="15" y1="9" x2="9" y2="15"/><line x1="9" y1="9" x2="15" y2="15"/></svg>
              }
              @case ('warning') {
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              }
              @case ('info') {
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              }
            }
          </div>
          <div class="toast-content">
            <span class="toast-title">{{ toast.title }}</span>
            @if (toast.message) {
              <p class="toast-message">{{ toast.message }}</p>
            }
          </div>
          <button class="toast-close" (click)="notificationService.dismiss(toast.id)" aria-label="Close notification">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
          </button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1.5rem;
      right: 1.5rem;
      z-index: 9999;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      max-width: 420px;
      width: calc(100vw - 3rem);
      pointer-events: none;
    }

    .toast-item {
      pointer-events: auto;
      display: flex;
      align-items: flex-start;
      gap: 0.85rem;
      padding: 0.95rem 1.15rem;
      border-radius: var(--radius-md);
      background: rgba(15, 23, 42, 0.92);
      backdrop-filter: blur(16px);
      -webkit-backdrop-filter: blur(16px);
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.5), 0 0 1px rgba(255, 255, 255, 0.2);
      border: 1px solid var(--border-glass);
      color: var(--text-primary);
      animation: slideInRight 0.3s cubic-bezier(0.16, 1, 0.3, 1) forwards;
      transition: all var(--transition-fast);
    }

    .toast-icon {
      flex-shrink: 0;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-top: 2px;
    }

    .toast-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .toast-title {
      font-weight: 600;
      font-size: 0.925rem;
      color: var(--text-primary);
    }

    .toast-message {
      font-size: 0.825rem;
      color: var(--text-secondary);
      margin: 0;
      line-height: 1.4;
    }

    .toast-close {
      flex-shrink: 0;
      background: transparent;
      border: none;
      color: var(--text-muted);
      cursor: pointer;
      padding: 0.2rem;
      border-radius: 4px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: color var(--transition-fast);
    }

    .toast-close:hover {
      color: #fff;
    }

    .toast-success {
      border-left: 4px solid var(--accent-emerald);
    }
    .toast-success .toast-icon {
      color: var(--accent-emerald-light);
    }

    .toast-error {
      border-left: 4px solid var(--accent-rose);
    }
    .toast-error .toast-icon {
      color: var(--accent-rose-light);
    }

    .toast-warning {
      border-left: 4px solid var(--accent-amber);
    }
    .toast-warning .toast-icon {
      color: var(--accent-amber-light);
    }

    .toast-info {
      border-left: 4px solid var(--primary-light);
    }
    .toast-info .toast-icon {
      color: var(--primary-light);
    }

    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(40px) scale(0.96);
      }
      to {
        opacity: 1;
        transform: translateX(0) scale(1);
      }
    }
  `]
})
export class ToastComponent {
  readonly notificationService = inject(NotificationService);
}
