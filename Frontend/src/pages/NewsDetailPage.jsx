import React, { useState, useEffect, useCallback } from "react";
import { useParams, Link } from "react-router-dom";
import { fetchApi } from "../utils/api";

export default function NewsDetailPage() {
  const { slug } = useParams();
  const [news, setNews] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchNews = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchApi(`/news/slug/${slug}`);
      const data = response?.data || response;
      setNews(data);
    } catch (err) {
      setError(err.message || "Không tìm thấy bài viết");
      setNews(null);
    } finally {
      setLoading(false);
    }
  }, [slug]);

  useEffect(() => {
    fetchNews();
  }, [fetchNews]);

  if (loading) {
    return (
      <div className="container w-[90%] max-w-[800px] mx-auto py-10">
        <div className="animate-pulse space-y-4">
          <div className="h-8 bg-gray-200 dark:bg-slate-700 rounded w-3/4" />
          <div className="aspect-video bg-gray-200 dark:bg-slate-700 rounded-xl" />
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded" />
          <div className="h-4 bg-gray-200 dark:bg-slate-700 rounded w-5/6" />
        </div>
      </div>
    );
  }

  if (error || !news) {
    return (
      <div className="container w-[90%] max-w-[800px] mx-auto py-16 text-center">
        <h1 className="text-2xl font-bold text-gray-800 dark:text-white mb-4">
          Không tìm thấy bài viết
        </h1>
        <Link to="/" className="text-primary font-semibold hover:underline">
          ← Về trang chủ
        </Link>
      </div>
    );
  }

  return (
    <article className="container w-[90%] max-w-[800px] mx-auto py-10">
      <Link
        to="/"
        className="inline-flex items-center gap-2 text-sm text-gray-500 hover:text-primary mb-6 transition-colors"
      >
        <i className="fas fa-arrow-left text-xs" />
        Về trang chủ
      </Link>

      <header className="mb-6">
        <p className="text-sm text-gray-400 mb-3 flex items-center gap-2">
          <i className="far fa-calendar-alt" />
          {new Date(news.createdAt).toLocaleDateString("vi-VN", {
            year: "numeric",
            month: "long",
            day: "numeric",
          })}
        </p>
        <h1 className="text-2xl md:text-3xl font-bold text-gray-900 dark:text-white leading-tight">
          {news.title}
        </h1>
      </header>

      {news.image_url && (
        <div className="aspect-video rounded-2xl overflow-hidden mb-8 border border-gray-100 dark:border-slate-700">
          <img
            src={news.image_url}
            alt={news.title}
            className="w-full h-full object-cover"
          />
        </div>
      )}

      <div className="prose prose-gray dark:prose-invert max-w-none">
        <p className="text-base md:text-lg text-gray-700 dark:text-slate-200 leading-relaxed whitespace-pre-line">
          {news.content}
        </p>
      </div>
    </article>
  );
}
