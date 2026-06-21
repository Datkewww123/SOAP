const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const internalAuth = require("../middleware/internalAuth");

// GET /api/admin/orders/stats/summary - Lấy thống kê đơn hàng (gọi internal từ identity-service)
router.get("/stats/summary", internalAuth, orderController.getOrderStatsSummary);

// GET /api/admin/orders - Lấy danh sách tất cả đơn hàng (Admin)
router.get("/", auth, admin, orderController.getAllOrders);

// PUT /api/admin/orders/:id/status - Cập nhật trạng thái đơn hàng (Admin)
router.put("/:id/status", auth, admin, orderController.updateOrderStatus);

module.exports = router;
