// Frontend/src/pages/admin/AdminProductsPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { fetchApi } from "../../utils/api";
import { toast } from "react-toastify";
import Pagination from "../../components/Pagination";
import ConfirmModal from "../../components/ConfirmModal";

const PRODUCTS_PER_PAGE = 12;

// Component con: Form Thêm/Sửa Sản phẩm
const ProductFormModal = ({ product, categories, brands, onClose, onSave }) => {
  const isEditing = !!product;
  const [formData, setFormData] = useState({
    name: product?.name || "",
    price: product?.price || 0,
    description: product?.description || "",
    category: product?.category?._id || categories[0]?._id,
    brand: product?.brand?._id || brands[0]?._id,

    // THÊM: Chuyển mảng URL thành chuỗi cách nhau bằng dấu phẩy
    images: product?.images?.join(", ") || "",

    // THÊM: Chuyển mảng sizes thành chuỗi cách nhau bằng dấu phẩy
    availableSizes: product?.availableSizes?.join(", ") || "",

    // THÊM: isXakho
    isXakho: product?.isXakho || false,

    // THÊM: stock
    stock: product?.stock || 0,
  });

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]:
        type === "number"
          ? Number(value)
          : type === "checkbox"
          ? checked
          : value,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const endpoint = isEditing ? `/products/${product.id}` : "/products";
    const method = isEditing ? "PUT" : "POST";

    // 1. Chuẩn bị Payload: Xử lý chuỗi URL và Sizes thành mảng
    const payload = {
      ...formData,
      // Chuyển chuỗi URL thành mảng và làm sạch (filter bỏ các chuỗi rỗng)
      images: formData.images
        .split(",")
        .map((url) => url.trim())
        .filter((url) => url),
      // Chuyển chuỗi sizes thành mảng và làm sạch
      availableSizes: formData.availableSizes
        .split(",")
        .map((s) => s.trim())
        .filter((s) => s),
    };

    try {
      // API CRUD Sản phẩm
      await fetchApi(endpoint, {
        method: method,
        body: JSON.stringify(payload), // Gửi payload đã xử lý
      });

      toast.success(
        `${isEditing ? "Cập nhật" : "Thêm mới"} sản phẩm thành công!`
      );
      onSave();
      onClose();
    } catch (error) {
      toast.error(
        error.message ||
          `${isEditing ? "Cập nhật" : "Thêm mới"} sản phẩm thất bại.`
      );
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex justify-center items-center z-50">
      <div className="bg-white p-8 rounded-lg w-1/2 max-h-[90vh] overflow-y-auto">
        <h2 className="text-2xl font-bold mb-6">
          {isEditing ? `Sửa: ${product.name}` : "Thêm Sản phẩm mới"}
        </h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Tên & Giá */}
          <div className="flex gap-4">
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              placeholder="Tên sản phẩm"
              required
              className="flex-1 border p-3 rounded"
            />
            <input
              type="number"
              name="price"
              value={formData.price}
              onChange={handleChange}
              placeholder="Giá (VNĐ)"
              required
              className="w-32 border p-3 rounded"
            />
          </div>
          {/* Danh mục & Thương hiệu */}
          <div className="flex gap-4">
            <select
              name="category"
              value={formData.category}
              onChange={handleChange}
              required
              className="flex-1 border p-3 rounded"
            >
              {/* Option mặc định */}
              <option value="">-- Chọn Danh mục --</option>
              {categories.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.name}
                </option>
              ))}
            </select>
            <select
              name="brand"
              value={formData.brand}
              onChange={handleChange}
              required
              className="flex-1 border p-3 rounded"
            >
              {/* Option mặc định */}
              <option value="">-- Chọn Thương hiệu --</option>
              {brands.map((b) => (
                <option key={b._id} value={b._id}>
                  {b.name}
                </option>
              ))}
            </select>
          </div>

          {/* INPUT MỚI: CHUỖI URL ẢNH */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              URL Ảnh sản phẩm (Phân cách bằng dấu phẩy)
            </label>
            <textarea
              name="images"
              value={formData.images}
              onChange={handleChange}
              placeholder="VD: https://link1.jpg, https://link2.jpg, ..."
              className="w-full border p-3 rounded"
              rows="2"
            ></textarea>
          </div>

          {/* INPUT MỚI: AVAILABLE SIZES */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Kích thước có sẵn (Phân cách bằng dấu phẩy)
            </label>
            <input
              type="text"
              name="availableSizes"
              value={formData.availableSizes}
              onChange={handleChange}
              placeholder="VD: 39, 40, 40.5, 41"
              className="w-full border p-3 rounded"
            />
          </div>

          {/* INPUT MỚI: STOCK */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Số lượng trong kho
            </label>
            <input
              type="number"
              name="stock"
              value={formData.stock}
              onChange={handleChange}
              placeholder="Số lượng tồn kho"
              min="0"
              className="w-full border p-3 rounded"
            />
          </div>

          {/* Mô tả */}
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            placeholder="Mô tả sản phẩm"
            className="w-full border p-3 rounded"
            rows="4"
          ></textarea>

          {/* CHECKBOX XẢ KHO */}
          <div className="flex items-center">
            <input
              type="checkbox"
              name="isXakho"
              checked={formData.isXakho}
              onChange={handleChange}
              className="h-4 w-4 text-primary rounded border-gray-300"
            />
            <label className="ml-2 block text-sm text-gray-900">
              Sản phẩm Xả kho (Giảm giá)
            </label>
          </div>

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
              {isEditing ? "Lưu thay đổi" : "Thêm Sản phẩm"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// -----------------------------------------------------------
// ADMIN PRODUCTS PAGE (PHẦN CHÍNH)
// -----------------------------------------------------------

export default function AdminProductsPage() {
  const [products, setProducts] = useState([]);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);
  const [pagination, setPagination] = useState({
    currentPage: 1,
    totalPages: 1,
    total: 0,
  });
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    productId: null,
    productName: null,
  });

  // FETCH DROPDOWN DATA (Chạy 1 lần khi load)
  const fetchDropdownData = useCallback(async () => {
    try {
      const [categoriesResponse, brandsResponse] = await Promise.all([
        fetchApi("/categories"),
        fetchApi("/brands"),
      ]);
      if (categoriesResponse) setCategories(categoriesResponse.data);
      if (brandsResponse) setBrands(brandsResponse.data);
    } catch (error) {
      toast.error("Không thể tải danh mục và thương hiệu.");
    }
  }, []);

  // FETCH PRODUCT DATA (Chạy khi phân trang/refresh)
  const fetchProducts = useCallback(async (page = 1) => {
    setLoading(true);
    try {
      const query = new URLSearchParams({
        page,
        limit: PRODUCTS_PER_PAGE,
      }).toString();
      const productResponse = await fetchApi(`/products?${query}`);
      const data = productResponse.data || productResponse;
      setProducts(data.products || []);
      setPagination({
        currentPage: data.pagination?.page || 1,
        totalPages: data.pagination?.pages || 1,
        total: data.pagination?.total || 0,
      });
    } catch (error) {
      toast.error("Không thể tải danh sách sản phẩm.");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchDropdownData();
  }, [fetchDropdownData]);

  useEffect(() => {
    fetchProducts(pagination.currentPage);
  }, [pagination.currentPage]);

  const handlePageChange = (newPage) => {
    setPagination((prev) => ({ ...prev, currentPage: newPage }));
  };

  const handleSaveAndClose = () => {
    setIsModalOpen(false);
    setEditingProduct(null);
    fetchProducts(pagination.currentPage);
  };

  const handleDeleteClick = (productId, productName) => {
    setConfirmModal({
      isOpen: true,
      productId,
      productName,
    });
  };

  const confirmDeleteProduct = async () => {
    const { productId, productName } = confirmModal;
    setConfirmModal({ isOpen: false, productId: null, productName: null });
    try {
      await fetchApi(`/products/${productId}`, { method: "DELETE" });
      toast.success(`Đã xóa sản phẩm "${productName}" thành công.`);
      handleSaveAndClose();
    } catch (error) {
      toast.error(error.message || "Xóa sản phẩm thất bại.");
    }
  };

  const handleOpenModal = (product = null) => {
    setEditingProduct(product);
    setIsModalOpen(true);
  };

  if (loading)
    return (
      <div className="text-center py-10">Đang tải danh sách sản phẩm...</div>
    );

  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return "0 ₫";
    }
    return Number(amount).toLocaleString("vi-VN") + " ₫";
  };

  return (
    <div>
      {/* Modal Form */}
      {isModalOpen && (
        <ProductFormModal
          product={editingProduct}
          categories={categories}
          brands={brands}
          onClose={() => setIsModalOpen(false)}
          onSave={handleSaveAndClose}
        />
      )}

      <div className="flex justify-between items-center mb-4">
        <span className="font-medium text-gray-600">
          Tổng cộng: {pagination.total} sản phẩm
        </span>
        <button
          className="bg-primary text-white text-sm font-bold py-2 px-4 rounded-md hover:bg-red-700"
          onClick={() => handleOpenModal(null)}
        >
          + Thêm sản phẩm mới
        </button>
      </div>

      <div className="bg-white rounded-lg shadow-md overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Ảnh
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Tên Sản phẩm
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Giá
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Danh mục/Hãng
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Xả kho
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Hành động
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {products.map((product) => (
              <tr key={product.id}>
                <td className="px-6 py-4 whitespace-nowrap">
                  <img
                    src={
                      (product.images && product.images[0]) ||
                      "https://placehold.co/50x50?text=N"
                    }
                    alt={product.name}
                    className="h-10 w-10 object-cover rounded"
                    onError={(e) => {
                      e.currentTarget.src = "https://placehold.co/50x50?text=N";
                    }}
                  />
                </td>
                <td className="px-6 py-4 text-sm font-medium text-gray-900 max-w-sm">
                  {product.name}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-bold text-green-600">
                  {formatCurrency(product.price)}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                  {product.category?.name || "N/A"} /{" "}
                  {product.brand?.name || "N/A"}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm">
                  {product.isXakho ? (
                    <span className="text-red-500 font-semibold">CÓ</span>
                  ) : (
                    "KHÔNG"
                  )}
                </td>
                <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                  <button
                    className="text-indigo-600 hover:text-indigo-900 transition-colors mr-3"
                    onClick={() => handleOpenModal(product)}
                  >
                    Sửa
                  </button>
                  <button
                    onClick={() =>
                      handleDeleteClick(product.id, product.name)
                    }
                    className="text-red-600 hover:text-red-900 transition-colors"
                  >
                    Xóa
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <div className="mt-6">
        <Pagination
          currentPage={pagination.currentPage}
          totalPages={pagination.totalPages}
          onPageChange={handlePageChange}
        />
      </div>

      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Xóa Sản Phẩm"
        message={
          confirmModal.isOpen && (
            <span>
              Bạn có chắc chắn muốn xóa sản phẩm{" "}
              <strong className="font-semibold text-gray-800 dark:text-white">
                "{confirmModal.productName}"
              </strong>
              ? Hành động này không thể hoàn tác.
            </span>
          )
        }
        type="danger"
        onConfirm={confirmDeleteProduct}
        onCancel={() => setConfirmModal({ isOpen: false, productId: null, productName: null })}
      />
    </div>
  );
}
