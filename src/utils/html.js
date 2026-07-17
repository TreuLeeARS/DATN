const HTML_ENTITIES = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#039;',
}

/**
 * Escape dữ liệu động trước khi chèn vào chuỗi HTML dùng cho cửa sổ in.
 * React tự escape JSX, nhưng document.write không có lớp bảo vệ này.
 */
export const escapeHtml = (value) => String(value ?? '').replace(
  /[&<>"']/g,
  character => HTML_ENTITIES[character]
)
