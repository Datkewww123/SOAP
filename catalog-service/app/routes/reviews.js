const express = require('express');
const router = express.Router();
const reviewController = require('../controllers/reviewController');
const auth = require('../middleware/auth');
const admin = require('../middleware/admin');

router.get('/products/:productId', reviewController.getProductReviews);

router.use(auth);
router.post('/', reviewController.createReview);
router.get('/my-reviews', reviewController.getMyReviews);
router.delete('/:id', reviewController.deleteReview);

router.patch('/:id/approve', admin, reviewController.approveReview);
router.patch('/:id/reject', admin, reviewController.rejectReview);
router.post('/:id/reply', admin, reviewController.replyReview);

module.exports = router;
