const mongoose = require('mongoose');

const wishlistItemSchema = new mongoose.Schema({
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  addedAt: { type: Date, default: Date.now }
}, { _id: false });

const wishlistSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, required: true, unique: true },
  items: [wishlistItemSchema]
}, { timestamps: true });

wishlistSchema.index({ user: 1 });

wishlistSchema.methods.addItem = async function(productId) {
  const exists = this.items.some(item => item.product.toString() === productId.toString());

  if (exists) {
    throw new Error('Sản phẩm đã có trong danh sách yêu thích');
  }

  this.items.push({ product: productId });
  return this.save();
};

wishlistSchema.methods.removeItem = async function(productId) {
  this.items = this.items.filter(item => item.product.toString() !== productId.toString());
  return this.save();
};

wishlistSchema.methods.isInWishlist = function(productId) {
  return this.items.some(item => item.product.toString() === productId.toString());
};

module.exports = mongoose.model('Wishlist', wishlistSchema);
