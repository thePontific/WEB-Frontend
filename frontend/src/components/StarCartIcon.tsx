import type { FC } from 'react'
import { useAppSelector } from '../store/hooks'
import './StarCartIcon.css'

export const StarCartIcon: FC = () => {
  const totalCount = useAppSelector((state) => state.starCart.totalCount)

  return (
    <div className="cart-icon">
      <img src="/WEB-Frontend/images/cart.png" alt="Star Cart" />
      <span className={`cart-count ${totalCount === 0 ? 'empty' : ''}`}>
        {totalCount}
      </span>
    </div>
  )
}