// src/slices/dataSlice.ts
import { createSlice } from "@reduxjs/toolkit"
import { useSelector } from "react-redux"

const dataSlice = createSlice({
    name: "data",
    initialState: {
        Data: [], // ПУСТОЙ массив по методичке
        SumStarCart: 0,
    },
    reducers: {
        setData(state, {payload}) {
            state.Data = payload
        },
        setSum(state, {payload}) {
            state.SumStarCart += payload // СУММИРУЕМ по методичке
        },
        delSum(state) {
            state.SumStarCart = 0 // ОБНУЛЯЕМ по методичке
        }
    }
})

export const useData = () =>
    useSelector((state: any) => state.ourData.Data)

export const useSum = () =>
    useSelector((state: any) => state.ourData.SumStarCart)

export const {
    setData: setDataAction,
    setSum: setSumAction,
    delSum: delSumAction
} = dataSlice.actions

export default dataSlice.reducer