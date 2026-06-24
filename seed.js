/**
 * SOAP Project — Data Seeder
 * Nạp data thật: Brands, Categories, Products với ảnh từ Unsplash
 *
 * Cách chạy:
 *   node seed.js
 *
 * Yêu cầu: MySQL container đang chạy (docker compose up mysql -d)
 */

require('dotenv').config(); // Load root .env
require('dotenv').config({ path: './catalog-service/.env' });

const { Sequelize, DataTypes } = require('sequelize');
const https = require('https');
const { pickProductImages, pickCategoryImage } = require('./shoeImagePool');

// ============================================================
// CONFIG
// ============================================================
const PEXELS_API_KEY = process.env.PEXELS_API_KEY;

const dbHost = process.env.MYSQL_HOST === 'mysql' ? '127.0.0.1' : (process.env.MYSQL_HOST || '127.0.0.1');

const sequelize = new Sequelize(
  process.env.MYSQL_DATABASE || 'soap_catalog_db',
  process.env.MYSQL_USER || 'root',
  process.env.MYSQL_PASSWORD || 'rootpassword',
  {
    host: dbHost,
    port: process.env.MYSQL_PORT || 3306,
    dialect: 'mysql',
    logging: false,
    define: { charset: 'utf8mb4', underscored: true },
    timezone: '+07:00',
  }
);

// ============================================================
// MODELS (inline để script chạy độc lập)
// ============================================================
const Brand = sequelize.define('Brand', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name:        { type: DataTypes.STRING(100), allowNull: false, unique: true },
  slug:        { type: DataTypes.STRING(100), unique: true },
  description: { type: DataTypes.TEXT },
  image_url:   { type: DataTypes.STRING(500) },
  is_active:   { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'brands', timestamps: true, underscored: true });

const Category = sequelize.define('Category', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name:        { type: DataTypes.STRING(100), allowNull: false, unique: true },
  slug:        { type: DataTypes.STRING(100), unique: true },
  description: { type: DataTypes.TEXT },
  image_url:   { type: DataTypes.STRING(500) },
  type:        { type: DataTypes.STRING(50), defaultValue: 'standard' },
  is_active:   { type: DataTypes.BOOLEAN, defaultValue: true },
}, { tableName: 'categories', timestamps: true, underscored: true });

const Product = sequelize.define('Product', {
  id:              { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name:            { type: DataTypes.STRING(255), allowNull: false },
  slug:            { type: DataTypes.STRING(255), unique: true },
  brand_id:        { type: DataTypes.INTEGER },
  category_id:     { type: DataTypes.INTEGER, allowNull: false },
  description:     { type: DataTypes.TEXT },
  original_price:  { type: DataTypes.DECIMAL(15, 0) },
  price:           { type: DataTypes.DECIMAL(15, 0), allowNull: false },
  images:          { type: DataTypes.JSON },
  available_sizes: { type: DataTypes.JSON },
  available_colors:{ type: DataTypes.JSON },
  stock:           { type: DataTypes.INTEGER, defaultValue: 0 },
  sold:            { type: DataTypes.INTEGER, defaultValue: 0 },
  rating:          { type: DataTypes.DECIMAL(3, 2), defaultValue: 0 },
  reviews:         { type: DataTypes.INTEGER, defaultValue: 0 },
  gender:          { type: DataTypes.ENUM('nam', 'nu', 'unisex'), defaultValue: 'unisex' },
  material:        { type: DataTypes.STRING(100) },
  sole:            { type: DataTypes.STRING(100) },
  weight:          { type: DataTypes.INTEGER },
  foot_type:       { type: DataTypes.ENUM('thon', 'be', 'unisex'), defaultValue: 'unisex' },
  tags:            { type: DataTypes.JSON },
  is_active:       { type: DataTypes.BOOLEAN, defaultValue: true },
  is_xakho:        { type: DataTypes.BOOLEAN, defaultValue: false },
  is_featured:     { type: DataTypes.BOOLEAN, defaultValue: false },
  is_new_arrival:  { type: DataTypes.BOOLEAN, defaultValue: false },
}, { tableName: 'products', timestamps: true, underscored: true });

// ============================================================
// HELPERS
// ============================================================
function slugify(text) {
  return text.toLowerCase()
    .normalize('NFD').replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/g, 'd').replace(/[^a-z0-9\s-]/g, '')
    .trim().replace(/\s+/g, '-').replace(/-+/g, '-');
}

function sleep(ms) {
  return new Promise(r => setTimeout(r, ms));
}

