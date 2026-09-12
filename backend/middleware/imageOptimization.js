const { optimizeDiskImage, optimizeBufferImage } = require("../utils/sharpHelper");

const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp", "image/avif"];
const allowedExtensions = [".jpg", ".jpeg", ".png", ".webp", ".avif"];
const maxFileSizeBytes = 5 * 1024 * 1024; // 5MB limit

const isSafeImageFile = (file) => {
  if (!file) return false;
  if (!allowedMimeTypes.includes(file.mimetype)) return false;
  
  const originalName = (file.originalname || "").toLowerCase();
  const ext = require("path").extname(originalName);

  // Reject double extensions (e.g. image.php.png or shell.asp.jpeg)
  const dotCount = (originalName.match(/\./g) || []).length;
  if (dotCount > 1) {
    const parts = originalName.split(".");
    const invalidSubExts = ["php", "php3", "php5", "phtml", "exe", "sh", "bat", "cmd", "js", "html", "htm", "asp", "aspx", "cgi"];
    if (parts.some((p) => invalidSubExts.includes(p))) {
      return false;
    }
  }

  return allowedExtensions.includes(ext);
};

const imageOptimization = async (req, res, next) => {
  try {
    // 1. Single File Processing (Disk Storage)
    if (req.file) {
      if (!isSafeImageFile(req.file)) {
        return res.status(400).json({
          message: "Unsupported or unsafe file format. Please upload JPG, JPEG, PNG, or WebP images.",
        });
      }

      if (req.file.size > maxFileSizeBytes) {
        return res.status(400).json({
          message: "File size exceeds 5MB limit. Please upload a smaller image.",
        });
      }

      await optimizeDiskImage(req.file, 1200);
    }

    // 2. Multiple Files Processing (Memory Storage or Disk Storage Arrays)
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      for (const file of req.files) {
        if (!isSafeImageFile(file)) {
          return res.status(400).json({
            message: `File ${file.originalname || ""} has an unsafe or unsupported format.`,
          });
        }

        if (file.size > maxFileSizeBytes) {
          return res.status(400).json({
            message: `File ${file.originalname || ""} exceeds 5MB size limit.`,
          });
        }

        if (file.buffer) {
          await optimizeBufferImage(file, 800);
        } else if (file.path) {
          await optimizeDiskImage(file, 800);
        }
      }
    }

    next();
  } catch (error) {
    console.error("❌ Image optimization middleware error:", error);
    return res.status(400).json({
      message: "Image optimization failed. Please ensure the file is a valid image.",
    });
  }
};

module.exports = imageOptimization;
