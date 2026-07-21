const crypto = require("crypto");

const generateCsrfToken = () => {
  return crypto.randomBytes(32).toString("hex");
};

const hashCsrfToken = (token) => {
  return crypto
    .createHmac("sha256", process.env.JWT_SECRET || "venus_care_csrf_fallback_secret")
    .update(token)
    .digest("hex");
};

module.exports = { generateCsrfToken, hashCsrfToken };
