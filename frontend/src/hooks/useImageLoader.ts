import { useState, useCallback } from 'react'

// Правильный путь с учетом base URL
const getDefaultImagePath = () => {
  const base = import.meta.env.BASE_URL || ''
  return `${base}/images/default-star.png`
}

export const useImageLoader = (defaultImage: string = getDefaultImagePath()) => {
  const [imageError, setImageError] = useState(false)

  const handleImageError = useCallback((e?: React.SyntheticEvent<HTMLImageElement>) => {
    console.log('🔄 Image error, switching to default:', defaultImage)
    setImageError(true)
    if (e && !(e.target as HTMLImageElement).src.includes('default-star.png')) {
      (e.target as HTMLImageElement).src = defaultImage
    }
  }, [defaultImage])

  const resetImageError = useCallback(() => {
    setImageError(false)
  }, [])

  const getImageSrc = useCallback((originalSrc: string | undefined) => {
    if (imageError || !originalSrc) {
      return defaultImage
    }
    return originalSrc
  }, [imageError, defaultImage])

  return {
    imageError,
    handleImageError,
    resetImageError,
    getImageSrc
  }
}