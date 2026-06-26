import React, { createContext, useState, useContext, useEffect, useCallback } from "react";
import { toast } from "react-toastify";
import { useAuth } from "./AuthContext";

const CartContext = createContext();

function generateId() {
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 9);
}

function loadCart() {
  try {
    const data = localStorage.getItem("cart");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveCart(items) {
  localStorage.setItem("cart", JSON.stringify(items));
}

function loadSelectedIds() {
  try {
    const data = localStorage.getItem("cart_selected");
    return data ? JSON.parse(data) : [];
  } catch {
    return [];
  }
}

function saveSelectedIds(ids) {
  localStorage.setItem("cart_selected", JSON.stringify(ids));
}

export function CartProvider({ children }) {
  const { currentUser } = useAuth();
  const [cartItems, setCartItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [modalData, setModalData] = useState({ isOpen: false, product: null, quantity: 1, selectedSize: null });
  const [couponInfo, setCouponInfo] = useState(null);
  const [selectedIds, setSelectedIds] = useState([]);

  // Web Audio API để tổng hợp âm thanh "ting"
  const playChimeSound = () => {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (!AudioContext) return;
      const ctx = new AudioContext();
      const now = ctx.currentTime;
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      
      osc.type = "sine";
      osc.frequency.setValueAtTime(1318.51, now); // Nốt E6 trong trẻo, ting ting
      
      gain.gain.setValueAtTime(0.25, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.8);
      
      osc.connect(gain);
      gain.connect(ctx.destination);
      
      osc.start(now);
      osc.stop(now + 0.8);
    } catch (e) {
      console.warn("AudioContext blocked or not supported", e);
    }
  };

  // Tự động đóng modal sau 3 giây
  useEffect(() => {
    if (modalData.isOpen) {
      const timer = setTimeout(() => {
        setModalData((prev) => ({ ...prev, isOpen: false }));
      }, 3000);
      return () => clearTimeout(timer);
    }
  }, [modalData.isOpen]);

  useEffect(() => {
    const items = loadCart();
    setCartItems(items);
    const savedIds = loadSelectedIds();
    const validIds = savedIds.filter((id) => items.some((item) => item.id === id));
    setSelectedIds(validIds);
  }, []);

  useEffect(() => {
    if (!currentUser) {
      setCartItems([]);
      setSelectedIds([]);
    }
  }, [currentUser]);

  const addToCart = useCallback(async (product, quantityToAdd = 1, selectedSize = null) => {
    if (!currentUser) {
      toast.warning("Vui lòng đăng nhập để thêm sản phẩm vào giỏ hàng.");
      return;
    }
    const items = loadCart();
    const existingIndex = items.findIndex(
      (item) => item.productId === product.id && item.selectedSize === (selectedSize || null)
    );

    if (existingIndex > -1) {
      items[existingIndex].quantity += quantityToAdd;
    } else {
      items.push({
        id: generateId(),
        productId: product.id,
        productSlug: product.slug,
        name: product.name,
        price: product.price,
        quantity: quantityToAdd,
        imageUrl: product.imageUrl || product.images?.[0] || product.galleryImages?.[0] || null,
        selectedSize: selectedSize || null,
      });
    }

    saveCart(items);
    setCartItems(items);

    // Phát tiếng "ting" và hiển thị popup modal giữa màn hình thay vì toast ở góc
    setModalData({
      isOpen: true,
      product,
      quantity: quantityToAdd,
      selectedSize
    });
    playChimeSound();

    return { success: true };
  }, [currentUser]);

  const updateQuantity = useCallback(async (itemId, newQuantity) => {
    if (newQuantity < 1) return;
    const items = loadCart();
    const item = items.find((i) => i.id === itemId);
    if (item) {
      item.quantity = newQuantity;
      saveCart(items);
      setCartItems(items);
    }
  }, []);

  const removeFromCart = useCallback(async (itemId) => {
    const items = loadCart().filter((i) => i.id !== itemId);
    saveCart(items);
    setCartItems(items);
    setSelectedIds((prev) => {
      const next = prev.filter((id) => id !== itemId);
      saveSelectedIds(next);
      return next;
    });
  }, []);

  const clearCart = useCallback(async () => {
    saveCart([]);
    setCartItems([]);
    setSelectedIds([]);
    saveSelectedIds([]);
  }, []);

  const resetCart = useCallback(() => {
    saveCart([]);
    setCartItems([]);
    setSelectedIds([]);
    saveSelectedIds([]);
  }, []);

  const toggleItemSelection = useCallback((itemId) => {
    setSelectedIds((prev) => {
      const next = prev.includes(itemId)
        ? prev.filter((id) => id !== itemId)
        : [...prev, itemId];
      saveSelectedIds(next);
      return next;
    });
  }, []);

  const selectAllItems = useCallback(() => {
    const allIds = cartItems.map((item) => item.id);
    setSelectedIds(allIds);
    saveSelectedIds(allIds);
  }, [cartItems]);

  const deselectAllItems = useCallback(() => {
    setSelectedIds([]);
    saveSelectedIds([]);
  }, []);

  const removeItems = useCallback(async (itemIds) => {
    const items = loadCart().filter((i) => !itemIds.includes(i.id));
    saveCart(items);
    setCartItems(items);
    setSelectedIds((prev) => {
      const next = prev.filter((id) => !itemIds.includes(id));
      saveSelectedIds(next);
      return next;
    });
  }, []);

  const cartCount = cartItems.reduce((total, item) => total + item.quantity, 0);

  const totalPrice = cartItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const selectedItems = cartItems.filter((item) => selectedIds.includes(item.id));

  const selectedTotalPrice = selectedItems.reduce(
    (total, item) => total + item.price * item.quantity,
    0
  );

  const selectedCount = selectedItems.reduce((total, item) => total + item.quantity, 0);

  const allSelected = cartItems.length > 0 && selectedIds.length === cartItems.length;

  const value = {
    cartItems,
    cartCount,
    totalPrice,
    addToCart,
    updateQuantity,
    removeFromCart,
    clearCart,
    resetCart,
    isLoading,
    couponInfo,
    setCouponInfo,
    selectedIds,
    selectedItems,
    selectedTotalPrice,
    selectedCount,
    allSelected,
    toggleItemSelection,
    selectAllItems,
    deselectAllItems,
    removeItems,
  };

  return (
    <CartContext.Provider value={value}>
      {children}

      {/* Success Added to Cart Modal */}
      {modalData.isOpen && modalData.product && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
          {/* Backdrop */}
          <div 
            className="absolute inset-0 bg-black/60 backdrop-blur-sm transition-opacity duration-300"
            onClick={() => setModalData(prev => ({ ...prev, isOpen: false }))}
          />
          
          {/* Modal Content */}
          <div className="relative bg-white dark:bg-slate-800 text-gray-800 dark:text-slate-100 rounded-2xl shadow-2xl w-full max-w-md p-6 overflow-hidden border border-gray-100 dark:border-slate-700 animate-slide-up transform transition-all duration-300">
            {/* Close button */}
            <button 
              onClick={() => setModalData(prev => ({ ...prev, isOpen: false }))}
              className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-white transition-colors text-xl font-bold cursor-pointer"
            >
              &times;
            </button>

            {/* Title / Icon */}
            <div className="flex flex-col items-center text-center mb-5">
              <div className="w-16 h-16 bg-green-100 dark:bg-green-950/40 rounded-full flex items-center justify-center text-green-500 dark:text-green-400 text-3xl mb-3 shadow-inner shadow-green-200/50 animate-bounce">
                <i className="fas fa-check-circle" />
              </div>
              <h3 className="text-xl font-bold tracking-tight">Thêm Vào Giỏ Thành Công!</h3>
              <p className="text-xs text-gray-500 dark:text-slate-400 mt-1">Sản phẩm đã được cập nhật vào đơn hàng của bạn.</p>
            </div>

            {/* Product Details Card */}
            <div className="flex gap-4 p-4 bg-gray-50 dark:bg-slate-900/60 rounded-xl border border-gray-100 dark:border-slate-800 mb-6">
              <img 
                src={modalData.product.imageUrl || modalData.product.images?.[0] || modalData.product.galleryImages?.[0] || "https://placehold.co/150x150?text=No+Image"}
                alt={modalData.product.name}
                className="w-20 h-20 object-cover rounded-lg border border-gray-200 dark:border-slate-700 bg-white"
                onError={(e) => {
                  e.currentTarget.src = "https://placehold.co/150x150?text=No+Image";
                }}
              />
              <div className="flex-1 min-w-0">
                <h4 className="font-bold text-sm text-gray-800 dark:text-slate-200 truncate mb-1">
                  {modalData.product.name}
                </h4>
                {modalData.selectedSize && (
                  <p className="text-xs text-gray-500 dark:text-slate-400 mb-1">
                    Kích cỡ: <span className="font-semibold text-primary">{modalData.selectedSize}</span>
                  </p>
                )}
                <p className="text-xs text-gray-500 dark:text-slate-400">
                  Số lượng: <span className="font-semibold text-gray-700 dark:text-slate-300">{modalData.quantity}</span>
                </p>
                <div className="mt-2 text-sm font-bold text-primary">
                  {modalData.product.price ? Number(modalData.product.price).toLocaleString("vi-VN") : "0"} ₫
                </div>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => setModalData(prev => ({ ...prev, isOpen: false }))}
                className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-700 dark:text-slate-200 transition-colors text-center cursor-pointer"
              >
                Tiếp Tục Mua Sắm
              </button>
              <a
                href="/gio-hang"
                onClick={() => setModalData(prev => ({ ...prev, isOpen: false }))}
                className="w-full py-3 px-4 rounded-xl text-sm font-bold bg-primary hover:bg-red-700 text-white text-center shadow-lg shadow-red-500/20 hover:shadow-red-500/30 transition-all cursor-pointer"
              >
                Xem Giỏ Hàng
              </a>
            </div>
          </div>
        </div>
      )}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  return useContext(CartContext);
};
