const mysqlDatabase = require('../database/mysql.database');
const { DataTypes } = require('sequelize');

let Order, OrderItem, Promotion, PromotionUsage, CartItem;

function initModels() {
  const sequelize = mysqlDatabase.getSequelize();

  // --- PROMOTION ---
  Promotion = sequelize.define('Promotion', {
    id:                 { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    code:               { type: DataTypes.STRING(50), allowNull: false, unique: true },
    description:        { type: DataTypes.TEXT },
    discount:           { type: DataTypes.DECIMAL(10, 2), allowNull: false },
    discount_type:      { type: DataTypes.ENUM('percentage', 'fixed'), defaultValue: 'percentage' },
    max_uses:           { type: DataTypes.INTEGER },
    current_uses:       { type: DataTypes.INTEGER, defaultValue: 0 },
    active:             { type: DataTypes.BOOLEAN, defaultValue: true },
    start_date:         { type: DataTypes.DATE },
    end_date:           { type: DataTypes.DATE },
    max_uses_per_user:  { type: DataTypes.INTEGER, allowNull: true, defaultValue: null },
    min_order_value:    { type: DataTypes.DECIMAL(15, 0), allowNull: true, defaultValue: 0 },
  }, { tableName: 'promotions', timestamps: true, underscored: true });

  // --- ORDER ---
  Order = sequelize.define('Order', {
    id:                     { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id:                { type: DataTypes.INTEGER, allowNull: false },
    user_email:             { type: DataTypes.STRING(100) },
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
    // Shipping address (flatten thay vì nested object)
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

  // --- ORDER ITEM ---
  OrderItem = sequelize.define('OrderItem', {
    id:             { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    order_id:       { type: DataTypes.INTEGER, allowNull: false },
    product_id:     { type: DataTypes.INTEGER, allowNull: false },
    name:           { type: DataTypes.STRING(255), allowNull: false },
    price:          { type: DataTypes.DECIMAL(15, 0), allowNull: false },
    image:          { type: DataTypes.STRING(500) },
    quantity:       { type: DataTypes.INTEGER, allowNull: false },
    selected_size:  { type: DataTypes.STRING(20) },
    selected_color: { type: DataTypes.STRING(50) },
  }, { tableName: 'order_items', timestamps: false, underscored: true });

  // --- PROMOTION USAGE ---
  PromotionUsage = sequelize.define('PromotionUsage', {
    id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id:     { type: DataTypes.INTEGER, allowNull: false },
    coupon_code: { type: DataTypes.STRING(50), allowNull: false },
    order_id:    { type: DataTypes.INTEGER, allowNull: false },
    used_at:     { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  }, { tableName: 'promotion_usages', timestamps: false, underscored: true });

  // --- CART ITEM ---
  CartItem = sequelize.define('CartItem', {
    id:             { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id:        { type: DataTypes.INTEGER, allowNull: false },
    product_id:     { type: DataTypes.INTEGER, allowNull: false },
    name:           { type: DataTypes.STRING(255), allowNull: false },
    price:          { type: DataTypes.DECIMAL(15, 0), allowNull: false },
    image:          { type: DataTypes.STRING(500) },
    quantity:       { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
    selected_size:  { type: DataTypes.STRING(20) },
    product_slug:   { type: DataTypes.STRING(255) },
  }, { tableName: 'cart_items', timestamps: true, underscored: true });

  // --- ASSOCIATIONS ---
  Order.hasMany(OrderItem, { foreignKey: 'order_id', as: 'items', onDelete: 'CASCADE' });
  OrderItem.belongsTo(Order, { foreignKey: 'order_id' });

  return { Order, OrderItem, Promotion, PromotionUsage, CartItem };
}

// Helper tạo order code
function generateOrderCode() {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ORD${timestamp}${random}`;
}

function getOrder()          { return Order; }
function getOrderItem()      { return OrderItem; }
function getPromotion()      { return Promotion; }
function getPromotionUsage() { return PromotionUsage; }
function getCartItem()       { return CartItem; }

module.exports = { initModels, generateOrderCode, getOrder, getOrderItem, getPromotion, getPromotionUsage, getCartItem };