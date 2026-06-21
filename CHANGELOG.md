# SOAP Project — Changelog & Architecture

## Tổng quan kiến trúc (Microservices)

```
                                   ┌──────────────────┐
                                   │    Frontend      │
                                   │   (React + Vite) │
                                   └────────┬─────────┘
                                            │ :5173
                                   ┌────────▼─────────┐
                                   │      Nginx       │
                                   │   Reverse Proxy  │
                                   └──┬───┬───┬───┬───┘
                                      │   │   │   │
                       ┌──────────────┘   │   │   └──────────────┐
                       ▼                  ▼   ▼                  ▼
              ┌───────────────┐   ┌───────────────┐   ┌──────────────────┐
              │ identity-     │   │ catalog-      │   │    order-        │
              │ service :3001 │   │ service :3002 │   │  service :3003   │
              │ (auth/users)  │   │ (products/    │   │ (orders/         │
              │               │   │  brands/...)  │   │  promotions)     │
              └───────────────┘   └───────────────┘   └────────┬─────────┘
                       │                                       │
                       │                                       │ HTTP
                       ▼                                       ▼
              ┌───────────────┐                        ┌───────────────┐
              │  payment-     │                        │    Redis      │
              │ service :3004 │                        │  (event bus)  │
              │ (MoMo sandbox)│                        └───────┬───────┘
              └───────────────┘                                │
                                                               │ subscribe
                                                               ▼
                                                      ┌──────────────────┐
                                                      │  notification-   │
                                                      │  service :3005   │
                                                      │  (Nodemailer)    │
                                                      └──────────────────┘
```

---

## Phase 1 — Refactor monolith → microservices

### Mục tiêu
Tách monolith `Backend/` thành các microservice riêng, chuyển cart sang localStorage.

### Thay đổi

#### 1. Xoá monolith
- `Backend/` — toàn bộ thư mục (controller, model, route cũ)

#### 2. Xoá cart-service
- `cart-service/` — toàn bộ thư mục

#### 3. order-service — Gọi catalog-service qua HTTP
- **File: `order-service/app/controllers/orderController.js`**
  - `createOrder`: thay `Product.findByIdAndUpdate` bằng `axios.post` đến catalog-service `/api/products/:id/reduce-stock` (kèm `x-internal-key`)
  - `updateOrder` (delivered): gọi `/api/products/:id/increment-sold`
  - `updateOrder` (cancelled): gọi `/api/products/:id/restore-stock`
  - `cancelOrder`: gọi `/api/products/:id/restore-stock`
- **File: `order-service/app/routes/index.js`**
  - Thêm `router.use('/promotions', require('./promotions'))`

#### 4. catalog-service — Internal auth + stock APIs
- **File mới: `catalog-service/app/middleware/internalAuth.js`**
  - Kiểm tra header `x-internal-key`
- **File: `catalog-service/app/controllers/productController.js`**
  - `reduceStock`: `$inc: { stock: -quantity }` (atomic)
  - `restoreStock`: `$inc: { stock: quantity }`
  - `incrementSold`: `$inc: { sold: quantity }`
- **File: `catalog-service/app/routes/products.js`**
  - Gắn `internalAuth` vào 3 internal endpoints
- **File: `catalog-service/.env`**
  - Thêm `INTERNAL_API_KEY=internal123`
- Thêm models/controllers/routes cho **reviews**, **wishlist**, **news**
- `routes/index.js`: thêm `/reviews`, `/wishlist`, `/news`

#### 5. order-service — Promotions CRUD
- **File mới:** `models/Promotion.js`, `controllers/promotionController.js`, `routes/promotions.js`

#### 6. Frontend — Cart → localStorage
- **File: `Frontend/src/context/CartContext.jsx`**
  - Bỏ API calls, dùng `localStorage` (addToCart, updateQuantity, removeFromCart, clearCart, resetCart)
- **File: `Frontend/src/components/CartItem.jsx`**
  - `productUrl` dùng `item.productSlug || item.productId`

