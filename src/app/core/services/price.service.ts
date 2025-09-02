import { HttpClient, HttpHeaders, HttpParams } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { PriceEntryCreateDto, PriceEntryReadDto, QueryResponse } from '../models/price.model';
import { environment } from '../../../environments/environment';
import { RouteDto, BookingClass } from '../models/route.model';
import { SeasonDto } from '../models/season.model';

@Injectable({ providedIn: 'root' })
export class PriceEntryService {
  private baseUrl = `${environment.apiBaseUrl}/api/priceentries`;

  constructor(private http: HttpClient) {}

  private getAuthHeaders(): HttpHeaders {
    const session = sessionStorage.getItem('auth.session');
    let token: string | null = null;

    if (session) {
      try {
        const parsed = JSON.parse(session);
        token = parsed.token;
      } catch (e) {
        console.error('Failed to parse session token:', e);
      }
    }

    return new HttpHeaders({
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    });
  }
  query(params: {
    operatorId?: string;
    routeId?: number;
    seasonId?: number;
    from?: string;
    to?: string;
    page?: number;
    pageSize?: number;
  }): Observable<QueryResponse> {
    let p = new HttpParams();
    Object.entries(params).forEach(([k, v]) => {
      if (v !== undefined && v !== null && v !== '') p = p.set(k, String(v));
    });

    return this.http.get<QueryResponse>(this.baseUrl, {
      params: p,
      headers: this.getAuthHeaders(),
    });
  }

  create(dto: PriceEntryCreateDto): Observable<PriceEntryReadDto> {
    return this.http.post<PriceEntryReadDto>(this.baseUrl, dto, {
      headers: this.getAuthHeaders(),
    });
  }

  bulkUpsert(rows: PriceEntryCreateDto[]) {
    return this.http.post(`${this.baseUrl}/bulk-upsert`, rows, {
      headers: this.getAuthHeaders(),
    });
  }

  getRoutes(): Observable<RouteDto[]> {
    return this.http.get<RouteDto[]>(`${environment.apiBaseUrl}/api/routes`, {
      headers: this.getAuthHeaders(),
    });
  }

  getSeasons(): Observable<SeasonDto[]> {
    return this.http.get<SeasonDto[]>(`${environment.apiBaseUrl}/api/seasons`, {
      headers: this.getAuthHeaders(),
    });
  }

  getBookingClasses(routeId: number): Observable<BookingClass[]> {
    return this.http.get<BookingClass[]>(
      `${environment.apiBaseUrl}/api/routes/${routeId}/booking-classes`,
      {
        headers: this.getAuthHeaders(),
      }
    );
  }
}
