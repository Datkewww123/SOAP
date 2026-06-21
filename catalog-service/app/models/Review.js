const mongoose = require('mongoose');

const reviewSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, required: true },
  product: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },

  rating: { type: Number, required: true, min: 1, max: 5 },
  title: { type: String, trim: true, maxlength: 200 },
  comment: { type: String, required: true, trim: true, minlength: 5, maxlength: 2000 },
  images: [String],

  isVerifiedPurchase: { type: Boolean, default: false },

  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },

  helpfulCount: { type: Number, default: 0 },

  adminReply: String,
  adminRepliedAt: Date
}, { timestamps: true });

reviewSchema.index({ product: 1, createdAt: -1 });
reviewSchema.index({ user: 1, product: 1 }, { unique: true });
reviewSchema.index({ status: 1 });
reviewSchema.index({ rating: 1 });

reviewSchema.statics.updateProductRating = async function(productId) {
  const Product = mongoose.model('Product');

  const stats = await this.aggregate([
    { $match: { product: productId, status: 'approved' } },
    {
      $group: {
        _id: '$product',
        avgRating: { $avg: '$rating' },
        totalReviews: { $sum: 1 }
      }
    }
  ]);

  if (stats.length > 0) {
    await Product.findByIdAndUpdate(productId, {
      rating: Math.round(stats[0].avgRating * 10) / 10,
      reviews: stats[0].totalReviews
    });
  } else {
    await Product.findByIdAndUpdate(productId, {
      rating: 0,
      reviews: 0
    });
  }
};

reviewSchema.post('save', function() {
  this.constructor.updateProductRating(this.product);
});

reviewSchema.post('findOneAndDelete', function(doc) {
  if (doc) {
    doc.constructor.updateProductRating(doc.product);
  }
});

module.exports = mongoose.model('Review', reviewSchema);
