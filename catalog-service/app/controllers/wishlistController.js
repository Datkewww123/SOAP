const { getWishlist, getProduct } = require('../models');

exports.getWishlist = async (req, res) => {
  try {
    const Wishlist = getWishlist();
    const Product = getProduct();
    const items = await Wishlist.findAll({
      where: { user_id: req.user.id },
      include: [{ model: Product, as: 'product', attributes: ['id','name','slug','price','original_price','images','stock','rating','is_active'] }]
    });
    res.json({ success: true, wishlist: { items } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.addToWishlist = async (req, res) => {
  try {
    const Wishlist = getWishlist();
    const Product = getProduct();
    const { productId } = req.body;
    if (!productId) return res.status(400).json({ error: 'Product ID là bắt buộc' });

    const product = await Product.findByPk(productId);
    if (!product) return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
    if (!product.is_active) return res.status(400).json({ error: 'Sản phẩm không còn khả dụng' });

    const exists = await Wishlist.findOne({ where: { user_id: req.user.id, product_id: productId } });
    if (exists) return res.status(400).json({ error: 'Sản phẩm đã có trong danh sách yêu thích' });

    await Wishlist.create({ user_id: req.user.id, product_id: productId });
    res.json({ success: true, message: 'Đã thêm vào danh sách yêu thích' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.removeFromWishlist = async (req, res) => {
  try {
    const Wishlist = getWishlist();
    const item = await Wishlist.findOne({ where: { user_id: req.user.id, product_id: req.params.productId } });
    if (!item) return res.status(404).json({ error: 'Không tìm thấy trong wishlist' });
    await item.destroy();
    res.json({ success: true, message: 'Đã xóa khỏi danh sách yêu thích' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.clearWishlist = async (req, res) => {
  try {
    const Wishlist = getWishlist();
    await Wishlist.destroy({ where: { user_id: req.user.id } });
    res.json({ success: true, message: 'Đã xóa toàn bộ danh sách yêu thích' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.checkWishlist = async (req, res) => {
  try {
    const Wishlist = getWishlist();
    const item = await Wishlist.findOne({ where: { user_id: req.user.id, product_id: req.params.productId } });
    res.json({ success: true, isInWishlist: !!item });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};