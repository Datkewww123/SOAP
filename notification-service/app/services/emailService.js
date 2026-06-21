const { getTransporter } = require('../config/email');

function buildOrderCreatedEmail(data) {
  const itemsHtml = data.items.map(item =>
    `<tr><td style="padding:8px;border-bottom:1px solid #ddd;">${item.name}</td><td style="padding:8px;border-bottom:1px solid #ddd;text-align:center;">${item.quantity}</td><td style="padding:8px;border-bottom:1px solid #ddd;text-align:right;">${(item.price * item.quantity).toLocaleString()}₫</td></tr>`
  ).join('');

  return {
    subject: `Xác nhận đơn hàng #${data.orderCode}`,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;">
        <div style="background:#c0392b;color:#fff;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
          <h1 style="margin:0;">SOAP Shop</h1>
        </div>
        <div style="padding:24px;border:1px solid #ddd;border-top:none;border-radius:0 0 8px 8px;">
          <h2>Đơn hàng đã được đặt thành công!</h2>
          <p>Xin chào <strong>${data.customerName}</strong>,</p>
          <p>Cảm ơn bạn đã đặt hàng tại SOAP Shop. Đơn hàng của bạn đã được ghi nhận và đang chờ xử lý.</p>

          <table style="width:100%;margin:16px 0;">
            <tr><td style="font-weight:bold;width:120px;">Mã đơn hàng:</td><td>#${data.orderCode}</td></tr>
            <tr><td style="font-weight:bold;">Phương thức:</td><td>${data.paymentMethod === 'cod' ? 'Thanh toán khi nhận hàng' : data.paymentMethod === 'momo' ? 'MoMo' : data.paymentMethod}</td></tr>
            <tr><td style="font-weight:bold;">Tổng tiền:</td><td style="color:#c0392b;font-weight:bold;font-size:18px;">${data.total.toLocaleString()}₫</td></tr>
            <tr><td style="font-weight:bold;">Ngày đặt:</td><td>${new Date(data.createdAt).toLocaleString('vi-VN')}</td></tr>
          </table>

          <h3 style="margin-top:20px;">Sản phẩm</h3>
          <table style="width:100%;border-collapse:collapse;">
            <thead><tr style="background:#f5f5f5;"><th style="padding:8px;text-align:left;">Sản phẩm</th><th style="padding:8px;text-align:center;">SL</th><th style="padding:8px;text-align:right;">Tạm tính</th></tr></thead>
            <tbody>${itemsHtml}</tbody>
          </table>

          <h3 style="margin-top:20px;">Địa chỉ giao hàng</h3>
          <p style="background:#f9f9f9;padding:12px;border-radius:4px;">
            ${data.shippingAddress.fullName}<br/>
            ${data.shippingAddress.street}${data.shippingAddress.ward ? ', ' + data.shippingAddress.ward : ''}${data.shippingAddress.district ? ', ' + data.shippingAddress.district : ''}${data.shippingAddress.province ? ', ' + data.shippingAddress.province : ''}<br/>
            SĐT: ${data.shippingAddress.phone}
          </p>

          <p style="color:#666;font-size:13px;margin-top:20px;">Chúng tôi sẽ thông báo cho bạn khi đơn hàng được giao.</p>
        </div>
      </div>
    `,
  };
}

function buildOrderPaidEmail(data) {
  return {
    subject: `Thanh toán thành công #${data.orderCode}`,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;">
        <div style="background:#27ae60;color:#fff;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
          <h1 style="margin:0;">SOAP Shop</h1>
        </div>
        <div style="padding:24px;border:1px solid #ddd;border-top:none;border-radius:0 0 8px 8px;">
          <div style="text-align:center;font-size:48px;margin-bottom:16px;">&#10003;</div>
          <h2 style="text-align:center;color:#27ae60;">Thanh toán thành công!</h2>
          <p>Xin chào <strong>${data.customerName}</strong>,</p>
          <p>Đơn hàng <strong>#${data.orderCode}</strong> đã được thanh toán thành công qua <strong>${data.paymentMethod}</strong>.</p>
          <table style="width:100%;margin:16px 0;">
            <tr><td style="font-weight:bold;width:120px;">Số tiền:</td><td style="color:#c0392b;font-weight:bold;font-size:18px;">${data.total.toLocaleString()}₫</td></tr>
            <tr><td style="font-weight:bold;">Ngày thanh toán:</td><td>${new Date(data.paidAt).toLocaleString('vi-VN')}</td></tr>
            ${data.paymentTransactionId ? `<tr><td style="font-weight:bold;">Mã GD:</td><td>${data.paymentTransactionId}</td></tr>` : ''}
          </table>
          <p>Đơn hàng của bạn đang được xử lý và sẽ được giao trong thời gian sớm nhất.</p>
        </div>
      </div>
    `,
  };
}

function buildOrderDeliveredEmail(data) {
  return {
    subject: `Đơn hàng đã giao thành công #${data.orderCode}`,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;">
        <div style="background:#2980b9;color:#fff;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
          <h1 style="margin:0;">SOAP Shop</h1>
        </div>
        <div style="padding:24px;border:1px solid #ddd;border-top:none;border-radius:0 0 8px 8px;">
          <h2>Đơn hàng đã được giao!</h2>
          <p>Xin chào <strong>${data.customerName}</strong>,</p>
          <p>Đơn hàng <strong>#${data.orderCode}</strong> đã được giao thành công vào ngày <strong>${new Date(data.deliveredAt).toLocaleDateString('vi-VN')}</strong>.</p>
          <p>Hy vọng bạn hài lòng với sản phẩm! Nếu có bất kỳ thắc mắc nào, vui lòng liên hệ với chúng tôi.</p>
        </div>
      </div>
    `,
  };
}

function buildOrderCancelledEmail(data) {
  return {
    subject: `Đơn hàng đã hủy #${data.orderCode}`,
    html: `
      <div style="max-width:600px;margin:0 auto;font-family:Arial,sans-serif;">
        <div style="background:#e74c3c;color:#fff;padding:20px;text-align:center;border-radius:8px 8px 0 0;">
          <h1 style="margin:0;">SOAP Shop</h1>
        </div>
        <div style="padding:24px;border:1px solid #ddd;border-top:none;border-radius:0 0 8px 8px;">
          <h2>Đơn hàng đã hủy</h2>
          <p>Xin chào <strong>${data.customerName}</strong>,</p>
          <p>Đơn hàng <strong>#${data.orderCode}</strong> của bạn đã được hủy.</p>
          ${data.cancelReason ? `<p>Lý do: <em>${data.cancelReason}</em></p>` : ''}
          <p>Nếu bạn có thắc mắc, vui lòng liên hệ với bộ phận chăm sóc khách hàng.</p>
        </div>
      </div>
    `,
  };
}

