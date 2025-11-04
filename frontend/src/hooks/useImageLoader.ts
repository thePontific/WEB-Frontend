// hooks/useImageLoader.ts
import { useState } from 'react'

export const useImageLoader = (defaultImage: string = '/images/default-star.png') => {
  const [imageError, setImageError] = useState(false)

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement
    target.src = defaultImage
    setImageError(true)
  }

  const resetImageError = () => {
    setImageError(false)
  }

  return {
    imageError,
    handleImageError,
    resetImageError
  }
}