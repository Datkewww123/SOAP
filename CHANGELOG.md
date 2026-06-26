# CHANGELOG - Tính năng Giỏ hàng

## 1. Cơ chế chọn sản phẩm trước khi thanh toán (Shopee-like)

### Vấn đề
Trước đây, khi bấm "Tiến hành thanh toán", **toàn bộ** sản phẩm trong giỏ hàng sẽ được đem đi thanh toán. Không có cách để chọn sản phẩm cụ thể muốn mua.

### Giải pháp
Thêm checkbox cho từng sản phẩm, cho phép người dùng tick chọn sản phẩm muốn mua rồi mới thanh toán.

### File thay đổi

#### `Frontend/src/context/CartContext.jsx`
- Thêm state `selectedIds` (mảng các ID được chọn), lưu vào `localStorage("cart_selected")`
- Thêm các hàm:
  - `toggleItemSelection(itemId)` — chọn/bỏ chọn 1 sản phẩm
  - `selectAllItems()` — chọn tất cả
  - `deselectAllItems()` — bỏ chọn tất cả
  - `removeItems(itemIds)` — xóa nhiều sản phẩm cùng lúc (dùng sau checkout)
- Thêm computed values:
  - `selectedItems` — danh sách sản phẩm đang được chọn
  - `selectedTotalPrice` — tổng tiền của sản phẩm đã chọn
  - `selectedCount` — số lượng sản phẩm đã chọn
  - `allSelected` — true nếu tất cả đều được chọn
- Khi xóa 1 sản phẩm (`removeFromCart`), tự động loại ID đó khỏi `selectedIds`

#### `Frontend/src/components/CartItem.jsx`
- Thêm checkbox ở đầu mỗi dòng sản phẩm
- Checkbox gọi `toggleItemSelection(item.id)` khi thay đổi
- Highlight nền đỏ nhạt (`bg-red-50/30`) cho sản phẩm đang được chọn
- Grid layout thay đổi: checkbox (1) + product (4) + price (2) + qty (2) + total (2) + delete (1) = 12

#### `Frontend/src/pages/CartPage.jsx`
- Thêm checkbox "Select All" ở header row (desktop)
- `CartSummary` nhận props mới: `selectedTotalPrice`, `selectedCount`, `hasSelection`
- Nút "Tiến hành thanh toán" được **disable** (màu xám) nếu chưa chọn sản phẩm nào
- Hiển thị "Chọn sản phẩm để thanh toán" khi chưa chọn, "Thanh toán (N)" khi đã chọn
- Coupon validation yêu cầu phải chọn sản phẩm trước, subtotal gửi đi dựa trên `selectedTotalPrice`

#### `Frontend/src/pages/CheckoutPage.jsx`
- Sử dụng `selectedItems` thay vì `cartItems` (nếu có chọn)
- Fallback về `cartItems` nếu không có chọn (trường hợp vào thẳng `/thanh-toan`)
- Sau khi đặt hàng thành công, chỉ xóa các item đã thanh toán (`removeItems`), giữ lại item chưa chọn

---

## 2. Xóa giỏ hàng khi logout

### Vấn đề
Khi logout, giỏ hàng vẫn còn hiển thị cho đến khi refresh trang.

### File thay đổi

#### `Frontend/src/context/AuthContext.jsx`
- Thêm `localStorage.removeItem("cart_selected")` vào hàm `logout` (bên cạnh `cart` đã có sẵn)

#### `Frontend/src/context/CartContext.jsx`
- Thêm `useEffect` lắng nghe `currentUser`:
  - Khi `currentUser === null` (logout) → reset `cartItems` về `[]`, reset `selectedIds` về `[]`

---

## 3. Lưu giỏ hàng lên Server (Cross-session persistence)

### Vấn đề
Giỏ hàng chỉ lưu ở `localStorage`. Khi logout rồi login lại, dữ liệu mất vĩnh viễn vì bị xóa khi logout.

### Giải pháp
Tạo database table `cart_items` + API endpoints để đồng bộ giỏ hàng giữa client và server. Giỏ hàng được gắn với user_id, tồn tại trên server ngay cả khi logout.

### Backend - Cart Service (order-service)

#### Model mới: `CartItem` (`order-service/app/models/index.js`)

```javascript
CartItem = sequelize.define('CartItem', {
  id:             { type: DataTypes.INTEGER, primaryKey: true, autoIncrement: true },
  user_id:        { type: DataTypes.INTEGER, allowNull: false },
  product_id:     { type: DataTypes.INTEGER, allowNull: false },
  name:           { type: DataTypes.STRING(255), allowNull: false },
  price:          { type: DataTypes.DECIMAL(15, 0), allowNull: false },
  image:          { type: DataTypes.STRING(500) },
  quantity:       { type: DataTypes.INTEGER, allowNull: false, defaultValue: 1 },
  selected_size:  { type: DataTypes.STRING(20) },
  product_slug:   { type: DataTypes.STRING(255) },
}, { tableName: 'cart_items', timestamps: true, underscored: true });
```

- Table `cart_items` tự động sync khi server khởi động (Sequelize `alter: true`)
- `user_id` dùng để phân biệt giỏ hàng của từng user
- `product_id`, `name`, `price`, `image`, `quantity`, `selected_size`, `product_slug` — thông tin sản phẩm
- `timestamps: true` → tự động có `created_at` và `updated_at`

