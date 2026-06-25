import { useState, useCallback, useEffect } from 'react'
import toast from 'react-hot-toast'

// Custom hook for managing shopping cart state
export const useCart = () => {
  const [cartItems, setCartItems] = useState([])

  const addItem = useCallback((product, quantity = 1) => {
    setCartItems(prev => {
      const existing = prev.find(
        item => item.id === product.id
      )
      if (existing) {
        return prev.map(item =>
          item.id === product.id
            ? { ...item, quantity: item.quantity + quantity }
            : item
        )
      }
      return [...prev, { ...product, quantity }]
    })
  }, [])

  // Tự động khôi phục sản phẩm chọn dở sau khi đăng nhập thành công
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    const pendingStr = sessionStorage.getItem('pendingPurchase')
    if (token && pendingStr) {
      try {
        const { product, action } = JSON.parse(pendingStr)
        addItem(product, 1)
        toast.success(`Đã tự động thêm "${product.name}" (Size ${product.selectedSize || 'S'} | ${product.selectedColor || 'Màu mặc định'}) vào giỏ hàng!`, {
          duration: 5000,
          icon: '🛍️'
        })
        sessionStorage.removeItem('pendingPurchase')

        if (action === 'buy') {
          setTimeout(() => {
            window.location.href = '/cart'
          }, 600)
        }
      } catch (e) {
        console.error('Lỗi khôi phục sản phẩm mua dở:', e)
      }
    }
  }, [addItem])

  const removeItem = useCallback((productId) => {
    setCartItems(prev => prev.filter(item => item.id !== productId))
  }, [])

  const updateQuantity = useCallback((productId, quantity) => {
    if (quantity <= 0) {
      removeItem(productId)
      return
    }
    setCartItems(prev =>
      prev.map(item =>
        item.id === productId ? { ...item, quantity } : item
      )
    )
  }, [removeItem])

  const clearCart = useCallback(() => {
    setCartItems([])
  }, [])

  const count = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return {
    cartItems,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    count,
    total,
  }
}
