import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchApi } from "../utils/api";
import ProductCard from "../components/ProductCard";
import Pagination from "../components/Pagination";

export default function BrandProductsPage() {
  const { brandSlug } = useParams();
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [brand, setBrand] = useState(null);
  const [loading, setLoading] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [total, setTotal] = useState(0);

  const PRODUCTS_PER_PAGE = 12;

  useEffect(() => {
    const fetchBrandProducts = async () => {
      setLoading(true);
      try {
        // Lấy thông tin brand
        const brandsData = await fetchApi("/brands");
        const foundBrand = brandsData.find(
          (b) => b.slug === brandSlug || b.slug.includes(brandSlug)
        );

        if (foundBrand) {
          setBrand(foundBrand);

          // Lấy sản phẩm của brand này
          const response = await fetchApi(
            `/products?brand=${foundBrand._id}&page=${currentPage}&limit=${PRODUCTS_PER_PAGE}`
          );

          const formattedProducts = response.data.map((p) => ({
            id: p._id,
            slug: p.slug,
            name: p.name,
            price: p.price,
            originalPrice: p.originalPrice,
            stock: p.stock || 0,
            sold: p.sold || 0,
            description: p.description,
            brand: p.brand?.name,
            imageUrl:
              p.images?.length > 0
                ? p.images[0]
                : "https://placehold.co/300x300?text=No+Image",
          }));

          setProducts(formattedProducts);
          setTotalPages(response.pagination.totalPages);
          setTotal(response.pagination.total);
        } else {
          setProducts([]);
        }
      } catch (error) {
        console.error("Lỗi khi tải sản phẩm:", error);
        setProducts([]);
      } finally {
        setLoading(false);
      }
    };

    fetchBrandProducts();
  }, [brandSlug, currentPage]);

  const handlePageChange = (page) => {
    setCurrentPage(page);
    window.scrollTo(0, 0);
  };

  if (loading) {
    return (
      <div className="text-center py-20 text-xl">Đang tải sản phẩm...</div>
    );
  }

  return (
    <div className="container w-[90%] max-w-[1200px] mx-auto mt-10 py-10">
      {brand ? (
        <>
          <h1 className="text-3xl font-bold text-center mb-4">
            Sản phẩm {brand.name}
          </h1>
          <p className="text-center text-gray-600 mb-8">
            Tìm thấy {total} sản phẩm
          </p>

          {total > 0 ? (
            <>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                {products.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>

              {totalPages > 1 && (
                <Pagination
                  currentPage={currentPage}
                  totalPages={totalPages}
                  onPageChange={handlePageChange}
                />
              )}
            </>
          ) : (
            <div className="text-center py-20 text-gray-600">
              <p className="mb-4">Không có sản phẩm nào</p>
              <button
                onClick={() => navigate("/san-pham")}
                className="px-6 py-2 bg-logo-yellow text-dark-color rounded hover:bg-opacity-80 transition"
              >
                Quay lại tất cả sản phẩm
              </button>
            </div>
          )}
        </>
      ) : (
        <div className="text-center py-20 text-gray-600">
          <p className="mb-4">Không tìm thấy thương hiệu này</p>
          <button
            onClick={() => navigate("/san-pham")}
            className="px-6 py-2 bg-logo-yellow text-dark-color rounded hover:bg-opacity-80 transition"
          >
            Quay lại tất cả sản phẩm
          </button>
        </div>
      )}
    </div>
  );
}
