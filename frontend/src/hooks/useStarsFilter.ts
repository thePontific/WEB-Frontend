// hooks/useStarsFilter.ts
import { useState, useEffect, useCallback } from 'react'
import { starsApi } from '../modules/api'
import type { StarWithImage } from '../modules/api'
import type { StarFilters } from '../types'

interface UseStarsFilterReturn {
  stars: StarWithImage[]
  loading: boolean
  filters: StarFilters
  setFilters: (filters: StarFilters) => void
  applyFilters: () => void
  resetFilters: () => void
}

// hooks/useStarsFilter.ts
export const useStarsFilter = (): UseStarsFilterReturn => {
  const [stars, setStars] = useState<StarWithImage[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<StarFilters>({})
  const [initialLoad, setInitialLoad] = useState(false) // ← добавляем флаг начальной загрузки

  const loadStarsWithFilters = useCallback(async (currentFilters: StarFilters) => {
    console.log('🚀 Starting fetch with filters:', currentFilters)
    
    setLoading(true)
    try {
      const data = await starsApi.getStars(currentFilters)
      console.log('✅ Fetch successful, stars:', data.length)
      setStars(data)
    } catch (error) {
      console.log('❌ Fetch failed, using mock data')
      console.error('Ошибка загрузки звезд:', error)
    } finally {
      setLoading(false)
      setInitialLoad(true) // ← отмечаем что начальная загрузка выполнена
    }
  }, [])

  // Добавляем начальную загрузку при монтировании
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
    loadStarsWithFilters({}) // ← автоматически загружаем все данные при сбросе
  }

  return {
    stars,
    loading,
    filters,
    setFilters,
    applyFilters,
    resetFilters
  }
}