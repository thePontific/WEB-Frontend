// src/pages/StarCartPage.tsx
import type { FC } from 'react'
import { useDispatch } from "react-redux"
import { delSumAction, setSumAction, useData, useSum } from "../slices/dataSlice"
import Navbar from '../components/Navbar'
import './StarCartPage.css'
import { useGetData } from '../hooks/useGetData'

const StarCartPage: FC = () => {
    const dispatch = useDispatch()
    const sum = useSum()
    const data = useData()
    
    // СТРОГО ПО МЕТОДИЧКЕ - вызов хука для загрузки данных
    useGetData()

    return (
        <>
            <Navbar />
            <div className="star-cart-page">
                <div className="large">Сумма заказа: {sum}</div>
                {data.map((star: any) => (
                    <div key={star.ID} className="star-item">
                        <p>{star.Title}</p>
                        <p>Расстояние - {star.Distance} св. лет</p>
                        <button onClick={() => {
                            dispatch(setSumAction(1)) // добавляем 1 к сумме
                        }}>
                            Добавить
                        </button>
                    </div>
                ))}
                <button onClick={() => {
                    dispatch(delSumAction())
                }}>
                    Обнулить
                </button>
            </div>
        </>
    )
}

export default StarCartPage