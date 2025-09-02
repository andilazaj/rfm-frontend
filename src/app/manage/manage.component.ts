import { Component, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../core/auth/auth.service';
import { RouteManagementComponent } from './route-management/route-management.component';
import { SeasonsComponent } from '../seasons/seasons.component';
import { OperatorsComponent } from '../operators/operators.component';
import { PricingTableComponent } from '../pricing/pricing.component';

@Component({
  selector: 'app-manage',
  standalone: true,
  imports: [
    CommonModule,
    RouteManagementComponent,
    SeasonsComponent,
    OperatorsComponent,
    PricingTableComponent,
  ],
  templateUrl: './manage.component.html',
  styleUrls: ['./manage.component.scss'],
})
export class ManageComponent {
  auth = inject(AuthService);
  router = inject(Router);
  selectedTab = 'routes';

  tabs = [
    { key: 'routes', label: 'Route Management', adminOnly: false },
    { key: 'seasons', label: 'Season Management', adminOnly: true },
    { key: 'operators', label: 'Tour Operator Management', adminOnly: false },
    { key: 'pricing', label: 'Pricing Management', adminOnly: false },
  ];

  logout(): void {
    this.auth.logout();
    this.router.navigate(['/login']);
  }

  visibleTabs = computed(() =>
    this.tabs.filter((tab) => !tab.adminOnly || this.auth.hasRole('Admin'))
  );
}
