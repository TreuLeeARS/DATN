/**
 * Đọc toàn bộ content của một API Spring Page mà không phụ thuộc giới hạn cứng
 * như 1000 bản ghi. fetchPage phải nhận params gồm page và size.
 */
export const fetchAllPagedContent = async (fetchPage, params = {}, pageSize = 100) => {
  const firstResponse = await fetchPage({ ...params, page: 0, size: pageSize })
  const firstPage = firstResponse?.data
  const content = [...(firstPage?.content || [])]
  const totalPages = Math.max(Number(firstPage?.totalPages) || 1, 1)

  for (let page = 1; page < totalPages; page += 1) {
    const response = await fetchPage({ ...params, page, size: pageSize })
    content.push(...(response?.data?.content || []))
  }

  return content
}
