export const isPaymentNotFoundError = (error) => {
  if (error?.response?.status !== 400) return false
  const message = error.response?.data?.message || ''
  return message.toLocaleLowerCase('vi').includes('không tìm thấy thông tin thanh toán')
}
