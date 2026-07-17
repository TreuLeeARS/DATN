import { useEffect, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Header } from '../components/Header/Header.jsx'
import { Footer } from '../components/Footer/Footer.jsx'
import paymentApi from '../api/paymentApi.js'
import { formatVND } from '../utils/price.js'

const wait = (delay) => new Promise(resolve => window.setTimeout(resolve, delay))

export const PaymentResultPage = () => {
  const [searchParams] = useSearchParams()
  const paymentReference = searchParams.get('orderId')
  const [payment, setPayment] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false

    const verifyPayment = async () => {
      if (!paymentReference) {
        setError('MoMo không trả về mã thanh toán để đối chiếu.')
        setLoading(false)
        return
      }

      try {
        let receivedPayment = false
        for (let attempt = 0; attempt < 5; attempt += 1) {
          const res = await paymentApi.getPaymentStatusByOrderId(paymentReference)
          if (cancelled) return

          if (res?.data) {
            receivedPayment = true
            setPayment(res.data)
            if (res.data.paymentStatus !== 'PENDING') break
          }

          if (attempt < 4) await wait(1500)
        }
        if (!receivedPayment && !cancelled) {
          setError('Máy chủ không trả về dữ liệu thanh toán để đối chiếu.')
        }
      } catch (requestError) {
        if (!cancelled) {
          console.error('Error verifying MoMo payment:', requestError)
          setError(requestError.response?.data?.message || 'Không thể xác minh thanh toán với máy chủ.')
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    verifyPayment()
    return () => { cancelled = true }
  }, [paymentReference])

  const isSuccess = payment?.paymentStatus === 'SUCCESS'
  const isFailed = payment?.paymentStatus === 'FAILED'

  return (
    <>
      <Header />
      <main className="min-h-screen bg-brand-cream px-4 pb-16 pt-32">
        <div className="mx-auto max-w-xl rounded-2xl border border-black/5 bg-white p-8 text-center shadow-xl">
          <div className={`mx-auto mb-5 flex h-16 w-16 items-center justify-center rounded-full text-2xl ${
            isSuccess ? 'bg-green-50 text-green-600' : isFailed ? 'bg-red-50 text-red-600' : 'bg-amber-50 text-amber-700'
          }`}>
            {loading ? '…' : isSuccess ? '✓' : isFailed ? '✕' : '⌛'}
          </div>

          <h1 className="font-display text-2xl font-bold text-brand-charcoal">
            {loading
              ? 'Đang xác minh thanh toán'
              : isSuccess
                ? 'Thanh toán thành công'
                : isFailed
                  ? 'Thanh toán thất bại'
                  : 'Thanh toán đang chờ xác nhận'}
          </h1>

          {error ? (
            <p className="mt-3 text-sm text-red-600">{error}</p>
          ) : payment ? (
            <div className="mt-6 space-y-2 rounded-xl bg-gray-50 p-4 text-left text-sm">
              <p><span className="font-semibold text-brand-muted">Mã đơn hàng:</span> #{payment.orderId}</p>
              <p><span className="font-semibold text-brand-muted">Mã thanh toán:</span> {payment.paymentId}</p>
              <p><span className="font-semibold text-brand-muted">Phương thức:</span> {payment.paymentMethod}</p>
              <p><span className="font-semibold text-brand-muted">Trạng thái:</span> {payment.paymentStatus}</p>
              <p><span className="font-semibold text-brand-muted">Số tiền:</span> {formatVND(payment.amount)}</p>
            </div>
          ) : null}

          <div className="mt-7 flex flex-col justify-center gap-3 sm:flex-row">
            <Link to="/my-orders" className="bg-brand-charcoal px-5 py-3 text-xs font-semibold uppercase tracking-wider text-white">
              Xem đơn hàng
            </Link>
            <Link to="/" className="border border-brand-charcoal px-5 py-3 text-xs font-semibold uppercase tracking-wider text-brand-charcoal">
              Về trang chủ
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </>
  )
}
