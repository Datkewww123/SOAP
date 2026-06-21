const mongoose = require('mongoose');

const promotionSchema = new mongoose.Schema({
  code: { type: String, required: true, unique: true, uppercase: true },
  description: String,
  discount: { type: Number, required: true, min: 0, max: 100 },
  discountType: { type: String, enum: ['percentage', 'fixed'], default: 'percentage' },
  maxUses: { type: Number, default: null },
  currentUses: { type: Number, default: 0 },
  active: { type: Boolean, default: true },
  startDate: Date,
  endDate: Date
});

promotionSchema.index({ code: 1, active: 1 });

module.exports = mongoose.model('Promotion', promotionSchema);
