import { useState, useEffect } from 'react'
import { formatVND } from '../../utils/price.js'
import toast from 'react-hot-toast'
import orderApi from '../../api/orderApi'
import paymentApi from '../../api/paymentApi'

export const OrderManager = () => {
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [statusFilter, setStatusFilter] = useState('ALL') // 'ALL' | 'PENDING' | 'CONFIRMED' | 'SHIPPING' | 'DELIVERED' | 'CANCELLED'
  
  // Detail Modal state
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [paymentInfo, setPaymentInfo] = useState(null)
  const [loadingPayment, setLoadingPayment] = useState(false)

  useEffect(() => {
    fetchOrders()
  }, [page, statusFilter])

  const fetchOrders = async () => {
    try {
      setLoading(true)
      // Call all orders, then filter client-side if statusFilter !== 'ALL', or fetch with pagination
      const res = await orderApi.getAllOrders({
        page: page,
        size: 15,
        sort: 'orderId,desc'
      })
      if (res && res.data) {
        let content = res.data.content || []
        
        // Backend handles general fetch. We can filter on client side for quick and responsive status tabs
        if (statusFilter !== 'ALL') {
          content = content.filter(o => o.status === statusFilter)
        }
        
        setOrders(content)
        setTotalPages(res.data.totalPages || 1)
      }
    } catch (err) {
      console.error('Error fetching orders:', err)
      toast.error('Không thể tải danh sách đơn hàng.')
    } finally {
      setLoading(false)
    }
  }

  // --- PARSE SHIPPING INFO HELPER ---
  const parseShippingAddress = (str) => {
    if (!str) return { fullName: 'Chưa có', phone: 'Chưa có', address: 'Chưa có' }
    
    // Format expected: "FullName | SĐT: Phone | Địa chỉ: Address"
    const parts = str.split(' | ')
    let fullName = parts[0] || 'N/A'
    let phone = 'Chưa có'
    let address = 'Chưa có'

    parts.forEach(part => {
      if (part.startsWith('SĐT: ')) {
        phone = part.replace('SĐT: ', '')
      } else if (part.startsWith('Địa chỉ: ')) {
        address = part.replace('Địa chỉ: ', '')
      }
    })

    return { fullName, phone, address }
  }

  // --- FETCH ORDER PAYMENT METHOD INFO ---
  const fetchPaymentInfo = async (orderId) => {
    try {
      setLoadingPayment(true)
      setPaymentInfo(null)
      const res = await paymentApi.getPaymentByOrderId(orderId)
      if (res && res.data) {
        setPaymentInfo(res.data)
      }
    } catch (err) {
      console.error('Error loading payment info:', err)
    } finally {
      setLoadingPayment(false)
    }
  }

  const handleOpenDetailModal = (order) => {
    setSelectedOrder(order)
    setIsModalOpen(true)
    fetchPaymentInfo(order.orderId)
  }

  // --- UPDATE ORDER STATUS ACTIONS ---

  const handleUpdateStatus = async (orderId, newStatus) => {
    try {
      await orderApi.updateOrderStatus(orderId, newStatus)
      toast.success(`Cập nhật trạng thái đơn hàng thành công!`)
      fetchOrders()
      // Refresh modal view if open
      if (selectedOrder && selectedOrder.orderId === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: newStatus }))
      }
    } catch (err) {
      console.error('Error updating status:', err)
      toast.error('Cập nhật trạng thái thất bại. Vui lòng kiểm tra lại.')
    }
  }

  const handleShipOrder = async (orderId) => {
    try {
      await orderApi.setStatusIsShipping(orderId)
      toast.success('Bắt đầu giao hàng! Đơn hàng đã chuyển sang trạng thái SHIPPING.')
      fetchOrders()
      if (selectedOrder && selectedOrder.orderId === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: 'SHIPPING' }))
      }
    } catch (err) {
      console.error('Error setting shipping:', err)
      toast.error('Lỗi khi chuyển trạng thái giao hàng.')
    }
  }

  const handleDeliverOrder = async (orderId) => {
    try {
      await orderApi.setStatusIsDelivered(orderId)
      toast.success('Đơn hàng đã được giao thành công! Trạng thái đổi thành DELIVERED.')
      fetchOrders()
      if (selectedOrder && selectedOrder.orderId === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: 'DELIVERED' }))
      }
    } catch (err) {
      console.error('Error setting delivered:', err)
      toast.error('Lỗi khi cập nhật đã giao hàng.')
    }
  }

  const handleCancelOrder = async (orderId) => {
    if (!confirm('Bạn có chắc chắn muốn HỦY đơn hàng này?')) return
    try {
      await orderApi.cancelOrder(orderId)
      toast.success('Đơn hàng đã được hủy thành công!')
      fetchOrders()
      if (selectedOrder && selectedOrder.orderId === orderId) {
        setSelectedOrder(prev => ({ ...prev, status: 'CANCELLED' }))
      }
    } catch (err) {
      console.error('Error cancelling order:', err)
      toast.error('Không thể hủy đơn hàng.')
    }
  }

  // --- CONFIRM COD PAYMENT ---
  const handleConfirmCodPayment = async (paymentId, orderId) => {
    try {
      await paymentApi.confirmCodPayment(paymentId)
      toast.success('Xác nhận thanh toán COD thành công! Tiền mặt đã thu.')
      fetchPaymentInfo(orderId) // reload payment info
    } catch (err) {
      console.error('Error confirming payment:', err)
      toast.error('Lỗi khi xác nhận thanh toán.')
    }
  }

  // Helper colors for status badges
  const getStatusBadgeClass = (status) => {
    switch (status) {
      case 'PENDING':
        return 'bg-amber-50 text-amber-700 border-amber-200'
      case 'CONFIRMED':
        return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'SHIPPING':
        return 'bg-indigo-50 text-indigo-700 border-indigo-200'
      case 'DELIVERED':
        return 'bg-green-50 text-green-700 border-green-200'
      case 'CANCELLED':
        return 'bg-red-50 text-red-700 border-red-200'
      default:
        return 'bg-gray-50 text-gray-700 border-gray-200'
    }
  }

  const getStatusTranslation = (status) => {
    switch (status) {
      case 'PENDING': return 'Chờ xử lý'
      case 'CONFIRMED': return 'Đã xác nhận'
      case 'SHIPPING': return 'Đang giao hàng'
      case 'DELIVERED': return 'Đã nhận hàng'
      case 'CANCELLED': return 'Đã hủy đơn'
      default: return status
    }
  }

  return (
    <div className="space-y-8 animate-fade-in font-sans pb-16">
      
      {/* ─── TITLE BAR ─── */}
      <div className="bg-white p-6 border border-black/10 shadow-sm flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h2 className="text-xl font-bold uppercase tracking-wider text-brand-charcoal">Quản lý đơn hàng</h2>
          <p className="text-xs text-brand-muted mt-1">Quản lý danh sách đặt hàng, trạng thái vận chuyển và thông tin thanh toán hóa đơn</p>
        </div>

        {/* Status Tabs/Filters */}
        <div className="flex flex-wrap gap-1.5 bg-brand-cream/50 p-1 border border-gray-200">
          {['ALL', 'PENDING', 'CONFIRMED', 'SHIPPING', 'DELIVERED', 'CANCELLED'].map((tab) => (
            <button
              key={tab}
              onClick={() => { setStatusFilter(tab); setPage(0) }}
              className={`px-3 py-1.5 text-[10px] font-semibold tracking-wider uppercase transition-colors cursor-pointer rounded-none ${
                statusFilter === tab 
                  ? 'bg-brand-charcoal text-white' 
                  : 'text-brand-charcoal hover:bg-black/[0.03]'
              }`}
            >
              {tab === 'ALL' ? 'Tất cả' : getStatusTranslation(tab)}
            </button>
          ))}
        </div>
      </div>

      {/* ─── ORDERS TABLE ─── */}
      <div className="bg-white border border-black/10 shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-brand-charcoal text-white text-[10px] tracking-wider uppercase border-b border-black/10">
                <th className="py-4 px-4 font-semibold w-24">Mã đơn</th>
                <th className="py-4 px-4 font-semibold w-48">Khách hàng</th>
                <th className="py-4 px-4 font-semibold w-32">Số điện thoại</th>
                <th className="py-4 px-4 font-semibold w-32">Ngày đặt</th>
                <th className="py-4 px-4 font-semibold w-28">Tổng tiền</th>
                <th className="py-4 px-4 font-semibold w-32 text-center">Trạng thái</th>
                <th className="py-4 px-4 font-semibold w-36 text-center">Thao tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-brand-muted">
                    <div className="flex items-center justify-center gap-2">
                      <svg className="w-5 h-5 animate-spin text-brand-charcoal" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                      </svg>
                      Đang tải danh sách đơn hàng...
                    </div>
                  </td>
                </tr>
              ) : orders.length === 0 ? (
                <tr>
                  <td colSpan="7" className="py-12 text-center text-brand-muted font-medium">
                    Không tìm thấy đơn đặt hàng nào phù hợp với bộ lọc hiện tại.
                  </td>
                </tr>
              ) : (
                orders.map((o) => {
                  const shipInfo = parseShippingAddress(o.shippingAddress)
                  const orderDate = o.createdAt ? new Date(o.createdAt).toLocaleDateString('vi-VN') : 'N/A'
                  return (
                    <tr key={o.orderId} className="hover:bg-black/[0.01] transition-colors">
                      <td className="py-4 px-4 font-bold text-brand-charcoal">#{o.orderId}</td>
                      <td className="py-4 px-4 font-medium text-brand-charcoal">{shipInfo.fullName}</td>
                      <td className="py-4 px-4 text-brand-muted">{shipInfo.phone}</td>
                      <td className="py-4 px-4 text-brand-muted">{orderDate}</td>
                      <td className="py-4 px-4 font-semibold text-brand-charcoal">
                        {formatVND(o.totalAmount)}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-[9px] font-semibold border uppercase tracking-wider ${getStatusBadgeClass(o.status)}`}>
                          {getStatusTranslation(o.status)}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center space-x-2">
                        <button
                          onClick={() => handleOpenDetailModal(o)}
                          className="text-[10px] uppercase tracking-wider font-semibold text-brand-charcoal hover:underline"
                        >
                          Chi tiết / Duyệt
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 bg-gray-50/50 text-xs">
            <button
              disabled={page === 0}
              onClick={() => setPage(prev => Math.max(0, prev - 1))}
              className="px-3 py-1.5 border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-colors"
            >
              Trước
            </button>
            <span className="font-semibold text-brand-muted">
              Trang {page + 1} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
              className="px-3 py-1.5 border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-colors"
            >
              Sau
            </button>
          </div>
        )}
      </div>

      {/* ─── MODAL: ORDER DETAILS & ACTION BUTTONS ─── */}
      {isModalOpen && selectedOrder && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-charcoal/60 backdrop-blur-sm">
          <div className="w-full max-w-2xl bg-white border border-black/10 shadow-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto rounded-none">
            
            <div className="flex justify-between items-center border-b border-gray-100 pb-3">
              <div>
                <h3 className="text-sm font-bold uppercase tracking-wider text-brand-charcoal">
                  Chi tiết đơn hàng #{selectedOrder.orderId}
                </h3>
                <p className="text-[10px] text-brand-muted mt-0.5">Đặt ngày: {selectedOrder.createdAt ? new Date(selectedOrder.createdAt).toLocaleString('vi-VN') : 'N/A'}</p>
              </div>
              <button onClick={() => setIsModalOpen(false)} className="text-brand-charcoal text-sm hover:opacity-70 font-semibold">✕</button>
            </div>

            {/* Content grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 text-xs border-b border-gray-100 pb-6">
              {/* Customer delivery info */}
              <div className="space-y-3">
                <h4 className="text-[10px] uppercase font-bold tracking-wider text-brand-muted border-b border-gray-100 pb-1">Thông tin nhận hàng</h4>
                {(() => {
                  const info = parseShippingAddress(selectedOrder.shippingAddress)
                  return (
                    <div className="space-y-1.5 text-brand-charcoal">
                      <p><span className="font-semibold text-brand-muted">Người nhận:</span> {info.fullName}</p>
                      <p><span className="font-semibold text-brand-muted">Số điện thoại:</span> {info.phone}</p>
                      <p><span className="font-semibold text-brand-muted">Địa chỉ nhận:</span> {info.address}</p>
                      <p><span className="font-semibold text-brand-muted">Ghi chú:</span> {selectedOrder.note || 'Không có ghi chú'}</p>
                    </div>
                  )
                })()}
              </div>

              {/* Payment info */}
              <div className="space-y-3">
                <h4 className="text-[10px] uppercase font-bold tracking-wider text-brand-muted border-b border-gray-100 pb-1">Trạng thái thanh toán</h4>
                <div className="space-y-1.5 text-brand-charcoal">
                  {loadingPayment ? (
                    <p className="text-brand-muted">Đang tải thông tin thanh toán...</p>
                  ) : paymentInfo ? (
                    <>
                      <p><span className="font-semibold text-brand-muted">Phương thức:</span> {paymentInfo.paymentMethod || 'COD'}</p>
                      <p><span className="font-semibold text-brand-muted">Mã thanh toán:</span> ID_{paymentInfo.paymentId}</p>
                      <p><span className="font-semibold text-brand-muted">Tổng thanh toán:</span> {formatVND(paymentInfo.amount)}</p>
                      <p className="flex items-center gap-1.5">
                        <span className="font-semibold text-brand-muted">Trạng thái:</span>
                        <span className={`px-2 py-0.5 rounded text-[10px] font-bold border ${
                          paymentInfo.status === 'PAID' 
                            ? 'bg-green-50 text-green-700 border-green-200' 
                            : 'bg-amber-50 text-amber-700 border-amber-200'
                        }`}>
                          {paymentInfo.status === 'PAID' ? 'ĐÃ THANH TOÁN' : 'CHƯA THANH TOÁN'}
                        </span>
                      </p>
                      
                      {/* Confirm COD Payment Trigger for Admin */}
                      {paymentInfo.paymentMethod === 'COD' && paymentInfo.status !== 'PAID' && (selectedOrder.status === 'SHIPPING' || selectedOrder.status === 'DELIVERED') && (
                        <button
                          type="button"
                          onClick={() => handleConfirmCodPayment(paymentInfo.paymentId, selectedOrder.orderId)}
                          className="mt-2 bg-green-700 hover:bg-green-800 text-white text-[9px] font-bold tracking-wider uppercase px-3 py-1.5 rounded-none cursor-pointer"
                        >
                          Xác nhận thu tiền mặt
                        </button>
                      )}
                    </>
                  ) : (
                    <p className="text-brand-muted">Không tìm thấy thông tin giao dịch thanh toán.</p>
                  )}
                </div>
              </div>
            </div>

            {/* List of items purchased */}
            <div className="space-y-3">
              <h4 className="text-[10px] uppercase font-bold tracking-wider text-brand-muted">Danh sách sản phẩm mua</h4>
              <div className="border border-gray-150 divide-y divide-gray-150 text-xs">
                {selectedOrder.orderDetails && selectedOrder.orderDetails.length > 0 ? (
                  selectedOrder.orderDetails.map((item, index) => (
                    <div key={index} className="flex justify-between items-center p-3 hover:bg-gray-50/50">
                      <div>
                        <p className="font-semibold text-brand-charcoal">{item.productName}</p>
                        <p className="text-[10px] text-brand-muted mt-0.5">Phân loại: {item.color} / Size {item.size}</p>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold text-brand-charcoal">{formatVND(item.price)} x {item.quantity}</p>
                        <p className="text-[10px] text-brand-muted font-bold mt-0.5">Tổng: {formatVND(item.subtotal)}</p>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="p-4 text-center text-brand-muted text-xs">Không có dữ liệu chi tiết sản phẩm.</div>
                )}
              </div>
            </div>

            {/* Order totals */}
            <div className="flex justify-end text-xs font-semibold text-brand-charcoal pt-3 border-t border-gray-100">
              <div className="w-52 space-y-1.5 text-right">
                <p className="flex justify-between">
                  <span className="text-brand-muted">Thành tiền:</span>
                  <span>{formatVND(selectedOrder.totalAmount)}</span>
                </p>
                {selectedOrder.couponCode && (
                  <p className="flex justify-between text-brand-blush">
                    <span className="text-brand-muted">Mã giảm giá ({selectedOrder.couponCode}):</span>
                    <span>Đã áp dụng</span>
                  </p>
                )}
                <p className="flex justify-between text-sm font-bold text-brand-charcoal border-t border-gray-100 pt-1.5">
                  <span className="text-brand-muted">Tổng thu:</span>
                  <span>{formatVND(selectedOrder.totalAmount)}</span>
                </p>
              </div>
            </div>

            {/* ─── ADMINISTRATIVE ACTIONS CONTROLLERS ─── */}
            <div className="flex flex-wrap gap-2.5 pt-4 border-t border-gray-100 justify-between items-center text-xs">
              <div>
                <span className="font-semibold text-brand-muted uppercase text-[9px] tracking-wider">Trạng thái:</span>
                <span className={`ml-1.5 px-2 py-0.5 rounded text-[10px] font-bold border ${getStatusBadgeClass(selectedOrder.status)}`}>
                  {getStatusTranslation(selectedOrder.status)}
                </span>
              </div>

              <div className="flex gap-2">
                {/* 1. Confirm / Prepare shipment */}
                {selectedOrder.status === 'PENDING' && (
                  <button
                    onClick={() => handleUpdateStatus(selectedOrder.orderId, 'CONFIRMED')}
                    className="bg-blue-600 hover:bg-blue-700 text-white text-[10px] font-bold tracking-wider uppercase px-4 py-2.5 rounded-none cursor-pointer"
                  >
                    Xác nhận đơn
                  </button>
                )}
                
                {/* 2. Dispatch / Start shipping */}
                {(selectedOrder.status === 'PENDING' || selectedOrder.status === 'CONFIRMED') && (
                  <button
                    onClick={() => handleShipOrder(selectedOrder.orderId)}
                    className="bg-brand-charcoal hover:bg-brand-dark text-white text-[10px] font-bold tracking-wider uppercase px-4 py-2.5 rounded-none cursor-pointer"
                  >
                    Giao hàng
                  </button>
                )}

                {/* 3. Confirm Delivery */}
                {selectedOrder.status === 'SHIPPING' && (
                  <button
                    onClick={() => handleDeliverOrder(selectedOrder.orderId)}
                    className="bg-green-700 hover:bg-green-800 text-white text-[10px] font-bold tracking-wider uppercase px-4 py-2.5 rounded-none cursor-pointer"
                  >
                    Đã nhận hàng
                  </button>
                )}

                {/* 4. Cancel Order */}
                {selectedOrder.status !== 'DELIVERED' && selectedOrder.status !== 'CANCELLED' && (
                  <button
                    onClick={() => handleCancelOrder(selectedOrder.orderId)}
                    className="border border-red-600 text-red-600 hover:bg-red-50 text-[10px] font-bold tracking-wider uppercase px-4 py-2.5 rounded-none cursor-pointer"
                  >
                    Hủy đơn
                  </button>
                )}
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  )
}