function httpGet(url) {
  return new Promise((resolve, reject) => {
    const req = https.get(url, { headers: { 'User-Agent': 'SOAP-Seeder/1.0' } }, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return httpGet(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON parse error: ' + data.slice(0, 100))); }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

function httpGetPexels(url) {
  return new Promise((resolve, reject) => {
    const parsedUrl = new URL(url);
    const options = {
      hostname: parsedUrl.hostname,
      path: parsedUrl.pathname + parsedUrl.search,
      headers: {
        'Authorization': PEXELS_API_KEY,
        'User-Agent': 'SOAP-Seeder/1.0'
      }
    };
    const req = https.get(options, (res) => {
      if (res.statusCode === 301 || res.statusCode === 302) {
        return httpGetPexels(res.headers.location).then(resolve).catch(reject);
      }
      let data = '';
      res.on('data', chunk => data += chunk);
      res.on('end', () => {
        try { resolve(JSON.parse(data)); }
        catch (e) { reject(new Error('JSON parse error: ' + data.slice(0, 100))); }
      });
    });
    req.on('error', reject);
    req.setTimeout(10000, () => { req.destroy(); reject(new Error('Timeout')); });
  });
}

// Lấy ảnh từ Pexels theo keyword
async function getPexelsImages(query, count = 4) {
  try {
    await sleep(300); // rate limit
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=${count}`;
    const response = await httpGetPexels(url);
    if (!response || !Array.isArray(response.photos)) return getPlaceholderImages(query, count);
    const urls = response.photos.map(p => p.src?.large || p.src?.medium).filter(Boolean);
    if (urls.length === 0) return getPlaceholderImages(query, count);
    while (urls.length < count) {
      urls.push(urls[0] || getPlaceholderImages(query, 1)[0]);
    }
    return urls;
  } catch (err) {
    console.warn(`  ⚠️  Pexels fallback for "${query}": ${err.message}`);
    return getPlaceholderImages(query, count);
  }
}

function getPlaceholderImages(query, count) {
  const keywords = encodeURIComponent(query);
  return Array.from({ length: count }, (_, i) =>
    `https://placehold.co/800x800?text=${keywords}+${i + 1}`
  );
}

// ============================================================
// DATA SEED
// ============================================================

const usedImageUrls = new Set();

async function getPexelsImagesWithDeduplication(query, count = 1) {
  try {
    await sleep(300); // rate limit
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=15`;
    const response = await httpGetPexels(url);
    if (!response || !Array.isArray(response.photos)) return getPlaceholderImages(query, count);
    
    const selectedUrls = [];
    for (const photo of response.photos) {
      const imgUrl = photo.src?.large || photo.src?.medium;
      if (imgUrl && !usedImageUrls.has(imgUrl)) {
        usedImageUrls.add(imgUrl);
        selectedUrls.push(imgUrl);
        if (selectedUrls.length === count) break;
      }
    }
    
    while (selectedUrls.length < count) {
      const placeholder = getPlaceholderImages(query, 1)[0];
      selectedUrls.push(placeholder);
    }
    return selectedUrls;
  } catch (err) {
    console.warn(`  ⚠️  Pexels fallback for "${query}": ${err.message}`);
    return getPlaceholderImages(query, count);
  }
}

async function getUniquePexelsImagesForPool(query, count = 25) {
  try {
    await sleep(300); // rate limit
    // Request up to 40 photos to have enough unique ones
    const url = `https://api.pexels.com/v1/search?query=${encodeURIComponent(query)}&per_page=40`;
    const response = await httpGetPexels(url);
    if (!response || !Array.isArray(response.photos)) return getPlaceholderImages(query, count);
    
    const selectedUrls = [];
    for (const photo of response.photos) {
      const imgUrl = photo.src?.large || photo.src?.medium;
      if (imgUrl && !usedImageUrls.has(imgUrl)) {
        usedImageUrls.add(imgUrl);
        selectedUrls.push(imgUrl);
        if (selectedUrls.length === count) break;
      }
    }
    
    // If we don't have enough unique ones, grab already used ones or placeholder
    if (selectedUrls.length < count) {
      for (const photo of response.photos) {
        const imgUrl = photo.src?.large || photo.src?.medium;
        if (imgUrl && !selectedUrls.includes(imgUrl)) {
          selectedUrls.push(imgUrl);
          if (selectedUrls.length === count) break;
        }
      }
    }
    
    while (selectedUrls.length < count) {
      selectedUrls.push(getPlaceholderImages(query, 1)[0]);
    }
    return selectedUrls;
  } catch (err) {
    console.warn(`  ⚠️ Pexels pool fallback for "${query}": ${err.message}`);
    return getPlaceholderImages(query, count);
  }
}

const CATEGORY_QUERIES = {
  'giay-bong-da-san-co-tu-nhien': 'soccer cleats grass shoe -people',
  'giay-bong-da-san-co-nhan-tao': 'soccer turf shoes -people',
  'giay-futsal':                  'indoor soccer shoes -people',
  'giay-training':                'gym training shoes product -people',
  'giay-lifestyle':               'lifestyle sneakers shoe product -people',
  'giay-bong-da':                 'soccer cleats boots -people',
  'giay-chay-bo':                 'running shoes product -people',
  'giay-bong-ro':                 'basketball shoes product -people',
  'giay-tennis':                  'tennis shoes product -people',
  'qua-bong-da':                  'soccer ball football product -people',
  'boc-ong-dong':                 'soccer shin guards -people',
  'gang-tay-thu-mon':             'goalkeeper gloves -people',
  'vo-bong-da':                   'soccer socks -people',
  'ao-bong-da-chinh-hang':        'football shirt jersey -people',
  'phu-kien-ra-san':              'soccer training cones bottle -people',
  'balo-tui-xach':                'sports backpack gym bag -people',
  'bo-quan-ao-bong-da':           'soccer kit uniform -people',
  'dep-chinh-hang':               'sport slides sandals -people'
};

const BRANDS_DATA = [
  { name: 'Nike',    logoUrl: 'https://cdn.simpleicons.org/nike', description: 'Thương hiệu giày thể thao hàng đầu thế giới từ Mỹ, nổi tiếng với công nghệ Air và Flyknit.' },
  { name: 'Adidas',  logoUrl: 'https://cdn.simpleicons.org/adidas', description: 'Thương hiệu Đức với công nghệ Boost và thiết kế 3 sọc biểu tượng.' },
  { name: 'Puma',    logoUrl: 'https://cdn.simpleicons.org/puma', description: 'Thương hiệu Đức năng động, chuyên giày thể thao và lifestyle.' },
  { name: 'Mizuno',  logoUrl: 'https://placehold.co/400x200/002B5C/FFFFFF?text=Mizuno', description: 'Thương hiệu Nhật Bản chuyên giày chạy bộ và bóng đá chất lượng cao.' },
  { name: 'Asics',   logoUrl: 'https://placehold.co/400x200/002B5C/FFFFFF?text=Asics', description: 'Thương hiệu Nhật Bản nổi tiếng với sự êm ái, độ bền và công nghệ Gel vượt trội.' },
  { name: 'NMS',     logoUrl: 'https://placehold.co/400x200/333333/FFFFFF?text=NMS', description: 'Thương hiệu giày đá bóng phân khúc tầm trung với độ bám sân và cảm giác bóng tốt.' },
  { name: 'Kamito',  logoUrl: 'https://placehold.co/400x200/1A5276/FFFFFF?text=Kamito', description: 'Thương hiệu giày thể thao Việt Nam, giá tốt cho thị trường nội địa.' },
  { name: 'Zocker',  logoUrl: 'https://placehold.co/400x200/F39C12/FFFFFF?text=Zocker', description: 'Thương hiệu Việt Nam chuyên cung cấp các dòng giày bóng đá chất lượng cao, ôm chân, hỗ trợ kiểm soát bóng.' },
  { name: 'Joma',    logoUrl: 'https://placehold.co/400x200/CC0000/FFFFFF?text=Joma', description: 'Thương hiệu Tây Ban Nha phổ biến trong bóng đá phong trào tại Việt Nam.' },
  { name: 'Under Armour', logoUrl: 'https://cdn.simpleicons.org/underarmour', description: 'Thương hiệu Mỹ chuyên đồ thể thao hiệu suất cao.' },
  { name: 'New Balance', logoUrl: 'https://cdn.simpleicons.org/newbalance', description: 'Thương hiệu Mỹ nổi tiếng với sự thoải mái và độ bền.' },
  { name: 'Reebok',  logoUrl: 'https://placehold.co/400x200/1C1C1C/FFFFFF?text=Reebok', description: 'Thương hiệu thể thao toàn cầu với phong cách cổ điển và hiệu suất cao.' },
  { name: 'Converse', logoUrl: 'https://placehold.co/400x200/000000/FFFFFF?text=Converse', description: 'Thương hiệu giày biểu tượng của Mỹ, nổi bật với phong cách thời trang đường phố.' },
  { name: 'Vans',    logoUrl: 'https://placehold.co/400x200/CC0000/FFFFFF?text=Vans', description: 'Thương hiệu dành cho những người yêu thích trượt ván và phong cách tự do.' },
  { name: 'Fila',    logoUrl: 'https://placehold.co/400x200/003366/FFFFFF?text=Fila', description: 'Thương hiệu thời trang thể thao Ý mang đậm nét thanh lịch.' },
  { name: 'Salomon', logoUrl: 'https://placehold.co/400x200/222222/FFFFFF?text=Salomon', description: 'Thương hiệu hàng đầu về giày chạy trail và các môn thể thao ngoài trời.' },
  { name: 'Hoka',    logoUrl: 'https://placehold.co/400x200/0055A4/FFFFFF?text=Hoka', description: 'Thương hiệu giày chạy bộ siêu đệm, bảo vệ bàn chân vượt trội.' },
  { name: 'Saucony', logoUrl: 'https://placehold.co/400x200/000000/FFFFFF?text=Saucony', description: 'Thương hiệu chuyên biệt dành cho dân chạy bộ.' },
  { name: 'Champion', logoUrl: 'https://placehold.co/400x200/003366/FFFFFF?text=Champion', description: 'Biểu tượng phong cách thể thao đường phố của Mỹ.' },
  { name: 'Kappa',   logoUrl: 'https://placehold.co/400x200/000000/FFFFFF?text=Kappa', description: 'Thương hiệu thể thao Ý nổi tiếng với logo Omini đặc trưng.' }
];

const CATEGORIES_DATA = [
  // type: standard — hiện ở khu vực "BẠN ĐANG TÌM"
  { name: 'Giày bóng đá sân cỏ tự nhiên', slug: 'giay-bong-da-san-co-tu-nhien', type: 'standard',    imageUrl: 'https://images.pexels.com/photos/27299906/pexels-photo-27299906.jpeg?auto=compress&cs=tinysrgb&w=800', description: 'Giày đinh dài cho sân cỏ tự nhiên, độ bám tốt.' },
  { name: 'Giày bóng đá sân cỏ nhân tạo', slug: 'giay-bong-da-san-co-nhan-tao', type: 'standard',    imageUrl: 'https://images.pexels.com/photos/32925319/pexels-photo-32925319.jpeg?auto=compress&cs=tinysrgb&w=800', description: 'Đế đinh ngắn, phù hợp sân cỏ nhân tạo phổ biến.' },
  { name: 'Giày futsal',                   slug: 'giay-futsal',                   type: 'standard',    imageUrl: 'https://images.pexels.com/photos/14690051/pexels-photo-14690051.jpeg?auto=compress&cs=tinysrgb&w=800', description: 'Đế bằng chuyên dụng cho sân futsal trong nhà.' },
  { name: 'Giày training',                 slug: 'giay-training',                 type: 'standard',    imageUrl: 'https://images.pexels.com/photos/4753991/pexels-photo-4753991.jpeg?auto=compress&cs=tinysrgb&w=800', description: 'Đa năng cho các bài tập gym và cross-training.' },
  { name: 'Giày lifestyle',                slug: 'giay-lifestyle',                type: 'standard',    imageUrl: 'https://images.pexels.com/photos/12036893/pexels-photo-12036893.jpeg?auto=compress&cs=tinysrgb&w=800', description: 'Phong cách thể thao dùng cho đời thường.' },
  
  // type: sport — hiện ở khu vực "CHỌN GIÀY THEO MÔN THỂ THAO"
  { name: 'Giày bóng đá',                  slug: 'giay-bong-da',                  type: 'sport',       imageUrl: 'https://images.pexels.com/photos/10923070/pexels-photo-10923070.jpeg?auto=compress&cs=tinysrgb&w=800', description: 'Hỗ trợ bứt tốc, xoay xở linh hoạt trên mọi mặt sân.' },
  { name: 'Giày chạy bộ',                  slug: 'giay-chay-bo',                  type: 'sport',       imageUrl: 'https://images.pexels.com/photos/15475641/pexels-photo-15475641.jpeg?auto=compress&cs=tinysrgb&w=800', description: 'Độ êm ái cao, giảm chấn và tối ưu từng bước chạy.' },
  { name: 'Giày bóng rổ',                  slug: 'giay-bong-ro',                  type: 'sport',       imageUrl: 'https://images.pexels.com/photos/12879628/pexels-photo-12879628.jpeg?auto=compress&cs=tinysrgb&w=800', description: 'Cổ cao bảo vệ khớp cổ chân, chống trơn trượt cực tốt.' },
  { name: 'Giày tennis',                   slug: 'giay-tennis',                   type: 'sport',       imageUrl: 'https://images.pexels.com/photos/9241609/pexels-photo-9241609.jpeg?auto=compress&cs=tinysrgb&w=800', description: 'Thiết kế bền bỉ, tối ưu lực đẩy cho các chuyển động ngang.' },

  // PHỤ KIỆN DROPDOWN
  { name: 'Quả bóng đá',                   slug: 'qua-bong-da',                   type: 'standard',    description: 'Quả bóng đá thi đấu chất lượng cao, độ nảy chuẩn.' },
  { name: 'Bọc ống đồng',                  slug: 'boc-ong-dong',                  type: 'standard',    description: 'Bảo vệ ống đồng tránh chấn thương va chạm.' },
  { name: 'Găng tay thủ môn',              slug: 'gang-tay-thu-mon',              type: 'standard',    description: 'Găng tay thủ môn bám bóng cao cấp, chống trơn trượt.' },
  { name: 'Vớ bóng đá',                    slug: 'vo-bong-da',                    type: 'standard',    description: 'Vớ đá bóng êm ái, thấm hút mồ hôi tốt.' },
  { name: 'Áo bóng đá chính hãng',          slug: 'ao-bong-da-chinh-hang',          type: 'standard',    description: 'Áo đấu chính hãng của các câu lạc bộ nổi tiếng.' },
  { name: 'Phụ kiện ra sân',               slug: 'phu-kien-ra-san',               type: 'standard',    description: 'Còi, bình nước, băng trán, băng quấn cơ.' },
  { name: 'Balo túi xách',                  slug: 'balo-tui-xach',                  type: 'standard',    description: 'Balo thể thao, túi trống đựng giày tiện lợi.' },
  { name: 'Bộ quần áo bóng đá',            slug: 'bo-quan-ao-bong-da',            type: 'standard',    description: 'Bộ quần áo bóng đá thoáng mát cho đội bóng.' },
  { name: 'Dép chính hãng',                 slug: 'dep-chinh-hang',                 type: 'standard',    description: 'Dép lê, slide thể thao êm ái sau trận đấu.' },
];

// Sản phẩm thật với giá thị trường VN (VNĐ)
const PRODUCTS_TEMPLATE = [
  // === GIÀY BÓNG ĐÁ SÂN CỎ NHÂN TẠO ===
  { name: 'Nike Phantom GT2 Club TF', brand: 'Nike', category: 'giay-bong-da-san-co-nhan-tao', originalPrice: 1800000, price: 1490000, gender: 'nam', sizes: ['38','39','40','41','42','43'], colors: ['Đen/Trắng','Xanh dương'], stock: 45, sold: 120, rating: 4.5, reviews: 38, weight: 280, footType: 'unisex', material: 'Synthetic leather', sole: 'TPU', tags: ['bóng đá','cỏ nhân tạo','Nike'], isFeatured: true, isNewArrival: false, unsplashQuery: 'Nike football shoes turf black' },
  { name: 'Adidas X Speedportal.3 TF', brand: 'Adidas', category: 'giay-bong-da-san-co-nhan-tao', originalPrice: 2100000, price: 1750000, gender: 'nam', sizes: ['38','39','40','41','42','43','44'], colors: ['Trắng','Đen'], stock: 38, sold: 95, rating: 4.6, reviews: 42, weight: 250, footType: 'thon', material: 'Mesh', sole: 'TPU', tags: ['bóng đá','cỏ nhân tạo','Adidas'], isFeatured: true, isNewArrival: false, unsplashQuery: 'Adidas football shoes white turf' },
  { name: 'Puma Future 7 Play TF', brand: 'Puma', category: 'giay-bong-da-san-co-nhan-tao', originalPrice: 1600000, price: 1290000, gender: 'unisex', sizes: ['36','37','38','39','40','41','42'], colors: ['Vàng/Đen','Trắng/Đen'], stock: 55, sold: 78, rating: 4.3, reviews: 25, weight: 270, footType: 'unisex', material: 'Synthetic', sole: 'TPU', tags: ['bóng đá','cỏ nhân tạo','Puma'], isFeatured: false, isNewArrival: true, unsplashQuery: 'Puma football shoes yellow turf' },
  { name: 'Joma Top Flex TF', brand: 'Joma', category: 'giay-bong-da-san-co-nhan-tao', originalPrice: 850000, price: 720000, gender: 'nam', sizes: ['38','39','40','41','42','43'], colors: ['Đen/Đỏ','Xanh lá/Đen'], stock: 80, sold: 210, rating: 4.4, reviews: 67, weight: 300, footType: 'be', material: 'Synthetic', sole: 'Rubber', tags: ['bóng đá','cỏ nhân tạo','Joma','phổ thông'], isFeatured: false, isNewArrival: false, unsplashQuery: 'football shoes artificial turf red black' },
  { name: 'Kamito Veloce TF Pro', brand: 'Kamito', category: 'giay-bong-da-san-co-nhan-tao', originalPrice: 650000, price: 520000, gender: 'nam', sizes: ['38','39','40','41','42','43'], colors: ['Đen/Xanh','Trắng/Đỏ'], stock: 120, sold: 345, rating: 4.2, reviews: 89, weight: 310, footType: 'be', material: 'PU leather', sole: 'Rubber', tags: ['bóng đá','cỏ nhân tạo','Kamito','giá rẻ'], isFeatured: false, isNewArrival: false, unsplashQuery: 'football shoes turf sport blue' },
  { name: 'Mizuno Morelia Neo IV TF', brand: 'Mizuno', category: 'giay-bong-da-san-co-nhan-tao', originalPrice: 3200000, price: 2850000, gender: 'nam', sizes: ['39','40','41','42','43'], colors: ['Trắng/Vàng','Đen/Trắng'], stock: 25, sold: 45, rating: 4.8, reviews: 19, weight: 240, footType: 'be', material: 'Kangaroo leather', sole: 'TPU', tags: ['bóng đá','cỏ nhân tạo','Mizuno','cao cấp'], isFeatured: true, isNewArrival: false, unsplashQuery: 'Mizuno football shoes white premium' },

  // === GIÀY BÓNG ĐÁ ASICS ===
  { name: 'Asics Calcetto WD 9 TF', brand: 'Asics', category: 'giay-bong-da-san-co-nhan-tao', originalPrice: 1900000, price: 1550000, gender: 'nam', sizes: ['38','39','40','41','42','43'], colors: ['Trắng/Xanh','Đen/Vàng'], stock: 30, sold: 45, rating: 4.5, reviews: 15, weight: 260, footType: 'be', material: 'Synthetic leather', sole: 'Rubber', tags: ['bóng đá','cỏ nhân tạo','Asics','Calcetto'], isFeatured: true, isNewArrival: false, unsplashQuery: 'Asics football shoes turf' },
  { name: 'Asics Destaque FF 2 TF', brand: 'Asics', category: 'giay-bong-da-san-co-nhan-tao', originalPrice: 2800000, price: 2450000, gender: 'nam', sizes: ['39','40','41','42','43'], colors: ['Đỏ/Đen','Trắng/Vàng'], stock: 20, sold: 18, rating: 4.7, reviews: 8, weight: 240, footType: 'unisex', material: 'Kangaroo leather', sole: 'Rubber flat', tags: ['bóng đá','cỏ nhân tạo','Asics','Destaque','cao cấp'], isFeatured: false, isNewArrival: true, unsplashQuery: 'Asics football shoes red' },
  { name: 'Asics Toque 7 TF', brand: 'Asics', category: 'giay-bong-da-san-co-nhan-tao', originalPrice: 1600000, price: 1290000, gender: 'unisex', sizes: ['36','37','38','39','40','41','42'], colors: ['Vàng/Đen','Xanh dương'], stock: 40, sold: 60, rating: 4.3, reviews: 22, weight: 230, footType: 'thon', material: 'Synthetic', sole: 'Rubber', tags: ['bóng đá','cỏ nhân tạo','Asics','Toque'], isFeatured: false, isNewArrival: false, unsplashQuery: 'Asics football shoes yellow' },
  { name: 'Asics Ultrezza Club TF', brand: 'Asics', category: 'giay-bong-da-san-co-nhan-tao', originalPrice: 2200000, price: 1850000, gender: 'nam', sizes: ['38','39','40','41','42','43'], colors: ['Trắng/Đen','Xanh lá'], stock: 25, sold: 34, rating: 4.6, reviews: 12, weight: 250, footType: 'be', material: 'Synthetic', sole: 'Rubber', tags: ['bóng đá','cỏ nhân tạo','Asics','Ultrezza'], isFeatured: true, isNewArrival: false, unsplashQuery: 'Asics football shoes white' },

  // === GIÀY BÓNG ĐÁ NMS ===
  { name: 'NMS Attack TF', brand: 'NMS', category: 'giay-bong-da-san-co-nhan-tao', originalPrice: 750000, price: 590000, gender: 'nam', sizes: ['38','39','40','41','42','43'], colors: ['Đen/Trắng','Đỏ'], stock: 50, sold: 110, rating: 4.2, reviews: 30, weight: 290, footType: 'be', material: 'PU leather', sole: 'Rubber', tags: ['bóng đá','cỏ nhân tạo','NMS','Attack','giá rẻ'], isFeatured: true, isNewArrival: false, unsplashQuery: 'soccer shoes turf' },
  { name: 'NMS Capitan TF', brand: 'NMS', category: 'giay-bong-da-san-co-nhan-tao', originalPrice: 800000, price: 620000, gender: 'nam', sizes: ['38','39','40','41','42','43'], colors: ['Trắng/Vàng','Xanh dương'], stock: 45, sold: 85, rating: 4.3, reviews: 20, weight: 285, footType: 'unisex', material: 'PU leather', sole: 'Rubber', tags: ['bóng đá','cỏ nhân tạo','NMS','Capitan'], isFeatured: false, isNewArrival: true, unsplashQuery: 'soccer shoes turf blue' },
  { name: 'NMS Maestri TF', brand: 'NMS', category: 'giay-bong-da-san-co-nhan-tao', originalPrice: 850000, price: 650000, gender: 'nam', sizes: ['38','39','40','41','42','43'], colors: ['Xanh lá/Đen','Đen'], stock: 35, sold: 70, rating: 4.4, reviews: 25, weight: 280, footType: 'unisex', material: 'PU leather', sole: 'Rubber', tags: ['bóng đá','cỏ nhân tạo','NMS','Maestri'], isFeatured: false, isNewArrival: false, unsplashQuery: 'soccer shoes turf green' },
  { name: 'NMS Spider TF', brand: 'NMS', category: 'giay-bong-da-san-co-nhan-tao', originalPrice: 900000, price: 690000, gender: 'nam', sizes: ['38','39','40','41','42','43'], colors: ['Cam/Đen','Trắng/Đỏ'], stock: 40, sold: 95, rating: 4.4, reviews: 28, weight: 275, footType: 'thon', material: 'Synthetic', sole: 'Rubber', tags: ['bóng đá','cỏ nhân tạo','NMS','Spider'], isFeatured: true, isNewArrival: false, unsplashQuery: 'soccer shoes turf orange' },
  { name: 'NMS Victory TF', brand: 'NMS', category: 'giay-bong-da-san-co-nhan-tao', originalPrice: 790000, price: 580000, gender: 'unisex', sizes: ['37','38','39','40','41','42','43'], colors: ['Vàng/Đen','Trắng/Xanh'], stock: 60, sold: 130, rating: 4.2, reviews: 35, weight: 295, footType: 'be', material: 'PU leather', sole: 'Rubber', tags: ['bóng đá','cỏ nhân tạo','NMS','Victory'], isFeatured: false, isNewArrival: false, unsplashQuery: 'soccer shoes turf yellow' },

  // === GIÀY BÓNG ĐÁ ZOCKER ===
  { name: 'ZOCKER Inspire TF', brand: 'Zocker', category: 'giay-bong-da-san-co-nhan-tao', originalPrice: 950000, price: 790000, gender: 'nam', sizes: ['38','39','40','41','42','43'], colors: ['Xanh ngọc','Đỏ/Đen'], stock: 55, sold: 140, rating: 4.5, reviews: 42, weight: 270, footType: 'be', material: 'Kangaroo soft synthetic', sole: 'Rubber', tags: ['bóng đá','cỏ nhân tạo','Zocker','Inspire'], isFeatured: true, isNewArrival: false, unsplashQuery: 'soccer shoes turf teal' },
  { name: 'ZOCKER Space TF', brand: 'Zocker', category: 'giay-bong-da-san-co-nhan-tao', originalPrice: 890000, price: 750000, gender: 'nam', sizes: ['38','39','40','41','42','43'], colors: ['Trắng/Bạc','Đen/Vàng'], stock: 60, sold: 120, rating: 4.4, reviews: 35, weight: 275, footType: 'unisex', material: 'PU high quality', sole: 'Rubber', tags: ['bóng đá','cỏ nhân tạo','Zocker','Space'], isFeatured: false, isNewArrival: true, unsplashQuery: 'soccer shoes turf silver' },

  // === GIÀY BÓNG ĐÁ SÂN CỎ TỰ NHIÊN ===
  { name: 'Nike Mercurial Vapor 15 Club FG', brand: 'Nike', category: 'giay-bong-da-san-co-tu-nhien', originalPrice: 2500000, price: 1990000, gender: 'nam', sizes: ['38','39','40','41','42','43','44'], colors: ['Xanh dương/Trắng','Đen/Vàng'], stock: 30, sold: 88, rating: 4.7, reviews: 31, weight: 220, footType: 'thon', material: 'Synthetic', sole: 'Nylon', tags: ['bóng đá','cỏ tự nhiên','Nike','tốc độ'], isFeatured: true, isNewArrival: true, unsplashQuery: 'Nike Mercurial football cleats blue' },
  { name: 'Adidas Predator Club FG', brand: 'Adidas', category: 'giay-bong-da-san-co-tu-nhien', originalPrice: 2200000, price: 1850000, gender: 'nam', sizes: ['38','39','40','41','42','43'], colors: ['Đen/Trắng','Trắng/Đỏ'], stock: 35, sold: 72, rating: 4.6, reviews: 28, weight: 260, footType: 'unisex', material: 'Hybrid touch zone', sole: 'Nylon', tags: ['bóng đá','cỏ tự nhiên','Adidas','kiểm soát'], isFeatured: false, isNewArrival: false, unsplashQuery: 'Adidas Predator football cleats black' },
  { name: 'Mizuno Monarcida Neo II FG', brand: 'Mizuno', category: 'giay-bong-da-san-co-tu-nhien', originalPrice: 2800000, price: 2400000, gender: 'nam', sizes: ['39','40','41','42','43'], colors: ['Trắng/Xanh','Đen'], stock: 20, sold: 38, rating: 4.7, reviews: 15, weight: 255, footType: 'be', material: 'Synthetic', sole: 'Nylon', tags: ['bóng đá','cỏ tự nhiên','Mizuno'], isFeatured: false, isNewArrival: true, unsplashQuery: 'Mizuno football cleats grass white blue' },

  // === GIÀY FUTSAL ===
  { name: 'Nike Phantom GT2 Academy IC', brand: 'Nike', category: 'giay-futsal', originalPrice: 1900000, price: 1590000, gender: 'nam', sizes: ['38','39','40','41','42','43'], colors: ['Đen/Xanh','Trắng'], stock: 42, sold: 105, rating: 4.5, reviews: 44, weight: 290, footType: 'unisex', material: 'Textured synthetic', sole: 'Rubber flat', tags: ['futsal','trong nhà','Nike'], isFeatured: false, isNewArrival: false, unsplashQuery: 'futsal shoes indoor black blue' },
  { name: 'Adidas Copa Pure.3 IN', brand: 'Adidas', category: 'giay-futsal', originalPrice: 2000000, price: 1690000, gender: 'nam', sizes: ['38','39','40','41','42','43','44'], colors: ['Trắng/Vàng','Đen/Trắng'], stock: 38, sold: 92, rating: 4.6, reviews: 35, weight: 285, footType: 'be', material: 'Leather', sole: 'Rubber flat', tags: ['futsal','trong nhà','Adidas'], isFeatured: true, isNewArrival: false, unsplashQuery: 'Adidas Copa futsal shoes indoor white' },
  { name: 'Joma Top Flex IN', brand: 'Joma', category: 'giay-futsal', originalPrice: 780000, price: 650000, gender: 'unisex', sizes: ['36','37','38','39','40','41','42','43'], colors: ['Đen/Đỏ','Xanh dương'], stock: 95, sold: 280, rating: 4.3, reviews: 91, weight: 295, footType: 'be', material: 'Synthetic', sole: 'Rubber flat', tags: ['futsal','trong nhà','Joma','phổ thông'], isFeatured: false, isNewArrival: false, unsplashQuery: 'futsal shoes indoor sport red black' },
  { name: 'Kamito Stellar IN Futsal', brand: 'Kamito', category: 'giay-futsal', originalPrice: 490000, price: 390000, gender: 'unisex', sizes: ['36','37','38','39','40','41','42'], colors: ['Trắng/Xanh','Đen/Vàng'], stock: 150, sold: 420, rating: 4.1, reviews: 134, weight: 305, footType: 'be', material: 'PU', sole: 'Rubber flat', tags: ['futsal','trong nhà','Kamito','giá rẻ'], isFeatured: false, isNewArrival: false, unsplashQuery: 'futsal indoor sport shoes white' },

  // === GIÀY CHẠY BỘ ===
  { name: 'Nike Air Zoom Pegasus 41', brand: 'Nike', category: 'giay-chay-bo', originalPrice: 3500000, price: 2990000, gender: 'nam', sizes: ['38','39','40','41','42','43','44','45'], colors: ['Xanh/Trắng','Đen/Trắng','Đỏ/Đen'], stock: 28, sold: 67, rating: 4.8, reviews: 29, weight: 295, footType: 'unisex', material: 'Mesh thoáng khí', sole: 'React foam', tags: ['chạy bộ','Nike','zoom','cushioning'], isFeatured: true, isNewArrival: true, unsplashQuery: 'Nike Air Zoom running shoes blue white' },
  { name: 'Adidas Ultraboost 22', brand: 'Adidas', category: 'giay-chay-bo', originalPrice: 4200000, price: 3490000, gender: 'unisex', sizes: ['37','38','39','40','41','42','43','44'], colors: ['Trắng','Đen','Xanh navy'], stock: 22, sold: 54, rating: 4.9, reviews: 23, weight: 310, footType: 'unisex', material: 'Primeknit+', sole: 'Boost foam', tags: ['chạy bộ','Adidas','boost','đệm'], isFeatured: true, isNewArrival: false, unsplashQuery: 'Adidas Ultraboost running shoes white boost' },
  { name: 'New Balance Fresh Foam 1080v13', brand: 'New Balance', category: 'giay-chay-bo', originalPrice: 3800000, price: 3200000, gender: 'nam', sizes: ['38','39','40','41','42','43','44'], colors: ['Xám/Trắng','Đen/Xanh'], stock: 18, sold: 41, rating: 4.7, reviews: 17, weight: 320, footType: 'be', material: 'Mesh', sole: 'Fresh Foam X', tags: ['chạy bộ','New Balance','đệm dày'], isFeatured: false, isNewArrival: true, unsplashQuery: 'New Balance running shoes gray white fresh foam' },
  { name: 'Mizuno Wave Rider 27', brand: 'Mizuno', category: 'giay-chay-bo', originalPrice: 3200000, price: 2750000, gender: 'unisex', sizes: ['37','38','39','40','41','42','43'], colors: ['Xanh/Trắng','Trắng/Cam'], stock: 24, sold: 49, rating: 4.6, reviews: 21, weight: 260, footType: 'unisex', material: 'AIRmesh', sole: 'X10 rubber', tags: ['chạy bộ','Mizuno','wave'], isFeatured: false, isNewArrival: false, unsplashQuery: 'Mizuno Wave Rider running shoes blue' },
  { name: 'Puma Velocity Nitro 3', brand: 'Puma', category: 'giay-chay-bo', originalPrice: 2800000, price: 2290000, gender: 'nam', sizes: ['38','39','40','41','42','43','44'], colors: ['Đen/Vàng','Trắng/Xanh'], stock: 32, sold: 58, rating: 4.5, reviews: 22, weight: 270, footType: 'thon', material: 'Engineered mesh', sole: 'NITRO foam', tags: ['chạy bộ','Puma','nitro'], isFeatured: false, isNewArrival: true, unsplashQuery: 'Puma running shoes black yellow nitro' },
  { name: 'Under Armour HOVR Sonic 6', brand: 'Under Armour', category: 'giay-chay-bo', originalPrice: 2900000, price: 2490000, gender: 'unisex', sizes: ['37','38','39','40','41','42','43'], colors: ['Đen/Trắng','Trắng/Đỏ'], stock: 26, sold: 43, rating: 4.4, reviews: 18, weight: 285, footType: 'unisex', material: 'UA Warp knit', sole: 'HOVR foam', tags: ['chạy bộ','Under Armour','HOVR'], isFeatured: false, isNewArrival: false, unsplashQuery: 'Under Armour HOVR running shoes black' },

  // === GIÀY BÓNG RỔ ===
  { name: 'Nike LeBron NXXT Gen', brand: 'Nike', category: 'giay-bong-ro', originalPrice: 5500000, price: 4490000, gender: 'nam', sizes: ['40','41','42','43','44','45'], colors: ['Đen/Vàng','Trắng/Xanh'], stock: 15, sold: 32, rating: 4.8, reviews: 14, weight: 380, footType: 'be', material: 'Woven mesh', sole: 'Air cushion', tags: ['bóng rổ','Nike','LeBron','high performance'], isFeatured: true, isNewArrival: true, unsplashQuery: 'Nike LeBron basketball shoes black gold' },
  { name: 'Adidas Harden Vol. 8', brand: 'Adidas', category: 'giay-bong-ro', originalPrice: 4800000, price: 3990000, gender: 'nam', sizes: ['40','41','42','43','44'], colors: ['Trắng/Xanh','Đen/Đỏ'], stock: 12, sold: 24, rating: 4.7, reviews: 11, weight: 360, footType: 'unisex', material: 'Mesh', sole: 'Boost + rubber', tags: ['bóng rổ','Adidas','Harden'], isFeatured: false, isNewArrival: false, unsplashQuery: 'Adidas Harden basketball shoes white blue' },
  { name: 'Nike Air Force 1 Low Basketball', brand: 'Nike', category: 'giay-bong-ro', originalPrice: 2800000, price: 2490000, gender: 'unisex', sizes: ['36','37','38','39','40','41','42','43','44'], colors: ['Trắng','Đen','Trắng/Đỏ'], stock: 40, sold: 120, rating: 4.6, reviews: 55, weight: 395, footType: 'be', material: 'Leather', sole: 'Rubber', tags: ['bóng rổ','Nike','Air Force 1','classic'], isFeatured: true, isNewArrival: false, unsplashQuery: 'Nike Air Force 1 white basketball classic' },
  { name: 'Under Armour Curry 12', brand: 'Under Armour', category: 'giay-bong-ro', originalPrice: 4200000, price: 3590000, gender: 'nam', sizes: ['40','41','42','43','44','45'], colors: ['Xanh/Vàng','Đen/Trắng'], stock: 14, sold: 28, rating: 4.7, reviews: 12, weight: 355, footType: 'thon', material: 'UA Flow knit', sole: 'UA Flow', tags: ['bóng rổ','Under Armour','Curry'], isFeatured: false, isNewArrival: true, unsplashQuery: 'Under Armour Curry basketball shoes blue gold' },

  // === GIÀY TENNIS ===
  { name: 'Nike Court Air Zoom Vapor Pro 2', brand: 'Nike', category: 'giay-tennis', originalPrice: 3200000, price: 2690000, gender: 'nam', sizes: ['38','39','40','41','42','43','44'], colors: ['Trắng/Đen','Đen/Trắng'], stock: 22, sold: 45, rating: 4.6, reviews: 19, weight: 305, footType: 'thon', material: 'Mesh', sole: 'Herringbone rubber', tags: ['tennis','Nike','court'], isFeatured: false, isNewArrival: false, unsplashQuery: 'Nike tennis shoes court white black' },
  { name: 'Adidas Barricade 13', brand: 'Adidas', category: 'giay-tennis', originalPrice: 3500000, price: 2990000, gender: 'nam', sizes: ['38','39','40','41','42','43'], colors: ['Trắng/Xanh','Đen/Trắng'], stock: 18, sold: 36, rating: 4.5, reviews: 15, weight: 330, footType: 'be', material: 'Textile', sole: 'Adiwear', tags: ['tennis','Adidas','Barricade'], isFeatured: false, isNewArrival: true, unsplashQuery: 'Adidas Barricade tennis shoes court' },

  // === GIÀY TRAINING ===
  { name: 'Nike Metcon 9', brand: 'Nike', category: 'giay-training', originalPrice: 3200000, price: 2750000, gender: 'unisex', sizes: ['36','37','38','39','40','41','42','43','44'], colors: ['Đen','Trắng','Đỏ/Đen'], stock: 35, sold: 78, rating: 4.7, reviews: 32, weight: 330, footType: 'unisex', material: 'Mesh', sole: 'Rubber flat', tags: ['training','Nike','gym','crossfit'], isFeatured: true, isNewArrival: false, unsplashQuery: 'Nike Metcon training shoes gym black' },
  { name: 'Adidas Powerlift 5', brand: 'Adidas', category: 'giay-training', originalPrice: 2500000, price: 2100000, gender: 'nam', sizes: ['38','39','40','41','42','43','44'], colors: ['Đen/Vàng','Trắng/Đen'], stock: 28, sold: 52, rating: 4.5, reviews: 24, weight: 345, footType: 'be', material: 'Synthetic', sole: 'TPU wedge', tags: ['training','Adidas','weightlifting'], isFeatured: false, isNewArrival: false, unsplashQuery: 'Adidas training shoes weightlifting black gold' },
  { name: 'Puma Fuse 3.0', brand: 'Puma', category: 'giay-training', originalPrice: 1900000, price: 1590000, gender: 'unisex', sizes: ['36','37','38','39','40','41','42','43'], colors: ['Đen','Trắng/Xanh'], stock: 40, sold: 65, rating: 4.4, reviews: 26, weight: 300, footType: 'unisex', material: 'Mesh', sole: 'Rubber flat', tags: ['training','Puma','gym'], isFeatured: false, isNewArrival: true, unsplashQuery: 'Puma training shoes black gym fitness' },
  { name: 'Under Armour TriBase Reign 6', brand: 'Under Armour', category: 'giay-training', originalPrice: 2200000, price: 1890000, gender: 'unisex', sizes: ['36','37','38','39','40','41','42','43','44'], colors: ['Đen/Đỏ','Xám/Xanh'], stock: 30, sold: 44, rating: 4.3, reviews: 18, weight: 310, footType: 'unisex', material: 'Mesh', sole: 'Rubber', tags: ['training','Under Armour','gym'], isFeatured: false, isNewArrival: false, unsplashQuery: 'Under Armour training shoes black red gym' },

  // === GIÀY LIFESTYLE ===
  { name: 'Nike Air Max 90', brand: 'Nike', category: 'giay-lifestyle', originalPrice: 3800000, price: 3290000, gender: 'unisex', sizes: ['36','37','38','39','40','41','42','43','44','45'], colors: ['Trắng','Đen','Xám/Trắng','Đỏ'], stock: 55, sold: 189, rating: 4.8, reviews: 78, weight: 355, footType: 'be', material: 'Leather/Mesh', sole: 'Max Air', tags: ['lifestyle','Nike','Air Max','classic'], isFeatured: true, isNewArrival: false, unsplashQuery: 'Nike Air Max 90 lifestyle shoes white classic' },
  { name: 'Adidas Stan Smith', brand: 'Adidas', category: 'giay-lifestyle', originalPrice: 2500000, price: 2100000, gender: 'unisex', sizes: ['36','37','38','39','40','41','42','43','44'], colors: ['Trắng/Xanh lá','Trắng/Đen','Trắng/Hồng'], stock: 65, sold: 234, rating: 4.7, reviews: 95, weight: 290, footType: 'unisex', material: 'Leather', sole: 'Rubber cupsole', tags: ['lifestyle','Adidas','Stan Smith','classic'], isFeatured: true, isNewArrival: false, unsplashQuery: 'Adidas Stan Smith white green classic sneaker' },
  { name: 'New Balance 574', brand: 'New Balance', category: 'giay-lifestyle', originalPrice: 2200000, price: 1890000, gender: 'unisex', sizes: ['36','37','38','39','40','41','42','43','44'], colors: ['Xám','Navy','Xanh rêu'], stock: 48, sold: 156, rating: 4.6, reviews: 62, weight: 330, footType: 'be', material: 'Suede/Mesh', sole: 'ENCAP midsole', tags: ['lifestyle','New Balance','574','retro'], isFeatured: false, isNewArrival: false, unsplashQuery: 'New Balance 574 sneaker gray retro lifestyle' },
  { name: 'Puma Suede Classic XXI', brand: 'Puma', category: 'giay-lifestyle', originalPrice: 1800000, price: 1490000, gender: 'unisex', sizes: ['36','37','38','39','40','41','42','43','44'], colors: ['Đen/Trắng','Trắng/Đỏ','Navy/Trắng'], stock: 52, sold: 178, rating: 4.5, reviews: 71, weight: 275, footType: 'unisex', material: 'Suede', sole: 'Rubber', tags: ['lifestyle','Puma','Suede','classic'], isFeatured: false, isNewArrival: false, unsplashQuery: 'Puma Suede Classic sneaker black white lifestyle' },
  { name: 'Nike Dunk Low', brand: 'Nike', category: 'giay-lifestyle', originalPrice: 2900000, price: 2490000, gender: 'unisex', sizes: ['36','37','38','39','40','41','42','43','44','45'], colors: ['Trắng/Đen','Trắng/Xanh','Đỏ/Trắng'], stock: 38, sold: 145, rating: 4.8, reviews: 58, weight: 340, footType: 'unisex', material: 'Leather', sole: 'Rubber cupsole', tags: ['lifestyle','Nike','Dunk','streetwear'], isFeatured: true, isNewArrival: true, unsplashQuery: 'Nike Dunk Low white black sneaker streetwear' },
  { name: 'Adidas NMD R1', brand: 'Adidas', category: 'giay-lifestyle', originalPrice: 3200000, price: 2750000, gender: 'unisex', sizes: ['36','37','38','39','40','41','42','43','44'], colors: ['Đen','Trắng','Xám/Đỏ'], stock: 32, sold: 112, rating: 4.7, reviews: 45, weight: 285, footType: 'thon', material: 'Primeknit', sole: 'Boost foam', tags: ['lifestyle','Adidas','NMD','boost'], isFeatured: false, isNewArrival: true, unsplashQuery: 'Adidas NMD R1 black sneaker boost lifestyle' },
];

// Expand PRODUCTS_TEMPLATE to exactly 200 products dynamically to reach required diversity
const brandsList = ['Nike', 'Adidas', 'Puma', 'Mizuno', 'Asics', 'NMS', 'Kamito', 'Zocker', 'Joma', 'Under Armour', 'New Balance', 'Reebok', 'Converse', 'Vans', 'Fila', 'Salomon', 'Hoka', 'Saucony', 'Champion', 'Kappa'];
const categorySpecs = {
  'giay-bong-da-san-co-tu-nhien': {
    nameTemplates: ['Vapor 15 Elite FG', 'Predator Elite FG', 'Future Ultimate FG', 'Morelia Neo IV FG', 'Tekela V4 FG'],
    priceRange: [2000000, 6000000],
    sizes: ['39', '40', '41', '42', '43'],
    colors: [['Đỏ/Đen', 'Trắng'], ['Xanh/Trắng', 'Đen'], ['Cam/Đen']],
    footType: 'thon',
    material: 'Synthetic/Kangaroo Leather',
    sole: 'FG studs',
    query: 'soccer cleats FG'
  },
  'giay-bong-da-san-co-nhan-tao': {
    nameTemplates: ['Vapor 15 Academy TF', 'Predator League TF', 'Future Play TF', 'Morelia Neo IV TF', 'Superfly 9 Club TF'],
    priceRange: [1200000, 2800000],
    sizes: ['39', '40', '41', '42', '43'],
    colors: [['Xanh/Đen'], ['Trắng/Vàng'], ['Đen/Trắng']],
    footType: 'unisex',
    material: 'Synthetic Leather',
    sole: 'TF studs',
    query: 'soccer cleats TF'
  },
  'giay-futsal': {
    nameTemplates: ['React Gato IC', 'Copa Pure IN', 'Top Flex IN', 'Stellar IN', 'Audazo V6 IN'],
    priceRange: [800000, 2200000],
    sizes: ['38', '39', '40', '41', '42'],
    colors: [['Đen/Đỏ'], ['Trắng/Xanh'], ['Xám/Vàng']],
    footType: 'be',
    material: 'Synthetic/Leather',
    sole: 'Non-marking rubber',
    query: 'indoor soccer shoes'
  },
  'giay-training': {
    nameTemplates: ['Metcon 9', 'Nano X3', 'Fuse 2.0', 'TriBase Reign 5', 'Minimus TR'],
    priceRange: [1500000, 3500000],
    sizes: ['37', '38', '39', '40', '41', '42', '43', '44'],
    colors: [['Đen/Xám'], ['Trắng/Đỏ'], ['Xanh/Trắng']],
    footType: 'unisex',
    material: 'Mesh/Knit',
    sole: 'Flat rubber',
    query: 'training gym shoes'
  },
  'giay-lifestyle': {
    nameTemplates: ['Air Force 1', 'Stan Smith', 'Suede Classic', '574 Retro', 'Air Max 90'],
    priceRange: [1800000, 3800000],
    sizes: ['36', '37', '38', '39', '40', '41', '42', '43', '44'],
    colors: [['Trắng tinh'], ['Đen'], ['Xám cổ điển']],
    footType: 'unisex',
    material: 'Leather/Suede',
    sole: 'Rubber cupsole',
    query: 'sneaker lifestyle'
  },
  'giay-chay-bo': {
    nameTemplates: ['Air Zoom Pegasus 40', 'Ultraboost Light', 'Fresh Foam X 1080', 'Wave Rider 27', 'FloRide 5'],
    priceRange: [2200000, 4500000],
    sizes: ['37', '38', '39', '40', '41', '42', '43', '44'],
    colors: [['Xanh Neon'], ['Đen/Trắng'], ['Đỏ/Cam']],
    footType: 'unisex',
    material: 'Engineered Mesh',
    sole: 'Foam cushioning',
    query: 'running shoes product'
  },
  'giay-bong-ro': {
    nameTemplates: ['LeBron XXI', 'Harden Vol 7', 'Curry 11', 'Dame 8', 'Air Jordan 1'],
    priceRange: [2500000, 5500000],
    sizes: ['40', '41', '42', '43', '44', '45'],
    colors: [['Đen/Vàng'], ['Đỏ/Bạc'], ['Trắng/Xanh']],
    footType: 'be',
    material: 'Knit/Mesh',
    sole: 'Cushion rubber',
    query: 'basketball shoes product'
  },
  'giay-tennis': {
    nameTemplates: ['Court Zoom Vapor Pro', 'Barricade 12', 'Gel Resolution 9', 'Rush Pro 4.0'],
    priceRange: [2000000, 3800000],
    sizes: ['38', '39', '40', '41', '42', '43'],
    colors: [['Trắng/Đen'], ['Xanh/Trắng']],
    footType: 'thon',
    material: 'Synthetic Mesh',
    sole: 'Durable rubber',
    query: 'tennis shoes product'
  },
  'giay-bong-da': {
    nameTemplates: ['Vapor 15 Academy FG', 'Copa Sense TF', 'Morelia Neo FG', 'Future Ultimate TF'],
    priceRange: [1500000, 3500000],
    sizes: ['38', '39', '40', '41', '42', '43'],
    colors: [['Đen'], ['Trắng/Cam']],
    footType: 'unisex',
    material: 'Synthetic',
    sole: 'Multi-ground',
    query: 'football cleats'
  },
  'qua-bong-da': {
    nameTemplates: ['Strike Football', 'UCL Match Ball', 'La Liga Pitch', 'Kamito Lapa', 'Zocker Empire'],
    priceRange: [300000, 1500000],
    sizes: ['Size 4', 'Size 5'],
    colors: [['Trắng/Đen/Đỏ'], ['Trắng/Xanh'], ['Vàng/Đen']],
    footType: 'unisex',
    material: 'PU/PVC leather',
    sole: 'Butyl bladder',
    query: 'soccer ball'
  },
  'boc-ong-dong': {
    nameTemplates: ['Guard Shin Guards', 'Predator Pro Shin Guards', 'Mercurial Lite', 'Kamito Protect'],
    priceRange: [150000, 500000],
    sizes: ['S', 'M', 'L'],
    colors: [['Đen'], ['Trắng'], ['Xanh']],
    footType: 'unisex',
    material: 'PP shell + EVA foam',
    sole: 'None',
    query: 'shin guards'
  },
  'gang-tay-thu-mon': {
    nameTemplates: ['Predator Pro Gloves', 'Vapor Grip 3', 'Future Grip 1', 'Mizuno Gate Sky'],
    priceRange: [500000, 2500000],
    sizes: ['Size 7', 'Size 8', 'Size 9', 'Size 10'],
    colors: [['Đen/Đỏ'], ['Xanh/Trắng']],
    footType: 'unisex',
    material: 'Latex foam',
    sole: 'None',
    query: 'goalkeeper gloves'
  },
  'vo-bong-da': {
    nameTemplates: ['Classic Socks', 'Grip Socks Anti-Slip', 'Mercurial Crew', 'Adidas Cushioned Socks'],
    priceRange: [50000, 250000],
    sizes: ['M (35-39)', 'L (40-45)'],
    colors: [['Trắng'], ['Đen'], ['Đỏ'], ['Xanh']],
    footType: 'unisex',
    material: 'Polyester/Cotton/Spandex',
    sole: 'None',
    query: 'soccer socks'
  },
  'ao-bong-da-chinh-hang': {
    nameTemplates: ['Manchester United Home Jersey', 'Real Madrid Away Jersey', 'Arsenal Third Jersey', 'Vietnam National Team Kit'],
    priceRange: [350000, 1800000],
    sizes: ['S', 'M', 'L', 'XL', 'XXL'],
    colors: [['Đỏ'], ['Trắng'], ['Xanh navy'], ['Vàng']],
    footType: 'unisex',
    material: '100% Recycled Polyester',
    sole: 'None',
    query: 'soccer jersey'
  },
  'phu-kien-ra-san': {
    nameTemplates: ['Sport Water Bottle 1L', 'Training Cones Set of 10', 'Captain Armband', 'Sweat Headband'],
    priceRange: [80000, 300000],
    sizes: ['Standard'],
    colors: [['Đen'], ['Đỏ'], ['Xanh']],
    footType: 'unisex',
    material: 'Plastic/Fabric',
    sole: 'None',
    query: 'sports accessory'
  },
  'balo-tui-xach': {
    nameTemplates: ['Academy Gym Bag', 'Classic Backpack 25L', 'Predator Duffle Bag', 'Kamito Sports Pack'],
    priceRange: [400000, 1200000],
    sizes: ['20L', '30L', '40L'],
    colors: [['Đen'], ['Xanh navy'], ['Xám']],
    footType: 'unisex',
    material: 'Polyester waterproof',
    sole: 'None',
    query: 'sports backpack'
  },
  'bo-quan-ao-bong-da': {
    nameTemplates: ['Entrada Football Kit', 'Veloce Match Uniform', 'Strike Training Suit', 'Zocker Pro Kit'],
    priceRange: [250000, 900000],
    sizes: ['S', 'M', 'L', 'XL'],
    colors: [['Xanh dương'], ['Đỏ/Đen'], ['Trắng/Xanh lá']],
    footType: 'unisex',
    material: 'Breathable polyester',
    sole: 'None',
    query: 'football uniform'
  },
  'dep-chinh-hang': {
    nameTemplates: ['Benassi Slides', 'Adilette Shower Slides', 'Puma Cool Cat Slides', 'Under Armour Ansa'],
    priceRange: [350000, 1200000],
    sizes: ['38', '39', '40', '41', '42', '43'],
    colors: [['Đen/Trắng'], ['Trắng'], ['Navy']],
    footType: 'unisex',
    material: 'EVA foam',
    sole: 'EVA sole',
    query: 'slides sandals'
  }
};

let generatedCount = PRODUCTS_TEMPLATE.length;
let categoryKeys = Object.keys(categorySpecs);
let brandIndex = 0;
let categoryIndex = 0;

while (generatedCount < 1000) {
  const catKey = categoryKeys[categoryIndex % categoryKeys.length];
  const spec = categorySpecs[catKey];
  const brand = brandsList[brandIndex % brandsList.length];
  
  const baseName = spec.nameTemplates[Math.floor(Math.random() * spec.nameTemplates.length)];
  const name = `${brand} ${baseName} ${generatedCount}`;
  
  const minPrice = spec.priceRange[0];
  const maxPrice = spec.priceRange[1];
  const originalPrice = Math.floor((minPrice + Math.random() * (maxPrice - minPrice)) / 10000) * 10000;
  const price = Math.floor((originalPrice * (0.8 + Math.random() * 0.2)) / 10000) * 10000;
  
  const colors = spec.colors[Math.floor(Math.random() * spec.colors.length)];
  
  PRODUCTS_TEMPLATE.push({
    name,
    brand,
    category: catKey,
    originalPrice,
    price,
    gender: Math.random() < 0.2 ? 'nu' : (Math.random() < 0.8 ? 'nam' : 'unisex'),
    sizes: spec.sizes,
    colors,
    stock: Math.floor(20 + Math.random() * 100),
    sold: Math.floor(5 + Math.random() * 200),
    rating: Number((4.0 + Math.random() * 1.0).toFixed(1)),
    reviews: Math.floor(3 + Math.random() * 80),
    weight: Math.random() < 0.5 ? Math.floor(200 + Math.random() * 200) : null,
    footType: spec.footType || 'unisex',
    material: spec.material,
    sole: spec.sole,
    tags: [brand.toLowerCase(), catKey.replace('giay-', ''), 'chính hãng'],
    isFeatured: Math.random() < 0.2,
    isNewArrival: Math.random() < 0.3,
    unsplashQuery: `${brand} ${spec.query}`
  });
  
  generatedCount++;
  brandIndex++;
  categoryIndex++;
}

// ============================================================
// MAIN SEEDER
// ============================================================
async function seed() {
  console.log('\n🚀 SOAP Seeder bắt đầu...\n');

  try {
    await sequelize.authenticate();
    console.log('✅ Kết nối MySQL thành công\n');
  } catch (err) {
    console.error('❌ Không kết nối được MySQL:', err.message);
    console.error('   → Đảm bảo đã chạy: docker compose up mysql -d');
    process.exit(1);
  }

  // Disable foreign key checks temporarily to drop referenced tables
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 0');
  
  // Sync tables (force: true drops existing tables to reset the database)
  await Brand.sync({ force: true });
  await Category.sync({ force: true });
  await Product.sync({ force: true });

  // Re-enable foreign key checks
  await sequelize.query('SET FOREIGN_KEY_CHECKS = 1');

  // ── 1. BRANDS ──────────────────────────────────────────────
  console.log('📦 Seeding brands...');
  const brandMap = {};

  for (const b of BRANDS_DATA) {
    try {
      const existing = await Brand.findOne({ where: { name: b.name } });
      if (existing) {
        await existing.update({
          image_url: b.logoUrl || null,
          description: b.description,
        });
        brandMap[b.name] = existing.id;
        console.log(`  🔄 Brand "${b.name}" đã cập nhật logo (id=${existing.id})`);
        continue;
      }

      const brand = await Brand.create({
        name: b.name,
        slug: slugify(b.name),
        description: b.description,
        image_url: b.logoUrl || null,
        is_active: true,
      });
      brandMap[b.name] = brand.id;
      console.log(`  ✅ Brand "${b.name}" (id=${brand.id})`);
    } catch (err) {
      console.error(`  ❌ Brand "${b.name}": ${err.message}`);
    }
  }

  // ── 2. CATEGORIES ──────────────────────────────────────────
  console.log('\n📂 Seeding categories...');
  const categoryMap = {};

  for (const c of CATEGORIES_DATA) {
    try {
      const existing = await Category.findOne({ where: { slug: c.slug } });
      
      let imageUrl = c.imageUrl;
      if (!imageUrl) {
        const query = CATEGORY_QUERIES[c.slug];
        if (query) {
          const imgs = await getPexelsImages(query, 1);
          if (imgs && imgs[0]) imageUrl = imgs[0];
        }
      }
      if (!imageUrl) {
        imageUrl = pickCategoryImage(c.slug);
      }

      if (existing) {
        await existing.update({ image_url: imageUrl });
        categoryMap[c.slug] = existing.id;
        console.log(`  🔄 Category "${c.name}" cập nhật ảnh (id=${existing.id})`);
        continue;
      }

      const category = await Category.create({
        name: c.name,
        slug: c.slug,
        description: c.description,
        image_url: imageUrl,
        type: c.type,
        is_active: true,
      });
      categoryMap[c.slug] = category.id;
      console.log(`  ✅ Category "${c.name}" (id=${category.id})`);
    } catch (err) {
      console.error(`  ❌ Category "${c.name}": ${err.message}`);
    }
  }

  // ── 3. PRODUCTS ────────────────────────────────────────────
  console.log('\n278: 👟 Seeding products...');

  // Pre-fetch unique image pools for categories to prevent duplicates
  const categoryImagePools = {};
  const categoryIndexMap = {};
  
  console.log('\n📸 Pre-fetching Pexels image pools for categories...');
  const uniqueCategorySlugs = [...new Set(PRODUCTS_TEMPLATE.map(p => p.category))];
  
  for (const catSlug of uniqueCategorySlugs) {
    const query = CATEGORY_QUERIES[catSlug] || `${catSlug.replace('-', ' ')} product -people`;
    console.log(`Fetching image pool for category "${catSlug}" with query "${query}"...`);
    
    try {
      const photos = await getUniquePexelsImagesForPool(query, 25);
      categoryImagePools[catSlug] = photos;
      categoryIndexMap[catSlug] = 0;
      console.log(`  -> Obtained ${photos.length} unique images for "${catSlug}"`);
    } catch (err) {
      console.warn(`  -> Failed fetching pool for "${catSlug}": ${err.message}`);
      categoryImagePools[catSlug] = getPlaceholderImages(query, 25);
      categoryIndexMap[catSlug] = 0;
    }
  }

  let created = 0;
  let skipped = 0;

  for (const p of PRODUCTS_TEMPLATE) {
    try {
      const brand_id = brandMap[p.brand] || null;
      const category_id = categoryMap[p.category];

      if (!category_id) {
        console.warn(`  ⚠️  Category "${p.category}" không tìm thấy, bỏ qua "${p.name}"`);
        continue;
      }

      const slug = slugify(p.name) + '-' + Date.now().toString().slice(-5);
      const existing = await Product.findOne({ where: { name: p.name } });
      
      let images = pickProductImages(p.category, p.name, 4);
      // Nếu là ảnh fallback (trùng lặp), dùng ảnh từ pool độc nhất
      if (images && images.length > 1 && images[0] === images[1]) {
        const pool = categoryImagePools[p.category] || [];
        if (pool.length >= 4) {
          const startIdx = categoryIndexMap[p.category];
          images = [
            pool[startIdx % pool.length],
            pool[(startIdx + 1) % pool.length],
            pool[(startIdx + 2) % pool.length],
            pool[(startIdx + 3) % pool.length]
          ];
          categoryIndexMap[p.category] = (startIdx + 4) % pool.length;
        } else {
          const query = p.unsplashQuery || p.name;
          const pexelsImgs = await getPexelsImages(query, 4);
          if (pexelsImgs && pexelsImgs.length > 0) {
            images = pexelsImgs;
          }
        }
      }

      if (existing) {
        await existing.update({ images });
        console.log(`  🔄 "${p.name}" cập nhật ảnh`);
        skipped++;
        continue;
      }

      await Product.create({
        name: p.name,
        slug,
        brand_id,
        category_id,
        description: `${p.name} - ${p.tags?.join(', ')}. Chất liệu: ${p.material}. Đế: ${p.sole}. Màu sắc: ${p.colors.join(', ')}.`,
        original_price: p.originalPrice,
        price: p.price,
        images,
        available_sizes: p.sizes,
        available_colors: p.colors,
        stock: p.stock,
        sold: p.sold,
        rating: p.rating,
        reviews: p.reviews,
        gender: p.gender,
        material: p.material,
        sole: p.sole,
        weight: p.weight || null,
        foot_type: p.footType || 'unisex',
        tags: p.tags,
        is_active: true,
        is_xakho: false,
        is_featured: p.isFeatured,
        is_new_arrival: p.isNewArrival,
      });

      created++;
      console.log(`  ✅ [${created}] "${p.name}" — ${p.price.toLocaleString('vi-VN')}đ`);

    } catch (err) {
      console.error(`  ❌ "${p.name}": ${err.message}`);
    }
  }

  // ── SUMMARY ────────────────────────────────────────────────
  console.log('\n' + '═'.repeat(50));
  console.log('📊 KẾT QUẢ:');
  console.log(`  Brands:     ${Object.keys(brandMap).length} brands`);
  console.log(`  Categories: ${Object.keys(categoryMap).length} categories`);
  console.log(`  Products:   ${created} tạo mới, ${skipped} đã tồn tại`);
  console.log('═'.repeat(50));
  console.log('✅ Seeder hoàn tất!\n');

  await sequelize.close();
}

seed().catch(err => {
  console.error('❌ Seeder lỗi:', err);
  process.exit(1);
});