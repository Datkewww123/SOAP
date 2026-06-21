// src/pages/AccountPage.jsx (Đã sửa hoàn chỉnh)
import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { fetchApi } from "../utils/api"; // THÊM: Import fetchApi
import { toast } from "react-toastify"; // THÊM: Import toast

// (Component con cho nội dung Tab Profile) - ĐÃ SỬA để Cập nhật
function ProfileTab({ user }) {
  // State để quản lý dữ liệu form, sử dụng các trường từ user object
  const [formData, setFormData] = useState({
    name: user.name || "",
    phone: user.phone || "",
    address: user.address || "",
  });

  // Hàm xử lý nhập liệu
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  // HÀM GỌI API CẬP NHẬT PROFILE
  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      // Endpoint: PUT /users/:id (Backend API để cập nhật thông tin)
      const updatedUser = await fetchApi(`/users/${user._id}`, {
        method: "PUT",
        body: JSON.stringify(formData),
      });

      // Trong một ứng dụng thật, bạn sẽ cần gọi hàm từ AuthContext
      // để cập nhật state currentUser trên toàn bộ ứng dụng (ví dụ: updateAuth(updatedUser)).
      // Ở đây, ta chỉ dựa vào thông báo và reload thủ công nếu cần.

      toast.success("Cập nhật thông tin thành công!");
    } catch (error) {
      console.error("Lỗi khi cập nhật profile:", error);
      toast.error(error.message || "Cập nhật thất bại.");
    }
  };

  return (
    <div>
      <h2 className="text-2xl font-bold mb-4 dark:text-white">Thông tin tài khoản</h2>
      <form onSubmit={handleUpdateProfile} className="space-y-4">
        <div>
          <label htmlFor="name" className="block text-sm font-bold mb-1 dark:text-gray-200">
            Họ và tên
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            className="w-full p-3 border rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600"
          />
        </div>
        <div>
          <label htmlFor="email" className="block text-sm font-bold mb-1 dark:text-gray-200">
            Email
          </label>
          <input
            type="email"
            id="email"
            value={user.email}
            readOnly
            className="w-full p-3 border rounded-md bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600"
          />
        </div>
        <div>
          <label htmlFor="phone" className="block text-sm font-bold mb-1 dark:text-gray-200">
            Số điện thoại
          </label>
          <input
            type="tel"
            id="phone"
            name="phone"
            value={formData.phone}
            onChange={handleInputChange}
            className="w-full p-3 border rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600"
          />
        </div>
        <div>
          <label htmlFor="address" className="block text-sm font-bold mb-1 dark:text-gray-200">
            Địa chỉ
          </label>
          <input
            type="text"
            id="address"
            name="address"
            value={formData.address}
            onChange={handleInputChange}
            className="w-full p-3 border rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600"
          />
        </div>
        <button
          type="submit"
          className="bg-primary text-white font-bold py-3 px-6 rounded-md hover:bg-primary-dark transition-colors"
        >
          Cập nhật
        </button>
      </form>
    </div>
  );
}

