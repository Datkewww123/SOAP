const mongoose = require('mongoose');

const orderItemSchema = new mongoose.Schema({
  productId: { type: mongoose.Schema.Types.ObjectId, ref: 'Product', required: true },
  name: { type: String, required: true },
  price: { type: Number, required: true, min: 0 },
  image: String,
  quantity: { type: Number, required: true, min: 1 },
  selectedSize: String, // Size đã chọn khi mua
  selectedColor: String // Màu đã chọn khi mua (nếu có)
});

const shippingAddressSchema = new mongoose.Schema({
  fullName: { type: String, required: true },
  phone: { type: String, required: true },
  province: String, // Tỉnh/Thành phố
  district: String, // Quận/Huyện
  ward: String, // Phường/Xã
  street: { type: String, required: true }, // Địa chỉ cụ thể
  note: String // Ghi chú thêm cho địa chỉ
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  userEmail: { type: String },
  orderCode: { type: String, unique: true }, // Mã đơn hàng duy nhất - sẽ được tạo tự động bởi pre-save hook
  
  // Order items
  items: [orderItemSchema],
  
  // Pricing
  subtotal: { type: Number, required: true, min: 0 }, // Tổng tiền hàng
  shippingFee: { type: Number, default: 0, min: 0 }, // Phí vận chuyển
  discount: { type: Number, default: 0, min: 0 }, // Giảm giá (nếu có)
  total: { type: Number, required: true, min: 0 }, // Tổng thanh toán
  
  // Payment
  paymentMethod: { 
    type: String, 
    enum: ['cod', 'momo', 'vnpay', 'bank_transfer'], 
    default: 'cod' 
  },
  paymentStatus: { 
    type: String, 
    enum: ['unpaid', 'paid', 'refunded'], 
    default: 'unpaid' 
  },
  paymentTransactionId: String, // Transaction ID từ cổng thanh toán
  paymentUrl: String, // URL thanh toán (cho MoMo, VNPay)
  paidAt: Date, // Thời điểm thanh toán
  
  // Shipping
  shippingAddress: { type: shippingAddressSchema, required: true },
  
  // Order status
  status: { 
    type: String, 
    enum: ['pending', 'confirmed', 'shipping', 'delivered', 'cancelled'], 
    default: 'pending' 
  },
  
  // Status timestamps
  pendingAt: { type: Date, default: Date.now },
  confirmedAt: Date,
  shippingAt: Date,
  deliveredAt: Date,
  cancelledAt: Date,
  
  // Notes & reason
  customerNote: String, // Ghi chú từ khách hàng
  adminNote: String, // Ghi chú từ admin
  cancelReason: String // Lý do hủy đơn
}, { timestamps: true });

// Indexes
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ orderCode: 1 });
orderSchema.index({ status: 1 });
orderSchema.index({ paymentStatus: 1 });
orderSchema.index({ createdAt: -1 });

// Pre-save hook để tạo orderCode tự động
orderSchema.pre('save', async function(next) {
  if (!this.orderCode) {
    // Tạo mã đơn hàng: ORD + timestamp + 4 số random
    const timestamp = Date.now().toString().slice(-8);
    const random = Math.floor(1000 + Math.random() * 9000);
    this.orderCode = `ORD${timestamp}${random}`;
  }
  next();
});

// Static methods
orderSchema.statics.generateOrderCode = function() {
  const timestamp = Date.now().toString().slice(-8);
  const random = Math.floor(1000 + Math.random() * 9000);
  return `ORD${timestamp}${random}`;
};

// Instance methods
orderSchema.methods.canBeCancelled = function() {
  return ['pending', 'confirmed'].includes(this.status);
};

orderSchema.methods.cancel = function(reason) {
  if (!this.canBeCancelled()) {
    throw new Error('Không thể hủy đơn hàng ở trạng thái hiện tại');
  }
  this.status = 'cancelled';
  this.cancelledAt = new Date();
  this.cancelReason = reason;
  return this.save();
};

module.exports = mongoose.model('Order', orderSchema);
