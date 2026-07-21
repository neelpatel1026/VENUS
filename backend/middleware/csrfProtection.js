const { hashCsrfToken } = require("../utils/csrfToken");

const parseCookies = (cookieHeader) => {
  const list = {};
  if (!cookieHeader) return list;
  cookieHeader.split(";").forEach((cookie) => {
    const parts = cookie.split("=");
    const name = parts.shift().trim();
    if (name) {
      list[name] = decodeURIComponent(parts.join("="));
    }
  });
  return list;
};

const csrfProtection = (req, res, next) => {
  // 1. Exclude GET, HEAD, OPTIONS requests
  if (["GET", "HEAD", "OPTIONS"].includes(req.method)) {
    return next();
  }

  // 2. Parse Cookies and retrieve token headers
  const cookies = parseCookies(req.headers.cookie);
  const cookieHash = cookies["_csrf_hash"];
  const headerToken = req.headers["x-csrf-token"];

  // 3. Verify presence of hash and token
  if (!cookieHash || !headerToken) {
    return res.status(403).json({
      success: false,
      message: "Security validation failed. Please refresh the page and try again.",
    });
  }

  // 4. Cryptographically compare computed hash to stored cookie hash
  const computedHash = hashCsrfToken(headerToken);
  if (computedHash !== cookieHash) {
    return res.status(403).json({
      success: false,
      message: "Security validation failed. Please refresh the page and try again.",
    });
  }

  next();
};

module.exports = csrfProtection;
