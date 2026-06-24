import React, { useState, useEffect } from "react";
import { useAuth } from "../context/AuthContext";
import { useCart } from "../context/CartContext";
import { useNavigate } from "react-router-dom";
import { fetchApi } from "../utils/api";
import { toast } from "react-toastify";

function SavedAddressCard({ address, isSelected, onSelect, onSetDefault, onDelete, onEdit }) {
  const addrId = address.id || address._id;
  const addrName = address.full_name || address.fullName;
  const addrIsDefault = address.is_default || address.isDefault;
  return (
    <div
      className={`border rounded-lg p-3 transition-all ${
        isSelected
          ? 'border-red-500 bg-red-50 shadow-sm'
          : 'border-gray-200 dark:border-gray-600'
      }`}
    >
      <div className="flex items-start justify-between gap-2">
        <div
          className="flex-1 min-w-0 cursor-pointer"
          onClick={() => onSelect(address)}
        >
          <p className="font-semibold text-sm truncate dark:text-white">{addrName}</p>
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
            onClick={(e) => { e.stopPropagation(); onEdit(address); }}
            className="text-gray-300 hover:text-blue-500 transition-colors cursor-pointer"
            title="Sửa địa chỉ"
          >
            <i className="fas fa-pen text-xs" />
          </button>
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

function ProfileTab({ user }) {
  const [formData, setFormData] = useState({
    name: user.name || "",
    phone: user.phone || "",
  });

  // Password state
  const [pwForm, setPwForm] = useState({
    oldPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [pwLoading, setPwLoading] = useState(false);

  // Address state
  const [savedAddresses, setSavedAddresses] = useState([]);
  const [addressesLoading, setAddressesLoading] = useState(false);
  const [selectedAddressId, setSelectedAddressId] = useState(null);
  const [showAddressForm, setShowAddressForm] = useState(false);
  const [editingAddress, setEditingAddress] = useState(null);
  const [addressForm, setAddressForm] = useState({
    fullName: "",
    phone: "",
    province: "",
    district: "",
    ward: "",
    street: "",
  });

  // Fetch saved addresses
  const fetchAddresses = async () => {
    setAddressesLoading(true);
    try {
      const res = await fetchApi('/users/addresses');
      if (res.success) {
        setSavedAddresses(res.data || []);
      }
    } catch (err) {
      console.warn('Failed to fetch addresses:', err);
    } finally {
      setAddressesLoading(false);
    }
  };

  useEffect(() => {
    if (user?._id || user?.id) {
      fetchAddresses();
    }
  }, [user]);

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handlePwChange = (e) => {
    const { name, value } = e.target;
    setPwForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleAddressFormChange = (e) => {
    const { name, value } = e.target;
    setAddressForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleUpdateProfile = async (e) => {
    e.preventDefault();
    try {
      await fetchApi(`/users/${user._id || user.id}`, {
        method: "PUT",
        body: JSON.stringify(formData),
      });
      toast.success("Cập nhật thông tin thành công!");
    } catch (error) {
      toast.error(error.message || "Cập nhật thất bại.");
    }
  };

  const handleChangePassword = async (e) => {
    e.preventDefault();
    if (!pwForm.oldPassword || !pwForm.newPassword || !pwForm.confirmPassword) {
      toast.error("Vui lòng điền đầy đủ các trường mật khẩu.");
      return;
    }
    if (pwForm.newPassword.length < 6) {
      toast.error("Mật khẩu mới phải có ít nhất 6 ký tự.");
      return;
    }
    if (pwForm.newPassword !== pwForm.confirmPassword) {
      toast.error("Mật khẩu mới và xác nhận mật khẩu không khớp.");
      return;
    }
    setPwLoading(true);
    try {
      const res = await fetchApi("/auth/change-password", {
        method: "POST",
        body: JSON.stringify({
          oldPassword: pwForm.oldPassword,
          newPassword: pwForm.newPassword,
        }),
      });
      if (res.success) {
        toast.success("Đổi mật khẩu thành công!");
        setPwForm({ oldPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        toast.error(res.message || "Đổi mật khẩu thất bại.");
      }
    } catch (error) {
      toast.error(error.message || "Mật khẩu cũ không đúng.");
    } finally {
      setPwLoading(false);
    }
  };

  const openAddAddress = () => {
    setEditingAddress(null);
    setAddressForm({
      fullName: user.name || "",
      phone: user.phone || "",
      province: "",
      district: "",
      ward: "",
      street: "",
    });
    setShowAddressForm(true);
  };

  const openEditAddress = (address) => {
    setEditingAddress(address);
    setAddressForm({
      fullName: address.full_name || address.fullName || "",
      phone: address.phone || "",
      province: address.province || "",
      district: address.district || "",
      ward: address.ward || "",
      street: address.street || "",
    });
    setShowAddressForm(true);
  };

  const handleSaveAddress = async (e) => {
    e.preventDefault();
    if (!addressForm.fullName || !addressForm.phone || !addressForm.province || !addressForm.district || !addressForm.street) {
      toast.error("Vui lòng điền đầy đủ thông tin địa chỉ.");
      return;
    }
    try {
      if (editingAddress) {
        const addrId = editingAddress.id || editingAddress._id;
        const res = await fetchApi(`/users/addresses/${addrId}`, {
          method: 'PUT',
          body: JSON.stringify({ ...addressForm, isDefault: editingAddress.is_default || editingAddress.isDefault }),
        });
        if (res.success) {
          setSavedAddresses(res.data || []);
          toast.success('Cập nhật địa chỉ thành công!');
        }
      } else {
        const res = await fetchApi('/users/addresses', {
          method: 'POST',
          body: JSON.stringify({
            ...addressForm,
            isDefault: savedAddresses.length === 0,
          }),
        });
        if (res.success) {
          setSavedAddresses(res.data || []);
          toast.success('Thêm địa chỉ thành công!');
        }
      }
      setShowAddressForm(false);
      setEditingAddress(null);
    } catch (err) {
      toast.error(err.message || 'Lưu địa chỉ thất bại.');
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

  return (
    <div className="space-y-8">
      {/* ── Thông tin tài khoản ── */}
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
            <label htmlFor="acc-email" className="block text-sm font-bold mb-1 dark:text-gray-200">
              Email
            </label>
            <input
              type="email"
              id="acc-email"
              value={user.email}
              readOnly
              className="w-full p-3 border rounded-md bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 border-gray-300 dark:border-gray-600 cursor-not-allowed"
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
          <button
            type="submit"
            className="bg-primary text-white font-bold py-3 px-6 rounded-md hover:bg-primary-dark transition-colors"
          >
            Cập nhật thông tin
          </button>
        </form>
      </div>

      {/* ── Đường kẻ ngăn cách ── */}
      <hr className="border-gray-200 dark:border-gray-700" />

      {/* ── Địa chỉ đã lưu ── */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-2xl font-bold dark:text-white">Địa chỉ đã lưu</h2>
          <button
            type="button"
            onClick={openAddAddress}
            className="text-sm bg-primary text-white font-bold py-2 px-4 rounded-md hover:bg-primary-dark transition-colors cursor-pointer"
          >
            <i className="fas fa-plus-circle mr-1" />
            Thêm địa chỉ mới
          </button>
        </div>

        {addressesLoading ? (
          <div className="text-center text-sm text-gray-400 py-4">
            <i className="fas fa-spinner fa-spin mr-2" />
            Đang tải địa chỉ...
          </div>
        ) : savedAddresses.length > 0 ? (
          <div className="space-y-2">
            {savedAddresses.map(addr => (
              <SavedAddressCard
                key={addr.id || addr._id}
                address={addr}
                isSelected={selectedAddressId === (addr.id || addr._id)}
                onSelect={(a) => setSelectedAddressId(a.id || a._id)}
                onSetDefault={handleSetDefault}
                onDelete={handleDeleteAddress}
                onEdit={openEditAddress}
              />
            ))}
          </div>
        ) : (
          <p className="text-sm text-gray-400 italic dark:text-gray-500">
            Chưa có địa chỉ nào. Thêm địa chỉ mới bên dưới.
          </p>
        )}

        {/* Form thêm/sửa địa chỉ */}
        {showAddressForm && (
          <form onSubmit={handleSaveAddress} className="mt-4 p-4 border border-gray-200 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-800/50 space-y-3">
            <h3 className="font-bold text-lg dark:text-white">
              {editingAddress ? "Sửa địa chỉ" : "Thêm địa chỉ mới"}
            </h3>
            <div className="grid grid-cols-2 gap-3">
              <input
                type="text"
                placeholder="Họ và tên *"
                name="fullName"
                value={addressForm.fullName}
                onChange={handleAddressFormChange}
                required
                className="col-span-2 p-3 border rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              />
              <input
                type="tel"
                placeholder="Số điện thoại *"
                name="phone"
                value={addressForm.phone}
                onChange={handleAddressFormChange}
                required
                className="col-span-1 p-3 border rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              />
              <input
                type="text"
                placeholder="Tỉnh/Thành phố *"
                name="province"
                value={addressForm.province}
                onChange={handleAddressFormChange}
                required
                className="col-span-1 p-3 border rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              />
              <input
                type="text"
                placeholder="Quận/Huyện *"
                name="district"
                value={addressForm.district}
                onChange={handleAddressFormChange}
                required
                className="col-span-1 p-3 border rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              />
              <input
                type="text"
                placeholder="Phường/Xã"
                name="ward"
                value={addressForm.ward}
                onChange={handleAddressFormChange}
                className="col-span-1 p-3 border rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              />
              <input
                type="text"
                placeholder="Địa chỉ chi tiết (Số nhà, tên đường) *"
                name="street"
                value={addressForm.street}
                onChange={handleAddressFormChange}
                required
                className="col-span-2 p-3 border rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              />
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                className="bg-primary text-white font-bold py-2 px-6 rounded-md hover:bg-primary-dark transition-colors"
              >
                {editingAddress ? "Cập nhật" : "Lưu"}
              </button>
              <button
                type="button"
                onClick={() => { setShowAddressForm(false); setEditingAddress(null); }}
                className="bg-gray-300 dark:bg-gray-600 text-gray-700 dark:text-gray-200 font-bold py-2 px-6 rounded-md hover:bg-gray-400 dark:hover:bg-gray-500 transition-colors cursor-pointer"
              >
                Hủy
              </button>
            </div>
          </form>
        )}
      </div>

      {/* ── Đường kẻ ngăn cách ── */}
      <hr className="border-gray-200 dark:border-gray-700" />

      {/* ── Đặt lại mật khẩu ── */}
      <div>
        <h2 className="text-xl font-bold mb-1 dark:text-white">Đặt lại mật khẩu</h2>
        <p className="text-sm text-gray-500 dark:text-gray-400 mb-4">
          Nhập mật khẩu cũ để xác nhận, sau đó đặt mật khẩu mới.
        </p>
        <form onSubmit={handleChangePassword} className="space-y-4">
          <div>
            <label htmlFor="old-password" className="block text-sm font-bold mb-1 dark:text-gray-200">
              Mật khẩu cũ *
            </label>
            <input
              type="password"
              id="old-password"
              name="oldPassword"
              value={pwForm.oldPassword}
              onChange={handlePwChange}
              required
              autoComplete="current-password"
              className="w-full p-3 border rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              placeholder="Nhập mật khẩu hiện tại"
            />
          </div>
          <div>
            <label htmlFor="new-password" className="block text-sm font-bold mb-1 dark:text-gray-200">
              Mật khẩu mới *
            </label>
            <input
              type="password"
              id="new-password"
              name="newPassword"
              value={pwForm.newPassword}
              onChange={handlePwChange}
              required
              autoComplete="new-password"
              className="w-full p-3 border rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              placeholder="Ít nhất 6 ký tự"
            />
          </div>
          <div>
            <label htmlFor="confirm-password" className="block text-sm font-bold mb-1 dark:text-gray-200">
              Xác nhận mật khẩu mới *
            </label>
            <input
              type="password"
              id="confirm-password"
              name="confirmPassword"
              value={pwForm.confirmPassword}
              onChange={handlePwChange}
              required
              autoComplete="new-password"
              className="w-full p-3 border rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100 border-gray-300 dark:border-gray-600"
              placeholder="Nhập lại mật khẩu mới"
            />
          </div>
          <button
            type="submit"
            disabled={pwLoading}
            className="bg-gray-800 dark:bg-gray-600 text-white font-bold py-3 px-6 rounded-md hover:bg-gray-700 dark:hover:bg-gray-500 transition-colors disabled:opacity-60"
          >
            {pwLoading ? "Đang xử lý..." : "Đổi mật khẩu"}
          </button>
        </form>
      </div>
    </div>
  );
}

export default function AccountPage() {
  const { currentUser, logout } = useAuth();
  const { resetCart } = useCart();
  const navigate = useNavigate();

  useEffect(() => {
    if (currentUser === null) {
      navigate("/");
    }
  }, [currentUser, navigate]);

  const handleLogout = () => {
    resetCart();
    logout();
    navigate("/");
  };

  if (currentUser === null) {
    return null;
  }

  return (
    <div className="container w-[90%] max-w-[1000px] mx-auto mt-10 py-10 dark:text-gray-100">
      <h1 className="text-3xl font-bold text-center mb-8 dark:text-white">Tài Khoản Của Bạn</h1>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
        <div className="md:col-span-1">
          <div className="flex flex-col gap-2 bg-white dark:bg-gray-800 p-4 rounded-lg shadow-md dark:shadow-gray-900/50">
            <div className="w-full text-center p-3 rounded-md font-bold bg-primary text-white">
              Thông tin tài khoản
            </div>
            <button
              onClick={handleLogout}
              className="w-full text-left p-3 rounded-md font-bold text-red-500 hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              Đăng xuất
            </button>
          </div>
        </div>

        <div className="md:col-span-3 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md dark:shadow-gray-900/50">
          <ProfileTab user={currentUser} />
        </div>
      </div>
    </div>
  );
}
