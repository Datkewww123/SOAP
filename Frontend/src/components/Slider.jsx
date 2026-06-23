import React from "react";
import { Link } from "react-router-dom";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Pagination, Autoplay } from "swiper/modules";

import "swiper/css";
import "swiper/css/navigation";
import "swiper/css/pagination";
import "swiper/css/autoplay";

const slideImages = [
  {
    img: "https://images.pexels.com/photos/27299906/pexels-photo-27299906.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt: "Giày bóng đá sân cỏ tự nhiên",
    link: "/danh-muc/giay-bong-da-san-co-tu-nhien",
    caption: "Giày cỏ tự nhiên",
    subtitle: "Đinh dài, bám sân tốt cho mặt cỏ thật",
  },
  {
    img: "https://images.pexels.com/photos/32925319/pexels-photo-32925319.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt: "Giày bóng đá sân cỏ nhân tạo",
    link: "/danh-muc/giay-bong-da-san-co-nhan-tao",
    caption: "Giày cỏ nhân tạo",
    subtitle: "Linh hoạt, bền bỉ trên mọi sân TF",
  },
  {
    img: "https://images.pexels.com/photos/14690051/pexels-photo-14690051.jpeg?auto=compress&cs=tinysrgb&w=1600",
    alt: "Giày futsal chính hãng",
    link: "/danh-muc/giay-futsal",
    caption: "Giày Futsal",
    subtitle: "Đế bằng, kiểm soát bóng trong nhà",
  },
];

export default function Slider() {
  return (
    <section className="hero-slider relative w-full overflow-hidden bg-slate-900">
      <div className="relative w-full aspect-[21/9] max-h-[520px] min-h-[220px] sm:min-h-[280px]">
        <Swiper
          modules={[Navigation, Pagination, Autoplay]}
          spaceBetween={0}
          slidesPerView={1}
          navigation
          pagination={{ clickable: true }}
          autoplay={{ delay: 5000, disableOnInteraction: false }}
          loop
          className="absolute inset-0 h-full w-full"
        >
          {slideImages.map((slide, index) => (
            <SwiperSlide key={index} className="!h-full">
              <Link to={slide.link} className="group relative block h-full w-full overflow-hidden">
                <div
                  role="img"
                  aria-label={slide.alt}
                  className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-[1.02]"
                  style={{ backgroundImage: `url("${slide.img}")` }}
                />
                <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/35 to-transparent" />
                <div className="absolute inset-0 flex items-center">
                  <div className="container mx-auto px-6 md:px-10">
                    <p className="mb-2 text-xs font-bold uppercase tracking-[0.2em] text-red-400 md:text-sm">
                      THSPORT
                    </p>
                    <h2 className="max-w-xl text-2xl font-extrabold leading-tight text-white md:text-4xl lg:text-5xl">
                      {slide.caption}
                    </h2>
                    <p className="mt-3 max-w-lg text-sm text-white/85 md:text-base">
                      {slide.subtitle}
                    </p>
                  </div>
                </div>
              </Link>
            </SwiperSlide>
          ))}
        </Swiper>
      </div>

      <style>{`
        .hero-slider .swiper,
        .hero-slider .swiper-wrapper,
        .hero-slider .swiper-slide {
          height: 100% !important;
        }
        .hero-slider .swiper-pagination {
          bottom: 14px !important;
        }
        .hero-slider .swiper-pagination-bullet {
          background: rgba(255, 255, 255, 0.55);
          opacity: 1;
        }
        .hero-slider .swiper-pagination-bullet-active {
          background: #ef4444;
          width: 22px;
          border-radius: 999px;
        }
        .hero-slider .swiper-button-prev,
        .hero-slider .swiper-button-next {
          color: #fff;
          width: 42px;
          height: 42px;
          border-radius: 999px;
          background: rgba(0, 0, 0, 0.35);
        }
        .hero-slider .swiper-button-prev:after,
        .hero-slider .swiper-button-next:after {
          font-size: 16px;
          font-weight: 700;
        }
      `}</style>
    </section>
  );
}
