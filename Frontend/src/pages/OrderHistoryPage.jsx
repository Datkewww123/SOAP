import React, { useState, useEffect, useCallback } from "react";
import { useAuth } from "../context/AuthContext";
import { Link, useNavigate } from "react-router-dom";
import { fetchApi } from "../utils/api";
import { toast } from "react-toastify";
import ConfirmModal from "../components/ConfirmModal";

const getStatusColor = (status) => {
  switch (status) {
    case "delivered": return "text-green-600 bg-green-50";
    case "shipping": return "text-blue-600 bg-blue-50";
    case "confirmed": return "text-indigo-600 bg-indigo-50";
    case "pending": return "text-yellow-600 bg-yellow-50";
    case "cancelled": return "text-red-600 bg-red-50";
    default: return "text-gray-600 bg-gray-50";
  }
};

const getStatusText = (status) => {
  switch (status) {
    case "delivered": return "Đã giao";
    case "shipping": return "Đang giao";
    case "confirmed": return "Đã xác nhận";
    case "pending": return "Chờ xác nhận";
    case "cancelled": return "Đã hủy";
    default: return status;
  }
};

export default function OrderHistoryPage() {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filteredOrders, setFilteredOrders] = useState([]);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    orderId: null,
    orderCode: null,
  });

  useEffect(() => {
    if (currentUser === null) {
      navigate("/");
    }
  }, [currentUser, navigate]);

  const handleConfirmReceived = (orderId, orderCode) => {
    setConfirmModal({
      isOpen: true,
      orderId,
      orderCode,
    });
  };

  const confirmReceivedOrder = async () => {
    const { orderId, orderCode } = confirmModal;
    setConfirmModal({ isOpen: false, orderId: null, orderCode: null });
    try {
      const response = await fetchApi(`/orders/${orderId}/receive`, {
        method: "POST",
      });
      if (response.success || response.data) {
        toast.success(`Xác nhận đã nhận đơn hàng ${orderCode || '#' + String(orderId).slice(-6).toUpperCase()} thành công.`);
        fetchOrders();
      } else {
        toast.error("Có lỗi xảy ra khi xác nhận đơn hàng.");
      }
    } catch (err) {
      toast.error(err.message || "Xác nhận đơn hàng thất bại.");
    }
  };

  const fetchOrders = useCallback(async () => {
    if (!currentUser) {
      setOrders([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const response = await fetchApi("/orders?limit=100");
      let ordersList = [];
      if (response.data && response.data.orders) {
        ordersList = response.data.orders;
      } else if (response.orders) {
        ordersList = response.orders;
      }
      if (Array.isArray(ordersList)) {
        const mappedOrdersList = ordersList.map(order => ({
          ...order,
          orderCode: order.order_code || order.orderCode,
          paymentMethod: order.payment_method || order.paymentMethod || "cod",
          paymentStatus: order.payment_status || order.paymentStatus,
          shippingAddress: order.shippingAddress || {
            fullName: order.shipping_full_name || order.shippingAddress?.fullName,
            phone: order.shipping_phone || order.shippingAddress?.phone,
            province: order.shipping_province || order.shippingAddress?.province,
            district: order.shipping_district || order.shippingAddress?.district,
            ward: order.shipping_ward || order.shippingAddress?.ward,
            street: order.shipping_street || order.shippingAddress?.street,
            note: order.shipping_note || order.shippingAddress?.note,
          },
          items: (order.items || []).map(item => ({
            ...item,
            selectedSize: item.selected_size || item.selectedSize,
            selectedColor: item.selected_color || item.selectedColor,
          }))
        }));
        setOrders(mappedOrdersList);
        setFilteredOrders(mappedOrdersList);
      } else {
        setOrders([]);
        setFilteredOrders([]);
      }
    } catch (error) {
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-4xl mx-auto px-4">
        <div className="flex items-center gap-3 mb-6">
          <Link to="/tai-khoan" className="text-gray-400 hover:text-gray-600 transition-colors">
            <i className="fas fa-arrow-left" />
          </Link>
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Lịch sử đơn hàng
          </h1>
        </div>

        {/* Search box */}
        <div className="mb-6">
          <div className="flex gap-2">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
              placeholder="Tìm theo mã đơn hàng hoặc tên sản phẩm..."
              className="flex-1 px-4 py-2.5 border border-gray-200 dark:border-gray-600 rounded-xl focus:outline-none focus:ring-2 focus:ring-red-500 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            />
            {searchQuery && (
              <button
                onClick={handleClearSearch}
                className="px-6 py-2.5 bg-gray-500 text-white rounded-xl hover:bg-gray-600 transition-colors text-sm font-semibold"
              >
                Xóa
              </button>
            )}
          </div>
          {searchQuery && (
            <p className="text-sm text-gray-500 mt-2">
              Tìm thấy {filteredOrders.length} đơn hàng
            </p>
          )}
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400">
            <i className="fas fa-spinner fa-spin text-3xl mb-4" />
            <p>Đang tải đơn hàng...</p>
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mx-auto mb-4">
              <i className="fas fa-box-open text-3xl text-gray-300" />
            </div>
            <p className="text-gray-500 dark:text-gray-400">Bạn chưa có đơn hàng nào.</p>
            <Link
              to="/"
              className="inline-block mt-4 px-6 py-2.5 bg-red-600 text-white rounded-xl font-semibold hover:bg-red-700 transition-colors"
            >
              Mua sắm ngay
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredOrders.map((order) => (
              <div key={order._id} className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5 hover:shadow-md transition-shadow">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-3 gap-2">
                  <div>
                    <p className="font-bold text-base">
                      Mã: {order.orderCode || `#${String(order._id).slice(-8).toUpperCase()}`}
                    </p>
                    <p className="text-sm text-gray-500">
                      {new Date(order.createdAt).toLocaleDateString("vi-VN", {
                        year: 'numeric', month: 'long', day: 'numeric',
                        hour: '2-digit', minute: '2-digit'
                      })}
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                    {getStatusText(order.status)}
                  </span>
                </div>

                <div className="border-t border-gray-100 dark:border-gray-700 pt-3 space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-500 text-sm">Tổng tiền:</span>
                    <span className="font-bold text-red-600">
                      {order.total ? order.total.toLocaleString("vi-VN") : "0"} ₫
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Thanh toán:</span>
                    <span className="font-medium">
                      {order.paymentMethod === 'cod' ? 'COD' :
                       order.paymentMethod === 'bank_transfer' ? 'Chuyển khoản' :
                       order.paymentMethod === 'momo' ? 'MoMo' :
                       order.paymentMethod.toUpperCase()}
                    </span>
                  </div>
                  {order.shippingAddress && (
                    <div className="text-sm text-gray-500">
                      <span className="font-medium">Giao đến:</span> {order.shippingAddress.fullName} - {order.shippingAddress.phone}
                    </div>
                  )}
                </div>

                <div className="mt-3 border-t border-gray-100 dark:border-gray-700 pt-3">
                  <p className="text-sm font-semibold mb-2 text-gray-700 dark:text-gray-300">Sản phẩm:</p>
                  <div className="space-y-1">
                    {order.items && order.items.length > 0 ? (
                      <>
                        {order.items.slice(0, 3).map((item, idx) => (
                          <div key={idx} className="flex justify-between text-sm">
                            <span className="text-gray-700 dark:text-gray-300 truncate flex-1">
                              {item.name} {item.selectedSize ? `(Size: ${item.selectedSize})` : ''}
                            </span>
                            <span className="text-gray-500 ml-2">x{item.quantity}</span>
                          </div>
                        ))}
                        {order.items.length > 3 && (
                          <p className="text-sm text-gray-400 italic">
                            ... và {order.items.length - 3} sản phẩm khác
                          </p>
                        )}
                      </>
                    ) : (
                      <p className="text-sm text-gray-400">Không có sản phẩm</p>
                    )}
                  </div>
                </div>

                {order.status === "shipping" && (
                  <div className="mt-4 pt-3 border-t border-gray-100 dark:border-gray-700 flex justify-end">
                    <button
                      onClick={() => handleConfirmReceived(order._id, order.orderCode)}
                      className="px-4 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-xl text-sm font-semibold transition-all shadow-md shadow-green-500/10 flex items-center gap-2 cursor-pointer hover:scale-[1.02]"
                    >
                      <i className="fas fa-check" />
                      Đã nhận được hàng
                    </button>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Xác Nhận Đã Nhận Hàng"
        message={
          confirmModal.isOpen && (
            <span>
              Bạn xác nhận đã nhận được đầy đủ sản phẩm của đơn hàng{" "}
              <strong className="font-mono text-gray-800 dark:text-white bg-gray-100 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-700 font-bold">
                {confirmModal.orderCode || `#${String(confirmModal.orderId).slice(-6).toUpperCase()}`}
              </strong>
              ? Trạng thái đơn hàng sẽ được chuyển thành hoàn thành.
            </span>
          )
        }
        type="info"
        onConfirm={confirmReceivedOrder}
        onCancel={() => setConfirmModal({ isOpen: false, orderId: null, orderCode: null })}
      />
    </div>
  );
}
