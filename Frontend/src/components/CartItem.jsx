// src/components/CartItem.jsx
import React from "react";
import { useCart } from "../context/CartContext";
import { Link } from "react-router-dom";

export default function CartItem({ item }) {
  const { updateQuantity, removeFromCart, selectedIds, toggleItemSelection } = useCart();
  const isSelected = selectedIds.includes(item.id);

  const productUrl = `/san-pham/${item.productSlug || item.productId}`;

  const handleQuantityChange = (e) => {
    const newQuantity = parseInt(e.target.value, 10);
    if (newQuantity > 0) {
      updateQuantity(item.id, newQuantity);
    }
  };

  const increment = () => {
    updateQuantity(item.id, item.quantity + 1);
  };

  const decrement = () => {
    updateQuantity(item.id, item.quantity - 1);
  };

  return (
    // Layout cho 1 hàng sản phẩm, dùng grid-cols-12 đồng bộ hoàn hảo với header
    <div className={`grid grid-cols-1 lg:grid-cols-12 gap-4 items-center p-5 border-b border-gray-100 dark:border-gray-700 last:border-b-0 ${isSelected ? 'bg-red-50/30 dark:bg-red-900/10' : ''}`}>
      {/* 0. Checkbox chọn sản phẩm (chiếm 1/12 cột) */}
      <div className="lg:col-span-1 flex items-center justify-center">
        <input
          type="checkbox"
          checked={isSelected}
          onChange={() => toggleItemSelection(item.id)}
          className="w-5 h-5 rounded border-gray-300 text-red-600 focus:ring-red-500 cursor-pointer"
        />
      </div>

      {/* 1. Thông tin sản phẩm (chiếm 4/12 cột) */}
      <div className="lg:col-span-4 flex items-center gap-4">
        <Link to={productUrl} className="flex-shrink-0">
          <img
            src={item.imageUrl || "https://placehold.co/150x150?text=No+Image"}
            alt={item.name}
            className="w-20 h-20 object-cover rounded"
            onError={(e) => {
              e.currentTarget.src = "https://placehold.co/150x150?text=No+Image";
            }}
          />
        </Link>
        <div>
          <Link
            to={productUrl}
            className="font-bold text-sm hover:text-primary dark:text-slate-200 dark:hover:text-primary block leading-tight"
          >
            {item.name}
          </Link>
          {/* Hiển thị size nếu có */}
          {item.selectedSize && (
            <p className="text-sm text-gray-500 dark:text-slate-400 mt-1">Size: {item.selectedSize}</p>
          )}
        </div>
      </div>

      {/* 2. Đơn giá (chiếm 2/12 cột) */}
      <div className="lg:col-span-2 lg:text-center text-sm text-gray-700 dark:text-slate-300">
        <span className="lg:hidden font-bold">Đơn giá: </span>
        {item.price ? Number(item.price).toLocaleString("vi-VN") : "0"} đ
      </div>

      {/* 3. Số lượng (chiếm 2/12 cột) */}
      <div className="lg:col-span-2 flex items-center lg:justify-center">
        <span className="lg:hidden font-bold mr-3">Số lượng: </span>
        <div className="flex items-center border border-gray-200 dark:border-gray-600 rounded-md max-w-[100px] bg-white dark:bg-gray-700">
          <button onClick={decrement} className="px-3 py-1 text-lg font-bold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white cursor-pointer">
            -
          </button>
          <input
            type="number"
            value={item.quantity}
            onChange={handleQuantityChange}
            className="w-12 text-center font-bold outline-none bg-transparent text-gray-800 dark:text-slate-100 [appearance:textfield] [&::-webkit-outer-spin-button]:appearance-none [&::-webkit-inner-spin-button]:appearance-none"
          />
          <button onClick={increment} className="px-3 py-1 text-lg font-bold text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-white cursor-pointer">
            +
          </button>
        </div>
      </div>

      {/* 4. Thành tiền (chiếm 2/12 cột) */}
      <div className="lg:col-span-2 lg:text-right font-bold text-gray-800 dark:text-slate-200">
        <span className="lg:hidden">Thành tiền: </span>
        {item.price && item.quantity ? (item.price * item.quantity).toLocaleString("vi-VN") : "0"} đ
      </div>

      {/* 5. Nút xóa sản phẩm - Trash can icon (chiếm 1/12 cột) */}
      <div className="lg:col-span-1 text-right mt-2 lg:mt-0">
        <button
          onClick={() => removeFromCart(item.id)}
          className="text-red-500 hover:text-red-700 hover:bg-red-50 dark:hover:bg-red-950/20 p-2 rounded-xl transition-all duration-200 cursor-pointer"
          title="Xóa sản phẩm"
          aria-label={`Xóa ${item.name} khỏi giỏ hàng`}
        >
          <i className="far fa-trash-alt text-lg" />
        </button>
      </div>
    </div>
  );
}
