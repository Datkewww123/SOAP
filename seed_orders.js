/**
 * SOAP — Order Seeder
 * Tạo đơn hàng ảo để test Admin Dashboard
 *
 * Cách chạy:
 *   node seed_orders.js
 *
 * Yêu cầu:
 *   - MySQL container đang chạy
 *   - Đã chạy seed.js trước (có products)
 *   - Đã có ít nhất 1 user trong DB
 */

require('dotenv').config(); // Load root .env
require('dotenv').config({ path: './catalog-service/.env' });

const { Sequelize, DataTypes } = require('sequelize');

// ============================================================
// CONFIG
// ============================================================
const dbHost = process.env.MYSQL_HOST === 'mysql' ? '127.0.0.1' : (process.env.MYSQL_HOST || '127.0.0.1');
const dbPort = process.env.MYSQL_PORT || 3306;
const dbUser = process.env.MYSQL_USER || 'root';
const dbPass = process.env.MYSQL_PASSWORD || 'rootpassword';

const seqIdentity = new Sequelize('soap_identity_db', dbUser, dbPass, {
  host: dbHost, port: dbPort, dialect: 'mysql', logging: false, timezone: '+07:00',
});

const seqCatalog = new Sequelize('soap_catalog_db', dbUser, dbPass, {
  host: dbHost, port: dbPort, dialect: 'mysql', logging: false, timezone: '+07:00',
});

const seqOrder = new Sequelize('soap_order_db', dbUser, dbPass, {
  host: dbHost, port: dbPort, dialect: 'mysql', logging: false,
  define: { underscored: true }, timezone: '+07:00',
});

// ============================================================
// MODELS
// ============================================================
const User = seqIdentity.define('User', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: DataTypes.STRING(100),
  email: DataTypes.STRING(100),
  role: DataTypes.STRING(20),
}, { tableName: 'users', timestamps: true, underscored: true });

const Product = seqCatalog.define('Product', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: DataTypes.STRING(255),
  price: DataTypes.DECIMAL(15, 0),
  images: DataTypes.JSON,
  brand_id: DataTypes.INTEGER,
  available_sizes: DataTypes.JSON,
}, { tableName: 'products', timestamps: true, underscored: true });

