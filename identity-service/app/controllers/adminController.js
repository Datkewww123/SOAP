const { getUser } = require('../models/User');

exports.getStats = async (req, res) => {
  try {
    const User = getUser();
    const totalUsers = await User.count();  // Sequelize dùng .count() không phải .countDocuments()

    let totalProducts = 0;
    try {
      const catalogUrl = process.env.CATALOG_SERVICE_URL || 'http://catalog-service:3002';
      const prodRes = await fetch(`${catalogUrl}/api/products?limit=1`);
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        if (prodData.pagination) totalProducts = prodData.pagination.total || 0;
      }
    } catch (err) {
      console.error('Failed to fetch product count:', err.message);
    }

    let mostStockedProducts = [];
    try {
      const catalogUrl = process.env.CATALOG_SERVICE_URL || 'http://catalog-service:3002';
      const stockRes = await fetch(`${catalogUrl}/api/products?limit=5&sort=-stock`);
      if (stockRes.ok) {
        const stockData = await stockRes.json();
        const prods = stockData.data || stockData || [];
        mostStockedProducts = prods.map(p => ({ label: p.name, value: p.stock || 0 }));
      }
    } catch (err) {
      console.error('Failed to fetch stocked products:', err.message);
    }

    let totalOrders = 0, pendingOrders = 0, totalRevenue = 0;
    let recentOrders = [], revenueTimeline = [], bestSellers = [], brandSales = [];
    try {
      const orderUrl = process.env.ORDER_SERVICE_URL || 'http://order-service:3003';
      const queryParams = new URLSearchParams(req.query).toString();
      const orderRes = await fetch(`${orderUrl}/api/admin/orders/stats/summary?${queryParams}`, {
        headers: { 'x-internal-key': process.env.INTERNAL_API_KEY || 'internal123' }
      });
      if (orderRes.ok) {
        const orderData = await orderRes.json();
        if (orderData.success && orderData.data) {
          const stats = orderData.data;
          totalOrders = stats.totalOrders || 0;
          pendingOrders = stats.pendingOrders || 0;
          totalRevenue = stats.totalRevenue || 0;
          recentOrders = stats.recentOrders || [];
          revenueTimeline = stats.revenueTimeline || [];
          bestSellers = stats.bestSellers || [];
          brandSales = stats.brandSales || [];
        }
      }
    } catch (err) {
      console.error('Failed to fetch order stats:', err.message);
    }

    res.json({
      success: true,
      data: {
        totalProducts, totalOrders, pendingOrders,
        totalRevenue, totalUsers, recentOrders,
        revenueTimeline, bestSellers, mostStockedProducts, brandSales
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

exports.getAllUsers = async (req, res) => {
  try {
    const User = getUser();
    const { page = 1, limit = 20 } = req.query;
    const offset = (Number(page) - 1) * Number(limit);

    const { count, rows: users } = await User.findAndCountAll({
      attributes: { exclude: ['password'] },
      order: [['created_at', 'DESC']],
      limit: Number(limit),
      offset
    });

    res.json({
      users,
      pagination: {
        total: count,
        page: Number(page),
        pages: Math.ceil(count / Number(limit))
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getDashboardStats = async (req, res) => {
  res.json({ success: true, message: 'Stats not available' });
};