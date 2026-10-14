export function errorHandler(err, req, res, next) {
  console.error('API Error:', {
    message: err.message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
    path: req.originalUrl,
    method: req.method,
  });

  // Handle Multer errors
  if (err.name === 'MulterError') {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        message: 'File size exceeds 10MB limit.',
      });
    }
    return res.status(400).json({
      success: false,
      message: `File upload error: ${err.message}`,
    });
  }

  // Handle Prisma unique constraint violations
  if (err.code === 'P2002') {
    const target = err.meta?.target ? ` (${err.meta.target})` : '';
    return res.status(409).json({
      success: false,
      message: `A record with this unique field already exists${target}.`,
    });
  }

  // Handle Prisma record not found
  if (err.code === 'P2025') {
    return res.status(404).json({
      success: false,
      message: 'The requested record was not found in the database.',
    });
  }

  const statusCode = err.statusCode || res.statusCode === 200 ? 500 : res.statusCode;
  res.status(statusCode).json({
    success: false,
    message: err.message || 'Internal server error occurred.',
    errors: err.errors || undefined,
  });
}
