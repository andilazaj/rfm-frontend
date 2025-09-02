import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable, tap } from 'rxjs';
import { AuthResponse, LoginDto, RegisterDto } from './auth.types';
import { environment } from '../../../environments/environment';

const SESSION_KEY = 'auth.session';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private http = inject(HttpClient);
  private baseUrl = `${environment.apiBaseUrl}/auth`;

  private _auth$ = new BehaviorSubject<AuthResponse | null>(this.readSession());
  auth$ = this._auth$.asObservable();

  constructor() {
    const session = this.readSession();
    if (session) this._auth$.next(session);
  }

  register(dto: RegisterDto): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.baseUrl}/register`, dto);
  }

  login(dto: LoginDto): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.baseUrl}/login`, dto)
      .pipe(tap((res) => this.saveSession(res)));
  }

  logout(): void {
    sessionStorage.removeItem(SESSION_KEY);
    this._auth$.next(null);
  }

  get token(): string | null {
    return this._auth$.value?.token ?? null;
  }

  get role(): string | null {
    return this._auth$.value?.role ?? null;
  }

  get userId(): string | null {
    return this._auth$.value?.userId ?? null;
  }

  get operatorId(): number | null {
    return this._auth$.value?.operatorId ?? null;
  }

  isAuthenticated(): boolean {
    return !!this.token;
  }

  hasRole(roles: string | string[]): boolean {
    const r = this.role;
    if (!r) return false;
    return Array.isArray(roles) ? roles.includes(r) : r === roles;
  }

  private saveSession(res: AuthResponse) {
    const normalized = this.mapAuthResponse(res);
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(normalized));
    this._auth$.next(normalized);
  }

  private readSession(): AuthResponse | null {
    const raw = sessionStorage.getItem(SESSION_KEY);
    if (!raw) return null;
    try {
      return JSON.parse(raw) as AuthResponse;
    } catch {
      return null;
    }
  }

  private mapAuthResponse(res: any): AuthResponse {
    const token = res?.token ?? res?.accessToken ?? '';
    const payload = this.decodeJwt(token);

    return {
      token,
      role:
        res?.role ??
        payload?.['http://schemas.microsoft.com/ws/2008/06/identity/claims/role'] ??
        'Operator',
      userId:
        res?.userId ??
        payload?.['http://schemas.xmlsoap.org/ws/2005/05/identity/claims/nameidentifier'] ??
        null,
      operatorId: res?.operatorId ?? null,
    };
  }

  private decodeJwt(token: string): any {
    try {
      const payload = token.split('.')[1];
      const decoded = atob(payload.replace(/-/g, '+').replace(/_/g, '/'));
      return JSON.parse(decoded);
    } catch {
      return null;
    }
  }
}
