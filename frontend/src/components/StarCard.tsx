import type { FC } from 'react'
import { Card } from 'react-bootstrap'
import { Link } from 'react-router-dom'
import type{ Star } from '../types'

interface Props {
  star: Star
}

const StarCard: FC<Props> = ({ star }) => {
  const imageUrl = star.ImageName 
    ? `http://127.0.0.1:9000/cardsandromeda/${star.ImageName}`
    : 'images/default-star.jpg'

  return (
    <Card className="star-card" style={{ 
      width: '400px', 
      height: '600px', 
      background: '#000', 
      border: 'none',
      borderRadius: '0',
      overflow: 'hidden'
    }}>
      <Link to={`/stars/${star.ID}`} style={{ textDecoration: 'none', color: 'inherit' }}>
        <Card.Img 
          variant="top" 
          src={imageUrl}
          style={{ 
            width: '100%', 
            height: '100%', 
            objectFit: 'cover' 
          }}
          onError={(e) => {
            e.currentTarget.src = 'images/default-star.jpg'
          }}
        />
        
        <div style={{
          position: 'absolute',
          bottom: '0',
          left: '0',
          right: '0',
          padding: '40px',
          background: 'linear-gradient(transparent, rgba(0,0,0,0.8))'
        }}>
          <Card.Title style={{ 
            color: '#fff', 
            fontSize: '40px', 
            fontWeight: '700',
            fontFamily: 'Golos Text, sans-serif',
            marginBottom: '8px'
          }}>
            {star.Title}
          </Card.Title>
          <Card.Text style={{ 
            color: '#fff', 
            fontSize: '20px',
            fontFamily: 'Golos Text, sans-serif',
            fontWeight: '400',
            letterSpacing: '0.3em'
          }}>
            {star.Distance} св. лет
          </Card.Text>
        </div>
      </Link>
    </Card>
  )
}

export default StarCard