// src/modules/api.ts
import type { Star } from '../types'
import { STARS_MOCK } from './mockData';
import { API_BASE_URL } from '../config';

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
  imageURL: string;
}

export interface StarDetailsResponse {
  star: Star;
  imageURL: string;
}

// ⭐ ФУНКЦИЯ ДЛЯ НЕБЕЗОПАСНЫХ ЗАПРОСОВ В TAURI
async function insecureFetch(url: string, options = {}): Promise<any> {
  try {
    // В браузере всегда используем обычный fetch
    if (typeof window === 'undefined' || !(window as any).__TAURI__) {
      console.log('🌐 Browser environment, using regular fetch');
      return fetch(url);
    }
    
    // В Tauri используем eval для динамического импорта (обход проверки Vite)
    const tauriAPI = await eval(`import('@tauri-apps/api/tauri')`);
    const result = await tauriAPI.invoke('make_insecure_request', { url }) as string;
    
    return {
      ok: true,
      json: async () => JSON.parse(result),
      text: async () => result
    };
  } catch (error) {
    console.error('Tauri insecure request failed:', error);
    // Fallback to regular fetch
    return fetch(url);
  }
}

// ⭐ ВЫБОР МЕЖДУ ОБЫЧНЫМ FETCH И TAURI FETCH
async function getFetchFunction(): Promise<(url: string, options?: any) => Promise<any>> {
  // В браузере всегда используем обычный fetch
  if (typeof window === 'undefined' || !(window as any).__TAURI__) {
    return fetch;
  } else {
    console.log('🔄 Tauri environment, using insecure fetch');
    return insecureFetch;
  }
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

      const url = `${API_BASE_URL}/stars?${queryParams}`;
      console.log('📡 Fetching from:', url);
      
      const fetchFunction = await getFetchFunction();
      const response = await fetchFunction(url);
      
      if (!response.ok) {
        throw new Error('API недоступен, используем mock данные');
      }
      
      const data = await response.json();
      
      return data.map((star: Star) => ({
        ...star,
        imageURL: generateImageURL(star.ImageName)
      }));
    } catch (error) {
      console.warn('⚠️ Используем mock данные:', error);
      const mockStars = applyFiltersToMock(STARS_MOCK, filters);
      return mockStars.map(star => ({
        ...star,
        imageURL: generateImageURL(star.ImageName)
      }));
    }
  },

  async getStarDetails(id: number): Promise<StarDetailsResponse> {
    try {
      const url = `${API_BASE_URL}/stars/${id}`;
      console.log('📡 Fetching star details from:', url);
      
      const fetchFunction = await getFetchFunction();
      const response = await fetchFunction(url);
      
      if (!response.ok) {
        throw new Error('API недоступен');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.warn('⚠️ Используем mock данные для деталей звезды');
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
  
  const isTauriApp = typeof window !== 'undefined' && (window as any).__TAURI__;
  
  const IMAGE_BASE_URL = isTauriApp 
    ? 'http://172.20.0.1:9000'
    : 'http://127.0.0.1:9000';
  
  return `${IMAGE_BASE_URL}/cardsandromeda/${fileName}`;
}

// Функция для фильтрации мок-данных
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