import { Routes, Route } from 'react-router-dom'
import { Header } from './components/Header/index.js'
import { Hero } from './components/Hero/index.js'
import { ProductGrid } from './components/ProductGrid/index.js'
import { AIRecommendations } from './components/AIRecommendations/index.js'

import { Footer } from './components/Footer/index.js'
import { CartProvider } from './context/CartContext.jsx'
import { AuthPage } from './pages/AuthPage/index.js'

function App() {
  return (
    <CartProvider>
      <Routes>
        {/* Landing Page */}
        <Route
          path="/"
          element={
            <>
              <Header />
              <main>
                <Hero />
                <ProductGrid />
                <AIRecommendations />
              </main>
              <Footer />

            </>
          }
        />

        {/* Auth Page (Login / Register) */}
        <Route path="/auth" element={<AuthPage />} />
      </Routes>
    </CartProvider>
  )
}

export default App
