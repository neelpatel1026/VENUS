const admin = (req, res, next) => {
  if (req.user && req.user.role === "admin") {
    // Defense-in-depth: Require verified email for all admin endpoints
    if (!req.user.emailVerified) {
      return res.status(403).json({
        success: false,
        message: "Admin access denied. Verified email required.",
      });
    }
    return next();
  }

  return res.status(403).json({
    success: false,
    message: "Access denied. Admin privileges required.",
  });
};

module.exports = { admin };