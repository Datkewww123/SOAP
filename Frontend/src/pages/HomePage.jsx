// src/pages/HomePage.jsx — Hoàn toàn dynamic, lấy dữ liệu từ MySQL
import React, { useState, useEffect, useCallback } from "react";
import Slider from "../components/Slider";
import Section from "../components/Section";
import CategoryCard from "../components/CategoryCard";
import BrandCard from "../components/BrandCard";
import PositionCard from "../components/PositionCard";
import { Link } from "react-router-dom";
import { fetchApi } from "../utils/api";
import { SkeletonCard } from "../components/LoadingSkeleton";

// Các small banner tĩnh (không cần DB, chỉ là link nhanh)
const SMALL_BANNERS = [
  {
    img: "https://theme.hstatic.net/1000061481/1001035882/14/index_banner_5.jpg?v=2391",
    title: "GIÀY ĐÁ BANH TRẺ EM",
    linkUrl: "/danh-muc/giay-da-bong-tre-em",
    id: "small-card-kids",
  },
  {
    img: "https://theme.hstatic.net/1000061481/1001035882/14/index_banner_6.jpg?v=2391",
    title: "ÁO BÓNG ĐÁ CHÍNH HÃNG",
    linkUrl: "/danh-muc/ao-bong-da-chinh-hang",
    id: "small-card-shirts",
  },
  {
    img: "https://theme.hstatic.net/1000061481/1001035882/14/index_banner_7.jpg?v=2391",
    title: "QUẢ BÓNG ĐÁ",
    linkUrl: "/danh-muc/qua-bong-da",
    id: "small-card-ball",
  },
];

// Fallback images cho category nếu DB chưa có ảnh
const CATEGORY_FALLBACK_IMAGES = {
  "giay-bong-da-san-co-tu-nhien": "https://images.pexels.com/photos/27299906/pexels-photo-27299906.jpeg?auto=compress&cs=tinysrgb&w=800",
  "giay-bong-da-san-co-nhan-tao": "https://images.pexels.com/photos/32925319/pexels-photo-32925319.jpeg?auto=compress&cs=tinysrgb&w=800",
  "giay-futsal":                  "https://images.pexels.com/photos/14690051/pexels-photo-14690051.jpeg?auto=compress&cs=tinysrgb&w=800",
  "giay-training":                "https://images.pexels.com/photos/4753991/pexels-photo-4753991.jpeg?auto=compress&cs=tinysrgb&w=800",
  "giay-lifestyle":               "https://images.pexels.com/photos/12036893/pexels-photo-12036893.jpeg?auto=compress&cs=tinysrgb&w=800",
};

// Fallback images cho sport (chỉ ảnh giày sản phẩm)
const SPORT_FALLBACK_IMAGES = {
  "giay-bong-da":  "https://images.pexels.com/photos/10923070/pexels-photo-10923070.jpeg?auto=compress&cs=tinysrgb&w=800",
  "giay-chay-bo":  "https://images.pexels.com/photos/15475641/pexels-photo-15475641.jpeg?auto=compress&cs=tinysrgb&w=800",
  "giay-bong-ro":  "https://images.pexels.com/photos/12879628/pexels-photo-12879628.jpeg?auto=compress&cs=tinysrgb&w=800",
  "giay-tennis":   "https://images.pexels.com/photos/9241609/pexels-photo-9241609.jpeg?auto=compress&cs=tinysrgb&w=800",
};

// Fallback logos cho brand
const BRAND_FALLBACK_IMAGES = {
  nike: "https://cdn.simpleicons.org/nike",
  adidas: "https://cdn.simpleicons.org/adidas",
  puma: "https://cdn.simpleicons.org/puma",
  mizuno: "https://placehold.co/400x200/002B5C/FFFFFF?text=Mizuno",
  joma: "https://placehold.co/400x200/CC0000/FFFFFF?text=Joma",
  kamito: "https://placehold.co/400x200/1A5276/FFFFFF?text=Kamito",
  "under-armour": "https://cdn.simpleicons.org/underarmour",
  "new-balance": "https://cdn.simpleicons.org/newbalance",
};

