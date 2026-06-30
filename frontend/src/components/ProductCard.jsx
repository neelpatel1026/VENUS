import React from "react";
import { Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import toast from "react-hot-toast";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

import {
  HiOutlineEye,
  HiOutlineShoppingBag,
  HiOutlineHeart,
  HiStar,
} from "react-icons/hi";

import "../styles/product.css";

const ProductCard = ({ product }) => {
  const { user } = useContext(AuthContext);

  const discount =
    product.originalPrice > product.price
      ? Math.round(
          ((product.originalPrice - product.price) / product.originalPrice) *
            100,
        )
      : 0;
  const dispatch = useDispatch();

  return (
    <div className="product-card">
      {/* Badge Section */}
      {/* <div className="card-badges">
        
      </div> */}

      {/* Product Image */}
      {/* <div className="product-image-wrapper">
        <img
          src={product.imageUrl}
          alt={product.name}
          className="product-image"
        />

        
        <div className="product-overlay">
          <Link to={`/product/${product._id}`} className="quick-view-btn">
            <HiOutlineEye />
            <span>Quick View</span>
          </Link>
        </div>
      </div> */}

      {/* Product Image */}
      <div className="product-image-wrapper">
        {discount > 0 && <span className="discount-badge">-{discount}%</span>}

        <img
          src={product.imageUrl}
          alt={product.name}
          className="product-image"
        />

        {/* Hover Overlay */}
        <div className="product-overlay">
          <Link to={`/product/${product._id}`} className="quick-view-btn">
            <HiOutlineEye />
            <span>Quick View</span>
          </Link>
        </div>
      </div>

      {/* Product Info */}
      <div className="product-info">
        {product.category && (
          <p className="product-category">{product.category}</p>
        )}

        <h3 className="product-title">{product.name}</h3>

        {/* Rating */}
        <div className="product-rating">
          <HiStar />
          <span>{product.rating || 4.8}</span>
          {/* <small>
            ({product.reviewsCount || 245})
          </small> */}
          ({product.reviewCount || 245})
        </div>

        {/* Price */}
        <div className="product-price-row">
          <span className="sale-price">₹{product.price}</span>

          {discount > 0 && (
            <span className="old-price">₹{product.originalPrice}</span>
          )}
        </div>

        {/* Savings */}
        {discount > 0 && (
          <p className="save-text">
            Save ₹{product.originalPrice - product.price}
          </p>
        )}

        {/* Stock */}
        <p className="stock-status">
          {product.stock > 0 ? `In Stock (${product.stock})` : "Out Of Stock"}
        </p>

        {/* Buttons */}
        <div className="product-actions">
          {user?.role !== "admin" && (
            <button
              className="cart-btn"
              disabled={product.stock === 0}
              onClick={() => {
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
              <HiOutlineShoppingBag />

              <span>{product.stock > 0 ? "Add To Cart" : "Out Of Stock"}</span>
            </button>
          )}

          <Link to={`/product/${product._id}`} className="details-btn">
            Details
          </Link>
        </div>
      </div>
    </div>
  );
};

export default ProductCard;
