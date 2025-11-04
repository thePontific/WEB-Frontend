import type { FC } from 'react'
import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { starsApi } from '../modules/api'
import type { Star } from '../types'
import './StarsPage.css'

const StarsPage: FC = () => {
  const [stars, setStars] = useState<Star[]>([])
  const [filteredStars, setFilteredStars] = useState<Star[]>([])
  const [loading, setLoading] = useState(false)
  
  // Состояния фильтров
  const [searchTerm, setSearchTerm] = useState('')
  const [minDistance, setMinDistance] = useState('')
  const [maxDistance, setMaxDistance] = useState('')
  const [starType, setStarType] = useState('')
  const [minMagnitude, setMinMagnitude] = useState('')
  const [maxMagnitude, setMaxMagnitude] = useState('')
  const [minTemperature, setMinTemperature] = useState('')
  const [maxTemperature, setMaxTemperature] = useState('')
  
  // Состояния для выпадающего меню
  const [showFilters, setShowFilters] = useState(false)

  const loadStars = async () => {
    setLoading(true)
    try {
      const data = await starsApi.getStars()
      setStars(data)
      setFilteredStars(data)
    } catch (error) {
      console.error('Ошибка загрузки звезд:', error)
    } finally {
      setLoading(false)
    }
  }

  // Функция применения фильтров
  const applyFilters = () => {
    let result = stars

    if (searchTerm) {
      result = result.filter(star => 
        star.Title.toLowerCase().includes(searchTerm.toLowerCase())
      )
    }

    if (minDistance) {
      result = result.filter(star => star.Distance >= parseFloat(minDistance))
    }
    if (maxDistance) {
      result = result.filter(star => star.Distance <= parseFloat(maxDistance))
    }

    if (starType) {
      result = result.filter(star => star.StarType === starType)
    }

    if (minMagnitude) {
      result = result.filter(star => star.Magnitude >= parseFloat(minMagnitude))
    }
    if (maxMagnitude) {
      result = result.filter(star => star.Magnitude <= parseFloat(maxMagnitude))
    }

    if (minTemperature) {
      result = result.filter(star => star.Temperature >= parseInt(minTemperature))
    }
    if (maxTemperature) {
      result = result.filter(star => star.Temperature <= parseInt(maxTemperature))
    }

    setFilteredStars(result)
    setShowFilters(false) // Закрываем фильтры после применения
  }

  const resetFilters = () => {
    setSearchTerm('')
    setMinDistance('')
    setMaxDistance('')
    setStarType('')
    setMinMagnitude('')
    setMaxMagnitude('')
    setMinTemperature('')
    setMaxTemperature('')
    setFilteredStars(stars) // Показываем все звезды
  }

  const starTypes = Array.from(new Set(stars.map(star => star.StarType))).filter(Boolean)

  // Закрытие фильтра при клике вне области
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      const target = e.target as HTMLElement
      if (!target.closest('.filters-dropdown') && !target.closest('.filters-btn')) {
        setShowFilters(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  // Загрузка данных при монтировании
  useEffect(() => {
    loadStars()
  }, [])

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement
    target.src = '/images/default-star.png'
  }

  const getImageUrl = (imageName: string) => {
    if (!imageName) return '/images/default-star.png'
    return `http://127.0.0.1:9000/cardsandromeda/${imageName}`
  }

  // Проверка есть ли активные фильтры
  const hasActiveFilters = minDistance || maxDistance || starType || minMagnitude || maxMagnitude || minTemperature || maxTemperature

  return (
    <>
      <Navbar />
      <div className="index-page">
        <main>
          <div className="page-title-wrapper">
            <div className="page-title-inner">
              <div className="page-title-container">
                <h1 className="page-title">Звезды галактики Андромеды</h1>
                
                <div className="cart-in-title">
                  <div className="cart-icon empty">
                    <img src="/images/cart.png" alt="Starscart" />
                    <span className="cart-count">0</span>
                  </div>
                </div>
              </div>
              
              {/* Поиск и фильтры */}
              <div className="search-and-filters">
                <form 
                  className="search-form-with-filters"
                  onSubmit={(e) => {
                    e.preventDefault()
                    applyFilters()
                  }}
                >
                  <input 
                    type="text" 
                    placeholder="Поиск звезды..." 
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="search-input"
                  />
                  
                  <button 
                    type="button"
                    className={`filters-btn ${hasActiveFilters ? 'has-filters' : ''}`}
                    onClick={() => setShowFilters(!showFilters)}
                  >
                    Фильтры
                    {hasActiveFilters && <span className="filters-indicator"></span>}
                  </button>
                  
                  <button type="submit" className="search-btn">
                    Найти
                  </button>
                </form>

                {/* Выпадающее меню фильтров */}
                {showFilters && (
                  <div className="filters-dropdown">
                    <div className="filters-header">
                      <h3>Фильтры поиска</h3>
                      <button 
                        className="close-filters"
                        onClick={() => setShowFilters(false)}
                      >
                        ×
                      </button>
                    </div>
                    
                    <div className="filters-content">
                      {/* Фильтр по расстоянию */}
                      <div className="filter-group">
                        <label>Расстояние (св. лет)</label>
                        <div className="range-inputs">
                          <input 
                            type="number" 
                            placeholder="От"
                            value={minDistance}
                            onChange={(e) => setMinDistance(e.target.value)}
                          />
                          <span className="range-separator">—</span>
                          <input 
                            type="number" 
                            placeholder="До"
                            value={maxDistance}
                            onChange={(e) => setMaxDistance(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Фильтр по типу звезды */}
                      <div className="filter-group">
                        <label>Тип звезды</label>
                        <select 
                          value={starType}
                          onChange={(e) => setStarType(e.target.value)}
                        >
                          <option value="">Все типы</option>
                          {starTypes.map(type => (
                            <option key={type} value={type}>{type}</option>
                          ))}
                        </select>
                      </div>

                      {/* Фильтр по светимости */}
                      <div className="filter-group">
                        <label>Светимость</label>
                        <div className="range-inputs">
                          <input 
                            type="number" 
                            placeholder="От"
                            value={minMagnitude}
                            onChange={(e) => setMinMagnitude(e.target.value)}
                          />
                          <span className="range-separator">—</span>
                          <input 
                            type="number" 
                            placeholder="До"
                            value={maxMagnitude}
                            onChange={(e) => setMaxMagnitude(e.target.value)}
                          />
                        </div>
                      </div>

                      {/* Фильтр по температуре */}
                      <div className="filter-group">
                        <label>Температура (K)</label>
                        <div className="range-inputs">
                          <input 
                            type="number" 
                            placeholder="От"
                            value={minTemperature}
                            onChange={(e) => setMinTemperature(e.target.value)}
                          />
                          <span className="range-separator">—</span>
                          <input 
                            type="number" 
                            placeholder="До"
                            value={maxTemperature}
                            onChange={(e) => setMaxTemperature(e.target.value)}
                          />
                        </div>
                      </div>
                    </div>

                    <div className="filters-actions">
                      <button 
                        type="button"
                        className="clear-filters-btn"
                        onClick={resetFilters}
                      >
                        Очистить
                      </button>
                      <button 
                        type="button"
                        className="apply-filters-btn"
                        onClick={applyFilters}
                      >
                        Применить фильтры
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* Счетчик результатов */}
              <div className="results-count">
                Найдено звезд: {filteredStars.length}
              </div>
            </div>
          </div>

          <section className="stars-grid">
            {filteredStars.map(star => (
              <article key={star.ID} className="star-card">
                <a href={`/stars/${star.ID}`}>
                  <img 
                    src={getImageUrl(star.ImageName)}
                    alt={star.Title}
                    onError={handleImageError}
                  />
                  <div className="text-block">
                    <h2>{star.Title}</h2>
                    <p>{star.Distance} св. лет</p>
                  </div>
                </a>
                
                <div className="add-star-btn">
                  <button>+</button>
                </div>
              </article>
            ))}
          </section>
        </main>
      </div>
    </>
  )
}

export default StarsPage