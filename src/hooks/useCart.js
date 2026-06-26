import { useState, useCallback, useEffect } from 'react'
import toast from 'react-hot-toast'
import cartApi from '../api/cartApi'
import productApi from '../api/productApi'
import { products as localProducts } from '../data/products'

export const useCart = () => {
  const [cartItems, setCartItems] = useState([])
  const [loading, setLoading] = useState(false)

  // Kiểm tra trạng thái đăng nhập
  const isLoggedIn = !!localStorage.getItem('accessToken')

  // Lấy giỏ hàng từ Backend
  const fetchBackendCart = useCallback(async () => {
    if (!isLoggedIn) return
    try {
      setLoading(true)
      const response = await cartApi.getMyCart()
      if (response && response.data) {
        const dbCart = response.data
        // Ánh xạ dữ liệu từ backend DTO sang format frontend mong đợi
        const mappedItems = dbCart.items.map(item => {
          // Tìm mã màu hex tương ứng từ file products.js tĩnh để giao diện hiển thị đúng màu sắc
          let selectedColorHex = ''
          const localProd = localProducts.find(p => p.name === item.productName)
          if (localProd && localProd.colors) {
            const matchedColor = localProd.colors.find(c => c.name.toLowerCase() === item.color.toLowerCase())
            if (matchedColor) selectedColorHex = matchedColor.hex
          }

          return {
            id: item.cartItemId, // ID trong giỏ hàng (sử dụng làm id)
            productVariantId: item.productVariantId,
            name: item.productName,
            price: item.price,
            quantity: item.quantity,
            selectedSize: item.size,
            selectedColor: item.color,
            selectedColorHex: selectedColorHex,
            images: item.images && item.images.length > 0 ? item.images : ['https://images.unsplash.com/photo-1609357605129-26f69add5d6e?q=80&w=600&auto=format&fit=crop'],
            subtotal: item.subtotal
          }
        })
        setCartItems(mappedItems)
        localStorage.setItem('pee_cart_items', JSON.stringify(mappedItems))
      }
    } catch (err) {
      console.error('Lỗi khi lấy giỏ hàng từ backend:', err)
    } finally {
      setLoading(false)
    }
  }, [isLoggedIn])

  // Lấy giỏ hàng ban đầu khi load trang
  useEffect(() => {
    if (isLoggedIn) {
      fetchBackendCart()
    } else {
      // Nếu chưa đăng nhập, đọc từ localStorage như cũ
      try {
        const saved = localStorage.getItem('pee_cart_items')
        setCartItems(saved ? JSON.parse(saved) : [])
      } catch (e) {
        console.error('Lỗi đọc giỏ hàng từ localStorage:', e)
        setCartItems([])
      }
    }
  }, [isLoggedIn, fetchBackendCart])

  // Thêm sản phẩm vào giỏ hàng
  const addItem = useCallback(async (product, quantity = 1) => {
    if (isLoggedIn) {
      try {
        setLoading(true)
        let variantId = product.productVariantId

        // Nếu chưa có productVariantId, thực hiện tra cứu động từ tên sản phẩm
        if (!variantId) {
          const searchRes = await productApi.searchProducts({ name: product.name })
          const matchedProduct = searchRes.data?.content?.[0]
          if (matchedProduct) {
            const detailRes = await productApi.getProductDetail(matchedProduct.productId)
            const variants = detailRes.data?.variants || []
            
            // Tìm variant khớp với size và color được chọn
            const foundVariant = variants.find(
              v => v.size.toUpperCase() === (product.selectedSize || 'S').toUpperCase() &&
                   v.color.toLowerCase() === (product.selectedColor || 'Beige').toLowerCase()
            )
            if (foundVariant) {
              variantId = foundVariant.productVariantId
            }
          }
        }

        if (!variantId) {
          toast.error(`Sản phẩm "${product.name}" hiện tại không có sẵn biến thể này trong kho.`)
          return
        }

        await cartApi.addItem({
          productVariantId: variantId,
          quantity: quantity
        })
        toast.success(`Đã thêm "${product.name}" vào giỏ hàng hệ thống!`)
        await fetchBackendCart()
      } catch (err) {
        console.error('Lỗi khi thêm sản phẩm vào giỏ hàng backend:', err)
        toast.error('Không thể thêm sản phẩm vào giỏ hàng. Vui lòng thử lại.')
      } finally {
        setLoading(false)
      }
    } else {
      // Logic LocalStorage khi chưa đăng nhập
      setCartItems(prev => {
        const existing = prev.find(item => item.id === product.id)
        let newItems
        if (existing) {
          newItems = prev.map(item =>
            item.id === product.id ? { ...item, quantity: item.quantity + quantity } : item
          )
        } else {
          newItems = [...prev, { ...product, quantity }]
        }
        localStorage.setItem('pee_cart_items', JSON.stringify(newItems))
        return newItems
      })
      toast.success(`Đã thêm "${product.name}" vào giỏ hàng tạm thời!`)
    }
  }, [isLoggedIn, fetchBackendCart])

  // Xóa sản phẩm khỏi giỏ hàng
  const removeItem = useCallback(async (cartItemId) => {
    if (isLoggedIn) {
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
        localStorage.setItem('pee_cart_items', JSON.stringify(newItems))
        return newItems
      })
    }
  }, [isLoggedIn, fetchBackendCart])

  // Cập nhật số lượng sản phẩm trong giỏ hàng
  const updateQuantity = useCallback(async (cartItemId, quantity) => {
    if (quantity <= 0) {
      await removeItem(cartItemId)
      return
    }

    if (isLoggedIn) {
      try {
        setLoading(true)
        await cartApi.updateItem(cartItemId, { quantity })
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
          item.id === cartItemId ? { ...item, quantity } : item
        )
        localStorage.setItem('pee_cart_items', JSON.stringify(newItems))
        return newItems
      })
    }
  }, [isLoggedIn, removeItem, fetchBackendCart])

  // Xóa toàn bộ giỏ hàng
  const clearCart = useCallback(async () => {
    if (isLoggedIn) {
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
      localStorage.setItem('pee_cart_items', JSON.stringify([]))
    }
  }, [isLoggedIn, fetchBackendCart])

  // Tự động khôi phục sản phẩm chọn dở sau khi đăng nhập thành công
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    const pendingStr = sessionStorage.getItem('pendingPurchase')
    if (token && pendingStr) {
      try {
        const { product, action } = JSON.parse(pendingStr)
        addItem(product, 1).then(() => {
          sessionStorage.removeItem('pendingPurchase')
          if (action === 'buy') {
            setTimeout(() => {
              window.location.href = '/cart'
            }, 600)
          }
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
    count,
    total,
    loading
  }
}
