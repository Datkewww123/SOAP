const express = require('express');
const router = express.Router();
const addressController = require('../controllers/addressController');
const auth = require('../middleware/auth');

/**
 * @swagger
 * tags:
 *   name: Addresses
 *   description: Quản lý địa chỉ giao hàng
 */

/**
 * @swagger
 * /users/addresses:
 *   get:
 *     summary: Lấy danh sách địa chỉ
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Danh sách địa chỉ
 *   post:
 *     summary: Thêm địa chỉ mới
 *     tags: [Addresses]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [fullName, phone, province, district, street]
 *             properties:
 *               fullName:
 *                 type: string
 *               phone:
 *                 type: string
 *               province:
 *                 type: string
 *               district:
 *                 type: string
 *               ward:
 *                 type: string
 *               street:
 *                 type: string
 *               isDefault:
 *                 type: boolean
 *     responses:
 *       201:
 *         description: Thêm thành công
 */
router.get('/', auth, addressController.getAddresses);
router.post('/', auth, addressController.addAddress);
router.put('/:addressId', auth, addressController.updateAddress);
router.delete('/:addressId', auth, addressController.deleteAddress);
router.put('/:addressId/default', auth, addressController.setDefaultAddress);

module.exports = router;
