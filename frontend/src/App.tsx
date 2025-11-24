
import { BrowserRouter, Routes, Route } from "react-router-dom"
import HomePage from "./pages/HomePage"
import StarsPage from "./pages/StarsPage"
import StarDetailsPage from "./pages/StarDetailsPage"

import StarCartPage from './pages/StarCartPage'


function App() {
  return (
    <BrowserRouter basename="/WEB-Frontend">
      <Routes>
        <Route path="/" index element={<HomePage />} />
        <Route path="/stars" element={<StarsPage />} />
        <Route path="/stars/:id" element={<StarDetailsPage />} />
        <Route path="/star-cart" element={<StarCartPage />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App