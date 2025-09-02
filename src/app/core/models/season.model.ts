export type SeasonType = 'Winter' | 'Summer';

export interface SeasonInputDto {
  year: number;
  type: SeasonType;
}

export interface SeasonDto {
  id: number;
  name: string;
  start: string;
  end: string;
  year: number;
  type: SeasonType;
}
