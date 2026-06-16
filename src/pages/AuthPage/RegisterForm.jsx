import { useState, useEffect, useRef } from 'react'
import gsap from 'gsap'
import { SocialLogin } from './SocialLogin.jsx'
import authApi from '../../api/authApi'

// ─── SVG Icons ───
const EyeIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
  </svg>
)

const EyeOffIcon = () => (
  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
  </svg>
)

const CheckIcon = () => (
  <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
  </svg>
)

// ─── Password Strength Calculator ───
const getPasswordStrength = (password) => {
  if (!password) return 0
  let score = 0
  if (password.length >= 8) score++
  if (/[A-Z]/.test(password)) score++
  if (/[a-z]/.test(password)) score++
  if (/\d/.test(password)) score++
  if (/[!@#$%^&*(),.?":{}|<>]/.test(password)) score++
  return score
}

const strengthConfig = [
  { label: '', color: '#e5e7eb', width: '0%' },
  { label: 'Rất yếu', color: '#ef4444', width: '20%' },
  { label: 'Yếu', color: '#f97316', width: '40%' },
  { label: 'Trung bình', color: '#eab308', width: '60%' },
  { label: 'Khá', color: '#84cc16', width: '80%' },
  { label: 'Mạnh', color: '#22c55e', width: '100%' },
]

// ─── Password Strength Bar Component ───
const PasswordStrength = ({ password }) => {
  const barRef = useRef(null)
  const strength = getPasswordStrength(password)
  const config = strengthConfig[strength]

  // Animate strength bar with GSAP
  useEffect(() => {
    if (!barRef.current) return
    gsap.to(barRef.current, {
      width: config.width,
      backgroundColor: config.color,
      duration: 0.5,
      ease: 'power2.out',
    })
  }, [strength, config.width, config.color])

  if (!password) return null

  return (
    <div className="mt-3">
      {/* Bar */}
      <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          ref={barRef}
          className="h-full rounded-full"
          style={{ width: '0%', backgroundColor: '#e5e7eb' }}
        />
      </div>
      {/* Label + checks */}
      <div className="flex items-center justify-between mt-2">
        <span className="text-xs font-medium" style={{ color: config.color }}>
          {config.label}
        </span>
        <div className="flex gap-3 text-xs text-brand-muted">
          <span className={password.length >= 8 ? 'text-green-500' : ''}>
            {password.length >= 8 ? '✓' : '○'} 8+ ký tự
          </span>
          <span className={/[A-Z]/.test(password) ? 'text-green-500' : ''}>
            {/[A-Z]/.test(password) ? '✓' : '○'} Chữ hoa
          </span>
          <span className={/\d/.test(password) ? 'text-green-500' : ''}>
            {/\d/.test(password) ? '✓' : '○'} Số
          </span>
        </div>
      </div>
    </div>
  )
}

// ─── Register Form Component ───
export const RegisterForm = ({ onSwitchTab }) => {
  const [form, setForm] = useState({
    name: '',
    username: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
    agreeTerms: false,
  })
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirmPassword, setShowConfirmPassword] = useState(false)
  const [errors, setErrors] = useState({})
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [apiError, setApiError] = useState('')
  const [apiSuccess, setApiSuccess] = useState('')

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target
    setForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value,
    }))
    if (errors[name]) {
      setErrors(prev => ({ ...prev, [name]: '' }))
    }
  }

  const validate = () => {
    const newErrors = {}

    if (!form.name.trim()) {
      newErrors.name = 'Vui lòng nhập họ và tên'
    }

    if (!form.username.trim()) {
      newErrors.username = 'Vui lòng nhập tên đăng nhập'
    } else if (form.username.length < 6 || form.username.length > 30) {
      newErrors.username = 'Tên đăng nhập phải từ 6 đến 30 ký tự'
    }

    if (!form.email) {
      newErrors.email = 'Vui lòng nhập email'
    } else if (!/\S+@\S+\.\S+/.test(form.email)) {
      newErrors.email = 'Email không hợp lệ'
    }

    if (!form.phone) {
      newErrors.phone = 'Vui lòng nhập số điện thoại'
    } else if (!/^(0|\+84)[0-9]{9}$/.test(form.phone.replace(/\s/g, ''))) {
      newErrors.phone = 'Số điện thoại không hợp lệ'
    }

    if (!form.password) {
      newErrors.password = 'Vui lòng nhập mật khẩu'
    } else if (form.password.length < 8 || form.password.length > 20) {
      newErrors.password = 'Mật khẩu phải từ 8 đến 20 ký tự'
    } else if (!/^(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/.test(form.password)) {
      newErrors.password = 'Mật khẩu phải có ít nhất 1 chữ hoa, 1 chữ thường và 1 số'
    }

    if (!form.confirmPassword) {
      newErrors.confirmPassword = 'Vui lòng xác nhận mật khẩu'
    } else if (form.confirmPassword !== form.password) {
      newErrors.confirmPassword = 'Mật khẩu xác nhận không khớp'
    }

    if (!form.agreeTerms) {
      newErrors.agreeTerms = 'Bạn cần đồng ý với điều khoản dịch vụ'
    }

    setErrors(newErrors)
    return Object.keys(newErrors).length === 0
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!validate()) return

    setIsSubmitting(true)
    setApiError('')
    setApiSuccess('')

    try {
      // Phân tách Họ & Tên
      const nameParts = form.name.trim().split(/\s+/);
      const firstName = nameParts.pop() || '';
      const lastName = nameParts.join(' ') || '';

      const payload = {
        username: form.username.trim(),
        firstName: firstName,
        lastName: lastName,
        email: form.email,
        phone: form.phone,
        password: form.password,
      }
      
      const response = await authApi.register(payload)
      
      setApiSuccess(response.message || 'Đăng ký tài khoản thành công! Đang chuyển hướng sang Đăng nhập...')
      
      // Reset form sau khi đăng ký thành công
      setForm({
        name: '',
        username: '',
        email: '',
        phone: '',
        password: '',
        confirmPassword: '',
        agreeTerms: false,
      })

      // Tự động chuyển qua tab Đăng nhập sau 2 giây
      setTimeout(() => {
        onSwitchTab()
      }, 2000)

    } catch (error) {
      console.error('Lỗi đăng ký:', error)
      let message = 'Đăng ký thất bại. Vui lòng kiểm tra lại thông tin!'
      if (error.response?.data?.message) {
        message = error.response.data.message
      } else if (error.message === 'Network Error') {
        message = 'Không thể kết nối đến máy chủ. Vui lòng kiểm tra kết nối mạng hoặc máy chủ BE!'
      } else if (error.message && error.message.includes('timeout')) {
        message = 'Kết nối quá hạn. Vui lòng kiểm tra lại đường truyền!'
      } else if (error.message) {
        message = error.message
      }
      setApiError(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <form onSubmit={handleSubmit} noValidate>
      {/* Thông báo lỗi từ API */}
      {apiError && (
        <div className="mb-6 text-sm text-red-500 font-medium p-3 bg-red-50 rounded-lg border border-red-200 animate-slide-up">
          {apiError}
        </div>
      )}

      {/* Thông báo thành công từ API */}
      {apiSuccess && (
        <div className="mb-6 text-sm text-green-600 font-medium p-3 bg-green-50 rounded-lg border border-green-200 animate-slide-up">
          {apiSuccess}
        </div>
      )}
      {/* ─── Full Name ─── */}
      <div className="auth-form-field relative mb-7">
        <input
          type="text"
          name="name"
          id="register-name"
          value={form.name}
          onChange={handleChange}
          className="floating-input w-full bg-transparent border-b-2 border-gray-200 px-0 py-3
                     text-brand-charcoal focus:outline-none transition-colors duration-300 font-sans"
          placeholder=" "
          autoComplete="name"
        />
        <label htmlFor="register-name" className="floating-label">
          Họ và tên
        </label>
        <span className="floating-line" />
        {errors.name && (
          <p className="text-red-400 text-xs mt-2 animate-slide-up">{errors.name}</p>
        )}
      </div>

      {/* ─── Username ─── */}
      <div className="auth-form-field relative mb-7">
        <input
          type="text"
          name="username"
          id="register-username"
          value={form.username}
          onChange={handleChange}
          className="floating-input w-full bg-transparent border-b-2 border-gray-200 px-0 py-3
                     text-brand-charcoal focus:outline-none transition-colors duration-300 font-sans"
          placeholder=" "
          autoComplete="username"
        />
        <label htmlFor="register-username" className="floating-label">
          Tên đăng nhập
        </label>
        <span className="floating-line" />
        {errors.username && (
          <p className="text-red-400 text-xs mt-2 animate-slide-up">{errors.username}</p>
        )}
      </div>

      {/* ─── Email ─── */}
      <div className="auth-form-field relative mb-7">
        <input
          type="email"
          name="email"
          id="register-email"
          value={form.email}
          onChange={handleChange}
          className="floating-input w-full bg-transparent border-b-2 border-gray-200 px-0 py-3
                     text-brand-charcoal focus:outline-none transition-colors duration-300 font-sans"
          placeholder=" "
          autoComplete="email"
        />
        <label htmlFor="register-email" className="floating-label">
          Email
        </label>
        <span className="floating-line" />
        {errors.email && (
          <p className="text-red-400 text-xs mt-2 animate-slide-up">{errors.email}</p>
        )}
      </div>

      {/* ─── Phone ─── */}
      <div className="auth-form-field relative mb-7">
        <input
          type="tel"
          name="phone"
          id="register-phone"
          value={form.phone}
          onChange={handleChange}
          className="floating-input w-full bg-transparent border-b-2 border-gray-200 px-0 py-3
                     text-brand-charcoal focus:outline-none transition-colors duration-300 font-sans"
          placeholder=" "
          autoComplete="tel"
        />
        <label htmlFor="register-phone" className="floating-label">
          Số điện thoại
        </label>
        <span className="floating-line" />
        {errors.phone && (
          <p className="text-red-400 text-xs mt-2 animate-slide-up">{errors.phone}</p>
        )}
      </div>

      {/* ─── Password ─── */}
      <div className="auth-form-field relative mb-2">
        <input
          type={showPassword ? 'text' : 'password'}
          name="password"
          id="register-password"
          value={form.password}
          onChange={handleChange}
          className="floating-input w-full bg-transparent border-b-2 border-gray-200 px-0 py-3 pr-10
                     text-brand-charcoal focus:outline-none transition-colors duration-300 font-sans"
          placeholder=" "
          autoComplete="new-password"
        />
        <label htmlFor="register-password" className="floating-label">
          Mật khẩu
        </label>
        <button
          type="button"
          onClick={() => setShowPassword(!showPassword)}
          className="absolute right-0 top-3 text-brand-muted hover:text-brand-charcoal transition-colors duration-200"
          aria-label={showPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        >
          {showPassword ? <EyeOffIcon /> : <EyeIcon />}
        </button>
        <span className="floating-line" />
        {errors.password && (
          <p className="text-red-400 text-xs mt-2 animate-slide-up">{errors.password}</p>
        )}
      </div>

      {/* ─── Password Strength (GSAP animated) ─── */}
      <div className="auth-form-field mb-7">
        <PasswordStrength password={form.password} />
      </div>

      {/* ─── Confirm Password ─── */}
      <div className="auth-form-field relative mb-7">
        <input
          type={showConfirmPassword ? 'text' : 'password'}
          name="confirmPassword"
          id="register-confirm-password"
          value={form.confirmPassword}
          onChange={handleChange}
          className="floating-input w-full bg-transparent border-b-2 border-gray-200 px-0 py-3 pr-10
                     text-brand-charcoal focus:outline-none transition-colors duration-300 font-sans"
          placeholder=" "
          autoComplete="new-password"
        />
        <label htmlFor="register-confirm-password" className="floating-label">
          Xác nhận mật khẩu
        </label>
        <button
          type="button"
          onClick={() => setShowConfirmPassword(!showConfirmPassword)}
          className="absolute right-0 top-3 text-brand-muted hover:text-brand-charcoal transition-colors duration-200"
          aria-label={showConfirmPassword ? 'Ẩn mật khẩu' : 'Hiện mật khẩu'}
        >
          {showConfirmPassword ? <EyeOffIcon /> : <EyeIcon />}
        </button>
        <span className="floating-line" />
        {errors.confirmPassword && (
          <p className="text-red-400 text-xs mt-2 animate-slide-up">{errors.confirmPassword}</p>
        )}
      </div>

      {/* ─── Terms & Conditions ─── */}
      <div className="auth-form-field mb-8">
        <label className="flex items-start gap-3 cursor-pointer group">
          <div className="relative mt-0.5">
            <input
              type="checkbox"
              name="agreeTerms"
              checked={form.agreeTerms}
              onChange={handleChange}
              className="sr-only"
            />
            <div
              className={`w-5 h-5 rounded border-2 transition-all duration-200 flex items-center justify-center
                ${form.agreeTerms
                  ? 'bg-brand-charcoal border-brand-charcoal'
                  : 'border-gray-300 group-hover:border-brand-charcoal'
                }`}
            >
              {form.agreeTerms && (
                <span className="text-white">
                  <CheckIcon />
                </span>
              )}
            </div>
          </div>
          <span className="text-sm text-brand-muted leading-relaxed">
            Tôi đồng ý với{' '}
            <a href="#" className="text-brand-charcoal font-medium hover:text-brand-blush transition-colors">
              Điều khoản dịch vụ
            </a>
            {' '}và{' '}
            <a href="#" className="text-brand-charcoal font-medium hover:text-brand-blush transition-colors">
              Chính sách bảo mật
            </a>
          </span>
        </label>
        {errors.agreeTerms && (
          <p className="text-red-400 text-xs mt-2 ml-8 animate-slide-up">{errors.agreeTerms}</p>
        )}
      </div>

      {/* ─── Submit Button ─── */}
      <div className="auth-form-field">
        <button
          type="submit"
          disabled={isSubmitting}
          className="auth-submit-btn w-full bg-brand-charcoal text-white py-4 rounded-lg
                     font-medium uppercase tracking-widest text-sm
                     transition-all duration-300
                     hover:bg-brand-dark hover:shadow-xl hover:shadow-brand-charcoal/20
                     active:scale-[0.98]
                     disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:shadow-none"
        >
          {isSubmitting ? (
            <span className="flex items-center justify-center gap-3">
              <svg className="w-5 h-5 animate-spin" viewBox="0 0 24 24" fill="none">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="3" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              Đang xử lý...
            </span>
          ) : (
            'Tạo Tài Khoản'
          )}
        </button>
      </div>

      {/* ─── Divider ─── */}
      <div className="auth-form-field flex items-center gap-4 my-8">
        <div className="flex-1 h-px bg-gray-200" />
        <span className="text-sm text-brand-muted font-medium">hoặc</span>
        <div className="flex-1 h-px bg-gray-200" />
      </div>

      {/* ─── Social Login ─── */}
      <div className="auth-form-field">
        <SocialLogin />
      </div>

      {/* ─── Switch to Login ─── */}
      <p className="auth-form-field text-center mt-10 text-sm text-brand-muted">
        Đã có tài khoản?{' '}
        <button
          type="button"
          onClick={onSwitchTab}
          className="text-brand-charcoal font-semibold hover:text-brand-blush transition-colors duration-200"
        >
          Đăng nhập
        </button>
      </p>
    </form>
  )
}
