// Frontend/src/pages/admin/AdminDashboardPage.jsx
import React, { useState, useEffect, useCallback } from "react";
import { fetchApi } from "../../utils/api";
import { toast } from "react-toastify";
import { Link } from "react-router-dom";

// Component con hiển thị 1 thẻ thống kê (đã được khôi phục nội dung đầy đủ và đẹp mắt)
const StatCard = ({ title, value, icon, color }) => (
  <div
    className={`bg-white dark:bg-slate-800 p-6 rounded-xl shadow-md border-l-4 ${color} flex items-center justify-between transition-all duration-300 hover:shadow-lg`}
  >
    <div>
      <p className="text-xs font-semibold text-gray-400 dark:text-slate-400 uppercase tracking-wider mb-1">
        {title}
      </p>
      <p className="text-2xl font-bold text-gray-800 dark:text-white">
        {value}
      </p>
    </div>
    <div className="w-12 h-12 rounded-full bg-gray-50 dark:bg-slate-700 flex items-center justify-center text-xl text-gray-500 dark:text-slate-300 shadow-inner">
      <i className={icon}></i>
    </div>
  </div>
);

// Biểu đồ đường tùy chỉnh (Sử dụng SVG để đảm bảo tương thích 100% React 19 và responsive cực mượt)
const LineChart = ({ title, data, color, yAxisFormatter }) => {
  const width = 500;
  const height = 220;
  const paddingLeft = 70;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 40;
  
  const drawWidth = width - paddingLeft - paddingRight;
  const drawHeight = height - paddingTop - paddingBottom;
  
  const values = data.map(d => d.value);
  const maxValue = values.length > 0 ? Math.max(...values, 10) : 10;
  
  const points = data.map((d, index) => {
    const x = paddingLeft + (data.length > 1 ? (index / (data.length - 1)) * drawWidth : drawWidth / 2);
    const y = paddingTop + drawHeight - (d.value / maxValue) * drawHeight;
    return { x, y, label: d.label, value: d.value };
  });
  
  let linePath = "";
  let areaPath = "";
  if (points.length > 0) {
    linePath = `M ${points[0].x} ${points[0].y} ` + points.slice(1).map(p => `L ${p.x} ${p.y}`).join(" ");
    areaPath = linePath + ` L ${points[points.length - 1].x} ${paddingTop + drawHeight} L ${points[0].x} ${paddingTop + drawHeight} Z`;
  }
  
  const gridCount = 4;
  const gridLines = Array.from({ length: gridCount + 1 }).map((_, i) => {
    const val = (maxValue / gridCount) * i;
    const y = paddingTop + drawHeight - (val / maxValue) * drawHeight;
    return { y, value: val };
  });

  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col h-full">
      <h3 className="text-sm font-bold text-gray-700 dark:text-slate-200 mb-4">{title}</h3>
      {data.length === 0 ? (
        <div className="flex-grow flex items-center justify-center text-gray-400 text-sm h-48">
          Không có dữ liệu
        </div>
      ) : (
        <div className="relative flex-grow">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
            <defs>
              <linearGradient id={`gradient-${color}`} x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor={color} stopOpacity="0.2" />
                <stop offset="100%" stopColor={color} stopOpacity="0.0" />
              </linearGradient>
            </defs>
            
            {/* Gridlines */}
            {gridLines.map((line, i) => (
              <g key={i} className="opacity-40 dark:opacity-20">
                <line 
                  x1={paddingLeft} 
                  y1={line.y} 
                  x2={width - paddingRight} 
                  y2={line.y} 
                  stroke="#cbd5e1" 
                  strokeWidth="1" 
                  strokeDasharray="4 4"
                />
                <text 
                  x={paddingLeft - 8} 
                  y={line.y + 4} 
                  textAnchor="end" 
                  className="fill-gray-400 dark:fill-slate-500 text-[9px] font-medium font-sans"
                >
                  {yAxisFormatter ? yAxisFormatter(line.value) : Math.round(line.value)}
                </text>
              </g>
            ))}
            
            {/* Filled Area */}
            {areaPath && (
              <path d={areaPath} fill={`url(#gradient-${color})`} />
            )}
            
            {/* Line Path */}
            {linePath && (
              <path 
                d={linePath} 
                fill="none" 
                stroke={color} 
                strokeWidth="2" 
                strokeLinecap="round" 
                strokeLinejoin="round" 
              />
            )}
            
            {/* Data Points */}
            {points.map((p, i) => (
              <g key={i} className="group/point">
                <title>{p.label}: {yAxisFormatter ? yAxisFormatter(p.value) : p.value}</title>
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r="3.5" 
                  fill={color} 
                  stroke="#ffffff" 
                  strokeWidth="1.5"
                  className="transition-all duration-200 hover:r-5 cursor-pointer shadow-sm" 
                />
                <circle 
                  cx={p.x} 
                  cy={p.y} 
                  r="10" 
                  fill={color} 
                  opacity="0"
                  className="hover:opacity-10 transition-all duration-200 cursor-pointer" 
                />
                <text
                  x={p.x}
                  y={p.y - 12}
                  textAnchor="middle"
                  className="fill-gray-800 dark:fill-white text-[9px] font-bold opacity-0 group-hover/point:opacity-100 transition-opacity duration-150 pointer-events-none"
                >
                  {yAxisFormatter ? yAxisFormatter(p.value) : p.value}
                </text>
              </g>
            ))}
            
            {/* X Axis Labels */}
            {points.map((p, i) => {
              const step = Math.ceil(points.length / 6);
              if (i % step !== 0 && i !== points.length - 1) return null;
              return (
                <text 
                  key={i}
                  x={p.x} 
                  y={height - 12} 
                  textAnchor="middle" 
                  className="fill-gray-400 dark:fill-slate-500 text-[9px] font-medium font-sans"
                >
                  {p.label.length > 15 ? `${p.label.slice(0, 15)}...` : p.label}
                </text>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
};

// Biểu đồ cột tùy chỉnh (Sử dụng SVG cho Brand Sales)
const BarChart = ({ title, data, color, yAxisFormatter }) => {
  const width = 500;
  const height = 220;
  const paddingLeft = 70;
  const paddingRight = 20;
  const paddingTop = 25;
  const paddingBottom = 40;
  
  const drawWidth = width - paddingLeft - paddingRight;
  const drawHeight = height - paddingTop - paddingBottom;
  
  const values = data.map(d => d.value);
  const maxValue = values.length > 0 ? Math.max(...values, 5) : 5;
  
  const barWidth = data.length > 0 ? (drawWidth / data.length) * 0.6 : 25;
  const gap = data.length > 0 ? (drawWidth / data.length) * 0.4 : 15;
  
  const gridCount = 4;
  const gridLines = Array.from({ length: gridCount + 1 }).map((_, i) => {
    const val = (maxValue / gridCount) * i;
    const y = paddingTop + drawHeight - (val / maxValue) * drawHeight;
    return { y, value: val };
  });

  return (
    <div className="bg-white dark:bg-slate-800 p-5 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm flex flex-col h-full">
      <h3 className="text-sm font-bold text-gray-700 dark:text-slate-200 mb-4">{title}</h3>
      {data.length === 0 ? (
        <div className="flex-grow flex items-center justify-center text-gray-400 text-sm h-48">
          Không có dữ liệu
        </div>
      ) : (
        <div className="relative flex-grow">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto overflow-visible">
            {/* Gridlines */}
            {gridLines.map((line, i) => (
              <g key={i} className="opacity-40 dark:opacity-20">
                <line 
                  x1={paddingLeft} 
                  y1={line.y} 
                  x2={width - paddingRight} 
                  y2={line.y} 
                  stroke="#cbd5e1" 
                  strokeWidth="1" 
                  strokeDasharray="4 4"
                />
                <text 
                  x={paddingLeft - 8} 
                  y={line.y + 4} 
                  textAnchor="end" 
                  className="fill-gray-400 dark:fill-slate-500 text-[9px] font-medium font-sans"
                >
                  {yAxisFormatter ? yAxisFormatter(line.value) : Math.round(line.value)}
                </text>
              </g>
            ))}
            
            {/* Bars */}
            {data.map((d, i) => {
              const x = paddingLeft + i * (barWidth + gap) + gap / 2;
              const barHeight = (d.value / maxValue) * drawHeight;
              const y = paddingTop + drawHeight - barHeight;
              
              return (
                <g key={i} className="group/bar">
                  <title>{d.label}: {yAxisFormatter ? yAxisFormatter(d.value) : d.value}</title>
                  <rect 
                    x={x} 
                    y={y} 
                    width={barWidth} 
                    height={barHeight} 
                    fill={color} 
                    rx="3" 
                    className="transition-all duration-300 hover:opacity-85 cursor-pointer"
                  />
                  <text
                    x={x + barWidth / 2}
                    y={y - 8}
                    textAnchor="middle"
                    className="fill-gray-800 dark:fill-white text-[9px] font-bold opacity-0 group-hover/bar:opacity-100 transition-opacity duration-150 pointer-events-none"
                  >
                    {yAxisFormatter ? yAxisFormatter(d.value) : d.value}
                  </text>
                  <text 
                    x={x + barWidth / 2} 
                    y={height - 12} 
                    textAnchor="middle" 
                    className="fill-gray-400 dark:fill-slate-500 text-[9px] font-medium font-sans"
                  >
                    {d.label.length > 15 ? `${d.label.slice(0, 15)}...` : d.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>
      )}
    </div>
  );
};

export default function AdminDashboardPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // States bộ lọc (Filter)
  const [filterType, setFilterType] = useState("year"); // "day", "month", "quarter", "year"
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear().toString());
  const [selectedMonth, setSelectedMonth] = useState(`${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, '0')}`);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [selectedQuarter, setSelectedQuarter] = useState("Q2"); // Q1, Q2, Q3, Q4

  const fetchStats = useCallback(async () => {
    setLoading(true);
    try {
      // Build query dựa vào loại filter đang chọn
      let queryParams = "";
      if (filterType === "day") {
        queryParams = `?date=${selectedDate}`;
      } else if (filterType === "month") {
        queryParams = `?month=${selectedMonth}`;
      } else if (filterType === "quarter") {
        queryParams = `?quarter=${selectedYear}-${selectedQuarter}`;
      } else if (filterType === "year") {
        queryParams = `?year=${selectedYear}`;
      }

      const response = await fetchApi(`/admin/stats${queryParams}`);
      const statsData = response.data || response;
      
      setStats({
        ...statsData,
        recentOrders: statsData.recentOrders || [],
        revenueTimeline: statsData.revenueTimeline || [],
        bestSellers: statsData.bestSellers || [],
        mostStockedProducts: statsData.mostStockedProducts || [],
        brandSales: statsData.brandSales || []
      });
    } catch (error) {
      console.error("Lỗi khi tải thống kê:", error);
      if (error.status === 403) {
        toast.error("Bạn không có quyền truy cập Dashboard Admin.");
      } else {
        toast.error("Không thể tải dữ liệu Dashboard.");
      }
      setStats(null);
    } finally {
      setLoading(false);
    }
  }, [filterType, selectedYear, selectedMonth, selectedDate, selectedQuarter]);

  useEffect(() => {
    fetchStats();
  }, [fetchStats]);

  // Format hiển thị tiền tệ
  const formatCurrency = (amount) => {
    if (amount === undefined || amount === null || isNaN(amount)) {
      return "0 ₫";
    }
    return Number(amount).toLocaleString("vi-VN") + " ₫";
  };

  // Format hiển thị tiền rút gọn cho Y-axis của biểu đồ
  const formatShortCurrency = (amount) => {
    if (amount >= 1000000) {
      return (amount / 1000000).toFixed(1) + "M ₫";
    }
    if (amount >= 1000) {
      return (amount / 1000).toFixed(0) + "K ₫";
    }
    return amount + " ₫";
  };

  if (loading && !stats) {
    return (
      <div className="text-center py-20 text-xl text-gray-500 dark:text-slate-400">
        Đang tải Dashboard...
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="text-center py-20 text-xl text-red-500">
        Không thể tải Dashboard. Hãy kiểm tra quyền Admin.
      </div>
    );
  }

  const currentYearInt = new Date().getFullYear();
  const yearOptions = Array.from({ length: 5 }).map((_, i) => (currentYearInt - 2 + i).toString());

  return (
    <div className="pb-10">
      {/* KHU VỰC BỘ LỌC THỜI GIAN (Premium Filter Bar) */}
      <div className="bg-white dark:bg-slate-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-slate-700 flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-2">
          <i className="fas fa-filter text-primary"></i>
          <span className="font-bold text-gray-700 dark:text-slate-200">Bộ lọc thống kê:</span>
        </div>
        
        <div className="flex flex-wrap items-center gap-3">
          {/* Lựa chọn loại Filter */}
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-gray-50 dark:bg-slate-700 text-gray-800 dark:text-slate-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent"
          >
            <option value="year">Theo Năm</option>
            <option value="quarter">Theo Quý</option>
            <option value="month">Theo Tháng</option>
            <option value="day">Theo Ngày</option>
          </select>

          {/* Ô nhập thông tin tương ứng với loại filter */}
          {filterType === "day" && (
            <input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}

          {filterType === "month" && (
            <input
              type="month"
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(e.target.value)}
              className="border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-1.5 text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 focus:outline-none focus:ring-2 focus:ring-primary"
            />
          )}

          {filterType === "quarter" && (
            <div className="flex items-center gap-2">
              <select
                value={selectedQuarter}
                onChange={(e) => setSelectedQuarter(e.target.value)}
                className="border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
              >
                <option value="Q1">Quý I (Tháng 1-3)</option>
                <option value="Q2">Quý II (Tháng 4-6)</option>
                <option value="Q3">Quý III (Tháng 7-9)</option>
                <option value="Q4">Quý IV (Tháng 10-12)</option>
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(e.target.value)}
                className="border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
              >
                {yearOptions.map(y => (
                  <option key={y} value={y}>Năm {y}</option>
                ))}
              </select>
            </div>
          )}

          {filterType === "year" && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="border border-gray-200 dark:border-slate-600 rounded-lg px-3 py-2 text-sm bg-white dark:bg-slate-700 text-gray-800 dark:text-slate-100 cursor-pointer focus:outline-none focus:ring-2 focus:ring-primary"
            >
              {yearOptions.map(y => (
                <option key={y} value={y}>Năm {y}</option>
              ))}
            </select>
          )}

          {/* Nút Làm mới */}
          <button
            onClick={fetchStats}
            title="Làm mới dữ liệu"
            className="w-10 h-10 rounded-lg bg-gray-100 hover:bg-gray-200 dark:bg-slate-700 dark:hover:bg-slate-600 text-gray-600 dark:text-slate-200 flex items-center justify-center transition-colors cursor-pointer"
          >
            {loading ? (
              <i className="fas fa-spinner animate-spin"></i>
            ) : (
              <i className="fas fa-sync-alt"></i>
            )}
          </button>
        </div>
      </div>

      {/* 1. KHU VỰC THỐNG KÊ CHUNG (STAT CARDS) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-10">
        <StatCard
          title="Tổng Doanh Thu"
          value={formatCurrency(stats.totalRevenue)}
          icon="fas fa-money-bill-wave"
          color="border-l-green-500"
        />
        <StatCard
          title="Tổng Đơn Hàng"
          value={stats.totalOrders}
          icon="fas fa-shopping-cart"
          color="border-l-blue-500"
        />
        <StatCard
          title="Đơn Hàng Chờ"
          value={stats.pendingOrders}
          icon="fas fa-clock"
          color="border-l-yellow-500"
        />
        <StatCard
          title="Tổng Thành Viên"
          value={stats.totalUsers}
          icon="fas fa-users"
          color="border-l-red-500"
        />
      </div>

      {/* 2. KHU VỰC BIỂU ĐỒ (CHARTS GRID) */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-10">
        {/* Biểu đồ 1: Tổng Doanh Thu */}
        <LineChart
          title="Tổng Doanh Thu"
          data={stats.revenueTimeline}
          color="#10b981"
          yAxisFormatter={formatShortCurrency}
        />

        {/* Biểu đồ 2: Sản phẩm bán chạy nhất */}
        <BarChart
          title="Sản phẩm bán chạy nhất (Số lượng)"
          data={stats.bestSellers}
          color="#3b82f6"
        />

        {/* Biểu đồ 3: Sản phẩm tồn kho nhiều nhất */}
        <BarChart
          title="Sản phẩm tồn kho nhiều nhất (Số lượng)"
          data={stats.mostStockedProducts}
          color="#f59e0b"
        />

        {/* Biểu đồ 4: Sự bán của các hãng (Biểu đồ cột) */}
        <BarChart
          title="Doanh số bán lẻ theo Thương hiệu"
          data={stats.brandSales}
          color="#8b5cf6"
        />
      </div>

      {/* 3. ĐƠN HÀNG GẦN ĐÂY */}
      <div className="bg-white dark:bg-slate-800 p-6 rounded-xl border border-gray-100 dark:border-slate-700 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-lg font-bold text-gray-800 dark:text-white">5 Đơn Hàng Gần Đây</h2>
          <Link
            to="/admin/orders"
            className="text-xs text-primary font-bold hover:underline transition-all flex items-center gap-1"
          >
            Xem tất cả đơn hàng <i className="fas fa-arrow-right text-[10px]"></i>
          </Link>
        </div>

        <div className="space-y-3">
          {stats.recentOrders && stats.recentOrders.length > 0 ? (
            stats.recentOrders.map((order) => (
              <div
                key={order.id}
                className="flex justify-between items-center p-4 bg-gray-50/50 dark:bg-slate-900/40 rounded-xl hover:bg-gray-50 dark:hover:bg-slate-900/60 transition-all border border-transparent hover:border-gray-100 dark:hover:border-slate-800"
              >
                <div className="text-sm">
                  <p className="font-bold text-gray-800 dark:text-white">
                    {order.order_code || (order.id ? `#${String(order.id).slice(-6).toUpperCase()}` : 'N/A')}
                  </p>
                  <p className="text-gray-400 text-xs mt-1">
                    Khách hàng: <span className="text-gray-600 dark:text-slate-300 font-medium">{order.shipping_full_name || order.user_email || 'N/A'}</span>
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-bold text-base text-green-600 dark:text-green-400">
                    {formatCurrency(order.total)}
                  </p>
                  <span
                    className={`inline-block text-[10px] font-bold px-2.5 py-0.5 rounded-full mt-1.5 ${
                      order.status === "pending"
                        ? "bg-yellow-50 text-yellow-600 border border-yellow-200"
                        : order.status === "confirmed"
                        ? "bg-blue-50 text-blue-600 border border-blue-200"
                        : order.status === "shipping"
                        ? "bg-indigo-50 text-indigo-600 border border-indigo-200"
                        : order.status === "delivered"
                        ? "bg-green-50 text-green-600 border border-green-200"
                        : "bg-red-50 text-red-600 border border-red-200"
                    }`}
                  >
                    {order.status.toUpperCase()}
                  </span>
                </div>
              </div>
            ))
          ) : (
            <p className="text-gray-500 text-center py-6">Chưa có đơn hàng nào</p>
          )}
        </div>
      </div>
    </div>
  );
}
