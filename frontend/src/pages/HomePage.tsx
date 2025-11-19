import type { FC } from 'react'
import Navbar from '../components/Navbar'
import './HomePage.css'

const HomePage: FC = () => {
  return (
    <div className="home-page">
      <Navbar />
      
      <main className="main-content">
        <div className="hero-background"></div>
        
        <div className="content-wrapper">
          <div className="text-section">
            <h1 className="hero-title">
              Галактика<br />Андромеды
            </h1>
            <p className="hero-description">
              Крупнейшая галактика Местной группы. 
              Исследуйте её звёздные системы и уникальные характеристики
            </p>
          </div>

          <div className="stats-section">
            <div className="stats-grid">
              <div className="stat-item">
                <div className="stat-label">Расстояние</div>
                <div className="divider-line"></div>
                <div className="stat-value">2,5 млн световых лет</div>
              </div>
              
              <div className="stat-item">
                <div className="stat-label">Тип объекта</div>
                <div className="divider-line"></div>
                <div className="stat-value">Спиральная галактика</div>
              </div>
              
              <div className="stat-item">
                <div className="stat-label">Звёздная величина</div>
                <div className="divider-line"></div>
                <div className="stat-value">3,1</div>
              </div>

              <div className="stat-item">
                <div className="stat-label">Диаметр</div>
                <div className="divider-line"></div>
                <div className="stat-value">220 000 св. лет</div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  )
}

export default HomePage