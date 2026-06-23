const { getPromotion, getPromotionUsage, getOrder } = require('../models');
const jwt = require('jsonwebtoken');
const { env } = require('../config/environment');

exports.createPromotion = async (req, res) => {
  try {
    const Promotion = getPromotion();
    const data = { ...req.body, code: req.body.code?.toUpperCase() };
    const promotion = await Promotion.create(data);
    res.status(201).json(promotion);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getPromotions = async (req, res) => {
  try {
    const Promotion = getPromotion();
    const where = {};
    if (req.query.active !== undefined) where.active = req.query.active === 'true';
    const promotions = await Promotion.findAll({ where });
    res.json(promotions);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updatePromotion = async (req, res) => {
  try {
    const Promotion = getPromotion();
    const promotion = await Promotion.findByPk(req.params.id);
    if (!promotion) return res.status(404).json({ error: 'Promotion not found' });
    await promotion.update(req.body);
    res.json(promotion);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deletePromotion = async (req, res) => {
  try {
    const Promotion = getPromotion();
    const promotion = await Promotion.findByPk(req.params.id);
    if (!promotion) return res.status(404).json({ error: 'Promotion not found' });
    await promotion.destroy();
    res.json({ message: 'Promotion deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.validateCoupon = async (req, res) => {
  try {
    const Promotion = getPromotion();
    const { code, subtotal = 0 } = req.body;
    if (!code) return res.status(400).json({ valid: false, error: 'Vui lòng nhập mã giảm giá' });

    const promotion = await Promotion.findOne({ where: { code: code.toUpperCase(), active: true } });
    if (!promotion) return res.status(404).json({ valid: false, error: 'Mã giảm giá không tồn tại' });

    const now = new Date();
    if (promotion.start_date && now < promotion.start_date)
      return res.status(400).json({ valid: false, error: 'Mã giảm giá chưa đến hạn' });
    if (promotion.end_date && now > promotion.end_date)
      return res.status(400).json({ valid: false, error: 'Mã giảm giá đã hết hạn' });
    if (promotion.max_uses && promotion.current_uses >= promotion.max_uses)
      return res.status(400).json({ valid: false, error: 'Mã giảm giá đã hết lượt' });

    // Kiểm tra đơn hàng tối thiểu
    if (promotion.min_order_value && Number(subtotal) < Number(promotion.min_order_value)) {
      return res.status(400).json({
        valid: false,
        error: `Đơn hàng tối thiểu ${Number(promotion.min_order_value).toLocaleString('vi-VN')}đ để sử dụng mã này`
      });
    }

    // Xác thực người dùng tùy chọn để kiểm tra giới hạn lượt dùng
    let userId = null;
    let token = req.cookies?.accessToken;
    if (!token) {
      const authHeader = req.headers.authorization;
      if (authHeader && authHeader.startsWith('Bearer ')) {
        token = authHeader.split(' ')[1];
      }
    }
    if (token) {
      try {
        const decoded = jwt.verify(token, env.JWT_SECRET);
        userId = decoded.id;
      } catch (err) {
        // Bỏ qua lỗi token khi validate
      }
    }

    if (promotion.max_uses_per_user && userId) {
      const PromotionUsage = getPromotionUsage();
      const usageCount = await PromotionUsage.count({
        where: { user_id: userId, coupon_code: promotion.code }
      });
      if (usageCount >= promotion.max_uses_per_user) {
        return res.status(400).json({ valid: false, error: 'Bạn đã dùng hết lượt cho mã giảm giá này' });
      }
    }

    const discountValue = promotion.discount_type === 'percentage'
      ? Math.round(subtotal * promotion.discount / 100)
      : Number(promotion.discount);

    res.json({
      valid: true,
      promotion: {
        code: promotion.code,
        description: promotion.description,
        discountType: promotion.discount_type,
        discount: promotion.discount,
        discountValue,
        minOrderValue: promotion.min_order_value,
        maxUsesPerUser: promotion.max_uses_per_user
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getPromotionStats = async (req, res) => {
  try {
    const Promotion = getPromotion();
    const PromotionUsage = getPromotionUsage();
    const Order = getOrder();
    const { code } = req.params;

    const promotion = await Promotion.findOne({ where: { code: code.toUpperCase() } });
    if (!promotion) return res.status(404).json({ error: 'Mã giảm giá không tồn tại' });

    const usages = await PromotionUsage.findAll({ where: { coupon_code: promotion.code } });
    const orders = await Order.findAll({
      where: { coupon_code: promotion.code },
      attributes: ['id', 'order_code', 'user_email', 'discount', 'total', 'status', 'created_at']
    });

    const totalDiscountGiven = orders.reduce((sum, o) => sum + Number(o.discount), 0);

    res.json({
      code: promotion.code,
      total_uses: usages.length,
      total_discount_given: totalDiscountGiven,
      orders
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};