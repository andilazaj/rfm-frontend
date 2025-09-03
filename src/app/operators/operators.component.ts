import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { finalize } from 'rxjs/operators';
import { TourOperatorService } from '../core/services/operator.service';
import { TourOperator, BookingClassWithRoutes } from '../core/models/operator.model';
import { TableComponent } from '../shared/table/table.component';
import { SeasonService } from '../core/services/season.service';
import { AuthService } from '../core/auth/auth.service';

interface BookingClass {
  id: number;
  name: string;
}

interface Season {
  id: number;
  name: string;
  year: number;
}

@Component({
  selector: 'app-operators',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, TableComponent],
  templateUrl: './operators.component.html',
  styleUrls: ['./operators.component.scss'],
})
export class OperatorsComponent implements OnInit {
  operators: TourOperator[] = [];
  loading = signal(false);
  saving = signal(false);
  toastMessage = '';
  showToast = signal(false);
  form!: FormGroup;
  mode: 'create' | 'edit' = 'create';
  editId: number | null = null;

  allBookingClasses: BookingClass[] = [
    { id: 1, name: 'Economy' },
    { id: 2, name: 'Business' },
  ];
  selectedBookingClassIds: number[] = [];

  allSeasons: Season[] = [];
  selectedSeasonIds: number[] = [];
  isOperator = false;
  constructor(
    private fb: FormBuilder,
    private operatorSvc: TourOperatorService,
    private seasonSvc: SeasonService,
    private auth: AuthService
  ) {
    this.isOperator = this.auth.hasRole('Operator');
  }

  ngOnInit(): void {
    this.form = this.fb.group({
      name: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(6)]], // 🔐 added
    });
    this.fetch();
    this.loadSeasons();
  }

  columnDefs = [
    { key: 'name', label: 'Name' },
    { key: 'email', label: 'Email' },
    {
      key: 'bookingClasses',
      label: 'Booking Classes',
      transform: (bc: any[]) => bc?.map((b) => b.name).join(', '),
    },
  ];

  fetch(): void {
    this.loading.set(true);

    if (this.auth.role === 'Operator' && this.auth.operatorId) {
      const id = this.auth.operatorId;
      this.operatorSvc
        .getById(id)
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: (res) => {
            this.operators = [res];
          },
          error: (err) => {
            console.error('Failed to fetch operator:', err);
            this.showErrorToast('Failed to load operator.');
          },
        });
    } else {
      this.operatorSvc
        .getAll()
        .pipe(finalize(() => this.loading.set(false)))
        .subscribe({
          next: (res) => {
            this.operators = res;
          },
          error: (err) => {
            console.error('Failed to fetch operators:', err);
            this.showErrorToast('Failed to load operators.');
          },
        });
    }
  }

  loadSeasons(): void {
    this.seasonSvc.getSeasons().subscribe({
      next: (seasons) => {
        this.allSeasons = seasons;
      },
      error: (err) => {
        console.error('Failed to load seasons:', err);
        this.showErrorToast('Failed to load seasons.');
      },
    });
  }

  toggleBookingClass(id: number): void {
    const index = this.selectedBookingClassIds.indexOf(id);
    if (index > -1) {
      this.selectedBookingClassIds.splice(index, 1);
    } else {
      this.selectedBookingClassIds.push(id);
    }
  }

  toggleSeason(id: number): void {
    const index = this.selectedSeasonIds.indexOf(id);
    if (index > -1) {
      this.selectedSeasonIds.splice(index, 1);
    } else {
      this.selectedSeasonIds.push(id);
    }
  }

  edit(op: TourOperator): void {
    this.mode = 'edit';
    this.editId = op.id;
    this.form.patchValue({
      name: op.name,
      email: op.email,
    });
    this.selectedBookingClassIds = op.bookingClasses.map((b) => b.id);
    this.selectedSeasonIds = op.seasons?.map((s) => s.id) ?? [];
  }

  delete(op: TourOperator): void {
    if (!confirm(`Delete operator "${op.name}"?`)) return;

    this.saving.set(true);
    this.operatorSvc.delete(op.id).subscribe({
      next: () => this.fetch(),
      error: (err) => {
        console.error('Delete failed:', err);
        const msg = err?.error?.message || 'Failed to delete operator.';
        this.showErrorToast(msg);
      },
      complete: () => this.saving.set(false),
    });
  }

  onSubmit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }

    const { name, email, password } = this.form.value;

    const dto: any = {
      name,
      email,
      bookingClassIds: this.selectedBookingClassIds,
      seasonIds: this.selectedSeasonIds,
    };

    // Only send password in create mode
    if (this.mode === 'create') {
      dto.password = password;
    }

    this.saving.set(true);

    if (this.mode === 'edit' && this.editId) {
      this.operatorSvc.update(this.editId, dto).subscribe({
        next: () => {
          this.fetch();
          this.resetForm();
        },
        error: () => this.showErrorToast('Update failed.'),
        complete: () => this.saving.set(false),
      });
    } else {
      this.operatorSvc.create(dto).subscribe({
        next: () => {
          this.fetch();
          this.resetForm();
        },
        error: () => this.showErrorToast('Creation failed.'),
        complete: () => this.saving.set(false),
      });
    }
  }
  getBookingClassNames(op: TourOperator): string {
    return op.bookingClasses.map((b) => b.name).join(', ');
  }

  private showErrorToast(message: string): void {
    this.toastMessage = message;
    this.showToast.set(true);
    setTimeout(() => this.showToast.set(false), 3000);
  }

  resetForm(): void {
    this.mode = 'create';
    this.editId = null;
    this.form.reset({
      name: '',
      email: '',
      password: '',
    });
    this.selectedBookingClassIds = [];
    this.selectedSeasonIds = [];
  }
}
