import type { Star } from '../types'
import { STARS_MOCK } from './mockData';

const API_BASE = '/api';

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

export interface StarWithImage extends Star {
  imageURL: string; // добавляем поле с готовой ссылкой
}

export interface StarDetailsResponse {
  star: Star;
  imageURL: string;
}

export const starsApi = {
  async getStars(filters?: StarFilters): Promise<StarWithImage[]> {
    try {
      const queryParams = new URLSearchParams();
      
      if (filters?.searchTerm) queryParams.append('title', filters.searchTerm);
      if (filters?.minDistance) queryParams.append('distance_min', filters.minDistance);
      if (filters?.maxDistance) queryParams.append('distance_max', filters.maxDistance);
      if (filters?.starType) queryParams.append('star_type', filters.starType);
      if (filters?.minMagnitude) queryParams.append('magnitude_min', filters.minMagnitude);
      if (filters?.maxMagnitude) queryParams.append('magnitude_max', filters.maxMagnitude);
      if (filters?.minTemperature) queryParams.append('temperature_min', filters.minTemperature);
      if (filters?.maxTemperature) queryParams.append('temperature_max', filters.maxTemperature);

      const response = await fetch(`${API_BASE}/stars?${queryParams}`);
      
      if (!response.ok) {
        throw new Error('API недоступен, используем mock данные');
      }
      
      const data = await response.json();
      
      // ⚠️ ДОБАВЛЯЕМ imageURL к каждой звезде
      return data.map((star: Star) => ({
        ...star,
        imageURL: generateImageURL(star.ImageName)
      }));
    } catch (error) {
      console.warn('Используем mock данные:', error);
      const mockStars = applyFiltersToMock(STARS_MOCK, filters);
      return mockStars.map(star => ({
        ...star,
        imageURL: generateImageURL(star.ImageName)
      }));
    }
  },

  async getStarDetails(id: number): Promise<StarDetailsResponse> {
    try {
      const response = await fetch(`${API_BASE}/stars/${id}`);
      
      if (!response.ok) {
        throw new Error('API недоступен');
      }
      
      const data = await response.json();
      return data; // возвращаем {star: ..., imageURL: ...}
    } catch (error) {
      console.warn('Используем mock данные для деталей звезды');
      const mockStar = STARS_MOCK.find(star => star.ID === id);
      if (!mockStar) throw new Error('Звезда не найдена');
      
      return {
        star: mockStar,
        imageURL: generateImageURL(mockStar.ImageName)
      };
    }
  }
};

// Функция для генерации URL изображения
function generateImageURL(imageName: string): string {
  if (!imageName) return 'images/default-star.png';
  
  let fileName = imageName;
  if (fileName && !fileName.includes('.')) {
    fileName = `${fileName}.jpg`;
  }
  
  return `http://127.0.0.1:9000/cardsandromeda/${fileName}`;
}

// Функция для фильтрации мок-данных (fallback)
function applyFiltersToMock(stars: Star[], filters?: StarFilters): Star[] {
  if (!filters) return stars;
  
  return stars.filter(star => {
    if (filters.searchTerm && !star.Title.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
      return false;
    }
    if (filters.minDistance && star.Distance < parseFloat(filters.minDistance)) {
      return false;
    }
    if (filters.maxDistance && star.Distance > parseFloat(filters.maxDistance)) {
      return false;
    }
    if (filters.starType && star.StarType !== filters.starType) {
      return false;
    }
    if (filters.minMagnitude && star.Magnitude < parseFloat(filters.minMagnitude)) {
      return false;
    }
    if (filters.maxMagnitude && star.Magnitude > parseFloat(filters.maxMagnitude)) {
      return false;
    }
    if (filters.minTemperature && star.Temperature < parseInt(filters.minTemperature)) {
      return false;
    }
    if (filters.maxTemperature && star.Temperature > parseInt(filters.maxTemperature)) {
      return false;
    }
    return true;
  });
}