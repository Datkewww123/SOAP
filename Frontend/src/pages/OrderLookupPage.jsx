// src/pages/OrderLookupPage.jsx
import React, { useState } from "react";
import { fetchApi } from "../utils/api";
import { toast } from "react-toastify";

const getStatusColor = (status) => {
  switch (status?.toLowerCase()) {
    case "delivered":
    case "completed":
      return "text-green-600 bg-green-50";
    case "shipping":
    case "delivering":
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
  switch (status?.toLowerCase()) {
    case "delivered":
    case "completed":
      return "Đã giao";
    case "shipping":
    case "delivering":
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

export default function OrderLookupPage() {
  // State để lưu mã đơn hàng người dùng nhập
  const [orderId, setOrderId] = useState("");
  const [phoneNumber, setPhoneNumber] = useState(""); // State để lưu kết quả tra cứu (Sửa cấu trúc để lưu chi tiết items)
  const [lookupResult, setLookupResult] = useState(null); // State để biết có đang "tải" hay không
  const [isLoading, setIsLoading] = useState(false); // Hàm xử lý khi nhấn nút "Tra cứu"

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!orderId.trim() && !phoneNumber.trim()) {
      toast.error("Vui lòng nhập mã đơn hàng hoặc số điện thoại");
      return;
    }

    setIsLoading(true);
    setLookupResult(null);

    try {
      // Gọi API tra cứu đơn hàng công khai (dùng Query string)
      const data = await fetchApi(
        `/orders/lookup?orderId=${orderId}&phone=${phoneNumber}`
      );
      
      console.log("=== LOOKUP RESPONSE ===");
      console.log("Raw data:", data);
      
      // fetchApi có thể wrap response trong data property
      const orderData = data.data || data;
      console.log("Order data:", orderData);
      console.log("Has _id?", orderData && orderData._id);
      
      // Backend trả về dữ liệu đơn hàng trực tiếp
      if (orderData && orderData._id) {
        // Map dữ liệu từ Backend
        setLookupResult({
          status: "success",
          // Ưu tiên dùng orderCode, nếu không có thì dùng 6 ký tự cuối _id
          id: orderData.orderCode || `#${orderData._id.slice(-6).toUpperCase()}`,
          date: new Date(orderData.createdAt).toLocaleDateString("vi-VN", {
            year: 'numeric',
            month: 'long',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
          }),
          // Sử dụng trường 'customer' được Backend map từ shippingAddress
          customer: orderData.customer || orderData.shippingAddress?.fullName || "Khách hàng",
          phone: orderData.shippingAddress?.phone || phoneNumber,
          address: orderData.shippingAddress ? 
            `${orderData.shippingAddress.street}, ${orderData.shippingAddress.ward}, ${orderData.shippingAddress.district}, ${orderData.shippingAddress.province}` 
            : '',
          items: orderData.items, // LƯU TRỮ TOÀN BỘ MẢNG ITEMS
          total: orderData.total, // Lưu tổng tiền dưới dạng số
          orderStatus: orderData.status,
          paymentMethod: orderData.paymentMethod,
        });
      } else {
        setLookupResult({
          status: "error",
          message:
            "Không tìm thấy đơn hàng. Vui lòng kiểm tra lại mã đơn hàng hoặc số điện thoại.",
        });
      }
    } catch (error) {
      // Xử lý lỗi từ fetchApi (bao gồm lỗi 404 từ Backend)
      const errorMessage =
        error.response?.error || "Lỗi khi tra cứu. Vui lòng thử lại.";
      setLookupResult({
        status: "error",
        message: errorMessage,
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="container w-[90%] max-w-[700px] mx-auto mt-10 py-10">
      <h1 className="text-3xl font-bold text-center mb-8">Tra Cứu Đơn Hàng</h1> 
      <p className="text-center text-gray-600 mb-6">
        Vui lòng nhập Mã đơn hàng hoặc Số điện thoại để tra cứu thông tin đơn
        hàng của bạn.
      </p>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 bg-white p-8 rounded-lg shadow-md"
      >
        <div>
          <label htmlFor="orderId" className="block text-sm font-bold mb-1">
            Mã đơn hàng
          </label>
          <input
            type="text"
            id="orderId"
            value={orderId}
            onChange={(e) => setOrderId(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md"
            placeholder="Nhập mã đơn hàng"
          />
        </div>
        <div>
          <label htmlFor="phoneNumber" className="block text-sm font-bold mb-1">
            Số điện thoại
          </label>
          <input
            type="tel"
            id="phoneNumber"
            value={phoneNumber}
            onChange={(e) => setPhoneNumber(e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-md"
            placeholder="Nhập số điện thoại"
          />
        </div>
        <button
          type="submit"
          disabled={isLoading}
          className="w-full bg-primary text-white text-lg font-bold uppercase py-3 px-6 rounded-md transition-colors hover:bg-primary-dark mt-4 disabled:bg-gray-400"
        >
          {isLoading ? "Đang tra cứu..." : "Tra cứu"}
        </button>
      </form>
      {lookupResult && (
        <div className="mt-8 bg-white p-8 rounded-lg shadow-md">
          <h2 className="text-2xl font-bold mb-4">Kết quả tra cứu</h2>
          {/* Nếu tra cứu thất bại */}
          {lookupResult.status === "error" && (
            <p className="text-red-500">{lookupResult.message}</p>
          )}
          {/* Nếu tra cứu thành công */}
          {lookupResult.status === "success" && (
            <div className="flex flex-col gap-4">
              {/* Thông tin chung */}
              <div className="border-b pb-4 space-y-3">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <p className="text-lg">
                      <strong>Mã đơn hàng:</strong>
                      <span className="ml-2 text-primary font-bold">{lookupResult.id}</span>
                    </p>
                    <p className="text-sm text-gray-600 mt-1">
                      <strong>Ngày đặt:</strong>
                      <span className="ml-2">{lookupResult.date}</span>
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(
                      lookupResult.orderStatus
                    )}`}
                  >
                    {getStatusText(lookupResult.orderStatus)}
                  </span>
                </div>

                <p>
                  <strong>Khách hàng:</strong>
                  <span className="ml-2">{lookupResult.customer}</span>
                </p>
                
                {lookupResult.phone && (
                  <p>
                    <strong>Số điện thoại:</strong>
                    <span className="ml-2">{lookupResult.phone}</span>
                  </p>
                )}
                
                {lookupResult.address && (
                  <p>
                    <strong>Địa chỉ giao hàng:</strong>
                    <span className="ml-2 text-sm">{lookupResult.address}</span>
                  </p>
                )}
                
                {lookupResult.paymentMethod && (
                  <p>
                    <strong>Phương thức thanh toán:</strong>
                    <span className="ml-2">
                      {lookupResult.paymentMethod === 'cod' ? 'COD - Thanh toán khi nhận hàng' : 
                       lookupResult.paymentMethod === 'bank_transfer' ? 'Chuyển khoản ngân hàng' :
                       lookupResult.paymentMethod.toUpperCase()}
                    </span>
                  </p>
                )}
              </div>
              <h3 className="text-lg font-bold mt-2">Sản phẩm đã đặt:</h3>
              <div className="space-y-3">
                {Array.isArray(lookupResult.items) &&
                  lookupResult.items.map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start justify-between border-b pb-3 last:border-b-0"
                    >
                      <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 flex-1">
                        <img
                          src={
                            item.imageUrl ||
                            item.image ||
                            "https://placehold.co/150x150?text=No+Image"
                          }
                          alt={item.name}
                          className="w-16 h-16 object-cover rounded-md border"
                          onError={(e) => {
                            e.currentTarget.src = "https://placehold.co/150x150?text=No+Image";
                          }}
                        />
                        <div className="flex-1">
                          <p className="font-medium">{item.name}</p>
                          {item.selectedSize && (
                            <p className="text-sm text-gray-600">Size: {item.selectedSize}</p>
                          )}
                          <p className="text-sm text-gray-500">
                            Số lượng: {item.quantity}
                          </p>
                          <p className="text-sm font-semibold text-primary">
                            Đơn giá: {(item.price || 0).toLocaleString("vi-VN")}₫
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-lg text-red-600">
                          {((item.price || 0) * item.quantity).toLocaleString("vi-VN")}₫
                        </p>
                      </div>
                    </div>
                  ))}
              </div>
              <div className="flex justify-between items-center font-bold text-xl border-t-2 pt-4 mt-2">
                <span>Tổng cộng:</span>
                <span className="text-red-600 text-2xl">
                  {lookupResult.total
                    ? lookupResult.total.toLocaleString("vi-VN")
                    : "0"}₫
                </span>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
