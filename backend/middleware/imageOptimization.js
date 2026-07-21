const { optimizeDiskImage, optimizeBufferImage } = require("../utils/sharpHelper");

const allowedMimeTypes = ["image/jpeg", "image/png", "image/jpg", "image/webp"];
const maxFileSizeBytes = 10 * 1024 * 1024; // 10MB limit

const imageOptimization = async (req, res, next) => {
  try {
    // 1. Single File Processing (Disk Storage)
    if (req.file) {
      if (!allowedMimeTypes.includes(req.file.mimetype)) {
        return res.status(400).json({
          message: "Unsupported file format. Please upload JPG, JPEG, PNG, or WebP images.",
        });
      }

      if (req.file.size > maxFileSizeBytes) {
        return res.status(400).json({
          message: "File size exceeds 10MB limit. Please upload a smaller image.",
        });
      }

      await optimizeDiskImage(req.file, 1200);
    }

    // 2. Multiple Files Processing (Memory Storage or Disk Storage Arrays)
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      for (const file of req.files) {
        if (!allowedMimeTypes.includes(file.mimetype)) {
          return res.status(400).json({
            message: `File ${file.originalname || ""} is an unsupported format. Upload JPG, JPEG, PNG, or WebP.`,
          });
        }

        if (file.size > maxFileSizeBytes) {
          return res.status(400).json({
            message: `File ${file.originalname || ""} exceeds 10MB size limit.`,
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
