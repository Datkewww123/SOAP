// Frontend/src/pages/admin/AdminPromotionsPage.jsx
import React, { useState, useEffect } from "react";
import { fetchApi } from "../../utils/api";
import { toast } from "react-toastify";
import ConfirmModal from "../../components/ConfirmModal";

export default function AdminPromotionsPage() {
  const [promotions, setPromotions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingPromotion, setEditingPromotion] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    promoId: null,
    promoCode: "",
  });
  const [formData, setFormData] = useState({
    code: "",
    description: "",
    discount: "",
    discountType: "percentage",
    maxUses: "",
    active: true,
    startDate: "",
    endDate: "",
  });

  useEffect(() => {
    loadPromotions();
  }, []);

  const loadPromotions = async () => {
    try {
      setLoading(true);
      const response = await fetchApi("/promotions");
      // Backend có thể trả về {data: [...]} hoặc [...] trực tiếp
      const promotionsData = response.data || response;
      setPromotions(Array.isArray(promotionsData) ? promotionsData : []);
    } catch (error) {
      toast.error("Không thể tải danh sách khuyến mãi");
      setPromotions([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const promotionData = {
        ...formData,
        discount: parseFloat(formData.discount),
        maxUses: formData.maxUses ? parseInt(formData.maxUses) : null,
      };

      if (editingPromotion) {
        await fetchApi(`/promotions/${editingPromotion._id}`, {
          method: "PUT",
          body: JSON.stringify(promotionData),
        });
        toast.success("Cập nhật khuyến mãi thành công!");
      } else {
        await fetchApi("/promotions", {
          method: "POST",
          body: JSON.stringify(promotionData),
        });
        toast.success("Thêm khuyến mãi thành công!");
      }

      setShowModal(false);
      resetForm();
      loadPromotions();
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra");
    }
  };

  const handleEdit = (promotion) => {
    setEditingPromotion(promotion);
    setFormData({
      code: promotion.code,
      description: promotion.description || "",
      discount: promotion.discount.toString(),
      discountType: promotion.discountType,
      maxUses: promotion.maxUses?.toString() || "",
      active: promotion.active,
      startDate: promotion.startDate
        ? new Date(promotion.startDate).toISOString().split("T")[0]
        : "",
      endDate: promotion.endDate
        ? new Date(promotion.endDate).toISOString().split("T")[0]
        : "",
    });
    setShowModal(true);
  };

  const handleDeleteClick = (id, code) => {
    setConfirmModal({
      isOpen: true,
      promoId: id,
      promoCode: code,
    });
  };

  const confirmDeletePromo = async () => {
    const { promoId } = confirmModal;
    setConfirmModal({ isOpen: false, promoId: null, promoCode: "" });
    try {
      await fetchApi(`/promotions/${promoId}`, { method: "DELETE" });
      toast.success("Xóa khuyến mãi thành công!");
      loadPromotions();
    } catch (error) {
      toast.error("Không thể xóa khuyến mãi");
    }
  };

  const resetForm = () => {
    setFormData({
      code: "",
      description: "",
      discount: "",
      discountType: "percentage",
      maxUses: "",
      active: true,
      startDate: "",
      endDate: "",
    });
    setEditingPromotion(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  const formatDate = (dateString) => {
    if (!dateString) return "-";
    return new Date(dateString).toLocaleDateString("vi-VN");
  };

  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Quản lý Khuyến mãi/Mã giảm giá
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Thêm khuyến mãi
        </button>
      </div>

      {loading ? (
        <p className="text-center py-8">Đang tải...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Mã
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Mô tả
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Giảm giá
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Sử dụng
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Thời gian
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {promotions && promotions.length > 0 ? (
                promotions.map((promo) => (
                  <tr key={promo._id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-bold text-gray-900">
                        {promo.code}
                      </div>
                    </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {promo.description || "-"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {promo.discountType === "percentage"
                        ? `${promo.discount}%`
                        : `${Number(promo.discount).toLocaleString("vi-VN")} đ`}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">
                      {promo.currentUses || 0}
                      {promo.maxUses ? ` / ${promo.maxUses}` : " / ∞"}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-500">
                      {formatDate(promo.startDate)} - {formatDate(promo.endDate)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        promo.active
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {promo.active ? "Hoạt động" : "Tắt"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(promo)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDeleteClick(promo._id, promo.code)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
              ) : (
                <tr>
                  <td colSpan="7" className="text-center py-8 text-gray-500">
                    Chưa có khuyến mãi nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">
                {editingPromotion ? "Sửa khuyến mãi" : "Thêm khuyến mãi mới"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Mã khuyến mãi *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.code}
                    onChange={(e) =>
                      setFormData({
                        ...formData,
                        code: e.target.value.toUpperCase(),
                      })
                    }
                    className="w-full border rounded px-3 py-2 uppercase"
                    placeholder="SALE2024"
                    disabled={!!editingPromotion}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Mô tả
                  </label>
                  <input
                    type="text"
                    value={formData.description}
                    onChange={(e) =>
                      setFormData({ ...formData, description: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                    placeholder="Giảm giá đặc biệt"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Loại giảm giá *
                    </label>
                    <select
                      value={formData.discountType}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          discountType: e.target.value,
                        })
                      }
                      className="w-full border rounded px-3 py-2"
                    >
                      <option value="percentage">Phần trăm (%)</option>
                      <option value="fixed">Số tiền cố định (đ)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Giá trị giảm *
                    </label>
                    <input
                      type="number"
                      required
                      min="0"
                      max={formData.discountType === "percentage" ? "100" : undefined}
                      value={formData.discount}
                      onChange={(e) =>
                        setFormData({ ...formData, discount: e.target.value })
                      }
                      className="w-full border rounded px-3 py-2"
                      placeholder={
                        formData.discountType === "percentage" ? "10" : "50000"
                      }
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Số lần sử dụng tối đa (để trống = không giới hạn)
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={formData.maxUses}
                    onChange={(e) =>
                      setFormData({ ...formData, maxUses: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                    placeholder="100"
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Ngày bắt đầu
                    </label>
                    <input
                      type="date"
                      value={formData.startDate}
                      onChange={(e) =>
                        setFormData({ ...formData, startDate: e.target.value })
                      }
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium mb-1">
                      Ngày kết thúc
                    </label>
                    <input
                      type="date"
                      value={formData.endDate}
                      onChange={(e) =>
                        setFormData({ ...formData, endDate: e.target.value })
                      }
                      className="w-full border rounded px-3 py-2"
                    />
                  </div>
                </div>

                <div>
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.active}
                      onChange={(e) =>
                        setFormData({ ...formData, active: e.target.checked })
                      }
                      className="mr-2"
                    />
                    Kích hoạt mã khuyến mãi
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border rounded hover:bg-gray-100"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {editingPromotion ? "Cập nhật" : "Thêm mới"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Xóa Mã Khuyến Mãi"
        message={
          confirmModal.isOpen && (
            <span>
              Bạn có chắc chắn muốn xóa mã khuyến mãi{" "}
              <strong className="font-mono bg-gray-100 dark:bg-slate-900 px-1.5 py-0.5 rounded border border-gray-200 dark:border-slate-700 font-bold text-gray-800 dark:text-white">
                {confirmModal.promoCode}
              </strong>
              ? Hành động này không thể hoàn tác.
            </span>
          )
        }
        type="danger"
        onConfirm={confirmDeletePromo}
        onCancel={() => setConfirmModal({ isOpen: false, promoId: null, promoCode: "" })}
      />
    </div>
  );
}
