import { useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { Toaster } from 'react-hot-toast'
import { Header } from './components/Header/index.js'
import { Hero } from './components/Hero/index.js'
import { ProductGrid } from './components/ProductGrid/index.js'
import { AIRecommendations } from './components/AIRecommendations/index.js'

import { Footer } from './components/Footer/index.js'
import { CartProvider } from './context/CartContext.jsx'
import { AuthPage, ResetPasswordPage } from './pages/AuthPage/index.js'
import { ShopPage } from './pages/ShopPage/index.js'
import { CartPage } from './pages/CartPage/index.js'
import { ShopPromptModal } from './components/ShopPromptModal/ShopPromptModal.jsx'

function App() {
  const location = useLocation()

  useEffect(() => {
    // Kiểm tra xem có yêu cầu cuộn trang nào được lưu trữ không
    const targetHash = sessionStorage.getItem('scrollTarget')
    if (targetHash && location.pathname === '/') {
      sessionStorage.removeItem('scrollTarget')
      // Đợi DOM render xong rồi mới thực hiện cuộn
      const timer = setTimeout(() => {
        const element = document.getElementById(targetHash)
        if (element) {
          element.scrollIntoView({ behavior: 'smooth' })
        }
      }, 300)
      return () => clearTimeout(timer)
    }
  }, [location.pathname])

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
                <div id="home"><Hero /></div>
                <div id="collections">
                  <div id="sale">
                    <ProductGrid />
                  </div>
                </div>
                <div id="new-arrivals">
                  <AIRecommendations />
                </div>
              </main>
              <Footer />
              <ShopPromptModal />
            </>
          }
        />

        {/* Auth Page (Login / Register) */}
        <Route path="/auth" element={<AuthPage />} />

        {/* Reset Password Page */}
        <Route path="/reset-password" element={<ResetPasswordPage />} />

        {/* Shop Page */}
        <Route path="/shop" element={<ShopPage />} />

        {/* Cart / Checkout Page */}
        <Route path="/cart" element={<CartPage />} />
      </Routes>
    </CartProvider>
  )
}

export default App
