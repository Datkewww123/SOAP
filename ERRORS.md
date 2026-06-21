# Session Errors Log

## 1. payment-service crash — `winston.transports.DailyRotateFile is not a constructor`

**File:** `payment-service/app/config/logger.js:25`

**Nguyên nhân:** `winston-daily-rotate-file` không expose transport qua `winston.transports.DailyRotateFile` ở phiên bản mới.

**Fix:** Xoá `DailyRotateFile` transport, chỉ giữ `Console` transport.

---

## 2. notification-service — ioredis subscriber reconnect loop

**File:** `notification-service/app/services/eventSubscriber.js`

**Nguyên nhân:** ioredis subscriber connection bị lỗi `"Connection in subscriber mode, only subscriber commands may be used"` — xảy ra khi ioredis tự động gửi non-subscriber command (ping/select) trên connection đang ở subscriber mode.

**Fix:** Set `lazyConnect: true`, dùng event `ready` thay vì `connect`, ignore lỗi subscriber.

```js
const subscriber = new Redis(REDIS_URL, {
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
  lazyConnect: true,
});
```

---

## 3. CORS — `Not allowed by CORS`

**File:** `order-service/app/middleware/init.js:15`

**Nguyên nhân:** `CORS_ORIGIN` trong `.env` của identity-service, catalog-service, order-service không bao gồm `http://localhost:8080` (nginx port).

**Fix:** Thêm `http://localhost:8080` vào `CORS_ORIGIN` ở cả 3 services.

```env
CORS_ORIGIN=http://...,http://localhost:8080
```

Sau đó restart: `docker compose up -d --force-recreate identity-service catalog-service order-service`

---

## 4. Identity-service 422 Validation — password yếu

**File:** `identity-service/app/validations/authValidation.js:13`

**Nguyên nhân:** Password `"Dat123"` không đạt regex:

```js
const PASSWORD_RULE = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/;
// ít nhất 8 ký tự, 1 chữ hoa, 1 chữ thường, 1 số
```

**Fix:** Thêm hint text trong UI — `Frontend/src/pages/RegisterPage.jsx:69`

```jsx
Mật khẩu * <span className="font-normal text-xs text-gray-500">
  (ít nhất 8 ký tự, gồm chữ hoa, chữ thường và số)
</span>
```

Sau đó rebuild frontend: `docker compose up --build -d frontend`

---

## 5. (Potential) Docker Desktop không chạy

**Nguyên nhân:** Docker daemon không chạy dù service `com.docker.service` đang Running.

**Fix:** Start Docker Desktop từ Start Menu → đợi icon taskbar xanh lá → `docker ps`.
