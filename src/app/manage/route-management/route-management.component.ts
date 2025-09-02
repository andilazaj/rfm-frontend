import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouteService } from '../../core/services/route.service';
import { RouteInputDto } from '../../core/models/route.model';
import { SeasonService } from '../../core/services/season.service';
import { AuthService } from '../../core/auth/auth.service';
interface BookingClass {
  id: number;
  name: string;
}

interface RouteModel {
  id?: number;
  origin: string;
  destination: string;
  bookingClasses: BookingClass[];
  seasonId?: number | null;
}

interface Season {
  id: number;
  name: string;
  year: number;
}

@Component({
  selector: 'app-route-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './route-management.component.html',
  styleUrls: ['./route-management.component.scss'],
})
export class RouteManagementComponent implements OnInit {
  routes: RouteModel[] = [];
  showModal = false;
  isEditing = false;
  currentRoute: RouteModel = this.getEmptyRoute();
  allBookingClasses: BookingClass[] = [
    { id: 1, name: 'Economy' },
    { id: 2, name: 'Business' },
  ];
  showSnackbar = false;
  snackbarMessage = '';

  seasons: Season[] = [];
  allYears: number[] = [];
  selectedYear: number | null = null;
  filteredSeasons: Season[] = [];
  isOperator = false;
  constructor(
    private routeService: RouteService,
    private seasonService: SeasonService,
    private auth: AuthService
  ) {
    this.isOperator = this.auth.hasRole('Operator');
  }

  ngOnInit(): void {
    this.refreshRoutes();
    this.loadSeasons();
  }

  getEmptyRoute(): RouteModel {
    return { origin: '', destination: '', bookingClasses: [], seasonId: undefined };
  }

  refreshRoutes(): void {
    this.routeService.getRoutes().subscribe((routes) => {
      this.routes = routes;
    });
  }

  loadSeasons(): void {
    this.seasonService.getSeasons().subscribe((seasons: Season[]) => {
      this.seasons = seasons;
      console.log('seasons', seasons);
      this.allYears = [...new Set(seasons.map((s) => s.year))].sort();
    });
  }

  filterSeasonsByYear(): void {
    this.filteredSeasons = this.seasons.filter((s) => s.year === this.selectedYear);
  }

  openCreateModal(): void {
    this.isEditing = false;
    this.currentRoute = this.getEmptyRoute();
    this.selectedYear = null;
    this.filteredSeasons = [...this.seasons];
    this.showModal = true;
  }
  openEditModal(route: RouteModel): void {
    this.isEditing = true;

    this.currentRoute = {
      ...route,
      bookingClasses: route.bookingClasses.map(
        (cls) => this.allBookingClasses.find((c) => c.id === cls.id) || cls
      ),
    };

    const season = this.seasons.find((s) => s.id === route.seasonId);
    this.selectedYear = season?.year ?? null;
    this.filterSeasonsByYear();

    this.showModal = true;
  }

  getBookingClassNames(route: RouteModel): string {
    return route.bookingClasses.map((c: any) => c.name).join(', ');
  }

  saveRoute(): void {
    const dto: RouteInputDto = {
      origin: this.currentRoute.origin,
      destination: this.currentRoute.destination,
      bookingClassIds: this.currentRoute.bookingClasses.map(
        (cls) => this.allBookingClasses.indexOf(cls) + 1
      ),
      seasonId: this.currentRoute.seasonId ?? null,
    };

    if (this.isEditing && this.currentRoute.id) {
      this.routeService.updateRoute(this.currentRoute.id, dto).subscribe(() => {
        this.refreshRoutes();
        this.showModal = false;
      });
    } else {
      this.routeService.createRoute(dto).subscribe(() => {
        this.refreshRoutes();
        this.showModal = false;
      });
    }
  }

  deleteRoute(id?: number): void {
    if (id === undefined) return;

    if (confirm('Are you sure you want to delete this route?')) {
      this.routeService.deleteRoute(id).subscribe(() => {
        this.refreshRoutes();
        this.showToast('Route deleted successfully');
      });
    }
  }

  showToast(message: string): void {
    this.snackbarMessage = message;
    this.showSnackbar = true;
    setTimeout(() => (this.showSnackbar = false), 3000);
  }

  onBookingClassChange(input: string): void {
    const classNames = input
      .split(',')
      .map((c) => c.trim())
      .filter((c) => c.length > 0);

    this.currentRoute.bookingClasses = classNames
      .map((name) => this.allBookingClasses.find((cls) => cls.name === name))
      .filter((c): c is BookingClass => !!c);
  }
}
