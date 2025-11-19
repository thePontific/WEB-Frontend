import { configureStore } from '@reduxjs/toolkit'
import starCartReducer from '../slices/starCartSlice'
import starsReducer from '../slices/starsSlice'

export const store = configureStore({
  reducer: {
    starCart: starCartReducer,
    stars: starsReducer,
  },
})

export type RootState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch