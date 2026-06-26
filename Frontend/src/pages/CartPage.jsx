import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import CartItem from "../components/CartItem";
import { fetchApi } from "../utils/api";
import { toast } from "react-toastify";

// ─── Skeleton Card ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 animate-pulse">
      <div className="bg-gray-200 aspect-square w-full" />
      <div className="p-3 space-y-2">
        <div className="h-4 bg-gray-200 rounded w-3/4" />
        <div className="h-4 bg-gray-200 rounded w-1/2" />
        <div className="h-8 bg-gray-200 rounded-lg w-full mt-2" />
      </div>
    </div>
  );
}

// ─── Product Suggestion Card ──────────────────────────────────────────────────
function SuggestionCard({ product }) {
  const { addToCart } = useCart();

  const price = Number(product?.price ?? product?.salePrice ?? 0);
  const name = product?.name ?? "Sản phẩm";
  const image =
    product?.images?.[0]?.url ||
    product?.images?.[0] ||
    product?.image ||
    product?.thumbnail ||
    "https://placehold.co/400x400?text=Giay";
  const slug = product?.slug || product?._id || product?.id || "#";

  const handleAddToCart = (e) => {
    e.preventDefault();
    addToCart({ ...product, quantity: 1 });
  };

  return (
    <div className="group bg-white rounded-2xl overflow-hidden shadow-sm border border-gray-100 transition-all duration-300 hover:-translate-y-1 hover:shadow-xl flex flex-col">
      <Link to={`/san-pham/${slug}`} className="block overflow-hidden aspect-square">
        <img
          src={image}
          alt={name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          onError={(e) => {
            e.currentTarget.src = "https://placehold.co/400x400?text=Giay";
          }}
        />
      </Link>
      <div className="p-3 flex flex-col flex-1">
        <Link
          to={`/san-pham/${slug}`}
          className="text-sm font-medium text-gray-800 hover:text-red-600 transition-colors line-clamp-2 flex-1"
        >
          {name}
        </Link>
        <p className="text-red-600 font-bold text-base mt-1">
          {price.toLocaleString("vi-VN")} đ
        </p>
        <button
          onClick={handleAddToCart}
          className="mt-2 w-full py-2 rounded-lg bg-red-600 text-white text-xs font-semibold hover:bg-red-700 active:scale-95 transition-all duration-150 flex items-center justify-center gap-1"
        >
          <i className="fas fa-cart-plus" />
          <span>Thêm vào giỏ</span>
        </button>
      </div>
    </div>
  );
}

// ─── Empty Cart View ──────────────────────────────────────────────────────────
function EmptyCart() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sectionTitle, setSectionTitle] = useState("🔥 Bán chạy nhất");

  useEffect(() => {
    let cancelled = false;
    const loadProducts = async () => {
      setLoading(true);
      try {
        const res = await fetchApi("/products?limit=8&sort=-sold&page=1");
        const data = res?.data?.products || res?.data || res || [];
        if (!cancelled) {
          setProducts(Array.isArray(data) ? data : []);
          setSectionTitle("🔥 Bán chạy nhất");
        }
      } catch {
        try {
          const res2 = await fetchApi("/products?limit=8&sort=-createdAt&page=1");
          const data2 = res2?.data?.products || res2?.data || res2 || [];
          if (!cancelled) {
            setProducts(Array.isArray(data2) ? data2 : []);
            setSectionTitle("🆕 Top mua tháng này");
          }
        } catch {
          if (!cancelled) setProducts([]);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    };
    loadProducts();
    return () => { cancelled = true; };
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      {/* Hero empty state */}
      <div className="flex flex-col items-center justify-center pt-20 pb-12 px-4">
        {/* Animated cart icon */}
        <div className="relative mb-6">
          <div className="w-28 h-28 rounded-full bg-red-50 flex items-center justify-center">
            <i className="fas fa-shopping-cart text-5xl text-red-400" />
          </div>
          <span className="absolute -top-1 -right-1 flex h-5 w-5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-5 w-5 bg-red-500" />
          </span>
        </div>

        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-2">
          Giỏ hàng đang trống
        </h1>
        <p className="text-gray-500 dark:text-gray-400 text-sm text-center max-w-xs mb-8">
          Hãy khám phá các mẫu giày bóng đá chính hãng và thêm vào giỏ hàng của bạn nhé!
        </p>
        <Link
          to="/"
          id="empty-cart-home-btn"
          className="inline-flex items-center gap-2 px-8 py-3 rounded-xl bg-red-600 text-white font-semibold hover:bg-red-700 active:scale-95 transition-all duration-150 shadow-md shadow-red-200"
        >
          <i className="fas fa-arrow-left text-sm" />
          Tiếp tục mua sắm
        </Link>
      </div>

      {/* Product suggestions */}
      <div className="max-w-7xl mx-auto px-4 pb-20">
        {/* Section header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <span className="w-1 h-7 bg-red-600 rounded-full block" />
            <h2 className="text-xl font-bold text-gray-800 dark:text-white">{sectionTitle}</h2>
          </div>
          <Link
            to="/san-pham"
            className="text-sm text-red-600 font-medium hover:underline flex items-center gap-1 transition-colors"
          >
            Xem tất cả
            <i className="fas fa-chevron-right text-xs" />
          </Link>
        </div>

        {/* Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
          {loading
            ? Array.from({ length: 8 }).map((_, i) => <SkeletonCard key={i} />)
            : products.map((product) => (
                <SuggestionCard
                  key={product?._id || product?.id || Math.random()}
                  product={product}
                />
              ))}
        </div>
      </div>
    </div>
  );
}

// ─── Cart Summary (right column) ─────────────────────────────────────────────
function CartSummary({ totalPrice, selectedTotalPrice, selectedCount, hasSelection, couponInfo }) {
  const navigate = useNavigate();
  const SHIPPING_THRESHOLD = 500000;
  const SHIPPING_FEE = 30000;
  const shipping = totalPrice >= SHIPPING_THRESHOLD ? 0 : SHIPPING_FEE;
  const discount = couponInfo?.discountValue || 0;
  const grandTotal = Math.max(totalPrice + shipping - discount, 0);

  return (
    <div className="lg:sticky lg:top-24 space-y-4">
      {/* Summary card */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-6">
        <h2 className="text-lg font-bold text-gray-800 dark:text-white mb-5 flex items-center gap-2">
          <i className="fas fa-receipt text-red-500 text-base" />
          Tóm tắt đơn hàng
        </h2>

        <div className="space-y-3 text-sm text-gray-600 dark:text-gray-300">
          {/* Selected count */}
          <div className="flex justify-between">
            <span>Số sản phẩm đã chọn</span>
            <span className="font-medium text-gray-800">{selectedCount}</span>
          </div>

          {/* Subtotal */}
          <div className="flex justify-between">
            <span>Tạm tính</span>
            <span className="font-medium text-gray-800">
              {selectedTotalPrice.toLocaleString("vi-VN")} đ
            </span>
          </div>

          {/* Discount */}
          {discount > 0 && (
            <div className="flex justify-between text-green-600">
              <span className="flex items-center gap-1">
                <i className="fas fa-tag text-xs" />
                Giảm giá
              </span>
              <span className="font-semibold">
                -{discount.toLocaleString("vi-VN")} đ
              </span>
            </div>
          )}

          {/* Shipping */}
          <div className="flex justify-between items-center">
            <span>Phí vận chuyển</span>
            {shipping === 0 ? (
              <span className="text-green-600 font-semibold flex items-center gap-1">
                <i className="fas fa-check-circle text-xs" />
                Miễn phí
              </span>
            ) : (
            <span className="font-medium text-gray-800 dark:text-gray-100">
                {shipping.toLocaleString("vi-VN")} đ
              </span>
            )}
          </div>

          {/* Free shipping notice */}
          {shipping > 0 && (
            <div className="bg-amber-50 dark:bg-amber-900/30 rounded-lg px-3 py-2 text-xs text-amber-700 dark:text-amber-300 flex items-start gap-2">
              <i className="fas fa-truck mt-0.5 flex-shrink-0" />
              <span>
                Mua thêm{" "}
                <strong>
                  {(SHIPPING_THRESHOLD - totalPrice).toLocaleString("vi-VN")} đ
                </strong>{" "}
                để được miễn phí vận chuyển!
              </span>
            </div>
          )}

          <div className="border-t border-gray-100 dark:border-gray-700 pt-3 mt-1 flex justify-between items-center">
            <span className="font-bold text-gray-800 dark:text-white text-base">Tổng cộng</span>
            <span className="font-extrabold text-red-600 text-xl">
              {grandTotal.toLocaleString("vi-VN")} đ
            </span>
          </div>
        </div>

        {/* Checkout button */}
        <button
          id="checkout-btn"
          onClick={() => navigate("/thanh-toan")}
          disabled={!hasSelection}
          className={`mt-5 w-full py-3.5 rounded-xl font-bold text-base flex items-center justify-center gap-2 shadow-md transition-all duration-150 ${
            hasSelection
              ? "bg-red-600 text-white hover:bg-red-700 active:scale-95 shadow-red-200 cursor-pointer"
              : "bg-gray-300 text-gray-500 cursor-not-allowed"
          }`}
        >
          <i className="fas fa-lock text-sm" />
          {hasSelection ? `Thanh toán (${selectedCount})` : "Chọn sản phẩm để thanh toán"}
        </button>

        <Link
          to="/"
          className="mt-3 w-full py-2 rounded-xl border border-gray-200 dark:border-gray-600 text-gray-500 dark:text-gray-400 text-sm font-medium hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors flex items-center justify-center gap-2"
        >
          <i className="fas fa-arrow-left text-xs" />
          Tiếp tục mua sắm
        </Link>
      </div>

      {/* Trust badges */}
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-4">
        <div className="grid grid-cols-3 gap-3 text-center">
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-9 h-9 rounded-full bg-green-50 flex items-center justify-center">
              <i className="fas fa-shield-alt text-green-500 text-sm" />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight">Thanh toán bảo mật</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-9 h-9 rounded-full bg-blue-50 flex items-center justify-center">
              <i className="fas fa-undo text-blue-500 text-sm" />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight">Đổi trả 7 ngày</span>
          </div>
          <div className="flex flex-col items-center gap-1.5">
            <div className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center">
              <i className="fas fa-bolt text-amber-500 text-sm" />
            </div>
            <span className="text-xs text-gray-500 dark:text-gray-400 leading-tight">Giao hàng nhanh</span>
          </div>
        </div>
      </div>
    </div>
  );
}

// ─── Main CartPage ────────────────────────────────────────────────────────────
export default function CartPage() {
  const { cartItems, cartCount, totalPrice, selectedTotalPrice, selectedCount, selectedIds, allSelected, selectAllItems, deselectAllItems, couponInfo, setCouponInfo } = useCart();
  const [coupon, setCoupon] = useState("");
  const [loading, setLoading] = useState(false);

  const handleApplyCoupon = async () => {
    if (!coupon.trim()) return;
    if (selectedIds.length === 0) {
      toast.warning("Vui lòng chọn sản phẩm trước khi áp dụng mã giảm giá.");
      setLoading(false);
      return;
    }
    setLoading(true);
    try {
      const res = await fetchApi("/promotions/validate", {
        method: "POST",
        body: JSON.stringify({ code: coupon.toUpperCase(), subtotal: selectedTotalPrice }),
      });
      if (res.success) {
        setCouponInfo(res.data.promotion);
        toast.success(`Áp dụng mã "${coupon}" thành công!`);
      }
    } catch (err) {
      setCouponInfo(null);
      toast.error(err.message || "Mã giảm giá không hợp lệ hoặc đã hết hạn.");
    } finally {
      setLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setCouponInfo(null);
    setCoupon("");
    toast.info("Đã hủy mã giảm giá.");
  };

  // Empty cart
  if (cartCount === 0) {
    return <EmptyCart />;
  }

  // Cart with items
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 py-8">
      <div className="max-w-7xl mx-auto px-4">
        {/* Page header */}
        <div className="flex items-center gap-3 mb-8">
          <span className="w-1 h-7 bg-red-600 rounded-full block" />
          <h1 className="text-2xl font-bold text-gray-800 dark:text-white">
            Giỏ hàng của bạn
          </h1>
          <span className="ml-1 inline-flex items-center justify-center w-6 h-6 rounded-full bg-red-600 text-white text-xs font-bold">
            {cartCount}
          </span>
        </div>

        <div className="flex flex-col lg:flex-row gap-6 items-start">
          {/* ── Left column: product list ── */}
          <div className="w-full lg:w-2/3 space-y-4">
            {/* Desktop header row */}
            <div className="hidden lg:grid grid-cols-12 gap-4 px-5 py-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 text-xs font-semibold text-gray-400 uppercase tracking-wide">
              <div className="col-span-1 flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={allSelected}
                  onChange={() => allSelected ? deselectAllItems() : selectAllItems()}
                  className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
                />
              </div>
              <div className="col-span-4">Sản phẩm</div>
              <div className="col-span-2 text-center">Đơn giá</div>
              <div className="col-span-2 text-center">Số lượng</div>
              <div className="col-span-2 text-right">Thành tiền</div>
              <div className="col-span-1 text-right">Xóa</div>
            </div>

            {/* Cart items */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 divide-y divide-gray-50 dark:divide-gray-700 overflow-hidden">
              {cartItems.map((item) => (
                <CartItem key={item.id} item={item} />
              ))}
            </div>

            {/* Coupon input */}
            <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 p-5">
              <p className="text-sm font-semibold text-gray-700 dark:text-gray-200 mb-3 flex items-center gap-2">
                <i className="fas fa-tag text-red-500" />
                Mã giảm giá
              </p>
              {couponInfo ? (
                <div className="flex items-center justify-between bg-green-50 dark:bg-green-900/20 rounded-xl px-4 py-3 border border-green-200 dark:border-green-800">
                  <div className="flex items-center gap-2">
                    <i className="fas fa-check-circle text-green-500" />
                    <span className="text-sm font-semibold text-green-700 dark:text-green-300">
                      {couponInfo.code}
                    </span>
                    <span className="text-xs text-green-600 dark:text-green-400">
                      ({couponInfo.discountType === "percentage"
                        ? `${couponInfo.discount}%`
                        : `${Number(couponInfo.discountValue).toLocaleString("vi-VN")} đ`})
                    </span>
                  </div>
                  <button
                    onClick={handleRemoveCoupon}
                    className="text-sm text-red-500 hover:text-red-700 transition-colors"
                  >
                    <i className="fas fa-times" />
                  </button>
                </div>
              ) : (
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <i className="fas fa-ticket-alt absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 text-sm" />
                    <input
                      type="text"
                      value={coupon}
                      onChange={(e) => setCoupon(e.target.value.toUpperCase())}
                      placeholder="Nhập mã giảm giá..."
                      className="w-full pl-9 pr-4 py-2.5 rounded-xl border border-gray-200 dark:border-gray-600 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 focus:border-transparent transition-all uppercase placeholder:normal-case placeholder:text-gray-400 bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
                    />
                  </div>
                  <button
                    onClick={handleApplyCoupon}
                    disabled={loading || !coupon.trim()}
                    className="px-5 py-2.5 rounded-xl bg-gray-800 text-white text-sm font-semibold hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 transition-all duration-150 whitespace-nowrap"
                  >
                    {loading ? (
                      <i className="fas fa-spinner fa-spin" />
                    ) : (
                      "Áp dụng"
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── Right column: summary ── */}
          <div className="w-full lg:w-1/3">
            <CartSummary
              totalPrice={totalPrice}
              selectedTotalPrice={selectedTotalPrice}
              selectedCount={selectedCount}
              hasSelection={selectedIds.length > 0}
              couponInfo={couponInfo}
            />
          </div>
        </div>
      </div>
    </div>
  );
}
