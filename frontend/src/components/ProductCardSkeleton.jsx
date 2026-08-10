import React from "react";
import "../styles/productSkeleton.css";

const ProductCardSkeleton = () => {
  return (
    <div className="product-card-skeleton-luxury">
      {/* 1. Image Shimmer Box */}
      <div className="skeleton-image-wrapper shimmer-effect-pulsing" />

      {/* 2. Category Label */}
      <div className="skeleton-text-line category-width shimmer-effect-pulsing" />

      {/* 3. Title Line */}
      <div className="skeleton-text-line title-width shimmer-effect-pulsing" />

      {/* 4. Rating Stars */}
      <div className="skeleton-rating-row">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="skeleton-star shimmer-effect-pulsing" />
        ))}
        <div className="skeleton-text-line rating-num-width shimmer-effect-pulsing" />
      </div>

      {/* 5. Pricing Row */}
      <div className="skeleton-price-row">
        <div className="skeleton-text-line price-width shimmer-effect-pulsing" />
      </div>

      {/* 6. Action Button */}
      <div className="skeleton-btn-action shimmer-effect-pulsing" />
    </div>
  );
};

export default React.memo(ProductCardSkeleton);
