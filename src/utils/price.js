export const formatVND = (price) => {
  if (price === undefined || price === null) return '0 đ';
  return new Intl.NumberFormat('vi-VN').format(price) + ' đ';
};
