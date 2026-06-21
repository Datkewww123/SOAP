import React from "react";
import { Link } from "react-router-dom";
export default function BrandCard({ imageUrl, alt, linkUrl }) {
  return (
    <Link to={linkUrl} className="brand-card">
      <img
        src={imageUrl}
        alt={alt}
        className="w-full rounded-lg border border-[#eee] dark:border-gray-700 transition-all duration-300 hover:grayscale-[80%]"
      />
    </Link>
  );
}
