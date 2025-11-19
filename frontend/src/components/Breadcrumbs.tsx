import type { FC } from 'react'
import { Link, useLocation } from 'react-router-dom'
import './Breadcrumbs.css'

interface Crumb {
  label: string
  path?: string
}

const Breadcrumbs: FC = () => {
  const location = useLocation()
  
  const getCrumbs = (): Crumb[] => {
    const paths = location.pathname.split('/').filter(path => path)
    
    const crumbs: Crumb[] = [{ label: 'Главная', path: '/' }]
    
    let currentPath = ''
    paths.forEach(path => {
      currentPath += `/${path}`
      
      if (path === 'stars') {
        crumbs.push({ 
          label: 'Каталог Звёзд', 
          path: currentPath 
        })
      } else if (!isNaN(Number(path))) {
        crumbs.push({ 
          label: 'Детали Звезды'
        })
      }
    })
    
    return crumbs
  }

  const crumbs = getCrumbs()

  return (
    <nav className="custom-breadcrumbs">
      {crumbs.map((crumb, index) => (
        <div key={index} className="breadcrumb-item">
          {crumb.path ? (
            <Link to={crumb.path} className="breadcrumb-link">
              {crumb.label}
            </Link>
          ) : (
            <span className="breadcrumb-current">
              {crumb.label}
            </span>
          )}
          
          {/* Разделитель ТОЛЬКО если есть следующий элемент */}
          {index < crumbs.length - 1 && crumbs[index + 1] && (
            <span className="breadcrumb-separator"></span>
          )}
        </div>
      ))}
    </nav>
  )
}

export default Breadcrumbs