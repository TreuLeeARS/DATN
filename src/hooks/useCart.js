import { useState, useCallback, useEffect } from 'react'
import toast from 'react-hot-toast'

// Custom hook for managing shopping cart state
export const useCart = () => {
  const [cartItems, setCartItems] = useState(() => {
    try {
      const saved = localStorage.getItem('pee_cart_items')
      return saved ? JSON.parse(saved) : []
    } catch (e) {
      console.error('Lỗi đọc giỏ hàng từ localStorage:', e)
      return []
    }
  })

  // Đồng bộ giỏ hàng với localStorage mỗi khi thay đổi
  useEffect(() => {
    localStorage.setItem('pee_cart_items', JSON.stringify(cartItems))
  }, [cartItems])

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
        
        // Thêm sản phẩm trực tiếp và đồng bộ ngay lập tức với localStorage để tránh race condition khi reload
        setCartItems(prev => {
          const existing = prev.find(item => item.id === product.id)
          let newItems
          if (existing) {
            newItems = prev.map(item =>
              item.id === product.id ? { ...item, quantity: item.quantity + 1 } : item
            )
          } else {
            newItems = [...prev, { ...product, quantity: 1 }]
          }
          localStorage.setItem('pee_cart_items', JSON.stringify(newItems))
          return newItems
        })

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
  }, [])

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
