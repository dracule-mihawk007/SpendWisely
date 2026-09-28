import { Injectable, signal } from '@angular/core';

export interface ToastMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message?: string;
  durationMs?: number;
}

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private readonly _toasts = signal<ToastMessage[]>([]);
  public readonly toasts = this._toasts.asReadonly();

  show(toast: Omit<ToastMessage, 'id'>): string {
    const id = Math.random().toString(36).substring(2, 9);
    const duration = toast.durationMs ?? 4500;
    const newToast: ToastMessage = {
      ...toast,
      id,
      durationMs: duration
    };

    this._toasts.update(current => [...current, newToast]);

    if (duration > 0) {
      setTimeout(() => this.dismiss(id), duration);
    }

    return id;
  }

  success(title: string, message?: string, durationMs?: number): string {
    return this.show({ type: 'success', title, message, durationMs });
  }

  error(title: string, message?: string, durationMs?: number): string {
    return this.show({ type: 'error', title, message, durationMs: durationMs ?? 6000 });
  }

  warning(title: string, message?: string, durationMs?: number): string {
    return this.show({ type: 'warning', title, message, durationMs: durationMs ?? 5500 });
  }

  info(title: string, message?: string, durationMs?: number): string {
    return this.show({ type: 'info', title, message, durationMs });
  }

  dismiss(id: string): void {
    this._toasts.update(current => current.filter(t => t.id !== id));
  }

  clear(): void {
    this._toasts.set([]);
  }
}