const Brand = seqCatalog.define('Brand', {
  id: { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  name: DataTypes.STRING(100),
}, { tableName: 'brands', timestamps: false, underscored: true });

const Order = seqOrder.define('Order', {
  id:                     { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:                { type: DataTypes.INTEGER, allowNull: false },
  user_email:             DataTypes.STRING(100),
  order_code:             { type: DataTypes.STRING(50), unique: true },
  subtotal:               { type: DataTypes.DECIMAL(15, 0), allowNull: false },
  shipping_fee:           { type: DataTypes.DECIMAL(15, 0), defaultValue: 0 },
  discount:               { type: DataTypes.DECIMAL(15, 0), defaultValue: 0 },
  coupon_code:            { type: DataTypes.STRING(50) },
  total:                  { type: DataTypes.DECIMAL(15, 0), allowNull: false },
  payment_method:         { type: DataTypes.ENUM('cod', 'momo', 'vnpay', 'bank_transfer'), defaultValue: 'cod' },
  payment_status:         { type: DataTypes.ENUM('unpaid', 'paid', 'refunded'), defaultValue: 'unpaid' },
  payment_transaction_id: { type: DataTypes.STRING(100) },
  payment_url:            { type: DataTypes.STRING(500) },
  paid_at:                { type: DataTypes.DATE },
  shipping_full_name:     { type: DataTypes.STRING(100), allowNull: false },
  shipping_phone:         { type: DataTypes.STRING(20), allowNull: false },
  shipping_province:      { type: DataTypes.STRING(100) },
  shipping_district:      { type: DataTypes.STRING(100) },
  shipping_ward:          { type: DataTypes.STRING(100) },
  shipping_street:        { type: DataTypes.STRING(255), allowNull: false },
  shipping_note:          { type: DataTypes.STRING(255) },
  status:                 { type: DataTypes.ENUM('pending', 'confirmed', 'shipping', 'delivered', 'cancelled'), defaultValue: 'pending' },
  pending_at:             { type: DataTypes.DATE },
  confirmed_at:           { type: DataTypes.DATE },
  shipping_at:            { type: DataTypes.DATE },
  delivered_at:           { type: DataTypes.DATE },
  cancelled_at:           { type: DataTypes.DATE },
  customer_note:          { type: DataTypes.TEXT },
  admin_note:             { type: DataTypes.TEXT },
  cancel_reason:          { type: DataTypes.TEXT },
}, { tableName: 'orders', timestamps: true, underscored: true });

const OrderItem = seqOrder.define('OrderItem', {
  id:             { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  order_id:       DataTypes.INTEGER,
  product_id:     DataTypes.INTEGER,
  name:           DataTypes.STRING(255),
  price:          DataTypes.DECIMAL(15, 0),
  image:          DataTypes.STRING(500),
  quantity:       DataTypes.INTEGER,
  selected_size:  DataTypes.STRING(20),
  selected_color: DataTypes.STRING(50),
}, { tableName: 'order_items', timestamps: false, underscored: true });

Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items' });
OrderItem.belongsTo(Order, { foreignKey: 'order_id' });

const PromotionUsage = seqOrder.define('PromotionUsage', {
  id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:     { type: DataTypes.INTEGER, allowNull: false },
  coupon_code: { type: DataTypes.STRING(50), allowNull: false },
  order_id:    { type: DataTypes.INTEGER, allowNull: false },
  used_at:     { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
}, { tableName: 'promotion_usages', timestamps: false, underscored: true });

// ============================================================
// HELPERS
// ============================================================
function randomInt(min, max) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function randomItem(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function generateOrderCode() {
  const ts = Date.now().toString().slice(-8);
  const rand = Math.floor(1000 + Math.random() * 9000);
  return `ORD${ts}${rand}`;
}

// Tạo ngày ngẫu nhiên trong khoảng 12 tháng qua
function randomDateInPast(daysAgo) {
  const now = new Date();
  const past = new Date(now - daysAgo * 24 * 60 * 60 * 1000);
  return new Date(past.getTime() + Math.random() * (now.getTime() - past.getTime()));
}

// Tạo ngày trong tháng cụ thể của năm hiện tại
function randomDateInMonth(year, month) {
  const start = new Date(year, month - 1, 1);
  let end = new Date(year, month, 0, 23, 59, 59);
  const now = new Date();
  if (year === now.getFullYear() && month === (now.getMonth() + 1)) {
    end = now;
  }
  return new Date(start.getTime() + Math.random() * (end.getTime() - start.getTime()));
}

const ADDRESSES = [
  { name: 'Nguyễn Văn An', phone: '0901234567', province: 'TP. Hồ Chí Minh', district: 'Quận 1', ward: 'Phường Bến Nghé', street: '123 Lê Lợi' },
  { name: 'Trần Thị Bình', phone: '0912345678', province: 'Hà Nội', district: 'Đống Đa', ward: 'Phường Láng Hạ', street: '45 Chùa Láng' },
  { name: 'Lê Minh Cường', phone: '0923456789', province: 'Đà Nẵng', district: 'Hải Châu', ward: 'Phường Hải Châu 1', street: '78 Trần Phú' },
  { name: 'Phạm Thị Dung', phone: '0934567890', province: 'TP. Hồ Chí Minh', district: 'Bình Thạnh', ward: 'Phường 25', street: '200 Xô Viết Nghệ Tĩnh' },
  { name: 'Hoàng Văn Em', phone: '0945678901', province: 'Cần Thơ', district: 'Ninh Kiều', ward: 'Phường An Hòa', street: '55 Nguyễn Trãi' },
];

const PAYMENT_METHODS = ['cod', 'cod', 'cod', 'momo', 'momo', 'bank_transfer'];
const STATUSES_WEIGHTS = [
  { status: 'delivered', weight: 50 },
  { status: 'shipping', weight: 20 },
  { status: 'confirmed', weight: 15 },
  { status: 'pending', weight: 10 },
  { status: 'cancelled', weight: 5 },
];

function randomStatus() {
  const total = STATUSES_WEIGHTS.reduce((s, w) => s + w.weight, 0);
  let r = Math.random() * total;
  for (const { status, weight } of STATUSES_WEIGHTS) {
    r -= weight;
    if (r <= 0) return status;
  }
  return 'delivered';
}

// ============================================================
// MAIN
// ============================================================
async function seed() {
  console.log('\n🚀 Order Seeder bắt đầu...\n');

  try {
    await seqIdentity.authenticate();
    await seqCatalog.authenticate();
    await seqOrder.authenticate();
    console.log('✅ Kết nối MySQL thành công\n');
  } catch (err) {
    console.error('❌ Không kết nối được MySQL:', err.message);
    process.exit(1);
  }

  // Lấy tất cả users (không phải admin)
  const users = await User.findAll({ where: { role: 'user' } });
  if (users.length === 0) {
    console.error('❌ Không có user nào trong DB!');
    console.error('   → Hãy đăng ký ít nhất 2 tài khoản trước khi chạy seeder này.');
    process.exit(1);
  }
  console.log(`👤 Tìm thấy ${users.length} user(s): ${users.map(u => u.email).join(', ')}\n`);

  // Lấy products
  const products = await Product.findAll();
  if (products.length === 0) {
    console.error('❌ Không có sản phẩm nào! Hãy chạy seed.js trước.');
    process.exit(1);
  }
  console.log(`📦 Tìm thấy ${products.length} sản phẩm\n`);

  // Lấy brands
  const brands = await Brand.findAll();
  const brandMap = {};
  for (const b of brands) brandMap[b.id] = b.name;

  // Reset orders, order items, and promotion usages
  console.log('🧹 Clearing existing orders, order items, and promotion usages...');
  try {
    await seqOrder.query('SET FOREIGN_KEY_CHECKS = 0');
    await OrderItem.sync({ force: true });
    await PromotionUsage.sync({ force: true });
    await Order.sync({ force: true });
    await seqOrder.query('SET FOREIGN_KEY_CHECKS = 1');
    console.log('✅ Tables reset successfully\n');
  } catch (err) {
    console.error('❌ Error resetting tables:', err.message);
    try {
      await seqOrder.query('SET FOREIGN_KEY_CHECKS = 1');
    } catch (_) {}
    process.exit(1);
  }

  const currentYear = new Date().getFullYear();
  const currentMonth = new Date().getMonth() + 1;

  let totalCreated = 0;

  for (let year = 2021; year <= currentYear; year++) {
    const endMonth = (year === currentYear) ? currentMonth : 12;
    console.log(`📅 Tạo đơn hàng cho năm ${year}...`);

    for (let month = 1; month <= endMonth; month++) {
      const count = randomInt(5, 10);
      console.log(`  📆 Tháng ${month}/${year} — ${count} đơn hàng`);

      for (let i = 0; i < count; i++) {
        try {
          // Random user
          const user = randomItem(users);
          const address = randomItem(ADDRESSES);

          // Random 1-4 sản phẩm
          const itemCount = randomInt(1, 3);
          const selectedProducts = [];
          const usedIds = new Set();

          for (let j = 0; j < itemCount; j++) {
            let p;
            let tries = 0;
            do {
              p = randomItem(products);
              tries++;
            } while (usedIds.has(p.id) && tries < 10);
            usedIds.add(p.id);
            selectedProducts.push(p);
          }

          // Tính tiền
          const items = selectedProducts.map(p => {
            const sizes = p.available_sizes || ['38', '39', '40', '41', '42'];
            return {
              productId: p.id,
              name: p.name,
              price: Number(p.price),
              image: (p.images || [])[0] || '',
              quantity: randomInt(1, 2),
              selectedSize: randomItem(sizes),
              brandName: brandMap[p.brand_id] || 'Unknown',
            };
          });

          const subtotal = items.reduce((s, item) => s + item.price * item.quantity, 0);
          const shippingFee = subtotal > 500000 ? 0 : 30000;
          const discount = Math.random() < 0.2 ? Math.round(subtotal * 0.1) : 0;
          const total = subtotal + shippingFee - discount;

          // Status và ngày
          const status = randomStatus();
          const orderDate = randomDateInMonth(year, month);

          const statusDates = {
            pending_at: orderDate,
            confirmed_at: null,
            shipping_at: null,
            delivered_at: null,
            cancelled_at: null,
          };

          if (['confirmed', 'shipping', 'delivered'].includes(status)) {
            statusDates.confirmed_at = new Date(orderDate.getTime() + randomInt(1, 8) * 3600000);
          }
          if (['shipping', 'delivered'].includes(status)) {
            statusDates.shipping_at = new Date(statusDates.confirmed_at.getTime() + randomInt(4, 24) * 3600000);
          }
          if (status === 'delivered') {
            statusDates.delivered_at = new Date(statusDates.shipping_at.getTime() + randomInt(24, 72) * 3600000);
          }
          if (status === 'cancelled') {
            statusDates.cancelled_at = new Date(orderDate.getTime() + randomInt(1, 48) * 3600000);
          }

          // Tạo order
          const order = await Order.create({
            user_id: user.id,
            user_email: user.email,
            order_code: generateOrderCode(),
            subtotal,
            shipping_fee: shippingFee,
            discount,
            total,
            payment_method: randomItem(PAYMENT_METHODS),
            payment_status: status === 'delivered' ? 'paid' : (status === 'cancelled' ? 'refunded' : 'unpaid'),
            shipping_full_name: address.name,
            shipping_phone: address.phone,
            shipping_province: address.province,
            shipping_district: address.district,
            shipping_ward: address.ward,
            shipping_street: address.street,
            status,
            ...statusDates,
            created_at: orderDate,
            updated_at: statusDates.delivered_at || statusDates.cancelled_at || statusDates.shipping_at || statusDates.confirmed_at || orderDate,
            createdAt: orderDate,
            updatedAt: statusDates.delivered_at || statusDates.cancelled_at || statusDates.shipping_at || statusDates.confirmed_at || orderDate,
          });

          // Tạo order items
          await OrderItem.bulkCreate(items.map(item => ({
            order_id: order.id,
            product_id: item.productId,
            name: item.name,
            price: item.price,
            image: item.image,
            quantity: item.quantity,
            selected_size: item.selectedSize,
          })));

          totalCreated++;
          process.stdout.write('.');

        } catch (err) {
          process.stdout.write('x');
          // console.error(`\n  ❌ ${err.message}`);
        }
      }
      console.log(` ✅`);
    }
  }

  // ── SUMMARY ──────────────────────────────────────────────
  const totalOrders = await Order.count();
  const deliveredOrders = await Order.count({ where: { status: 'delivered' } });
  const pendingOrders = await Order.count({ where: { status: 'pending' } });

  console.log('\n' + '═'.repeat(50));
  console.log('📊 KẾT QUẢ:');
  console.log(`  Đơn hàng tạo mới:  ${totalCreated}`);
  console.log(`  Tổng trong DB:      ${totalOrders}`);
  console.log(`  Đã giao (delivered): ${deliveredOrders}`);
  console.log(`  Chờ xử lý (pending): ${pendingOrders}`);
  console.log('═'.repeat(50));
  console.log('✅ Order Seeder hoàn tất!\n');
  console.log('→ Vào http://localhost:5173/admin/dashboard để xem thống kê\n');

  await seqIdentity.close();
  await seqCatalog.close();
  await seqOrder.close();
}

seed().catch(err => {
  console.error('❌ Seeder lỗi:', err.message);
  process.exit(1);
});