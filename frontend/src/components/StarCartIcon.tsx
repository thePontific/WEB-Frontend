import type { FC } from 'react'
import { useAppSelector } from '../store/hooks'
import './StarCartIcon.css'

export const StarCartIcon: FC = () => {
  // ИСПРАВЬ НА наш новый путь в Redux state
  const totalCount = useAppSelector((state) => state.ourData.SumStarCart)

  return (
    <div className="cart-icon">
      <img src="/WEB-Frontend/images/cart.png" alt="Star Cart" />
      <span className={`cart-count ${totalCount === 0 ? 'empty' : ''}`}>
        {totalCount}
      </span>
    </div>
  )
}