export default function HomePage() {
  const [brands, setBrands] = useState([]);
  const [standardCategories, setStandardCategories] = useState([]);
  const [sportCategories, setSportCategories] = useState([]);
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchData = useCallback(async () => {
    try {
      const [brandsRes, catsRes, newsRes] = await Promise.all([
        fetchApi("/brands"),
        fetchApi("/categories"),
        fetchApi("/news"),
      ]);

      // --- Brands ---
      const fetchedBrands = brandsRes?.data || [];
      const mappedBrands = fetchedBrands.map((b) => ({
        alt: b.name,
        linkUrl: `/san-pham?brand=${b.slug}`,
        imageUrl:
          BRAND_FALLBACK_IMAGES[b.slug] ||
          b.image_url ||
          `https://placehold.co/400x200?text=${encodeURIComponent(b.name)}`,
        brandId: b.id,
        brandSlug: b.slug,
      }));
      setBrands(mappedBrands);

      // --- Categories (phân loại theo type) ---
      const fetchedCats = catsRes?.data || [];

      const standard = fetchedCats
        .filter((c) => c.type === "standard" || c.type == null)
        .map((c) => ({
          id: c.id,
          name: c.name,
          slug: c.slug,
          description: c.description,
          imageUrl: c.image_url || CATEGORY_FALLBACK_IMAGES[c.slug] || "https://placehold.co/400x400?text=No+Image",
        }));

      const sports = fetchedCats
        .filter((c) => c.type === "sport")
        .map((c) => ({
          id: c.id,
          name: c.name.toUpperCase(),
          slug: c.slug,
          description: c.description,
          imageUrl: c.image_url || SPORT_FALLBACK_IMAGES[c.slug] || "https://placehold.co/400x400?text=No+Image",
        }));

      setStandardCategories(standard);
      setSportCategories(sports);

      // --- News ---
      let sortedNews = [];
      try {
        const fetchedNews = newsRes?.data || newsRes || [];
        if (Array.isArray(fetchedNews) && fetchedNews.length > 0) {
          sortedNews = [...fetchedNews].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
        }
      } catch (e) {}

      if (sortedNews.length === 0) {
        sortedNews = [
          {
            id: 'news-1',
            slug: 'viet-nam-chot-danh-sach-du-vong-loai-world-cup',
            title: 'Việt Nam chốt danh sách dự vòng loại World Cup',
            content: 'Liên đoàn bóng đá Việt Nam đã chốt danh sách 26 cầu thủ tham dự vòng loại World Cup 2026.',
            image_url: 'https://images2.thanhnien.vn/528068263637045248/2024/1/4/tuyen-viet-nam-3-17043818318621251347622.jpg',
            createdAt: new Date().toISOString()
          },
          {
            id: 'news-2',
            slug: 'top-5-doi-giay-da-bong-san-co-nhan-tao',
            title: 'Top 5 đôi giày đá bóng sân cỏ nhân tạo đáng mua nhất 2024',
            content: 'Danh sách 5 đôi giày đá bóng sân cỏ nhân tạo được đánh giá cao về độ bền và giá thành.',
            image_url: 'https://bizweb.dktcdn.net/100/364/348/articles/top-5-doi-giay-da-bong-san-co-nhan-tao.jpg?v=1704204561000',
            createdAt: new Date().toISOString()
          },
          {
            id: 'news-3',
            slug: 'luat-choi-futsal-co-ban',
            title: 'Luật chơi Futsal cơ bản dành cho người mới bắt đầu',
            content: 'Hướng dẫn các luật cơ bản của môn Futsal dành cho người mới chơi.',
            image_url: 'https://vtv1.mediacdn.vn/thumb_w/650/2021/9/23/vtv-futsal-2-1632367123956102194680.jpg',
            createdAt: new Date().toISOString()
          }
        ];
      }
      setNewsList(sortedNews.slice(0, 6));
    } catch (error) {
      console.error("Lỗi khi tải dữ liệu trang chủ:", error);
    } finally {
      setLoading(false);
    }
  }, []);


  useEffect(() => {
    fetchData();
  }, [fetchData]);

  return (
    <>
      <Slider />
      <div className="container page-content w-[90%] max-w-[1000px] mx-auto mt-10">

        {/* ── PHẦN DANH MỤC (Dynamic từ MySQL) ── */}
        <Section title="BẠN ĐANG TÌM">
          <div className="category-grid grid grid-cols-1 md:grid-cols-12 gap-5">
            {loading
              ? Array.from({ length: 4 }).map((_, i) => (
                  <div key={i} className="col-span-1 md:col-span-3">
                    <SkeletonCard />
                  </div>
                ))
              : standardCategories.slice(0, 4).map((cat) => (
                  <CategoryCard
                    key={cat.id}
                    size="large"
                    imageUrl={cat.imageUrl}
                    title={cat.name}
                    description={cat.description}
                    alt={cat.name}
                    linkUrl={`/danh-muc/${cat.slug}`}
                    gridClass="col-span-1 md:col-span-3"
                  />
                ))}

            {/* Small banners tĩnh */}
            {SMALL_BANNERS.map((banner) => (
              <Link
                key={banner.id}
                to={banner.linkUrl}
                id={banner.id}
                className="col-span-1 md:col-span-4 group"
              >
                <div className="category-card small block rounded-lg overflow-hidden shadow-lg transition-transform duration-300 group-hover:-translate-y-2 group-hover:shadow-xl">
                  <img
                    src={banner.img}
                    alt={banner.title}
                    className="w-full h-auto object-cover"
                  />
                </div>
                <h4 className="category-card-caption caption-green text-sm uppercase font-bold mt-2.5 text-center px-2.5 text-gray-800 dark:text-gray-200 transition-colors group-hover:text-green-800">
                  {banner.title}
                </h4>
              </Link>
            ))}
          </div>
        </Section>

        {/* ── PHẦN THƯƠNG HIỆU (Dynamic từ MySQL) ── */}
        <Section title="THƯƠNG HIỆU">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {Array.from({ length: 6 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <div className="brand-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {brands.map((brand, index) => (
                <BrandCard
                  key={index}
                  imageUrl={brand.imageUrl}
                  alt={brand.alt}
                  linkUrl={brand.linkUrl}
                />
              ))}
            </div>
          )}
        </Section>

        {/* ── PHẦN MÔN THỂ THAO (Dynamic từ MySQL, type='sport') ── */}
        <Section title="CHỌN GIÀY THEO MÔN THỂ THAO">
          {loading ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {Array.from({ length: 4 }).map((_, i) => (
                <SkeletonCard key={i} />
              ))}
            </div>
          ) : (
            <div className="sport-grid grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {sportCategories.map((sport) => (
                <PositionCard
                  key={sport.id}
                  imageUrl={sport.imageUrl}
                  title={sport.name}
                  description={sport.description}
                  linkUrl={`/danh-muc/${sport.slug}`}
                />
              ))}
            </div>
          )}
        </Section>

        {/* ── PHẦN TIN TỨC MỚI NHẤT (Dynamic từ MySQL) ── */}
        {newsList && newsList.length > 0 && (
          <Section title="TIN TỨC MỚI NHẤT">
            {loading ? (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {Array.from({ length: 6 }).map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
                {newsList.map((news) => {
                  const cardClass =
                    "bg-white dark:bg-slate-800 rounded-2xl overflow-hidden shadow-sm hover:shadow-md border border-gray-100 dark:border-slate-700 transition-all duration-300 hover:-translate-y-1.5 cursor-pointer flex flex-col h-full group block";
                  const isExternal = typeof news.link_url === "string" && news.link_url.startsWith("http");
                  const cardBody = (
                    <>
                      <div className="aspect-video overflow-hidden bg-gray-50 dark:bg-slate-900 border-b border-gray-100 dark:border-slate-700">
                        <img
                          src={news.image_url || "https://placehold.co/800x450?text=News"}
                          alt={news.title}
                          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                          loading="lazy"
                        />
                      </div>
                      <div className="p-5 flex flex-col flex-grow">
                        <h3 className="text-base font-bold text-gray-800 dark:text-slate-100 line-clamp-2 mb-2 group-hover:text-primary transition-colors leading-snug">
                          {news.title}
                        </h3>
                        <p className="text-[11px] text-gray-400 mb-3 flex items-center gap-1.5">
                          <i className="far fa-calendar-alt"></i>
                          {new Date(news.createdAt).toLocaleDateString("vi-VN", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                          })}
                        </p>
                        <p className="text-sm text-gray-500 dark:text-slate-300 line-clamp-3 leading-relaxed mb-4">
                          {news.content}
                        </p>
                        <div className="text-xs font-bold text-primary dark:text-red-400 mt-auto flex items-center gap-1.5 transition-transform group-hover:translate-x-1">
                          Đọc tiếp <i className={`fas ${isExternal ? "fa-external-link-alt" : "fa-arrow-right"} text-[10px]`}></i>
                        </div>
                      </div>
                    </>
                  );

                  return isExternal ? (
                    <a
                      key={news.id}
                      href={news.link_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className={cardClass}
                    >
                      {cardBody}
                    </a>
                  ) : (
                    <Link
                      key={news.id}
                      to={news.slug ? `/tin-tuc/${news.slug}` : "/"}
                      className={cardClass}
                    >
                      {cardBody}
                    </Link>
                  );
                })}
              </div>
            )}
          </Section>
        )}
      </div>
    </>
  );
}
