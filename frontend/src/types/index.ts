// types/index.ts
export interface Star {
  ID: number;
  Title: string;
  Distance: number;
  StarType: string;
  Magnitude: number;
  Description: string;
  Mass: number;
  Temperature: number;
  DiscoveryDate: string;
  ImageName: string;
}

export interface StarFilters {
  searchTerm?: string;
  minDistance?: string;
  maxDistance?: string;
  starType?: string;
  minMagnitude?: string;
  maxMagnitude?: string;
  minTemperature?: string;
  maxTemperature?: string;
}

// Добавьте Partial для удобства
export type PartialStarFilters = Partial<StarFilters>