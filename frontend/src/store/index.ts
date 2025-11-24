import { configureStore } from "@reduxjs/toolkit"
import dataReducer from "../slices/dataSlice"
import filtersReducer from "../slices/filtersSlice" // ← путь может быть таким

// СТРОГО ПО МЕТОДИЧКЕ - наш store
export const store = configureStore({
    reducer: {
        ourData: dataReducer,  // "ourData" как в методичке
        filters: filtersReducer // ← ДОБАВЬ ЭТУ СТРОКУ
    }
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch