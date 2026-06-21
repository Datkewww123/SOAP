const express = require("express");
const router = express.Router();
const orderController = require("../controllers/orderController");
const auth = require("../middleware/auth");
const admin = require("../middleware/admin");
const internalAuth = require("../middleware/internalAuth");

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: API quản lý đơn hàng
 */

/**
 * @swagger
 * /orders:
 *   post:
 *     summary: Tạo đơn hàng mới (Checkout)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - items
 *               - total
 *             properties:
 *               items:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     product:
 *                       type: string
 *                       description: Product ID
 *                     name:
 *                       type: string
 *                     price:
 *                       type: number
 *                     quantity:
 *                       type: number
 *                     imageUrl:
 *                       type: string
 *               total:
 *                 type: number
 *                 example: 2500000
 *               paymentMethod:
 *                 type: string
 *                 default: cod
 *                 example: cod
 *               shippingAddress:
 *                 type: object
 *                 properties:
 *                   fullName:
 *                     type: string
 *                   phone:
 *                     type: string
 *                   address:
 *                     type: string
 *                   city:
 *                     type: string
 *                   district:
 *                     type: string
 *               notes:
 *                 type: string
 *     responses:
 *       201:
 *         description: Tạo đơn hàng thành công, giỏ hàng được xóa
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                 user:
 *                   type: string
 *                 items:
 *                   type: array
 *                 total:
 *                   type: number
 *                 status:
 *                   type: string
 *                   example: pending
 *       400:
 *         description: Items không thể rỗng hoặc Total phải hợp lệ
 *       401:
 *         description: Chưa xác thực
 */
router.post("/", auth, orderController.createOrder);

/**
 * @swagger
 * /orders:
 *   get:
 *     summary: Lấy danh sách đơn hàng của người dùng
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Số đơn hàng mỗi trang
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *           enum: [pending, processing, shipping, delivered, cancelled]
 *         description: Lọc theo trạng thái
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *       401:
 *         description: Chưa xác thực
 */
router.get("/", auth, orderController.getOrders);

/**
 * @swagger
 * /orders/lookup:
 *   get:
 *     summary: Tra cứu đơn hàng công khai (không cần đăng nhập)
 *     tags: [Orders]
 *     parameters:
 *       - in: query
 *         name: orderId
 *         schema:
 *           type: string
 *       - in: query
 *         name: phone
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Tìm thấy đơn hàng
 *       404:
 *         description: Không tìm thấy đơn hàng
 */
router.get('/lookup', orderController.lookupOrder);

/**
 * @swagger
 * /orders/history:
 *   get:
 *     summary: Lấy lịch sử đơn hàng đã hoàn thành
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Lấy lịch sử thành công
 *       401:
 *         description: Chưa xác thực
 */
router.get("/history", auth, orderController.getOrderHistory);

/**
 * @swagger
 * /orders/{id}:
 *   get:
 *     summary: Xem chi tiết đơn hàng
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của đơn hàng
 *     responses:
 *       200:
 *         description: Lấy chi tiết thành công
 *       404:
 *         description: Không tìm thấy đơn hàng
 */
router.get("/:id", auth, orderController.getOrder);

/**
 * @swagger
 * /orders/{id}:
 *   put:
 *     summary: Cập nhật trạng thái đơn hàng (Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của đơn hàng
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [pending, confirmed, delivering, completed, cancelled]
 *                 example: confirmed
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       400:
 *         description: Status không hợp lệ
 *       403:
 *         description: Không có quyền (chỉ admin)
 *       404:
 *         description: Không tìm thấy đơn hàng
 */
router.put("/:id", auth, admin, orderController.updateOrder);

/**
 * @swagger
 * /orders/{id}:
 *   delete:
 *     summary: Xóa đơn hàng (chỉ đơn hàng pending)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của đơn hàng
 *     responses:
 *       200:
 *         description: Xóa đơn hàng thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                   example: Order deleted successfully
 *                 id:
 *                   type: string
 *       400:
 *         description: Chỉ có thể xóa đơn hàng chờ xác nhận
 *       403:
 *         description: Không có quyền xóa (đơn hàng không thuộc về user)
 *       404:
 *         description: Không tìm thấy đơn hàng
 */
router.delete("/:id", auth, orderController.deleteOrder);

// Internal: Cập nhật trạng thái thanh toán (từ payment-service)
router.patch("/:id/payment-status", internalAuth, orderController.updatePaymentStatus);

module.exports = router;
/**
 * @swagger
 * /orders/lookup/{orderId}:
 * get:
 * summary: Tra cứu đơn hàng công khai theo ID
 * tags: [Orders]
 * parameters:
 * - in: path
 * name: orderId
 * required: true
 * schema:
 * type: string
 * description: ID của đơn hàng
 * responses:
 * 200:
 * description: Tra cứu thành công
 * 404:
 * description: Không tìm thấy đơn hàng
 */
router.get("/lookup/:orderId", orderController.lookupOrder); // <-- ROUTE MỚI (KHÔNG CẦN AUTH)
