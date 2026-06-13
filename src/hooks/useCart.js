import { useState, useCallback } from 'react'

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
