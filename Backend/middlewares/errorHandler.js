const errorHandler = (err, req, res, next) => {
  console.error("Error:", err);

  const statusCode = err.statusCode || 500;

  let message = err.message || "Internal Server Error";

  if (err.name === "ValidationError") {
    message = Object.values(err.errors).map((val) => val.message).join(", ");
  }

  if (err.code && err.code === 11000) {
    const field = Object.keys(err.keyValue);
    message = `${field} already exists`;
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === "production" ? null : err.stack,
  });
};

module.exports = errorHandler;
