const express = require('express');
const router = express.Router();
const paymentController = require('../controllers/paymentController');

router.post('/create', paymentController.createPayment);
router.post('/ipn', paymentController.ipnHandler);
router.get('/return', paymentController.paymentReturn);

module.exports = router;
