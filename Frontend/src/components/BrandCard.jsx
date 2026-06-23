import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";

export default function BrandCard({ imageUrl, alt, linkUrl }) {
  const fallbackUrl = `https://placehold.co/400x200?text=${encodeURIComponent(alt || "Brand")}`;
  const [src, setSrc] = useState(imageUrl || fallbackUrl);

  useEffect(() => {
    setSrc(imageUrl || fallbackUrl);
  }, [imageUrl, fallbackUrl]);

  const handleError = () => {
    if (src !== fallbackUrl) setSrc(fallbackUrl);
  };

  return (
    <Link 
      to={linkUrl} 
      className="brand-card block overflow-hidden rounded-xl border border-gray-100 dark:border-slate-700 bg-white p-6 h-28 flex items-center justify-center shadow-sm hover:shadow-md hover:-translate-y-1 transition-all duration-300"
    >
      <img
        src={src}
        alt={alt}
        onError={handleError}
        className="max-h-full max-w-full object-contain transition-all duration-300 hover:scale-105"
      />
    </Link>
  );
}
