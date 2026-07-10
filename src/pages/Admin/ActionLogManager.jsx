import { useState, useEffect } from 'react'
import toast from 'react-hot-toast'
import actionLogApi from '../../api/actionLogApi.js'

export const ActionLogManager = () => {
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(1)
  const [totalElements, setTotalElements] = useState(0)

  // Local client-side filters for current page
  const [usernameFilter, setUsernameFilter] = useState('')
  const [actionTypeFilter, setActionTypeFilter] = useState('ALL')

  const fetchLogs = async () => {
    try {
      setLoading(true)
      const res = await actionLogApi.getLogs({
        page: page,
        size: 20
      })
      if (res && res.data) {
        setLogs(res.content || res.data.content || [])
        setTotalPages(res.totalPages || res.data.totalPages || 1)
        setTotalElements(res.totalElements || res.data.totalElements || 0)
      }
    } catch (err) {
      console.error('Error fetching action logs:', err)
      toast.error('Không thể tải nhật ký hoạt động từ máy chủ.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchLogs()
  }, [page])

  // Apply local filter on the fetched page contents for additional UX
  const filteredLogs = logs.filter(log => {
    const matchesUser = usernameFilter.trim()
      ? log.username?.toLowerCase().includes(usernameFilter.trim().toLowerCase())
      : true
    const matchesType = actionTypeFilter !== 'ALL'
      ? log.actionType === actionTypeFilter
      : true
    return matchesUser && matchesType
  })

  // Badge styles helper
  const getActionBadge = (type) => {
    switch (type) {
      case 'CONFIRM_ORDER':
        return <span className="inline-block px-2.5 py-0.5 text-[8.5px] font-bold bg-green-50 text-green-700 border border-green-200 uppercase tracking-wider">Xác nhận</span>
      case 'CANCEL_ORDER':
        return <span className="inline-block px-2.5 py-0.5 text-[8.5px] font-bold bg-red-50 text-red-600 border border-red-200 uppercase tracking-wider">Hủy đơn</span>
      case 'SHIPPING_ORDER':
        return <span className="inline-block px-2.5 py-0.5 text-[8.5px] font-bold bg-blue-50 text-blue-600 border border-blue-200 uppercase tracking-wider">Giao hàng</span>
      case 'DELIVERED_ORDER':
        return <span className="inline-block px-2.5 py-0.5 text-[8.5px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200 uppercase tracking-wider">Đã giao</span>
      case 'CREATE_ORDER':
        return <span className="inline-block px-2.5 py-0.5 text-[8.5px] font-bold bg-amber-50 text-amber-700 border border-amber-200 uppercase tracking-wider">Tạo đơn</span>
      case 'UPDATE_ORDER':
        return <span className="inline-block px-2.5 py-0.5 text-[8.5px] font-bold bg-purple-50 text-purple-600 border border-purple-200 uppercase tracking-wider">Cập nhật</span>
      case 'DELETE_ORDER':
        return <span className="inline-block px-2.5 py-0.5 text-[8.5px] font-bold bg-red-100 text-red-800 border border-red-300 uppercase tracking-wider">Xóa đơn</span>
      default:
        return <span className="inline-block px-2.5 py-0.5 text-[8.5px] font-bold bg-gray-50 text-gray-500 border border-gray-200 uppercase tracking-wider">{type}</span>
    }
  }

  return (
    <div className="space-y-8 animate-fade-in font-sans pb-16">
      {/* HEADER BAR */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 border border-black/10 shadow-sm">
        <div>
          <h2 className="text-sm font-bold uppercase tracking-widest text-brand-charcoal">
            Nhật ký hoạt động hệ thống (Action Logs)
          </h2>
          <p className="text-[10px] text-brand-muted tracking-wider uppercase mt-1">
            Tổng số thao tác đã ghi nhận qua AOP: <span className="font-bold text-brand-charcoal">{totalElements}</span>
          </p>
        </div>
        <button
          onClick={fetchLogs}
          className="px-4 py-2 border border-gray-200 hover:bg-gray-50 text-[9.5px] font-bold uppercase tracking-wider transition-colors cursor-pointer"
        >
          Làm mới log
        </button>
      </div>

      {/* SEARCH / FILTERS ROW */}
      <div className="bg-white p-5 border border-black/10 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase text-brand-muted tracking-wider">Tìm theo tài khoản</label>
            <input
              type="text"
              placeholder="Nhập tên tài khoản (username)..."
              value={usernameFilter}
              onChange={(e) => setUsernameFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-brand-charcoal text-xs rounded-none"
            />
          </div>
          <div className="space-y-1">
            <label className="block text-[10px] font-bold uppercase text-brand-muted tracking-wider">Lọc theo hành động</label>
            <select
              value={actionTypeFilter}
              onChange={(e) => setActionTypeFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 focus:outline-none focus:border-brand-charcoal text-xs rounded-none bg-white font-sans"
            >
              <option value="ALL">Tất cả hành động</option>
              <option value="CREATE_ORDER">CREATE_ORDER (Tạo đơn hàng)</option>
              <option value="CONFIRM_ORDER">CONFIRM_ORDER (Xác nhận đơn)</option>
              <option value="SHIPPING_ORDER">SHIPPING_ORDER (Giao hàng)</option>
              <option value="DELIVERED_ORDER">DELIVERED_ORDER (Đã giao hàng)</option>
              <option value="CANCEL_ORDER">CANCEL_ORDER (Hủy đơn hàng)</option>
              <option value="UPDATE_ORDER">UPDATE_ORDER (Cập nhật đơn)</option>
              <option value="DELETE_ORDER">DELETE_ORDER (Xóa đơn hàng)</option>
            </select>
          </div>
        </div>
      </div>

      {/* LOGS LIST TABLE */}
      <div className="bg-white border border-black/10 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-brand-charcoal text-white uppercase tracking-wider text-[10px] border-b border-brand-charcoal">
                <th className="py-4 px-6 text-center font-bold" style={{ width: '80px' }}>ID Log</th>
                <th className="py-4 px-6 font-bold" style={{ width: '180px' }}>Thời Gian</th>
                <th className="py-4 px-6 font-bold" style={{ width: '150px' }}>Tài Khoản</th>
                <th className="py-4 px-6 text-center font-bold" style={{ width: '130px' }}>Hành Động</th>
                <th className="py-4 px-6 font-bold">Nội Dung Chi Tiết (AOP Audit Description)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-brand-muted tracking-widest uppercase font-semibold text-[10px]">
                    Đang tải nhật ký hệ thống...
                  </td>
                </tr>
              ) : filteredLogs.length === 0 ? (
                <tr>
                  <td colSpan="5" className="py-12 text-center text-brand-muted tracking-widest uppercase font-semibold text-[10px]">
                    Không tìm thấy thao tác ghi nhận nào phù hợp.
                  </td>
                </tr>
              ) : (
                filteredLogs.map((log) => (
                  <tr key={log.id} className="border-b border-gray-100 hover:bg-gray-50/50 transition-colors">
                    <td className="py-4 px-6 text-center font-semibold text-brand-charcoal">
                      #{log.id}
                    </td>
                    <td className="py-4 px-6 text-brand-muted font-medium">
                      {log.createdAt ? new Date(log.createdAt).toLocaleString('vi-VN') : 'N/A'}
                    </td>
                    <td className="py-4 px-6 font-semibold text-brand-charcoal">
                      {log.username}
                    </td>
                    <td className="py-4 px-6 text-center">
                      {getActionBadge(log.actionType)}
                    </td>
                    <td className="py-4 px-6 font-medium text-brand-charcoal/80 break-words max-w-[300px]">
                      {log.description}
                    </td>
                  </tr>
                ))
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
    </div>
  )
}
