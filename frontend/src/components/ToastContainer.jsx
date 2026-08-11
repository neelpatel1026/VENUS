import React, { useState, useEffect } from "react";
import { Toaster, toast, resolveValue, useToasterStore } from "react-hot-toast";
import { Link } from "react-router-dom";
import { FiCheck, FiHeart, FiTrash2, FiAlertTriangle, FiX, FiShoppingBag } from "react-icons/fi";
import { motion } from "framer-motion";

/* ================= TOAST SYSTEM PARSING & CONTROLS ================= */

const getToastMeta = (t) => {
  const rawMsg = typeof t.message === "string" ? t.message : String(resolveValue(t.message, t));
  
  let type = "success";
  let title = "Success";
  let icon = <FiCheck />;
  let colorClass = "success-toast";
  let showButtons = false;
  let msg = rawMsg;

  // Access product passed in options
  const product = t.product || (t.options && t.options.product);

  // 1. Success added to cart
  if (rawMsg.toLowerCase().includes("added to cart") || product) {
    type = "success";
    title = "Success";
    icon = <FiShoppingBag />;
    colorClass = "success-toast";
    showButtons = true;
    
    if (product) {
      const pName = product.name || product.title || "Product";
      const pImg = product.image || product.imageUrl || product.productImage || (product.images && product.images[0]) || "/cosmetic_1.avif";
      msg = (
        <div className="toast-product-layout">
          <img src={pImg} alt={pName} className="toast-product-thumb" />
          <div className="toast-product-info">
            <span className="toast-product-name">{pName}</span>
            <span className="toast-product-msg">Added to cart successfully</span>
          </div>
        </div>
      );
    } else {
      const cleanProductName = rawMsg.replace(/added to cart!/gi, "").replace(/🛍️|🛍/g, "").trim();
      msg = (
        <>
          <span>✓ <strong>{cleanProductName || "Item"}</strong> added to your cart!</span>
          <span className="toast-subtext">🛍 Continue shopping or checkout.</span>
        </>
      );
    }
  }
  // 2. Wishlist Added
  else if (rawMsg.toLowerCase().includes("wishlist")) {
    type = "wishlist";
    title = "Wishlist";
    icon = <FiHeart />;
    colorClass = "wishlist-toast";
    if (rawMsg.toLowerCase().includes("removed")) {
      icon = <FiTrash2 />;
      colorClass = "removed-toast";
      title = "Removed";
      msg = `🗑 Removed from your wishlist.`;
    } else {
      msg = `❤ Added to your wishlist.`;
    }
  }
  // 3. Removed from Cart
  else if (rawMsg.toLowerCase().includes("removed from cart") || rawMsg.toLowerCase().includes("item removed")) {
    type = "removed";
    title = "Removed";
    icon = <FiTrash2 />;
    colorClass = "removed-toast";
    msg = `🗑 Removed from Cart`;
  }
  // 4. Error/Failed
  else if (t.type === "error" || rawMsg.toLowerCase().includes("failed") || rawMsg.toLowerCase().includes("error") || rawMsg.toLowerCase().includes("unable")) {
    type = "error";
    title = "Error";
    icon = <FiX />;
    colorClass = "error-toast";
    if (rawMsg.toLowerCase().includes("unable to add")) {
      msg = (
        <>
          <span>Unable to add product.</span>
          <span className="toast-subtext">Please try again.</span>
        </>
      );
    }
  }
  // 5. Warning / Low Stock
  else if (rawMsg.toLowerCase().includes("warning") || rawMsg.toLowerCase().includes("stock") || rawMsg.toLowerCase().includes("low")) {
    type = "warning";
    title = "Warning";
    icon = <FiAlertTriangle />;
    colorClass = "warning-toast";
    msg = `⚠ Stock Running Low`;
  }

  return { type, title, icon, colorClass, showButtons, msg };
};

const ToastItem = ({ t }) => {
  const meta = getToastMeta(t);
  const [isHovered, setIsHovered] = useState(false);
  const [remainingTime, setRemainingTime] = useState(t.duration || 3500);

  // Sync remaining duration and handle pause on hover
  useEffect(() => {
    if (t.type === "loading" || t.duration === Infinity) return;
    if (isHovered) return;

    const interval = setInterval(() => {
      setRemainingTime((prev) => {
        if (prev <= 100) {
          clearInterval(interval);
          toast.dismiss(t.id);
          return 0;
        }
        return prev - 100;
      });
    }, 100);

    return () => clearInterval(interval);
  }, [isHovered, t.id, t.type, t.duration]);

  const progressPercent = (remainingTime / (t.duration || 3500)) * 100;

  let touchStartX = 0;
  const handleTouchStart = (e) => {
    touchStartX = e.changedTouches[0].clientX;
  };
  const handleTouchEnd = (e, toastId) => {
    const touchEndX = e.changedTouches[0].clientX;
    const diffX = touchEndX - touchStartX;
    if (Math.abs(diffX) > 80) {
      toast.dismiss(toastId);
    }
  };

  const isProductToast = !!t.product || !!t.options?.product;

  return (
    <motion.div
      layout
      initial={{ x: -60, opacity: 0, scale: 0.92 }}
      animate={t.visible ? { x: 0, opacity: 1, scale: 1 } : { x: -60, opacity: 0, scale: 0.95 }}
      exit={{ x: -60, opacity: 0, scale: 0.95 }}
      transition={{ type: "spring", stiffness: 280, damping: 24, duration: 0.35 }}
      className={`luxury-toast-card ${meta.colorClass}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={(e) => handleTouchEnd(e, t.id)}
      style={{ pointerEvents: "auto" }}
    >
      {!isProductToast && (
        <div className="toast-left-color-circle">
          {meta.icon}
        </div>
      )}
      
      <div className="toast-content-wrapper">
        {!isProductToast && (
          <div className="toast-title-text">{meta.title}</div>
        )}
        <div className="toast-message-body">{meta.msg}</div>
        
        {meta.showButtons && (
          <div className="toast-buttons-row">
            <Link to="/cart" className="toast-action-view-cart-btn" onClick={() => toast.dismiss(t.id)}>
              View Cart →
            </Link>
            <button className="toast-action-continue-btn" onClick={() => toast.dismiss(t.id)}>
              Continue
            </button>
          </div>
        )}
      </div>

      {t.type !== "loading" && (
        <button 
          className="toast-luxury-close-btn" 
          onClick={() => toast.dismiss(t.id)}
          aria-label="Close notification"
        >
          <FiX />
        </button>
      )}

      {/* Progress bar shrinks from 100% to 0% */}
      {t.type !== "loading" && t.duration !== Infinity && (
        <div 
          className="toast-progress-bar-line"
          style={{ width: `${progressPercent}%` }}
        />
      )}
    </motion.div>
  );
};

const ToastManager = () => {
  const { toasts } = useToasterStore();

  useEffect(() => {
    // Limit to maximum 3 notifications
    const activeToasts = toasts.filter((t) => t.visible);
    if (activeToasts.length > 3) {
      const oldest = activeToasts[0];
      setTimeout(() => {
        toast.dismiss(oldest.id);
      }, 0);
    }
  }, [toasts]);

  return null;
};

export const ToastContainer = () => {
  return (
    <>
      <ToastManager />
      <Toaster
        position={window.innerWidth > 768 ? "top-left" : "top-center"}
        containerClassName="premium-toast-container"
        reverseOrder={false}
        toastOptions={{
          success: { duration: 3500 },
          error: { duration: 3500 },
          blank: { duration: 3500 },
        }}
      >
        {(t) => <ToastItem t={t} />}
      </Toaster>
    </>
  );
};
