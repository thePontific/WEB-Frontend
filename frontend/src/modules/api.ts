import type { Star } from '../types'
import { STARS_MOCK } from './mockData';

const API_BASE = '/api';

export const starsApi = {
  async getStars(): Promise<Star[]> {
    try {
      const response = await fetch(`${API_BASE}/stars`);
      
      if (!response.ok) {
        throw new Error('API недоступен, используем mock данные');
      }
      
      const data = await response.json();
      return data;
    } catch (error) {
      console.warn('Используем mock данные:', error);
      return STARS_MOCK;
    }
  },

  async getStarDetails(id: number): Promise<Star> {
    try {
      const response = await fetch(`${API_BASE}/stars/${id}`);
      
      if (!response.ok) {
        throw new Error('API недоступен');
      }
      
      return await response.json();
    } catch (error) {
      console.warn('Используем mock данные для деталей звезды');
      const mockStar = STARS_MOCK.find(star => star.ID === id);
      if (!mockStar) throw new Error('Звезда не найдена');
      return mockStar;
    }
  }
};