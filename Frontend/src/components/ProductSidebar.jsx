import React, { useState, useEffect, useCallback } from "react";
import { Link } from "react-router-dom";
import { fetchApi } from "../utils/api"; // THÊM fetchApi

// Component con nội bộ để tái sử dụng
function FilterGroup({ title, children }) {
  return (
    <div className="mb-6 bg-white dark:bg-gray-800 rounded-lg shadow-sm p-4">
      <h3 className="text-sm font-bold uppercase text-gray-800 dark:text-white border-b-2 border-primary pb-2 mb-4">
        {title}
      </h3>
      <div className="flex flex-col gap-2.5">{children}</div>
    </div>
  );
}

// Danh sách Price Ranges không đổi (lọc client-side trong ProductListPage)
const priceRanges = [
  "Dưới 1,000,000₫",
  "1,000,000₫ - 2,000,000₫",
  "2,000,000₫ - 3,000,000₫",
  "3,000,000₫ - 4,000,000₫",
  "Trên 4,000,000₫",
];

export default function ProductSidebar({ activeFilters, onFilterChange }) {
  const [categories, setCategories] = useState([]);
  const [brands, setBrands] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch Categories và Brands
  const fetchData = useCallback(async () => {
    try {
      // Fetch Categories
      const catsResponse = await fetchApi("/categories");
      const fetchedCategories = catsResponse?.data || catsResponse || [];
      setCategories(
        fetchedCategories.map((c) => ({
          name: c.name,
          slug: c.slug,
          id: c._id, // Quan trọng: dùng ID cho filtering
        }))
      );

      // Fetch Brands
      const brandsResponse = await fetchApi("/brands");
      const fetchedBrands = brandsResponse?.data || brandsResponse || [];
      setBrands(
        fetchedBrands.map((b) => ({
          name: b.name,
          slug: b.slug,
          id: b._id, // Quan trọng: dùng ID cho filtering
        }))
      );
    } catch (error) {
      console.error("Lỗi khi tải danh mục/thương hiệu:", error);
      setCategories([]);
      setBrands([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  if (loading) {
    // Loading skeleton cho sidebar
    return (
      <aside className="w-full space-y-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="bg-white rounded-lg shadow-sm p-4 animate-pulse">
            <div className="h-5 bg-gray-200 rounded w-2/3 mb-4" />
            <div className="space-y-2">
              {[1, 2, 3, 4].map((j) => (
                <div key={j} className="h-4 bg-gray-200 rounded" />
              ))}
            </div>
          </div>
        ))}
      </aside>
    );
  }

  return (
    <aside className="w-full">
      {/* 1. Danh mục sản phẩm */}
      <FilterGroup title="Danh mục sản phẩm">
        <Link 
          to="/danh-muc/tat-ca" 
          className="text-sm hover:text-primary transition-colors duration-200 flex items-center gap-2 py-1"
        >
          <i className="fas fa-th text-xs text-gray-400" />
          TẤT CẢ SẢN PHẨM
        </Link>
        {categories.map((cat) => (
          <Link
            key={cat.id}
            to={`/danh-muc/${cat.slug}`}
            className="text-sm hover:text-primary transition-colors duration-200 flex items-center gap-2 py-1"
          >
            <i className="fas fa-angle-right text-xs text-gray-400" />
            {cat.name.toUpperCase()}
          </Link>
        ))}
      </FilterGroup>

      {/* 2. Lọc theo giá (Dùng logic getPriceQuery trên ProductListPage) */}
      <FilterGroup title="Giá">
        {priceRanges.map((range) => (
          <label 
            key={range} 
            className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors duration-200 py-1"
          >
            <input
              type="checkbox"
              className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary focus:ring-2 cursor-pointer"
              checked={activeFilters.prices.includes(range)}
              onChange={() => onFilterChange("prices", range)}
            />
            <span>{range}</span>
          </label>
        ))}
      </FilterGroup>

      {/* 3. Lọc theo thương hiệu (SỬ DỤNG ID TỪ API) */}
      <FilterGroup title="Thương hiệu">
        {brands.length === 0 ? (
          <p className="text-sm text-gray-400 italic">Không có thương hiệu</p>
        ) : (
          brands.map((brand) => (
            <label 
              key={brand.id} 
              className="flex items-center gap-2 text-sm cursor-pointer hover:text-primary transition-colors duration-200 py-1"
            >
              <input
                type="checkbox"
                className="w-4 h-4 rounded border-gray-300 text-primary focus:ring-primary focus:ring-2 cursor-pointer"
                checked={activeFilters.brands.includes(brand.id)}
                onChange={() => onFilterChange("brands", brand.id)}
              />
              <span>{brand.name}</span>
            </label>
          ))
        )}
      </FilterGroup>
    </aside>
  );
}
