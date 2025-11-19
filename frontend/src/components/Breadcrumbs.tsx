import type { FC } from 'react'
import { Breadcrumb } from 'react-bootstrap'
import { Link, useLocation } from 'react-router-dom'

interface Crumb {
  label: string
  path?: string
}

const Breadcrumbs: FC = () => {
  const location = useLocation()
  
  // Временно для отладки
  console.log('Breadcrumbs location:', location.pathname)
  
  const getCrumbs = (): Crumb[] => {
    const paths = location.pathname.split('/').filter(path => path)
    console.log('Breadcrumbs paths:', paths)
    
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
    
    console.log('Breadcrumbs crumbs:', crumbs)
    return crumbs
  }

  const crumbs = getCrumbs()

  return (
    <Breadcrumb className="mb-3" style={{ fontSize: '16px' , paddingTop: '10px'}}>
      {crumbs.map((crumb, index) => (
        <Breadcrumb.Item 
          key={index}
          active={index === crumbs.length - 1}
          linkAs={crumb.path ? Link : undefined}
          linkProps={crumb.path ? { to: crumb.path } : undefined}
          style={{ 
            fontFamily: 'Golos Text, sans-serif',
            fontSize: '16px'
          }}
        >
          {crumb.label}
        </Breadcrumb.Item>
      ))}
    </Breadcrumb>
  )
}

export default Breadcrumbs