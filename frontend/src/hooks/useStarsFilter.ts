// hooks/useStarsFilter.ts
import { useState, useEffect, useCallback } from 'react'
import { starsApi } from '../modules/api'
import type { StarWithImage } from '../modules/api'
import type { StarFilters } from '../types'
import { STARS_MOCK } from '../modules/mockData'

interface UseStarsFilterReturn {
  stars: StarWithImage[]
  loading: boolean
  filters: StarFilters
  setFilters: (filters: StarFilters) => void
  applyFilters: () => void
  resetFilters: () => void
  usingMockData: boolean
}

export const useStarsFilter = (): UseStarsFilterReturn => {
  const [stars, setStars] = useState<StarWithImage[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<StarFilters>({})
  const [initialLoad, setInitialLoad] = useState(false)
  const [usingMockData, setUsingMockData] = useState(false)

  const loadStarsWithFilters = useCallback(async (currentFilters: StarFilters) => {
    console.log('🚀 Starting fetch with filters:', currentFilters)
    
    setLoading(true)
    try {
      const data = await starsApi.getStars(currentFilters)
      console.log('✅ Fetch successful from BACKEND, stars:', data.length)
      setStars(data)
      setUsingMockData(false)
    } catch (error) {
      console.log('❌ Fetch failed, using MOCK DATA')
      console.error('Ошибка загрузки звезд:', error)
      
      // Используем мок-данные напрямую из API (они уже отфильтрованы там)
      const mockData = await starsApi.getStars(currentFilters)
      console.log('✅ Using MOCK data, stars:', mockData.length)
      setStars(mockData)
      setUsingMockData(true)
    } finally {
      setLoading(false)
      setInitialLoad(true)
    }
  }, [])

  useEffect(() => {
    if (!initialLoad) {
      console.log('🔄 Initial load - loading all stars')
      loadStarsWithFilters({})
    }
  }, [initialLoad, loadStarsWithFilters])

  const applyFilters = () => {
    console.log('🎯 Applying filters')
    loadStarsWithFilters(filters)
  }

  const resetFilters = () => {
    console.log('🔄 Resetting filters')
    setFilters({})
    loadStarsWithFilters({})
  }

  return {
    stars,
    loading,
    filters,
    setFilters,
    applyFilters,
    resetFilters,
    usingMockData
  }
}