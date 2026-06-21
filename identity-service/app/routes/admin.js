const express = require('express');
const router = express.Router();
const adminController = require('../controllers/adminController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

/**
 * @swagger
 * tags:
 *   name: Admin
 *   description: API quản trị hệ thống (chỉ admin)
 */

// All routes require auth and admin role
router.use(auth);
router.use(admin);

/**
 * @swagger
 * /admin/stats:
 *   get:
 *     summary: Lấy thống kê dashboard
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy thống kê thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 totalProducts:
 *                   type: integer
 *                 totalOrders:
 *                   type: integer
 *                 pendingOrders:
 *                   type: integer
 *                 totalRevenue:
 *                   type: number
 *                 totalUsers:
 *                   type: integer
 *                 recentOrders:
 *                   type: array
 *                   items:
 *                     type: object
 *       400:
 *         description: Lỗi
 *       403:
 *         description: Không có quyền (chỉ admin)
 */
router.get('/stats', adminController.getStats);

/**
 * @swagger
 * /admin/orders:
 *   get:
 *     summary: Lấy tất cả đơn hàng (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 20
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, confirmed, delivering, completed, cancelled]
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 orders:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     total:
 *                       type: integer
 *                     page:
 *                       type: integer
 *                     pages:
 *                       type: integer
 *       403:
 *         description: Không có quyền
 */
// router.get('/orders', adminController.getAllOrders);

/**
 * @swagger
 * /admin/orders/{id}/status:
 *   put:
 *     summary: Cập nhật trạng thái đơn hàng (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - status
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, delivering, completed, cancelled]
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Status không hợp lệ
 *       404:
 *         description: Không tìm thấy đơn hàng
 */
// router.put('/orders/:id/status', adminController.updateOrderStatus);

/**
 * @swagger
 * /admin/users:
 *   get:
 *     summary: Lấy danh sách tất cả người dùng (Admin)
 *     tags: [Admin]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *       403:
 *         description: Không có quyền
 */
router.get('/users', adminController.getAllUsers);

module.exports = router;
