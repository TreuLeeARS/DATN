import { useState, useEffect } from 'react'
import { formatVND } from '../../utils/price.js'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Header } from '../../components/Header/Header.jsx'
import { Footer } from '../../components/Footer/Footer.jsx'
import orderApi from '../../api/orderApi'
import paymentApi from '../../api/paymentApi'
import { ConfirmModal } from '../../components/ConfirmModal.jsx'

export const MyOrders = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [expandedOrderId, setExpandedOrderId] = useState(null)
  const [paymentStatuses, setPaymentStatuses] = useState({}) // orderId -> status text

  // Custom Confirmation Modal state
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    title: '',
    message: '',
    onConfirm: () => {},
    isDestructive: false
  })
  const openConfirm = (title, message, onConfirm, isDestructive = false) => {
    setConfirmModal({
      isOpen: true,
      title,
      message,
      onConfirm: () => {
        onConfirm()
        setConfirmModal(prev => ({ ...prev, isOpen: false }))
      },
      isDestructive
    })
  }

  // 1. Kiểm tra trạng thái đăng nhập
  useEffect(() => {
    const token = localStorage.getItem('accessToken')
    if (!token) {
      toast.error('Vui lòng đăng nhập để xem lịch sử mua hàng.')
      sessionStorage.setItem('authRedirectUrl', '/my-orders')
      navigate('/auth', { replace: true })
    }
  }, [navigate])

  // 2. Fetch danh sách đơn hàng của tôi
  useEffect(() => {
    const fetchMyOrders = async () => {
      try {
        setLoading(true)
        const res = await orderApi.getMyOrders({
          page: page,
          size: 10,
          sort: 'orderId,desc'
        })
        if (res && res.data) {
          const list = res.data.content || []
          setOrders(list)
          setTotalPages(res.data.totalPages || 1)
          
          // Tải thêm thông tin thanh toán cho từng đơn hàng
          list.forEach(o => {
            fetchOrderPaymentStatus(o.orderId)
          })
        }
      } catch (err) {
        console.error('Error fetching my orders:', err)
        toast.error('Không thể tải lịch sử đơn hàng của bạn.')
      } finally {
        setLoading(false)
      }
    }
    fetchMyOrders()
  }, [page])

  const fetchOrderPaymentStatus = async (orderId) => {
    try {
      const res = await paymentApi.getPaymentStatusByOrderId(orderId)
      if (res && res.data) {
        setPaymentStatuses(prev => ({
          ...prev,
          [orderId]: res.data.status // 'PAID' or 'UNPAID'
        }))
      }
    } catch (e) {
      console.error(`Error loading payment status for order #${orderId}:`, e)
    }
  }

  const handleCancelMyOrder = (orderId) => {
    openConfirm(
      'Hủy đơn hàng',
      'Bạn có chắc chắn muốn hủy đơn hàng này?',
      async () => {
        try {
          await orderApi.cancelOrder(orderId)
          toast.success('Hủy đơn hàng thành công!')
          // Cập nhật lại trạng thái đơn hàng trên UI
          setOrders(prev => prev.map(o => o.orderId === orderId ? { ...o, status: 'CANCELLED' } : o))
        } catch (err) {
          console.error('Error cancelling order:', err)
          toast.error('Không thể hủy đơn hàng này. Vui lòng liên hệ hỗ trợ!')
        }
      },
      true
    )
  }

  const toggleExpandOrder = (orderId) => {
    setExpandedOrderId(prev => (prev === orderId ? null : orderId))
  }

  const parseShippingAddress = (str) => {
    if (!str) return { fullName: 'N/A', phone: 'N/A', address: 'N/A' }
    const parts = str.split(' | ')
    let fullName = parts[0] || 'N/A'
    let phone = 'N/A'
    let address = 'N/A'

    parts.forEach(part => {
      if (part.startsWith('SĐT: ')) phone = part.replace('SĐT: ', '')
      if (part.startsWith('Địa chỉ: ')) address = part.replace('Địa chỉ: ', '')
    })

    return { fullName, phone, address }
  }

  const getStatusLabel = (status) => {
    switch (status) {
      case 'PENDING': return 'Chờ duyệt'
      case 'CONFIRMED': return 'Đã xác nhận'
      case 'SHIPPING': return 'Đang giao hàng'
      case 'DELIVERED': return 'Đã nhận hàng'
      case 'CANCELLED': return 'Đã hủy'
      default: return status
    }
  }

  const getStatusColorClass = (status) => {
    switch (status) {
      case 'PENDING': return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'CONFIRMED': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'SHIPPING': return 'text-indigo-600 bg-indigo-50 border-indigo-200'
      case 'DELIVERED': return 'text-green-600 bg-green-50 border-green-200'
      case 'CANCELLED': return 'text-red-500 bg-red-50 border-red-200'
      default: return 'text-gray-500 bg-gray-50 border-gray-200'
    }
  }

  return (
    <>
      <Header />

      <main className="pt-28 min-h-screen bg-brand-cream pb-16 font-sans">
        <div className="max-w-4xl mx-auto px-4 sm:px-6">
          
          {/* Header Title */}
          <div className="mb-10 text-center sm:text-left border-b border-black/10 pb-6">
            <h1 className="font-display text-3xl sm:text-4xl font-bold text-brand-charcoal uppercase tracking-widest">
              Lịch sử mua hàng
            </h1>
            <p className="text-brand-muted text-xs mt-1 uppercase tracking-wider">
              Xem lại các đơn hàng bạn đã đặt và theo dõi trạng thái giao hàng
            </p>
          </div>

          {/* Orders list container */}
          {loading ? (
            <div className="bg-white border border-black/10 p-20 text-center flex flex-col items-center justify-center">
              <svg className="w-8 h-8 animate-spin text-brand-charcoal mb-4" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              <p className="text-xs font-semibold uppercase tracking-widest text-brand-muted">Đang tải lịch sử đơn hàng...</p>
            </div>
          ) : orders.length === 0 ? (
            <div className="bg-white border border-black/10 p-16 text-center space-y-4">
              <div className="w-12 h-12 rounded-full bg-brand-cream flex items-center justify-center mx-auto text-brand-muted">
                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2" />
                </svg>
              </div>
              <h3 className="font-display text-lg font-bold text-brand-charcoal">Bạn chưa đặt đơn hàng nào</h3>
              <p className="text-xs text-brand-muted max-w-sm mx-auto">Hãy ghé qua cửa hàng của chúng tôi để chọn lựa những thiết kế thời trang cao cấp nhất.</p>
              <button 
                onClick={() => navigate('/shop')} 
                className="btn-primary py-2.5 px-6 text-[10px] tracking-widest font-bold uppercase rounded-none cursor-pointer"
              >
                Ghé thăm cửa hàng
              </button>
            </div>
          ) : (
            <div className="space-y-4">
              {orders.map((o) => {
                const shipInfo = parseShippingAddress(o.shippingAddress)
                const isExpanded = expandedOrderId === o.orderId
                const payStatus = paymentStatuses[o.orderId] || 'UNPAID'
                
                return (
                  <div key={o.orderId} className="bg-white border border-black/10 shadow-sm overflow-hidden transition-all duration-300">
                    
                    {/* Header of Order Card */}
                    <div 
                      onClick={() => toggleExpandOrder(o.orderId)}
                      className="p-5 flex flex-col sm:flex-row sm:items-center justify-between gap-4 cursor-pointer hover:bg-black/[0.01] transition-colors"
                    >
                      <div className="space-y-1">
                        <div className="flex items-center gap-2">
                          <span className="font-bold text-sm text-brand-charcoal">Đơn hàng #{o.orderId}</span>
                          <span className={`px-2 py-0.5 text-[9px] font-bold border uppercase tracking-wider ${getStatusColorClass(o.status)}`}>
                            {getStatusLabel(o.status)}
                          </span>
                        </div>
                        <p className="text-[10px] text-brand-muted uppercase">
                          Ngày đặt: {o.createdAt ? new Date(o.createdAt).toLocaleDateString('vi-VN') : 'N/A'}
                        </p>
                      </div>

                      <div className="flex items-center justify-between sm:justify-end gap-6">
                        <div className="text-right">
                          <p className="text-xs text-brand-muted uppercase">Tổng thanh toán</p>
                          <p className="font-bold text-base text-brand-charcoal">{formatVND(o.totalAmount)}</p>
                        </div>
                        
                        {/* Dropdown toggle indicator */}
                        <svg 
                          className={`w-4 h-4 text-brand-muted transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} 
                          fill="none" 
                          viewBox="0 0 24 24" 
                          stroke="currentColor" 
                          strokeWidth={2}
                        >
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                        </svg>
                      </div>
                    </div>

                    {/* Expandable Order Detail Content */}
                    {isExpanded && (
                      <div className="border-t border-gray-100 p-5 bg-gray-50/50 space-y-6 text-xs animate-slide-down">
                        
                        {/* Summary details */}
                        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 pb-4 border-b border-gray-200">
                          <div className="space-y-1.5 text-brand-charcoal">
                            <h4 className="text-[9px] uppercase font-bold text-brand-muted tracking-wider">Địa chỉ giao nhận</h4>
                            <p><span className="font-semibold text-brand-muted">Người nhận:</span> {shipInfo.fullName}</p>
                            <p><span className="font-semibold text-brand-muted">Số điện thoại:</span> {shipInfo.phone}</p>
                            <p><span className="font-semibold text-brand-muted">Địa chỉ:</span> {shipInfo.address}</p>
                          </div>
                          
                          <div className="space-y-1.5 text-brand-charcoal">
                            <h4 className="text-[9px] uppercase font-bold text-brand-muted tracking-wider">Thông tin thanh toán</h4>
                            <p><span className="font-semibold text-brand-muted">Phương thức:</span> COD (Tiền mặt khi nhận hàng)</p>
                            <p className="flex items-center gap-1.5">
                              <span className="font-semibold text-brand-muted">Giao dịch:</span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${
                                payStatus === 'PAID' 
                                  ? 'bg-green-50 text-green-700 border-green-200' 
                                  : 'bg-amber-50 text-amber-700 border-amber-200'
                              }`}>
                                {payStatus === 'PAID' ? 'Đã thanh toán' : 'Chưa thanh toán'}
                              </span>
                            </p>
                            {o.note && <p><span className="font-semibold text-brand-muted">Ghi chú:</span> {o.note}</p>}
                          </div>
                        </div>

                        {/* Order items list */}
                        <div className="space-y-2">
                          <h4 className="text-[9px] uppercase font-bold text-brand-muted tracking-wider">Danh sách món hàng</h4>
                          <div className="bg-white border border-gray-150 divide-y divide-gray-100">
                            {o.orderDetails && o.orderDetails.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center p-3">
                                <div>
                                  <p className="font-semibold text-brand-charcoal">{item.productName}</p>
                                  <p className="text-[10px] text-brand-muted mt-0.5">Phân loại: {item.color} / Size {item.size}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-brand-charcoal">{formatVND(item.price)} x {item.quantity}</p>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Order footer actions */}
                        <div className="flex justify-between items-center pt-2">
                          <div>
                            {o.status === 'PENDING' && (
                              <button
                                onClick={() => handleCancelMyOrder(o.orderId)}
                                className="border border-red-500 text-red-500 text-[10px] font-semibold tracking-wider uppercase px-4 py-2 hover:bg-red-50 transition-colors rounded-none cursor-pointer"
                              >
                                Hủy đơn hàng
                              </button>
                            )}
                          </div>
                          <p className="text-brand-muted text-[10px] italic">
                            * Vui lòng liên hệ hotline của Outta nếu bạn muốn đổi trả hàng sau khi đã giao.
                          </p>
                        </div>

                      </div>
                    )}

                  </div>
                )
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-between items-center mt-8 text-xs">
              <button
                disabled={page === 0}
                onClick={() => setPage(prev => Math.max(0, prev - 1))}
                className="px-4 py-2 border border-black/10 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/[0.02]"
              >
                Trang trước
              </button>
              <span className="font-semibold text-brand-muted">
                Trang {page + 1} / {totalPages}
              </span>
              <button
                disabled={page >= totalPages - 1}
                onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
                className="px-4 py-2 border border-black/10 bg-white disabled:opacity-40 disabled:cursor-not-allowed hover:bg-black/[0.02]"
              >
                Trang sau
              </button>
            </div>
          )}

        </div>
      </main>

      <Footer />

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        message={confirmModal.message}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
        isDestructive={confirmModal.isDestructive}
      />
    </>
  )
}
