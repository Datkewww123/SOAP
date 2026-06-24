# THSPORT - E-commerce giày bóng đá

Nền tảng thương mại điện tử chuyên giày bóng đá và phụ kiện thể thao, xây dựng với kiến trúc microservices.

## Công nghệ

### Frontend
- **React 18** + Vite
- **Tailwind CSS** (dark mode)
- React Router v6
- React Toastify

### Backend (Microservices)
- **Node.js** + Express
- **Sequelize ORM** + MySQL
- **JWT** authentication (HTTP-only cookie)
- **bcrypt** password hashing
- **Joi** validation

### Services
| Service | Port | Mô tả |
|---------|------|-------|
| `identity-service` | 3001 | Auth, users, addresses |
| `catalog-service` | 3002 | Products, categories, brands |
| `order-service` | 3003 | Orders |
| `payment-service` | 3004 | Payments (MoMo, COD) |
| `notification-service` | 3005 | Notifications |
| **API Gateway** (nginx) | **8080** | Reverse proxy |

## Yêu cầu

- Node.js >= 18
- MySQL >= 8.0
- npm

## Cài đặt

```bash
# Clone repo
git clone https://github.com/Datkewww123/Sport_Shop_Microservices.git
cd SOAP

# Cài dependencies cho từng service
cd identity-service && npm install && cd ..
cd catalog-service && npm install && cd ..
cd order-service && npm install && cd ..
cd payment-service && npm install && cd ..
cd notification-service && npm install && cd ..
cd Frontend && npm install && cd ..

# Tạo file .env cho các service (xem .env.example)
```

## Cấu hình

Tạo file `.env` trong mỗi service:

### identity-service/.env
```
PORT=3001
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sport_shop
DB_USER=root
DB_PASSWORD=your_password
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d
INTERNAL_API_KEY=your_internal_key
```

### catalog-service/.env
```
PORT=3002
DB_HOST=localhost
DB_PORT=3306
DB_NAME=sport_shop
DB_USER=root
DB_PASSWORD=your_password
INTERNAL_API_KEY=your_internal_key
```

## Khởi chạy

### 1. Database
```bash
mysql -u root -p < init.sql
```

### 2. Seed data
```bash
node seed.js
```

### 3. Backend services
```bash
# Chạy từng service (mỗi service một terminal)
cd identity-service && npm start
cd catalog-service && npm start
cd order-service && npm start
cd payment-service && npm start
cd notification-service && npm start
```

### 4. Frontend
```bash
cd Frontend && npm run dev
```

### 5. API Gateway (nginx)
Cấu hình nginx từ thư mục `nginx/` và khởi chạy.

## Truy cập

- **Frontend**: http://localhost:5173
- **API Gateway**: http://localhost:8080/api
- **Admin**: Đăng nhập với tài khoản có role `admin`

## Tính năng chính

- Đăng ký / Đăng nhập / Quên mật khẩu
- Xem danh mục sản phẩm, tìm kiếm, lọc
- Giỏ hàng, thanh toán (COD, MoMo)
- Quản lý địa chỉ giao hàng
- Lịch sử đơn hàng
- Admin dashboard (quản lý sản phẩm, đơn hàng, users)
- Dark mode

## API Docs (Swagger)

Khi các service đang chạy, truy cập:

- **Tổng hợp**: http://localhost:5173/api-docs.html
- **Identity Service**: http://localhost:3001/api-docs
- **Catalog Service**: http://localhost:3002/api-docs
- **Order Service**: http://localhost:3003/api-docs

## Cấu trúc thư mục

```
SOAP/
├── Frontend/                # React app
│   └── src/
│       ├── components/      # Header, Footer, UI components
│       ├── context/         # AuthContext, CartContext
│       ├── pages/           # Pages & admin pages
│       └── utils/           # API helper
├── identity-service/        # Auth, users, addresses
├── catalog-service/         # Products, categories, brands
├── order-service/           # Orders
├── payment-service/         # Payments
├── notification-service/    # Notifications
├── nginx/                   # API Gateway config
├── seed.js                  # Database seeder
└── init.sql                 # Database schema
```
