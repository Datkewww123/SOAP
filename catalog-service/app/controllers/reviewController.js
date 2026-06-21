const Review = require('../models/Review');
const Product = require('../models/Product');

exports.createReview = async (req, res) => {
  try {
    const { productId, rating, title, comment, images } = req.body;

    if (!productId || !rating || !comment) {
      return res.status(400).json({ error: 'Thiếu thông tin bắt buộc' });
    }

    const existingReview = await Review.findOne({
      user: req.user.id,
      product: productId
    });

    if (existingReview) {
      return res.status(400).json({ error: 'Bạn đã đánh giá sản phẩm này rồi' });
    }

    const product = await Product.findById(productId);
    if (!product) {
      return res.status(404).json({ error: 'Sản phẩm không tồn tại' });
    }

    const review = new Review({
      user: req.user.id,
      product: productId,
      rating,
      title,
      comment,
      images: images || [],
      status: 'pending'
    });

    await review.save();

    res.status(201).json({
      success: true,
      message: 'Đánh giá của bạn đã được gửi và đang chờ duyệt',
      review
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;
    const { page = 1, limit = 10, rating, sort = '-createdAt' } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const filter = {
      product: productId,
      status: 'approved'
    };

    if (rating) {
      filter.rating = Number(rating);
    }

    const reviews = await Review.find(filter)
      .sort(sort)
      .skip(skip)
      .limit(Number(limit));

    const total = await Review.countDocuments(filter);
    const totalPages = Math.ceil(total / limit);

    const ratingStats = await Review.aggregate([
      { $match: { product: productId, status: 'approved' } },
      {
        $group: {
          _id: '$rating',
          count: { $sum: 1 }
        }
      },
      { $sort: { _id: -1 } }
    ]);

    res.json({
      success: true,
      reviews,
      pagination: {
        currentPage: Number(page),
        totalPages,
        total,
        limit: Number(limit)
      },
      ratingStats
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.getMyReviews = async (req, res) => {
  try {
    const { page = 1, limit = 10 } = req.query;
    const skip = (Number(page) - 1) * Number(limit);

    const reviews = await Review.find({ user: req.user.id })
      .populate('product', 'name images price')
      .sort('-createdAt')
      .skip(skip)
      .limit(Number(limit));

    const total = await Review.countDocuments({ user: req.user.id });

    res.json({
      success: true,
      reviews,
      pagination: {
        currentPage: Number(page),
        totalPages: Math.ceil(total / limit),
        total,
        limit: Number(limit)
      }
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.approveReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findByIdAndUpdate(
      id,
      { status: 'approved' },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ error: 'Review không tồn tại' });
    }

    res.json({
      success: true,
      message: 'Đã duyệt review',
      review
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.rejectReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findByIdAndUpdate(
      id,
      { status: 'rejected' },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ error: 'Review không tồn tại' });
    }

    res.json({
      success: true,
      message: 'Đã từ chối review',
      review
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.replyReview = async (req, res) => {
  try {
    const { id } = req.params;
    const { reply } = req.body;

    const review = await Review.findByIdAndUpdate(
      id,
      {
        adminReply: reply,
        adminRepliedAt: new Date()
      },
      { new: true }
    );

    if (!review) {
      return res.status(404).json({ error: 'Review không tồn tại' });
    }

    res.json({
      success: true,
      message: 'Đã trả lời review',
      review
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};

exports.deleteReview = async (req, res) => {
  try {
    const { id } = req.params;

    const review = await Review.findById(id);

    if (!review) {
      return res.status(404).json({ error: 'Review không tồn tại' });
    }

    if (review.user.toString() !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({ error: 'Không có quyền xóa review này' });
    }

    await Review.findByIdAndDelete(id);

    res.json({
      success: true,
      message: 'Đã xóa review'
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
};
