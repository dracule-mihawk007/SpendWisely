import { Injectable, signal } from '@angular/core';

export type Theme = 'dark' | 'light';

@Injectable({
  providedIn: 'root'
})
export class ThemeService {
  private readonly storageKey = 'spendwisely-theme';
  readonly currentTheme = signal<Theme>(this.getInitialTheme());

  constructor() {
    this.applyTheme(this.currentTheme());
  }

  toggleTheme(): void {
    const nextTheme: Theme = this.currentTheme() === 'dark' ? 'light' : 'dark';
    this.setTheme(nextTheme);
  }

  setTheme(theme: Theme): void {
    this.currentTheme.set(theme);
    localStorage.setItem(this.storageKey, theme);
    this.applyTheme(theme);
  }

  private getInitialTheme(): Theme {
    const saved = localStorage.getItem(this.storageKey);
    if (saved === 'light' || saved === 'dark') {
      return saved;
    }
    // Default to dark
    return 'dark';
  }

  private applyTheme(theme: Theme): void {
    const root = document.documentElement;
    if (theme === 'light') {
      root.classList.add('light-theme');
      root.classList.remove('dark-theme');
      root.setAttribute('data-theme', 'light');
    } else {
      root.classList.add('dark-theme');
      root.classList.remove('light-theme');
      root.setAttribute('data-theme', 'dark');
    }
  }
}
