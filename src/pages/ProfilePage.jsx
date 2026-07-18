import { useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import toast from 'react-hot-toast'
import { Header } from '../components/Header/Header.jsx'
import { Footer } from '../components/Footer/Footer.jsx'
import userApi from '../api/userApi.js'
import { getCurrentUserId } from '../utils/auth.js'

const emptyProfile = { username: '', email: '', firstName: '', lastName: '', phone: '', role: '' }

const normalizeProfile = (profile = {}) => ({
  username: profile.username || '',
  email: profile.email || '',
  firstName: profile.firstName || '',
  lastName: profile.lastName || '',
  phone: profile.phone || '',
  role: profile.role?.name || profile.role || '',
})

export const ProfilePage = () => {
  const navigate = useNavigate()
  const [profile, setProfile] = useState(emptyProfile)
  const [initialProfile, setInitialProfile] = useState(emptyProfile)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const hasLoadedProfile = useRef(false)

  useEffect(() => {
    // React StrictMode chạy effect hai lần ở môi trường dev. Chỉ tải hồ sơ một lần
    // để không tạo request/toast lặp.
    if (hasLoadedProfile.current) return

    const username = localStorage.getItem('username')
    if (!localStorage.getItem('accessToken') || !username) {
      sessionStorage.setItem('authRedirectUrl', '/profile')
      navigate('/auth', { replace: true })
      return
    }

    const loadProfile = async () => {
      hasLoadedProfile.current = true
      try {
        const response = await userApi.getProfile(username)
        const nextProfile = normalizeProfile(response?.data)
        setProfile(nextProfile)
        setInitialProfile(nextProfile)
      } catch (error) {
        toast.error(error.response?.data?.message || 'Không thể tải hồ sơ. Vui lòng thử lại.')
      } finally {
        setLoading(false)
      }
    }

    loadProfile()
  }, [navigate])

  const hasChanges = useMemo(
    () => ['email', 'firstName', 'lastName', 'phone'].some((field) => profile[field] !== initialProfile[field]),
    [profile, initialProfile]
  )

  const handleChange = (event) => {
    const { name, value } = event.target
    setProfile((current) => ({ ...current, [name]: value }))
  }

  const validate = () => {
    const email = profile.email.trim()
    const firstName = profile.firstName.trim()
    const lastName = profile.lastName.trim()
    const phone = profile.phone.trim()

    if (!email || email.length < 6 || email.length > 30 || !/^\S+@\S+\.\S+$/.test(email)) {
      return 'Email phải đúng định dạng và có từ 6 đến 30 ký tự.'
    }
    if (firstName.length < 2 || firstName.length > 150 || lastName.length < 2 || lastName.length > 150) {
      return 'Họ và tên phải có từ 2 đến 150 ký tự.'
    }
    if (initialProfile.phone && !phone) {
      return 'Máy chủ hiện chưa hỗ trợ xóa số điện thoại đã lưu. Vui lòng nhập số mới hợp lệ.'
    }
    if (phone && !/^(0|\+84)\d{9,10}$/.test(phone)) {
      return 'Số điện thoại phải đúng định dạng Việt Nam.'
    }
    return null
  }

  const handleSubmit = async (event) => {
    event.preventDefault()
    if (!hasChanges) {
      toast('Bạn chưa thay đổi thông tin nào.')
      return
    }

    const errorMessage = validate()
    if (errorMessage) {
      toast.error(errorMessage)
      return
    }

    const userId = getCurrentUserId()
    if (!userId) {
      toast.error('Không đọc được định danh phiên đăng nhập. Vui lòng đăng nhập lại.')
      return
    }

    const payload = {}
    ;['email', 'firstName', 'lastName', 'phone'].forEach((field) => {
      const value = profile[field].trim()
      if (value !== initialProfile[field]) payload[field] = value || null
    })

    try {
      setSaving(true)
      const response = await userApi.updateProfile(userId, payload)
      if (response?.success === false) throw new Error(response.message || 'Cập nhật hồ sơ thất bại.')

      const savedProfile = { ...profile, ...payload }
      setProfile(savedProfile)
      setInitialProfile(savedProfile)
      toast.success(response?.message || 'Cập nhật hồ sơ thành công.')
    } catch (error) {
      toast.error(error.response?.data?.message || error.message || 'Không thể cập nhật hồ sơ. Vui lòng thử lại.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="min-h-screen bg-brand-cream">
      <Header />
      <main className="mx-auto max-w-3xl px-4 pb-16 pt-28 sm:px-6 lg:px-8">
        <section className="rounded-2xl border border-gray-100 bg-white p-5 shadow-sm sm:p-8">
          <p className="text-[10px] font-semibold uppercase tracking-[0.2em] text-brand-muted">Tài khoản</p>
          <h1 className="mt-2 font-display text-3xl font-bold text-brand-charcoal">Hồ sơ cá nhân</h1>
          <p className="mt-2 text-sm text-brand-muted">Cập nhật thông tin liên hệ của bạn. Tên đăng nhập và quyền tài khoản do hệ thống quản lý.</p>

          {loading ? (
            <div className="py-16 text-center text-sm text-brand-muted">Đang tải hồ sơ...</div>
          ) : (
            <form className="mt-8 space-y-5" onSubmit={handleSubmit}>
              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-brand-muted">Tên đăng nhập</span>
                  <input value={profile.username} disabled className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-brand-muted" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-brand-muted">Vai trò</span>
                  <input value={profile.role || 'USER'} disabled className="w-full cursor-not-allowed rounded-lg border border-gray-200 bg-gray-50 px-4 py-3 text-sm text-brand-muted" />
                </label>
              </div>

              <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-brand-muted">Họ</span>
                  <input name="lastName" value={profile.lastName} onChange={handleChange} minLength="2" maxLength="150" required className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-brand-charcoal outline-none transition focus:border-brand-charcoal" />
                </label>
                <label className="block">
                  <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-brand-muted">Tên</span>
                  <input name="firstName" value={profile.firstName} onChange={handleChange} minLength="2" maxLength="150" required className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-brand-charcoal outline-none transition focus:border-brand-charcoal" />
                </label>
              </div>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-brand-muted">Email</span>
                <input name="email" type="email" value={profile.email} onChange={handleChange} minLength="6" maxLength="30" required className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-brand-charcoal outline-none transition focus:border-brand-charcoal" />
              </label>

              <label className="block">
                <span className="mb-2 block text-xs font-semibold uppercase tracking-wider text-brand-muted">Số điện thoại</span>
                <input name="phone" type="tel" value={profile.phone} onChange={handleChange} placeholder="0xxxxxxxxx hoặc +84xxxxxxxxx" className="w-full rounded-lg border border-gray-200 px-4 py-3 text-sm text-brand-charcoal outline-none transition focus:border-brand-charcoal" />
              </label>

              <div className="flex flex-col-reverse gap-3 border-t border-gray-100 pt-5 sm:flex-row sm:justify-end">
                <button type="button" onClick={() => setProfile(initialProfile)} disabled={!hasChanges || saving} className="rounded-lg border border-gray-200 px-5 py-3 text-xs font-semibold uppercase tracking-wider text-brand-charcoal disabled:cursor-not-allowed disabled:opacity-50">Hoàn tác</button>
                <button type="submit" disabled={!hasChanges || saving} className="rounded-lg bg-brand-charcoal px-6 py-3 text-xs font-semibold uppercase tracking-wider text-white transition hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-50">{saving ? 'Đang lưu...' : 'Lưu thay đổi'}</button>
              </div>
            </form>
          )}
        </section>
      </main>
      <Footer />
    </div>
  )
}