#### File mới: `order-service/app/controllers/cartController.js`

| Method | Endpoint | Chức năng |
|--------|----------|-----------|
| `getCart` | `GET /api/cart` | Lấy tất cả sản phẩm trong giỏ của user (sắp xếp mới nhất trước) |
| `addToCart` | `POST /api/cart` | Thêm sản phẩm. Nếu đã tồn tại (cùng productId + size) → tăng quantity |
| `updateCartItem` | `PUT /api/cart/:id` | Cập nhật số lượng (kiểm tra > 0) |
| `removeCartItem` | `DELETE /api/cart/:id` | Xóa 1 sản phẩm khỏi giỏ |
| `clearCartItems` | `DELETE /api/cart/clear` | Xóa nhiều sản phẩm theo danh sách ID (dùng sau checkout) |

Tất cả endpoints đều yêu cầu **JWT auth** (middleware `auth`), chỉ user sở hữu mới có thể thao tác với cart item của mình.

#### File mới: `order-service/app/routes/cart.js`

```javascript
router.get("/", auth, cartController.getCart);
router.post("/", auth, cartController.addToCart);
router.put("/:id", auth, cartController.updateCartItem);
router.delete("/clear", auth, cartController.clearCartItems);  // Phải trước /:id
router.delete("/:id", auth, cartController.removeCartItem);
```

Lưu ý: Route `DELETE /clear` được đặt trước `DELETE /:id` để Express match đúng.

#### Sửa: `order-service/app/routes/index.js`
- Thêm `router.use('/cart', require('./cart'));`

#### Sửa: `nginx/nginx.conf`
- Thêm location block `/api/cart` trỏ tới `http://order-service:3003/api/cart`

### Frontend - CartContext rewrite

#### `Frontend/src/context/CartContext.jsx`

**Thay đổi kiến trúc:**
- **Trước đây**: CRUD hoàn toàn trên localStorage (client-side)
- **Sau này**: CRUD qua API server (server-side), state React là nguồn dữ liệu chính

**Chi tiết:**

1. **Import `fetchApi`** từ `../utils/api` để gọi API

2. **Hàm mapping dữ liệu:**
   - `mapServerItem(item)` — chuyển snake_case từ server (ví dụ `product_id`) thành camelCase cho frontend (ví dụ `productId`)
   - `mapLocalItemForServer(item)` — chuyển camelCase frontend thành snake_case cho server

3. **Sync cart khi login/app khởi động:**
   ```javascript
   useEffect(() => {
     if (currentUser) {
       syncCartFromServer();
     } else {
       setCartItems([]);
       setSelectedIds([]);
     }
   }, [currentUser, syncCartFromServer]);
   ```
   - Khi `currentUser` thay đổi (login/logout), tự động sync
   - Logout → clear local state (server cart vẫn còn)
   - Login → fetch cart từ server về

4. **`addToCart`** — gọi `POST /api/cart`, sau đó `syncCartFromServer()` để refresh state

5. **`updateQuantity`** — gọi `PUT /api/cart/:id`, cập nhật local state ngay (optimistic update tránh phải fetch lại toàn bộ)

6. **`removeFromCart`** — gọi `DELETE /api/cart/:id`, filter local state

7. **`removeItems`** — gọi `DELETE /api/cart/clear` với body `{ ids: [...] }`, filter local state

8. **`clearCart`/`resetCart`** — chỉ clear local state (không gọi API, dùng cho các trường hợp đặc biệt)

**Luồng dữ liệu hoàn chỉnh:**

```
User thêm sản phẩm:
  React → POST /api/cart → server lưu DB → response OK → syncCartFromServer() → cập nhật state

User login:
  CartContext phát hiện currentUser thay đổi → GET /api/cart → render

User logout:
  CartContext phát hiện currentUser = null → clear state local
  Server cart vẫn còn nguyên trong database

User login lại:
  GET /api/cart → render lại giỏ hàng cũ

User checkout (thanh toán):
  CheckoutPage gọi removeItems([id1, id2, ...]) → DELETE /api/cart/clear
  Chỉ xóa item đã thanh toán, item chưa chọn vẫn còn
```

### Tổng kết các file đã thay đổi/tạo mới

| File | Trạng thái | Mô tả |
|------|-----------|-------|
| `order-service/app/models/index.js` | Sửa | Thêm CartItem model |
| `order-service/app/controllers/cartController.js` | **Mới** | Cart CRUD controller |
| `order-service/app/routes/cart.js` | **Mới** | Cart API routes |
| `order-service/app/routes/index.js` | Sửa | Đăng ký cart routes |
| `nginx/nginx.conf` | Sửa | Thêm proxy /api/cart → order-service |
| `Frontend/src/context/CartContext.jsx` | Sửa lớn | Server-sync cart logic |
| `Frontend/src/context/AuthContext.jsx` | Sửa | Xóa cart_selected khi logout |
| `Frontend/src/components/CartItem.jsx` | Sửa | Thêm checkbox |
| `Frontend/src/pages/CartPage.jsx` | Sửa | Select All, selected summary |
| `Frontend/src/pages/CheckoutPage.jsx` | Sửa | Dùng selected items |
