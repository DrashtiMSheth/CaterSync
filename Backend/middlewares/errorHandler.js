// Centralized Error Handling Middleware
const errorHandler = (err, req, res, next) => {
  console.error(err.stack);

  // Set default status code and message
  const statusCode = res.statusCode !== 200 ? res.statusCode : 500;
  const message = err.message || "Internal Server Error";

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

module.exports = errorHandler;
