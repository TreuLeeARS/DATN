import { useState, useLayoutEffect, useRef, useEffect } from 'react'
import { formatVND } from '../../utils/price.js'
import { Link, useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import toast from 'react-hot-toast'
import { Header } from '../../components/Header/Header.jsx'
import { Footer } from '../../components/Footer/Footer.jsx'
import { useCartContext } from '../../context/CartContext.jsx'
import orderApi from '../../api/orderApi.js'
import paymentApi from '../../api/paymentApi.js'

export const CartPage = () => {
  const navigate = useNavigate()
  const { cartItems, removeItem, updateQuantity, clearCart, total } = useCartContext()

  const [selectedItemIds, setSelectedItemIds] = useState([])

  // Kiểm tra đăng nhập, nếu chưa đăng nhập thì đẩy về trang đăng nhập
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      toast.error('Vui lòng đăng nhập để xem giỏ hàng và thực hiện thanh toán.')
      sessionStorage.setItem('authRedirectUrl', '/cart')
      navigate('/auth', { replace: true })
    }
  }, [navigate])

  // Kiểm tra và khởi tạo sản phẩm được chọn thanh toán
  useEffect(() => {
    const checkoutOnlyId = sessionStorage.getItem('checkoutOnlyProductId')
    if (checkoutOnlyId) {
      // Chỉ tự động chọn nếu sản phẩm này đã xuất hiện trong giỏ hàng
      const exists = cartItems.some(item => item.id === checkoutOnlyId)
      if (exists) {
        setSelectedItemIds([checkoutOnlyId])
        sessionStorage.removeItem('checkoutOnlyProductId')
      }
    }
  }, [cartItems])

  const handleToggleSelectItem = (id) => {
    setSelectedItemIds(prev =>
      prev.includes(id) ? prev.filter(itemId => itemId !== id) : [...prev, id]
    )
  }

  const handleToggleSelectAll = () => {
    setSelectedItemIds(prev =>
      prev.length === cartItems.length ? [] : cartItems.map(item => item.id)
    )
  }

  // State thông tin nhận hàng
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    paymentMethod: 'cod', // 'cod' | 'bank'
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderInfo, setOrderInfo] = useState(null)

  const pageRef = useRef(null)

  // GSAP animation cho trang giỏ hàng
  useLayoutEffect(() => {
    const ctx = gsap.context(() => {
      gsap.from('.cart-anim-item', {
        opacity: 0,
        y: 30,
        duration: 0.6,
        stagger: 0.1,
        ease: 'power3.out',
      })
    }, pageRef)
    return () => ctx.revert()
  }, [orderSuccess])

  const handleChange = (e) => {
    const { name, value } = e.target
    setForm(prev => ({ ...prev, [name]: value }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validateForm = () => {
    const newErrors = {}

    if (!form.fullName.trim()) {
      newErrors.fullName = 'Vui lòng nhập họ và tên người nhận'
    }

    if (!form.phone.trim()) {
      newErrors.phone = 'Vui lòng nhập số điện thoại'
    } else if (!/^(0[3|5|7|8|9])[0-9]{8}$/.test(form.phone.trim())) {
      newErrors.phone = 'Số điện thoại không đúng định dạng (phải có 10 chữ số)'
    }

    if (!form.address.trim()) {
      newErrors.address = 'Vui lòng nhập địa chỉ giao hàng chi tiết'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const selectedItems = cartItems.filter(item => selectedItemIds.includes(item.id))
  const selectedTotal = selectedItems.reduce((sum, item) => sum + item.price * item.quantity, 0)

  // Đọc mã giảm giá đã áp dụng từ sessionStorage
  const appliedPromo = sessionStorage.getItem('appliedPromoCode')
  const discountAmount = appliedPromo === 'PEESTART15' ? Math.round(selectedTotal * 0.15) : 0

  // Tính toán phí vận chuyển (Free ship cho đơn hàng >= 1 triệu VND, ngược lại phí ship là 30k)
  const shippingFee = selectedTotal >= 1000000 ? 0 : 30000
  const finalTotal = Math.max(0, selectedTotal - discountAmount + shippingFee)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validateForm()) {
      toast.error('Vui lòng điền đầy đủ và chính xác thông tin giao hàng!')
      return
    }

    setIsSubmitting(true)

    try {
      // Chuẩn bị payload checkout
      const checkoutData = {
        shippingAddress: `${form.fullName} | SĐT: ${form.phone} | Địa chỉ: ${form.address}`,
        couponCode: appliedPromo || null,
        paymentMethodType: form.paymentMethod === 'cod' ? 'COD' : 'VNPAY'
      }

      // 1. Tạo đơn hàng trên backend
      const res = await orderApi.checkout(checkoutData)
      
      if (res && res.data) {
        const orderData = res.data
        
        // 2. Nếu là COD, thực hiện tạo thanh toán COD tương ứng
        if (form.paymentMethod === 'cod') {
          await paymentApi.createCodPayment({
            orderId: orderData.orderId,
            amount: orderData.totalAmount
          })
        }
        
        // Cấu trúc dữ liệu hiển thị màn hình đặt hàng thành công
        const mappedOrderInfo = {
          orderId: orderData.orderId,
          fullName: form.fullName,
          phone: form.phone,
          address: orderData.shippingAddress,
          paymentMethod: form.paymentMethod,
          total: orderData.totalAmount,
          items: orderData.items.map(item => ({
            id: item.productVariantId,
            name: item.productName,
            price: item.unitPrice,
            quantity: item.quantity,
            selectedSize: item.size,
            selectedColor: item.color,
            images: ['https://placehold.co/600x600/faf8f6/a3a3c2?text=No+Image']
          })),
          discount: orderData.discountValue,
          shippingFee: 0
        }

        setOrderInfo(mappedOrderInfo)
        setOrderSuccess(true)
        
        // Xóa giỏ hàng local và reload giỏ hàng từ backend
        await clearCart()
        setSelectedItemIds([])
        toast.success('Đặt đơn hàng thành công!')
      }
    } catch (err) {
      console.error('Lỗi khi thanh toán đơn hàng:', err)
      const errorMsg = err.response?.data?.message || 'Không thể tạo đơn hàng. Vui lòng kiểm tra lại.'
      toast.error(errorMsg)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <>
      <Header />

      <main ref={pageRef} className="pt-28 min-h-screen bg-brand-cream pb-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          
          {/* Màn hình ĐẶT HÀNG THÀNH CÔNG */}
          {orderSuccess && orderInfo ? (
            <div className="max-w-2xl mx-auto bg-white rounded-2xl shadow-lg border border-gray-100 p-8 text-center cart-anim-item">
              {/* Checkmark Icon */}
              <div className="w-20 h-20 bg-green-50 rounded-full flex items-center justify-center mx-auto mb-6 text-green-500 animate-pulse-subtle border border-green-100">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              </div>

              <h2 className="font-display text-3xl font-bold text-brand-charcoal mb-2">
                Đặt Hàng Thành Công!
              </h2>
              <p className="text-brand-muted text-sm mb-6 leading-relaxed">
                Cảm ơn bạn đã lựa chọn mua sắm tại <span className="font-semibold text-brand-charcoal">OUTTA</span>. 
                Đơn hàng của bạn đã được ghi nhận và đang chờ xử lý giao nhận.
              </p>

              {/* Order Invoice Details */}
              <div className="bg-brand-cream/50 rounded-xl p-5 text-left border border-gray-200/50 mb-8 flex flex-col gap-3">
                <div className="flex justify-between border-b border-gray-200/60 pb-2">
                  <span className="text-xs font-bold uppercase tracking-wider text-brand-muted">Mã đơn hàng:</span>
                  <span className="text-sm font-bold text-brand-charcoal">{orderInfo.orderId}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-brand-muted">Người nhận:</span>
                  <span className="text-sm font-semibold text-brand-charcoal">{orderInfo.fullName}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-brand-muted">Số điện thoại:</span>
                  <span className="text-sm font-semibold text-brand-charcoal">{orderInfo.phone}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-brand-muted">Địa chỉ nhận hàng:</span>
                  <span className="text-sm font-semibold text-brand-charcoal text-right max-w-[280px] break-words">{orderInfo.address}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-brand-muted">Phương thức thanh toán:</span>
                  <span className="text-sm font-semibold text-brand-charcoal">
                    {orderInfo.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng (COD)' : 'Chuyển khoản ngân hàng'}
                  </span>
                </div>
                <div className="flex justify-between border-t border-gray-200/60 pt-3 font-semibold">
                  <span className="text-sm text-brand-charcoal">Tổng cộng:</span>
                  <span className="text-base text-brand-charcoal">{formatVND(orderInfo.total)}</span>
                </div>
              </div>

              {/* Bank Transfer Guide Box */}
              {orderInfo.paymentMethod === 'bank' && (
                <div className="mb-8 p-5 bg-brand-blush/10 rounded-xl border border-brand-blush/40 text-left animate-slide-up">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-brand-charcoal" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    <span className="font-semibold text-brand-charcoal text-sm uppercase tracking-wider">Thông tin chuyển khoản:</span>
                  </div>
                  <ul className="text-xs text-brand-charcoal flex flex-col gap-1.5 leading-relaxed">
                    <li>• Ngân hàng: <span className="font-bold">MB Bank (Ngân hàng Quân đội)</span></li>
                    <li>• Số tài khoản: <span className="font-bold text-sm tracking-wide text-brand-charcoal">0398123456</span></li>
                    <li>• Chủ tài khoản: <span className="font-bold">LE MINH TRIEU</span></li>
                    <li>• Nội dung chuyển khoản: <span className="font-bold text-brand-charcoal bg-white px-2 py-0.5 border border-brand-blush rounded">{orderInfo.orderId}</span></li>
                  </ul>
                  <p className="text-[10px] text-brand-muted mt-3 italic">
                    * Lưu ý: Vui lòng chuyển khoản đúng nội dung và số tiền trên để đơn hàng được duyệt tự động nhanh nhất.
                  </p>
                </div>
              )}

              <Link to="/" className="btn-primary inline-block py-3 px-8 rounded-lg text-sm tracking-wider">
                Tiếp tục mua sắm
              </Link>
            </div>
          ) : cartItems.length === 0 ? (
            /* Giỏ hàng trống */
            <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-100 p-12 text-center cart-anim-item">
              <div className="w-20 h-20 bg-brand-cream rounded-full flex items-center justify-center mx-auto mb-6 text-brand-muted">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4l1-12z" />
                </svg>
              </div>
              <h2 className="font-display text-2xl font-bold text-brand-charcoal mb-3">
                Giỏ hàng của bạn trống
              </h2>
              <p className="text-brand-muted text-sm mb-8 max-w-xs mx-auto">
                Hiện chưa có sản phẩm nào trong giỏ hàng. Hãy lướt xem bộ sưu tập và chọn những món đồ bạn yêu thích nhé!
              </p>
              <Link to="/" className="btn-primary inline-block py-3 px-8 rounded-lg text-sm tracking-wider">
                Quay lại mua sắm
              </Link>
            </div>
          ) : (
            /* Giỏ hàng có sản phẩm, hiển thị giao diện đặt hàng */
            <div className="flex flex-col lg:flex-row gap-8 items-start">
              
              {/* ═══════════ LEFT COLUMN: SHIPPING FORM OR PLACEHOLDER ═══════════ */}
              {selectedItemIds.length > 0 ? (
                <div className="w-full lg:w-3/5 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm cart-anim-item animate-fade-in">
                  <h2 className="font-display text-2xl font-bold text-brand-charcoal mb-6 border-b border-gray-100 pb-4">
                    Thông tin giao hàng
                  </h2>

                  <form onSubmit={handleSubmit} className="flex flex-col gap-5">
                    {/* Full Name */}
                    <div>
                      <label htmlFor="fullName" className="block text-xs font-semibold uppercase tracking-wider text-brand-muted mb-2">
                        Họ và tên người nhận
                      </label>
                      <input
                        type="text"
                        name="fullName"
                        id="fullName"
                        value={form.fullName}
                        onChange={handleChange}
                        placeholder="Nguyễn Văn A"
                        className="input-base"
                        disabled={isSubmitting}
                      />
                      {errors.fullName && (
                        <p className="text-red-400 text-xs mt-2 animate-slide-up">{errors.fullName}</p>
                      )}
                    </div>

                    {/* Phone */}
                    <div>
                      <label htmlFor="phone" className="block text-xs font-semibold uppercase tracking-wider text-brand-muted mb-2">
                        Số điện thoại nhận hàng
                      </label>
                      <input
                        type="tel"
                        name="phone"
                        id="phone"
                        value={form.phone}
                        onChange={handleChange}
                        placeholder="09XXXXXXXX"
                        className="input-base"
                        disabled={isSubmitting}
                      />
                      {errors.phone && (
                        <p className="text-red-400 text-xs mt-2 animate-slide-up">{errors.phone}</p>
                      )}
                    </div>

                    {/* Address */}
                    <div>
                      <label htmlFor="address" className="block text-xs font-semibold uppercase tracking-wider text-brand-muted mb-2">
                        Địa chỉ nhận hàng chi tiết
                      </label>
                      <textarea
                        name="address"
                        id="address"
                        rows="3"
                        value={form.address}
                        onChange={handleChange}
                        placeholder="Số nhà, Tên đường, Phường/Xã, Quận/Huyện, Tỉnh/Thành Phố..."
                        className="input-base resize-none"
                        disabled={isSubmitting}
                      />
                      {errors.address && (
                        <p className="text-red-400 text-xs mt-2 animate-slide-up">{errors.address}</p>
                      )}
                    </div>

                    {/* Payment Method Selector */}
                    <div className="mt-4">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted mb-3">
                        Phương thức thanh toán
                      </label>
                      <div className="flex flex-col sm:flex-row gap-3">
                        {/* COD option */}
                        <label
                          className={`flex-1 flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${
                            form.paymentMethod === 'cod'
                              ? 'border-brand-charcoal bg-brand-cream/30 ring-1 ring-brand-charcoal'
                              : 'border-gray-200 hover:border-brand-charcoal/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="cod"
                              checked={form.paymentMethod === 'cod'}
                              onChange={handleChange}
                              className="accent-brand-charcoal w-4 h-4"
                              disabled={isSubmitting}
                            />
                            <div className="text-left">
                              <p className="text-sm font-semibold text-brand-charcoal">Thanh toán khi nhận hàng (COD)</p>
                              <p className="text-[11px] text-brand-muted">Trả tiền mặt khi sản phẩm được giao đến nơi</p>
                            </div>
                          </div>
                        </label>

                        {/* Bank option */}
                        <label
                          className={`flex-1 flex items-center justify-between p-4 border rounded-xl cursor-pointer transition-all ${
                            form.paymentMethod === 'bank'
                              ? 'border-brand-charcoal bg-brand-cream/30 ring-1 ring-brand-charcoal'
                              : 'border-gray-200 hover:border-brand-charcoal/50'
                          }`}
                        >
                          <div className="flex items-center gap-3">
                            <input
                              type="radio"
                              name="paymentMethod"
                              value="bank"
                              checked={form.paymentMethod === 'bank'}
                              onChange={handleChange}
                              className="accent-brand-charcoal w-4 h-4"
                              disabled={isSubmitting}
                            />
                            <div className="text-left">
                              <p className="text-sm font-semibold text-brand-charcoal">Chuyển khoản ngân hàng</p>
                              <p className="text-[11px] text-brand-muted">Hiển thị thông tin chuyển khoản sau đặt hàng</p>
                            </div>
                          </div>
                        </label>
                      </div>
                    </div>

                    {/* Submit checkout Form hidden trigger */}
                    <input type="submit" id="checkout-form-submit" className="hidden" />
                  </form>
                </div>
              ) : (
                <div className="w-full lg:w-3/5 bg-white p-8 rounded-2xl border border-gray-100 shadow-sm text-center py-16 cart-anim-item flex flex-col items-center justify-center min-h-[350px] animate-fade-in">
                  <div className="w-16 h-16 bg-brand-cream rounded-full flex items-center justify-center mb-5 text-brand-muted">
                    <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                  </div>
                  <h3 className="font-display text-xl font-bold text-brand-charcoal mb-2">
                    Chưa chọn sản phẩm thanh toán
                  </h3>
                  <p className="text-brand-muted text-sm max-w-sm leading-relaxed">
                    Vui lòng tích chọn sản phẩm bạn muốn đặt mua ở danh sách bên cạnh để nhập thông tin giao hàng và thanh toán.
                  </p>
                </div>
              )}

              {/* ═══════════ RIGHT COLUMN: CART ITEMS & SUMMARY ═══════════ */}
              <div className="w-full lg:w-2/5 flex flex-col gap-6 cart-anim-item">
                
                {/* Cart list summary card */}
                <div className="bg-white p-6 rounded-2xl border border-gray-100 shadow-sm">
                  <div className="flex items-center justify-between border-b border-gray-100 pb-3 mb-4">
                    <h3 className="font-display text-xl font-bold text-brand-charcoal">
                      Đơn hàng của bạn
                    </h3>
                    {cartItems.length > 0 && (
                      <label className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wider text-brand-muted cursor-pointer hover:text-brand-charcoal transition-colors">
                        <input
                          type="checkbox"
                          checked={selectedItemIds.length === cartItems.length}
                          onChange={handleToggleSelectAll}
                          className="accent-brand-charcoal w-3.5 h-3.5"
                          disabled={isSubmitting}
                        />
                        Chọn tất cả
                      </label>
                    )}
                  </div>

                  {/* Cart items list */}
                  <div className="max-h-[300px] overflow-y-auto pr-1 flex flex-col gap-4 mb-4">
                    {cartItems.map((item) => (
                      <div key={item.id} className="flex gap-4 items-center">
                        {/* Selection Checkbox */}
                        <input
                          type="checkbox"
                          checked={selectedItemIds.includes(item.id)}
                          onChange={() => handleToggleSelectItem(item.id)}
                          className="accent-brand-charcoal w-4.5 h-4.5 cursor-pointer rounded border-gray-300 flex-shrink-0"
                          disabled={isSubmitting}
                          aria-label={`Chọn sản phẩm ${item.name}`}
                        />

                        <img
                          src={item.images[0]}
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-lg bg-gray-50 flex-shrink-0"
                        />
                        <div className="flex-1 min-w-0">
                          <h4 className="font-display text-sm font-bold text-brand-charcoal truncate">
                            {item.name}
                          </h4>
                          <p className="text-xs text-brand-muted mt-0.5 flex items-center gap-1.5">
                            Size {item.selectedSize || 'Chưa chọn'}
                            <span className="text-gray-300">|</span>
                            {item.selectedColorHex && (
                              <span
                                className="inline-block w-3 h-3 rounded-full border border-gray-300 flex-shrink-0"
                                style={{ backgroundColor: item.selectedColorHex }}
                              />
                            )}
                            {item.selectedColor || 'Chưa chọn màu'}
                          </p>
                          
                          {/* Price and controls */}
                          <div className="flex items-center justify-between mt-2">
                            <span className="font-semibold text-brand-charcoal text-sm">
                              {formatVND(item.price)}
                            </span>

                            {/* Quantity control */}
                            <div className="flex items-center border border-gray-200 rounded-lg bg-brand-cream/20">
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantity - 1)}
                                className="px-2 py-0.5 text-xs text-brand-muted hover:text-brand-charcoal font-bold"
                                disabled={isSubmitting}
                              >
                                -
                              </button>
                              <span className="px-2 text-xs font-semibold text-brand-charcoal">{item.quantity}</span>
                              <button
                                type="button"
                                onClick={() => updateQuantity(item.id, item.quantity + 1)}
                                className="px-2 py-0.5 text-xs text-brand-muted hover:text-brand-charcoal font-bold"
                                disabled={isSubmitting}
                              >
                                +
                              </button>
                            </div>
                          </div>
                        </div>

                        {/* Remove button */}
                        <button
                          type="button"
                          onClick={() => {
                            removeItem(item.id);
                            setSelectedItemIds(prev => prev.filter(id => id !== item.id));
                          }}
                          className="text-gray-400 hover:text-red-500 p-1 flex-shrink-0 transition-colors"
                          disabled={isSubmitting}
                          title="Xóa sản phẩm"
                        >
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>

                  {/* Calculations */}
                  <div className="border-t border-gray-100 pt-4 flex flex-col gap-2.5 text-sm">
                    <div className="flex justify-between text-brand-muted">
                      <span>Tạm tính:</span>
                      <span className="font-semibold text-brand-charcoal">{formatVND(selectedTotal)}</span>
                    </div>

                    {discountAmount > 0 && (
                      <div className="flex justify-between text-green-600 font-medium">
                        <span>Giảm giá (PEESTART15 - 15%):</span>
                        <span>-{formatVND(discountAmount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-brand-muted">
                      <span>Phí vận chuyển:</span>
                      <span className="font-semibold text-brand-charcoal">
                        {selectedItemIds.length === 0 ? '0 VND' : (shippingFee === 0 ? 'Miễn phí' : formatVND(shippingFee))}
                      </span>
                    </div>
                    
                    {shippingFee > 0 && selectedTotal > 0 && (
                      <p className="text-[10px] text-brand-muted italic text-left">
                        * Mẹo: Mua thêm <span className="font-bold text-brand-charcoal">{formatVND(1000000 - selectedTotal)}</span> nữa để được miễn phí vận chuyển!
                      </p>
                    )}

                    <div className="border-t border-gray-150 pt-3 flex justify-between font-bold text-base text-brand-charcoal">
                      <span>Tổng cộng:</span>
                      <span>{formatVND(selectedItemIds.length === 0 ? 0 : finalTotal)}</span>
                    </div>
                  </div>

                  {/* Submit checkout CTA button */}
                  <button
                    onClick={() => {
                      if (selectedItemIds.length === 0) {
                        toast.error('Vui lòng chọn ít nhất một sản phẩm để thanh toán!')
                        return
                      }
                      document.getElementById('checkout-form-submit').click()
                    }}
                    disabled={isSubmitting || selectedItemIds.length === 0}
                    className={`auth-submit-btn w-full py-4 rounded-lg
                               font-semibold uppercase tracking-widest text-sm mt-6
                               transition-all duration-300
                               ${selectedItemIds.length === 0 
                                 ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                 : 'bg-brand-charcoal text-white hover:bg-brand-dark hover:shadow-xl hover:shadow-brand-charcoal/20 active:scale-[0.98]'}
                               disabled:opacity-60`}
                  >
                    {isSubmitting ? (
                      <span className="flex items-center justify-center gap-3">
                        <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                        </svg>
                        Đang tạo đơn hàng...
                      </span>
                    ) : (
                      'Xác nhận đặt hàng'
                    )}
                  </button>
                </div>
              </div>

            </div>
          )}

        </div>
      </main>

      <Footer />
    </>
  )
}
