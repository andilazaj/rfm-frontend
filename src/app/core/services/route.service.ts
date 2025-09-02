import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { RouteDto, RouteInputDto } from '../models/route.model';

@Injectable({
  providedIn: 'root',
})
export class RouteService {
  private baseUrl = `${environment.apiBaseUrl}/api/routes`;

  constructor(private http: HttpClient) {}

  getRoutes(): Observable<RouteDto[]> {
    return this.http.get<RouteDto[]>(this.baseUrl);
  }

  createRoute(dto: RouteInputDto): Observable<RouteDto> {
    return this.http.post<RouteDto>(this.baseUrl, dto);
  }

  updateRoute(id: number, dto: RouteInputDto): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, dto);
  }

  deleteRoute(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
