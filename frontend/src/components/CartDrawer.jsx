import React, { useEffect, useState, useRef } from "react";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { AnimatePresence, motion } from "framer-motion";
import { FiX, FiTrash2, FiPlus, FiMinus, FiShoppingBag, FiCheck } from "react-icons/fi";
import { setDrawerOpen, removeFromCart, increaseQty, decreaseQty, addToCart } from "../redux/cartSlice";
import { getOptimizedImageUrl } from "../utils/imageHelper";
import api from "../lib/api";
import "../styles/cartDrawer.css";

const CartDrawer = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  
  const drawerOpen = useSelector((state) => state.cart.drawerOpen);
  const cartItems = useSelector((state) => state.cart.cartItems);
  const lastAddedProduct = useSelector((state) => state.cart.lastAddedProduct);

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
            setRecommendations(list.slice(0, 3));
            return;
          }
        }
        const res = await api.get("/api/products");
        if (res.data && Array.isArray(res.data)) {
          setRecommendations(res.data.slice(0, 3));
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

  return (
    <AnimatePresence>
      {drawerOpen && (
        <>
          {/* Subtle Overlay Backdrop */}
          <motion.div
            className="cart-drawer-backdrop"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
          />

          {/* Cart Drawer Panel Container */}
          <motion.div
            ref={drawerRef}
            className="cart-drawer-container font-outfit"
            initial={window.innerWidth <= 768 ? { y: "100%", x: 0 } : { x: "100%", y: 0 }}
            animate={window.innerWidth <= 768 ? { y: 0, x: 0 } : { x: 0, y: 0 }}
            exit={window.innerWidth <= 768 ? { y: "100%", x: 0 } : { x: "100%", y: 0 }}
            transition={{ type: "tween", duration: 0.25, ease: "easeOut" }}
          >
            {/* Header */}
            <div className="cart-drawer-header">
              <div className="header-title-row">
                <FiShoppingBag className="bag-icon" />
                <h3>Shopping Bag</h3>
                <span className="cart-count-tag">{totalItemsCount}</span>
              </div>
              <button className="cart-drawer-close-btn" onClick={handleClose} aria-label="Close cart drawer">
                <FiX />
              </button>
            </div>

            {/* Content list body */}
            <div className="cart-drawer-body">
              {/* Added Success Box highlight */}
              {lastAddedProduct && (
                <div className="added-success-alert-card">
                  <div className="alert-badge-success">
                    <FiCheck className="check-success-icon" /> Added successfully
                  </div>
                  <div className="success-product-detail">
                    <img
                      src={getOptimizedImageUrl(lastAddedProduct.imageUrl || lastAddedProduct.image || "/cosmetic_1.avif", 150)}
                      alt=""
                      className="success-product-thumb"
                    />
                    <div className="success-product-info">
                      <h5>{lastAddedProduct.name}</h5>
                      {lastAddedProduct.category && <span className="success-cat">{lastAddedProduct.category}</span>}
                      <div className="success-price-row">
                        <span>Qty: {lastAddedProduct.qty}</span>
                        <strong>₹{parseFloat(lastAddedProduct.price).toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* Items stack scrollable list */}
              {cartItems.length === 0 ? (
                <div className="cart-drawer-empty-state">
                  <span className="empty-state-bag">🛒</span>
                  <h4>Your shopping bag is empty</h4>
                  <p>Explore our premium collections to fill it with beauty care items.</p>
                  <button className="btn-drawer-continue-shop" onClick={handleClose}>
                    Start Shopping
                  </button>
                </div>
              ) : (
                <div className="cart-drawer-items-stack">
                  {cartItems.map((item) => (
                    <div key={item.productId} className="cart-drawer-item-row">
                      <img
                        src={getOptimizedImageUrl(item.imageUrl || item.image || "/cosmetic_1.avif", 150)}
                        alt={item.name}
                        className="item-row-thumb"
                      />
                      <div className="item-row-details">
                        <h4 className="item-row-name">{item.name}</h4>
                        {item.category && <span className="item-row-category">{item.category}</span>}
                        
                        <div className="item-row-actions-row">
                          {/* Qty Controls */}
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

                          {/* Delete Item */}
                          <button 
                            className="item-row-remove-btn" 
                            onClick={() => handleRemove(item.productId)}
                            aria-label={`Remove ${item.name} from shopping bag`}
                          >
                            <FiTrash2 />
                          </button>
                        </div>
                      </div>
                      <div className="item-row-pricing">
                        <strong>₹{(item.price * item.qty).toFixed(2)}</strong>
                        {item.qty > 1 && <span className="single-price">₹{parseFloat(item.price).toFixed(2)} each</span>}
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Cross-Sell Recommendations */}
              {cartItems.length > 0 && recommendations.length > 0 && (
                <div className="cart-drawer-cross-sell-section">
                  <h4 className="cross-sell-title">You may also like</h4>
                  <div className="cross-sell-grid">
                    {recommendations
                      .filter((p) => !cartItems.some((item) => item.productId === p._id))
                      .slice(0, 2)
                      .map((product) => (
                        <div key={product._id} className="cross-sell-item-card">
                          <img
                            src={getOptimizedImageUrl(product.imageUrl || product.image || "/cosmetic_1.avif", 150)}
                            alt={product.name}
                            className="cross-sell-thumb"
                          />
                          <div className="cross-sell-info">
                            <h5>{product.name}</h5>
                            <strong>₹{product.price.toFixed(2)}</strong>
                            <button className="btn-cross-sell-add" onClick={() => handleQuickAdd(product)}>
                              + Add
                            </button>
                          </div>
                        </div>
                      ))}
                  </div>
                </div>
              )}
            </div>

            {/* Footer sticky bottom panel */}
            {cartItems.length > 0 && (
              <div className="cart-drawer-footer">
                {/* Free Shipping Progress Indicator (Threshold ₹1500) */}
                <div className="free-shipping-indicator" style={{ marginBottom: "16px", paddingBottom: "12px", borderBottom: "1px solid #ECE6DC" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#1F2937", marginBottom: "6px" }}>
                    {subtotal >= 1500 ? (
                      <span style={{ color: "#10B981", fontWeight: "600" }}>🎉 You qualify for Free Shipping!</span>
                    ) : (
                      <span>Spend <strong>₹{(1500 - subtotal).toFixed(2)}</strong> more for free shipping</span>
                    )}
                    <span style={{ fontWeight: "700" }}>₹{subtotal.toFixed(2)} / ₹1500.00</span>
                  </div>
                  <div style={{ width: "100%", height: "6px", background: "#FAF7F2", borderRadius: "3px", overflow: "hidden", border: "1px solid #ECE6DC" }}>
                    <div 
                      style={{ 
                        width: `${Math.min((subtotal / 1500) * 100, 100)}%`, 
                        height: "100%", 
                        background: subtotal >= 1500 ? "#10B981" : "#C8A165", 
                        transition: "width 0.4s ease" 
                      }} 
                    />
                  </div>
                </div>

                <div className="footer-subtotal-row">
                  <span>Subtotal</span>
                  <strong>₹{subtotal.toFixed(2)}</strong>
                </div>
                <p className="shipping-tax-info">Shipping fees and discount codes applied at checkout.</p>
                
                <div className="footer-actions-buttons">
                  <button
                    className="btn-footer-view-bag"
                    onClick={() => {
                      handleClose();
                      navigate("/cart");
                    }}
                  >
                    View Bag
                  </button>
                  <button
                    className="btn-footer-checkout-gold"
                    onClick={() => {
                      handleClose();
                      navigate("/checkout");
                    }}
                  >
                    Proceed to Checkout
                  </button>
                </div>

                <button className="btn-drawer-footer-continue" onClick={handleClose}>
                  Continue Shopping
                </button>
              </div>
            )}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
};

export default CartDrawer;
