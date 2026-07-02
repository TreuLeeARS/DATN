import { useEffect, lazy, Suspense } from 'react'
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
import { ErrorBoundary } from './components/ErrorBoundary.jsx'
import { NotFoundPage } from './pages/NotFoundPage.jsx'
import { AboutPage } from './pages/AboutPage/AboutPage.jsx'

// Admin Panel Components & Pages (Lazy loaded for client performance)
import { AdminProtectedRoute } from './components/AdminProtectedRoute.jsx'
import { AdminLayout } from './components/AdminLayout.jsx'
import { MyOrders } from './pages/ShopPage/MyOrders.jsx'

const AdminDashboard = lazy(() => import('./pages/Admin/AdminDashboard.jsx').then(m => ({ default: m.AdminDashboard })))
const CategoryManager = lazy(() => import('./pages/Admin/CategoryManager.jsx').then(m => ({ default: m.CategoryManager })))
const ProductManager = lazy(() => import('./pages/Admin/ProductManager.jsx').then(m => ({ default: m.ProductManager })))
const OrderManager = lazy(() => import('./pages/Admin/OrderManager.jsx').then(m => ({ default: m.OrderManager })))
const UserManager = lazy(() => import('./pages/Admin/UserManager.jsx').then(m => ({ default: m.UserManager })))
const CouponManager = lazy(() => import('./pages/Admin/CouponManager.jsx').then(m => ({ default: m.CouponManager })))
const PopupManager = lazy(() => import('./pages/Admin/PopupManager.jsx').then(m => ({ default: m.PopupManager })))

// Simple loading indicator for Suspense
const AdminLoading = () => (
  <div className="flex items-center justify-center min-h-[400px]">
    <div className="w-8 h-8 border-4 border-brand-charcoal border-t-transparent rounded-full animate-spin"></div>
  </div>
)

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
    <ErrorBoundary>
      <CartProvider>
        <Toaster
          position="top-center"
          reverseOrder={false}
          containerStyle={{
            zIndex: 999999,
          }}
          toastOptions={{
            duration: 3500,
            style: {
              zIndex: 999999,
              borderRadius: '14px',
              background: '#0f172a',
              color: '#f8fafc',
              boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.3), 0 8px 10px -6px rgba(0, 0, 0, 0.3)',
              padding: '12px 24px',
              fontSize: '14px',
              fontWeight: '600',
              border: '1px solid rgba(255, 255, 255, 0.1)',
            },
            success: {
              iconTheme: {
                primary: '#10b981',
                secondary: '#ffffff',
              },
            },
            error: {
              iconTheme: {
                primary: '#f43f5e',
                secondary: '#ffffff',
              },
            },
          }}
        />
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

          {/* Customer Order History Page */}
          <Route path="/my-orders" element={<MyOrders />} />

          {/* About us page */}
          <Route path="/about" element={<AboutPage />} />

          {/* Admin Panel Route Group */}
          <Route
            path="/admin"
            element={
              <AdminProtectedRoute>
                <AdminLayout />
              </AdminProtectedRoute>
            }
          >
            <Route index element={<AdminDashboard />} />
            <Route path="categories" element={<CategoryManager />} />
            <Route path="products" element={<ProductManager />} />
            <Route path="orders" element={<OrderManager />} />
            <Route path="users" element={<UserManager />} />
            <Route path="coupons" element={<CouponManager />} />
            <Route path="popups" element={<PopupManager />} />
          </Route>

          {/* IMP-01 FIX: Catch-all route to prevent blank page for invalid paths */}
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
      </CartProvider>
    </ErrorBoundary>
  )
}

export default App
