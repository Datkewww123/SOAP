const express = require('express');
const router = express.Router();
const productController = require('../controllers/productController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');
const internalAuth = require('../middleware/internalAuth');
const { cacheProducts, clearProductCache } = require('../middleware/cache');

// Apply cache middleware cho GET requests
router.get('*', cacheProducts);

// Clear cache cho write operations
router.post('*', clearProductCache);
router.put('*', clearProductCache);
router.delete('*', clearProductCache);

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: API quản lý sản phẩm
 */

/**
 * @swagger
 * /products:
 *   get:
 *     summary: Lấy danh sách sản phẩm với phân trang và lọc
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *         description: Số trang
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *         description: Số sản phẩm mỗi trang
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Lọc theo danh mục (ObjectId)
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Lọc theo thương hiệu (ObjectId hoặc slug)
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Giá tối thiểu
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Giá tối đa
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           default: -createdAt
 *         description: Sắp xếp (ví dụ -createdAt, price, -price)
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 200
 *                 message:
 *                   type: string
 *                   example: Products retrieved successfully
 *                 data:
 *                   type: array
 *                   items:
 *                     type: object
 *                     properties:
 *                       _id:
 *                         type: string
 *                         example: 507f1f77bcf86cd799439011
 *                       name:
 *                         type: string
 *                         example: Giày Nike Air Max
 *                       slug:
 *                         type: string
 *                         example: giay-nike-air-max
 *                       price:
 *                         type: number
 *                         example: 2500000
 *                       images:
 *                         type: array
 *                         items:
 *                           type: string
 *                       brand:
 *                         type: object
 *                       category:
 *                         type: object
 *                       rating:
 *                         type: number
 *                       reviews:
 *                         type: array
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                       example: 1
 *                     totalPages:
 *                       type: integer
 *                       example: 5
 *                     total:
 *                       type: integer
 *                       example: 32
 *                     limit:
 *                       type: integer
 *                       example: 12
 *       400:
 *         description: Lỗi yêu cầu
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: false
 *                 statusCode:
 *                   type: integer
 *                   example: 400
 *                 message:
 *                   type: string
 *                 errors:
 *                   type: object
 */
router.get('/', productController.getProducts);

/**
 * @swagger
 * /products:
 *   post:
 *     summary: Thêm sản phẩm mới (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required:
 *               - name
 *               - price
 *               - category
 *             properties:
 *               name:
 *                 type: string
 *                 example: Giày Nike Air Max 90
 *               brand:
 *                 type: string
 *                 description: ObjectId hoặc tên thương hiệu
 *                 example: 507f1f77bcf86cd799439011
 *               category:
 *                 type: string
 *                 description: ObjectId hoặc tên danh mục
 *                 example: 507f1f77bcf86cd799439012
 *               description:
 *                 type: string
 *                 example: Giày thể thao chất lượng cao
 *               price:
 *                 type: number
 *                 example: 2500000
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 example: ["https://example.com/image1.jpg"]
 *               variants:
 *                 type: array
 *                 items:
 *                   type: object
 *               isXakho:
 *                 type: boolean
 *                 default: false
 *     responses:
 *       201:
 *         description: Tạo sản phẩm thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 success:
 *                   type: boolean
 *                   example: true
 *                 statusCode:
 *                   type: integer
 *                   example: 201
 *                 message:
 *                   type: string
 *                   example: Product created successfully
 *                 data:
 *                   type: object
 *       400:
 *         description: Dữ liệu không hợp lệ
 *       401:
 *         description: Chưa xác thực
 *       403:
 *         description: Không có quyền truy cập (yêu cầu admin)
 */
router.post('/', auth, admin, productController.createProduct);

/**
 * @swagger
 * /products/xakho:
 *   get:
 *     summary: Lấy danh sách sản phẩm xả kho
 *     tags: [Products]
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
 *           default: 12
 *     responses:
 *       200:
 *         description: Lấy danh sách thành công
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 products:
 *                   type: array
 *                   items:
 *                     type: object
 *                 pagination:
 *                   type: object
 *                   properties:
 *                     currentPage:
 *                       type: integer
 *                     totalPages:
 *                       type: integer
 *                     total:
 *                       type: integer
 *                     limit:
 *                       type: integer
 *       400:
 *         description: Lỗi
 */
router.get('/xakho', productController.getXakhoProducts);

/**
 * @swagger
 * /products/search:
 *   get:
 *     summary: Tìm kiếm nâng cao với fuzzy matching
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm (tối thiểu 2 ký tự)
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           default: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           default: 12
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *         description: Lọc theo danh mục
 *       - in: query
 *         name: brand
 *         schema:
 *           type: string
 *         description: Lọc theo thương hiệu
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *     responses:
 *       200:
 *         description: Tìm kiếm thành công
 *       400:
 *         description: Lỗi (từ khóa quá ngắn)
 */
router.get('/search', productController.searchProducts);

/**
 * @swagger
 * /products/autocomplete:
 *   get:
 *     summary: Gợi ý tìm kiếm theo thời gian thực
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: q
 *         required: true
 *         schema:
 *           type: string
 *         description: Từ khóa tìm kiếm
 *     responses:
 *       200:
 *         description: Danh sách gợi ý
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   _id:
 *                     type: string
 *                   name:
 *                     type: string
 *                   slug:
 *                     type: string
 */
router.get('/autocomplete', productController.autocomplete);

/**
 * @swagger
 * /api/products/slug/{slug}:
 *   get:
 *     summary: Lấy sản phẩm theo slug
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: slug
 *         required: true
 *         schema:
 *           type: string
 *         description: Slug của sản phẩm
 *     responses:
 *       200:
 *         description: Lấy sản phẩm thành công
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
router.get('/slug/:slug', productController.getProductBySlug);

/**
 * @swagger
 * /api/products/{id}:
 *   get:
 *     summary: Lấy chi tiết sản phẩm theo ID
 *     tags: [Products]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: ID của sản phẩm
 *     responses:
 *       200:
 *         description: Lấy sản phẩm thành công
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
router.get('/:id', productController.getProduct);

/**
 * @swagger
 * /api/products/{identifier}:
 *   put:
 *     summary: Cập nhật sản phẩm (Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: identifier
 *         required: true
 *         schema:
 *           type: string
 *         description: ID hoặc slug của sản phẩm
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Cập nhật thành công
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
router.put('/:identifier', auth, admin, productController.updateProduct);

/**
 * @swagger
 * /api/products/{identifier}:
 *   delete:
 *     summary: Xóa sản phẩm (Admin)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: identifier
 *         required: true
 *         schema:
 *           type: string
 *         description: ID hoặc slug của sản phẩm
 *     responses:
 *       200:
 *         description: Xóa thành công
 *       404:
 *         description: Không tìm thấy sản phẩm
 */
router.delete('/:identifier', auth, admin, productController.deleteProduct);

// Internal endpoints (chỉ Order service gọi qua x-internal-key)
router.post('/:id/reduce-stock', internalAuth, productController.reduceStock);
router.post('/:id/restore-stock', internalAuth, productController.restoreStock);
router.post('/:id/increment-sold', internalAuth, productController.incrementSold);

module.exports = router;
