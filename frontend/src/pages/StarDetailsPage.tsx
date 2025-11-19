import type { FC } from 'react'
import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { starsApi, type StarDetailsResponse } from '../modules/api'
import { useImageLoader } from '../hooks/useImageLoader'
import './StarDetailsPage.css'

const StarDetailsPage: FC = () => {
  const { id } = useParams()
  const [starData, setStarData] = useState<StarDetailsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')
  
  const { imageError, handleImageError, resetImageError, getImageSrc } = useImageLoader()

  useEffect(() => {
    const loadStarDetails = async () => {
      if (!id) return
      
      setLoading(true)
      setError('')
      resetImageError()
      try {
        const data = await starsApi.getStarDetails(Number(id))
        setStarData(data)
      } catch (err) {
        setError('Не удалось загрузить данные о звезде')
        console.error('Ошибка загрузки деталей звезды:', err)
      } finally {
        setLoading(false)
      }
    }

    loadStarDetails()
  }, [id])

  if (loading) {
    return (
      <>
        <Navbar />
        <div className="star-hero">
          <div className="loading-container">
            <div className="loading-spinner"></div>
          </div>
        </div>
      </>
    )
  }

  if (error || !starData) {
    return (
      <>
        <Navbar />
        <div className="star-hero">
          <div className="error-container">
            <h2>Ошибка</h2>
            <p>{error || 'Звезда не найдена'}</p>
          </div>
        </div>
      </>
    )
  }

  const { star, imageURL } = starData

  return (
    <>
      <Navbar />
      
      {/* ХЛЕБНЫЕ КРОШКИ */}
      <div className="breadcrumbs">
        <div className="breadcrumbs-container">
          <Link to="/" className="breadcrumb-link">Главная</Link>
          <span className="breadcrumb-separator">/</span>
          <Link to="/stars" className="breadcrumb-link">Каталог звезд</Link>
          <span className="breadcrumb-separator">/</span>
          <span className="breadcrumb-current">{star.Title}</span>
        </div>
      </div>

      <main>
        <div className="star-hero">
          <img 
            src={getImageSrc(imageURL)}
            alt={star.Title}
            className="star-hero-image"
            onError={handleImageError}
          />
          
          <div className="star-content-overlay">
            <div className="star-info">
              <h1 className="star-title">{star.Title}</h1>
              <p className="star-description">{star.Description}</p>
            </div>
            
            <div className="details-container">
              <div className="detail-item">
                <span className="detail-label">РАССТОЯНИЕ</span>
                <div className="divider"></div>
                <span className="detail-value">{star.Distance} св. лет</span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">ВИДИМЫЙ БЛЕСК</span>
                <div className="divider"></div>
                <span className="detail-value">{star.Magnitude}</span>
              </div>
              
              <div className="detail-item">
                <span className="detail-label">ОТКРЫТА</span>
                <div className="divider"></div>
                <span className="detail-value">{star.DiscoveryDate}</span>
              </div>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default StarDetailsPage