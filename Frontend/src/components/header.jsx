import React, { useState, useEffect, useCallback, useRef } from "react";
import { useCart } from "../context/CartContext";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { fetchApi } from "../utils/api";
import SearchAutocomplete from "./SearchAutocomplete";

export default function Header() {
  const { cartCount } = useCart();
  const { currentUser, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const isCartOrCheckout = ["/gio-hang", "/thanh-toan"].includes(location.pathname);
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loadingMenu, setLoadingMenu] = useState(true);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [mobileSubOpen, setMobileSubOpen] = useState(null);
  const [isDark, setIsDark] = useState(() => {
    return localStorage.getItem('theme') === 'dark' ||
      (!localStorage.getItem('theme') && window.matchMedia('(prefers-color-scheme: dark)').matches);
  });

  const [userDropdownOpen, setUserDropdownOpen] = useState(false);
  const userDropdownRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (userDropdownRef.current && !userDropdownRef.current.contains(event.target)) {
        setUserDropdownOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const fetchMenuData = useCallback(async () => {
    try {
      // Chờ cả hai lời gọi API hoàn thành
      const [catsResponse, brsResponse] = await Promise.all([
        fetchApi("/categories"), // Endpoint lấy danh mục
        fetchApi("/brands"), // Endpoint lấy thương hiệu
      ]);
      
      // Xử lý response format (cả mới và cũ)
      const cats = catsResponse?.data || catsResponse || [];
      const brs = brsResponse?.data || brsResponse || [];
      
      setCategories(cats);
      setBrands(brs);
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu menu:", error);
      // Không crash app nếu menu load lỗi
      setCategories([]);
      setBrands([]);
    } finally {
      setLoadingMenu(false);
    }
  }, []);

  useEffect(() => {
    fetchMenuData();
  }, [fetchMenuData]);

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
      localStorage.setItem('theme', 'dark');
    } else {
      document.documentElement.classList.remove('dark');
      localStorage.setItem('theme', 'light');
    }
  }, [isDark]);

  const toggleDark = () => setIsDark(prev => !prev);

  return (
    <header>

      {/* ===== MAIN HEADER ===== */}
      <div className="bg-gray-50 dark:bg-slate-900 border-b border-gray-200/80 dark:border-slate-800/80 py-4 text-gray-800 dark:text-white transition-all duration-300 shadow-sm sticky top-0 z-[1000]">
        <div className="w-[90%] max-w-[1400px] mx-auto flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-3">
            <button
              className="lg:hidden text-gray-800 dark:text-white text-2xl hover:text-primary transition-colors cursor-pointer"
              onClick={() => setMobileOpen(true)}
              aria-label="Mở menu"
            >
              <i className="fas fa-bars" />
            </button>
            <Link to="/" className="text-[28px] font-bold uppercase tracking-wider text-gray-900 dark:text-white transition-colors duration-300">
              TH<span className="text-primary dark:text-logo-yellow">SPORT</span>
            </Link>
          </div>
          {/* SearchAutocomplete với dropdown gợi ý */}
          <SearchAutocomplete />
          {/* ===== USER ACTIONS ===== */}
          <div className="flex items-center gap-6">
            {/* User Dropdown Container - Quản lý bằng Click/Click-outside thay vì Hover */}
            <div ref={userDropdownRef} className="relative">
              {currentUser ? (
                // --- NẾU ĐÃ ĐĂNG NHẬP ---
                <div 
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="action-item cursor-pointer text-center flex flex-col items-center select-none"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-red-50 dark:bg-slate-800 border border-red-100 dark:border-slate-700 text-primary dark:text-logo-yellow hover:shadow-md transition-all">
                    <i className="fa fa-user-check text-lg" />
                  </div>
                  <div className="text-[10px] font-semibold truncate max-w-[80px] mt-1 text-gray-600 dark:text-slate-300">
                    {currentUser.name}
                  </div>
                  
                  {/* Dropdown ĐÃ ĐĂNG NHẬP */}
                  <div 
                    className={`user-dropdown ${userDropdownOpen ? 'block' : 'hidden'} absolute top-full right-0 pt-2 z-[1001] text-left`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 min-w-[200px] shadow-2xl rounded-xl overflow-hidden">
                      <ul>
                        {/* Hiển thị link Admin nếu user có role admin */}
                        {currentUser.role === "admin" && (
                          <li>
                            <Link
                              to="/admin"
                              onClick={() => setUserDropdownOpen(false)}
                              className="block py-3 px-4 text-primary dark:text-logo-yellow text-sm border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors font-bold"
                            >
                              <i className="fas fa-user-shield mr-2"></i>
                              Quản lý Admin
                            </Link>
                          </li>
                        )}
                        <li>
                          <Link
                            to="/tai-khoan"
                            onClick={() => setUserDropdownOpen(false)}
                            className="block py-3 px-4 text-gray-700 dark:text-slate-200 text-sm border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            Tài khoản của tôi
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/gio-hang"
                            onClick={() => setUserDropdownOpen(false)}
                            className="block py-3 px-4 text-gray-700 dark:text-slate-200 text-sm border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            Giỏ hàng
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/thanh-toan"
                            onClick={() => setUserDropdownOpen(false)}
                            className="block py-3 px-4 text-gray-700 dark:text-slate-200 text-sm border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            Thanh toán
                          </Link>
                        </li>

                        <li>
                          <button
                            onClick={() => {
                              setUserDropdownOpen(false);
                              logout();
                            }}
                            className="w-full text-left py-3 px-4 text-red-600 dark:text-red-400 text-sm hover:bg-red-50 dark:hover:bg-red-950/20 transition-colors font-medium cursor-pointer"
                          >
                            <i className="fas fa-sign-out-alt mr-2" /> Đăng xuất
                          </button>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              ) : (
                // --- NẾU CHƯA ĐĂNG NHẬP ---
                <div 
                  onClick={() => setUserDropdownOpen(!userDropdownOpen)}
                  className="action-item cursor-pointer text-center flex flex-col items-center select-none"
                >
                  <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-gray-600 dark:text-slate-300 hover:shadow-md transition-all">
                    <i className="fa fa-user text-lg" />
                  </div>
                  <div className="text-[10px] font-semibold mt-1 text-gray-600 dark:text-slate-300">
                    Tài khoản
                  </div>
                  
                  {/* Dropdown CHƯA ĐĂNG NHẬP */}
                  <div 
                    className={`user-dropdown ${userDropdownOpen ? 'block' : 'hidden'} absolute top-full right-0 pt-2 z-[1001] text-left`}
                    onClick={(e) => e.stopPropagation()}
                  >
                    <div className="bg-white dark:bg-slate-800 border border-gray-100 dark:border-slate-700 min-w-[200px] shadow-2xl rounded-xl overflow-hidden">
                      <ul>
                        <li>
                          <Link
                            to="/dang-ky"
                            onClick={() => setUserDropdownOpen(false)}
                            className="block py-3 px-4 text-gray-700 dark:text-slate-200 text-sm border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            Đăng ký
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/dang-nhap"
                            onClick={() => setUserDropdownOpen(false)}
                            className="block py-3 px-4 text-gray-700 dark:text-slate-200 text-sm border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            Đăng nhập
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/gio-hang"
                            onClick={() => setUserDropdownOpen(false)}
                            className="block py-3 px-4 text-gray-700 dark:text-slate-200 text-sm border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            Giỏ hàng
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/thanh-toan"
                            onClick={() => setUserDropdownOpen(false)}
                            className="block py-3 px-4 text-gray-700 dark:text-slate-200 text-sm border-b border-gray-100 dark:border-slate-700 hover:bg-gray-50 dark:hover:bg-slate-700 transition-colors"
                          >
                            Thanh toán
                          </Link>
                        </li>

                      </ul>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* ===== DARK MODE TOGGLE SWITCH ===== */}
            <button
              onClick={toggleDark}
              aria-label="Toggle dark mode"
              title={isDark ? 'Chuyển sang Light Mode' : 'Chuyển sang Dark Mode'}
              className="flex flex-col items-center cursor-pointer transition-all hover:scale-105 active:scale-95"
            >
              <div
                className={`relative w-12 h-6 rounded-full transition-colors duration-300 ${
                  isDark ? 'bg-indigo-600' : 'bg-gray-300'
                }`}
              >
                <span className={`absolute top-0.5 flex items-center justify-center w-5 h-5 bg-white rounded-full shadow transition-all duration-300 text-[10px] ${
                  isDark ? 'left-[26px]' : 'left-0.5'
                }`}>
                  {isDark ? '🌙' : '☀️'}
                </span>
              </div>
              <div className="text-[10px] font-semibold mt-1 text-gray-500 dark:text-slate-400">
                {isDark ? 'Tối' : 'Sáng'}
              </div>
            </button>

            {/* Giỏ hàng */}
            <Link
              to="/gio-hang"
              className="action-item relative cursor-pointer text-center flex flex-col items-center text-gray-700 dark:text-gray-200 hover:text-primary dark:hover:text-primary transition-colors"
            >
              <div className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-50 dark:bg-slate-800 border border-gray-100 dark:border-slate-700 text-gray-700 dark:text-gray-200 hover:shadow-md transition-all">
                <i className="fa fa-shopping-cart text-lg" />
                <span className="cart-count absolute -top-1 -right-1.5 bg-primary text-white rounded-full w-5 h-5 text-xs flex justify-center items-center font-bold shadow border border-white dark:border-slate-800">
                  {cartCount}
                </span>
              </div>
              <div className="text-[10px] font-semibold mt-1 text-gray-600 dark:text-slate-300">
                Giỏ hàng
              </div>
            </Link>
          </div>
        </div>
      </div>

      {/* ===== NAVIGATION ===== */}
      {!isCartOrCheckout && (
        <nav className="main-nav bg-[#333] text-white hidden lg:block">
          <div className="w-[90%] max-w-[1400px] mx-auto flex justify-start items-center">
          <ul className="nav-links flex">
            {/* Menu Item: Trang chủ */}
            <li className="relative group">
              <Link
                to="/"
                className="py-4 px-5 block uppercase font-bold text-sm transition-colors hover:bg-[#555]"
              >
                Trang chủ
              </Link>
            </li>

            {/* Menu Item: Giày bóng đá (Dropdown nhiều cột) */}
            <li className="relative group">
              <a
                href="#"
                className="py-4 px-5 block uppercase font-bold text-sm transition-colors hover:bg-[#555]"
              >
                Giày bóng đá <i className="fa fa-caret-down" />
              </a>
              <div className="dropdown-single-column hidden group-hover:block absolute top-full left-0 bg-[#333] text-white p-2.5 w-[280px] z-[1000]">
                <div className="dropdown-column w-full">
                  <ul>
                    <li>
                      <Link
                        to="/danh-muc/tat-ca"
                        className="flex justify-between items-center py-2.5 px-3 font-bold text-[#f0f0f0] transition-colors hover:bg-[#555]"
                      >
                        TẤT CẢ SẢN PHẨM
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/danh-muc/tat-ca"
                        className="flex justify-between items-center py-2.5 px-3 font-bold text-[#f0f0f0] transition-colors hover:bg-[#555]"
                      >
                        HÀNG MỚI VỀ
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/danh-muc/giay-co-tu-nhien"
                        className="flex justify-between items-center py-2.5 px-3 font-bold text-[#f0f0f0] transition-colors hover:bg-[#555]"
                      >
                        GIÀY CỎ TỰ NHIÊN
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/danh-muc/giay-co-nhan-tao"
                        className="flex justify-between items-center py-2.5 px-3 font-bold text-[#f0f0f0] transition-colors hover:bg-[#555]"
                      >
                        GIÀY CỎ NHÂN TẠO
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/danh-muc/giay-futsal"
                        className="flex justify-between items-center py-2.5 px-3 font-bold text-[#f0f0f0] transition-colors hover:bg-[#555]"
                      >
                        GIÀY FUTSAL
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/danh-muc/giay-da-bong-gia-re"
                        className="flex justify-between items-center py-2.5 px-3 font-bold text-[#f0f0f0] transition-colors hover:bg-[#555]"
                      >
                        GIÀY ĐÁ BÓNG GIÁ RẺ
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/danh-muc/giay-da-bong-tre-em"
                        className="flex justify-between items-center py-2.5 px-3 font-bold text-[#f0f0f0] transition-colors hover:bg-[#555]"
                      >
                        GIÀY ĐÁ BÓNG TRẺ EM
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/danh-muc/phien-ban-gioi-han"
                        className="flex justify-between items-center py-2.5 px-3 font-bold text-[#f0f0f0] transition-colors hover:bg-[#555]"
                      >
                        PHIÊN BẢN GIỚI HẠN
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </li>
            {/*THUONG HIEU*/}
            <li className="relative group">
              <a
                href="#"
                className="py-4 px-5 block uppercase font-bold text-sm transition-colors hover:bg-[#555]"
              >
                Thương hiệu <i className="fa fa-caret-down" />
              </a>
              <div className="dropdown-single-column hidden group-hover:block absolute top-full left-0 bg-[#333] text-white p-2.5 w-[280px] z-[1000]">
                <div className="dropdown-column w-full">
                  <ul>
                    {/* Item: NIKE */}
                    <li className="relative group/submenu">
                      <Link
                        to="/danh-muc/giay-da-banh-nike"
                        className="flex justify-between items-center py-2.5 px-3 font-bold text-[#f0f0f0] transition-colors hover:bg-[#555] after:content-['>'] after:font-bold"
                      >
                        GIÀY ĐÁ BANH NIKE
                      </Link>
                      <ul className="submenu hidden group-hover/submenu:block absolute left-full top-0 bg-[#333] min-w-[220px] p-2.5 shadow-lg rounded -mt-2.5">
                        <li>
                          <Link
                            to="/danh-muc/nike-mercurial"
                            className="block py-2.5 px-3 font-normal normal-case hover:bg-[#555] after:content-['']"
                          >
                            Nike Mercurial
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/danh-muc/nike-phamtom"
                            className="block py-2.5 px-3 font-normal normal-case hover:bg-[#555] after:content-['']"
                          >
                            Nike Phantom
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/danh-muc/nike-tiempo"
                            className="block py-2.5 px-3 font-normal normal-case hover:bg-[#555] after:content-['']"
                          >
                            Nike Tiempo
                          </Link>
                        </li>
                      </ul>
                    </li>
                    {/* Item: ADIDAS */}
                    <li className="relative group/submenu">
                      <Link
                        to="/danh-muc/giay-da-banh-adidas"
                        className="flex justify-between items-center py-2.5 px-3 font-bold text-[#f0f0f0] transition-colors hover:bg-[#555] after:content-['>'] after:font-bold"
                      >
                        GIÀY ĐÁ BANH ADIDAS
                      </Link>
                      <ul className="submenu hidden group-hover/submenu:block absolute left-full top-0 bg-[#333] min-w-[220px] p-2.5 shadow-lg rounded -mt-2.5">
                        <li>
                          <Link
                            to="/danh-muc/adidas-f50"
                            className="block py-2.5 px-3 font-normal normal-case hover:bg-[#555] after:content-['']"
                          >
                            Adidas F50
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/danh-muc/adidas-x"
                            className="block py-2.5 px-3 font-normal normal-case hover:bg-[#555] after:content-['']"
                          >
                            Adidas X
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/danh-muc/adidas-predator"
                            className="block py-2.5 px-3 font-normal normal-case hover:bg-[#555] after:content-['']"
                          >
                            Adidas Predator
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/danh-muc/adidas-copa"
                            className="block py-2.5 px-3 font-normal normal-case hover:bg-[#555] after:content-['']"
                          >
                            Adidas Copa
                          </Link>
                        </li>
                      </ul>
                    </li>

                    {/* Item: PUMA */}
                    <li className="relative group/submenu">
                      <Link
                        to="/danh-muc/giay-da-banh-puma"
                        className="flex justify-between items-center py-2.5 px-3 font-bold text-[#f0f0f0] transition-colors hover:bg-[#555] after:content-['>'] after:font-bold"
                      >
                        GIÀY ĐÁ BANH PUMA
                      </Link>
                      <ul className="submenu hidden group-hover/submenu:block absolute left-full top-0 bg-[#333] min-w-[220px] p-2.5 shadow-lg rounded -mt-2.5">
                        <li>
                          <Link
                            to="/danh-muc/puma-future"
                            className="block py-2.5 px-3 font-normal normal-case hover:bg-[#555] after:content-['']"
                          >
                            Puma Future
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/danh-muc/puma-king"
                            className="block py-2.5 px-3 font-normal normal-case hover:bg-[#555] after:content-['']"
                          >
                            Puma King
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/danh-muc/puma-ultra"
                            className="block py-2.5 px-3 font-normal normal-case hover:bg-[#555] after:content-['']"
                          >
                            Puma Ultra
                          </Link>
                        </li>
                      </ul>
                    </li>

                    {/* Item: MIZUNO */}
                    <li className="relative group/submenu">
                      <Link
                        to="/danh-muc/giay-da-banh-mizuno"
                        className="flex justify-between items-center py-2.5 px-3 font-bold text-[#f0f0f0] transition-colors hover:bg-[#555] after:content-['>'] after:font-bold"
                      >
                        GIÀY ĐÁ BANH MIZUNO
                      </Link>
                      <ul className="submenu hidden group-hover/submenu:block absolute left-full top-0 bg-[#333] min-w-[220px] p-2.5 shadow-lg rounded -mt-2.5">
                        <li>
                          <Link
                            to="/danh-muc/mizuno-alpha"
                            className="block py-2.5 px-3 font-normal normal-case hover:bg-[#555] after:content-['']"
                          >
                            Mizuno Alpha
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/danh-muc/mizuno-monarcida"
                            className="block py-2.5 px-3 font-normal normal-case hover:bg-[#555] after:content-['']"
                          >
                            Mizuno Monarcida
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/danh-muc/mizuno-morelia"
                            className="block py-2.5 px-3 font-normal normal-case hover:bg-[#555] after:content-['']"
                          >
                            Mizuno Morelia
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/danh-muc/mizuno-rebula"
                            className="block py-2.5 px-3 font-normal normal-case hover:bg-[#555] after:content-['']"
                          >
                            Mizuno Rebula
                          </Link>
                        </li>
                      </ul>
                    </li>

                    {/* Item: ASICS */}
                    <li className="relative group/submenu">
                      <Link
                        to="/danh-muc/giay-da-banh-asic"
                        className="flex justify-between items-center py-2.5 px-3 font-bold text-[#f0f0f0] transition-colors hover:bg-[#555] after:content-['>'] after:font-bold"
                      >
                        GIÀY ĐÁ BANH ASICS
                      </Link>
                      <ul className="submenu hidden group-hover/submenu:block absolute left-full top-0 bg-[#333] min-w-[220px] p-2.5 shadow-lg rounded -mt-2.5">
                        <li>
                          <Link
                            to="/danh-muc/asics-calcetto"
                            className="block py-2.5 px-3 font-normal normal-case hover:bg-[#555] after:content-['']"
                          >
                            Asics Calcetto
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/danh-muc/asics-destaque"
                            className="block py-2.5 px-3 font-normal normal-case hover:bg-[#555] after:content-['']"
                          >
                            Asics Destaque
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/danh-muc/asics-toque"
                            className="block py-2.5 px-3 font-normal normal-case hover:bg-[#555] after:content-['']"
                          >
                            Asics Toque
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/danh-muc/asics-ultrezza"
                            className="block py-2.5 px-3 font-normal normal-case hover:bg-[#555] after:content-['']"
                          >
                            Asics Ultrezza
                          </Link>
                        </li>
                      </ul>
                    </li>

                    {/* Item: NMS */}
                    <li className="relative group/submenu">
                      <Link
                        to="/danh-muc/giay-da-banh-nms"
                        className="flex justify-between items-center py-2.5 px-3 font-bold text-[#f0f0f0] transition-colors hover:bg-[#555] after:content-['>'] after:font-bold"
                      >
                        GIÀY ĐÁ BANH NMS
                      </Link>
                      <ul className="submenu hidden group-hover/submenu:block absolute left-full top-0 bg-[#333] min-w-[220px] p-2.5 shadow-lg rounded -mt-2.5">
                        <li>
                          <Link
                            to="/danh-muc/nms-attack"
                            className="block py-2.5 px-3 font-normal normal-case hover:bg-[#555] after:content-['']"
                          >
                            NMS Attack
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/danh-muc/nms-capitan"
                            className="block py-2.5 px-3 font-normal normal-case hover:bg-[#555] after:content-['']"
                          >
                            NMS Capitan
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/danh-muc/nms-maestri"
                            className="block py-2.5 px-3 font-normal normal-case hover:bg-[#555] after:content-['']"
                          >
                            NMS Maestri
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/danh-muc/nms-spider"
                            className="block py-2.5 px-3 font-normal normal-case hover:bg-[#555] after:content-['']"
                          >
                            NMS Spider
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/danh-muc/nms-victory"
                            className="block py-2.5 px-3 font-normal normal-case hover:bg-[#555] after:content-['']"
                          >
                            NMS Victory
                          </Link>
                        </li>
                      </ul>
                    </li>

                    {/* Item: KAMITO */}
                    <li className="relative group/submenu">
                      <Link
                        to="/danh-muc/giay-da-banh-kamito"
                        className="flex justify-between items-center py-2.5 px-3 font-bold text-[#f0f0f0] transition-colors hover:bg-[#555] after:content-['>'] after:font-bold"
                      >
                        GIÀY ĐÁ BANH KAMITO
                      </Link>
                      <ul className="submenu hidden group-hover/submenu:block absolute left-full top-0 bg-[#333] min-w-[220px] p-2.5 shadow-lg rounded -mt-2.5">
                        <li>
                          <Link
                            to="/danh-muc/ta11"
                            className="block py-2.5 px-3 font-normal normal-case hover:bg-[#555] after:content-['']"
                          >
                            TA11
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/danh-muc/qh19"
                            className="block py-2.5 px-3 font-normal normal-case hover:bg-[#555] after:content-['']"
                          >
                            QH19
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/danh-muc/velocidad"
                            className="block py-2.5 px-3 font-normal normal-case hover:bg-[#555] after:content-['']"
                          >
                            Velocidad
                          </Link>
                        </li>
                      </ul>
                    </li>

                    {/* Item: ZOCKER */}
                    <li className="relative group/submenu">
                      <Link
                        to="/danh-muc/diay-da-banh-zocker"
                        className="flex justify-between items-center py-2.5 px-3 font-bold text-[#f0f0f0] transition-colors hover:bg-[#555] after:content-['>'] after:font-bold"
                      >
                        GIÀY ĐÁ BANH ZOCKER
                      </Link>
                      <ul className="submenu hidden group-hover/submenu:block absolute left-full top-0 bg-[#333] min-w-[220px] p-2.5 shadow-lg rounded -mt-2.5">
                        <li>
                          <Link
                            to="/danh-muc/zoker-inspire"
                            className="block py-2.5 px-3 font-normal normal-case hover:bg-[#555] after:content-['']"
                          >
                            ZOCKER Inspire
                          </Link>
                        </li>
                        <li>
                          <Link
                            to="/danh-muc/zocker-space"
                            className="block py-2.5 px-3 font-normal normal-case hover:bg-[#555] after:content-['']"
                          >
                            ZOCKER Space
                          </Link>
                        </li>
                      </ul>
                    </li>

                    {/* Item: JOMA */}
                    <li>
                      <Link
                        to="/danh-muc/giay-da-banh-joma"
                        className="flex justify-between items-center py-2.5 px-3 font-bold text-[#f0f0f0] transition-colors hover:bg-[#555]"
                      >
                        GIÀY ĐÁ BANH JOMA
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </li>
            {/* ===== KẾT THÚC PHẦN "THƯƠNG HIỆU" ===== */}
            {/* Menu Item: Phụ kiện */}
            <li className="relative group">
              <Link
                to="/danh-muc/phu-kien"
                className="py-4 px-5 block uppercase font-bold text-sm transition-colors hover:bg-[#555]"
              >
                Phụ kiện <i className="fa fa-caret-down" />
              </Link>
              <div className="dropdown-single-column hidden group-hover:block absolute top-full left-0 bg-[#333] text-white p-2.5 w-[280px] z-[1000]">
                <div className="dropdown-column w-full">
                  <ul>
                    <li>
                      <Link
                        to="/danh-muc/qua-bong-da"
                        className="flex justify-between items-center py-2.5 px-3 font-bold text-[#f0f0f0] transition-colors hover:bg-[#555]"
                      >
                        QUẢ BÓNG ĐÁ
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/danh-muc/boc-ong-dong"
                        className="flex justify-between items-center py-2.5 px-3 font-bold text-[#f0f0f0] transition-colors hover:bg-[#555]"
                      >
                        BỌC ỐNG ĐỒNG
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/danh-muc/gang-tay-thu-mon"
                        className="flex justify-between items-center py-2.5 px-3 font-bold text-[#f0f0f0] transition-colors hover:bg-[#555]"
                      >
                        GĂNG TAY THỦ MÔN
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/danh-muc/vo-bong-da"
                        className="flex justify-between items-center py-2.5 px-3 font-bold text-[#f0f0f0] transition-colors hover:bg-[#555]"
                      >
                        VỚ BÓNG ĐÁ
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/danh-muc/ao-bong-da-chinh-hang"
                        className="flex justify-between items-center py-2.5 px-3 font-bold text-[#f0f0f0] transition-colors hover:bg-[#555]"
                      >
                        ÁO BÓNG ĐÁ CHÍNH HÃNG
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/danh-muc/phu-kien-ra-san"
                        className="flex justify-between items-center py-2.5 px-3 font-bold text-[#f0f0f0] transition-colors hover:bg-[#555]"
                      >
                        PHỤ KIỆN RA SÂN
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/danh-muc/balo-tui-xach"
                        className="flex justify-between items-center py-2.5 px-3 font-bold text-[#f0f0f0] transition-colors hover:bg-[#555]"
                      >
                        BALO TÚI XÁCH
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/danh-muc/bo-quan-ao-bong-da"
                        className="flex justify-between items-center py-2.5 px-3 font-bold text-[#f0f0f0] transition-colors hover:bg-[#555]"
                      >
                        BỘ QUẦN ÁO BÓNG ĐÁ
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/danh-muc/dep-chinh-hang"
                        className="flex justify-between items-center py-2.5 px-3 font-bold text-[#f0f0f0] transition-colors hover:bg-[#555]"
                      >
                        DÉP CHÍNH HÃNG
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </li>

            {/* Menu Item: Dịch vụ */}
            <li className="relative group">
              <a className="py-4 px-5 block uppercase font-bold text-sm transition-colors hover:bg-[#555]">
                Dịch vụ <i className="fa fa-caret-down" />
              </a>
              {/* Tăng width cho vừa chữ */}
              <div className="dropdown-single-column hidden group-hover:block absolute top-full left-0 bg-[#333] text-white p-2.5 w-[350px] z-[1000]">
                <div className="dropdown-column w-full">
                  <ul>
                    <li>
                      <Link
                        to="/dich-vu/sua-chua-giay"
                        className="flex justify-between items-center py-2.5 px-3 font-bold text-[#f0f0f0] transition-colors hover:bg-[#555]"
                      >
                        SỬA CHỮA GIÀY BÓNG ĐÁ CHÍNH HÃNG
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </li>

            {/* Menu Item: Hướng dẫn */}
            <li className="relative group">
              <a
                href="#"
                className="py-4 px-5 block uppercase font-bold text-sm transition-colors hover:bg-[#555]"
              >
                Hướng dẫn <i className="fa fa-caret-down" />
              </a>
              {/* Tăng width cho vừa chữ */}
              <div className="dropdown-single-column hidden group-hover:block absolute top-full left-0 bg-[#333] text-white p-2.5 w-[350px] z-[1000]">
                <div className="dropdown-column w-full">
                  <ul>
                    <li>
                      <Link
                        to="/huong-dan/chon-size-giay"
                        className="flex justify-between items-center py-2.5 px-3 font-bold text-[#f0f0f0] transition-colors hover:bg-[#555]"
                      >
                        CÁCH CHỌN SIZE
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/huong-dan/chinh-sach-van-chuyen"
                        className="flex justify-between items-center py-2.5 px-3 font-bold text-[#f0f0f0] transition-colors hover:bg-[#555]"
                      >
                        CHÍNH SÁCH VẬN CHUYỂN VÀ GIAO NHẬN
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/huong-dan/chinh-sach-kiem-hang"
                        className="flex justify-between items-center py-2.5 px-3 font-bold text-[#f0f0f0] transition-colors hover:bg-[#555]"
                      >
                        CHÍNH SÁCH KIỂM HÀNG
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/huong-dan/chinh-sach-bao-hanh"
                        className="flex justify-between items-center py-2.5 px-3 font-bold text-[#f0f0f0] transition-colors hover:bg-[#555]"
                      >
                        CHÍNH SÁCH BẢO HÀNH
                      </Link>
                    </li>
                    <li>
                      <Link
                        to="/huong-dan/quy-dinh-doi-hang"
                        className="flex justify-between items-center py-2.5 px-3 font-bold text-[#f0f0f0] transition-colors hover:bg-[#555]"
                      >
                        QUY ĐỊNH ĐỔI HÀNG
                      </Link>
                    </li>
                  </ul>
                </div>
              </div>
            </li>
          </ul>
        </div>
      </nav>
      )}
      {/* Mobile Overlay */}
      {mobileOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-40 lg:hidden"
          onClick={() => setMobileOpen(false)}
        />
      )}

      {/* Mobile Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-72 bg-[#141414] text-white z-50 lg:hidden transform transition-transform duration-300 ${
          mobileOpen ? 'translate-x-0' : '-translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-700">
          <span className="text-lg font-bold uppercase">
            TH<span className="text-logo-yellow">SPORT</span>
          </span>
          <button
            className="text-white text-xl"
            onClick={() => setMobileOpen(false)}
            aria-label="Đóng menu"
          >
            <i className="fas fa-times" />
          </button>
        </div>

        <nav className="overflow-y-auto h-[calc(100%-60px)]">
          <ul>
            <li>
              <Link
                to="/"
                className="block py-3 px-5 border-b border-gray-700 text-sm font-bold uppercase hover:bg-gray-700 transition-colors"
                onClick={() => setMobileOpen(false)}
              >
                Trang chủ
              </Link>
            </li>

            <li>
              <button
                className="w-full text-left py-3 px-5 border-b border-gray-700 text-sm font-bold uppercase hover:bg-gray-700 transition-colors flex items-center justify-between"
                onClick={() => setMobileSubOpen(mobileSubOpen === 'giay' ? null : 'giay')}
              >
                Giày bóng đá
                <i className={`fas fa-chevron-down text-xs transition-transform duration-200 ${mobileSubOpen === 'giay' ? 'rotate-180' : ''}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${mobileSubOpen === 'giay' ? 'max-h-96' : 'max-h-0'}`}>
                <ul className="bg-black/20">
                  <li>
                    <Link to="/danh-muc/tat-ca" className="block py-2 pl-8 pr-5 text-sm text-gray-300 hover:bg-gray-700" onClick={() => setMobileOpen(false)}>Tất cả sản phẩm</Link>
                  </li>
                  <li>
                    <Link to="/danh-muc/tat-ca" className="block py-2 pl-8 pr-5 text-sm text-gray-300 hover:bg-gray-700" onClick={() => setMobileOpen(false)}>Hàng mới về</Link>
                  </li>
                  <li>
                    <Link to="/danh-muc/giay-co-tu-nhien" className="block py-2 pl-8 pr-5 text-sm text-gray-300 hover:bg-gray-700" onClick={() => setMobileOpen(false)}>Giày cỏ tự nhiên</Link>
                  </li>
                  <li>
                    <Link to="/danh-muc/giay-co-nhan-tao" className="block py-2 pl-8 pr-5 text-sm text-gray-300 hover:bg-gray-700" onClick={() => setMobileOpen(false)}>Giày cỏ nhân tạo</Link>
                  </li>
                  <li>
                    <Link to="/danh-muc/giay-futsal" className="block py-2 pl-8 pr-5 text-sm text-gray-300 hover:bg-gray-700" onClick={() => setMobileOpen(false)}>Giày Futsal</Link>
                  </li>
                  <li>
                    <Link to="/danh-muc/giay-da-bong-gia-re" className="block py-2 pl-8 pr-5 text-sm text-gray-300 hover:bg-gray-700" onClick={() => setMobileOpen(false)}>Giày đá bóng giá rẻ</Link>
                  </li>
                  <li>
                    <Link to="/danh-muc/giay-da-bong-tre-em" className="block py-2 pl-8 pr-5 text-sm text-gray-300 hover:bg-gray-700" onClick={() => setMobileOpen(false)}>Giày đá bóng trẻ em</Link>
                  </li>
                  <li>
                    <Link to="/danh-muc/phien-ban-gioi-han" className="block py-2 pl-8 pr-5 text-sm text-gray-300 hover:bg-gray-700" onClick={() => setMobileOpen(false)}>Phiên bản giới hạn</Link>
                  </li>
                </ul>
              </div>
            </li>

            <li>
              <button
                className="w-full text-left py-3 px-5 border-b border-gray-700 text-sm font-bold uppercase hover:bg-gray-700 transition-colors flex items-center justify-between"
                onClick={() => setMobileSubOpen(mobileSubOpen === 'thuonghieu' ? null : 'thuonghieu')}
              >
                Thương hiệu
                <i className={`fas fa-chevron-down text-xs transition-transform duration-200 ${mobileSubOpen === 'thuonghieu' ? 'rotate-180' : ''}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${mobileSubOpen === 'thuonghieu' ? 'max-h-96' : 'max-h-0'}`}>
                <ul className="bg-black/20">
                  <li>
                    <Link to="/danh-muc/giay-da-banh-nike" className="block py-2 pl-8 pr-5 text-sm text-gray-300 hover:bg-gray-700" onClick={() => setMobileOpen(false)}>Nike</Link>
                  </li>
                  <li>
                    <Link to="/danh-muc/giay-da-banh-adidas" className="block py-2 pl-8 pr-5 text-sm text-gray-300 hover:bg-gray-700" onClick={() => setMobileOpen(false)}>Adidas</Link>
                  </li>
                  <li>
                    <Link to="/danh-muc/giay-da-banh-puma" className="block py-2 pl-8 pr-5 text-sm text-gray-300 hover:bg-gray-700" onClick={() => setMobileOpen(false)}>Puma</Link>
                  </li>
                  <li>
                    <Link to="/danh-muc/giay-da-banh-mizuno" className="block py-2 pl-8 pr-5 text-sm text-gray-300 hover:bg-gray-700" onClick={() => setMobileOpen(false)}>Mizuno</Link>
                  </li>
                  <li>
                    <Link to="/danh-muc/giay-da-banh-asic" className="block py-2 pl-8 pr-5 text-sm text-gray-300 hover:bg-gray-700" onClick={() => setMobileOpen(false)}>Asics</Link>
                  </li>
                  <li>
                    <Link to="/danh-muc/giay-da-banh-nms" className="block py-2 pl-8 pr-5 text-sm text-gray-300 hover:bg-gray-700" onClick={() => setMobileOpen(false)}>NMS</Link>
                  </li>
                  <li>
                    <Link to="/danh-muc/giay-da-banh-kamito" className="block py-2 pl-8 pr-5 text-sm text-gray-300 hover:bg-gray-700" onClick={() => setMobileOpen(false)}>Kamito</Link>
                  </li>
                  <li>
                    <Link to="/danh-muc/diay-da-banh-zocker" className="block py-2 pl-8 pr-5 text-sm text-gray-300 hover:bg-gray-700" onClick={() => setMobileOpen(false)}>Zocker</Link>
                  </li>
                  <li>
                    <Link to="/danh-muc/giay-da-banh-joma" className="block py-2 pl-8 pr-5 text-sm text-gray-300 hover:bg-gray-700" onClick={() => setMobileOpen(false)}>Joma</Link>
                  </li>
                </ul>
              </div>
            </li>

            <li>
              <button
                className="w-full text-left py-3 px-5 border-b border-gray-700 text-sm font-bold uppercase hover:bg-gray-700 transition-colors flex items-center justify-between"
                onClick={() => setMobileSubOpen(mobileSubOpen === 'phukien' ? null : 'phukien')}
              >
                Phụ kiện
                <i className={`fas fa-chevron-down text-xs transition-transform duration-200 ${mobileSubOpen === 'phukien' ? 'rotate-180' : ''}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${mobileSubOpen === 'phukien' ? 'max-h-96' : 'max-h-0'}`}>
                <ul className="bg-black/20">
                  <li><Link to="/danh-muc/qua-bong-da" className="block py-2 pl-8 pr-5 text-sm text-gray-300 hover:bg-gray-700" onClick={() => setMobileOpen(false)}>Quả bóng đá</Link></li>
                  <li><Link to="/danh-muc/boc-ong-dong" className="block py-2 pl-8 pr-5 text-sm text-gray-300 hover:bg-gray-700" onClick={() => setMobileOpen(false)}>Bọc ống đồng</Link></li>
                  <li><Link to="/danh-muc/gang-tay-thu-mon" className="block py-2 pl-8 pr-5 text-sm text-gray-300 hover:bg-gray-700" onClick={() => setMobileOpen(false)}>Găng tay thủ môn</Link></li>
                  <li><Link to="/danh-muc/vo-bong-da" className="block py-2 pl-8 pr-5 text-sm text-gray-300 hover:bg-gray-700" onClick={() => setMobileOpen(false)}>Vớ bóng đá</Link></li>
                  <li><Link to="/danh-muc/ao-bong-da-chinh-hang" className="block py-2 pl-8 pr-5 text-sm text-gray-300 hover:bg-gray-700" onClick={() => setMobileOpen(false)}>Áo bóng đá</Link></li>
                  <li><Link to="/danh-muc/phu-kien-ra-san" className="block py-2 pl-8 pr-5 text-sm text-gray-300 hover:bg-gray-700" onClick={() => setMobileOpen(false)}>Phụ kiện ra sân</Link></li>
                  <li><Link to="/danh-muc/balo-tui-xach" className="block py-2 pl-8 pr-5 text-sm text-gray-300 hover:bg-gray-700" onClick={() => setMobileOpen(false)}>Balo túi xách</Link></li>
                  <li><Link to="/danh-muc/bo-quan-ao-bong-da" className="block py-2 pl-8 pr-5 text-sm text-gray-300 hover:bg-gray-700" onClick={() => setMobileOpen(false)}>Bộ quần áo bóng đá</Link></li>
                  <li><Link to="/danh-muc/dep-chinh-hang" className="block py-2 pl-8 pr-5 text-sm text-gray-300 hover:bg-gray-700" onClick={() => setMobileOpen(false)}>Dép chính hãng</Link></li>
                </ul>
              </div>
            </li>

            <li>
              <button
                className="w-full text-left py-3 px-5 border-b border-gray-700 text-sm font-bold uppercase hover:bg-gray-700 transition-colors flex items-center justify-between"
                onClick={() => setMobileSubOpen(mobileSubOpen === 'dichvu' ? null : 'dichvu')}
              >
                Dịch vụ
                <i className={`fas fa-chevron-down text-xs transition-transform duration-200 ${mobileSubOpen === 'dichvu' ? 'rotate-180' : ''}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${mobileSubOpen === 'dichvu' ? 'max-h-96' : 'max-h-0'}`}>
                <ul className="bg-black/20">
                  <li><Link to="/dich-vu/sua-chua-giay" className="block py-2 pl-8 pr-5 text-sm text-gray-300 hover:bg-gray-700" onClick={() => setMobileOpen(false)}>Sửa chữa giày bóng đá</Link></li>
                </ul>
              </div>
            </li>

            <li>
              <button
                className="w-full text-left py-3 px-5 border-b border-gray-700 text-sm font-bold uppercase hover:bg-gray-700 transition-colors flex items-center justify-between"
                onClick={() => setMobileSubOpen(mobileSubOpen === 'huongdan' ? null : 'huongdan')}
              >
                Hướng dẫn
                <i className={`fas fa-chevron-down text-xs transition-transform duration-200 ${mobileSubOpen === 'huongdan' ? 'rotate-180' : ''}`} />
              </button>
              <div className={`overflow-hidden transition-all duration-300 ${mobileSubOpen === 'huongdan' ? 'max-h-96' : 'max-h-0'}`}>
                <ul className="bg-black/20">
                  <li><Link to="/huong-dan/chon-size-giay" className="block py-2 pl-8 pr-5 text-sm text-gray-300 hover:bg-gray-700" onClick={() => setMobileOpen(false)}>Cách chọn size</Link></li>
                  <li><Link to="/huong-dan/chinh-sach-van-chuyen" className="block py-2 pl-8 pr-5 text-sm text-gray-300 hover:bg-gray-700" onClick={() => setMobileOpen(false)}>Chính sách vận chuyển</Link></li>
                  <li><Link to="/huong-dan/chinh-sach-kiem-hang" className="block py-2 pl-8 pr-5 text-sm text-gray-300 hover:bg-gray-700" onClick={() => setMobileOpen(false)}>Chính sách kiểm hàng</Link></li>
                  <li><Link to="/huong-dan/chinh-sach-bao-hanh" className="block py-2 pl-8 pr-5 text-sm text-gray-300 hover:bg-gray-700" onClick={() => setMobileOpen(false)}>Chính sách bảo hành</Link></li>
                  <li><Link to="/huong-dan/quy-dinh-doi-hang" className="block py-2 pl-8 pr-5 text-sm text-gray-300 hover:bg-gray-700" onClick={() => setMobileOpen(false)}>Quy định đổi hàng</Link></li>
                </ul>
              </div>
            </li>
          </ul>
        </nav>
      </div>
    </header>
  );
}
