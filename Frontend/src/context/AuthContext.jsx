// src/context/AuthContext.jsx (Đã sửa đổi)
import React, { createContext, useState, useContext, useEffect } from "react";
import { fetchApi } from "../utils/api";
import { toast } from "react-toastify";

const AuthContext = createContext();

// Hàm lấy trạng thái đăng nhập ban đầu từ localStorage
const getInitialUser = () => {
  try {
    const user = localStorage.getItem("user");
    const token = localStorage.getItem("token");
    if (user && token) {
      return JSON.parse(user);
    }
  } catch (e) {
    console.error("Failed to load user from local storage", e);
  }
  return null;
};

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(getInitialUser);

  // Tự động làm mới thông tin user từ server khi app khởi động
  // Đảm bảo role luôn được cập nhật mới nhất (tránh localStorage cũ)
  useEffect(() => {
    const token = localStorage.getItem("token");
    if (!token) return;

    fetchApi("/auth/profile")
      .then((response) => {
        const freshUser = response.data || response;
        if (freshUser && freshUser._id) {
          localStorage.setItem("user", JSON.stringify(freshUser));
          setCurrentUser(freshUser);
        }
      })
      .catch(() => {
        // Token hết hạn hoặc không hợp lệ → đăng xuất
        localStorage.removeItem("token");
        localStorage.removeItem("user");
        setCurrentUser(null);
      });
  }, []);

  // Dùng useCallback để tránh re-render không cần thiết
  const login = async (email, password) => {
    try {
      const response = await fetchApi("/auth/login", {
        method: "POST",
        body: JSON.stringify({ email, password }),
      });

      // Backend trả về format: { success: true, statusCode: 200, message: "...", data: { token, user } }
      const { data } = response;
      
      // Lưu token và user vào localStorage
      localStorage.setItem("token", data.token);
      localStorage.setItem("user", JSON.stringify(data.user));
      setCurrentUser(data.user);
      return data.user; // Trả về user để LoginPage có thể kiểm tra role
    } catch (error) {
      // Ném lỗi để component LoginPage có thể bắt và hiển thị toast
      throw new Error(error.message || "Đăng nhập thất bại.");
    }
  };

  const register = async (name, email, password) => {
    try {
      // Backend trả về format: { success: true, statusCode: 201, message: "...", data: { token, user } }
      const response = await fetchApi("/auth/register", {
        method: "POST",
        body: JSON.stringify({ name, email, username: email, password }),
      });
      return true;
    } catch (error) {
      throw new Error(error.message || "Đăng ký thất bại.");
    }
  };

  const logout = async () => {
    try {
      // Gọi API logout để xóa HTTP-only cookie
      await fetchApi("/auth/logout", { method: "POST" });
    } catch (error) {
      console.error("Logout API error:", error);
    } finally {
      // Xóa localStorage dù API có lỗi hay không
      localStorage.removeItem("token");
      localStorage.removeItem("user");
      localStorage.removeItem("cart");
      localStorage.removeItem("cart_selected");
      setCurrentUser(null);
      toast.info("Đã đăng xuất.");
    }
  };

  const value = {
    currentUser,
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export const useAuth = () => {
  return useContext(AuthContext);
};
