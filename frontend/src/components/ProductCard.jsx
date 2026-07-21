import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import toast from "react-hot-toast";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { getOptimizedImageUrl } from "../utils/imageHelper.js";
import "../styles/product.css";

const ProductCard = ({ product }) => {
  const { user } = useContext(AuthContext);
  const dispatch = useDispatch();

  const discount =
    product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100,
        )
      : 0;

  const rawImage = product.imageUrl || product.image || "/cosmetic_1.avif";
  const optimizedImage = getOptimizedImageUrl(rawImage, 600);

  return (
    <div className="product-card">
      <Link to={`/product/${product._id}`} className="product-card-link">
        {/* Product Image Wrapper (Occupies 75% height) */}
        <div className="product-image-wrapper">
          {discount > 0 && <span className="discount-badge">-{discount}%</span>}

          <img
            src={optimizedImage}
            alt={product.name}
            className="product-image"
            loading="lazy"
            onError={(e) => {
              e.target.src = "/cosmetic_1.avif";
            }}
          />
        </div>

        {/* Product Info */}
        <div className="product-info">
          {product.category && (
            <p className="product-category">{product.category}</p>
          )}

          <h3 className="product-title">{product.name}</h3>

          <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "0.85rem", color: "#F59E0B", marginBottom: "8px" }}>
            <span style={{ display: "flex", gap: "1px" }}>
              {[...Array(5)].map((_, i) => (
                <svg key={i} xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" style={{ width: "13px", height: "13px", color: i < Math.round(product.rating || 4.8) ? "#C8A165" : "#E5E7EB" }}>
                  <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                </svg>
              ))}
            </span>
            <span style={{ color: "#1A1A1A", fontWeight: "600", fontSize: "12px", marginLeft: "2px" }}>({product.rating || 4.8})</span>
            <span style={{ color: "#6B7280", fontSize: "12px" }}>• {product.reviewCount || 0} reviews</span>
          </div>

          {/* Clean Price Row */}
          <div className="product-price-row">
            <span className="sale-price">₹{product.price}</span>

            {discount > 0 && (
              <span className="old-price">₹{product.originalPrice}</span>
            )}
            
            {discount > 0 && (
              <span className="discount-tag">{discount}% OFF</span>
            )}
          </div>
        </div>
      </Link>

      {/* Single elegant button */}
      <div className="product-actions">
        {user?.role !== "admin" ? (
          <button
            className="cart-btn"
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

              toast.success(`${product.name} added to cart`);
            }}
          >
            <span>{product.stock > 0 ? "Add To Cart" : "Out Of Stock"}</span>
          </button>
        ) : (
          <Link to={`/product/${product._id}`} className="cart-btn">
            <span>View Product</span>
          </Link>
        )}
      </div>
    </div>
  );
};

export default ProductCard;
