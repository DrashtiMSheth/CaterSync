module.exports = (allowedRoles) => {
  return (req, res, next) => {
    try {
      if (!req.user || !req.user.role) {
        return res.status(401).json({
          success: false,
          message: "Unauthorized. User info missing or invalid token.",
        });
      }

      const rolesArray = Array.isArray(allowedRoles) ? allowedRoles : [allowedRoles];

      if (!rolesArray.includes(req.user.role)) {
        return res.status(403).json({
          success: false,
          message: "Access denied. Insufficient permissions.",
        });
      }

      next();
    } catch (err) {
      console.error("Roles middleware error:", err);
      res.status(500).json({
        success: false,
        message: "Internal server error in role validation.",
      });
    }
  };
};
