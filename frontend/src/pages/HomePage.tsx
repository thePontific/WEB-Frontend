import type { FC } from 'react'
import { Container, Button } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'
import './HomePage.css'

const HomePage: FC = () => {
  return (
    <div className="home-page">
      {/* Фон - отдельный div без контейнеров */}
      <div className="background-layer"></div>
      
      {/* Хеддер поверх фона */}
      <Navbar />
      
      {/* Основной контент поверх фона */}
      <div className="content-layer">
        <div className="main-content">
          <h1 className="display-3 fw-bold text-white mb-3">
            Галактика Андромеды
          </h1>
          <p className="lead text-white mb-4">
            Крупнейшая галактика Местной группы. 
            Исследуйте её звёздные системы и уникальные характеристики
          </p>
          <Link to="/stars">
            <Button 
              variant="outline-light" 
              size="lg" 
              className="explore-btn"
            >
              Исследовать звёзды
            </Button>
          </Link>
        </div>
      </div>

      {/* Нижние статистики */}
      <div className="bottom-stats">
        <Container>
          <div className="stats-row">
            <div className="stat-item">
              <div className="golos-regular">Расстояние</div>
              <div className="divider-line"></div>
              <div className="golos-bold">2,5 млн световых лет</div>
            </div>
            
            <div className="stat-item">
              <div className="golos-regular">Тип объекта</div>
              <div className="divider-line"></div>
              <div className="golos-bold">Спиральная галактика</div>
            </div>
            
            <div className="stat-item">
              <div className="golos-regular">Звёздная величина</div>
              <div className="divider-line"></div>
              <div className="golos-bold">3,1</div>
            </div>

            <div className="stat-item">
              <div className="golos-regular">Диаметр</div>
              <div className="divider-line"></div>
              <div className="golos-bold">220 000 св. лет</div>
            </div>
          </div>
        </Container>
      </div>
    </div>
  )
}

export default HomePage