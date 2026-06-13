import { products } from './products.js'

export const intentMap = [
  {
    keywords: ['dress', 'dresses', 'đầm', 'váy'],
    response: 'Tuyệt vời, bạn đang quan tâm đến đầm! Chúng tôi có rất nhiều lựa chọn ấn tượng - từ đầm midi thanh lịch đến đầm quấn nhẹ nhàng. Bạn thích phong cách nào? Thường ngày, dự tiệc, hay điều gì đó ở giữa?',
    suggestions: ['Xem đầm quấn', 'Đầm midi thì sao?', 'Phong cách thường ngày'],
  },
  {
    keywords: ['sale', 'discount', 'offer', 'cheap', 'affordable', 'khuyến mãi', 'giảm giá', 'rẻ'],
    response: 'Tin vui đây! Hiện chúng tôi đang có nhiều sản phẩm giảm giá cực hấp dẫn. Những món này vừa thời trang vừa có giá tuyệt vời. Bạn đang để ý đến loại sản phẩm nào?',
    suggestions: ['Xem hàng giảm giá', 'Ưu đãi tốt nhất', 'Dưới 500k'],
  },
  {
    keywords: ['summer', 'hot', 'warm', 'beach', 'resort', 'hè', 'mùa hè', 'nóng', 'biển'],
    response: 'Đúng thời điểm rồi! Mùa hè là dịp cho những chất liệu thoáng mát và phom dáng dễ chịu. Tôi gợi ý bộ sưu tập vải lanh - vừa thoải mái lại vừa tinh tế. Bạn có muốn xem các món đồ mùa hè không?',
    suggestions: ['Đồ vải lanh', 'Đồ đi biển', 'Chất liệu nhẹ'],
  },
  {
    keywords: ['work', 'office', 'professional', 'business', 'tailored', 'công sở', 'đi làm', 'văn phòng'],
    response: 'Bạn đang xây dựng tủ đồ công sở à? Chúng tôi có nhiều thiết kế may đo đẹp, hoàn hảo cho văn phòng. Hãy nghĩ đến blazer có phom, quần tây thanh lịch và những chiếc áo tinh tế đầy chuyên nghiệp.',
    suggestions: ['Áo blazer', 'Quần tây', 'Đầm công sở'],
  },
  {
    keywords: ['casual', 'everyday', 'comfortable', 'relaxed', 'thường ngày', 'thoải mái', 'hằng ngày'],
    response: 'Để thoải mái mỗi ngày mà vẫn giữ được phong cách, chúng tôi có áo sơ mi oversize, áo cardigan ấm áp và áo thun đơn giản hợp với mọi thứ. Món đồ thoải mái yêu thích của bạn là gì?',
    suggestions: ['Áo sơ mi oversize', 'Áo cardigan', 'Áo thun cơ bản'],
  },
  {
    keywords: ['color', 'colour', 'pink', 'black', 'white', 'red', 'blue', 'green', 'màu', 'hồng', 'đen', 'trắng'],
    response: 'Chúng tôi có dải màu sắc rất đẹp! Từ hồng phấn đặc trưng đến những tông trung tính cổ điển, luôn có lựa chọn cho mọi tâm trạng và dịp. Bạn thường thích những màu nào?',
    suggestions: ['Tông trung tính', 'Màu nổi bật', 'Màu pastel'],
  },
  {
    keywords: ['size', 'fit', 'sizing', 'kích cỡ', 'size', 'vừa'],
    response: 'Tìm được size vừa vặn rất quan trọng! Hầu hết sản phẩm của chúng tôi có size từ XS đến XL. Nếu bạn cho tôi biết size thường mặc hoặc phom dáng yêu thích, tôi sẽ giúp bạn chọn món phù hợp.',
    suggestions: ['Xem bảng size', 'Gợi ý size cho tôi', 'Cần tư vấn'],
  },
  {
    keywords: ['fabric', 'material', 'cotton', 'linen', 'silk', 'chất liệu', 'vải', 'lanh', 'lụa'],
    response: 'Chúng tôi rất thích nói về chất liệu! Chúng tôi sử dụng các loại vải cao cấp như lụa, lanh, cotton và vải pha. Mỗi loại có cảm giác và ưu điểm riêng. Bạn thích chất liệu nào?',
    suggestions: ['Mềm mại & nhẹ nhàng', 'Thoáng mát', 'Có phom dáng'],
  },
  {
    keywords: ['help', 'suggest', 'recommend', 'choose', 'which', 'what', 'giúp', 'gợi ý', 'tư vấn', 'chọn'],
    response: 'Tôi rất sẵn lòng giúp bạn! Để gợi ý tốt nhất, bạn cho tôi biết - dịp nào vậy? Phong cách cá nhân của bạn ra sao? Và hôm nay tâm trạng bạn thế nào?',
    suggestions: ['Giới thiệu về bạn', 'Xem hàng bán chạy', 'Hàng mới về'],
  },
  {
    keywords: [],
    response: 'Tôi thích sự tò mò về phong cách của bạn! Tôi luôn ở đây để giúp bạn tìm đúng thứ mình cần. Dù là dịp đặc biệt hay đồ mặc hằng ngày, chúng tôi đều có. Hôm nay tôi có thể giúp bạn khám phá điều gì?',
    suggestions: ['Hàng mới về', 'Bán chạy nhất', 'Xem theo danh mục'],
  },
]

export const getResponse = (userInput) => {
  const lower = userInput.toLowerCase()
  const matched = intentMap.find(intent =>
    intent.keywords.some(kw => kw && lower.includes(kw))
  )
  return matched || intentMap[intentMap.length - 1]
}

export const getMockRecommendations = (userId = null) => {
  // Ở Phase 2, hàm này sẽ gọi API cá nhân hóa thật
  // Hiện tại trả về 4 sản phẩm cố định kèm lý do gợi ý
  const recommendedIndices = [0, 3, 6, 11]
  return recommendedIndices.map(idx => ({
    ...products[idx],
    reason: getReasonForProduct(idx),
  }))
}

const reasonBank = {
  0: 'Dựa trên sở thích vải lanh của bạn',
  3: 'Đang thịnh hành trong size của bạn',
  6: 'Phù hợp với các món bạn đã xem',
  11: 'Bán chạy nhất mùa này',
}

const getReasonForProduct = (idx) => {
  return reasonBank[idx] || 'Được chọn riêng cho bạn'
}
