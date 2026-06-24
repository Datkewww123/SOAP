// Backend/app/middleware/errorHandler.js
// Global error handler middleware

const { logger } = require('../config/logger');
const { httpStatus } = require('../constants/init');

/**
 * Middleware xử lý lỗi tập trung cho toàn bộ ứng dụng Express
 * 
 * Cách hoạt động:
 * - Middleware này có 4 parameters (err, req, res, next) → Express tự nhận biết là error handler
 * - Được đặt CUỐI CÙNG trong chuỗi middleware (sau tất cả routes)
 * - Bất kỳ lỗi nào được throw hoặc next(error) sẽ đến đây
 * 
 * Quy trình:
 * 1. Kiểm tra statusCode, nếu không có → mặc định 500 INTERNAL_SERVER_ERROR
 * 2. Tạo responseError object
 * 3. Xử lý các loại lỗi đặc biệt (Sequelize, JWT, etc.)
 * 4. Log error
 * 5. Xóa stack trace nếu môi trường PRODUCTION (bảo mật)
 * 6. Trả về JSON response
 */
module.exports = (err, req, res, next) => {
  // Default statusCode
  if (!err.statusCode) err.statusCode = httpStatus.INTERNAL_SERVER_ERROR;

  const responseError = {
    success: false,
    statusCode: err.statusCode,
    message: err.message || 'Internal Server Error',
    ...(err.errors && { errors: err.errors })
  };

  // ============================================
  // XỬ LÝ CÁC LOẠI LỖI ĐẶC BIỆT
  // ============================================

  // Sequelize validation error
  if (err.name === 'SequelizeValidationError') {
    responseError.statusCode = httpStatus.BAD_REQUEST;
    responseError.message = 'Dữ liệu không hợp lệ';
    responseError.errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
  }

  // Sequelize unique constraint error
  if (err.name === 'SequelizeUniqueConstraintError') {
    responseError.statusCode = httpStatus.CONFLICT;
    responseError.message = err.errors && err.errors.length > 0
      ? `${err.errors[0].path} đã tồn tại`
      : 'Dữ liệu đã tồn tại';
    responseError.errors = err.errors.map(e => ({
      field: e.path,
      message: e.message
    }));
  }

  // Sequelize foreign key constraint error
  if (err.name === 'SequelizeForeignKeyConstraintError') {
    responseError.statusCode = httpStatus.BAD_REQUEST;
    responseError.message = 'Lỗi liên kết dữ liệu (Foreign Key Constraint)';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    responseError.statusCode = httpStatus.UNAUTHORIZED;
    responseError.message = 'Token không hợp lệ';
  }

  if (err.name === 'TokenExpiredError') {
    responseError.statusCode = httpStatus.UNAUTHORIZED;
    responseError.message = 'Token đã hết hạn';
  }

  // ============================================
  // LOGGING
  // ============================================
  logger.error(`[ERROR] ${req.method} ${req.url} - ${responseError.statusCode}`, {
    message: err.message,
    stack: err.stack,
    statusCode: responseError.statusCode,
    ...(req.user && { 
      userId: req.user.id,
      userRole: req.user.role 
    }),
    ...(req.body && Object.keys(req.body).length > 0 && { 
      body: req.body 
    })
  });

  // ============================================
  // RESPONSE
  // ============================================
  
  // Include stack trace only in development
  if (process.env.NODE_ENV === 'development') {
    responseError.stack = err.stack;
  }

  res.status(responseError.statusCode).json(responseError);
};
