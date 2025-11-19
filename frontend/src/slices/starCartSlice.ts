import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import type { StarWithImage } from '../modules/api'

interface StarCartState {
  items: StarWithImage[]
  totalCount: number
}

const initialState: StarCartState = {
  items: [],
  totalCount: 0,
}

const starCartSlice = createSlice({
  name: 'starCart',
  initialState,
  reducers: {
    setData: (state, action: PayloadAction<StarWithImage[]>) => {
      state.items = action.payload
    },
    addToStarCart: (state, action: PayloadAction<StarWithImage>) => {
      const existingItem = state.items.find(item => item.ID === action.payload.ID)
      if (!existingItem) {
        state.items.push(action.payload)
        state.totalCount += 1
      }
    },
    removeFromStarCart: (state, action: PayloadAction<number>) => {
      state.items = state.items.filter(item => item.ID !== action.payload)
      state.totalCount = state.items.length
    },
    clearStarCart: (state) => {
      state.items = []
      state.totalCount = 0
    },
  },
})

export const { setData, addToStarCart, removeFromStarCart, clearStarCart } = starCartSlice.actions
export default starCartSlice.reducer