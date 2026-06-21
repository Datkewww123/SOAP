// src/pages/LoginPage.jsx
import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { toast } from "react-toastify";

export default function LoginPage() {
  // KHẮC PHỤC LỖI: Thêm khai báo useState cho email và password
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const { login } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    // Giữ nguyên async
    e.preventDefault();

    try {
      // Gọi hàm login với state email và password
      const user = await login(email, password);
      toast.success("Đăng nhập thành công!");
      
      // Kiểm tra role của user và chuyển hướng phù hợp
      if (user && user.role === "admin") {
        navigate("/admin");
      } else {
        navigate("/");
      }
    } catch (error) {
      // Bắt lỗi từ AuthContext và hiển thị
      toast.error(error.message || "Sai email hoặc mật khẩu!");
    }
  };

  return (
    <div className="container w-[90%] max-w-[500px] mx-auto mt-10 py-10">
      <h1 className="text-3xl font-bold text-center mb-8 dark:text-white">Đăng Nhập</h1>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col gap-4 bg-white dark:bg-gray-800 p-8 rounded-lg shadow-md dark:shadow-gray-900/50"
      >
        <div>
          <label htmlFor="email" className="block text-sm font-bold mb-1 dark:text-gray-200">
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            autoComplete="email"
            required
            // SỬ DỤNG state email và setEmail
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            placeholder="user@test.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="block text-sm font-bold mb-1 dark:text-gray-200">
            Mật khẩu *
          </label>
          <input
            type="password"
            id="password"
            name="password"
            autoComplete="current-password"
            required
            // SỬ DỤNG state password và setPassword
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-800 dark:text-gray-100"
            placeholder="123"
          />
        </div>

        <button
          type="submit"
          className="w-full bg-primary text-white text-lg font-bold uppercase py-3 px-6 rounded-md transition-colors hover:bg-primary-dark mt-4"
        >
          Đăng nhập
        </button>

        <p className="text-center mt-2 text-sm dark:text-gray-300">
          Chưa có tài khoản?{" "}
          <Link
            to="/dang-ky"
            className="text-primary hover:underline font-bold"
          >
            Đăng ký ngay
          </Link>
        </p>
      </form>
    </div>
  );
}
