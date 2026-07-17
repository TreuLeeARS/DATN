import { useState, useEffect } from 'react'
import { formatVND } from '../../utils/price.js'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Header } from '../../components/Header/Header.jsx'
import { Footer } from '../../components/Footer/Footer.jsx'
import orderApi from '../../api/orderApi'
import paymentApi from '../../api/paymentApi'
import invoiceApi from '../../api/invoiceApi.js'
import { ConfirmModal } from '../../components/ConfirmModal.jsx'
import { parseShippingAddress } from '../../utils/shippingAddress.js'
import { escapeHtml } from '../../utils/html.js'
import { isPaymentNotFoundError } from '../../utils/payment.js'


export const MyOrders = () => {
  const navigate = useNavigate()
  const [orders, setOrders] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [expandedOrderId, setExpandedOrderId] = useState(null)
  const [paymentDetails, setPaymentDetails] = useState({}) // orderId -> PaymentStatusResponse từ BE
  const [myInvoices, setMyInvoices] = useState([])


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

  const fetchOrderPaymentStatus = async (orderId) => {
    try {
      const res = await paymentApi.getPaymentStatusByOrderId(orderId)
      setPaymentDetails(prev => ({
        ...prev,
        [orderId]: res?.data || null
      }))
    } catch (error) {
      console.error(`Error loading payment status for order #${orderId}:`, error)
      setPaymentDetails(prev => ({
        ...prev,
        [orderId]: isPaymentNotFoundError(error)
          ? { paymentStatus: 'NOT_CREATED' }
          : undefined
      }))
    }
  }

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

  // Fetch my invoices
  const fetchMyInvoices = async () => {
    try {
      const token = localStorage.getItem('accessToken')
      if (token) {
        const res = await invoiceApi.getMyInvoices()
        if (res && res.data) {
          setMyInvoices(res.data || [])
        }
      }
    } catch (e) {
      console.error('Error fetching my invoices:', e)
    }
  }

  useEffect(() => {
    fetchMyInvoices()
  }, [])

  const handlePrintInvoice = (invoice, paymentInfo) => {
    if (!invoice) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Trình duyệt đã chặn pop-up in. Vui lòng cấp quyền truy cập.')
      return
    }

    const dateStr = invoice.invoiceDate
      ? new Date(invoice.invoiceDate).toLocaleString('vi-VN')
      : 'N/A'
    const shippingInfo = parseShippingAddress(invoice.order?.shippingAddress)
    const customerName = shippingInfo.fullName || (invoice.order?.user
      ? `${invoice.order.user.lastName || ''} ${invoice.order.user.firstName || ''}`.trim() || invoice.order.user.username
      : 'Khách hàng')
    
    const customerPhone = shippingInfo.phone || invoice.order?.user?.phone || 'N/A'
    const customerEmail = invoice.order?.user?.email || 'N/A'
    const shippingAddress = shippingInfo.address || invoice.order?.shippingAddress || 'Không có dữ liệu từ BE'

    const itemsHtml = (invoice.order?.items || []).map((item, idx) => {
      const colorText = item.color ? `Màu: ${item.color}` : ''
      const sizeText = item.size ? `Size: ${item.size}` : ''
      const attrs = [colorText, sizeText].filter(Boolean).join(', ')
      const subtotal = ((item.quantity ?? 0) * (item.unitPrice ?? 0)) - (item.discountAmount ?? 0)
      
      return `
        <tr>
          <td style="text-align: center; border-bottom: 1px solid #eee; padding: 8px;">${idx + 1}</td>
          <td style="border-bottom: 1px solid #eee; padding: 8px;">
            <div style="font-weight: 600;">${escapeHtml(item.productName || 'Sản phẩm')}</div>
            ${attrs ? `<div style="font-size: 11px; color: #666; margin-top: 2px;">${escapeHtml(attrs)}</div>` : ''}
          </td>
          <td style="text-align: center; border-bottom: 1px solid #eee; padding: 8px;">${item.quantity || 0}</td>
          <td style="text-align: right; border-bottom: 1px solid #eee; padding: 8px;">${formatVND(item.unitPrice || 0)}</td>
          <td style="text-align: right; border-bottom: 1px solid #eee; padding: 8px; font-weight: 600;">${formatVND(subtotal)}</td>
        </tr>
      `
    }).join('')

    const invoiceHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <title>Hóa đơn #${escapeHtml(invoice.id)}</title>
          <style>
            body {
              font-family: 'Segoe UI', Roboto, Arial, sans-serif;
              color: #1a1a1a;
              margin: 0;
              padding: 30px;
              font-size: 13px;
              line-height: 1.5;
            }
            .invoice-box {
              max-width: 800px;
              margin: auto;
              border: 1px solid #eee;
              padding: 40px;
              background: #fff;
            }
            .header-table {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 30px;
            }
            .header-table td {
              padding: 0;
              vertical-align: top;
            }
            .title {
              font-size: 26px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 1.5px;
              margin: 0 0 8px 0;
              color: #111;
            }
            .shop-info {
              font-size: 12px;
              color: #666;
            }
            .invoice-details {
              text-align: right;
              font-size: 12px;
            }
            .section-title {
              font-size: 11px;
              font-weight: bold;
              text-transform: uppercase;
              color: #888;
              border-bottom: 1.5px solid #222;
              padding-bottom: 6px;
              margin: 30px 0 15px 0;
            }
            .info-grid {
              width: 100%;
              border-collapse: collapse;
            }
            .info-grid td {
              width: 50%;
              vertical-align: top;
              line-height: 1.6;
            }
            .items-table {
              width: 100%;
              border-collapse: collapse;
              margin: 20px 0;
            }
            .items-table th {
              background: #f8f9fa;
              border-top: 1px solid #e9ecef;
              border-bottom: 2px solid #dee2e6;
              padding: 10px;
              font-size: 11px;
              font-weight: bold;
              text-transform: uppercase;
            }
            .totals-table {
              width: 300px;
              margin-left: auto;
              border-collapse: collapse;
            }
            .totals-table td {
              padding: 6px 10px;
            }
            .totals-final {
              font-size: 15px;
              font-weight: bold;
              border-top: 1.5px solid #222;
              padding-top: 10px;
            }
            .footer {
              text-align: center;
              margin-top: 50px;
              padding-top: 20px;
              border-top: 1px dashed #ced4da;
              font-size: 11px;
              color: #868e96;
            }
            @media print {
              body { padding: 0; }
              .invoice-box { border: none; padding: 0; }
            }
          </style>
        </head>
        <body>
          <div class="invoice-box">
            <table class="header-table">
              <tr>
                <td>
                  <h1 class="title">OUTTA STORE 💜</h1>
                  <div class="shop-info">
                    <strong>Đơn vị bán hàng:</strong> OUTTA E-Commerce<br>
                    <strong>Địa chỉ:</strong> 123 Đường Cầu Giấy, Hà Nội
                  </div>
                </td>
                <td class="invoice-details">
                  <div style="font-size: 16px; font-weight: bold; margin-bottom: 5px;">HÓA ĐƠN BÁN HÀNG</div>
                  <strong>Mã hóa đơn:</strong> #${escapeHtml(invoice.id)}<br>
                  <strong>Ngày xuất:</strong> ${escapeHtml(dateStr)}
                </td>
              </tr>
            </table>

            <div class="section-title">Thông tin giao nhận</div>
            <table class="info-grid">
              <tr>
                <td>
                  <strong>Khách hàng:</strong> ${escapeHtml(customerName)}<br>
                  <strong>Điện thoại:</strong> ${escapeHtml(customerPhone)}<br>
                  <strong>Email:</strong> ${escapeHtml(customerEmail)}
                </td>
                <td>
                  <strong>Địa chỉ nhận hàng:</strong><br>
                  ${escapeHtml(shippingAddress).replace(/\n/g, '<br>')}
                </td>
              </tr>
            </table>

            <div class="section-title">Chi tiết thanh toán</div>
            <table class="info-grid" style="margin-bottom: 20px;">
              <tr>
                <td>
                  <strong>Phương thức:</strong> ${escapeHtml(paymentInfo?.paymentMethod || 'Không có dữ liệu từ BE')}<br>
                  <strong>Trạng thái:</strong> ${escapeHtml(paymentInfo?.paymentStatus || 'Không có dữ liệu từ BE')}
                </td>
                <td>
                  <strong>Mã thanh toán:</strong> ${escapeHtml(paymentInfo?.paymentId ?? 'Không có dữ liệu từ BE')}<br>
                  <strong>Số tiền:</strong> ${escapeHtml(paymentInfo?.amount != null ? formatVND(paymentInfo.amount) : 'Không có dữ liệu từ BE')}
                </td>
              </tr>
            </table>
            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 50px; text-align: center;">STT</th>
                  <th>Tên mặt hàng</th>
                  <th style="width: 80px; text-align: center;">Số lượng</th>
                  <th style="width: 130px; text-align: right;">Đơn giá</th>
                  <th style="width: 150px; text-align: right;">Thành tiền</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
            </table>

            <table class="totals-table">
              <tr class="totals-final">
                <td style="text-align: left;">Tổng thanh toán:</td>
                <td style="text-align: right; font-size: 15px;">${formatVND(invoice.totalAmount)}</td>
              </tr>
            </table>

            <div class="footer">
              Cảm ơn quý khách đã mua sắm tại OUTTA STORE!<br>
              Hóa đơn điện tử tự động tạo lập từ OUTTA.
            </div>
          </div>
        </body>
      </html>
    `

    printWindow.document.write(invoiceHtml)
    printWindow.document.close()
    printWindow.focus()
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  }


  const handleCancelMyOrder = (orderId) => {
    openConfirm(
      'Hủy đơn hàng',
      'Bạn có chắc chắn muốn hủy đơn hàng này?',
      async () => {
        try {
          const res = await orderApi.cancelOrder(orderId)
          toast.success('Hủy đơn hàng thành công!')
          if (res?.data) {
            setOrders(prev => prev.map(order => order.orderId === orderId ? res.data : order))
          }
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

  const getStatusLabel = (status) => {
    switch (status) {
      case 'CREATED': return 'Chờ xử lý'
      case 'CONFIRMED': return 'Đã xác nhận'
      case 'SHIPPING': return 'Đang giao hàng'
      case 'DELIVERED': return 'Đã nhận hàng'
      case 'CANCELED': return 'Đã hủy'
      default: return status
    }
  }

  const getStatusColorClass = (status) => {
    switch (status) {
      case 'CREATED': return 'text-amber-600 bg-amber-50 border-amber-200'
      case 'CONFIRMED': return 'text-blue-600 bg-blue-50 border-blue-200'
      case 'SHIPPING': return 'text-indigo-600 bg-indigo-50 border-indigo-200'
      case 'DELIVERED': return 'text-green-600 bg-green-50 border-green-200'
      case 'CANCELED': return 'text-red-500 bg-red-50 border-red-200'
      default: return 'text-gray-500 bg-gray-50 border-gray-200'
    }
  }

  const getPaymentStatusColorClass = (status) => {
    switch (status) {
      case 'SUCCESS': return 'bg-green-50 text-green-700 border-green-200'
      case 'FAILED': return 'bg-red-50 text-red-700 border-red-200'
      case 'REFUNDED': return 'bg-blue-50 text-blue-700 border-blue-200'
      case 'PENDING': return 'bg-amber-50 text-amber-700 border-amber-200'
      default: return 'bg-gray-50 text-gray-600 border-gray-200'
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
                const paymentInfo = paymentDetails[o.orderId]
                const paymentLoaded = Object.prototype.hasOwnProperty.call(paymentDetails, o.orderId)
                  && paymentInfo !== undefined
                const payStatus = paymentInfo?.paymentStatus
                
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
                          Ngày đặt: {o.orderDate ? new Date(o.orderDate).toLocaleDateString('vi-VN') : 'N/A'}
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
                            <p><span className="font-semibold text-brand-muted">Người nhận:</span> {shipInfo.fullName || 'N/A'}</p>
                            <p><span className="font-semibold text-brand-muted">Số điện thoại:</span> {shipInfo.phone || 'N/A'}</p>
                            <p><span className="font-semibold text-brand-muted">Địa chỉ:</span> {shipInfo.address || 'N/A'}</p>
                            <p><span className="font-semibold text-brand-muted">Phường/Xã:</span> {o.ward || 'BE chưa trả dữ liệu'}</p>
                            <p><span className="font-semibold text-brand-muted">Quận/Huyện:</span> {o.district || 'BE chưa trả dữ liệu'}</p>
                            <p><span className="font-semibold text-brand-muted">Tỉnh/Thành:</span> {o.province || 'BE chưa trả dữ liệu'}</p>
                          </div>
                          
                          <div className="space-y-1.5 text-brand-charcoal">
                            <h4 className="text-[9px] uppercase font-bold text-brand-muted tracking-wider">Thông tin thanh toán</h4>
                            <p>
                              <span className="font-semibold text-brand-muted">Phương thức:</span>{' '}
                              {paymentInfo?.paymentMethod || 'Chưa có dữ liệu từ BE'}
                            </p>
                            {paymentInfo?.paymentId != null && (
                              <p><span className="font-semibold text-brand-muted">Mã thanh toán:</span> {paymentInfo.paymentId}</p>
                            )}
                            {paymentInfo?.amount != null && (
                              <p><span className="font-semibold text-brand-muted">Số tiền:</span> {formatVND(paymentInfo.amount)}</p>
                            )}
                            <p className="flex items-center gap-1.5">
                              <span className="font-semibold text-brand-muted">Giao dịch:</span>
                              <span className={`px-1.5 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider ${getPaymentStatusColorClass(payStatus)}`}>
                                {payStatus || 'Chưa có dữ liệu từ BE'}
                              </span>
                            </p>
                          </div>
                        </div>

                        {/* Order items list */}
                        <div className="space-y-2">
                          <h4 className="text-[9px] uppercase font-bold text-brand-muted tracking-wider">Danh sách món hàng</h4>
                          <div className="bg-white border border-gray-150 divide-y divide-gray-100">
                            {o.items && o.items.map((item, idx) => (
                              <div key={idx} className="flex justify-between items-center p-3">
                                <div>
                                  <p className="font-semibold text-brand-charcoal">{item.productName}</p>
                                  <p className="text-[10px] text-brand-muted mt-0.5">Phân loại: {item.color} / Size {item.size}</p>
                                </div>
                                <div className="text-right">
                                  <p className="font-bold text-brand-charcoal">{formatVND(item.unitPrice)} x {item.quantity}</p>
                                  {item.lineTotal !== undefined && (
                                    <p className="text-[10px] text-brand-muted font-bold mt-0.5">Thành tiền: {formatVND(item.lineTotal)}</p>
                                  )}
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        <div className="flex justify-end border-t border-gray-200 pt-4">
                          <div className="w-full sm:w-72 space-y-1.5 text-right">
                            <p className="flex justify-between">
                              <span className="text-brand-muted">Tạm tính:</span>
                              <span>{formatVND(o.subtotalAmount)}</span>
                            </p>
                            {Number(o.discountValue || 0) > 0 && (
                              <p className="flex justify-between text-green-700">
                                <span>Giảm giá{o.couponCode ? ` (${o.couponCode})` : ''}:</span>
                                <span>-{formatVND(o.discountValue)}</span>
                              </p>
                            )}
                            <p className="flex justify-between">
                              <span className="text-brand-muted">Phí vận chuyển:</span>
                              <span>{formatVND(o.shippingFee)}</span>
                            </p>
                            <p className="flex justify-between text-sm font-bold border-t border-gray-200 pt-1.5">
                              <span>Tổng thanh toán:</span>
                              <span>{formatVND(o.totalAmount)}</span>
                            </p>
                          </div>
                        </div>

                        {/* Order footer actions */}
                        <div className="flex justify-between items-center pt-2">
                          <div>
                            {(() => {
                              const matchingInvoice = myInvoices.find(inv => inv.order?.orderId === o.orderId)
                              return (
                                <div className="flex gap-2">
                                  {paymentLoaded && payStatus !== 'SUCCESS' && (o.status === 'CREATED' || o.status === 'CONFIRMED') && (
                                    <button
                                      onClick={() => handleCancelMyOrder(o.orderId)}
                                      className="border border-red-500 text-red-500 text-[10px] font-semibold tracking-wider uppercase px-4 py-2 hover:bg-red-50 transition-colors rounded-none cursor-pointer"
                                    >
                                      Hủy đơn hàng
                                    </button>
                                  )}
                                  {matchingInvoice && (
                                    <button
                                      onClick={() => handlePrintInvoice(matchingInvoice, paymentInfo)}
                                      className="border border-brand-charcoal text-brand-charcoal text-[10px] font-semibold tracking-wider uppercase px-4 py-2 hover:bg-brand-charcoal hover:text-white transition-all rounded-none cursor-pointer"
                                    >
                                      Xem hóa đơn
                                    </button>
                                  )}
                                </div>
                              )
                            })()}
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
