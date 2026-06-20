import { Routes, Route } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Header } from './components/Header/index.js'
import { Hero } from './components/Hero/index.js'
import { ProductGrid } from './components/ProductGrid/index.js'
import { AIRecommendations } from './components/AIRecommendations/index.js'

import { Footer } from './components/Footer/index.js'
import { CartProvider } from './context/CartContext.jsx'
import { AuthPage, ResetPasswordPage } from './pages/AuthPage/index.js'

function App() {
  return (
    <CartProvider>
      <Toaster position="top-right" reverseOrder={false} />
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

        {/* Reset Password Page */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />
      </Routes>
    </CartProvider>
  )
}

export default App
