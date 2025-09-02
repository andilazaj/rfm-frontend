import { CommonModule } from '@angular/common';
import { Component, computed, effect, inject, signal } from '@angular/core';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { PriceEntryService } from '../core/services/price.service';
import { AuthService } from '../core/auth/auth.service';
import { exportToExcel } from '../utils';

import {
  PriceEntryCreateDto,
  PriceEntryReadDto,
  BookingClass,
  Route,
  Season,
} from '../core/models/price.model';

type Key = string;

@Component({
  selector: 'app-pricing-table',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './pricing.component.html',
  styleUrls: ['./pricing.component.scss'],
})
export class PricingTableComponent {
  private api = inject(PriceEntryService);
  private auth = inject(AuthService);

  routes = signal<Route[]>([]);
  seasons = signal<Season[]>([]);
  bookingClasses = signal<BookingClass[]>([]);
  isOperator = false;
  selectedRouteId = signal<number | null>(null);
  selectedSeasonId = signal<number | null>(null);
  selectedMonth = signal<string>(this.toMonthString(new Date())); // YYYY-MM

  tourOperatorId = computed(() => {
    const session = sessionStorage.getItem('auth.session');
    if (!session) return '';
    try {
      const parsed = JSON.parse(session);
      return parsed.userId ?? '';
    } catch {
      return '';
    }
  });

  existingMap = signal<Record<Key, PriceEntryReadDto>>({});
  edits = signal<Record<Key, { price: number | null; seatCount: number | null }>>({});

  season = computed(() => this.seasons().find((s) => s.id === this.selectedSeasonId()) ?? null);

  seasonMinMonth = computed(() => this.season()?.start.slice(0, 7) ?? '');
  seasonMaxMonth = computed(() => this.season()?.end.slice(0, 7) ?? '');

  days = computed(() => {
    const s = this.season();
    const month = this.selectedMonth();
    if (!s || !month) return [];
    return this.buildMonthDaysClamped(month, s.start, s.end);
  });

  constructor() {
    this.isOperator = this.auth.hasRole('Operator');
    this.api.getRoutes().subscribe({
      next: (data: any) => {
        const list: Route[] = Array.isArray(data) ? data : data?.items ?? [];
        this.routes.set(list);
        if (!this.selectedRouteId() && list.length) this.selectedRouteId.set(list[0].id);
      },
      error: () => this.routes.set([]),
    });

    this.api.getSeasons().subscribe({
      next: (data: any) => {
        const list: Season[] = Array.isArray(data) ? data : data?.items ?? [];
        this.seasons.set(list);
        if (!this.selectedSeasonId() && list.length) this.selectedSeasonId.set(list[0].id);
      },
      error: () => this.seasons.set([]),
    });

    effect(() => {
      const s = this.season();
      if (!s) return;
      const min = s.start.slice(0, 7);
      const max = s.end.slice(0, 7);
      const current = this.selectedMonth();
      if (current < min) this.selectedMonth.set(min);
      if (current > max) this.selectedMonth.set(max);
    });

    effect(() => {
      const routeId = this.selectedRouteId();
      if (!routeId) {
        this.bookingClasses.set([]);
        return;
      }

      this.api.getBookingClasses(routeId).subscribe({
        next: (data) => this.bookingClasses.set(data ?? []),
        error: () => this.bookingClasses.set([]),
      });
    });

    effect(() => {
      const routeId = this.selectedRouteId();
      const seasonId = this.selectedSeasonId();
      const month = this.selectedMonth();
      const s = this.season();
      if (!routeId || !seasonId || !month || !s) return;

      const [mFrom, mTo] = this.monthBounds(month);
      const from = mFrom < s.start ? s.start : mFrom;
      const to = mTo > s.end ? s.end : mTo;

      this.loadMonth(routeId, seasonId, from, to);
    });
  }

  private loadMonth(routeId: number, seasonId: number, from: string, to: string) {
    this.api
      .query({ routeId, seasonId, from, to, page: 1, pageSize: 1000 })
      .subscribe((res: any) => {
        const items: PriceEntryReadDto[] = Array.isArray(res) ? res : res?.items ?? [];
        const map: Record<Key, PriceEntryReadDto> = {};
        for (const row of items) {
          const k = this.key(row.date, row.bookingClassId);
          map[k] = row;
        }
        this.existingMap.set(map);
        this.edits.set({});
      });
  }

  onPriceChange(date: string, classId: number, value: string) {
    const v = value === '' ? null : Number(value);
    this.patchEdit(date, classId, { price: v });
  }

