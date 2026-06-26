const express = require('express');
const router  = express.Router();
router.use('/orders', require('./orders'));
router.use('/promotions', require('./promotions'));
router.use('/admin/orders', require('./adminOrders'));
router.use('/cart', require('./cart'));
module.exports = router;