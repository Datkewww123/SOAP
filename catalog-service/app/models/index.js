const mysqlDatabase = require('../database/mysql.database');
const { DataTypes } = require('sequelize');

let Brand, Category, Product, Review, Wishlist, News;

function initModels() {
  const sequelize = mysqlDatabase.getSequelize();

  // --- BRAND ---
  Brand = sequelize.define('Brand', {
    id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name:        { type: DataTypes.STRING(100), allowNull: false, unique: true },
    slug:        { type: DataTypes.STRING(100), unique: true },
    description: { type: DataTypes.TEXT },
    image_url:   { type: DataTypes.STRING(500) },
    is_active:   { type: DataTypes.BOOLEAN, defaultValue: true },
  }, { tableName: 'brands', timestamps: true, underscored: true });

  // --- CATEGORY ---
  Category = sequelize.define('Category', {
    id:          { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name:        { type: DataTypes.STRING(100), allowNull: false, unique: true },
    slug:        { type: DataTypes.STRING(100), unique: true },
    description: { type: DataTypes.TEXT },
    image_url:   { type: DataTypes.STRING(500) },
    type:        { type: DataTypes.STRING(50), defaultValue: 'standard' },
    is_active:   { type: DataTypes.BOOLEAN, defaultValue: true },
  }, { tableName: 'categories', timestamps: true, underscored: true });

  // --- PRODUCT ---
  Product = sequelize.define('Product', {
    id:             { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    name:           { type: DataTypes.STRING(255), allowNull: false },
    slug:           { type: DataTypes.STRING(255), unique: true },
    brand_id:       { type: DataTypes.INTEGER },
    category_id:    { type: DataTypes.INTEGER, allowNull: false },
    description:    { type: DataTypes.TEXT },
    original_price: { type: DataTypes.DECIMAL(15, 0) },
    price:          { type: DataTypes.DECIMAL(15, 0), allowNull: false },
    images:         { type: DataTypes.JSON },
    available_sizes:  { type: DataTypes.JSON },
    available_colors: { type: DataTypes.JSON },
    stock:          { type: DataTypes.INTEGER, defaultValue: 0 },
    sold:           { type: DataTypes.INTEGER, defaultValue: 0 },
    rating:         { type: DataTypes.DECIMAL(3, 2), defaultValue: 0 },
    reviews:        { type: DataTypes.INTEGER, defaultValue: 0 },
    gender:         { type: DataTypes.ENUM('nam', 'nu', 'unisex'), defaultValue: 'unisex' },
    material:       { type: DataTypes.STRING(100) },
    sole:           { type: DataTypes.STRING(100) },
    weight:         { type: DataTypes.INTEGER },
    foot_type:      { type: DataTypes.ENUM('thon', 'be', 'unisex'), defaultValue: 'unisex' },
    tags:           { type: DataTypes.JSON },
    is_active:      { type: DataTypes.BOOLEAN, defaultValue: true },
    is_xakho:       { type: DataTypes.BOOLEAN, defaultValue: false },
    is_featured:    { type: DataTypes.BOOLEAN, defaultValue: false },
    is_new_arrival: { type: DataTypes.BOOLEAN, defaultValue: false },
  }, { tableName: 'products', timestamps: true, underscored: true });

  // --- REVIEW ---
  Review = sequelize.define('Review', {
    id:                  { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id:             { type: DataTypes.INTEGER, allowNull: false },
    product_id:          { type: DataTypes.INTEGER, allowNull: false },
    rating:              { type: DataTypes.INTEGER, allowNull: false },
    title:               { type: DataTypes.STRING(200) },
    comment:             { type: DataTypes.TEXT, allowNull: false },
    images:              { type: DataTypes.JSON },
    is_verified_purchase: { type: DataTypes.BOOLEAN, defaultValue: false },
    status:              { type: DataTypes.ENUM('pending', 'approved', 'rejected'), defaultValue: 'pending' },
    helpful_count:       { type: DataTypes.INTEGER, defaultValue: 0 },
    admin_reply:         { type: DataTypes.TEXT },
    admin_replied_at:    { type: DataTypes.DATE },
  }, { tableName: 'reviews', timestamps: true, underscored: true });

  // --- WISHLIST ---
  Wishlist = sequelize.define('Wishlist', {
    id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    user_id:    { type: DataTypes.INTEGER, allowNull: false },
    product_id: { type: DataTypes.INTEGER, allowNull: false },
  }, { tableName: 'wishlists', timestamps: true, underscored: true });

  // --- NEWS ---
  News = sequelize.define('News', {
    id:         { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
    title:      { type: DataTypes.STRING(255), allowNull: false },
    slug:       { type: DataTypes.STRING(255), unique: true },
    content:    { type: DataTypes.TEXT },
    image_url:  { type: DataTypes.STRING(500) },
    link_url:   { type: DataTypes.STRING(500) },
    is_active:  { type: DataTypes.BOOLEAN, defaultValue: true },
  }, { tableName: 'news', timestamps: true, underscored: true });

  // --- ASSOCIATIONS ---
  Brand.hasMany(Product,    { foreignKey: 'brand_id',    as: 'products' });
  Product.belongsTo(Brand,  { foreignKey: 'brand_id',    as: 'brand' });

  Category.hasMany(Product,   { foreignKey: 'category_id', as: 'products' });
  Product.belongsTo(Category, { foreignKey: 'category_id', as: 'category' });

  Product.hasMany(Review,   { foreignKey: 'product_id', as: 'productReviews', onDelete: 'CASCADE' });
  Review.belongsTo(Product, { foreignKey: 'product_id' });

  Product.hasMany(Wishlist,   { foreignKey: 'product_id', as: 'wishlists', onDelete: 'CASCADE' });
  Wishlist.belongsTo(Product, { foreignKey: 'product_id' });

  // --- HOOKS ---
  const updateProductRating = async (productId) => {
    try {
      const stats = await Review.findAll({
        where: { product_id: productId, status: 'approved' },
        attributes: [
          [sequelize.fn('AVG', sequelize.col('rating')), 'avgRating'],
          [sequelize.fn('COUNT', sequelize.col('id')), 'totalReviews']
        ],
        raw: true
      });

      const avgRating = stats[0] && stats[0].avgRating ? parseFloat(stats[0].avgRating) : 0;
      const totalReviews = stats[0] && stats[0].totalReviews ? parseInt(stats[0].totalReviews, 10) : 0;

      await Product.update(
        {
          rating: Math.round(avgRating * 10) / 10,
          reviews: totalReviews
        },
        { where: { id: productId } }
      );
    } catch (err) {
      console.error('Error updating product rating:', err);
    }
  };

  Review.afterSave(async (review, options) => {
    await updateProductRating(review.product_id);
  });

  Review.afterDestroy(async (review, options) => {
    await updateProductRating(review.product_id);
  });

  return { Brand, Category, Product, Review, Wishlist, News };
}

function getBrand()    { return Brand; }
function getCategory() { return Category; }
function getProduct()  { return Product; }
function getReview()   { return Review; }
function getWishlist() { return Wishlist; }
function getNews()     { return News; }

module.exports = { initModels, getBrand, getCategory, getProduct, getReview, getWishlist, getNews };