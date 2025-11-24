// src/hooks/useGetData.ts
import { useEffect } from "react"
import { useDispatch } from "react-redux"
import { setDataAction } from "../slices/dataSlice"
import { starsApi } from "../modules/api"

// СТРОГО ПО МЕТОДИЧКЕ - хук для AJAX запроса
export function useGetData() {
    const dispatch = useDispatch()
    
    async function fetchData() {
        try {
            const starsData = await starsApi.getStars({})
            console.log('📡 Данные от API:', starsData)
            dispatch(setDataAction(starsData))
        } catch (error) {
            console.error("Ошибка загрузки данных:", error)
        }
    }
    
    useEffect(() => {
        fetchData()
    }, [])
}