#### 7. Nginx + Docker
- **File: `nginx/nginx.conf`**
  - Thêm blocks: `/api/promotions` → order-service, `/api/reviews`, `/api/wishlist`, `/api/news` → catalog-service
  - Xoá monolith
- **File: `docker-compose.yml`**
  - Xoá `monolith` service

---

## Phase 2 — payment-service (MoMo sandbox)

### Mục tiêu
Thêm payment-service riêng với MoMo sandbox, order-service gọi HTTP để tạo payment URL, payment-service nhận webhook callback.

### Thay đổi

#### 1. Mới: `payment-service/`
- **`package.json`** — Express + axios + winston
- **`Dockerfile`** — node:18-alpine
- **`.env`** — MoMo sandbox credentials + redirect/ipn URLs
- **`app.js`** — Express server port 3004, mount routes tại `/api`
- **`app/config/momo.js`** — MoMo sandbox config
- **`app/config/logger.js`** — Winston logger (console + daily rotate)
- **`app/utils/signature.js`** — HMAC SHA256 create + verify
- **`app/utils/httpClient.js`** — axios wrapper
- **`app/controllers/paymentController.js`**:
  - `createPayment` — `POST /api/payment/create` → gọi MoMo API `https://test-payment.momo.vn/v2/gateway/api/create`, trả `payUrl`
  - `ipnHandler` — `POST /api/payment/ipn` verify signature → gọi order-service `PATCH /orders/:id/payment-status`
  - `paymentReturn` — `GET /api/payment/return` redirect user sang frontend `/payment/return`
- **`app/routes/payment.js`** — 3 endpoints
- **`app/routes/index.js`** — mount + health endpoint

#### 2. Sửa: `order-service/`
- **`app/controllers/orderController.js`**:
  - Thêm `PAYMENT_SERVICE_URL`
  - `createOrder`: nếu `paymentMethod === 'momo'`, gọi payment-service → lưu `paymentUrl` → trả về response
  - Thêm `updatePaymentStatus` (internal) — cập nhật `paymentStatus`, `paymentTransactionId`, `paidAt`
- **`app/routes/orders.js`**:
  - Thêm `PATCH /:id/payment-status` (internalAuth)
- **File mới: `app/middleware/internalAuth.js`**
- **`.env`** — thêm `PAYMENT_SERVICE_URL=http://payment-service:3004`

#### 3. Sửa: `Frontend/`
- **`CheckoutPage.jsx`**:
  - MoMo active (bỏ disabled), chọn MoMo → redirect sang `payUrl` sau đặt hàng
- **`PaymentReturnPage.jsx`** (mới) — hiển thị kết quả thanh toán (success/failed)
- **`App.jsx`** — thêm route `/payment/return`
- **`AccountPage.jsx`** — thêm mapping `'momo' ? 'MoMo'`

#### 4. Nginx + Docker
- **`nginx/nginx.conf`** — thêm `location /api/payment` → payment-service:3004
- **`docker-compose.yml`** — thêm `payment-service` service

---

## Phase 3 — notification-service + Redis event bus

### Mục tiêu
Thêm Redis làm event bus. order-service publish event, notification-service subscribe và gửi email qua Nodemailer (Gmail SMTP). Pattern async, loosely coupled.

### Architecture events

```
order-service ──pub──> Redis ──sub──> notification-service ──> Gmail SMTP
                          │
                    channel: "order:events"
```

### Thay đổi

#### 1. Redis
- **`docker-compose.yml`** — thêm service `redis:7-alpine`, port 6379

#### 2. Mới: `notification-service/`
- **`package.json`** — Express + ioredis + nodemailer
- **`Dockerfile`** — node:18-alpine
- **`.env`** — Redis URL, Gmail SMTP config
- **`app.js`** — Express server port 3005 (healthcheck) + khởi động Redis subscriber
- **`app/config/email.js`** — Nodemailer transporter (Gmail SMTP, STARTTLS)
- **`app/services/eventSubscriber.js`** — Subscribe Redis channel `order:events`, parse JSON message, gọi `handleEvent`
- **`app/services/emailService.js`** — 4 email templates HTML (ORDER_CREATED, ORDER_PAID, ORDER_DELIVERED, ORDER_CANCELLED) + sendEmail
- **Nếu chưa config SMTP → log ra console**, không crash