// (Component con cho nội dung Tab "Orders") - ĐÃ CÓ LOGIC API
function OrdersTab({ currentUser }) {
  // Nhận currentUser từ component cha
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredOrders, setFilteredOrders] = useState([]);

  // Fetch orders from API
  const fetchOrders = useCallback(async () => {
    if (!currentUser) {
      setOrders([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      // Endpoint: GET /orders (Lấy tất cả đơn hàng của user)
      const response = await fetchApi("/orders?limit=100");
      console.log("Orders response:", response);
      
      // fetchApi wrap response: { success: true, data: { orders: [...], pagination: {...} } }
      // Hoặc trả về trực tiếp: { orders: [...], pagination: {...} }
      let ordersList = [];
      
      if (response.data && response.data.orders) {
        // Format mới từ fetchApi wrapper
        ordersList = response.data.orders;
      } else if (response.orders) {
        // Format cũ trực tiếp
        ordersList = response.orders;
      }
      
      console.log("Orders list:", ordersList);
      console.log("Is ordersList an array?", Array.isArray(ordersList));
      
      // Đảm bảo luôn là array
      if (Array.isArray(ordersList)) {
        setOrders(ordersList);
        setFilteredOrders(ordersList);
      } else {
        console.error("Orders list is not an array:", ordersList);
        setOrders([]);
        setFilteredOrders([]);
      }
    } catch (error) {
      console.error("Lỗi khi tải đơn hàng:", error);
      toast.error("Không thể tải lịch sử đơn hàng");
      setOrders([]);
      setFilteredOrders([]);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  // Tìm kiếm đơn hàng
  const handleSearch = (query) => {
    setSearchQuery(query);
    if (!query.trim()) {
      setFilteredOrders(orders);
      return;
    }
    
    const searchLower = query.toLowerCase();
    const filtered = orders.filter(order => {
      const orderCode = order.orderCode || '';
      const items = order.items || [];
      const itemNames = items.map(item => item.name || '').join(' ');
      
      return (
        orderCode.toLowerCase().includes(searchLower) ||
        itemNames.toLowerCase().includes(searchLower)
      );
    });
    
    setFilteredOrders(filtered);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    setFilteredOrders(orders);
  };

  // Helper để hiển thị trạng thái và màu sắc
  const getStatusColor = (status) => {
    switch (status) {
      case "delivered":
        return "text-green-600 bg-green-50";
      case "shipping":
        return "text-blue-600 bg-blue-50";
      case "confirmed":
        return "text-indigo-600 bg-indigo-50";
      case "pending":
        return "text-yellow-600 bg-yellow-50";
      case "cancelled":
        return "text-red-600 bg-red-50";
      default:
        return "text-gray-600 bg-gray-50";
    }
  };

  const getStatusText = (status) => {
    switch (status) {
      case "delivered":
        return "Đã giao";
      case "shipping":
        return "Đang giao";
      case "confirmed":
        return "Đã xác nhận";
      case "pending":
        return "Chờ xác nhận";
      case "cancelled":
        return "Đã hủy";
      default:
        return status;
    }
  };

  if (loading) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-4 dark:text-white">Lịch sử đơn hàng</h2>
        <p className="dark:text-gray-300">Đang tải đơn hàng...</p>
      </div>
    );
  }

  if (!Array.isArray(orders) || orders.length === 0) {
    return (
      <div>
        <h2 className="text-2xl font-bold mb-4 dark:text-white">Lịch sử đơn hàng</h2>
        <p className="dark:text-gray-300">Bạn chưa có đơn hàng nào.</p>
      </div>
    );
  }

  return (
    <div>
        <h2 className="text-2xl font-bold mb-4 dark:text-white">
          Lịch sử đơn hàng ({Array.isArray(orders) ? orders.length : 0})
      </h2>
      
      {/* Search box */}
      <div className="mb-6">
        <div className="flex gap-2">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            placeholder="Tìm theo mã đơn hàng hoặc tên sản phẩm..."
            className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
          />
          {searchQuery && (
            <button
              onClick={handleClearSearch}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Xóa
            </button>
          )}
        </div>
        {searchQuery && (
          <p className="text-sm text-gray-600 mt-2">
            Tìm thấy {filteredOrders.length} đơn hàng
          </p>
        )}
      </div>
      
      <div className="space-y-4">
        {Array.isArray(filteredOrders) && filteredOrders.map((order) => (
          <div key={order._id} className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg shadow-sm bg-white dark:bg-gray-800 hover:shadow-md transition-shadow">
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
              <div>
                <p className="font-bold text-lg">
                  Mã: {order.orderCode || `#${order._id.slice(-8).toUpperCase()}`}
                </p>
                <p className="text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString("vi-VN", {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                    hour: '2-digit',
                    minute: '2-digit'
                  })}
                </p>
              </div>
              <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                {getStatusText(order.status)}
              </span>
            </div>
            
            <div className="border-t pt-3 space-y-2">
              <div className="flex justify-between">
                <span className="text-gray-600">Tổng tiền:</span>
                <span className="font-bold text-lg text-primary">
                  {order.total ? order.total.toLocaleString("vi-VN") : "0"} ₫
                </span>
              </div>
              
              <div className="flex justify-between text-sm">
                <span className="text-gray-600">Thanh toán:</span>
                <span className="font-medium">
                  {order.paymentMethod === 'cod' ? 'COD' : 
                   order.paymentMethod === 'bank_transfer' ? 'Chuyển khoản' : 
                   order.paymentMethod === 'momo' ? 'MoMo' :
                   order.paymentMethod.toUpperCase()}
                </span>
              </div>
              
              {order.shippingAddress && (
                <div className="text-sm text-gray-600">
                  <span className="font-medium">Giao đến:</span> {order.shippingAddress.fullName} - {order.shippingAddress.phone}
                </div>
              )}
            </div>
            
            <div className="mt-3 border-t pt-3">
              <p className="text-sm font-semibold mb-2">Sản phẩm:</p>
              <div className="space-y-1">
                {order.items && order.items.length > 0 ? (
                  <>
                    {order.items.slice(0, 3).map((item, idx) => (
                      <div key={idx} className="flex justify-between text-sm">
                        <span className="text-gray-700 truncate flex-1">
                          {item.name} {item.selectedSize ? `(Size: ${item.selectedSize})` : ''}
                        </span>
                        <span className="text-gray-600 ml-2">x{item.quantity}</span>
                      </div>
                    ))}
                    {order.items.length > 3 && (
                      <p className="text-sm text-gray-500 italic">
                        ... và {order.items.length - 3} sản phẩm khác
                      </p>
                    )}
                  </>
                ) : (
                  <p className="text-sm text-gray-500">Không có sản phẩm</p>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// Component chính
export default function AccountPage() {
  const { currentUser, logout } = useAuth();
  const { resetCart } = useCart();
  const navigate = useNavigate();

  const [activeTab, setActiveTab] = useState("profile");

  // LOGIC BẢO VỆ LỘ TRÌNH (PRIVATE ROUTE)
  useEffect(() => {
    if (currentUser === null) {
      navigate("/dang-nhap");
    }
  }, [currentUser, navigate]);

  // Hàm xử lý đăng xuất
  const handleLogout = () => {
    resetCart();
    logout();
    navigate("/");
  };

  if (currentUser === null) {
    return null;
  }

  // Nếu đã đăng nhập, hiển thị layout 2 cột
  return (
    <div className="container w-[90%] max-w-[1000px] mx-auto mt-10 py-10 dark:text-gray-100">
      <h1 className="text-3xl font-bold text-center mb-8 dark:text-white">Tài Khoản Của Bạn</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        {/* CỘT TRÁI: MENU ĐIỀU HƯỚNG */}
        <div className="md:col-span-1">
          <div className="flex flex-col gap-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md dark:shadow-gray-900/50">
            <button
              onClick={() => setActiveTab("profile")}
              className={`w-full text-left p-3 rounded-md font-bold ${
                activeTab === "profile"
                  ? "bg-primary text-white"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700"
              }`}
            >
              Thông tin tài khoản
            </button>
            <button
              onClick={() => setActiveTab("orders")}
              className={`w-full text-left p-3 rounded-md font-bold ${
                activeTab === "orders"
                  ? "bg-primary text-white"
                  : "hover:bg-gray-100 dark:hover:bg-gray-700 dark:text-gray-200"
              }`}
            >
              Lịch sử đơn hàng
            </button>
            <button
              onClick={handleLogout}
              className="w-full text-left p-3 rounded-md font-bold text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Đăng xuất
            </button>
          </div>
        </div>

        {/* CỘT PHẢI: NỘI DUNG TAB */}
        <div className="md:col-span-3 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md dark:shadow-gray-900/50">
          {activeTab === "profile" && <ProfileTab user={currentUser} />}
          {/* SỬA: Truyền currentUser prop cho OrdersTab để khớp với định nghĩa hàm */}
          {activeTab === "orders" && <OrdersTab currentUser={currentUser} />}
        </div>
      </div>
    </div>
  );
}
