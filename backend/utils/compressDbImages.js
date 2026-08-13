const mongoose = require("mongoose");
const axios = require("axios");
const sharp = require("sharp");
const cloudinary = require("../config/cloudinary");
const Product = require("../models/Product");
require("dotenv").config();

async function optimizeCloudinaryImages() {
  try {
    if (!process.env.MONGO_URI) {
      console.error("MONGO_URI environment variable is missing!");
      return;
    }
    
    console.log("Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected successfully!");

    const products = await Product.find({});
    console.log(`Found ${products.length} products to process.`);

    for (const product of products) {
      console.log(`\n--------------------------------------------------`);
      console.log(`Processing Product: ${product.name} (ID: ${product._id})`);
      
      // 1. Optimize Main Image
      if (product.imageUrl && product.imageUrl.startsWith("http")) {
        try {
          console.log(`Downloading main image: ${product.imageUrl}`);
          const response = await axios({
            url: product.imageUrl,
            responseType: "arraybuffer"
          });
          const originalBuffer = Buffer.from(response.data);
          const originalSizeKb = (originalBuffer.length / 1024).toFixed(1);

          console.log(`Optimizing main image with Sharp (WebP, Max 1200px, Quality 78)...`);
          const optimizedBuffer = await sharp(originalBuffer)
            .resize({ width: 1200, height: 1200, fit: sharp.fit.inside, withoutEnlargement: true })
            .webp({ quality: 78 })
            .toBuffer();
          const optimizedSizeKb = (optimizedBuffer.length / 1024).toFixed(1);

          console.log(`Uploading optimized main image to Cloudinary...`);
          const uploadResult = await new Promise((resolve, reject) => {
            const stream = cloudinary.uploader.upload_stream(
              { folder: "venus-products", format: "webp" },
              (error, result) => {
                if (error) reject(error);
                else resolve(result);
              }
            );
            stream.end(optimizedBuffer);
          });

          console.log(`[Main Image] Before: ${originalSizeKb} KB | After: ${optimizedSizeKb} KB | URL: ${uploadResult.secure_url}`);
          product.imageUrl = uploadResult.secure_url;
        } catch (err) {
          console.error(`Failed to process main image for ${product.name}:`, err.message);
        }
      }

      // 2. Optimize Gallery Images
      if (product.gallery && product.gallery.length > 0) {
        const optimizedGallery = [];
        for (let i = 0; i < product.gallery.length; i++) {
          const imgUrl = product.gallery[i];
          if (imgUrl && imgUrl.startsWith("http")) {
            try {
              console.log(`Downloading gallery image ${i + 1}/${product.gallery.length}: ${imgUrl}`);
              const response = await axios({
                url: imgUrl,
                responseType: "arraybuffer"
              });
              const originalBuffer = Buffer.from(response.data);
              const originalSizeKb = (originalBuffer.length / 1024).toFixed(1);

              console.log(`Optimizing gallery image with Sharp...`);
              const optimizedBuffer = await sharp(originalBuffer)
                .resize({ width: 1200, height: 1200, fit: sharp.fit.inside, withoutEnlargement: true })
                .webp({ quality: 78 })
                .toBuffer();
              const optimizedSizeKb = (optimizedBuffer.length / 1024).toFixed(1);

              console.log(`Uploading optimized gallery image to Cloudinary...`);
              const uploadResult = await new Promise((resolve, reject) => {
                const stream = cloudinary.uploader.upload_stream(
                  { folder: "venus-products", format: "webp" },
                  (error, result) => {
                    if (error) reject(error);
                    else resolve(result);
                  }
                );
                stream.end(optimizedBuffer);
              });

              console.log(`[Gallery ${i + 1}] Before: ${originalSizeKb} KB | After: ${optimizedSizeKb} KB`);
              optimizedGallery.push(uploadResult.secure_url);
            } catch (err) {
              console.error(`Failed to process gallery image ${i + 1}:`, err.message);
              optimizedGallery.push(imgUrl); // fallback to original
            }
          } else {
            optimizedGallery.push(imgUrl);
          }
        }
        product.gallery = optimizedGallery;
      }

      // Save changes back to database
      await product.save();
      console.log(`Saved optimized URLs for: ${product.name}`);
    }

    console.log("\n==================================================");
    console.log("Image optimization migration task completed successfully!");
    process.exit(0);
  } catch (error) {
    console.error("Migration failed with error:", error);
    process.exit(1);
  }
}

optimizeCloudinaryImages();
