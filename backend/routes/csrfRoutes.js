const express = require("express");
const router = express.Router();
const { generateCsrfToken, hashCsrfToken } = require("../utils/csrfToken");

router.get("/token", (req, res) => {
  const token = generateCsrfToken();
  const hash = hashCsrfToken(token);

  const cookieOptions = {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 3600000 * 8, // 8 hours
  };

  res.cookie("_csrf_hash", hash, cookieOptions);
  res.json({ success: true, csrfToken: token });
});

module.exports = router;