async function sendEmail(to, subject, html) {
  const transporter = getTransporter();

  if (!transporter) {
    console.log(`[Email] [LOGGED] To: ${to} | Subject: ${subject}`);
    return;
  }

  try {
    const info = await transporter.sendMail({
      from: `"${process.env.EMAIL_FROM_NAME || 'SOAP Shop'}" <${process.env.EMAIL_FROM || 'noreply@soapshop.com'}>`,
      to,
      subject,
      html,
    });
    console.log(`[Email] Sent to ${to} | MessageId: ${info.messageId}`);
  } catch (err) {
    console.error(`[Email] Failed to send to ${to}:`, err.message);
  }
}

async function handleEvent(event) {
  const { type, data } = event;

  if (!data || !data.userEmail) {
    console.warn(`[Notification] Skipping ${type} — no userEmail`);
    return;
  }

  console.log(`[Notification] Processing ${type} for ${data.userEmail}`);

  switch (type) {
    case 'ORDER_CREATED': {
      const email = buildOrderCreatedEmail(data);
      await sendEmail(data.userEmail, email.subject, email.html);
      break;
    }
    case 'ORDER_PAID': {
      const email = buildOrderPaidEmail(data);
      await sendEmail(data.userEmail, email.subject, email.html);
      break;
    }
    case 'ORDER_DELIVERED': {
      const email = buildOrderDeliveredEmail(data);
      await sendEmail(data.userEmail, email.subject, email.html);
      break;
    }
    case 'ORDER_CANCELLED': {
      const email = buildOrderCancelledEmail(data);
      await sendEmail(data.userEmail, email.subject, email.html);
      break;
    }
    default:
      console.log(`[Notification] Unknown event type: ${type}`);
  }
}

module.exports = { handleEvent };
