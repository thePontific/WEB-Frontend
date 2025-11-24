import type { FC } from 'react'
import { useState } from 'react'
import Navbar from '../components/Navbar'
import { FilterGroup } from '../components/FilterGroup'
import type { StarFilters } from '../types'
import './StarsPage.css'
import { Link } from 'react-router-dom'
import { useDispatch } from "react-redux"
// ИМПОРТЫ ПО МЕТОДИЧКЕ - из dataSlice
import { setSumAction, useSum, useData } from "../slices/dataSlice"
import { useGetData } from '../hooks/useGetData' 
import { setFiltersAction, resetFiltersAction, useFilters } from "../slices/filtersSlice"
import type { StarWithImage } from '../modules/api'

const StarsPage: FC = () => {
  useGetData()
  
  const dispatch = useDispatch()
  const sum = useSum()
  const filters = useFilters()
  const data = useData()
  
  // ФИЛЬТРАЦИЯ НА КЛИЕНТЕ - ДОБАВЛЕН ТИП ДЛЯ star
  const filteredStars = data.filter((star: StarWithImage) => {
    // Поиск по названию
    if (filters.searchTerm && !star.Title.toLowerCase().includes(filters.searchTerm.toLowerCase())) {
      return false
    }
    
    // Фильтр по типу звезды
    if (filters.starType && star.StarType !== filters.starType) {
      return false
    }
    
    // Фильтр по минимальному расстоянию
    if (filters.minDistance && star.Distance < parseInt(filters.minDistance)) {
      return false
    }
    
    // Фильтр по максимальному расстоянию
    if (filters.maxDistance && star.Distance > parseInt(filters.maxDistance)) {
      return false
    }
    
    // Фильтр по минимальной светимости
    if (filters.minMagnitude && star.Magnitude < parseFloat(filters.minMagnitude)) {
      return false
    }
    
    // Фильтр по максимальной светимости
    if (filters.maxMagnitude && star.Magnitude > parseFloat(filters.maxMagnitude)) {
      return false
    }
    
    return true
  })
  
  const [loading, setLoading] = useState(false)
  const [showFilters, setShowFilters] = useState(false)

  const handleFilterChange = (filterName: keyof StarFilters, value: string) => {
    console.log('🔄 Filter change:', filterName, value)
    dispatch(setFiltersAction({ [filterName]: value }))
  }

  const handleSearch = () => {
    console.log('🔍 Performing search with filters:', filters)
    setLoading(true)
    // Имитация загрузки
    setTimeout(() => setLoading(false), 300)
  }

  const handleClearFilters = () => {
    console.log('🗑️ Clearing all filters')
    dispatch(resetFiltersAction())
    setLoading(true)
    setTimeout(() => setLoading(false), 300)
  }

  const handleAddToCart = (star: StarWithImage) => {
    console.log('⭐ Добавляем звезду:', star.Title)
    dispatch(setSumAction(1))
  }

  // ИСПРАВЛЕННАЯ СТРОКА - добавлен тип string[]
  const starTypes: string[] = Array.from(new Set(data.map((star: StarWithImage) => star.StarType)))
    .filter((type): type is string => type !== null && type !== undefined && type !== '')
    .filter(Boolean)

  const handleImageError = (e: React.SyntheticEvent<HTMLImageElement>) => {
    const target = e.target as HTMLImageElement
    target.src = 'images/default-star.png'
  }

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
                  <div className="cart-icon">
                    <img src="/WEB-Frontend/images/cart.png" alt="Star Cart" />
                    <span className={`cart-count ${sum === 0 ? 'empty' : ''}`}>
                      {sum}
                    </span>
                  </div>
                </div>
              </div>
              
              <div className="search-and-filters">
                <form 
                  className="search-form-with-filters"
                  onSubmit={(e) => {
                    e.preventDefault()
                    handleSearch()
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
                        onClick={handleClearFilters}
                      >
                        Очистить фильтры
                      </button>
                      <button 
                        type="button"
                        className="apply-filters-btn"
                        onClick={() => {
                          handleSearch()
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
                Найдено звезд: {filteredStars.length}
                {loading && ' (загрузка...)'}
              </div>
            </div>
          </div>

          <section className="stars-grid">
            {filteredStars.map((star: StarWithImage) => (
              <article key={star.ID} className="star-card">
                <Link to={`/stars/${star.ID}`}>
                  <img 
                    src={star.imageURL}
                    alt={star.Title}
                    onError={handleImageError}
                  />
                  <div className="text-block">
                    <h2>{star.Title}</h2>
                    <p>{star.Distance} св. лет</p>
                  </div>
                </Link>
                {/* КНОПКА В КОРЗИНУ ЗАКОММЕНТИРОВАНА
                <button 
                  className="add-to-cart-btn"
                  onClick={() => handleAddToCart(star)}
                  style={{
                    position: 'absolute',
                    bottom: '10px',
                    right: '10px',
                    background: '#d83933',
                    color: 'white',
                    border: 'none',
                    padding: '8px 12px',
                    borderRadius: '4px',
                    cursor: 'pointer'
                  }}
                >
                  ★ В корзину
                </button>
                */}
              </article>
            ))}
          </section>
        </main>
      </div>
    </>
  )
}

export default StarsPage