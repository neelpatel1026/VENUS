import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import toast from "react-hot-toast";
import { useContext, useState } from "react";
import { AuthContext } from "../context/AuthContext";
import { getOptimizedImageUrl } from "../utils/imageHelper.js";
import { FaHeart, FaRegHeart, FaStar, FaEye } from "react-icons/fa";
import "../styles/product.css";

const ProductCard = ({ product }) => {
  const { user } = useContext(AuthContext);
  const dispatch = useDispatch();

  // Wishlist persistence hook
  const [isWishlisted, setIsWishlisted] = useState(() => {
    try {
      const list = JSON.parse(localStorage.getItem("venus_care_wishlist") || "[]");
      return list.includes(product._id);
    } catch (e) {
      return false;
    }
  });

  const toggleWishlist = (e) => {
    e.preventDefault();
    e.stopPropagation();
    try {
      const list = JSON.parse(localStorage.getItem("venus_care_wishlist") || "[]");
      let newList;
      if (isWishlisted) {
        newList = list.filter((id) => id !== product._id);
        toast.success("Removed from Wishlist 🖤");
      } else {
        newList = [...list, product._id];
        toast.success("Added to Wishlist! 💖");
      }
      localStorage.setItem("venus_care_wishlist", JSON.stringify(newList));
      setIsWishlisted(!isWishlisted);
    } catch (err) {
      console.error(err);
    }
  };

  const discount =
    product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100,
        )
      : 0;

  const rawImage = product.imageUrl || product.image || "/cosmetic_1.avif";
  const optimizedImage = getOptimizedImageUrl(rawImage, 600);

  const savingsAmount = product.originalPrice - product.price;

  return (
    <div className="product-card-luxury font-outfit">
      
      {/* 1. Image and Badge container */}
      <div className="product-image-container-luxury">
        
        {/* Discount Badge (Shown once here) */}
        {discount > 0 && (
          <span className="luxury-discount-pill">
            -{discount}%
          </span>
        )}

        {/* Wishlist Toggle Action */}
        <button 
          type="button"
          onClick={toggleWishlist}
          className="luxury-wishlist-heart-btn"
          aria-label="Add to Wishlist"
        >
          {isWishlisted ? (
            <FaHeart className="wishlist-icon filled" style={{ color: "#C8A165" }} />
          ) : (
            <FaRegHeart className="wishlist-icon outline" style={{ color: "#1F1F1F" }} />
          )}
        </button>

        {/* Link wraps image for navigation */}
        <Link to={`/product/${product._id}`} className="product-image-click-block">
          <img
            src={optimizedImage}
            alt={product.name}
            className="product-image-img-luxury"
            loading="lazy"
            onError={(e) => {
              e.target.src = "/cosmetic_1.avif";
            }}
          />
        </Link>

        {/* Quick View Hover overlay banner */}
        <Link to={`/product/${product._id}`} className="luxury-quick-view-overlay-btn font-serif">
          <FaEye /> Quick View
        </Link>
      </div>

      {/* 2. Product Metadata Content */}
      <div className="product-details-content-luxury">
        
        {/* Category Label */}
        {product.category && (
          <span className="luxury-category-label">
            {product.category.toUpperCase()}
          </span>
        )}

        {/* Product Title */}
        <h3 className="luxury-product-title">
          <Link to={`/product/${product._id}`}>{product.name}</Link>
        </h3>

        {/* Rating and Reviews block */}
        <div className="luxury-card-rating-block">
          <div className="stars-list-gold">
            {[...Array(5)].map((_, i) => (
              <FaStar 
                key={i} 
                className="star-element"
                style={{ 
                  color: i < Math.round(product.rating || 4.8) ? "#C8A165" : "#E5E7EB" 
                }} 
              />
            ))}
          </div>
          <span className="rating-score-val">{product.rating || 4.8}</span>
          <span className="reviews-total-tag">
            ({product.reviewCount || 124} Verified Reviews)
          </span>
        </div>

        {/* Prices block */}
        <div className="luxury-card-prices-block">
          <span className="luxury-sale-price">₹{product.price}</span>
          
          {discount > 0 && (
            <>
              <span className="luxury-old-price">₹{product.originalPrice}</span>
              <span className="luxury-savings-tag">Save ₹{savingsAmount}</span>
            </>
          )}
        </div>
      </div>

      {/* 3. Action Buttons */}
      <div className="product-action-footer-luxury">
        {user?.role !== "admin" ? (
          <button
            type="button"
            className="luxury-add-to-cart-btn font-serif"
            disabled={product.stock === 0}
            onClick={(e) => {
              e.preventDefault();
              if (product.stock === 0) {
                toast.error("Product is out of stock");
                return;
              }

              dispatch(
                addToCart({
                  ...product,
                  productId: product._id,
                  qty: 1,
                }),
              );

              toast.success(`${product.name} added to cart! 🛍️`);
            }}
          >
            {product.stock > 0 ? "Add To Cart" : "Out Of Stock"}
          </button>
        ) : (
          <Link 
            to={`/product/${product._id}`} 
            className="luxury-add-to-cart-btn font-serif"
            style={{ textAlign: "center", textDecoration: "none" }}
          >
            View Details
          </Link>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
