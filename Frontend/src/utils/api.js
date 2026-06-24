// Frontend/src/utils/api.js
export const API_BASE_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? "/api" : "http://localhost:8080/api");

/**
 * Hàm trợ giúp để gọi API và xử lý lỗi/token
 * @param {string} endpoint - Ví dụ: "/auth/login"
 * @param {object} options - Các tùy chọn fetch
 */
export async function fetchApi(endpoint, options = {}) {
  console.log('=== FETCH API ===');
  console.log('Endpoint:', endpoint);
  console.log('API_BASE_URL:', API_BASE_URL);
  
  const token = localStorage.getItem("token");
  const headers = {
    "Content-Type": "application/json",
    // Thêm header để vô hiệu hóa cache
    "Cache-Control": "no-cache, no-store, must-revalidate",
    "Pragma": "no-cache",
    "Expires": "0",
    ...options.headers,
  };

  if (token) {
    // Thêm JWT Token vào header Authorization
    headers["Authorization"] = `Bearer ${token}`;
  }

  // Thêm timestamp để force refresh cache
  const separator = endpoint.includes('?') ? '&' : '?';
  const cacheBuster = `${separator}_t=${Date.now()}`;
  const finalEndpoint = `${endpoint}${cacheBuster}`;

  const response = await fetch(`${API_BASE_URL}${finalEndpoint}`, {
    ...options,
    headers,
    credentials: 'include', // Gửi cookies (HTTP-only cookies từ backend)
    cache: 'no-store', // Không cache ở browser level
  }).catch(error => {
    console.error('=== FETCH ERROR ===');
    console.error('Endpoint:', `${API_BASE_URL}${finalEndpoint}`);
    console.error('Error:', error);
    throw error;
  });

  if (!response.ok && response.status !== 304) {
    // Đọc lỗi từ response body của Backend
    const errorData = await response
      .json()
      .catch(() => ({ message: "Lỗi không xác định" }));
    
    // Backend trả về format: { success: false, statusCode, message, errors }
    const error = new Error(errorData.message || errorData.error || "Lỗi mạng");
    error.status = response.status;
    error.errors = errorData.errors; // Validation errors từ Joi
    throw error;
  }

  // Trả về null nếu không có nội dung (ví dụ: DELETE, POST/204)
  if (
    response.status === 204 ||
    response.status === 304 ||
    response.headers.get("content-length") === "0"
  ) {
    return null; // Trả về null để tránh lỗi parse JSON trên body rỗng
  }

  const rawData = await response.json();
  const data = mapIdToUnderscoreId(rawData);
  
  // Backend có 2 format:
  // 1. New format (với ResponseHelper): { success: true, statusCode: 200, message: "...", data: {...} }
  // 2. Old format (trực tiếp): {...} hoặc [{...}]
  // Chuẩn hóa về format mới để frontend dễ xử lý
  if (data && typeof data === 'object' && 'success' in data && 'data' in data) {
    // Đã là format mới, trả về nguyên bản
    return data;
  } else {
    // Format cũ, wrap lại thành format mới
    return {
      success: true,
      statusCode: response.status,
      message: 'Success',
      data: data
    };
  }
}

function mapIdToUnderscoreId(obj) {
  if (obj === null || obj === undefined) return obj;
  if (Array.isArray(obj)) {
    return obj.map(mapIdToUnderscoreId);
  }
  if (typeof obj === 'object') {
    const mapped = {};
    for (const key in obj) {
      mapped[key] = mapIdToUnderscoreId(obj[key]);
    }
    // If 'id' exists and '_id' is missing, set '_id' to 'id'
    if ('id' in mapped && !('_id' in mapped)) {
      mapped._id = mapped.id;
    }
    return mapped;
  }
  return obj;
}

export function buildQueryParams(params) {
  const query = new URLSearchParams();
  for (const key in params) {
    // Chỉ thêm vào nếu giá trị không rỗng hoặc không phải null
    if (
      params[key] !== null &&
      params[key] !== undefined &&
      params[key] !== ""
    ) {
      // Xử lý mảng (ví dụ: filter theo nhiều brand)
      if (Array.isArray(params[key])) {
        params[key].forEach((value) => query.append(key, value));
      } else {
        query.append(key, params[key]);
      }
    }
  }
  return query.toString();
}
