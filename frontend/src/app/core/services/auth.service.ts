import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { Observable, tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { LoginDto, RegisterDto, AuthResponseDto, UserProfileDto } from '../models/auth.model';

const TOKEN_KEY = 'spendwisely_token';
const USER_KEY = 'spendwisely_user';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private readonly http = inject(HttpClient);
  private readonly router = inject(Router);
  private readonly baseUrl = `${environment.apiUrl}/auth`;

  private readonly _token = signal<string | null>(this.getStoredToken());
  public readonly token = this._token.asReadonly();

  private readonly _user = signal<UserProfileDto | null>(this.getStoredUser());
  public readonly currentUser = this._user.asReadonly();

  public readonly isAuthenticated = computed(() => !!this._token());

  private getStoredToken(): string | null {
    try {
      return localStorage.getItem(TOKEN_KEY);
    } catch {
      return null;
    }
  }

  private getStoredUser(): UserProfileDto | null {
    try {
      const raw = localStorage.getItem(USER_KEY);
      return raw ? JSON.parse(raw) : null;
    } catch {
      return null;
    }
  }

  register(dto: RegisterDto): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(`${this.baseUrl}/register`, dto).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  login(dto: LoginDto): Observable<AuthResponseDto> {
    return this.http.post<AuthResponseDto>(`${this.baseUrl}/login`, dto).pipe(
      tap(res => this.handleAuthSuccess(res))
    );
  }

  getProfile(): Observable<UserProfileDto> {
    return this.http.get<UserProfileDto>(`${this.baseUrl}/me`).pipe(
      tap(profile => {
        this._user.set(profile);
        localStorage.setItem(USER_KEY, JSON.stringify(profile));
      })
    );
  }

  logout(): void {
    try {
      localStorage.removeItem(TOKEN_KEY);
      localStorage.removeItem(USER_KEY);
    } catch (e) {
      console.error('Error clearing localStorage', e);
    }
    this._token.set(null);
    this._user.set(null);
    this.router.navigate(['/login']);
  }

  private handleAuthSuccess(res: AuthResponseDto): void {
    const userProfile: UserProfileDto = {
      id: res.userId,
      name: res.name,
      email: res.email,
      createdAt: res.expiresAt
    };
    try {
      localStorage.setItem(TOKEN_KEY, res.token);
      localStorage.setItem(USER_KEY, JSON.stringify(userProfile));
    } catch (e) {
      console.error('Error saving auth to localStorage', e);
    }
    this._token.set(res.token);
    this._user.set(userProfile);
  }
}
