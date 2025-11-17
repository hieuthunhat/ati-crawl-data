import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import InputPage from './pages/InputPage'
import ProductsPage from './pages/ProductsPage'
import './App.css'

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<InputPage />} />
        <Route path="/products" element={<ProductsPage />} />
      </Routes>
    </Router>
  )
}

export default App
