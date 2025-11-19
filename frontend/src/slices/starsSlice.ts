import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { StarWithImage } from '../modules/api'

interface StarsState {
  stars: StarWithImage[]
  loading: boolean
  error: string | null
}

const initialState: StarsState = {
  stars: [],
  loading: false,
  error: null,
}

const starsSlice = createSlice({
  name: 'stars',
  initialState,
  reducers: {
    setData: (state, action: PayloadAction<StarWithImage[]>) => {
      state.stars = action.payload
    },
    setLoading: (state, action: PayloadAction<boolean>) => {
      state.loading = action.payload
    },
    setError: (state, action: PayloadAction<string | null>) => {
      state.error = action.payload
    },
  },
})

export const { setData, setLoading, setError } = starsSlice.actions
export default starsSlice.reducer