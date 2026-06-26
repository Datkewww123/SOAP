// src/pages/CheckoutPage.jsx (Đã sửa đổi)
import React, { useState, useEffect } from "react";
import { useCart } from "../context/CartContext";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchApi } from "../utils/api";
import { toast } from "react-toastify";

// Component con nội bộ cho 1 hàng sản phẩm tóm tắt
function OrderSummaryItem({ item }) {
  return (
    <div className="flex justify-between items-center py-3 border-b">
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <img
          src={item.imageUrl}
          alt={item.name}
          className="w-14 h-14 object-cover rounded-md border shrink-0"
        />
        <div className="min-w-0">
          <p className="font-bold text-sm truncate antialiased">
            {item.name}
          </p>
          <p className="text-xs text-gray-500">
            Số lượng: {item.quantity}
            {item.selectedSize && <span> / Size: {item.selectedSize}</span>}
          </p>
        </div>
      </div>
      <p className="font-semibold text-sm tabular-nums antialiased shrink-0 ml-2">
        {(item.price * item.quantity).toLocaleString("vi-VN")}<span className="font-sans"> ₫</span>
      </p>
    </div>
  );
}

// ─── Saved Address Card ───────────────────────────────────────────────────────
function SavedAddressCard({ address, isSelected, onSelect, onSetDefault, onDelete }) {
  const addrId = address.id || address._id;
  const addrName = address.full_name || address.fullName;
  const addrIsDefault = address.is_default || address.isDefault;
  return (
    <div
      className={`border rounded-lg p-3 transition-all ${
        isSelected
          ? 'border-red-500 bg-red-50 shadow-sm'
          : 'border-gray-200'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => onSelect(address)}
        >
          <p className="font-semibold text-sm truncate">{addrName}</p>
          <p className="text-xs text-gray-500">{address.phone}</p>
          <p className="text-xs text-gray-500 mt-1 line-clamp-2">
            {address.street}, {address.ward}, {address.district}, {address.province}
          </p>
        </div>
        <div className="flex items-center gap-2">
          {addrIsDefault ? (
            <span className="text-[10px] bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-medium whitespace-nowrap">
              Mặc định
            </span>
          ) : (
            <button
              type="button"
              onClick={(e) => { e.stopPropagation(); onSetDefault(addrId); }}
              className="text-[10px] text-gray-400 hover:text-red-500 border border-dashed border-gray-300 hover:border-red-400 px-2 py-0.5 rounded-full transition-colors whitespace-nowrap cursor-pointer"
              title="Đặt làm mặc định"
            >
              + Mặc định
            </button>
          )}
          <button
            type="button"
            onClick={(e) => { e.stopPropagation(); onDelete(addrId); }}
            className="text-gray-300 hover:text-red-500 transition-colors cursor-pointer"
            title="Xóa địa chỉ"
          >
            <i className="fas fa-trash-alt text-xs" />
          </button>
        </div>
      </div>
    </div>
  );
}

// ─── Component chính ──────────────────────────────────────────────────────────
export default function CheckoutPage() {
  const { cartItems, totalPrice, cartCount, selectedItems, selectedTotalPrice, selectedCount, removeItems, couponInfo } = useCart();

  const checkoutItems = selectedItems.length > 0 ? selectedItems : cartItems;
  const checkoutTotalPrice = selectedItems.length > 0 ? selectedTotalPrice : totalPrice;
  const checkoutCount = selectedItems.length > 0 ? selectedCount : cartCount;
  const { currentUser } = useAuth();
  const navigate = useNavigate();

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("cod");
  const [formData, setFormData] = useState({
    fullName: currentUser ? currentUser.name : "",
    email: currentUser ? currentUser.email : "",
    phone: "",
    province: "",
    district: "",
    ward: "",
    street: "",
    note: "",
  });

  const [savedAddresses, setSavedAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [saveAddress, setSaveAddress] = useState(true);
  const [selectedAddressId, setSelectedAddressId] = useState(null);

  const fillFormFromAddress = (addr) => {
    setFormData(prev => ({
      ...prev,
      fullName: addr.full_name || addr.fullName || prev.fullName,
      phone: addr.phone || prev.phone,
      province: addr.province || prev.province,
      district: addr.district || prev.district,
      ward: addr.ward || prev.ward,
      street: addr.street || prev.street,
    }));
  };

  // Fetch saved addresses
  useEffect(() => {
    if (!currentUser) return;
    let cancelled = false;
    setAddressesLoading(true);
    fetchApi('/users/addresses')
      .then(res => {
        if (!cancelled && res.success) {
          setSavedAddresses(res.data || []);
          const defaultAddr = (res.data || []).find(a => a.is_default || a.isDefault);
          if (defaultAddr) {
            setSelectedAddressId(defaultAddr.id || defaultAddr._id);
            fillFormFromAddress(defaultAddr);
          }
        }
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setAddressesLoading(false);
      });
    return () => { cancelled = true; };
  }, [currentUser]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setSelectedAddressId(null);
  };

  const handleSelectAddress = (address) => {
    setSelectedAddressId(address.id || address._id);
    fillFormFromAddress(address);
  };

  const handleSetDefault = async (addressId) => {
    try {
      const res = await fetchApi(`/users/addresses/${addressId}/default`, { method: 'PUT' });
      if (res.success) {
        setSavedAddresses(res.data || []);
        toast.success('Đã cập nhật địa chỉ mặc định.');
      }
    } catch (err) {
      toast.error(err.message || 'Không thể cập nhật.');
    }
  };

  const handleDeleteAddress = async (addressId) => {
    try {
      const res = await fetchApi(`/users/addresses/${addressId}`, { method: 'DELETE' });
      if (res.success) {
        setSavedAddresses(res.data || []);
        if (selectedAddressId === addressId) {
          setSelectedAddressId(null);
        }
        toast.success('Đã xóa địa chỉ.');
      }
    } catch (err) {
      toast.error(err.message || 'Không thể xóa địa chỉ.');
    }
  };

  const handleAddNewAddress = () => {
    setSelectedAddressId(null);
    setFormData(prev => ({
      ...prev,
      fullName: currentUser?.name || '',
      phone: '',
      province: '',
      district: '',
      ward: '',
      street: '',
      note: '',
    }));
    setSaveAddress(true);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handlePlaceOrder = async (e) => {
    e.preventDefault();

    if (checkoutCount === 0) {
      toast.error("Giỏ hàng trống.");
      return;
    }
    if (!currentUser) {
      toast.error("Vui lòng đăng nhập để đặt hàng.");
      navigate("/dang-nhap");
      return;
    }

    if (!formData.fullName || !formData.phone || !formData.province || !formData.district || !formData.street) {
      toast.error("Vui lòng điền đầy đủ thông tin giao hàng.");
      return;
    }

    setIsSubmitting(true);

    try {
      const orderItems = checkoutItems.map((item) => ({
        productId: item.productId,
        name: item.name,
        price: item.price,
        image: item.imageUrl,
        quantity: item.quantity,
        selectedSize: item.selectedSize || null,
      }));

      const orderPayload = {
        items: orderItems,
        subtotal: checkoutTotalPrice,
        shippingFee: 0,
        couponCode: couponInfo?.code || undefined,
        total: checkoutTotalPrice,
        paymentMethod: paymentMethod,
        shippingAddress: {
          fullName: formData.fullName,
          phone: formData.phone,
          province: formData.province,
          district: formData.district,
          ward: formData.ward || "",
          street: formData.street,
          note: formData.note || "",
        },
        customerNote: formData.note || "",
      };

      const response = await fetchApi("/orders", {
        method: "POST",
        body: JSON.stringify(orderPayload),
      });

      // Save address if checked
      if (saveAddress && currentUser) {
        try {
          await fetchApi('/users/addresses', {
            method: 'POST',
            body: JSON.stringify({
              fullName: formData.fullName,
              phone: formData.phone,
              province: formData.province,
              district: formData.district,
              ward: formData.ward || "",
              street: formData.street,
              isDefault: savedAddresses.length === 0,
            }),
          });
        } catch (err) {
          console.warn('Failed to save address:', err);
        }
      }

      const checkedOutIds = checkoutItems.map((item) => item.id);
      await removeItems(checkedOutIds);
      if (paymentMethod === "momo" && response.data?.paymentUrl) {
        window.location.href = response.data.paymentUrl;
      } else {
        const orderCode = response.data?.orderCode || '';
        navigate("/dat-hang-thanh-cong", { state: { orderCode } });
      }
    } catch (error) {
      console.error("Lỗi khi đặt hàng:", error);
      toast.error(error.message || "Đặt hàng thất bại. Vui lòng thử lại.");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (checkoutCount === 0) {
    return (
      <div className="container w-[90%] max-w-[1000px] mx-auto mt-10 py-20 text-center">
        <h1 className="text-3xl font-bold mb-4">Giỏ hàng của bạn đang trống</h1>
        <Link to="/" className="text-lg text-primary hover:underline">
          Tiếp tục mua sắm
        </Link>
      </div>
    );
  }

  return (
    <div className="bg-gray-100 py-10">
      <div className="container w-[90%] max-w-[1000px] mx-auto grid grid-cols-1 md:grid-cols-5 gap-8">
        {/* === CỘT TRÁI (FORM) === */}
        <form
          onSubmit={handlePlaceOrder}
          className="md:col-span-3 flex flex-col gap-6"
        >
          <h1 className="text-2xl font-bold">Thông tin giao hàng</h1>

          {/* Saved addresses */}
          {currentUser && (
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-base font-bold flex items-center gap-2">
                  <i className="fas fa-address-book text-gray-400" />
                  Địa chỉ đã lưu
                </h2>
                <button
                  type="button"
                  onClick={handleAddNewAddress}
                  className="text-xs text-red-600 hover:text-red-700 font-semibold flex items-center gap-1 transition-colors cursor-pointer"
                >
                  <i className="fas fa-plus-circle" />
                  Thêm địa chỉ mới
                </button>
              </div>
              {savedAddresses.length > 0 ? (
                <div className="space-y-2">
                  {savedAddresses.map(addr => (
                    <SavedAddressCard
                      key={addr._id}
                      address={addr}
                      isSelected={selectedAddressId === addr._id}
                      onSelect={handleSelectAddress}
                      onSetDefault={handleSetDefault}
                      onDelete={handleDeleteAddress}
                    />
                  ))}
                </div>
              ) : (
                <p className="text-sm text-gray-400 italic">
                  Chưa có địa chỉ nào. Thêm địa chỉ mới bên dưới.
                </p>
              )}
            </div>
          )}

          {addressesLoading && (
            <div className="text-center text-sm text-gray-400 py-2">
              <i className="fas fa-spinner fa-spin mr-2" />
              Đang tải địa chỉ đã lưu...
            </div>
          )}

          {/* Form thông tin */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="grid grid-cols-2 gap-4">
              <input
                type="text"
                placeholder="Họ và tên *"
                name="fullName"
                value={formData.fullName}
                onChange={handleInputChange}
                required
                className="col-span-2 p-3 border rounded-md focus:border-primary focus:outline-none"
              />
              <input
                type="email"
                placeholder="Email *"
                name="email"
                value={formData.email}
                onChange={handleInputChange}
                required
                className="col-span-1 p-3 border rounded-md focus:border-primary focus:outline-none"
              />
              <input
                type="tel"
                placeholder="Số điện thoại *"
                name="phone"
                value={formData.phone}
                onChange={handleInputChange}
                required
                pattern="[0-9]{10,11}"
                title="Vui lòng nhập số điện thoại hợp lệ (10-11 số)"
                className="col-span-1 p-3 border rounded-md focus:border-primary focus:outline-none"
              />
              <input
                type="text"
                placeholder="Tỉnh/Thành phố *"
                name="province"
                value={formData.province}
                onChange={handleInputChange}
                required
                className="col-span-1 p-3 border rounded-md focus:border-primary focus:outline-none"
              />
              <input
                type="text"
                placeholder="Quận/Huyện *"
                name="district"
                value={formData.district}
                onChange={handleInputChange}
                required
                className="col-span-1 p-3 border rounded-md focus:border-primary focus:outline-none"
              />
              <input
                type="text"
                placeholder="Phường/Xã *"
                name="ward"
                value={formData.ward}
                onChange={handleInputChange}
                required
                className="col-span-2 p-3 border rounded-md focus:border-primary focus:outline-none"
              />
              <input
                type="text"
                placeholder="Địa chỉ chi tiết (Số nhà, tên đường) *"
                name="street"
                value={formData.street}
                onChange={handleInputChange}
                required
                className="col-span-2 p-3 border rounded-md focus:border-primary focus:outline-none"
              />
              <textarea
                placeholder="Ghi chú thêm (tùy chọn)"
                name="note"
                value={formData.note}
                onChange={handleInputChange}
                rows="3"
                className="col-span-2 p-3 border rounded-md focus:border-primary focus:outline-none resize-none"
              />
            </div>

            {/* Save address checkbox */}
            {currentUser && (
              <label className="flex items-center gap-2 mt-4 cursor-pointer text-sm text-gray-600 select-none">
                <input
                  type="checkbox"
                  checked={saveAddress}
                  onChange={(e) => setSaveAddress(e.target.checked)}
                  className="w-4 h-4 rounded border-gray-300 text-red-600 focus:ring-red-500"
                />
                <i className="fas fa-bookmark text-gray-400" />
                Lưu thông tin giao hàng cho lần sau
              </label>
            )}
          </div>

          {/* Form phương thức thanh toán */}
          <h2 className="text-2xl font-bold">Phương thức thanh toán</h2>
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <div className="space-y-3">
              {/* COD Option */}
              <label className={`block border p-4 rounded-md cursor-pointer transition-all ${
                paymentMethod === 'cod' 
                  ? 'border-primary bg-red-50/30 dark:bg-slate-800/30' 
                  : 'border-gray-200 hover:border-gray-350 dark:border-slate-700'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="cod"
                    checked={paymentMethod === 'cod'}
                    onChange={() => setPaymentMethod('cod')}
                    className="w-4 h-4 text-red-600 focus:ring-red-500 border-gray-300 cursor-pointer"
                  />
                  <i className="fas fa-money-bill-wave text-primary text-xl" />
                  <span className="font-bold text-gray-800 dark:text-slate-100">
                    Thanh toán khi nhận hàng (COD)
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-2 pl-7">
                  Bạn sẽ thanh toán bằng tiền mặt khi nhận hàng tại nhà.
                </p>
              </label>

              {/* MoMo Option */}
              <label className={`block border p-4 rounded-md cursor-pointer transition-all ${
                paymentMethod === 'momo' 
                  ? 'border-pink-600 bg-pink-50/30 dark:bg-pink-900/10' 
                  : 'border-gray-200 hover:border-gray-350 dark:border-slate-700'
              }`}>
                <div className="flex items-center gap-3">
                  <input
                    type="radio"
                    name="paymentMethod"
                    value="momo"
                    checked={paymentMethod === 'momo'}
                    onChange={() => setPaymentMethod('momo')}
                    className="w-4 h-4 text-pink-600 focus:ring-pink-500 border-gray-300 cursor-pointer"
                  />
                  <span className="w-6 h-6 bg-[#A50064] text-white flex items-center justify-center rounded font-extrabold text-[9px] select-none">
                    momo
                  </span>
                  <span className="font-bold text-gray-800 dark:text-slate-100">
                    Thanh toán trực tuyến qua Ví MoMo
                  </span>
                </div>
                <p className="text-sm text-gray-500 dark:text-slate-400 mt-2 pl-7">
                  Hệ thống sẽ chuyển hướng bạn qua cổng thanh toán MoMo để hoàn tất đơn hàng.
                </p>
              </label>
            </div>
          </div>

          {/* Nút Hoàn tất */}
          <div className="flex justify-between items-center mt-4">
            <Link
              to="/gio-hang"
              className="text-sm text-primary hover:underline"
            >
              Giỏ hàng
            </Link>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`bg-primary text-white text-lg font-bold uppercase py-4 px-6 rounded-md transition-colors ${
                isSubmitting
                  ? "opacity-50 cursor-not-allowed"
                  : "hover:bg-red-700"
              }`}
            >
              {isSubmitting ? "Đang xử lý..." : "Hoàn tất đơn hàng"}
            </button>
          </div>
        </form>

        {/* === CỘT PHẢI (TÓM TẮT ĐƠN HÀNG) === */}
        <div className="md:col-span-2 bg-white p-6 rounded-lg shadow-sm h-fit">
          <h2 className="text-xl font-bold mb-4 border-b pb-4">
            Đơn hàng ({checkoutCount} sản phẩm)
          </h2>

          <div className="flex flex-col gap-2 max-h-[300px] overflow-y-auto">
            {checkoutItems.map((item) => (
              <OrderSummaryItem key={item.id} item={item} />
            ))}
          </div>

          <div className="flex gap-2 mt-4 py-4 border-t border-b">
            {couponInfo ? (
              <div className="flex items-center justify-between w-full bg-green-50 rounded-lg px-4 py-2">
                <div className="flex items-center gap-2">
                  <i className="fas fa-check-circle text-green-500" />
                  <span className="font-semibold text-green-700">{couponInfo.code}</span>
                  <span className="text-sm text-green-600">
                    (-{couponInfo.discountValue ? Number(couponInfo.discountValue).toLocaleString("vi-VN") : "0"} ₫)
                  </span>
                </div>
                <span className="text-xs text-green-500">Đã áp dụng</span>
              </div>
            ) : (
              <span className="text-sm text-gray-400 italic">
                Thêm mã giảm giá ở giỏ hàng
              </span>
            )}
          </div>

          <div className="py-4 border-b">
            <div className="flex justify-between text-gray-700">
              <span>Tạm tính:</span>
              <span>{checkoutTotalPrice.toLocaleString("vi-VN")} ₫</span>
            </div>
            {couponInfo && (
              <div className="flex justify-between text-green-600">
                <span>Giảm giá:</span>
                <span>-{couponInfo.discountValue ? Number(couponInfo.discountValue).toLocaleString("vi-VN") : "0"} ₫</span>
              </div>
            )}
            <div className="flex justify-between text-gray-700">
              <span>Phí vận chuyển:</span>
              <span>—</span>
            </div>
          </div>
          <div className="flex justify-between font-bold text-xl pt-4 mt-4">
            <span>Tổng cộng:</span>
            <span className="text-2xl">
              {Math.max(checkoutTotalPrice - (couponInfo?.discountValue || 0), 0).toLocaleString("vi-VN")} ₫
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}
