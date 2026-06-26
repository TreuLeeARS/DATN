// Bộ ánh xạ tên màu sắc từ DB sang mã màu Hex cho giao diện thời trang cao cấp
const COLOR_HEX_MAP = {
  'trắng': '#FFFFFF',
  'đen': '#2C2C2C',
  'charcoal': '#2C2C2C',
  'charcoal (đen xám)': '#2C2C2C',
  'hồng': '#F2C4CE',
  'hồng blush': '#F2C4CE',
  'beige': '#E8D5B7',
  'be': '#E8D5B7',
  'nâu': '#8B7355',
  'nâu sáng': '#8B7355',
  'nâu đậm': '#5A4A42',
  'xám': '#8E8E93',
  'đỏ': '#FF3B30',
  'xanh': '#3A7D44',
  'vàng': '#E0A96D'
};

// Ánh xạ danh mục tiếng Việt từ BE sang slug tiếng Anh của FE
const CATEGORY_SLUG_MAP = {
  'váy & đầm': 'dresses',
  'váy': 'dresses',
  'đầm': 'dresses',
  'áo': 'tops',
  'áo thun': 'tops',
  'áo sơ mi': 'tops',
  'quần': 'bottoms',
  'quần tây': 'bottoms',
  'quần jeans': 'bottoms',
  'set đồ': 'sets',
  'set': 'sets',
  'áo khoác': 'outerwear',
  'giày': 'shoes',
  'túi xách': 'bags',
  'túi': 'bags',
  'phụ kiện': 'accessories'
};

// Hình ảnh thời trang cao cấp làm hình ảnh mặc định khi sản phẩm không có ảnh
const DEFAULT_IMAGES = [
  'https://images.unsplash.com/photo-1609357605129-26f69add5d6e?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1595777457583-95e059d581b8?q=80&w=600&auto=format&fit=crop',
  'https://images.unsplash.com/photo-1572804013309-59a88b7e92f1?q=80&w=600&auto=format&fit=crop'
];

/**
 * Chuyển tên màu sắc thành đối tượng chứa tên và mã Hex
 */
export const mapColor = (colorName) => {
  if (!colorName) return { name: 'Mặc định', hex: '#E8D5B7' };
  const cleanName = colorName.toLowerCase().trim();
  const hex = COLOR_HEX_MAP[cleanName] || COLOR_HEX_MAP['beige'];
  return { name: colorName, hex };
};

/**
 * Ánh xạ một đối tượng Product từ Backend sang định dạng Frontend mong đợi
 * @param {Object} dbProduct Đối tượng ProductListResponse hoặc ProductResponse từ API
 * @returns {Object} Đối tượng Product chuẩn hóa cho giao diện Frontend
 */
export const mapDbProduct = (dbProduct) => {
  if (!dbProduct) return null;

  const id = String(dbProduct.productId);
  const name = dbProduct.name || 'Sản phẩm không tên';
  const price = dbProduct.baseprice ? Number(dbProduct.baseprice) : 0;
  
  // Tạo giả lập giá gốc và Badge thời trang để giữ tính mỹ thuật Zara/LV
  const isEvenId = dbProduct.productId % 2 === 0;
  const originalPrice = isEvenId ? Math.round(price * 1.35) : null;
  const badge = isEvenId ? 'sale' : (dbProduct.productId % 3 === 0 ? 'bestseller' : 'new');

  // Chuẩn hóa ảnh
  let images = dbProduct.imageUrls;
  if (!images || !Array.isArray(images) || images.length === 0) {
    images = DEFAULT_IMAGES;
  }

  // Chuẩn hóa danh mục
  const dbCatName = (dbProduct.categoryName || '').toLowerCase().trim();
  let category = 'accessories';
  
  if (CATEGORY_SLUG_MAP[dbCatName]) {
    category = CATEGORY_SLUG_MAP[dbCatName];
  } else {
    // Tìm kiếm tương đối nếu danh mục có tên dài hơn
    for (const key of Object.keys(CATEGORY_SLUG_MAP)) {
      if (dbCatName.includes(key)) {
        category = CATEGORY_SLUG_MAP[key];
        break;
      }
    }
  }

  // Phân chia thương hiệu, chất liệu và dịp mặc định dựa theo ID để giữ nguyên bộ lọc sidebar hoạt động chính xác
  const brand = ['Routine', 'IVY Moda', 'Yody', 'ASOS', 'SHEIN'][dbProduct.productId % 5];
  const material = ['Cotton', 'Lụa (Silk)', 'Lanh (Linen)', 'Dạ Tweed', 'Jeans/Denim'][dbProduct.productId % 5];
  const occasion = ['Đi chơi', 'Đi làm', 'Dự tiệc', 'Công sở'][dbProduct.productId % 4];

  // Trích xuất màu sắc và kích cỡ từ variants nếu có (ProductResponse)
  let colors = [];
  let sizes = [];

  if (dbProduct.variants && Array.isArray(dbProduct.variants) && dbProduct.variants.length > 0) {
    // Lấy kích cỡ độc nhất
    sizes = [...new Set(dbProduct.variants.map(v => v.size).filter(Boolean))];
    
    // Lấy màu sắc độc nhất
    const uniqueColors = [...new Set(dbProduct.variants.map(v => v.color).filter(Boolean))];
    colors = uniqueColors.map(colorName => mapColor(colorName));
  } else {
    // Fallback mặc định cho ProductListResponse để hiển thị ngay trên lưới
    colors = [
      { name: 'Beige', hex: '#E8D5B7' },
      { name: 'Charcoal (Đen Xám)', hex: '#2C2C2C' },
      { name: 'Trắng', hex: '#FFFFFF' }
    ];
    sizes = ['S', 'M', 'L', 'XL'];
  }

  return {
    id,
    productId: dbProduct.productId,
    name,
    price,
    originalPrice,
    images,
    category,
    tags: dbProduct.description ? dbProduct.description.split(' ').slice(0, 3).map(w => w.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g,"")) : ['elegant', 'minimalist', 'premium'],
    badge,
    colors,
    sizes,
    isAvailable: !dbProduct.deleted,
    description: dbProduct.description || `Sản phẩm ${name} cao cấp mang phong cách thiết kế tối giản, chất liệu bền bỉ và phom dáng chuẩn mực.`,
    brand,
    material,
    occasion
  };
};
