import React, { useState, useEffect, useCallback } from "react";
import { fetchApi } from "../../utils/api";
import { toast } from "react-toastify";
import Pagination from "../../components/Pagination";
import ConfirmModal from "../../components/ConfirmModal";

const ITEMS_PER_PAGE = 8;

const CrudFormModal = ({ item, type, onClose, onSave }) => {
  const isEditing = !!item;
  const isCategory = type === "category";

  const endpoint = isCategory ? `/categories` : `/brands`;
  const itemName = isCategory ? "Danh mục" : "Thương hiệu";

  const [formData, setFormData] = useState({
    id: item?.id || "",
    name: item?.name || "",
    description: item?.description || "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const fullEndpoint = isEditing ? `${endpoint}/${formData.id}` : endpoint;
    const method = isEditing ? "PUT" : "POST";

    if (!formData.name.trim()) {
      toast.error(`Tên ${itemName} không được để trống.`);
      return;
    }

    try {
      await fetchApi(fullEndpoint, {
        method: method,
        body: JSON.stringify(formData),
      });

      toast.success(
        `${isEditing ? "Cập nhật" : "Thêm mới"} ${itemName} thành công!`
      );
      onSave();
      onClose();
    } catch (error) {
      toast.error(
        error.message ||
          `${isEditing ? "Cập nhật" : "Thêm mới"} ${itemName} thất bại.`
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg w-1/3 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">
          {isEditing ? `Sửa: ${item.name}` : `Thêm ${itemName} mới`}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tên */}
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            placeholder={`Tên ${itemName}`}
            required
            className="w-full border p-3 rounded"
          />
          {/* Mô tả */}
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder={`Mô tả ${itemName} (Không bắt buộc)`}
            className="w-full border p-3 rounded"
            rows="3"
          ></textarea>

          {/* Footer */}
          <div className="flex justify-end space-x-3 mt-6">
            <button
              type="button"
              onClick={onClose}
              className="bg-gray-300 text-gray-800 font-bold py-2 px-4 rounded hover:bg-gray-400"
            >
              Hủy
            </button>
            <button
              type="submit"
              className="bg-primary text-white font-bold py-2 px-4 rounded hover:bg-red-700"
            >
              {isEditing ? "Lưu thay đổi" : `Thêm ${itemName}`}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default function AdminCategoriesBrandsPage() {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("category");

  // State cho Modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [modalType, setModalType] = useState("category");
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    itemId: null,
    itemName: null,
    itemType: "",
    endpoint: "",
  });

  // State cho Phân trang
  const [categoriesPagination, setCategoriesPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
  });
  const [brandsPagination, setBrandsPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
  });

  const currentPagination =
    activeTab === "category" ? categoriesPagination : brandsPagination;
  const currentList = activeTab === "category" ? categories : brands;

  // Hàm chung để lấy dữ liệu
  const fetchData = useCallback(async (type, page = 1) => {
    setLoading(true);
    // Endpoint dùng chuỗi số nhiều (categories/brands)
    const endpoint = type === "category" ? "/categories" : "/brands";
    try {
      const response = await fetchApi(endpoint);

      if (response === null) {
        setLoading(false);
        return;
      }

      // Backend có thể trả về {data: [...]} hoặc [...]
      const rawData = response.data || response;
      const processedItems = Array.isArray(rawData)
        ? rawData.map((item) => ({
            ...item,
            id: item._id,
          }))
        : [];

      const totalCount = processedItems.length;
      const pages = Math.ceil(totalCount / ITEMS_PER_PAGE);

      if (type === "category") {
        setCategories(processedItems);

        setCategoriesPagination({
          currentPage: 1,
          totalPages: 1,
          total: totalCount,
        });
      } else {
        setBrands(processedItems);
        setBrandsPagination({
          currentPage: 1,
          totalPages: 1,
          total: totalCount,
        });
      }
    } catch (error) {
      console.error("Lỗi khi fetch data:", error);
      toast.error(`Lỗi tải danh sách: ${error.message || 'Unknown error'}`);
      // Set empty arrays để tránh lỗi
      if (type === "category") {
        setCategories([]);
        setCategoriesPagination({ currentPage: 1, totalPages: 1, total: 0 });
      } else {
        setBrands([]);
        setBrandsPagination({ currentPage: 1, totalPages: 1, total: 0 });
      }
    } finally {
      setLoading(false);
    }
  }, []);

  // Effect để fetch dữ liệu khi tab hoặc trang thay đổi
  useEffect(() => {
    if (activeTab === "category") {
      fetchData("category", categoriesPagination.currentPage);
    } else {
      fetchData("brand", brandsPagination.currentPage);
    }
  }, [
    activeTab,
    categoriesPagination.currentPage,
    brandsPagination.currentPage,
    fetchData,
  ]);

  // Xử lý Phân trang
  const handlePageChange = (newPage) => {
    if (activeTab === "category") {
      setCategoriesPagination((prev) => ({ ...prev, currentPage: newPage }));
    } else {
      setBrandsPagination((prev) => ({ ...prev, currentPage: newPage }));
    }
  };

  // Xử lý Xóa
  const handleDeleteClick = (itemId, itemName) => {
    const itemType = activeTab === "category" ? "Danh mục" : "Thương hiệu";
    const endpoint =
      activeTab === "category" ? `/categories/${itemId}` : `/brands/${itemId}`;
    setConfirmModal({
      isOpen: true,
      itemId,
      itemName,
      itemType,
      endpoint,
    });
  };

  const confirmDeleteItem = async () => {
    const { endpoint, itemType, itemName } = confirmModal;
    setConfirmModal({ isOpen: false, itemId: null, itemName: null, itemType: "", endpoint: "" });
    try {
      await fetchApi(endpoint, { method: "DELETE" });
      toast.success(`Đã xóa ${itemType} "${itemName}" thành công.`);
      fetchData(activeTab, currentPagination.currentPage);
    } catch (error) {
      toast.error(error.message || `Xóa ${itemType} thất bại.`);
    }
  };

  // Xử lý Modal
  const handleOpenModal = (item = null) => {
    setEditingItem(item);
    // Dùng activeTab (đã là chuỗi số ít) để xác định loại modal
    setModalType(activeTab);
    setIsModalOpen(true);
  };

  const handleSaveAndClose = () => {
    setIsModalOpen(false);
    setEditingItem(null);
    fetchData(activeTab, currentPagination.currentPage);
  };

  if (loading && currentList.length === 0)
    return <div className="text-center py-10">Đang tải dữ liệu...</div>;

  return (
    <div>
      {isModalOpen && (
        <CrudFormModal
          item={editingItem}
          type={modalType}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveAndClose}
        />
      )}

      <div className="border-b border-gray-200 mb-6 flex">
        <button
          onClick={() => setActiveTab("category")}
          className={`px-4 py-2 text-lg font-semibold ${
            activeTab === "category"
              ? "border-b-2 border-primary text-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Danh mục ({categories.length})
        </button>
        <button
          onClick={() => setActiveTab("brand")}
          className={`px-4 py-2 text-lg font-semibold ${
            activeTab === "brand"
              ? "border-b-2 border-primary text-primary"
              : "text-gray-500 hover:text-gray-700"
          }`}
        >
          Thương hiệu ({brands.length})
        </button>
      </div>

      <div className="flex justify-between items-center mb-4">
        <span className="font-medium text-gray-600">
          Tổng cộng: {currentPagination.total}{" "}
          {activeTab === "category" ? "danh mục" : "thương hiệu"}
        </span>
        <button
          className="bg-primary text-white text-sm font-bold py-2 px-4 rounded-md hover:bg-red-700"
          onClick={() => handleOpenModal(null)}
        >
          {activeTab === "category" ? "Danh mục" : "Thương hiệu"} mới
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <tbody className="bg-white divide-y divide-gray-200">
            {currentList.map((item) => (
              <tr key={item.id}>
                <td className="px-6 py-4 text-sm font-medium text-gray-900">
                  {item.name}
                </td>
                <td className="px-6 py-4 text-sm text-gray-500">
                  {item.description || "Chưa có mô tả"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    className="text-indigo-600 hover:text-indigo-900 transition-colors mr-3"
                    onClick={() => handleOpenModal(item)}
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() => handleDeleteClick(item.id, item.name)}
                    className="text-red-600 hover:text-red-900 transition-colors"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
            {currentList.length === 0 && !loading && (
              <tr>
                <td colSpan="3" className="text-center py-4 text-gray-500">
                  Không có{" "}
                  {activeTab === "category" ? "danh mục" : "thương hiệu"} nào.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <Pagination
          currentPage={currentPagination.currentPage}
          totalPages={currentPagination.totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title={`Xóa ${confirmModal.itemType}`}
        message={
          confirmModal.isOpen && (
            <span>
              Bạn có chắc chắn muốn xóa {confirmModal.itemType.toLowerCase()}{" "}
              <strong className="font-semibold text-gray-800 dark:text-white">
                "{confirmModal.itemName}"
              </strong>
              ? Hành động này không thể hoàn tác.
            </span>
          )
        }
        type="danger"
        onConfirm={confirmDeleteItem}
        onCancel={() => setConfirmModal({ isOpen: false, itemId: null, itemName: null, itemType: "", endpoint: "" })}
      />
    </div>
  );
}
