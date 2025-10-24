const jwt = require("jsonwebtoken");

module.exports = function (req, res, next) {
  try {
    let token;
    const authHeader = req.header("Authorization");
    const xAuthToken = req.header("x-auth-token");

    if (authHeader) {
      const parts = authHeader.split(" ");
      if (parts.length === 2 && parts[0] === "Bearer") {
        token = parts[1];
      } else {
        return res.status(401).json({ message: "Access denied. Invalid token format." });
      }
    } else if (xAuthToken) {
      token = xAuthToken;
    } else {
      return res.status(401).json({ message: "Access denied. No token provided." });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded || !decoded.id) {
      return res.status(401).json({ message: "Invalid token payload." });
    }

    req.user = decoded; 

    next();
  } catch (err) {
    console.error("Auth middleware error:", err.message);

    if (err.name === "TokenExpiredError") {
      return res.status(401).json({ message: "Token expired. Please login again." });
    } else if (err.name === "JsonWebTokenError") {
      return res.status(401).json({ message: "Invalid token. Please login again." });
    }

    res.status(500).json({ message: "Internal server error in auth middleware." });
  }
};
