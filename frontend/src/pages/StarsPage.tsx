// pages/StarsPage.tsx
import type { FC } from 'react'
import { useState, useEffect } from 'react'
import Navbar from '../components/Navbar'
import { FilterGroup } from '../components/FilterGroup'
import { useStarsFilter } from '../hooks/useStarsFilter'
import type { StarFilters } from '../types'
import './StarsPage.css'

const StarsPage: FC = () => {
  // Использование пользовательского хука (5.1 Хук состояния)
  const { 
    stars, 
    loading, 
    filters, 
    setFilters, 
    applyFilters, 
    resetFilters 
  } = useStarsFilter()
   useEffect(() => {
    console.log('🎯 Filters changed:', filters)
  }, [filters])

  useEffect(() => {
    console.log('🎯 Stars loaded:', stars.length)
  }, [stars])
  // Состояние для показа/скрытия фильтров
  const [showFilters, setShowFilters] = useState(false)

  // Обработчики для отдельных фильтров
  const handleFilterChange = (filterName: keyof StarFilters, value: string) => {
    const newFilters = { ...filters, [filterName]: value }
    setFilters(newFilters)
  }

  const starTypes = Array.from(new Set(stars.map(star => star.StarType))).filter(Boolean)

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement
    target.src = '/images/default-star.png'
  }

  // Проверка активных фильтров для индикатора
  const hasActiveFilters = Object.values(filters).some(value => 
    value !== undefined && value !== '' && value !== null
  )

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
              
              {/* Поиск и фильтры с использованием компонентов и пропсов */}
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
                    value={filters.searchTerm || ''}
                    onChange={(e) => handleFilterChange('searchTerm', e.target.value)}
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
                    {loading ? 'Загрузка...' : 'Найти'}
                  </button>
                </form>

                {/* Выпадающее меню с компонентами FilterGroup */}
                {showFilters && (
                  <div className="filters-dropdown">
                    <div className="filters-content">
                      <FilterGroup
                        label="Минимальное расстояние"
                        value={filters.minDistance || ''}
                        onChange={(value) => handleFilterChange('minDistance', value)}
                        type="number"
                        placeholder="От"
                      />
                      
                      <FilterGroup
                        label="Максимальное расстояние"
                        value={filters.maxDistance || ''}
                        onChange={(value) => handleFilterChange('maxDistance', value)}
                        type="number"
                        placeholder="До"
                      />

                      <FilterGroup
                        label="Тип звезды"
                        value={filters.starType || ''}
                        onChange={(value) => handleFilterChange('starType', value)}
                        type="select"
                        options={starTypes}
                      />

                      <FilterGroup
                        label="Минимальная светимость"
                        value={filters.minMagnitude || ''}
                        onChange={(value) => handleFilterChange('minMagnitude', value)}
                        type="number"
                        placeholder="От"
                      />

                      <FilterGroup
                        label="Максимальная светимость"
                        value={filters.maxMagnitude || ''}
                        onChange={(value) => handleFilterChange('maxMagnitude', value)}
                        type="number"
                        placeholder="До"
                      />
                    </div>

                    <div className="filters-actions">
                      <button 
                        type="button"
                        className="clear-filters-btn"
                        onClick={() => {
                          resetFilters()
                          setShowFilters(false)
                        }}
                      >
                        Очистить фильтры
                      </button>
                      <button 
                        type="button"
                        className="apply-filters-btn"
                        onClick={() => {
                          applyFilters()
                          setShowFilters(false)
                        }}
                      >
                        Применить фильтры
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="results-count">
                Найдено звезд: {stars.length}
                {loading && ' (загрузка...)'}
              </div>
            </div>
          </div>

          {/* Отображение звезд */}
          <section className="stars-grid">
            {stars.map(star => (
              <article key={star.ID} className="star-card">
                <a href={`/stars/${star.ID}`}>
                  <img 
                    src={star.imageURL}
                    alt={star.Title}
                    onError={handleImageError}
                  />
                  <div className="text-block">
                    <h2>{star.Title}</h2>
                    <p>{star.Distance} св. лет</p>
                    {/* Тип и светимость убраны по требованию */}
                  </div>
                </a>
              </article>
            ))}
          </section>
        </main>
      </div>
    </>
  )
}

export default StarsPage