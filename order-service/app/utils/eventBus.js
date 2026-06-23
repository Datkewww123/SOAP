const Redis = require('ioredis');

const REDIS_URL = process.env.REDIS_URL || 'redis://localhost:6379';
const CHANNEL = 'order:events';

let publisher = null;

function getPublisher() {
  if (!publisher) {
    publisher = new Redis(REDIS_URL);
    publisher.on('error', (err) => console.error('Redis publisher error:', err));
  }
  return publisher;
}

async function publishEvent(eventType, data) {
  try {
    const pub = getPublisher();
    const message = JSON.stringify({ type: eventType, data, timestamp: new Date().toISOString() });
    await pub.publish(CHANNEL, message);
    console.log(`[EventBus] Published ${eventType}`, { orderId: data.orderId });
  } catch (err) {
    console.error(`[EventBus] Failed to publish ${eventType}:`, err.message);
  }
}

async function publishOrderCreated(order) {
  await publishEvent('ORDER_CREATED', {
    orderId: order.id.toString(),
    orderCode: order.order_code,
    userEmail: order.user_email,
    customerName: order.shipping_full_name,
    total: order.total,
    paymentMethod: order.payment_method,
    items: order.items.map(i => ({ name: i.name, quantity: i.quantity, price: i.price })),
    shippingAddress: {
      fullName: order.shipping_full_name,
      phone: order.shipping_phone,
      province: order.shipping_province,
      district: order.shipping_district,
      ward: order.shipping_ward,
      street: order.shipping_street,
      note: order.shipping_note,
    },
    createdAt: order.created_at,
  });
}

async function publishOrderPaid(order) {
  await publishEvent('ORDER_PAID', {
    orderId: order.id.toString(),
    orderCode: order.order_code,
    userEmail: order.user_email,
    customerName: order.shipping_full_name,
    total: order.total,
    paymentMethod: order.payment_method,
    paymentTransactionId: order.payment_transaction_id,
    paidAt: order.paid_at,
  });
}

async function publishOrderDelivered(order) {
  await publishEvent('ORDER_DELIVERED', {
    orderId: order.id.toString(),
    orderCode: order.order_code,
    userEmail: order.user_email,
    customerName: order.shipping_full_name,
    deliveredAt: order.delivered_at,
  });
}

async function publishOrderCancelled(order) {
  await publishEvent('ORDER_CANCELLED', {
    orderId: order.id.toString(),
    orderCode: order.order_code,
    userEmail: order.user_email,
    customerName: order.shipping_full_name,
    cancelReason: order.cancel_reason,
    cancelledAt: order.cancelled_at,
  });
}

module.exports = {
  publishOrderCreated,
  publishOrderPaid,
  publishOrderDelivered,
  publishOrderCancelled,
};
