// src/slices/filtersSlice.ts
import { createSlice } from "@reduxjs/toolkit"
import { useSelector } from "react-redux"

const filtersSlice = createSlice({
    name: "filters",
    initialState: {
        searchTerm: "",
        minDistance: "",
        maxDistance: "", 
        starType: "",
        minMagnitude: "",
        maxMagnitude: ""
    },
    reducers: {
        setFilters(state, {payload}) {
            return { ...state, ...payload }
        },
        resetFilters(state) {
            return {
                searchTerm: "",
                minDistance: "", 
                maxDistance: "",
                starType: "",
                minMagnitude: "",
                maxMagnitude: ""
            }
        }
    }
})

export const useFilters = () =>
    useSelector((state: any) => state.filters)

export const {
    setFilters: setFiltersAction,
    resetFilters: resetFiltersAction
} = filtersSlice.actions

export default filtersSlice.reducer