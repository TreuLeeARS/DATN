export const isPaymentNotFoundError = (error) => {
  if (error?.response?.status !== 400) return false
  const message = error.response?.data?.message || ''
  return message.toLocaleLowerCase('vi').includes('không tìm thấy thông tin thanh toán')
}

// Enum từ BE chỉ dùng cho logic; giao diện luôn hiển thị tiếng Việt.
export const getPaymentStatusLabel = (status, paymentMethod = '') => {
  const normalizedMethod = String(paymentMethod).toUpperCase()

  switch (status) {
    case 'PENDING':
      return normalizedMethod.includes('COD')
        ? 'Chờ thu tiền khi giao hàng'
        : 'Chờ thanh toán'
    case 'SUCCESS':
      return 'Đã thanh toán'
    case 'FAILED':
      return 'Thanh toán thất bại'
    case 'REFUNDED':
      return 'Đã hoàn tiền'
    case 'NOT_CREATED':
      return 'Chưa khởi tạo thanh toán'
    default:
      return status || 'Chưa có dữ liệu'
  }
}
