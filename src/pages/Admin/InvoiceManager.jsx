import { useState, useEffect, useCallback } from 'react'
import { formatVND } from '../../utils/price.js'
import toast from 'react-hot-toast'
import invoiceApi from '../../api/invoiceApi.js'
import paymentApi from '../../api/paymentApi.js'
import { parseShippingAddress } from '../../utils/shippingAddress.js'
import { isStaff } from '../../utils/auth.js'
import { escapeHtml } from '../../utils/html.js'
import { getPaymentStatusLabel } from '../../utils/payment.js'

export const InvoiceManager = () => {
  const userIsStaff = isStaff()
  const [invoices, setInvoices] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)
  const [invoiceIdQuery, setInvoiceIdQuery] = useState('')
  const [isInvoiceSearchActive, setIsInvoiceSearchActive] = useState(false)
  const [isSearching, setIsSearching] = useState(false)

  // Details Modal state
  const [selectedInvoice, setSelectedInvoice] = useState(null)
  const [isModalOpen, setIsModalOpen] = useState(false)
  const [paymentDetails, setPaymentDetails] = useState({})
  const selectedShippingInfo = parseShippingAddress(selectedInvoice?.order?.shippingAddress)
  const selectedPaymentInfo = paymentDetails[selectedInvoice?.order?.orderId]

  const fetchInvoices = useCallback(async () => {
    try {
      setLoading(true)
      const res = await invoiceApi.getInvoices({
        page: page,
        size: 10
      })
      if (res && res.data) {
        setInvoices(res.data.content || [])
        setTotalPages(res.data.totalPages || 1)
        setTotalElements(res.data.totalElements || 0)
      }
    } catch (err) {
      console.error('Error fetching invoices:', err)
      toast.error('Không thể tải danh sách hóa đơn từ máy chủ.')
    } finally {
      setLoading(false)
    }
  }, [page])

  useEffect(() => {
    if (!isInvoiceSearchActive) {
      fetchInvoices()
    }
  }, [fetchInvoices, isInvoiceSearchActive])

  const handleInvoiceSearch = async (event) => {
    event.preventDefault()
    const normalizedId = invoiceIdQuery.trim().replace(/^#/, '')

    if (!normalizedId) {
      setIsInvoiceSearchActive(false)
      setPage(0)
      fetchInvoices()
      return
    }

    if (!/^\d+$/.test(normalizedId)) {
      toast.error('Vui lòng nhập mã hóa đơn là số, ví dụ: 1.')
      return
    }

    try {
      setIsSearching(true)
      const res = await invoiceApi.getInvoiceById(Number(normalizedId))
      if (!res?.data) {
        throw new Error('Invoice response is empty')
      }

      setInvoices([res.data])
      setTotalElements(1)
      setTotalPages(1)
      setPage(0)
      setIsInvoiceSearchActive(true)
    } catch (error) {
      console.error('Error searching invoice:', error)
      setInvoices([])
      setTotalElements(0)
      setTotalPages(1)
      setIsInvoiceSearchActive(true)
      toast.error(`Không tìm thấy hóa đơn #${normalizedId}.`)
    } finally {
      setIsSearching(false)
    }
  }

  const handleClearInvoiceSearch = () => {
    setInvoiceIdQuery('')
    setIsInvoiceSearchActive(false)
    setPage(0)
    fetchInvoices()
  }

  const fetchPaymentDetails = async (orderId) => {
    if (!orderId) return null
    if (paymentDetails[orderId]) return paymentDetails[orderId]

    try {
      const res = await paymentApi.getPaymentStatusByOrderId(orderId)
      if (res?.data) {
        setPaymentDetails(prev => ({ ...prev, [orderId]: res.data }))
        return res.data
      }
    } catch (error) {
      console.error(`Error loading payment details for order #${orderId}:`, error)
    }
    return null
  }

  const handleOpenDetails = (invoice) => {
    setSelectedInvoice(invoice)
    setIsModalOpen(true)
    fetchPaymentDetails(invoice.order?.orderId)
  }

  const handlePrint = async (invoice) => {
    if (!invoice) return

    const printWindow = window.open('', '_blank')
    if (!printWindow) {
      toast.error('Trình duyệt đã chặn pop-up in. Vui lòng cấp quyền truy cập.')
      return
    }

    const paymentInfo = await fetchPaymentDetails(invoice.order?.orderId)

    const dateStr = invoice.invoiceDate
      ? new Date(invoice.invoiceDate).toLocaleString('vi-VN')
      : 'N/A'
    const orderDateStr = invoice.order?.orderDate
      ? new Date(invoice.order.orderDate).toLocaleString('vi-VN')
      : 'N/A'

    const shippingInfo = parseShippingAddress(invoice.order?.shippingAddress)
    const customerName = shippingInfo.fullName || (invoice.order?.user
      ? `${invoice.order.user.lastName || ''} ${invoice.order.user.firstName || ''}`.trim() || invoice.order.user.username
      : 'Khách vãng lai')
    
    const customerPhone = shippingInfo.phone || invoice.order?.user?.phone || 'Chưa cập nhật'
    const customerEmail = invoice.order?.user?.email || 'Chưa cập nhật'
    const shippingAddress = shippingInfo.address || invoice.order?.shippingAddress || 'Không có dữ liệu từ BE'

    // Format list of items
    const itemsHtml = (invoice.order?.items || []).map((item, idx) => {
      const colorText = item.color ? `Màu: ${item.color}` : ''
      const sizeText = item.size ? `Size: ${item.size}` : ''
      const attrs = [colorText, sizeText].filter(Boolean).join(', ')
      const subtotal = ((item.quantity ?? 0) * (item.unitPrice ?? 0)) - (item.discountAmount ?? 0)
      
      return `
        <tr>
          <td style="text-align: center; border-bottom: 1px solid #eee; padding: 8px;">${idx + 1}</td>
          <td style="border-bottom: 1px solid #eee; padding: 8px;">
            <div style="font-weight: 600;">${escapeHtml(item.productName || 'Sản phẩm không rõ')}</div>
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
              font-family: 'Segoe UI', Roboto, Helvetica, Arial, sans-serif;
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
              box-shadow: 0 0 10px rgba(0, 0, 0, 0.05);
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
              line-height: 1.6;
            }
            .invoice-details {
              text-align: right;
              font-size: 12px;
              line-height: 1.6;
            }
            .section-title {
              font-size: 11px;
              font-weight: bold;
              text-transform: uppercase;
              letter-spacing: 1px;
              color: #888;
              border-bottom: 1.5px solid #222;
              padding-bottom: 6px;
              margin: 30px 0 15px 0;
            }
            .info-grid {
              width: 100%;
              border-collapse: collapse;
              margin-bottom: 25px;
            }
            .info-grid td {
              width: 50%;
              padding: 0 15px 0 0;
              vertical-align: top;
              line-height: 1.6;
            }
            .info-label {
              font-weight: bold;
              color: #333;
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
              color: #495057;
            }
            .totals-table {
              width: 350px;
              margin-left: auto;
              border-collapse: collapse;
              margin-top: 20px;
            }
            .totals-table td {
              padding: 6px 10px;
              font-size: 12px;
            }
            .totals-label {
              text-align: left;
              color: #666;
            }
            .totals-value {
              text-align: right;
              font-weight: 500;
            }
            .totals-final {
              font-size: 15px;
              font-weight: bold;
              color: #000;
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
              line-height: 1.6;
            }
            @media print {
              body {
                padding: 0;
              }
              .invoice-box {
                border: none;
                box-shadow: none;
                padding: 0;
              }
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
                    <strong>Địa chỉ:</strong> 123 Đường Cầu Giấy, Quận Cầu Giấy, Hà Nội<br>
                    <strong>Hotline:</strong> 0363 977 304 | <strong>Email:</strong> support@outta.vn
                  </div>
                </td>
                <td class="invoice-details">
                  <div style="font-size: 16px; font-weight: bold; color: #000; margin-bottom: 5px;">HÓA ĐƠN BÁN HÀNG</div>
                  <strong>Mã hóa đơn:</strong> #${escapeHtml(invoice.id)}<br>
                  <strong>Ngày xuất:</strong> ${escapeHtml(dateStr)}<br>
                  <strong>Mã đơn hàng:</strong> #${escapeHtml(invoice.order?.orderId || 'N/A')}<br>
                  <strong>Ngày đặt hàng:</strong> ${escapeHtml(orderDateStr)}
                </td>
              </tr>
            </table>

            <div class="section-title">Thông tin khách hàng & Giao nhận</div>
            <table class="info-grid">
              <tr>
                <td>
                  <span class="info-label">Khách hàng nhận hóa đơn:</span><br>
                  Họ tên: ${escapeHtml(customerName)}<br>
                  Điện thoại: ${escapeHtml(customerPhone)}<br>
                  Email: ${escapeHtml(customerEmail)}
                </td>
                <td>
                  <span class="info-label">Địa chỉ nhận hàng:</span><br>
                  ${escapeHtml(shippingAddress).replace(/\n/g, '<br>')}
                </td>
              </tr>
            </table>

            <div class="section-title">Thông tin thanh toán</div>
            <table class="info-grid">
              <tr>
                <td>
                  <span class="info-label">Phương thức:</span><br>
                  ${escapeHtml(paymentInfo?.paymentMethod || 'Không có dữ liệu từ BE')}
                </td>
                <td>
                  <span class="info-label">Trạng thái:</span><br>
                  ${escapeHtml(getPaymentStatusLabel(paymentInfo?.paymentStatus, paymentInfo?.paymentMethod))}
                </td>
                <td>
                  <span class="info-label">Mã thanh toán:</span><br>
                  ${escapeHtml(paymentInfo?.paymentId ?? 'Không có dữ liệu từ BE')}
                </td>
              </tr>
            </table>

            <div class="section-title">Chi tiết mặt hàng thanh toán</div>
            <table class="items-table">
              <thead>
                <tr>
                  <th style="width: 50px; text-align: center;">STT</th>
                  <th>Tên mặt hàng / Mô tả phân loại</th>
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
                <td class="totals-label" style="font-weight: bold;">Tổng tiền thanh toán:</td>
                <td class="totals-value" style="font-weight: bold; font-size: 15px;">${formatVND(invoice.totalAmount)}</td>
              </tr>
            </table>

            <div class="footer">
              Cảm ơn quý khách đã mua sắm tại OUTTA STORE!<br>
              Hóa đơn này được tạo tự động bởi hệ thống quản lý bán hàng OUTTA.<br>
              <em>Bản in hóa đơn có giá trị lưu giữ và đối chiếu thông tin giao nhận hàng.</em>
            </div>
          </div>
        </body>
      </html>
    `

    printWindow.document.write(invoiceHtml)
    printWindow.document.close()
    printWindow.focus()
    
    // Trigger printing
    setTimeout(() => {
      printWindow.print()
      printWindow.close()
    }, 500)
  }

  return (
    <div className="space-y-8 animate-fade-in font-sans pb-16">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 border border-black/10 shadow-sm">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-brand-charcoal">
            {userIsStaff ? 'Tra cứu hóa đơn (Invoices)' : 'Quản lý hóa đơn (Invoices)'}
          </h2>
          <p className="text-[10px] text-brand-muted tracking-wider uppercase mt-1">
            {isInvoiceSearchActive ? 'Kết quả tra cứu: ' : 'Tổng số hóa đơn đã xuất: '}
            <span className="font-bold text-brand-charcoal">{totalElements}</span>
          </p>
        </div>
        <form onSubmit={handleInvoiceSearch} className="flex w-full sm:w-auto gap-2">
          <input
            value={invoiceIdQuery}
            onChange={(event) => setInvoiceIdQuery(event.target.value)}
            inputMode="numeric"
            placeholder="Nhập mã hóa đơn..."
            aria-label="Tra cứu theo mã hóa đơn"
            className="min-w-0 flex-1 sm:w-52 border border-black/15 px-3 py-2 text-xs outline-none focus:border-brand-charcoal"
          />
          <button
            type="submit"
            disabled={isSearching}
            className="border border-brand-charcoal bg-brand-charcoal px-4 py-2 text-[10px] font-bold uppercase tracking-wider text-white transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {isSearching ? 'Đang tìm...' : 'Tra cứu'}
          </button>
          {isInvoiceSearchActive && (
            <button
              type="button"
              onClick={handleClearInvoiceSearch}
              className="border border-black/15 px-3 py-2 text-[10px] font-bold uppercase tracking-wider text-brand-charcoal hover:bg-gray-50"
            >
              Xóa
            </button>
          )}
        </form>
      </div>

      {/* TABLE SECTION */}
      <div className="bg-white border border-black/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-brand-charcoal text-white uppercase tracking-wider text-[10px] border-b border-brand-charcoal">
                <th className="py-4 px-6 text-center font-bold">Mã HD</th>
                <th className="py-4 px-6 font-bold">Ngày Xuất Hóa Đơn</th>
                <th className="py-4 px-6 text-center font-bold">Mã Đơn Hàng</th>
                <th className="py-4 px-6 font-bold">Khách Hàng</th>
                <th className="py-4 px-6 text-right font-bold">Tổng Thanh Toán</th>
                <th className="py-4 px-6 text-center font-bold">Thao Tác</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-brand-muted tracking-widest uppercase font-semibold text-[10px]">
                    Đang tải danh sách hóa đơn...
                  </td>
                </tr>
              ) : invoices.length === 0 ? (
                <tr>
                  <td colSpan="6" className="py-12 text-center text-brand-muted tracking-widest uppercase font-semibold text-[10px]">
                    Không tìm thấy hóa đơn nào trong hệ thống.
                  </td>
                </tr>
              ) : (
                invoices.map((inv) => {
                  const customerName = inv.order?.user
                    ? `${inv.order.user.lastName || ''} ${inv.order.user.firstName || ''}`.trim() || inv.order.user.username
                    : 'N/A'
                  return (
                    <tr key={inv.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                      <td className="py-4 px-6 text-center font-semibold text-brand-charcoal">
                        #{inv.id}
                      </td>
                      <td className="py-4 px-6 text-brand-muted font-medium">
                        {inv.invoiceDate ? new Date(inv.invoiceDate).toLocaleString('vi-VN') : 'N/A'}
                      </td>
                      <td className="py-4 px-6 text-center font-medium">
                        {inv.order?.orderId ? `#${inv.order.orderId}` : 'N/A'}
                      </td>
                      <td className="py-4 px-6 font-semibold text-brand-charcoal">
                        {customerName}
                      </td>
                      <td className="py-4 px-6 text-right font-bold text-brand-charcoal">
                        {formatVND(inv.totalAmount || 0)}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <button
                          onClick={() => handleOpenDetails(inv)}
                          className="text-[9.5px] uppercase tracking-wider font-bold text-brand-charcoal hover:opacity-60 cursor-pointer border border-brand-charcoal/20 px-3 py-1.5 hover:bg-brand-charcoal hover:text-white transition-all"
                        >
                          Chi tiết / In HD
                        </button>
                      </td>
                    </tr>
                  )
                })
              )}
            </tbody>
          </table>
        </div>

        {/* PAGINATION FOOTER */}
        {!loading && totalPages > 1 && (
          <div className="flex justify-between items-center px-6 py-4 border-t border-gray-100 bg-gray-50/50 text-xs">
            <button
              disabled={page === 0}
              onClick={() => setPage(prev => Math.max(0, prev - 1))}
              className="px-3.5 py-1.5 border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-colors uppercase tracking-wider text-[10px] font-semibold"
            >
              Trước
            </button>
            <span className="font-semibold text-brand-muted tracking-wider uppercase text-[10px]">
              Trang {page + 1} / {totalPages}
            </span>
            <button
              disabled={page >= totalPages - 1}
              onClick={() => setPage(prev => Math.min(totalPages - 1, prev + 1))}
              className="px-3.5 py-1.5 border border-gray-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-white transition-colors uppercase tracking-wider text-[10px] font-semibold"
            >
              Sau
            </button>
          </div>
        )}
      </div>

      {/* DETAIL MODAL */}
      {isModalOpen && selectedInvoice && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-brand-charcoal/60 backdrop-blur-sm animate-fade-in">
          <div className="w-full max-w-3xl bg-white border border-black/10 shadow-2xl p-6 md:p-8 space-y-6 max-h-[90vh] overflow-y-auto rounded-none">
            
            {/* Modal Header */}
            <div className="flex justify-between items-center border-b border-gray-100 pb-4">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-widest text-brand-charcoal">
                  Chi tiết hóa đơn #{selectedInvoice.id}
                </h3>
                <p className="text-[9px] text-brand-muted uppercase mt-0.5">
                  Ngày xuất: {selectedInvoice.invoiceDate ? new Date(selectedInvoice.invoiceDate).toLocaleString('vi-VN') : 'N/A'}
                </p>
              </div>
              <button 
                onClick={() => setIsModalOpen(false)} 
                className="text-brand-charcoal text-sm hover:opacity-70 font-semibold cursor-pointer"
              >
                ✕
              </button>
            </div>

            {/* Modal Content */}
            <div className="space-y-6 text-xs text-brand-charcoal">
              {/* Customer and Order Info Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-brand-cream/30 p-4 border border-black/5">
                <div className="space-y-1.5">
                  <h4 className="font-bold text-[10px] uppercase text-brand-muted tracking-wider border-b border-gray-200 pb-1 mb-2">
                    Khách Hàng Nhận HĐ
                  </h4>
                  <p>
                    <span className="font-semibold text-brand-muted">Họ tên:</span>{' '}
                    {selectedInvoice.order?.user
                      ? `${selectedInvoice.order.user.lastName || ''} ${selectedInvoice.order.user.firstName || ''}`.trim() || selectedInvoice.order.user.username
                      : 'Khách vãng lai'}
                  </p>
                  <p>
                    <span className="font-semibold text-brand-muted">Điện thoại:</span>{' '}
                    {selectedInvoice.order?.user?.phone || 'N/A'}
                  </p>
                  <p>
                    <span className="font-semibold text-brand-muted">Email:</span>{' '}
                    {selectedInvoice.order?.user?.email || 'N/A'}
                  </p>
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-bold text-[10px] uppercase text-brand-muted tracking-wider border-b border-gray-200 pb-1 mb-2">
                    Thông Tin Đơn Hàng
                  </h4>
                  <p>
                    <span className="font-semibold text-brand-muted">Mã đơn hàng:</span>{' '}
                    #{selectedInvoice.order?.orderId || 'N/A'}
                  </p>
                  <p>
                    <span className="font-semibold text-brand-muted">Ngày đặt:</span>{' '}
                    {selectedInvoice.order?.orderDate ? new Date(selectedInvoice.order.orderDate).toLocaleString('vi-VN') : 'N/A'}
                  </p>
                  <p>
                    <span className="font-semibold text-brand-muted">Người nhận:</span>{' '}
                    <span className="font-medium text-brand-charcoal">{selectedShippingInfo.fullName || 'N/A'}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-brand-muted">SĐT nhận hàng:</span>{' '}
                    <span className="font-medium text-brand-charcoal">{selectedShippingInfo.phone || 'N/A'}</span>
                  </p>
                  <p>
                    <span className="font-semibold text-brand-muted">Địa chỉ nhận hàng:</span>{' '}
                    <span className="font-medium text-brand-charcoal">
                      {selectedShippingInfo.address || selectedInvoice.order?.shippingAddress || 'Không có dữ liệu từ BE'}
                    </span>
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-gray-50 p-4 border border-black/5">
                <p>
                  <span className="font-semibold text-brand-muted">Phương thức:</span>{' '}
                  {selectedPaymentInfo?.paymentMethod || 'Không có dữ liệu từ BE'}
                </p>
                <p>
                  <span className="font-semibold text-brand-muted">Trạng thái thanh toán:</span>{' '}
                  {getPaymentStatusLabel(selectedPaymentInfo?.paymentStatus, selectedPaymentInfo?.paymentMethod)}
                </p>
                <p>
                  <span className="font-semibold text-brand-muted">Mã thanh toán:</span>{' '}
                  {selectedPaymentInfo?.paymentId ?? 'Không có dữ liệu từ BE'}
                </p>
              </div>

              {/* Items List Table */}
              <div className="space-y-2">
                <h4 className="font-bold text-[10px] uppercase text-brand-muted tracking-wider">
                  Mặt Hàng Đã Mua
                </h4>
                <div className="border border-black/5 overflow-hidden">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-gray-50 border-b border-gray-200 uppercase tracking-wider text-[9px] text-brand-muted">
                        <th className="py-2.5 px-4 text-center font-bold">STT</th>
                        <th className="py-2.5 px-4 font-bold">Tên Sản Phẩm</th>
                        <th className="py-2.5 px-4 text-center font-bold">Số lượng</th>
                        <th className="py-2.5 px-4 text-right font-bold">Đơn giá</th>
                        <th className="py-2.5 px-4 text-right font-bold">Thành tiền</th>
                      </tr>
                    </thead>
                    <tbody>
                      {(selectedInvoice.order?.items || []).map((item, idx) => {
                        const subtotal = ((item.quantity ?? 0) * (item.unitPrice ?? 0)) - (item.discountAmount ?? 0)
                        return (
                          <tr key={item.orderItemId || idx} className="border-b border-gray-100 last:border-0">
                            <td className="py-3 px-4 text-center font-medium text-brand-muted">
                              {idx + 1}
                            </td>
                            <td className="py-3 px-4">
                              <span className="font-bold text-brand-charcoal block">{item.productName}</span>
                              {(item.color || item.size) && (
                                <span className="text-[10px] text-brand-muted block mt-0.5">
                                  Phân loại:{' '}
                                  {[
                                    item.color ? `Màu ${item.color}` : '',
                                    item.size ? `Size ${item.size}` : ''
                                  ].filter(Boolean).join(' / ')}
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-center font-medium">
                              {item.quantity}
                            </td>
                            <td className="py-3 px-4 text-right font-semibold text-brand-muted">
                              {formatVND(item.unitPrice || 0)}
                            </td>
                            <td className="py-3 px-4 text-right font-bold text-brand-charcoal">
                              {formatVND(subtotal)}
                            </td>
                          </tr>
                        )
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* Invoice Totals */}
              <div className="flex justify-end pt-2">
                <div className="w-80 space-y-2 border-t border-gray-100 pt-3">
                  <div className="flex justify-between font-bold text-sm border-t border-brand-charcoal/10 pt-2 text-brand-charcoal">
                    <span>Tổng cộng hóa đơn:</span>
                    <span>{formatVND(selectedInvoice.totalAmount)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="flex justify-end gap-3 border-t border-gray-100 pt-4">
              <button
                onClick={() => setIsModalOpen(false)}
                className="px-5 py-2.5 border border-gray-200 font-semibold hover:bg-gray-50 text-[10px] tracking-widest uppercase rounded-none cursor-pointer"
              >
                Đóng
              </button>
              <button
                onClick={() => handlePrint(selectedInvoice)}
                className="px-6 py-2.5 bg-brand-charcoal hover:bg-brand-dark text-white font-semibold text-[10px] tracking-widest uppercase rounded-none transition-colors duration-200 cursor-pointer"
              >
                In Hóa Đơn
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  )
}