  onSeatsChange(date: string, classId: number, value: string) {
    const v = value === '' ? null : Number(value);
    this.patchEdit(date, classId, { seatCount: v });
  }

  saveAll() {
    const routeId = this.selectedRouteId()!;
    const seasonId = this.selectedSeasonId()!;
    const opId = this.tourOperatorId();

    const rows: PriceEntryCreateDto[] = [];
    const classIds = new Set(this.bookingClasses().map((c) => c.id));
    const edits = this.edits();

    for (const [k, val] of Object.entries(edits)) {
      const [date, cls] = k.split('|');
      const bookingClassId = Number(cls);
      if (!classIds.has(bookingClassId)) continue;
      if (val.price == null && val.seatCount == null) continue;

      const existing = this.existingMap()[k];
      rows.push({
        routeId,
        seasonId,
        tourOperatorId: opId,
        bookingClassId,
        date,
        price: val.price ?? existing?.price ?? 0,
        seatCount: val.seatCount ?? existing?.seatCount ?? 0,
      });
    }

    if (rows.length === 0) {
      alert('No changes to save.');
      return;
    }

    this.api.bulkUpsert(rows).subscribe({
      next: () => {
        const s = this.season()!;
        const [mFrom, mTo] = this.monthBounds(this.selectedMonth());
        const from = mFrom < s.start ? s.start : mFrom;
        const to = mTo > s.end ? s.end : mTo;
        this.loadMonth(routeId, seasonId, from, to);
      },
      error: (e) => alert(e?.error?.message ?? 'Save failed'),
    });
  }

  valueFor(date: string, classId: number, field: 'price' | 'seatCount'): number | null {
    const k = this.key(date, classId);
    const edit = this.edits()[k];
    if (edit && edit[field] != null) return edit[field]!;
    const existing = this.existingMap()[k] as any;
    if (existing) return existing[field] as number;
    return null;
  }

  private patchEdit(
    date: string,
    classId: number,
    patch: Partial<{ price: number | null; seatCount: number | null }>
  ) {
    const k = this.key(date, classId);
    const current = this.edits()[k] ?? { price: null, seatCount: null };
    const next = { ...current, ...patch };
    this.edits.update((m) => ({ ...m, [k]: next }));
  }

  private key(date: string, classId: number): Key {
    return `${date}|${classId}`;
  }

  private buildMonthDaysClamped(month: string, seasonStart: string, seasonEnd: string) {
    const [y, m] = month.split('-').map(Number);
    let start = new Date(Date.UTC(y, m - 1, 1));
    let end = new Date(Date.UTC(y, m, 0)); // last day of month

    const sStart = new Date(seasonStart + 'T00:00:00Z');
    const sEnd = new Date(seasonEnd + 'T00:00:00Z');

    if (start < sStart) start = sStart;
    if (end > sEnd) end = sEnd;

    const days: { iso: string; dayLabel: string }[] = [];
    for (let d = new Date(start); d <= end; d.setUTCDate(d.getUTCDate() + 1)) {
      const iso = d.toISOString().slice(0, 10);
      const day = ['SUN', 'MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT'][d.getUTCDay()];
      days.push({ iso, dayLabel: day });
    }
    return days;
  }

  private monthBounds(month: string): [string, string] {
    const [y, m] = month.split('-').map(Number);
    const start = new Date(Date.UTC(y, m - 1, 1));
    const end = new Date(Date.UTC(y, m, 0));
    return [start.toISOString().slice(0, 10), end.toISOString().slice(0, 10)];
  }

  private toMonthString(d: Date) {
    const y = d.getFullYear();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${y}-${m}`;
  }

  exportExcel(): void {
    const data = [];
    const route = this.routes().find((r) => r.id === this.selectedRouteId());
    const season = this.seasons().find((s) => s.id === this.selectedSeasonId());
    const bookingClasses = this.bookingClasses();

    for (const d of this.days()) {
      const row: any = {
        Date: d.iso,
        Day: d.dayLabel,
        Route: `${route?.origin} → ${route?.destination}`,
        Season: season?.name,
      };

      for (const cls of bookingClasses) {
        row[`Price — ${cls.name}`] = this.valueFor(d.iso, cls.id, 'price');
        row[`Seats — ${cls.name}`] = this.valueFor(d.iso, cls.id, 'seatCount');
      }

      data.push(row);
    }

    exportToExcel(data, `pricing_export_${this.selectedMonth()}`);
  }
}
