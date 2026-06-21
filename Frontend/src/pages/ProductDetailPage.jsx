// src/pages/ProductDetailPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { toast } from "react-toastify";
import { fetchApi } from "../utils/api";

// Import các component con
import ProductGallery from "../components/ProductGallery.jsx";
import ProductCard from "../components/ProductCard"; // Dùng cho "Sản phẩm liên quan"

export default function ProductDetailPage() {
  const { slug } = useParams();
  const { addToCart } = useCart();

  // State chính để lưu trữ thông tin sản phẩm từ API
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [relatedProducts, setRelatedProducts] = useState([]); // Giữ nguyên state này

  // State cho các lựa chọn của người dùng (Chỉ giữ một lần khai báo)
  const [selectedSize, setSelectedSize] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [activeTab, setActiveTab] = useState("description");

  // 1. HÀM TẢI DỮ LIỆU TỪ API
  const fetchProduct = useCallback(async () => {
    setLoading(true);
    try {
      // Endpoint: /products/slug/:slug (dùng slug thay vì ID)
      const response = await fetchApi(`/products/slug/${slug}`);

      // Lấy data từ response (API trả về format: { success, statusCode, message, data: { ...productData, relatedProducts: [...] } })
      const fetchedData = response.data || response; // Object chứa product và relatedProducts

      // Chuẩn hóa/Ánh xạ dữ liệu từ Backend về cấu trúc Frontend
      const formattedProduct = {
        id: fetchedData._id,
        slug: fetchedData.slug,
        name: fetchedData.name,
        price: fetchedData.price,
        brand: fetchedData.brand?.name || "N/A",
        description: fetchedData.description,
        // Sử dụng trường images làm galleryImages
        galleryImages: fetchedData.images || [],
        availableSizes: fetchedData.availableSizes || [],
      };

      setProduct(formattedProduct);

      // LẤY VÀ LƯU DỮ LIỆU SẢN PHẨM LIÊN QUAN THẬT SỰ
      const related = fetchedData.relatedProducts || []; // <-- Lấy relatedProducts từ response
      setRelatedProducts(related); // <-- Lưu vào state

      // Chọn size đầu tiên làm mặc định nếu có
      if (formattedProduct.availableSizes.length > 0) {
        setSelectedSize(formattedProduct.availableSizes[0]);
      }
    } catch (error) {
      console.error("Lỗi khi tải chi tiết sản phẩm:", error);
      setProduct(null);
      setRelatedProducts([]); // Clear related products nếu lỗi
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchProduct();
  }, [fetchProduct]);

  // 2. LOGIC TẢI SẢN PHẨM LIÊN QUAN (ĐÃ XÓA LOGIC MOCK DATA CŨ)
  // Logic đã được chuyển vào fetchProduct và sử dụng state relatedProducts

  // 3. Xử lý bộ chọn số lượng
  const handleQuantityChange = (amount) => {
    setQuantity((prev) => Math.max(1, prev + amount)); // Không cho phép < 1
  };

  // 4. Xử lý Thêm vào giỏ (Đã cập nhật để dùng API thông qua Context)
  const handleAddToCart = async () => {
    // Thêm async
    // Chỉ yêu cầu chọn size nếu sản phẩm có sizes
    if (
      product.availableSizes &&
      product.availableSizes.length > 0 &&
      !selectedSize
    ) {
      toast.error("Vui lòng chọn size!");
      return;
    }
    if (!product) return;

    // Gọi hàm addToCart trong CartContext. Hàm này sẽ gọi API Backend.
    const result = await addToCart(product, quantity, selectedSize);

    if (!result.success) {
      toast.error(result.message);
    }
  };

  // 5. Xử lý trạng thái Loading
  if (loading) {
    return (
      <div className="container w-[90%] max-w-[1000px] mx-auto mt-10 py-20 text-center">
        <h1 className="text-3xl font-bold text-primary">
          Đang tải sản phẩm...
        </h1>
      </div>
    );
  }

  // 6. Xử lý nếu không tìm thấy sản phẩm (hoặc lỗi tải)
  if (!product) {
    return (
      <div className="container w-[90%] max-w-[1000px] mx-auto mt-10 py-20 text-center">
        <h1 className="text-3xl font-bold">404 - Không tìm thấy sản phẩm</h1>
        <Link
          to="/"
          className="text-lg text-primary hover:underline mt-4 block"
        >
          Quay về Trang chủ
        </Link>
      </div>
    );
  }

  // 7. Render giao diện
  return (
    <div className="container w-[90%] max-w-[1200px] mx-auto mt-10 py-10 dark:text-gray-100">
      {/* === PHẦN CHÍNH: 2 CỘT === */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 md:gap-12">
        {/* CỘT TRÁI: GALLERY ẢNH */}
        <div className="md:col-span-1">
          <ProductGallery images={product.galleryImages} />
        </div>

        {/* CỘT PHẢI: THÔNG TIN & LỰA CHỌN */}
        <div className="md:col-span-1">
          <h1 className="text-3xl font-bold mb-4 dark:text-white">{product.name}</h1>
          <p className="text-3xl font-bold text-red-600 mb-6">
            {product.price ? product.price.toLocaleString("vi-VN") : "0"} ₫
          </p>

          {/* LỰA CHỌN SIZE */}
          <div className="mb-6">
            <label className="block font-bold mb-2">Kích thước:</label>
            {product.availableSizes && product.availableSizes.length > 0 ? (
              <div className="flex flex-wrap gap-2">
                {product.availableSizes.map((size) => (
                  <button
                    key={size}
                    onClick={() => setSelectedSize(size)}
                    className={`border rounded-md w-14 h-10 transition-all ${
                      selectedSize === size
                        ? "bg-primary text-white border-primary" // Nổi bật size đã chọn
                        : "bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-gray-500 italic">
                Sản phẩm này không cần chọn size
              </p>
            )}
          </div>

          {/* LỰA CHỌN SỐ LƯỢNG */}
          <div className="mb-6">
            <label className="block font-bold mb-2">Số lượng:</label>
            <div className="flex items-center border border-gray-300 dark:border-gray-600 rounded-md max-w-[150px]">
              <button
                onClick={() => handleQuantityChange(-1)}
                className="px-5 py-2 text-xl font-bold dark:text-white"
              >
                -
              </button>
              <input
                type="text"
                readOnly
                value={quantity}
                className="w-14 text-center font-bold outline-none bg-transparent text-gray-800 dark:text-slate-100"
              />
              <button
                onClick={() => handleQuantityChange(1)}
                className="px-5 py-2 text-xl font-bold dark:text-white"
              >
                +
              </button>
            </div>
            {/* Hiển thị số lượng tồn kho */}
            {product.stock !== undefined && product.stock !== null && (
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-2">
                Còn {product.stock} sản phẩm trong kho
              </p>
            )}
          </div>

          {/* CÁC NÚT HÀNH ĐỘNG */}
          <div className="flex flex-col gap-3">
            <button
              onClick={handleAddToCart}
              className="w-full bg-primary text-white text-lg font-bold uppercase py-4 px-6 rounded-md transition-colors hover:bg-primary-dark"
            >
              Thêm vào giỏ hàng
            </button>
            <button className="w-full bg-dark-color text-white text-lg font-bold uppercase py-4 px-6 rounded-md transition-colors hover:bg-black">
              Mua ngay
            </button>
          </div>
        </div>
      </div>

      {/* === PHẦN DƯỚI: TABS & SẢN PHẨM LIÊN QUAN === */}
      <div className="mt-16">
        {/* Thanh TABS (Mô tả, Bảo hành...) */}
        <div className="border-b border-gray-300 dark:border-gray-600 mb-6">
          <nav className="flex gap-6">
            <button
              onClick={() => setActiveTab("description")}
              className={`text-lg font-bold uppercase pb-3 border-b-2 ${
                activeTab === "description"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-600 dark:text-gray-400"
              }`}
            >
              Mô tả sản phẩm
            </button>
            <button
              onClick={() => setActiveTab("warranty")}
              className={`text-lg font-bold uppercase pb-3 border-b-2 ${
                activeTab === "warranty"
                  ? "border-primary text-primary"
                  : "border-transparent text-gray-600 dark:text-gray-400"
              }`}
            >
              Chính sách bảo hành
            </button>
            {/* Thêm các tab khác ở đây */}
          </nav>
        </div>

        {/* Nội dung TABS */}
        <div className="content-tabs">
          {activeTab === "description" && (
            <div className="prose max-w-none">
              <p>{product.description}</p>
            </div>
          )}
          {activeTab === "warranty" && (
            <div className="prose max-w-none">
              <p>Nội dung chính sách bảo hành sẽ được cập nhật tại đây...</p>
            </div>
          )}
        </div>

        {/* SẢN PHẨM LIÊN QUAN */}
        <div className="mt-12">
          <h2 className="text-2xl font-bold text-center mb-8 uppercase">
            Sản phẩm liên quan
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {/* SỬ DỤNG DỮ LIỆU THẬT TỪ STATE relatedProducts */}
            {relatedProducts.length > 0 ? (
              relatedProducts.map((prod) => (
                <ProductCard
                  key={prod._id}
                  product={{
                    id: prod._id,
                    name: prod.name,
                    price: prod.price,
                    slug: prod.slug,
                    // Lấy ảnh đầu tiên, hoặc fallback nếu không có ảnh
                    imageUrl:
                      prod.images?.[0] || "https://placehold.co/300x300?text=No+Image",
                  }}
                />
              ))
            ) : (
              <p className="col-span-full text-center text-gray-500">
                Không tìm thấy sản phẩm liên quan nào.
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
