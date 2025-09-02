import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { TourOperator } from '../models/operator.model';
import { environment } from '../../../environments/environment';
@Injectable({
  providedIn: 'root',
})
export class TourOperatorService {
  private baseUrl = `${environment.apiBaseUrl}/api/TourOperators`;

  constructor(private http: HttpClient) {}

  getAll(): Observable<TourOperator[]> {
    return this.http.get<TourOperator[]>(this.baseUrl);
  }

  getById(id: number): Observable<TourOperator> {
    return this.http.get<TourOperator>(`${this.baseUrl}/${id}`);
  }

  create(operator: Partial<TourOperator>): Observable<TourOperator> {
    return this.http.post<TourOperator>(this.baseUrl, operator);
  }

  update(id: number, operator: Partial<TourOperator>): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, operator);
  }

  delete(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
