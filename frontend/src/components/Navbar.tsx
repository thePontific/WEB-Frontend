import type { FC } from 'react'
import { useState } from 'react'
import { Navbar as BSNavbar, Container, Nav } from 'react-bootstrap'
import { Link, useLocation } from 'react-router-dom'
import Breadcrumbs from './Breadcrumbs'
import './Navbar.css';

const Navbar: FC = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const location = useLocation()

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen)
  }

  const closeMobileMenu = () => {
    setIsMobileMenuOpen(false)
  }

  return (
    <BSNavbar 
      fixed="top"
      className="custom-navbar"
      variant="dark"
      style={{ 
        backgroundColor: '#000000',
        zIndex: 1030,
        padding: '0',
        minHeight: '80px'
      }}
    >
      <Container style={{ position: 'relative', minHeight: '80px' }}>
        {/* Основной контент */}
        <div className="navbar-content">
          
          {/* НАВИГАЦИОННОЕ МЕНЮ СЛЕВА (десктоп) */}
          <Nav className="desktop-nav">
            <Nav.Link 
              as={Link} 
              to="/" 
              className={location.pathname === '/' ? 'active' : ''}
            >
              Главная
            </Nav.Link>
            <Nav.Link 
              as={Link} 
              to="/stars" 
              className={location.pathname === '/stars' ? 'active' : ''}
            >
              Каталог Звёзд
            </Nav.Link>
          </Nav>
          
          {/* Логотип по центру */}
          <Link to="/" className="navbar-brand-center">
            <img 
              src="/WEB-Frontend/images/icon.png"
              alt="icon" 
              style={{ 
                height: '45px', 
                width: 'auto' 
              }}
            />
          </Link>
          
          {/* Бургер-меню справа (мобильные) */}
          <div 
            className={`navbar-mobile-wrapper ${isMobileMenuOpen ? 'active' : ''}`}
            onClick={toggleMobileMenu}
          >
            <div className="navbar-mobile-target" />
            <div className="navbar-mobile-menu" onClick={(e) => e.stopPropagation()}>
              <Link to="/" onClick={closeMobileMenu}>Главная</Link>
              <Link to="/stars" onClick={closeMobileMenu}>Каталог Звёзд</Link>
            </div>
          </div>
        </div>
      </Container>
    </BSNavbar>
  )
}

export default Navbar