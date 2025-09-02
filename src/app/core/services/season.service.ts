import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { SeasonDto } from '../models/season.model';

@Injectable({
  providedIn: 'root',
})
export class SeasonService {
  private baseUrl = `${environment.apiBaseUrl}/api/seasons`;

  constructor(private http: HttpClient) {}

  getSeasons(): Observable<SeasonDto[]> {
    return this.http.get<SeasonDto[]>(this.baseUrl);
  }

  createSeason(dto: SeasonDto): Observable<SeasonDto> {
    return this.http.post<SeasonDto>(this.baseUrl, dto);
  }

  updateSeason(id: number, dto: SeasonDto): Observable<void> {
    return this.http.put<void>(`${this.baseUrl}/${id}`, dto);
  }

  deleteSeason(id: number): Observable<void> {
    return this.http.delete<void>(`${this.baseUrl}/${id}`);
  }
}
