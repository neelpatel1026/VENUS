const express = require("express");
const router = express.Router();
const { generateCsrfToken, hashCsrfToken } = require("../utils/csrfToken");

router.get("/token", (req, res) => {
  const token = generateCsrfToken();
  const hash = hashCsrfToken(token);

  const isProd = process.env.NODE_ENV === "production" || process.env.RENDER === "true";
  const cookieOptions = {
    httpOnly: true,
    secure: isProd || process.env.COOKIE_SECURE === "true",
    sameSite: isProd ? "none" : "lax",
    path: "/",
    maxAge: 3600000 * 8, // 8 hours
  };

  res.cookie("_csrf_hash", hash, cookieOptions);
  res.json({ success: true, csrfToken: token });
});

module.exports = router;
