export interface RouteInputDto {
  origin: string;
  destination: string;
  bookingClassIds: number[];
  seasonId: number | null;
}

export interface BookingClass {
  id: number;
  name: string;
}

export interface RouteDto extends RouteInputDto {
  id: number;
  bookingClasses: BookingClass[];
}