#### 3. Sửa: `identity-service/`
- **File mới: `app/middleware/internalAuth.js`**
- **`app/controllers/userController.js`** — thêm `getUserById` (trả user, bỏ password)
- **`app/routes/users.js`** — thêm `GET /:id` (internalAuth)
- **`.env`** — thêm `INTERNAL_API_KEY=internal123`

#### 4. Sửa: `order-service/`
- **File mới: `app/utils/eventBus.js`** — Redis pub helper (lazy init, fire-and-forget via `setImmediate`)
  - `publishOrderCreated(order)`
  - `publishOrderPaid(order)`
  - `publishOrderDelivered(order)`
  - `publishOrderCancelled(order)`
- **`app/models/Order.js`** — thêm `userEmail: String`
- **`app/controllers/orderController.js`**:
  - `createOrder`: fetch userEmail từ identity-service (`GET /api/users/:id`), save, publish `ORDER_CREATED`
  - `updateOrder`: publish `ORDER_DELIVERED` / `ORDER_CANCELLED`
  - `updatePaymentStatus`: publish `ORDER_PAID`
  - `cancelOrder`: publish `ORDER_CANCELLED`
- **`package.json`** — thêm `ioredis`
- **`.env`** — thêm `REDIS_URL`, `IDENTITY_SERVICE_URL`

#### 5. Docker
- **`docker-compose.yml`**:
  - order-service: thêm `depends_on: redis`, env `REDIS_URL`, `IDENTITY_SERVICE_URL`
  - Thêm `notification-service` service

---

## Hướng dẫn chạy project

### Yêu cầu
- Docker & Docker Compose
- Git

### Các bước

```bash
# 1. Clone & cd
cd SOAP

# 2. Build & start tất cả services
docker-compose up --build

# 3. Mở trình duyệt
# Frontend:    http://localhost:8080
# (nginx proxy port 8080 → frontend :5173)
```

### Services & Ports

| Service | Internal Port | Nginx Route |
|---------|--------------|-------------|
| Frontend (Vite) | 5173 | `/*` |
| Nginx | 80 (host 8080) | — |
| identity-service | 3001 | `/api/auth`, `/api/users` |
| catalog-service | 3002 | `/api/products`, `/api/brands`, `/api/categories`, `/api/reviews`, `/api/wishlist`, `/api/news` |
| order-service | 3003 | `/api/orders`, `/api/promotions` |
| payment-service | 3004 | `/api/payment` |
| notification-service | 3005 | (internal healthcheck only) |
| Redis | 6379 | — |

### Config Gmail SMTP (cho email thật)

Mở `notification-service/.env` và set:

```env
SMTP_USER=your.email@gmail.com
SMTP_PASS=your-16-char-gmail-app-password
```

> **Cách tạo App Password Gmail:**
> 1. Vào https://myaccount.google.com/security
> 2. Bật 2-Step Verification
> 3. App passwords → chọn Mail + Windows → generate
> 4. Copy 16 ký tự vào `SMTP_PASS`

Nếu **không config**, email sẽ được **log ra console** — không crash.

### MoMo Sandbox Test

MoMo sandbox dùng credentials mặc định:
- `partnerCode=MOMO`
- `accessKey=F8BBA842ECF85`
- `secretKey=K951B6PE1waDMi640xX08PD3vg6EkVlz`

Khi test local, MoMo IPN không thể gọi vào Docker internal network. Để test:
1. Dùng **ngrok** expose payment-service: `ngrok http 3004`
2. Set `MOMO_IPN_URL=https://your-ngrok.ngrok.io/api/payment/ipn` trong payment-service `.env`
3. Hoặc dùng MoMo sandbox test page để mô phỏng callback

### Internal API Key

Tất cả service dùng chung `INTERNAL_API_KEY=internal123` (set trong .env của mỗi service).
Dùng cho giao tiếp nội bộ giữa các service, không lộ ra ngoài.
