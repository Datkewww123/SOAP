const { getOrder, getOrderItem, getPromotion, getPromotionUsage, generateOrderCode } = require('../models');
const { Op } = require('sequelize');
const axios = require('axios');
const eventBus = require('../utils/eventBus');

const CATALOG_SERVICE_URL  = process.env.CATALOG_SERVICE_URL  || 'http://catalog-service:3002';
const PAYMENT_SERVICE_URL  = process.env.PAYMENT_SERVICE_URL  || 'http://payment-service:3004';
const IDENTITY_SERVICE_URL = process.env.IDENTITY_SERVICE_URL || 'http://identity-service:3001';

exports.createOrder = async (req, res) => {
  try {
    const Order = getOrder();
    const OrderItem = getOrderItem();
    const Promotion = getPromotion();
    const { items, shippingAddress, paymentMethod = 'cod', customerNote, couponCode, discount = 0, shippingFee = 0 } = req.body;

    if (!items || items.length === 0) return res.status(400).json({ error: 'Items không thể rỗng' });
    if (!shippingAddress?.fullName || !shippingAddress?.phone || !shippingAddress?.street)
      return res.status(400).json({ error: 'Thông tin địa chỉ giao hàng không đầy đủ' });

    const subtotal = items.reduce((sum, item) => sum + item.price * item.quantity, 0);

    // Validate coupon
    let appliedDiscount = Number(discount) || 0;
    let appliedCouponCode = null;
    if (couponCode) {
      const promotion = await Promotion.findOne({ where: { code: couponCode.toUpperCase(), active: true } });
      if (!promotion) return res.status(400).json({ error: 'Mã giảm giá không tồn tại' });
      const now = new Date();
      if (promotion.start_date && now < promotion.start_date) return res.status(400).json({ error: 'Mã giảm giá chưa đến hạn' });
      if (promotion.end_date && now > promotion.end_date) return res.status(400).json({ error: 'Mã giảm giá đã hết hạn' });
      if (promotion.max_uses && promotion.current_uses >= promotion.max_uses) return res.status(400).json({ error: 'Mã giảm giá đã hết lượt' });

      // Kiểm tra đơn hàng tối thiểu
      if (promotion.min_order_value && subtotal < promotion.min_order_value) {
        return res.status(400).json({ error: `Đơn hàng tối thiểu ${Number(promotion.min_order_value).toLocaleString('vi-VN')}đ để sử dụng mã này` });
      }

      // Kiểm tra giới hạn số lần sử dụng của mỗi user
      if (promotion.max_uses_per_user) {
        const PromotionUsage = getPromotionUsage();
        const usageCount = await PromotionUsage.count({
          where: { user_id: req.user.id, coupon_code: promotion.code }
        });
        if (usageCount >= promotion.max_uses_per_user) {
          return res.status(400).json({ error: 'Bạn đã dùng hết lượt cho mã giảm giá này' });
        }
      }

      appliedDiscount = promotion.discount_type === 'percentage'
        ? Math.round(subtotal * promotion.discount / 100)
        : Number(promotion.discount);
      appliedCouponCode = promotion.code;
      await promotion.increment('current_uses');
    }

    const total = subtotal + Number(shippingFee) - appliedDiscount;
    if (total < 0) return res.status(400).json({ error: 'Tổng tiền không hợp lệ' });

    // Trừ stock
    for (const item of items) {
      const response = await axios.post(
        `${CATALOG_SERVICE_URL}/api/products/${item.productId}/reduce-stock`,
        { quantity: item.quantity },
        { headers: { 'x-internal-key': process.env.INTERNAL_API_KEY } }
      );
      if (!response.data.success) return res.status(400).json({ error: response.data.error });
    }

    // Tạo order
    const order = await Order.create({
      user_id: req.user.id,
      order_code: generateOrderCode(),
      subtotal, shipping_fee: shippingFee,
      discount: appliedDiscount, coupon_code: appliedCouponCode,
      total, payment_method: paymentMethod,
      shipping_full_name: shippingAddress.fullName,
      shipping_phone: shippingAddress.phone,
      shipping_province: shippingAddress.province,
      shipping_district: shippingAddress.district,
      shipping_ward: shippingAddress.ward,
      shipping_street: shippingAddress.street,
      shipping_note: shippingAddress.note,
      customer_note: customerNote,
      status: 'pending', pending_at: new Date(),
    });

    // Tạo order items
    await OrderItem.bulkCreate(items.map(item => ({
      order_id: order.id,
      product_id: item.productId,
      name: item.name, price: item.price,
      image: item.image, quantity: item.quantity,
      selected_size: item.selectedSize, selected_color: item.selectedColor,
    })));

    // Ghi nhận sử dụng mã giảm giá
    if (appliedCouponCode) {
      const PromotionUsage = getPromotionUsage();
      await PromotionUsage.create({
        user_id: req.user.id,
        coupon_code: appliedCouponCode,
        order_id: order.id,
      });
    }

    // Lấy email user
    try {
      const userRes = await axios.get(`${IDENTITY_SERVICE_URL}/api/users/${req.user.id}`, { headers: { 'x-internal-key': process.env.INTERNAL_API_KEY } });
      if (userRes.data?.email) await order.update({ user_email: userRes.data.email });
    } catch (e) { console.error('Failed to fetch user email:', e.message); }

    // MoMo payment
    let paymentUrl = null;
    if (paymentMethod === 'momo') {
      try {
        const momoRes = await axios.post(`${PAYMENT_SERVICE_URL}/api/payment/create`,
          { orderId: order.id.toString(), amount: total, orderInfo: `Thanh toan don hang ${order.order_code}` },
          { headers: { 'x-internal-key': process.env.INTERNAL_API_KEY } }
        );
        if (momoRes.data.success) {
          paymentUrl = momoRes.data.data.payUrl;
          await order.update({ payment_url: paymentUrl });
        }
      } catch (e) { console.error('MoMo failed:', e.message); }
    }

    const orderWithItems = await Order.findByPk(order.id, { include: [{ model: OrderItem, as: 'items' }] });
    setImmediate(() => eventBus.publishOrderCreated(orderWithItems));

    res.status(201).json({
      success: true, statusCode: 201, message: 'Đặt hàng thành công',
      data: { _id: order.id, orderCode: order.order_code, total: order.total, status: order.status, paymentMethod: order.payment_method, paymentUrl, createdAt: order.created_at }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getOrders = async (req, res) => {
  try {
    const Order = getOrder();
    const OrderItem = getOrderItem();
    const { page = 1, limit = 10, status } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const where = { user_id: req.user.id };
    if (status) where.status = status;

    const { count, rows: orders } = await Order.findAndCountAll({
      where, include: [{ model: OrderItem, as: 'items' }],
      order: [['created_at', 'DESC']], limit: Number(limit), offset
    });
    res.json({ orders, pagination: { currentPage: Number(page), totalPages: Math.ceil(count / limit), total: count, limit: Number(limit) } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getOrder = async (req, res) => {
  try {
    const Order = getOrder();
    const OrderItem = getOrderItem();
    const order = await Order.findByPk(req.params.id, { include: [{ model: OrderItem, as: 'items' }] });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.user_id !== req.user.id && req.user.role !== 'admin')
      return res.status(403).json({ error: 'Không có quyền truy cập' });
    res.json(order);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateOrder = async (req, res) => {
  try {
    const Order = getOrder();
    const OrderItem = getOrderItem();
    const { status, paymentStatus, adminNote } = req.body;
    const validStatuses = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'];
    if (status && !validStatuses.includes(status)) return res.status(400).json({ error: 'Status không hợp lệ' });

    const order = await Order.findByPk(req.params.id, { include: [{ model: OrderItem, as: 'items' }] });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    const updates = {};
    if (status && status !== order.status) {
      const current = order.status;
      let isValidTransition = false;
      if (current === 'pending') {
        isValidTransition = (status === 'confirmed' || status === 'cancelled');
      } else if (current === 'confirmed') {
        isValidTransition = (status === 'shipping' || status === 'cancelled');
      } else if (current === 'shipping') {
        isValidTransition = (status === 'delivered' || status === 'cancelled');
      } else {
        isValidTransition = false;
      }

      if (!isValidTransition) {
        return res.status(400).json({
          error: `Không thể chuyển trạng thái từ ${current} sang ${status}. Trạng thái phải đi tuần tự: pending -> confirmed -> shipping -> delivered.`
        });
      }
      updates.status = status;
      if (status === 'confirmed') updates.confirmed_at = new Date();
      if (status === 'shipping')  updates.shipping_at  = new Date();
      if (status === 'delivered') {
        updates.delivered_at = new Date();
        updates.payment_status = 'paid';
        updates.paid_at = new Date();
        for (const item of order.items) {
          try {
            await axios.post(`${CATALOG_SERVICE_URL}/api/products/${item.product_id}/increment-sold`,
              { quantity: item.quantity }, { headers: { 'x-internal-key': process.env.INTERNAL_API_KEY } });
          } catch (e) { console.error('increment-sold failed:', e.message); }
        }
        setImmediate(() => eventBus.publishOrderDelivered(order));
      }
      if (status === 'cancelled') {
        updates.cancelled_at = new Date();
        for (const item of order.items) {
          try {
            await axios.post(`${CATALOG_SERVICE_URL}/api/products/${item.product_id}/restore-stock`,
              { quantity: item.quantity }, { headers: { 'x-internal-key': process.env.INTERNAL_API_KEY } });
          } catch (e) { console.error('restore-stock failed:', e.message); }
        }
        if (order.coupon_code) {
          try {
            const Promotion = getPromotion();
            const PromotionUsage = getPromotionUsage();
            const promo = await Promotion.findOne({ where: { code: order.coupon_code } });
            if (promo && promo.current_uses > 0) {
              await promo.decrement('current_uses');
            }
            await PromotionUsage.destroy({ where: { order_id: order.id } });
          } catch (e) { console.error('Rollback coupon failed in updateOrder:', e.message); }
        }
        setImmediate(() => eventBus.publishOrderCancelled(order));
      }
    }
    if (paymentStatus) { updates.payment_status = paymentStatus; if (paymentStatus === 'paid') updates.paid_at = new Date(); }
    if (adminNote) updates.admin_note = adminNote;

    await order.update(updates);
    res.json({ success: true, message: 'Cập nhật đơn hàng thành công', order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.cancelOrder = async (req, res) => {
  try {
    const Order = getOrder();
    const OrderItem = getOrderItem();
    const { cancelReason } = req.body;
    const order = await Order.findByPk(req.params.id, { include: [{ model: OrderItem, as: 'items' }] });
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.user_id !== req.user.id && req.user.role !== 'admin') return res.status(403).json({ error: 'Không có quyền hủy' });
    if (!['pending', 'confirmed', 'shipping'].includes(order.status)) return res.status(400).json({ error: 'Không thể hủy đơn hàng ở trạng thái hiện tại' });

    await order.update({ status: 'cancelled', cancelled_at: new Date(), cancel_reason: cancelReason });

    for (const item of order.items) {
      try {
        await axios.post(`${CATALOG_SERVICE_URL}/api/products/${item.product_id}/restore-stock`,
          { quantity: item.quantity }, { headers: { 'x-internal-key': process.env.INTERNAL_API_KEY } });
      } catch (e) { console.error('restore-stock failed:', e.message); }
    }
    if (order.coupon_code) {
      try {
        const Promotion = getPromotion();
        const PromotionUsage = getPromotionUsage();
        const promo = await Promotion.findOne({ where: { code: order.coupon_code } });
        if (promo && promo.current_uses > 0) {
          await promo.decrement('current_uses');
        }
        await PromotionUsage.destroy({ where: { order_id: order.id } });
      } catch (e) { console.error('Rollback coupon failed in cancelOrder:', e.message); }
    }
    setImmediate(() => eventBus.publishOrderCancelled(order));
    res.json({ success: true, message: 'Hủy đơn hàng thành công', order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteOrder = async (req, res) => {
  try {
    const Order = getOrder();
    if (req.user.role !== 'admin') return res.status(403).json({ error: 'Không có quyền xóa' });
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ error: 'Order not found' });
    if (order.status !== 'cancelled') return res.status(400).json({ error: 'Chỉ xóa được đơn đã hủy' });
    await order.destroy();
    res.json({ success: true, message: 'Đã xóa đơn hàng', id: req.params.id });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getOrderHistory = async (req, res) => {
  try {
    const Order = getOrder();
    const OrderItem = getOrderItem();
    const { page = 1, limit = 10 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const { count, rows: orders } = await Order.findAndCountAll({
      where: { user_id: req.user.id, status: 'delivered' },
      include: [{ model: OrderItem, as: 'items' }],
      order: [['created_at', 'DESC']], limit: Number(limit), offset
    });
    res.json({ success: true, orders, pagination: { currentPage: Number(page), totalPages: Math.ceil(count / limit), total: count, limit: Number(limit) } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updatePaymentStatus = async (req, res) => {
  try {
    const Order = getOrder();
    const { paymentStatus, paymentTransactionId } = req.body;
    const order = await Order.findByPk(req.params.id);
    if (!order) return res.status(404).json({ success: false, message: 'Order not found' });

    const updates = { payment_status: paymentStatus };
    if (paymentTransactionId) updates.payment_transaction_id = paymentTransactionId;
    if (paymentStatus === 'paid') updates.paid_at = new Date();
    await order.update(updates);

    if (paymentStatus === 'paid') setImmediate(() => eventBus.publishOrderPaid(order));
    res.json({ success: true, message: 'Payment status updated' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getAllOrders = async (req, res) => {
  try {
    const Order = getOrder();
    const OrderItem = getOrderItem();
    const { page = 1, limit = 20, status, search } = req.query;
    const offset = (Number(page) - 1) * Number(limit);
    const where = {};
    if (status) where.status = status;
    if (search) {
      where[Op.or] = [
        { order_code: { [Op.like]: `%${search}%` } },
        { user_email: { [Op.like]: `%${search}%` } },
        { shipping_full_name: { [Op.like]: `%${search}%` } },
        { shipping_phone: { [Op.like]: `%${search}%` } },
      ];
    }
    const { count, rows: orders } = await Order.findAndCountAll({
      where, include: [{ model: OrderItem, as: 'items' }],
      order: [['created_at', 'DESC']], limit: Number(limit), offset
    });
    res.json({ success: true, data: { orders, pagination: { total: count, page: Number(page), pages: Math.ceil(count / Number(limit)) } } });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.updateOrderStatus = async (req, res) => {
  try {
    const Order = getOrder();
    const OrderItem = getOrderItem();
    const { status } = req.body;
    const validStatuses = ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'];
    if (status && !validStatuses.includes(status)) return res.status(400).json({ error: 'Status không hợp lệ' });

    const order = await Order.findByPk(req.params.id, { include: [{ model: OrderItem, as: 'items' }] });
    if (!order) return res.status(404).json({ error: 'Order not found' });

    if (status && status !== order.status) {
      const current = order.status;
      let isValidTransition = false;
      if (current === 'pending') {
        isValidTransition = (status === 'confirmed' || status === 'cancelled');
      } else if (current === 'confirmed') {
        isValidTransition = (status === 'shipping' || status === 'cancelled');
      } else if (current === 'shipping') {
        isValidTransition = (status === 'delivered' || status === 'cancelled');
      } else {
        isValidTransition = false;
      }

      if (!isValidTransition) {
        return res.status(400).json({
          error: `Không thể chuyển trạng thái từ ${current} sang ${status}. Trạng thái phải đi tuần tự: pending -> confirmed -> shipping -> delivered.`
        });
      }
    }

    const updates = { status };
    if (status === 'confirmed') updates.confirmed_at = new Date();
    if (status === 'shipping')  updates.shipping_at  = new Date();
    if (status === 'delivered') {
      updates.delivered_at = new Date(); updates.payment_status = 'paid'; updates.paid_at = new Date();
      for (const item of order.items) {
        try { await axios.post(`${CATALOG_SERVICE_URL}/api/products/${item.product_id}/increment-sold`, { quantity: item.quantity }, { headers: { 'x-internal-key': process.env.INTERNAL_API_KEY } }); }
        catch (e) { console.error('increment-sold failed:', e.message); }
      }
      setImmediate(() => eventBus.publishOrderDelivered(order));
    }
    if (status === 'cancelled' && order.status !== 'cancelled') {
      updates.cancelled_at = new Date();
      for (const item of order.items) {
        try { await axios.post(`${CATALOG_SERVICE_URL}/api/products/${item.product_id}/restore-stock`, { quantity: item.quantity }, { headers: { 'x-internal-key': process.env.INTERNAL_API_KEY } }); }
        catch (e) { console.error('restore-stock failed:', e.message); }
      }
      if (order.coupon_code) {
        try {
          const Promotion = getPromotion();
          const PromotionUsage = getPromotionUsage();
          const promo = await Promotion.findOne({ where: { code: order.coupon_code } });
          if (promo && promo.current_uses > 0) {
            await promo.decrement('current_uses');
          }
          await PromotionUsage.destroy({ where: { order_id: order.id } });
        } catch (e) { console.error('Rollback coupon failed in updateOrderStatus:', e.message); }
      }
      setImmediate(() => eventBus.publishOrderCancelled(order));
    }
    await order.update(updates);
    res.json({ success: true, message: 'Cập nhật trạng thái thành công', order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getOrderStatsSummary = async (req, res) => {
  try {
    const Order = getOrder();
    const OrderItem = getOrderItem();
    const mysqlDatabase = require('../database/mysql.database');
    const sequelize = mysqlDatabase.getSequelize();
    const { fn, col, literal } = require('sequelize');
    const { date, month, year, quarter } = req.query;

    // Build date filter
    let dateWhere = {};
    if (date) {
      const start = new Date(date); start.setHours(0,0,0,0);
      const end = new Date(date); end.setHours(23,59,59,999);
      dateWhere = { created_at: { [Op.between]: [start, end] } };
    } else if (month) {
      const [y, m] = month.split('-').map(Number);
      dateWhere = { created_at: { [Op.between]: [new Date(y, m-1, 1), new Date(y, m, 0, 23, 59, 59, 999)] } };
    } else if (quarter) {
      const [y, qStr] = quarter.split('-');
      const q = parseInt(qStr.replace('Q', ''));
      const startMonth = (q-1)*3; const endMonth = q*3;
      dateWhere = { created_at: { [Op.between]: [new Date(parseInt(y), startMonth, 1), new Date(parseInt(y), endMonth, 0, 23, 59, 59, 999)] } };
    } else if (year) {
      dateWhere = { created_at: { [Op.between]: [new Date(parseInt(year), 0, 1), new Date(parseInt(year), 11, 31, 23, 59, 59, 999)] } };
    } else {
      const cy = new Date().getFullYear();
      dateWhere = { created_at: { [Op.between]: [new Date(cy, 0, 1), new Date(cy, 11, 31, 23, 59, 59, 999)] } };
    }

    const totalOrders   = await Order.count({ where: dateWhere });
    const pendingOrders = await Order.count({ where: { status: 'pending' } });

    const revenueResult = await Order.findOne({
      where: { status: 'delivered', ...dateWhere },
      attributes: [[fn('SUM', col('total')), 'total']], raw: true
    });
    const totalRevenue = Number(revenueResult?.total || 0);

    const recentOrders = await Order.findAll({
      order: [['created_at', 'DESC']], limit: 5,
      attributes: ['id', 'total', 'status', 'created_at', 'order_code', 'shipping_full_name', 'user_email']
    });

    // Revenue timeline
    const revenueTimeline = await sequelize.query(
      `SELECT DATE_FORMAT(CONVERT_TZ(created_at, '+00:00', '+07:00'), '%Y-%m') as label, SUM(total) as value 
       FROM orders WHERE status='delivered' AND created_at BETWEEN :start AND :end 
       GROUP BY label ORDER BY label`,
      { replacements: { start: dateWhere.created_at?.[Op.between]?.[0], end: dateWhere.created_at?.[Op.between]?.[1] }, type: sequelize.QueryTypes.SELECT }
    );

    // Best sellers
    const bestSellers = await OrderItem.findAll({
      include: [{ model: Order, as: 'Order', where: { status: 'delivered', ...dateWhere }, attributes: [] }],
      attributes: ['name', [fn('SUM', col('quantity')), 'value']],
      group: ['name'], order: [[literal('value'), 'DESC']], limit: 5, raw: true
    });

    let brandSales = [];
    try {
      // 1. Get all order items from delivered orders in the time period
      const deliveredItems = await OrderItem.findAll({
        include: [{ 
          model: Order, 
          as: 'Order', 
          where: { status: 'delivered', ...dateWhere }, 
          attributes: [] 
        }],
        attributes: ['product_id', 'quantity', 'price'],
        raw: true
      });

      // 2. Fetch all products from catalog-service to map product_id -> brand name
      const prodRes = await axios.get(`${CATALOG_SERVICE_URL}/api/products?limit=1000`);
      const products = prodRes.data?.data || prodRes.data || [];
      const productToBrandMap = {};
      products.forEach(p => {
        const brandName = p.brand?.name || 'Khác';
        productToBrandMap[p.id || p._id] = brandName;
      });

      // 3. Aggregate sales by brand
      const brandSalesMap = {};
      deliveredItems.forEach(item => {
        const brandName = productToBrandMap[item.product_id] || 'Khác';
        const sales = Number(item.quantity || 0) * Number(item.price || 0);
        brandSalesMap[brandName] = (brandSalesMap[brandName] || 0) + sales;
      });

      // 4. Convert to array of { label, value }
      brandSales = Object.entries(brandSalesMap).map(([label, value]) => ({ label, value }));
    } catch (err) {
      console.error('Failed to fetch/calculate brand sales:', err.message);
    }

    res.json({ success: true, data: { totalOrders, pendingOrders, totalRevenue, recentOrders, revenueTimeline, bestSellers: bestSellers.map(b => ({ label: b.name, value: Number(b.value) })), brandSales } });
  } catch (err) {
    res.status(500).json({ success: false, error: err.message });
  }
};

exports.receiveOrder = async (req, res) => {
  try {
    const Order = getOrder();
    const OrderItem = getOrderItem();
    const order = await Order.findByPk(req.params.id, { include: [{ model: OrderItem, as: 'items' }] });
    if (!order) return res.status(404).json({ error: 'Không tìm thấy đơn hàng' });
    if (order.user_id !== req.user.id) return res.status(403).json({ error: 'Không có quyền' });
    if (order.status !== 'shipping') return res.status(400).json({ error: 'Chỉ xác nhận khi đang giao' });

    await order.update({ status: 'delivered', delivered_at: new Date(), payment_status: 'paid' });
    for (const item of order.items) {
      try { await axios.post(`${CATALOG_SERVICE_URL}/api/products/${item.product_id}/increment-sold`, { quantity: item.quantity }, { headers: { 'x-internal-key': process.env.INTERNAL_API_KEY } }); }
      catch (e) { console.error('increment-sold failed:', e.message); }
    }
    setImmediate(() => eventBus.publishOrderDelivered(order));
    res.json({ success: true, data: order });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};