// Frontend/src/pages/admin/AdminOrdersPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { fetchApi } from "../../utils/api";
import { toast } from "react-toastify";
import Pagination from "../../components/Pagination";
import ConfirmModal from "../../components/ConfirmModal";

const STATUSES = [
  "pending",
  "confirmed",
  "shipping",
  "delivered",
  "cancelled",
];
const STATUS_COLORS = {
  pending: "bg-yellow-100 text-yellow-800",
  confirmed: "bg-blue-100 text-blue-800",
  shipping: "bg-indigo-100 text-indigo-800",
  delivered: "bg-green-100 text-green-800",
  cancelled: "bg-red-100 text-red-800",
};

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({ page: 1, pages: 1, total: 0 });
  const [searchQuery, setSearchQuery] = useState("");

  const fetchOrders = useCallback(async (page = 1, search = "") => {
    setLoading(true);
    try {
      // API lấy tất cả đơn hàng (Admin)
      let url = `/admin/orders?page=${page}&limit=20`;
      if (search) {
        url += `&search=${encodeURIComponent(search)}`;
      }
      const response = await fetchApi(url);
      // Backend có thể trả về {data: {orders, pagination}} hoặc {orders, pagination}
      const data = response.data || response;
      setOrders(data.orders || []);
      setPagination(data.pagination || { page: 1, pages: 1, total: 0 });
    } catch (error) {
      toast.error("Không thể tải danh sách đơn hàng.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOrders();
  }, [fetchOrders]);

  const handlePageChange = (newPage) => {
    fetchOrders(newPage, searchQuery);
  };

  const handleSearch = (e) => {
    e.preventDefault();
    fetchOrders(1, searchQuery);
  };

  const handleClearSearch = () => {
    setSearchQuery("");
    fetchOrders(1, "");
  };

  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    orderId: null,
    orderCode: null,
    newStatus: null,
  });

  const handleUpdateStatusClick = (orderId, orderCode, newStatus) => {
    setConfirmModal({
      isOpen: true,
      orderId,
      orderCode,
      newStatus,
    });
  };

  const confirmUpdateStatus = async () => {
    const { orderId, orderCode, newStatus } = confirmModal;
    setConfirmModal({ isOpen: false, orderId: null, orderCode: null, newStatus: null });

    try {
      // API cập nhật trạng thái đơn hàng
      await fetchApi(`/admin/orders/${orderId}/status`, {
        method: "PUT",
        body: JSON.stringify({ status: newStatus }),
      });
      toast.success(
        `Cập nhật trạng thái đơn hàng ${orderCode || '#' + String(orderId).slice(-6).toUpperCase()} thành công.`
      );
      fetchOrders(pagination.page, searchQuery); // Tải lại trang hiện tại
    } catch (error) {
      toast.error(error.message || "Cập nhật trạng thái thất bại.");
    }
  };

  if (loading)
    return <div className="text-center py-10">Đang tải đơn hàng...</div>;

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return "0 ₫";
    }
    return Number(amount).toLocaleString("vi-VN") + " ₫";
  };

  return (
    <div>
      <div className="mb-6">
        <form onSubmit={handleSearch} className="flex gap-2 mb-4">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm theo mã đơn hàng, email, số điện thoại..."
            className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Tìm kiếm
          </button>
          {searchQuery && (
            <button
              type="button"
              onClick={handleClearSearch}
              className="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
            >
              Xóa
            </button>
          )}
        </form>
        <span className="font-medium text-gray-600">
          Tổng cộng: {pagination?.total || 0} đơn hàng
        </span>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Mã ĐH
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Khách hàng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tổng tiền
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ngày đặt
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Trạng thái
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {orders.map((order) => (
              <tr key={order._id}>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                  {order.orderCode || `#${String(order._id).slice(-6).toUpperCase()}`}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <div className="text-sm text-gray-900">{order.user?.name || 'N/A'}</div>
                  <div className="text-xs text-gray-500">
                    {order.user?.email || 'N/A'}
                  </div>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                  {formatCurrency(order.total || 0)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {new Date(order.createdAt).toLocaleDateString("vi-VN")}
                </td>
                <td className="px-6 py-4 whitespace-nowrap">
                  <span
                    className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      STATUS_COLORS[order.status]
                    }`}
                  >
                    {order.status.toUpperCase()}
                  </span>
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <select
                    value={order.status}
                    onChange={(e) =>
                      handleUpdateStatusClick(order._id, order.orderCode, e.target.value)
                    }
                    className="border border-gray-300 rounded-md p-1 text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 cursor-pointer"
                  >
                    {STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.toUpperCase()}
                      </option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <Pagination
          currentPage={pagination.page}
          totalPages={pagination.pages}
          onPageChange={handlePageChange}
        />
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Xác Nhận Thay Đổi"
        message={
          confirmModal.isOpen && (
            <span>
              Bạn có chắc chắn muốn chuyển trạng thái đơn hàng{" "}
              <strong className="font-mono text-gray-800 dark:text-white bg-gray-100 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-700 font-bold">
                {confirmModal.orderCode || `#${String(confirmModal.orderId).slice(-6).toUpperCase()}`}
              </strong>{" "}
              sang trạng thái{" "}
              <strong className="uppercase font-bold text-red-600 dark:text-red-400">
                {confirmModal.newStatus.toUpperCase()}
              </strong>
              ?
            </span>
          )
        }
        type="warning"
        onConfirm={confirmUpdateStatus}
        onCancel={() =>
          setConfirmModal({
            isOpen: false,
            orderId: null,
            orderCode: null,
            newStatus: null,
          })
        }
      />
    </div>
  );
}
