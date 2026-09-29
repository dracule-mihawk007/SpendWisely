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
    return this.show({ type: 'success', title, message, durationMs: durationMs ?? 4000 });
  }

  error(title: string, message?: string, durationMs?: number): string {
    return this.show({ type: 'error', title, message, durationMs: durationMs ?? 7000 });
  }

  warning(title: string, message?: string, durationMs?: number): string {
    return this.show({ type: 'warning', title, message, durationMs: durationMs ?? 6500 });
  }

  info(title: string, message?: string, durationMs?: number): string {
    return this.show({ type: 'info', title, message, durationMs: durationMs ?? 4500 });
  }

  handleHttpError(err: unknown, fallbackTitle = 'Error', fallbackMessage = 'An unexpected error occurred.'): string {
    const httpErr = err as {
      status?: number;
      name?: string;
      message?: string;
      error?: string | { message?: string; title?: string };
    };

    const status = httpErr?.status;
    const errorBody = httpErr?.error;
    let message = '';

    if (typeof errorBody === 'string') {
      message = errorBody;
    } else if (errorBody?.message) {
      message = errorBody.message;
    } else if (errorBody?.title) {
      message = errorBody.title;
    } else if (httpErr?.message) {
      message = httpErr.message;
    }

    const lowerMsg = message.toLowerCase();

    if (
      status === 503 ||
      lowerMsg.includes('503') ||
      lowerMsg.includes('heavy traffic') ||
      lowerMsg.includes('high demand') ||
      lowerMsg.includes('service unavailable')
    ) {
      return this.error(
        'Service Unavailable',
        'Service is currently unavailable due to heavy traffic. Please try again in a few moments.',
        7500
      );
    }

    if (
      status === 429 ||
      lowerMsg.includes('429') ||
      lowerMsg.includes('rate limit') ||
      lowerMsg.includes('too many requests')
    ) {
      return this.error(
        'Rate Limit Reached',
        'Too many requests. Please wait a moment before trying again.',
        6500
      );
    }

    if (status === 504 || lowerMsg.includes('504') || lowerMsg.includes('gateway timeout')) {
      return this.error(
        'Service Timeout',
        'The server took too long to respond. It may be under heavy load. Please try again.',
        7000
      );
    }

    if (
      status === 0 ||
      httpErr?.name === 'TimeoutError' ||
      lowerMsg.includes('failed to fetch') ||
      lowerMsg.includes('unknown error')
    ) {
      return this.error(
        'Connection Error',
        'Unable to reach the server. Please check your network connection or ensure the service is running.',
        7000
      );
    }

    if (status === 400 || status === 422) {
      return this.error('Validation Error', message || fallbackMessage);
    }

    if (status === 404) {
      return this.error('Not Found', message || 'The requested resource could not be found.');
    }

    if (status === 500) {
      return this.error(
        'Server Error',
        'The server encountered an issue. Please try again in a few moments.',
        6500
      );
    }

    return this.error(fallbackTitle, message || fallbackMessage);
  }

  dismiss(id: string): void {
    this._toasts.update(current => current.filter(t => t.id !== id));
  }

  clear(): void {
    this._toasts.set([]);
  }
}
