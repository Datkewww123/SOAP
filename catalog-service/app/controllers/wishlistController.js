const Wishlist = require('../models/Wishlist');
const Product = require('../models/Product');

exports.getWishlist = async (req, res) => {
  try {
    let wishlist = await Wishlist.findOne({ user: req.user.id })
      .populate({
        path: 'items.product',
        select: 'name slug price originalPrice images stock rating reviews isActive',
        populate: {
          path: 'brand category',
          select: 'name slug'
        }
      });

    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user.id, items: [] });
      await wishlist.save();
    }

    wishlist.items = wishlist.items.filter(item => item.product && item.product.isActive);

    res.json({
      success: true,
      wishlist
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.addToWishlist = async (req, res) => {
  try {
    const { productId } = req.body;

    if (!productId) {
      return res.status(400).json({ error: 'Product ID là bắt buộc' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
    }

    if (!product.isActive) {
      return res.status(400).json({ error: 'Sản phẩm không còn khả dụng' });
    }

    let wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
      wishlist = new Wishlist({ user: req.user.id, items: [] });
    }

    const exists = wishlist.items.some(
      item => item.product.toString() === productId
    );

    if (exists) {
      return res.status(400).json({ error: 'Sản phẩm đã có trong danh sách yêu thích' });
    }

    await wishlist.addItem(productId);

    res.json({
      success: true,
      message: 'Đã thêm vào danh sách yêu thích',
      wishlist
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.removeFromWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist không tồn tại' });
    }

    await wishlist.removeItem(productId);

    res.json({
      success: true,
      message: 'Đã xóa khỏi danh sách yêu thích',
      wishlist
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.clearWishlist = async (req, res) => {
  try {
    const wishlist = await Wishlist.findOne({ user: req.user.id });

    if (!wishlist) {
      return res.status(404).json({ error: 'Wishlist không tồn tại' });
    }

    wishlist.items = [];
    await wishlist.save();

    res.json({
      success: true,
      message: 'Đã xóa toàn bộ danh sách yêu thích'
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.checkWishlist = async (req, res) => {
  try {
    const { productId } = req.params;

    const wishlist = await Wishlist.findOne({ user: req.user.id });

    const isInWishlist = wishlist ? wishlist.isInWishlist(productId) : false;

    res.json({
      success: true,
      isInWishlist
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
