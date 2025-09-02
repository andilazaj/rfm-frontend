import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { SeasonService } from '../core/services/season.service';

type SeasonType = 'Winter' | 'Summer';

interface SeasonDto {
  id: number;
  name: string;
  start: string;
  end: string;
  year: number;
  type: SeasonType;
}

@Component({
  selector: 'app-seasons',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './seasons.component.html',
  styleUrls: ['./seasons.component.scss'],
})
export class SeasonsComponent implements OnInit {
  form!: FormGroup;
  seasons: SeasonDto[] = [];

  loading = signal(false);
  saving = signal(false);
  showToast = signal(false);

  toastMessage = '';
  mode: 'create' | 'edit' = 'create';
  editId: number | null = null;

  seasonTypes: SeasonType[] = ['Winter', 'Summer'];
  currentYear = new Date().getFullYear();
  years = Array.from({ length: 8 }, (_, i) => this.currentYear - 1 + i);

  constructor(private fb: FormBuilder, private seasonSvc: SeasonService) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      year: [this.currentYear, Validators.required],
      type: ['Winter' as SeasonType, Validators.required],
    });

    this.fetch();

    this.form.valueChanges.subscribe(() => {});
  }

  private buildDerivedSeason(year: number, type: SeasonType) {
    const start = type === 'Winter' ? `${year}-01-01` : `${year}-07-01`;
    const end = type === 'Winter' ? `${year}-06-30` : `${year}-12-31`;
    const name = `${type} ${year}`;
    return { name, start, end };
  }

  get derived() {
    const { year, type } = this.form.value as { year: number; type: SeasonType };
    if (!year || !type) return { name: '—', start: '—', end: '—' };
    return this.buildDerivedSeason(year, type);
  }

  fetch(): void {
    this.loading.set(true);
    this.seasonSvc
      .getSeasons()
      .pipe(finalize(() => this.loading.set(false)))
      .subscribe({
        next: (res) => {
          this.seasons = [...res].sort((a, b) => b.year - a.year || a.name.localeCompare(b.name));
        },
        error: (err) => {
          console.error('Failed to fetch seasons:', err);
        },
      });
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { year, type } = this.form.value as { year: number; type: SeasonType };
    const derived = this.buildDerivedSeason(year, type);

    const dto: SeasonDto = {
      id: this.editId ?? 0,
      year,
      type,
      ...derived,
    };

    if (this.mode === 'edit' && this.editId) {
      this.seasonSvc.updateSeason(this.editId, dto).subscribe(() => {
        this.fetch();
        this.resetForm();
      });
    } else {
      this.seasonSvc.createSeason(dto).subscribe(() => {
        this.fetch();
        this.resetForm();
      });
    }
  }

  edit(s: SeasonDto): void {
    this.mode = 'edit';
    this.editId = s.id;
    this.form.patchValue({
      year: s.year,
      type: s.type,
    });
  }

  cancelEdit(): void {
    this.resetForm();
  }

  delete(s: SeasonDto): void {
    if (!confirm(`Delete season "${s.name}"?`)) return;

    this.saving.set(true);
    this.seasonSvc
      .deleteSeason(s.id)
      .pipe(finalize(() => this.saving.set(false)))
      .subscribe({
        next: () => this.fetch(),
        error: (err) => {
          console.error('Delete failed:', err);
          const message =
            err?.error?.message ||
            err?.error?.text ||
            'Failed to delete season. It might be in use.';
          this.showErrorToast(message);
        },
      });
  }

  private showErrorToast(message: string): void {
    this.toastMessage = message;
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 3000);
  }

  private resetForm(): void {
    this.mode = 'create';
    this.editId = null;
    this.form.reset({
      year: this.currentYear,
      type: 'Winter',
    });
  }

  get yearCtrl() {
    return this.form.get('year');
  }

  get typeCtrl() {
    return this.form.get('type');
  }
}
