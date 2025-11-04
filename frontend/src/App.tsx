import { createBrowserRouter, RouterProvider } from 'react-router-dom'
import HomePage from './pages/HomePage'
import StarsPage from './pages/StarsPage'
import StarDetailsPage from './pages/StarDetailsPage'

const router = createBrowserRouter([
  {
    path: '/',
    element: <HomePage />,
  },
  {
    path: '/stars',
    element: <StarsPage />,
  },
  {
    path: '/stars/:id',
    element: <StarDetailsPage />,
  },
])

const App = () => {
  return <RouterProvider router={router} />
}

export default App