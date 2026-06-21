const User = require('../models/User');

// Dashboard statistics
// exports.getDashboardStats = async (req, res) => {
//     res.json({ success: true, message: 'Stats not available in identity-service' });
// };

exports.getStats = async (req, res) => {
  try {
    // 1. Count total users
    const totalUsers = await User.countDocuments();

    // 2. Count total products (fetch from catalog-service)
    let totalProducts = 0;
    try {
      const catalogUrl = process.env.CATALOG_SERVICE_URL || 'http://catalog-service:3002';
      const prodRes = await fetch(`${catalogUrl}/api/products?limit=1`);
      if (prodRes.ok) {
        const prodData = await prodRes.json();
        const stats = prodData.data || prodData;
        if (stats.pagination) {
          totalProducts = stats.pagination.total || 0;
        }
      }
    } catch (err) {
      console.error('Failed to fetch product count from catalog-service:', err.message);
    }

    // 3. Fetch top 5 most stocked products from catalog-service (for Line Chart 3)
    let mostStockedProducts = [];
    try {
      const catalogUrl = process.env.CATALOG_SERVICE_URL || 'http://catalog-service:3002';
      const stockRes = await fetch(`${catalogUrl}/api/products?limit=5&sort=-stock`);
      if (stockRes.ok) {
        const stockData = await stockRes.json();
        const stats = stockData.data || stockData;
        const prods = stats.products || stats || [];
        mostStockedProducts = prods.map(p => ({
          label: p.name,
          value: p.stock || 0
        }));
      }
    } catch (err) {
      console.error('Failed to fetch most stocked products from catalog-service:', err.message);
    }

    // 4. Get order stats and timeline data from order-service
    let totalOrders = 0;
    let pendingOrders = 0;
    let totalRevenue = 0;
    let recentOrders = [];
    let revenueTimeline = [];
    let bestSellers = [];
    let brandSales = [];
    try {
      const orderUrl = process.env.ORDER_SERVICE_URL || 'http://order-service:3003';
      
      // Forward client query parameters (date, month, year, quarter)
      const queryParams = new URLSearchParams(req.query).toString();
      
      const orderRes = await fetch(`${orderUrl}/api/admin/orders/stats/summary?${queryParams}`, {
        headers: { 
          'x-internal-key': process.env.INTERNAL_API_KEY || 'internal123'
        }
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
      console.error('Failed to fetch order stats from order-service:', err.message);
    }

    res.json({
      success: true,
      data: {
        totalProducts,
        totalOrders,
        pendingOrders,
        totalRevenue,
        totalUsers,
        recentOrders,
        revenueTimeline,
        bestSellers,
        mostStockedProducts,
        brandSales
      }
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
};

// Get all orders (admin only)
// exports.getAllOrders = async (req, res) => {
//   try {
//     const { page = 1, limit = 20, status, search } = req.query;
//     const skip = (Number(page) - 1) * Number(limit);
//
//     const filter = {};
//     if (status) filter.status = status;
//
//     // Tìm kiếm theo mã đơn hàng, email, hoặc số điện thoại
//     if (search) {
//       const searchRegex = new RegExp(search, 'i');
//
//       // Tìm user IDs matching search query
//       const matchingUsers = await User.find({
//         $or: [
//           { email: searchRegex },
//           { phone: searchRegex },
//           { name: searchRegex }
//         ]
//       }).select('_id');
//
//       const userIds = matchingUsers.map(u => u._id);
//
//       // Tìm orders với orderCode hoặc user matching
//       filter.$or = [
//         { orderCode: searchRegex },
//         { user: { $in: userIds } }
//       ];
//     }
//
//     const orders = await Order.find(filter)
//       .sort('-createdAt')
//       .skip(skip)
//       .limit(Number(limit))
//       .populate('user', 'name email phone');
//
//     const total = await Order.countDocuments(filter);
//
//     res.json({
//       orders,
//       pagination: {
//         total,
//         page: Number(page),
//         pages: Math.ceil(total / Number(limit))
//       }
//     });
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// };

// Update order status (admin only)
// exports.updateOrderStatus = async (req, res) => {
//   try {
//     const { id } = req.params;
//     const { status } = req.body;
//
//     if (!['pending', 'confirmed', 'delivering', 'completed', 'cancelled'].includes(status)) {
//       return res.status(400).json({ error: 'Invalid status' });
//     }
//
//     const order = await Order.findByIdAndUpdate(
//       id,
//       { status },
//       { new: true }
//     ).populate('user', 'name email');
//
//     if (!order) {
//       return res.status(404).json({ error: 'Order not found' });
//     }
//
//     res.json(order);
//   } catch (err) {
//     res.status(400).json({ error: err.message });
//   }
// };

// Get all users (admin only)
exports.getAllUsers = async (req, res) => {
  try {
    const { page = 1, limit = 20 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const users = await User.find()
      .select('-password')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));

    const total = await User.countDocuments();

    res.json({
      users,
      pagination: {
        total,
        page: Number(page),
        pages: Math.ceil(total / Number(limit))
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getDashboardStats = async (req, res) => {
    res.json({ success: true, message: 'Stats not available in identity-service' });
};
