import type { FC } from 'react'
import { Navbar as BSNavbar, Container } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import Breadcrumbs from './Breadcrumbs'
import './Navbar.css';

const Navbar: FC = () => {
  return (
    <BSNavbar 
      fixed="top"
      className="custom-navbar"
      variant="dark"
      style={{ 
        backgroundColor: '#000000',
        zIndex: 1030,
        padding: '0',
        position: 'relative'
      }}
    >
      {/* Хлебные крошки ВНЕ Container - на всю ширину */}
      <div className="navbar-breadcrumbs" style={{ fontSize: '24px' }}>
        <Breadcrumbs />
      </div>

      <Container>
        <div className="d-flex justify-content-between align-items-center w-100" style={{ height: '80px' }}>
          
          <div style={{ width: '80px' }}></div>

          <Link to="/" className="navbar-brand-center">
            <img 
              src="/images/icon.png" 
              alt="Icon" 
              style={{ 
                height: '45px', 
                width: 'auto' 
              }}
            />
          </Link>

          <div style={{ width: '80px' }}></div>

        </div>
      </Container>
    </BSNavbar>
  )
}

export default Navbar