export interface PriceEntryCreateDto {
  routeId: number;
  seasonId: number;
  bookingClassId: number;
  date: string;
  price: number;
  seatCount: number;
  tourOperatorId: number;
}
export interface PriceEntryReadDto {
  id: number;
  date: string;
  dayOfWeek: string;
  price: number;
  seatCount: number;
  routeId: number;
  seasonId: number;
  tourOperatorId: string;
  bookingClassId: number;
  routeName?: string | null;
  bookingClassName?: string | null;
  operatorName?: string | null;
}

export interface QueryResponse {
  total: number;
  page: number;
  pageSize: number;
  items: PriceEntryReadDto[];
}

export interface BookingClass {
  id: number;
  name: string;
}
export interface Route {
  id: number;
  origin: string;
  destination: string;
}
export interface Season {
  id: number;
  name: string;
  start: string;
  end: string;
}
