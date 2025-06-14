const errorHandler = (err, req, res, next) => {
  console.error('Error:', err);

  // 默认错误
  let error = {
    message: err.message || 'Internal Server Error',
    status: err.status || 500
  };

  // 数据库错误
  if (err.code) {
    switch (err.code) {
      case '23505': // 唯一约束违反
        error.message = 'Duplicate entry';
        error.status = 409;
        break;
      case '23503': // 外键约束违反
        error.message = 'Referenced record not found';
        error.status = 400;
        break;
      case '23502': // 非空约束违反
        error.message = 'Required field missing';
        error.status = 400;
        break;
      default:
        error.message = 'Database error';
        error.status = 500;
    }
  }

  // JWT 错误
  if (err.name === 'JsonWebTokenError') {
    error.message = 'Invalid token';
    error.status = 401;
  }

  if (err.name === 'TokenExpiredError') {
    error.message = 'Token expired';
    error.status = 401;
  }

  // 验证错误
  if (err.name === 'ValidationError') {
    error.message = 'Validation failed';
    error.status = 400;
  }

  res.status(error.status).json({
    error: error.message,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};

module.exports = errorHandler;
