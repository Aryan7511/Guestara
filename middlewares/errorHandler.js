export const errorResponserHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || 400;
  err.message = err.message || 'Internal server Error';
  res.status(statusCode).json({
    success: false,
    message: err.message
  });
};
