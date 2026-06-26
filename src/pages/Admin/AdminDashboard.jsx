import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import categoryApi from '../../api/categoryApi'

export const AdminDashboard = () => {
  const [stats, setStats] = useState({
    total: 0,
    active: 0,
    inactive: 0
  })
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchStats = async () => {
      try {
        setLoading(true)
        const response = await categoryApi.getAllCategoriesForAdmin()
        if (response && response.data) {
          const list = response.data
          const total = list.length
          const active = list.filter(item => item.isActive).length
          const inactive = list.filter(item => !item.isActive).length
          
          setStats({ total, active, inactive })
        }
      } catch (err) {
        console.error('Error fetching dashboard stats:', err)
        setError('Không thể tải dữ liệu thống kê từ máy chủ.')
      } finally {
        setLoading(false)
      }
    }

    fetchStats()
  }, [])

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-charcoal to-[#3d3d3d] text-white p-8 rounded-2xl shadow-md relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-10 flex items-center justify-center">
          <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
          </svg>
        </div>
        <div className="relative z-10 space-y-2">
          <h2 className="text-2xl sm:text-3xl font-display font-semibold">
            Chào mừng trở lại, <span className="text-brand-blush">Quản trị viên</span>!
          </h2>
          <p className="text-sm text-gray-300 max-w-xl">
            Hệ thống quản trị cửa hàng OUTTA. Sử dụng các công cụ điều hướng bên trái để quản lý danh mục sản phẩm, theo dõi trạng thái hoạt động của các danh mục và đồng bộ tức thời với ứng dụng mua sắm của khách hàng.
          </p>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map(n => (
            <div key={n} className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-pulse h-36 flex flex-col justify-between">
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
              <div className="h-8 bg-gray-200 rounded w-1/3"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-xl flex items-center space-x-2">
          <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-sm">{error}</span>
        </div>
      ) : (
        /* Statistical Metric Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Card 1: Total Categories */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-sm text-brand-muted font-medium">Tổng số danh mục</span>
              <h3 className="text-3xl font-bold text-brand-charcoal font-sans">{stats.total}</h3>
            </div>
            <div className="p-4 rounded-xl bg-indigo-50 text-indigo-600 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M8 7v8a2 2 0 002 2h6M8 7V5a2 2 0 012-2h4a2 2 0 012 2v2M8 7H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-2" />
              </svg>
            </div>
          </div>

          {/* Card 2: Active Categories */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-sm text-brand-muted font-medium">Đang hoạt động</span>
              <h3 className="text-3xl font-bold text-green-600 font-sans">{stats.active}</h3>
            </div>
            <div className="p-4 rounded-xl bg-green-50 text-green-600 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          {/* Card 3: Inactive Categories */}
          <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 hover:shadow-md transition-all duration-300 group flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-sm text-brand-muted font-medium">Đã ẩn (Xóa mềm)</span>
              <h3 className="text-3xl font-bold text-amber-500 font-sans">{stats.inactive}</h3>
            </div>
            <div className="p-4 rounded-xl bg-amber-50 text-amber-600 group-hover:scale-110 transition-transform">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Shortcuts */}
      <div className="bg-white p-8 rounded-2xl shadow-sm border border-gray-100 space-y-6">
        <h3 className="text-lg font-semibold text-brand-charcoal tracking-wide">Lối tắt quản trị nhanh</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/admin/categories"
            className="p-5 border border-gray-100 rounded-xl hover:border-brand-blush hover:bg-brand-cream/20 transition-all flex items-center space-x-4 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-brand-cream flex items-center justify-center text-brand-charcoal group-hover:bg-brand-blush transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm group-hover:text-brand-charcoal transition-colors">Danh mục sản phẩm</p>
              <p className="text-xs text-brand-muted mt-0.5">Thêm, sửa, xóa danh mục</p>
            </div>
          </Link>

          <Link
            to="/"
            className="p-5 border border-gray-100 rounded-xl hover:border-brand-blush hover:bg-brand-cream/20 transition-all flex items-center space-x-4 cursor-pointer group"
          >
            <div className="w-12 h-12 rounded-xl bg-brand-cream flex items-center justify-center text-brand-charcoal group-hover:bg-brand-blush transition-colors">
              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-sm group-hover:text-brand-charcoal transition-colors">Xem Cửa hàng</p>
              <p className="text-xs text-brand-muted mt-0.5">Quay lại trang khách hàng</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
