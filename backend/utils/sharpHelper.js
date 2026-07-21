const sharp = require("sharp");
const fs = require("fs");
const path = require("path");

/**
 * Optimizes a local image file on disk, converting to WebP and reducing dimensions if oversized.
 * Updates the file info on the multer req.file object.
 */
const optimizeDiskImage = async (file, maxDimension = 1200) => {
  try {
    const originalPath = file.path;
    const dir = path.dirname(originalPath);
    const filename = path.basename(originalPath, path.extname(originalPath));
    const optimizedPath = path.join(dir, `${filename}_optimized.webp`);

    // Perform Sharp processing
    await sharp(originalPath)
      .resize({
        width: maxDimension,
        height: maxDimension,
        fit: sharp.fit.inside,
        withoutEnlargement: true,
      })
      .webp({ quality: 82 })
      .toFile(optimizedPath);

    // Delete the original file
    if (fs.existsSync(originalPath)) {
      fs.unlinkSync(originalPath);
    }

    // Update Multer file properties
    file.path = optimizedPath;
    file.filename = `${filename}_optimized.webp`;
    file.mimetype = "image/webp";
    file.originalname = `${path.basename(file.originalname, path.extname(file.originalname))}.webp`;
    
    // Get new file size
    const stats = fs.statSync(optimizedPath);
    file.size = stats.size;

    return file;
  } catch (error) {
    console.error("❌ Sharp optimization on disk failed:", error.message);
    throw error;
  }
};

/**
 * Optimizes an in-memory file buffer (Multer memoryStorage).
 * Updates the file properties in-place.
 */
const optimizeBufferImage = async (file, maxDimension = 800) => {
  try {
    const originalSize = file.buffer.length;

    const optimizedBuffer = await sharp(file.buffer)
      .resize({
        width: maxDimension,
        height: maxDimension,
        fit: sharp.fit.inside,
        withoutEnlargement: true,
      })
      .webp({ quality: 80 })
      .toBuffer();

    file.buffer = optimizedBuffer;
    file.mimetype = "image/webp";
    file.originalname = `${path.basename(file.originalname, path.extname(file.originalname))}.webp`;
    file.size = optimizedBuffer.length;

    const compressionRatio = ((originalSize - file.size) / originalSize) * 100;
    console.log(`[Sharp] In-memory optimized: ${file.originalname} | Compression: ${compressionRatio.toFixed(1)}%`);

    return file;
  } catch (error) {
    console.error("❌ Sharp optimization in memory failed:", error.message);
    throw error;
  }
};

module.exports = { optimizeDiskImage, optimizeBufferImage };
