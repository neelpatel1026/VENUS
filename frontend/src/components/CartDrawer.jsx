import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FiX, FiTrash2, FiPlus, FiMinus, FiShoppingBag, FiTruck, FiArrowRight } from "react-icons/fi";
import { setDrawerOpen, removeFromCart, increaseQty, decreaseQty, addToCart } from "../redux/cartSlice";
import { getOptimizedImageUrl } from "../utils/imageHelper";
import api from "../lib/api";
import "../styles/cartDrawer.css";

const FREE_SHIPPING_THRESHOLD = 1500;

const CartDrawer = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const drawerOpen = useSelector((state) => state.cart.drawerOpen);
  const cartItems = useSelector((state) => state.cart.cartItems);

  const [recommendations, setRecommendations] = useState([]);
  const drawerRef = useRef(null);

  // Lock body scroll when drawer is open
  useEffect(() => {
    if (drawerOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [drawerOpen]);

  // Fetch cross-sell recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const cached = localStorage.getItem("venus_products_cache");
        if (cached) {
          const list = JSON.parse(cached);
          if (Array.isArray(list) && list.length > 0) {
            setRecommendations(list.slice(0, 6));
            return;
          }
        }
        const res = await api.get("/api/products");
        if (res.data && Array.isArray(res.data)) {
          setRecommendations(res.data.slice(0, 6));
        }
      } catch (err) {
        console.error("Failed to load cross-sell items:", err);
      }
    };
    if (drawerOpen) {
      fetchRecommendations();
    }
  }, [drawerOpen]);

  // Handle escape key to close drawer
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && drawerOpen) {
        dispatch(setDrawerOpen(false));
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [drawerOpen, dispatch]);

  const handleClose = () => {
    dispatch(setDrawerOpen(false));
  };

  const handleRemove = (productId) => {
    dispatch(removeFromCart(productId));
  };

  const handleIncrease = (productId) => {
    dispatch(increaseQty(productId));
  };

  const handleDecrease = (productId) => {
    dispatch(decreaseQty(productId));
  };

  const handleQuickAdd = (product) => {
    dispatch(
      addToCart({
        ...product,
        productId: product._id,
        qty: 1,
      })
    );
  };

  const subtotal = cartItems.reduce((acc, item) => acc + item.price * item.qty, 0);
  const totalItemsCount = cartItems.reduce((acc, item) => acc + item.qty, 0);
  const shippingProgress = Math.min((subtotal / FREE_SHIPPING_THRESHOLD) * 100, 100);
  const amountNeededForFreeShipping = Math.max(0, FREE_SHIPPING_THRESHOLD - subtotal);
  const qualifiesForFreeShipping = subtotal >= FREE_SHIPPING_THRESHOLD;

  // Filter cross-sell recommendations to exclude items already in the cart
  const filteredRecommendations = recommendations.filter(
    (p) => !cartItems.some((item) => item.productId === p._id)
  );

  return (
    <AnimatePresence>
      {drawerOpen && (
        <>
          {/* Backdrop Overlay */}
          <motion.div
            className="cart-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeOut" }}
            onClick={handleClose}
            aria-hidden="true"
          />

          {/* Cart Drawer Panel Container */}
          <motion.aside
            ref={drawerRef}
            className="cart-drawer-container font-outfit"
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "spring", damping: 28, stiffness: 260, mass: 0.85 }}
            role="dialog"
            aria-modal="true"
            aria-label="Shopping Bag"
          >
            {/* 1. Premium Header */}
            <div className="cart-drawer-header">
              <div className="header-title-row">
                <div className="bag-icon-badge">
                  <FiShoppingBag className="bag-icon" />
                </div>
                <h3 className="drawer-header-title">
                  Shopping Bag ({totalItemsCount})
                </h3>
              </div>
              <button 
                className="cart-drawer-close-btn" 
                onClick={handleClose} 
                aria-label="Close shopping bag"
              >
                <FiX />
              </button>
            </div>

            {/* 2. Free Shipping Section */}
            {cartItems.length > 0 && (
              <div className="cart-drawer-shipping-banner">
                <div className="shipping-banner-heading">
                  <span className="shipping-heading-label">🚚 Free Shipping Progress</span>
                  <span className="shipping-ratio">
                    ₹{subtotal.toFixed(0)} / ₹{FREE_SHIPPING_THRESHOLD}
                  </span>
                </div>
                
                <div className="shipping-subtext-row">
                  {qualifiesForFreeShipping ? (
                    <span className="shipping-unlocked-text">
                      🎉 <strong>Free Shipping Unlocked!</strong> Complimentary express delivery included.
                    </span>
                  ) : (
                    <span>
                      Spend <strong>₹{amountNeededForFreeShipping.toFixed(0)}</strong> more to unlock <strong>FREE SHIPPING</strong>
                    </span>
                  )}
                </div>

                <div className="shipping-progress-track">
                  <motion.div
                    className={`shipping-progress-bar ${qualifiesForFreeShipping ? "unlocked" : ""}`}
                    initial={{ width: 0 }}
                    animate={{ width: `${shippingProgress}%` }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                  />
                </div>
              </div>
            )}

            {/* 3. Scrollable Body Content */}
            <div className="cart-drawer-body">
              {cartItems.length === 0 ? (
                /* Empty Bag State */
                <div className="cart-drawer-empty-state">
                  <div className="empty-bag-illustration">
                    <FiShoppingBag className="empty-bag-icon" />
                  </div>
                  <h4>Your Bag is Empty</h4>
                  <p>Discover our clean, luxury cosmetic rituals and fill your bag with natural radiance.</p>
                  <button className="btn-drawer-continue-shop" onClick={handleClose}>
                    Explore Collection <FiArrowRight />
                  </button>
                </div>
              ) : (
                /* Cart Items List */
                <div className="cart-drawer-items-stack">
                  {cartItems.map((item) => (
                    <motion.div 
                      key={item.productId} 
                      layout
                      initial={{ opacity: 0, y: 10 }}
                      animate={{ opacity: 1, y: 0 }}
                      exit={{ opacity: 0, scale: 0.95 }}
                      transition={{ duration: 0.2 }}
                      className="cart-drawer-item-row"
                    >
                      {/* Product Thumbnail */}
                      <div className="item-row-thumb-box">
                        <img
                          src={getOptimizedImageUrl(item.imageUrl || item.image || "/cosmetic_1.avif", 180)}
                          alt={item.name}
                          className="item-row-thumb"
                          loading="lazy"
                        />
                      </div>

                      {/* Product Center Info */}
                      <div className="item-row-details">
                        <div className="item-row-top">
                          <h4 className="item-row-name" title={item.name}>{item.name}</h4>
                          {item.category && <span className="item-row-category">{item.category}</span>}
                        </div>
                        
                        <div className="item-row-actions-row">
                          {/* Quantity Pill Controls */}
                          <div className="item-qty-adjuster-widget">
                            <button 
                              onClick={() => handleDecrease(item.productId)} 
                              disabled={item.qty <= 1}
                              aria-label={`Decrease quantity of ${item.name}`}
                            >
                              <FiMinus />
                            </button>
                            <span aria-live="polite">{item.qty}</span>
                            <button 
                              onClick={() => handleIncrease(item.productId)} 
                              disabled={item.qty >= item.stock}
                              aria-label={`Increase quantity of ${item.name}`}
                            >
                              <FiPlus />
                            </button>
                          </div>

                          {/* Remove Item Button */}
                          <button 
                            className="item-row-remove-btn" 
                            onClick={() => handleRemove(item.productId)}
                            aria-label={`Remove ${item.name} from bag`}
                            title="Remove item"
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>

                      {/* Product Right Pricing */}
                      <div className="item-row-pricing">
                        <span className="total-item-price">₹{(item.price * item.qty).toFixed(0)}</span>
                        {item.qty > 1 && (
                          <span className="unit-item-price">₹{parseFloat(item.price).toFixed(0)} ea</span>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              )}

              {/* 4. "YOU MAY ALSO LIKE" Cross-Sell Recommendations */}
              {cartItems.length > 0 && filteredRecommendations.length > 0 && (
                <div className="cart-drawer-cross-sell-section">
                  <div className="cross-sell-header">
                    <h4>YOU MAY ALSO LIKE</h4>
                    <span className="cross-sell-subtitle">Complete your luxury skincare ritual</span>
                  </div>
                  
                  <div className="cross-sell-scroll-container">
                    {filteredRecommendations.slice(0, 4).map((product) => (
                      <div key={product._id} className="cross-sell-luxury-card">
                        <div className="cross-sell-thumb-wrapper">
                          <img
                            src={getOptimizedImageUrl(product.imageUrl || product.image || "/cosmetic_1.avif", 160)}
                            alt={product.name}
                            className="cross-sell-thumb"
                            loading="lazy"
                          />
                        </div>
                        <div className="cross-sell-info">
                          <h5 title={product.name}>{product.name}</h5>
                          <div className="cross-sell-price-row">
                            <span className="cross-sell-price">₹{Number(product.price).toFixed(0)}</span>
                            {product.originalPrice > product.price && (
                              <span className="cross-sell-original-price">₹{Number(product.originalPrice).toFixed(0)}</span>
                            )}
                          </div>
                          <button 
                            className="btn-cross-sell-add" 
                            onClick={() => handleQuickAdd(product)}
                            aria-label={`Add ${product.name} to bag`}
                          >
                            + Add to Bag
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>

            {/* 5. Compact Sticky Bottom Checkout Panel */}
            {cartItems.length > 0 && (
              <div className="cart-drawer-footer">
                <div className="footer-subtotal-row">
                  <div className="subtotal-label-group">
                    <span className="subtotal-title">Subtotal</span>
                    <span className="subtotal-note">Taxes & shipping calculated at checkout</span>
                  </div>
                  <strong className="subtotal-amount">₹{subtotal.toFixed(2)}</strong>
                </div>
                
                <button
                  className="btn-footer-checkout-gold"
                  onClick={() => {
                    handleClose();
                    navigate("/checkout");
                  }}
                >
                  <span>Proceed to Checkout</span>
                  <FiArrowRight className="btn-arrow-icon" />
                </button>

                <div className="footer-secondary-links-row">
                  <button 
                    className="footer-link-secondary"
                    onClick={() => {
                      handleClose();
                      navigate("/cart");
                    }}
                  >
                    View Bag ({totalItemsCount})
                  </button>
                  <span className="footer-links-divider">•</span>
                  <button 
                    className="footer-link-secondary" 
                    onClick={handleClose}
                  >
                    Continue Shopping
                  </button>
                </div>
              </div>
            )}
          </motion.aside>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
