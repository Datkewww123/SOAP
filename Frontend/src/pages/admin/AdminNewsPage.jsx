// Frontend/src/pages/admin/AdminNewsPage.jsx
import React, { useState, useEffect } from "react";
import { fetchApi } from "../../utils/api";
import { toast } from "react-toastify";
import ConfirmModal from "../../components/ConfirmModal";

export default function AdminNewsPage() {
  const [newsList, setNewsList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [editingNews, setEditingNews] = useState(null);
  const [confirmModal, setConfirmModal] = useState({
    isOpen: false,
    newsId: null,
    newsTitle: "",
  });
  const [formData, setFormData] = useState({
    title: "",
    slug: "",
    content: "",
    excerpt: "",
    tags: "",
    image: "",
    featured: false,
    published: true,
  });

  useEffect(() => {
    loadNews();
  }, []);

  const loadNews = async () => {
    try {
      setLoading(true);
      const response = await fetchApi("/news");
      // Backend có thể trả về {data: [...]} hoặc [...] trực tiếp
      const newsData = response.data || response;
      setNewsList(Array.isArray(newsData) ? newsData : []);
    } catch (error) {
      toast.error("Không thể tải danh sách tin tức");
      setNewsList([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const newsData = {
        ...formData,
        tags: formData.tags.split(",").map((tag) => tag.trim()).filter(Boolean),
      };

      if (editingNews) {
        await fetchApi(`/news/${editingNews._id}`, {
          method: "PUT",
          body: JSON.stringify(newsData),
        });
        toast.success("Cập nhật tin tức thành công!");
      } else {
        await fetchApi("/news", {
          method: "POST",
          body: JSON.stringify(newsData),
        });
        toast.success("Thêm tin tức thành công!");
      }

      setShowModal(false);
      resetForm();
      loadNews();
    } catch (error) {
      toast.error(error.message || "Có lỗi xảy ra");
    }
  };

  const handleEdit = (news) => {
    setEditingNews(news);
    setFormData({
      title: news.title,
      slug: news.slug || "",
      content: news.content,
      excerpt: news.excerpt || "",
      tags: news.tags?.join(", ") || "",
      image: news.image || "",
      featured: news.featured || false,
      published: news.published ?? true,
    });
    setShowModal(true);
  };

  const handleDeleteClick = (id, title) => {
    setConfirmModal({
      isOpen: true,
      newsId: id,
      newsTitle: title,
    });
  };

  const confirmDeleteNews = async () => {
    const { newsId } = confirmModal;
    setConfirmModal({ isOpen: false, newsId: null, newsTitle: "" });
    try {
      await fetchApi(`/news/${newsId}`, { method: "DELETE" });
      toast.success("Xóa tin tức thành công!");
      loadNews();
    } catch (error) {
      toast.error("Không thể xóa tin tức");
    }
  };

  const resetForm = () => {
    setFormData({
      title: "",
      slug: "",
      content: "",
      excerpt: "",
      tags: "",
      image: "",
      featured: false,
      published: true,
    });
    setEditingNews(null);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    resetForm();
  };

  return (
    <div className="py-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800">
          Quản lý Tin tức/Blog
        </h2>
        <button
          onClick={() => setShowModal(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
        >
          + Thêm tin tức
        </button>
      </div>

      {loading ? (
        <p className="text-center py-8">Đang tải...</p>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tiêu đề
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Tags
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Trạng thái
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Nổi bật
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  Thao tác
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {newsList && newsList.length > 0 ? (
                newsList.map((news) => (
                  <tr key={news._id}>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {news.title}
                      </div>
                      <div className="text-sm text-gray-500">{news.slug}</div>
                    </td>
                  <td className="px-6 py-4">
                    <div className="flex flex-wrap gap-1">
                      {news.tags?.map((tag, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 text-xs bg-blue-100 text-blue-800 rounded"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-2 py-1 text-xs rounded ${
                        news.published
                          ? "bg-green-100 text-green-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {news.published ? "Đã xuất bản" : "Nháp"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-sm">
                    {news.featured ? "⭐" : ""}
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(news)}
                      className="text-blue-600 hover:text-blue-900 mr-4"
                    >
                      Sửa
                    </button>
                    <button
                      onClick={() => handleDeleteClick(news._id, news.title)}
                      className="text-red-600 hover:text-red-900"
                    >
                      Xóa
                    </button>
                  </td>
                </tr>
              ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-8 text-gray-500">
                    Chưa có tin tức nào
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}

      
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999] p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <h3 className="text-xl font-bold mb-4">
                {editingNews ? "Sửa tin tức" : "Thêm tin tức mới"}
              </h3>
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tiêu đề *
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.title}
                    onChange={(e) =>
                      setFormData({ ...formData, title: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Slug (URL)
                  </label>
                  <input
                    type="text"
                    value={formData.slug}
                    onChange={(e) =>
                      setFormData({ ...formData, slug: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                    placeholder="tin-tuc-moi-nhat"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tóm tắt
                  </label>
                  <textarea
                    value={formData.excerpt}
                    onChange={(e) =>
                      setFormData({ ...formData, excerpt: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                    rows="2"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Nội dung *
                  </label>
                  <textarea
                    required
                    value={formData.content}
                    onChange={(e) =>
                      setFormData({ ...formData, content: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                    rows="6"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    Tags (phân cách bằng dấu phẩy)
                  </label>
                  <input
                    type="text"
                    value={formData.tags}
                    onChange={(e) =>
                      setFormData({ ...formData, tags: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                    placeholder="thể thao, giày, tin tức"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium mb-1">
                    URL Hình ảnh
                  </label>
                  <input
                    type="text"
                    value={formData.image}
                    onChange={(e) =>
                      setFormData({ ...formData, image: e.target.value })
                    }
                    className="w-full border rounded px-3 py-2"
                    placeholder="https://..."
                  />
                </div>

                <div className="flex gap-4">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.featured}
                      onChange={(e) =>
                        setFormData({ ...formData, featured: e.target.checked })
                      }
                      className="mr-2"
                    />
                    Tin nổi bật
                  </label>

                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={formData.published}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          published: e.target.checked,
                        })
                      }
                      className="mr-2"
                    />
                    Xuất bản
                  </label>
                </div>

                <div className="flex justify-end gap-2 pt-4">
                  <button
                    type="button"
                    onClick={handleCloseModal}
                    className="px-4 py-2 border rounded hover:bg-gray-100"
                  >
                    Hủy
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
                  >
                    {editingNews ? "Cập nhật" : "Thêm mới"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
      <ConfirmModal
        isOpen={confirmModal.isOpen}
        title="Xóa Tin Tức"
        message={
          confirmModal.isOpen && (
            <span>
              Bạn có chắc chắn muốn xóa bài viết tin tức{" "}
              <strong className="font-semibold text-gray-800 dark:text-white">
                "{confirmModal.newsTitle}"
              </strong>
              ? Hành động này không thể hoàn tác.
            </span>
          )
        }
        type="danger"
        onConfirm={confirmDeleteNews}
        onCancel={() => setConfirmModal({ isOpen: false, newsId: null, newsTitle: "" })}
      />
    </div>
  );
}