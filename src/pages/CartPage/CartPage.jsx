import { useState, useLayoutEffect, useRef, useEffect } from 'react'
import { formatVND } from '../../utils/price.js'
import { Link, useNavigate } from 'react-router-dom'
import gsap from 'gsap'
import toast from 'react-hot-toast'
import { Header } from '../../components/Header/Header.jsx'
import { Footer } from '../../components/Footer/Footer.jsx'
import { useCartContext } from '../../context/CartContext.jsx'
import orderApi from '../../api/orderApi.js'
import couponApi from '../../api/couponApi.js'
import paymentApi from '../../api/paymentApi.js'
import shippingFeeApi from '../../api/shippingFeeApi.js'
import { AddressSelector } from '../../components/AddressSelector/AddressSelector.jsx'
import { formatShippingAddress, parseShippingAddress } from '../../utils/shippingAddress.js'

export const CartPage = () => {
  const navigate = useNavigate()
  const { cartItems, removeItem, updateQuantity, refreshCart, total } = useCartContext()
  const hasCartItems = cartItems.length > 0
  const [dbCoupon, setDbCoupon] = useState(null)
  const [promoInput, setPromoInput] = useState('')
  const [promoLoading, setPromoLoading] = useState(false)
  const [paymentMethods, setPaymentMethods] = useState([])
  const [paymentMethodsLoading, setPaymentMethodsLoading] = useState(true)
  const [paymentMethodsError, setPaymentMethodsError] = useState('')
  const [shippingQuote, setShippingQuote] = useState(null)
  const [shippingFeeLoading, setShippingFeeLoading] = useState(false)
  const [shippingFeeError, setShippingFeeError] = useState('')

  // Tải thông tin coupon thực tế từ cơ sở dữ liệu nếu có mã giảm giá được áp dụng
  useEffect(() => {
    const appliedPromo = sessionStorage.getItem('appliedPromoCode')
    if (appliedPromo) {
      const fetchCoupon = async () => {
        try {
          const found = await couponApi.findCouponByCode(appliedPromo)
          setDbCoupon(found)
        } catch (err) {
          console.error('Error fetching coupon info from DB:', err)
          setDbCoupon(null)
        }
      }
      fetchCoupon()
    } else {
      setDbCoupon(null)
    }
  }, [cartItems])

  // Kiểm tra đăng nhập, nếu chưa đăng nhập thì đẩy về trang đăng nhập
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      toast.error('Vui lòng đăng nhập để xem giỏ hàng và thực hiện thanh toán.')
      sessionStorage.setItem('authRedirectUrl', '/cart')
      navigate('/auth', { replace: true })
    }
  }, [navigate])

  // State thông tin nhận hàng
  const [form, setForm] = useState({
    fullName: '',
    phone: '',
    address: '',
    province: '',
    district: '',
    ward: '',
    paymentMethod: '',
  })
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [orderSuccess, setOrderSuccess] = useState(false)
  const [orderInfo, setOrderInfo] = useState(null)

  // CRIT-03 FIX: Ref-based guard chống double-submit (state-based có race window)
  const isSubmittingRef = useRef(false)

  const pageRef = useRef(null)

  useEffect(() => {
    const fetchPaymentMethods = async () => {
      try {
        setPaymentMethodsLoading(true)
        setPaymentMethodsError('')
        const res = await paymentApi.getPaymentMethods()
        const activeMethods = Array.isArray(res?.data)
          ? res.data.filter(method => method?.isActive !== false)
          : []

        setPaymentMethods(activeMethods)
        setForm(prev => {
          const currentMethodStillExists = activeMethods.some(method => method.code === prev.paymentMethod)
          const firstSupportedMethod = activeMethods.find(method => ['COD', 'MOMO'].includes(method.code))
          return {
            ...prev,
            paymentMethod: currentMethodStillExists ? prev.paymentMethod : firstSupportedMethod?.code || '',
          }
        })
      } catch (error) {
        console.error('Error fetching payment methods:', error)
        setPaymentMethods([])
        setPaymentMethodsError('Không thể tải phương thức thanh toán từ máy chủ.')
      } finally {
        setPaymentMethodsLoading(false)
      }
    }

    fetchPaymentMethods()
  }, [])

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
    } else if (!form.province || !form.district || !form.ward) {
      newErrors.address = 'Vui lòng chọn đầy đủ Tỉnh/Thành, Quận/Huyện và Phường/Xã'
    }

    if (!form.paymentMethod) {
      newErrors.paymentMethod = 'Vui lòng chọn phương thức thanh toán do hệ thống cung cấp'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const selectedTotal = total

  const isCouponUsable = (coupon) => {
    if (!coupon || coupon.deleted) return false
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const startDate = coupon.startDate ? new Date(coupon.startDate) : null
    const endDate = coupon.endDate ? new Date(coupon.endDate) : null
    const withinDate = (!startDate || startDate <= today) && (!endDate || endDate >= today)
    const withinUsage = coupon.maxUsage == null || Number(coupon.currentUsage || 0) < Number(coupon.maxUsage)
    return withinDate && withinUsage
  }

  const handleApplyPromo = async () => {
    if (!promoInput.trim()) {
      toast.error('Vui lòng nhập mã giảm giá!')
      return
    }
    if (!hasCartItems) {
      toast.error('Vui lòng chọn ít nhất một sản phẩm để áp dụng mã giảm giá!')
      return
    }
    try {
      setPromoLoading(true)
      const found = await couponApi.findCouponByCode(promoInput)
      if (found && isCouponUsable(found)) {
        if (selectedTotal >= found.minimumOrderAmount) {
          sessionStorage.setItem('appliedPromoCode', found.couponCode)
          setDbCoupon(found)
          toast.success(`Áp dụng thành công mã giảm giá: ${found.couponCode}!`)
          setPromoInput('')
        } else {
          toast.error(`Đơn hàng chưa đạt giá trị tối thiểu ${formatVND(found.minimumOrderAmount)} để áp dụng mã này!`)
        }
      } else {
        toast.error('Mã giảm giá không tồn tại hoặc đã hết hạn!')
      }
    } catch (err) {
      console.error('Error applying coupon:', err)
      toast.error('Đã xảy ra lỗi khi áp dụng mã giảm giá.')
    } finally {
      setPromoLoading(false)
    }
  }

  const handleRemovePromo = () => {
    sessionStorage.removeItem('appliedPromoCode')
    setDbCoupon(null)
    toast.success('Đã gỡ mã giảm giá.')
  }

  // Đọc mã giảm giá và tính toán số tiền giảm thực tế từ DB
  const appliedPromo = sessionStorage.getItem('appliedPromoCode')
  const estimatedDiscount = (() => {
    if (!appliedPromo) return 0
    if (dbCoupon) {
      if (selectedTotal >= dbCoupon.minimumOrderAmount) {
        return Number(dbCoupon.discountValue)
      } else {
        return 0 // Chưa đạt giá trị đơn hàng tối thiểu
      }
    }
    return 0
  })()

  const estimatedSubtotal = Math.max(0, selectedTotal - estimatedDiscount)
  const estimatedTotal = estimatedSubtotal + Number(shippingQuote?.shippingFee || 0)

  useEffect(() => {
    if (!hasCartItems || !form.address || !form.province || !form.district || !form.ward) {
      setShippingQuote(null)
      setShippingFeeError('')
      return undefined
    }

    let cancelled = false
    const timer = window.setTimeout(async () => {
      try {
        setShippingFeeLoading(true)
        setShippingFeeError('')
        const res = await shippingFeeApi.calculate({
          subtotalAmount: estimatedSubtotal,
          province: form.province,
          district: form.district,
          ward: form.ward,
          shippingAddress: form.address,
        })
        if (!cancelled) setShippingQuote(res?.data || null)
      } catch (error) {
        if (!cancelled) {
          console.error('Error calculating shipping fee:', error)
          setShippingQuote(null)
          setShippingFeeError(error.response?.data?.message || 'Không thể tính phí vận chuyển từ BE.')
        }
      } finally {
        if (!cancelled) setShippingFeeLoading(false)
      }
    }, 350)

    return () => {
      cancelled = true
      window.clearTimeout(timer)
    }
  }, [estimatedSubtotal, form.address, form.district, form.province, form.ward, hasCartItems])

  const handleSubmit = async (e) => {
    e.preventDefault()

    // CRIT-03 FIX: Chặn double-submit bằng ref (không bị race condition như state)
    if (isSubmittingRef.current) return
    
    if (!validateForm()) {
      toast.error('Vui lòng điền đầy đủ và chính xác thông tin giao hàng!')
      return
    }

    isSubmittingRef.current = true
    setIsSubmitting(true)

    try {
      // Giỏ hàng đã được đồng bộ qua useCart hook, tiến hành checkout trực tiếp

      const checkoutData = {
        shippingAddress: formatShippingAddress(form),
        province: form.province,
        district: form.district,
        ward: form.ward,
        couponCode: appliedPromo || null,
        paymentMethodType: form.paymentMethod
      }

      // 1. Tạo đơn hàng trên backend
      const res = await orderApi.checkout(checkoutData)
      
      if (res && res.data) {
        const orderData = res.data
        const shippingInfo = parseShippingAddress(orderData.shippingAddress)
        
        const selectedPaymentMethod = paymentMethods.find(method => method.code === form.paymentMethod)
        let paymentData = null
        let codPaymentCreated = true
        if (form.paymentMethod === 'COD') {
          try {
            const paymentRes = await paymentApi.createCodPayment({
              orderId: orderData.orderId,
              amount: orderData.totalAmount
            })
            paymentData = paymentRes?.data || null
          } catch (paymentError) {
            codPaymentCreated = false
            console.error('Đơn đã tạo nhưng không thể khởi tạo thanh toán COD:', paymentError)
          }
        }
        
        // Cấu trúc dữ liệu hiển thị — sử dụng totalAmount từ server (source of truth)
        const mappedOrderInfo = {
          orderId: orderData.orderId,
          fullName: shippingInfo.fullName || form.fullName,
          phone: shippingInfo.phone || form.phone,
          address: shippingInfo.address || form.address,
          paymentMethod: paymentData?.paymentMethod || selectedPaymentMethod?.name || selectedPaymentMethod?.code,
          subtotal: orderData.subtotalAmount,
          discount: orderData.discountValue,
          shippingFee: orderData.shippingFee,
          total: orderData.totalAmount,
        }

        setOrderInfo(mappedOrderInfo)
        
        // BE đã xóa toàn bộ giỏ trong checkout; FE chỉ đồng bộ lại dữ liệu.
        await refreshCart()
        sessionStorage.removeItem('appliedPromoCode')

        if (form.paymentMethod === 'MOMO') {
          const redirectUrl = orderData.payUrl || orderData.paymentUrl || orderData.deeplink
          if (redirectUrl) {
            window.location.assign(redirectUrl)
            return
          }
          setOrderSuccess(true)
          toast.error(`Đơn #${orderData.orderId} đã được tạo nhưng BE không trả về URL thanh toán MoMo.`)
        } else if (codPaymentCreated) {
          setOrderSuccess(true)
          toast.success('Đặt đơn hàng COD thành công!')
        } else {
          setOrderSuccess(true)
          toast.error(`Đơn #${orderData.orderId} đã được tạo nhưng thanh toán COD chưa khởi tạo. Vui lòng liên hệ hỗ trợ.`)
        }
      }
    } catch (err) {
      console.error('Lỗi khi thanh toán đơn hàng:', err)
      const errorMsg = err.response?.data?.message || 'Không thể tạo đơn hàng. Vui lòng kiểm tra lại.'
      toast.error(errorMsg)
      // Tự động đồng bộ lại giỏ hàng từ backend nếu có sản phẩm hết hạn giữ hàng
      try {
        await refreshCart()
      } catch (e) {
        console.error('Lỗi khi làm mới giỏ hàng:', e)
      }
    } finally {
      isSubmittingRef.current = false
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
                    {orderInfo.paymentMethod || 'Chưa có dữ liệu từ BE'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-xs text-brand-muted">Tạm tính:</span>
                  <span className="text-sm font-semibold text-brand-charcoal">{formatVND(orderInfo.subtotal)}</span>
                </div>
                {Number(orderInfo.discount || 0) > 0 && (
                  <div className="flex justify-between text-green-700">
                    <span className="text-xs">Giảm giá:</span>
                    <span className="text-sm font-semibold">-{formatVND(orderInfo.discount)}</span>
                  </div>
                )}
                <div className="flex justify-between">
                  <span className="text-xs text-brand-muted">Phí vận chuyển:</span>
                  <span className="text-sm font-semibold text-brand-charcoal">{formatVND(orderInfo.shippingFee)}</span>
                </div>
                <div className="flex justify-between border-t border-gray-200/60 pt-3 font-semibold">
                  <span className="text-sm text-brand-charcoal">Tổng cộng:</span>
                  <span className="text-base text-brand-charcoal">{formatVND(orderInfo.total)}</span>
                </div>
              </div>

              <Link to="/" className="btn-primary inline-block py-3 px-8 rounded-lg text-sm tracking-wider">
                Tiếp tục mua sắm
              </Link>
            </div>
          ) : cartItems.length === 0 ? (
            /* Giỏ hàng trống */
            <div className="max-w-md mx-auto bg-white rounded-2xl border border-gray-100 p-12 text-center cart-anim-item">
              <div className="w-20 h-20 bg-brand-cream rounded-full flex items-center justify-center mx-auto mb-6 text-brand-muted">
                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" />
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
              {hasCartItems ? (
                <div id="checkout-section" className="w-full lg:w-3/5 bg-white p-6 rounded-2xl border border-gray-100 shadow-sm cart-anim-item animate-fade-in">
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

                    {/* Enhanced Location & Address Selector */}
                    <AddressSelector
                      value={form.address}
                      onAddressChange={(newAddr, details = {}) => {
                        setForm(prev => ({
                          ...prev,
                          address: newAddr,
                          province: details.province || '',
                          district: details.district || '',
                          ward: details.ward || '',
                        }))
                        if (errors.address) {
                          setErrors(prev => ({ ...prev, address: '' }))
                        }
                      }}
                      disabled={isSubmitting}
                      error={errors.address}
                    />

                    {/* Payment Method Selector */}
                    <div className="mt-4">
                      <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted mb-3">
                        Phương thức thanh toán
                      </label>
                      <div className="flex flex-col gap-3">
                        {paymentMethodsLoading ? (
                          <p className="text-xs text-brand-muted">Đang tải phương thức thanh toán từ BE...</p>
                        ) : paymentMethods.length > 0 ? (
                          paymentMethods.map(method => {
                            const hasPaymentFlow = ['COD', 'MOMO'].includes(method.code)
                            return (
                              <label
                                key={method.paymentMethodId || method.code}
                                className={`flex-1 flex items-center justify-between p-4 border rounded-xl transition-all ${
                                  form.paymentMethod === method.code
                                    ? 'border-brand-charcoal bg-brand-cream/30 ring-1 ring-brand-charcoal'
                                    : 'border-gray-200'
                                } ${hasPaymentFlow ? 'cursor-pointer hover:border-brand-charcoal/50' : 'cursor-not-allowed opacity-60'}`}
                              >
                                <div className="flex items-center gap-3">
                                  <input
                                    type="radio"
                                    name="paymentMethod"
                                    value={method.code}
                                    checked={form.paymentMethod === method.code}
                                    onChange={handleChange}
                                    className="accent-brand-charcoal w-4 h-4"
                                    disabled={isSubmitting || !hasPaymentFlow}
                                  />
                                  <div className="text-left">
                                    <p className="text-sm font-semibold text-brand-charcoal">
                                      {method.name || method.code}
                                    </p>
                                    {method.description && (
                                      <p className="text-[11px] text-brand-muted">{method.description}</p>
                                    )}
                                    {!hasPaymentFlow && (
                                      <p className="text-[10px] text-amber-700 mt-1">BE chưa cung cấp luồng thanh toán cho phương thức này.</p>
                                    )}
                                  </div>
                                </div>
                              </label>
                            )
                          })
                        ) : (
                          <p className="text-xs text-red-500">
                            {paymentMethodsError || 'BE chưa trả về phương thức thanh toán đang hoạt động.'}
                          </p>
                        )}
                      </div>
                      {errors.paymentMethod && (
                        <p className="text-red-400 text-xs mt-2 animate-slide-up">{errors.paymentMethod}</p>
                      )}
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
                          checked={cartItems.length > 0}
                          readOnly
                          className="accent-brand-charcoal w-3.5 h-3.5"
                          disabled
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
                          checked
                          readOnly
                          className="accent-brand-charcoal w-4.5 h-4.5 cursor-pointer rounded border-gray-300 flex-shrink-0"
                          disabled
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
                          onClick={() => removeItem(item.id)}
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

                  {/* Coupon Application Box */}
                  <div className="border-t border-gray-100 pt-4 pb-4">
                    <label className="block text-xs font-semibold uppercase tracking-wider text-brand-muted mb-2">
                      Mã giảm giá (Coupon)
                    </label>
                    {appliedPromo ? (
                      <div className="flex items-center justify-between bg-green-50 border border-green-200 rounded-xl p-3">
                        <div>
                          <span className="font-mono text-xs font-bold text-green-700 bg-green-100 px-2 py-1 rounded">
                            {appliedPromo}
                          </span>
                          {dbCoupon && selectedTotal < dbCoupon.minimumOrderAmount && (
                            <p className="text-[10px] text-red-500 mt-1.5 font-medium">
                              Chưa đạt tối thiểu {formatVND(dbCoupon.minimumOrderAmount)}
                            </p>
                          )}
                        </div>
                        <button
                          type="button"
                          onClick={handleRemovePromo}
                          className="text-xs font-bold text-red-600 hover:text-red-800 transition-colors uppercase tracking-wider cursor-pointer"
                        >
                          Gỡ mã
                        </button>
                      </div>
                    ) : (
                      <div className="flex gap-2">
                        <input
                          type="text"
                          placeholder="Nhập mã giảm giá..."
                          value={promoInput}
                          onChange={(e) => setPromoInput(e.target.value)}
                          className="flex-1 input-base py-2 text-xs uppercase"
                          disabled={promoLoading || isSubmitting}
                        />
                        <button
                          type="button"
                          onClick={handleApplyPromo}
                          disabled={promoLoading || isSubmitting || !hasCartItems}
                          className="bg-brand-charcoal text-white hover:bg-brand-dark px-4 py-2 text-xs font-bold uppercase tracking-wider disabled:opacity-50 disabled:cursor-not-allowed transition-colors cursor-pointer"
                        >
                          {promoLoading ? '...' : 'Áp dụng'}
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Calculations */}
                  <div className="border-t border-gray-100 pt-4 flex flex-col gap-2.5 text-sm">
                    <div className="flex justify-between text-brand-muted">
                      <span>Tạm tính:</span>
                      <span className="font-semibold text-brand-charcoal">{formatVND(selectedTotal)}</span>
                    </div>

                    {estimatedDiscount > 0 && (
                      <div className="flex justify-between text-green-600 font-medium">
                        <span>Giảm giá ({appliedPromo}) <span className="text-[10px] text-brand-muted font-normal">(ước tính)</span>:</span>
                        <span>-{formatVND(estimatedDiscount)}</span>
                      </div>
                    )}

                    <div className="flex justify-between text-brand-muted">
                      <span>Phí vận chuyển <span className="text-[10px]">(ước tính)</span>:</span>
                      <span className="font-semibold text-brand-charcoal">
                        {shippingFeeLoading
                          ? 'Đang tính...'
                          : shippingQuote
                            ? formatVND(shippingQuote.shippingFee)
                            : 'Chọn đủ địa chỉ'}
                      </span>
                    </div>
                    {shippingQuote?.note && (
                      <p className="text-right text-[10px] text-brand-muted">{shippingQuote.note}</p>
                    )}
                    {shippingFeeError && (
                      <p className="text-right text-[10px] text-red-500">{shippingFeeError}</p>
                    )}

                    <div className="border-t border-gray-150 pt-3 flex justify-between font-bold text-base text-brand-charcoal">
                      <span>Tổng cộng <span className="text-[10px] font-normal text-brand-muted">(ước tính)</span>:</span>
                      <span>{formatVND(cartItems.length === 0 ? 0 : estimatedTotal)}</span>
                    </div>
                  </div>

                  {/* Submit checkout CTA button */}
                  <button
                    onClick={() => {
                      if (!hasCartItems) {
                        toast.error('Vui lòng chọn ít nhất một sản phẩm để thanh toán!')
                        return
                      }
                      document.getElementById('checkout-form-submit').click()
                    }}
                    disabled={isSubmitting || shippingFeeLoading || !hasCartItems}
                    className={`auth-submit-btn w-full py-4 rounded-lg
                               font-semibold uppercase tracking-widest text-sm mt-6
                               transition-all duration-300
                               ${!hasCartItems
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
                    ) : form.paymentMethod === 'MOMO' ? 'Thanh toán với MoMo' : 'Xác nhận đặt hàng'}
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
