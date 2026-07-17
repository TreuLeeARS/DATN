import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import dashboardApi from '../../api/dashboardApi'
import { isStaff } from '../../utils/auth.js'

const formatLocalDate = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

export const AdminDashboard = () => {
  const userIsStaff = isStaff()
  const [summary, setSummary] = useState({
    totalOrders: 0,
    deliveredOrders: 0,
    totalRevenue: 0
  })
  const [bestSellers, setBestSellers] = useState([])
  const [revenueDaily, setRevenueDaily] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true)
        
        // Tính toán khoảng thời gian
        const today = new Date()
        const toStr = formatLocalDate(today)
        
        const thirtyDaysAgo = new Date()
        thirtyDaysAgo.setDate(today.getDate() - 29)
        const fromStr30 = formatLocalDate(thirtyDaysAgo)

        const sevenDaysAgo = new Date()
        sevenDaysAgo.setDate(today.getDate() - 6)
        const fromStr7 = formatLocalDate(sevenDaysAgo)

        // Một API thống kê lỗi không làm mất toàn bộ dữ liệu của các API còn lại.
        const [summaryResult, bestSellersResult, revenueResult] = await Promise.allSettled([
          dashboardApi.getSummary(),
          dashboardApi.getBestSellers(fromStr30, toStr, 5),
          dashboardApi.getRevenueDaily(fromStr7, toStr)
        ])

        if (summaryResult.status === 'fulfilled' && summaryResult.value?.data) {
          setSummary(summaryResult.value.data)
        }
        if (bestSellersResult.status === 'fulfilled' && bestSellersResult.value?.data) {
          setBestSellers(bestSellersResult.value.data)
        }
        if (revenueResult.status === 'fulfilled' && revenueResult.value?.data) {
          setRevenueDaily(revenueResult.value.data)
        }

        const failedResults = [summaryResult, bestSellersResult, revenueResult]
          .filter(result => result.status === 'rejected')
        if (failedResults.length === 3) {
          throw failedResults[0].reason
        }
        if (failedResults.length > 0) {
          console.warn('Some dashboard APIs failed:', failedResults.map(result => result.reason))
        }
      } catch (err) {
        console.error('Error fetching dashboard data:', err)
        setError('Không thể kết nối đến API thống kê của máy chủ Backend.')
      } finally {
        setLoading(false)
      }
    }

    fetchData()
  }, [])

  const formatPrice = (value) => {
    if (value === null || value === undefined) return '0 đ'
    return new Intl.NumberFormat('vi-VN', { style: 'currency', currency: 'VND' }).format(value)
  }

  // Tính tỷ lệ hoàn thành đơn hàng
  const completionRate = summary.totalOrders > 0 
    ? ((summary.deliveredOrders / summary.totalOrders) * 100).toFixed(1)
    : '0.0'

  // Tính toán vẽ SVG chart cho Doanh thu 7 ngày
  const getChartPoints = () => {
    if (revenueDaily.length === 0) return ''
    const maxVal = Math.max(...revenueDaily.map(d => Number(d.revenue) || 0), 100000)
    const width = 600
    const height = 150
    const padding = 20
    const usableWidth = width - padding * 2
    const usableHeight = height - padding * 2

    return revenueDaily.map((d, index) => {
      const x = revenueDaily.length === 1
        ? width / 2
        : padding + (index / (revenueDaily.length - 1)) * usableWidth
      const y = height - padding - ((Number(d.revenue) || 0) / maxVal) * usableHeight
      return `${x},${y}`
    }).join(' ')
  }

  return (
    <div className="space-y-8 animate-slide-up">
      {/* Welcome Banner */}
      <div className="bg-gradient-to-r from-brand-charcoal to-[#1a1a1a] text-white p-8 rounded-none border border-black/5 relative overflow-hidden">
        <div className="absolute right-0 bottom-0 top-0 w-1/3 opacity-5 flex items-center justify-center">
          <svg className="w-48 h-48" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 15h-2v-6h2v6zm0-8h-2V7h2v2z" />
          </svg>
        </div>
        <div className="relative z-10 space-y-2">
          <h2 className="text-xl sm:text-2xl font-display font-semibold uppercase tracking-[0.15em]">
            Hệ thống Quản trị OUTTA
          </h2>
          <p className="text-xs text-gray-400 max-w-xl tracking-wider leading-relaxed">
            Dữ liệu thống kê doanh số bán hàng, hiệu suất giỏ hàng, thông tin thanh toán được đồng bộ trực tiếp từ cơ sở dữ liệu thời gian thực.
          </p>
        </div>
      </div>

      {/* Loading state */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          {[1, 2, 3, 4].map(n => (
            <div key={n} className="bg-white p-6 rounded-none border border-black/5 animate-pulse h-32 flex flex-col justify-between">
              <div className="h-3 bg-gray-200 rounded w-1/2"></div>
              <div className="h-6 bg-gray-200 rounded w-2/3"></div>
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="bg-red-50/50 border border-red-200 text-red-800 px-4 py-3 rounded-none flex items-center space-x-2">
          <svg className="w-5 h-5 shrink-0 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <span className="text-xs tracking-wider font-medium">{error}</span>
        </div>
      ) : (
        /* Statistical Metric Cards */
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Card 1: Revenue */}
          <div className="bg-white p-6 rounded-none border border-black/5 hover:border-black/20 transition-all duration-300 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-brand-muted font-semibold uppercase tracking-wider block">Doanh thu tích lũy</span>
              <h3 className="text-xl font-bold text-brand-charcoal font-sans">{formatPrice(summary.totalRevenue)}</h3>
            </div>
            <div className="p-3 bg-black/5 text-brand-charcoal">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          {/* Card 2: Total Orders */}
          <div className="bg-white p-6 rounded-none border border-black/5 hover:border-black/20 transition-all duration-300 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-brand-muted font-semibold uppercase tracking-wider block">Tổng số đơn hàng</span>
              <h3 className="text-xl font-bold text-brand-charcoal font-sans">{summary.totalOrders} đơn</h3>
            </div>
            <div className="p-3 bg-black/5 text-brand-charcoal">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
            </div>
          </div>

          {/* Card 3: Delivered Orders */}
          <div className="bg-white p-6 rounded-none border border-black/5 hover:border-black/20 transition-all duration-300 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-brand-muted font-semibold uppercase tracking-wider block">Đơn giao thành công</span>
              <h3 className="text-xl font-bold text-green-700 font-sans">{summary.deliveredOrders} đơn</h3>
            </div>
            <div className="p-3 bg-green-50 text-green-700">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>

          {/* Card 4: Completion Rate */}
          <div className="bg-white p-6 rounded-none border border-black/5 hover:border-black/20 transition-all duration-300 flex items-center justify-between">
            <div className="space-y-1">
              <span className="text-[10px] text-brand-muted font-semibold uppercase tracking-wider block">Tỷ lệ hoàn thành</span>
              <h3 className="text-xl font-bold text-blue-700 font-sans">{completionRate}%</h3>
            </div>
            <div className="p-3 bg-blue-50 text-blue-700">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
          </div>
        </div>
      )}

      {/* Analytics Charts & Table */}
      {!loading && !error && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Daily Revenue SVG Chart */}
          <div className="lg:col-span-2 bg-white p-6 rounded-none border border-black/5 flex flex-col justify-between">
            <div className="mb-4">
              <h3 className="text-xs font-bold text-brand-charcoal uppercase tracking-[0.15em]">Doanh thu 7 ngày qua</h3>
              <p className="text-[10px] text-brand-muted uppercase tracking-wider mt-0.5">Biểu diễn biến động doanh số thực tế</p>
            </div>
            {revenueDaily.length > 0 ? (
              <div className="relative pt-2">
                <svg viewBox="0 0 600 150" className="w-full h-auto overflow-visible">
                  {/* Grid Lines */}
                  <line x1="20" y1="20" x2="580" y2="20" stroke="#f3f4f6" strokeWidth="1" />
                  <line x1="20" y1="75" x2="580" y2="75" stroke="#f3f4f6" strokeWidth="1" />
                  <line x1="20" y1="130" x2="580" y2="130" stroke="#e5e7eb" strokeWidth="1" />
                  
                  {/* Revenue Line */}
                  <polyline
                    fill="none"
                    stroke="#1a1a1a"
                    strokeWidth="1.5"
                    points={getChartPoints()}
                  />
                  
                  {/* Dots on line */}
                  {revenueDaily.map((d, index) => {
                    const maxVal = Math.max(...revenueDaily.map(item => Number(item.revenue) || 0), 100000)
                    const x = revenueDaily.length === 1
                      ? 300
                      : 20 + (index / (revenueDaily.length - 1)) * 560
                    const y = 150 - 20 - ((Number(d.revenue) || 0) / maxVal) * 110
                    return (
                      <g key={d.period} className="group/dot cursor-pointer">
                        <circle
                          cx={x}
                          cy={y}
                          r="3"
                          fill="#1a1a1a"
                          className="hover:r-5 transition-all"
                        />
                        <title>{`${d.period}: ${formatPrice(d.revenue)}`}</title>
                      </g>
                    )
                  })}
                </svg>
                {/* Labels */}
                <div className="flex justify-between text-[8px] tracking-widest text-brand-muted uppercase mt-2 px-3">
                  {revenueDaily.map(d => (
                    <span key={d.period}>{d.period.split('-').slice(1).reverse().join('/')}</span>
                  ))}
                </div>
              </div>
            ) : (
              <div className="h-32 flex items-center justify-center border border-dashed border-gray-200">
                <span className="text-xs text-brand-muted uppercase tracking-wider">Chưa có dữ liệu doanh thu</span>
              </div>
            )}
          </div>

          {/* Top Selling Products List */}
          <div className="bg-white p-6 rounded-none border border-black/5 flex flex-col justify-between">
            <div>
              <h3 className="text-xs font-bold text-brand-charcoal uppercase tracking-[0.15em] mb-4">Sản phẩm bán chạy nhất</h3>
              {bestSellers.length > 0 ? (
                <div className="space-y-4">
                  {bestSellers.map((item, index) => (
                    <div key={item.productVariantId || index} className="flex items-center justify-between pb-3 border-b border-gray-100 last:border-0 last:pb-0">
                      <div className="min-w-0 pr-2">
                        <p className="text-xs font-semibold text-brand-charcoal truncate">{item.productName}</p>
                        <p className="text-[9px] text-brand-muted uppercase tracking-wider mt-0.5">
                          SKU: {item.sku} | Size: {item.size} - Màu: {item.color}
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs font-bold text-brand-charcoal">{item.quantitySold} cái</p>
                        <p className="text-[9px] text-brand-muted uppercase mt-0.5">{formatPrice(item.revenue)}</p>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="h-full flex items-center justify-center py-10 border border-dashed border-gray-200">
                  <span className="text-xs text-brand-muted uppercase tracking-wider">Chưa có thông tin bán chạy</span>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Quick Action Shortcuts */}
      <div className="bg-white p-8 rounded-none border border-black/5 space-y-6">
        <h3 className="text-xs font-bold text-brand-charcoal uppercase tracking-[0.15em]">
          {userIsStaff ? 'Lối tắt công việc' : 'Lối tắt quản trị nhanh'}
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          <Link
            to="/admin/categories"
            className="p-5 border border-gray-100 rounded-none hover:border-black/35 hover:bg-brand-cream/10 transition-all flex items-center space-x-4 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-none bg-black/5 flex items-center justify-center text-brand-charcoal group-hover:bg-black group-hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 10h16M4 14h16M4 18h16" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-xs uppercase tracking-wider group-hover:text-black transition-colors">Danh mục sản phẩm</p>
              <p className="text-[10px] text-brand-muted mt-0.5">
                {userIsStaff ? 'Xem và cập nhật danh mục' : 'Thêm, sửa, xóa danh mục'}
              </p>
            </div>
          </Link>

          <Link
            to="/"
            className="p-5 border border-gray-100 rounded-none hover:border-black/35 hover:bg-brand-cream/10 transition-all flex items-center space-x-4 cursor-pointer group"
          >
            <div className="w-10 h-10 rounded-none bg-black/5 flex items-center justify-center text-brand-charcoal group-hover:bg-black group-hover:text-white transition-colors">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
              </svg>
            </div>
            <div>
              <p className="font-semibold text-xs uppercase tracking-wider group-hover:text-black transition-colors">Xem Cửa hàng</p>
              <p className="text-[10px] text-brand-muted mt-0.5">Quay lại trang khách hàng</p>
            </div>
          </Link>
        </div>
      </div>
    </div>
  )
}
