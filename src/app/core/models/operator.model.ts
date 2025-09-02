export interface Season {
  id: number;
  name: string;
  start: string;
  end: string;
  year: number;
}

export interface Route {
  id: number;
  origin: string;
  destination: string;
  seasonId: number;
  season: Season;
  bookingClasses: string[];
}

export interface BookingClassWithRoutes {
  id: number;
  name: string;
  routes: Route[];
}

export interface TourOperator {
  id: number;
  name: string;
  email: string;
  bookingClasses: BookingClassWithRoutes[];
  seasons: Season[];
}
