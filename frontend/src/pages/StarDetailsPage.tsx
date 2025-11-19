import type { FC } from 'react'
import { useState, useEffect } from 'react'
import { useParams } from 'react-router-dom'
import Navbar from '../components/Navbar'
import { starsApi, type StarDetailsResponse } from '../modules/api'
import './StarDetailsPage.css'

const StarDetailsPage: FC = () => {
  const { id } = useParams()
  const [starData, setStarData] = useState<StarDetailsResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const loadStarDetails = async () => {
      if (!id) return
      
      setLoading(true)
      setError('')
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
      <main>
        <div className="star-hero">
          <img 
            src={imageURL}
            alt={star.Title}
            className="star-hero-image"
            onError={(e) => {
              e.currentTarget.src = '/images/default-star.png'
            }}
          />
          
          <div className="star-content-overlay">
            <div className="star-info">
              <h1 className="star-title">{star.Title}</h1>
              <p className="star-description">{star.Description}</p>
            </div>
            
            <div className="distance-block detail-item">
              <span className="detail-label">РАССТОЯНИЕ</span>
              <div className="divider"></div>
              <span className="detail-value">{star.Distance} св. лет</span>
            </div>
            
            <div className="magnitude-block detail-item">
              <span className="detail-label">ВИДИМЫЙ БЛЕСК</span>
              <div className="divider"></div>
              <span className="detail-value">{star.Magnitude}</span>
            </div>
            
            <div className="discovery-block detail-item">
              <span className="detail-label">ОТКРЫТА</span>
              <div className="divider"></div>
              <span className="detail-value">{star.DiscoveryDate}</span>
            </div>
          </div>
        </div>
      </main>
    </>
  )
}

export default StarDetailsPage