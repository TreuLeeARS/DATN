import { useState, useCallback, useEffect } from 'react'
import toast from 'react-hot-toast'
import cartApi from '../api/cartApi'
import productApi from '../api/productApi'
import { getIsLoggedIn } from '../utils/auth'
import { mapColor } from '../utils/productMapper'

const CART_STORAGE_KEY = 'pee_cart_items'
const MAX_ITEM_QUANTITY = 99

/**
 * Tạo unique key cho cart item dựa trên product + variant (size + color)
 * BIZ-02 FIX: Tránh gộp chung các variant khác nhau của cùng một sản phẩm
 */
const getCartItemKey = (product) => {
  const size = (product.selectedSize || '').toUpperCase()
  const color = (product.selectedColor || '').toLowerCase()
  return `${product.id}-${size}-${color}`
}

export const useCart = () => {
  const [cartItems, setCartItems] = useState(() => {
    if (getIsLoggedIn()) return []
    try {
      const saved = localStorage.getItem(CART_STORAGE_KEY)
      return saved ? JSON.parse(saved) : []
    } catch {
      return []
    }
  })
  const [loading, setLoading] = useState(false)

  // Lấy giỏ hàng từ Backend
  const fetchBackendCart = useCallback(async () => {
    // CRIT-01 FIX: Gọi hàm thay vì đọc stale const
    if (!getIsLoggedIn()) return
    try {
      setLoading(true)
      const response = await cartApi.getMyCart()
      if (response && response.data) {
        const dbCart = response.data
        // Ánh xạ dữ liệu từ backend DTO sang format frontend mong đợi
        const mappedItems = dbCart.items.map(item => {
          // Chuẩn hóa tên màu do BE trả về sang mã màu dùng để hiển thị.
          return {
            id: item.cartItemId, // ID trong giỏ hàng (sử dụng làm id)
            productVariantId: item.productVariantId,
            name: item.productName,
            price: item.price,
            quantity: item.quantity,
            selectedSize: item.size,
            selectedColor: item.color,
            selectedColorHex: mapColor(item.color).hex,
            images: item.images && item.images.length > 0 ? item.images : ['https://placehold.co/600x600/faf8f6/a3a3c2?text=No+Image'],
            subtotal: item.subtotal
          }
        })
        setCartItems(mappedItems)
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(mappedItems))
      }
    } catch (err) {
      console.error('Lỗi khi lấy giỏ hàng từ backend:', err)
    } finally {
      setLoading(false)
    }
  }, [])

  // Lấy giỏ hàng ban đầu khi load trang
  useEffect(() => {
    if (getIsLoggedIn()) {
      fetchBackendCart()
    }
  }, [fetchBackendCart])

  // Thêm sản phẩm vào giỏ hàng
  // BIZ-08 FIX: Không toast ở đây — để caller tự toast, tránh double toast
  const addItem = useCallback(async (product, quantity = 1) => {
    if (getIsLoggedIn()) {
      try {
        setLoading(true)
        let variantId = product.productVariantId

        // Nếu chưa có productVariantId, thực hiện tra cứu động từ tên sản phẩm
        if (!variantId) {
          if (!product.selectedSize || !product.selectedColor) {
            throw new Error('Vui lòng chọn đầy đủ màu sắc và kích cỡ trước khi thêm vào giỏ hàng.')
          }
          const searchRes = await productApi.searchProducts({ name: product.name })
          const matchedProduct = searchRes.data?.content?.find(
            item => item.name?.trim().toLowerCase() === product.name?.trim().toLowerCase()
          )
          if (matchedProduct) {
            const detailRes = await productApi.getProductDetail(matchedProduct.productId)
            const variants = detailRes.data?.variants || []
            
            // Chỉ chấp nhận đúng variant mà người dùng đã chọn.
            const requestedVariant = variants.find(
              v => v.size?.toUpperCase() === product.selectedSize.toUpperCase() &&
                   v.color?.toLowerCase() === product.selectedColor.toLowerCase()
            )

            if (requestedVariant && requestedVariant.quantityInStock > 0) {
              variantId = requestedVariant.productVariantId
            }
          }
        }

        if (!variantId) {
          throw new Error(`Sản phẩm "${product.name}" hiện không còn biến thể đã chọn trong kho.`)
        }

        await cartApi.addItem({
          productVariantId: variantId,
          quantity: quantity
        })
        await fetchBackendCart()
        return true
      } catch (err) {
        console.error('Lỗi khi thêm sản phẩm vào giỏ hàng backend:', err)
        throw err
      } finally {
        setLoading(false)
      }
    } else {
      // BIZ-02 FIX: Dedup bằng product+size+color thay vì chỉ product.id
      setCartItems(prev => {
        const itemKey = getCartItemKey(product)
        const existing = prev.find(item => getCartItemKey(item) === itemKey)
        let newItems
        if (existing) {
          // BIZ-03 FIX: Giới hạn số lượng tối đa
          newItems = prev.map(item =>
            getCartItemKey(item) === itemKey
              ? { ...item, quantity: Math.min(item.quantity + quantity, MAX_ITEM_QUANTITY) }
              : item
          )
        } else {
          newItems = [...prev, { ...product, quantity: Math.min(quantity, MAX_ITEM_QUANTITY) }]
        }
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems))
        return newItems
      })
      return true
    }
  }, [fetchBackendCart])

  // Xóa sản phẩm khỏi giỏ hàng
  const removeItem = useCallback(async (cartItemId) => {
    if (getIsLoggedIn()) {
      try {
        setLoading(true)
        await cartApi.removeItem(cartItemId)
        await fetchBackendCart()
      } catch (err) {
        console.error('Lỗi khi xóa sản phẩm trên backend:', err)
        toast.error('Không thể xóa sản phẩm. Vui lòng thử lại.')
      } finally {
        setLoading(false)
      }
    } else {
      setCartItems(prev => {
        const newItems = prev.filter(item => item.id !== cartItemId)
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems))
        return newItems
      })
    }
  }, [fetchBackendCart])

  // Cập nhật số lượng sản phẩm trong giỏ hàng
  const updateQuantity = useCallback(async (cartItemId, quantity) => {
    if (quantity <= 0) {
      await removeItem(cartItemId)
      return
    }

    // BIZ-03 FIX: Giới hạn số lượng tối đa
    const clampedQty = Math.min(quantity, MAX_ITEM_QUANTITY)

    if (getIsLoggedIn()) {
      try {
        setLoading(true)
        await cartApi.updateItem(cartItemId, { quantity: clampedQty })
        await fetchBackendCart()
      } catch (err) {
        console.error('Lỗi cập nhật số lượng trên backend:', err)
        toast.error('Vượt quá số lượng tồn kho của sản phẩm.')
      } finally {
        setLoading(false)
      }
    } else {
      setCartItems(prev => {
        const newItems = prev.map(item =>
          item.id === cartItemId ? { ...item, quantity: clampedQty } : item
        )
        localStorage.setItem(CART_STORAGE_KEY, JSON.stringify(newItems))
        return newItems
      })
    }
  }, [removeItem, fetchBackendCart])

  // Xóa toàn bộ giỏ hàng
  const clearCart = useCallback(async () => {
    if (getIsLoggedIn()) {
      try {
        setLoading(true)
        await cartApi.clearCart()
        await fetchBackendCart()
      } catch (err) {
        console.error('Lỗi xóa giỏ hàng trên backend:', err)
      } finally {
        setLoading(false)
      }
    } else {
      setCartItems([])
      localStorage.setItem(CART_STORAGE_KEY, JSON.stringify([]))
    }
  }, [fetchBackendCart])

  // Tự động khôi phục sản phẩm chọn dở sau khi đăng nhập thành công
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    const pendingStr = sessionStorage.getItem('pendingPurchase')
    if (token && pendingStr) {
      try {
        const { product, action } = JSON.parse(pendingStr)
        addItem(product, 1).then(() => {
          sessionStorage.removeItem('pendingPurchase')
          toast.success(`Đã thêm "${product.name}" vào giỏ hàng!`)
          if (action === 'buy') {
            setTimeout(() => {
              window.location.href = '/cart'
            }, 600)
          }
        }).catch(error => {
          console.error('Không thể khôi phục sản phẩm mua dở:', error)
          toast.error(error.message || 'Không thể thêm sản phẩm mua dở vào giỏ hàng.')
        })
      } catch (e) {
        console.error('Lỗi khôi phục sản phẩm mua dở:', e)
      }
    }
  }, [addItem])

  const count = cartItems.reduce((sum, item) => sum + item.quantity, 0)
  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  return {
    cartItems,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    refreshCart: fetchBackendCart,
    count,
    total,
    loading
  }
}
