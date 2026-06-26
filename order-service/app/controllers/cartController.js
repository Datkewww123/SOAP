const { getCartItem } = require('../models');

exports.getCart = async (req, res) => {
  try {
    const CartItem = getCartItem();
    const items = await CartItem.findAll({
      where: { user_id: req.user.id },
      order: [['created_at', 'DESC']],
    });
    res.json({ success: true, data: items });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.addToCart = async (req, res) => {
  try {
    const CartItem = getCartItem();
    const { productId, name, price, image, quantity, selectedSize, productSlug } = req.body;

    if (!productId || !name || !price) {
      return res.status(400).json({ success: false, message: 'Thiếu thông tin sản phẩm' });
    }

    const existing = await CartItem.findOne({
      where: {
        user_id: req.user.id,
        product_id: productId,
        selected_size: selectedSize || null,
      },
    });

    if (existing) {
      existing.quantity += quantity || 1;
      await existing.save();
      return res.json({ success: true, data: existing });
    }

    const item = await CartItem.create({
      user_id: req.user.id,
      product_id: productId,
      name,
      price,
      image: image || null,
      quantity: quantity || 1,
      selected_size: selectedSize || null,
      product_slug: productSlug || null,
    });

    res.status(201).json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.updateCartItem = async (req, res) => {
  try {
    const CartItem = getCartItem();
    const item = await CartItem.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm trong giỏ' });
    }

    const { quantity } = req.body;
    if (quantity < 1) {
      return res.status(400).json({ success: false, message: 'Số lượng phải lớn hơn 0' });
    }

    item.quantity = quantity;
    await item.save();

    res.json({ success: true, data: item });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.removeCartItem = async (req, res) => {
  try {
    const CartItem = getCartItem();
    const item = await CartItem.findOne({
      where: { id: req.params.id, user_id: req.user.id },
    });

    if (!item) {
      return res.status(404).json({ success: false, message: 'Không tìm thấy sản phẩm trong giỏ' });
    }

    await item.destroy();
    res.json({ success: true, message: 'Đã xóa sản phẩm khỏi giỏ hàng' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

exports.clearCartItems = async (req, res) => {
  try {
    const CartItem = getCartItem();
    const { ids } = req.body;

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return res.status(400).json({ success: false, message: 'Danh sách ID không hợp lệ' });
    }

    await CartItem.destroy({
      where: { id: ids, user_id: req.user.id },
    });

    res.json({ success: true, message: 'Đã xóa các sản phẩm đã chọn khỏi giỏ' });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
