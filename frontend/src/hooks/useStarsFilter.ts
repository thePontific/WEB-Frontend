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

export const useStarsFilter = (): UseStarsFilterReturn => {
  const [stars, setStars] = useState<StarWithImage[]>([])
  const [loading, setLoading] = useState(false)
  const [filters, setFilters] = useState<StarFilters>({})

  const loadStarsWithFilters = useCallback(async () => {
    // 🔽 ДОБАВЬТЕ ЛОГИ
    console.log('🚀 Starting fetch with filters:', filters)
    
    setLoading(true)
    try {
      const data = await starsApi.getStars(filters)
      console.log('✅ Fetch successful, stars:', data.length)
      setStars(data)
    } catch (error) {
      console.log('❌ Fetch failed, using mock data')
      console.error('Ошибка загрузки звезд:', error)
    } finally {
      setLoading(false)
    }
  }, [filters])

  // 🔽 ДОБАВЬТЕ ЭТОТ useEffect
  useEffect(() => {
    console.log('🔄 Component mounted - loading initial data')
    loadStarsWithFilters()
    
    return () => {
      console.log('🔄 Component unmounted - cleanup')
    }
  }, [loadStarsWithFilters])

  const applyFilters = () => {
    loadStarsWithFilters()
  }

  const resetFilters = () => {
    setFilters({})
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