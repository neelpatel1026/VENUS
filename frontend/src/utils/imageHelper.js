/**
 * Utility to deliver optimized CDN image URLs (using Cloudinary dynamic transformations).
 * Supports automatic WebP/AVIF formatting, quality adjustments, and responsive thumbnail scaling.
 */
export const getOptimizedImageUrl = (url, width = 800) => {
  if (!url || typeof url !== "string") return "/placeholder.jpg";

  // Check if the URL is hosted on Cloudinary
  if (url.includes("res.cloudinary.com") && url.includes("/upload/")) {
    const transformationString = `f_auto,q_auto,w_${width},c_limit/`;
    return url.replace("/upload/", `/upload/${transformationString}`);
  }

  // Fallback for non-Cloudinary images
  return url;
};

/**
 * Convenience helper for small lightweight thumbnails (e.g. cart, search, tables).
 */
export const getThumbnailUrl = (url) => {
  return getOptimizedImageUrl(url, 200);
};
