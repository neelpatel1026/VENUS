import React, { useState, useEffect } from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { Provider } from "react-redux";
import { store } from "./redux/store.js";
import { AuthProvider } from "./context/AuthContext.jsx";
import { Toaster, toast, resolveValue, useToasterStore } from "react-hot-toast";
import { Link } from "react-router-dom";
import { FiCheck, FiHeart, FiTrash2, FiAlertTriangle, FiX, FiShoppingBag } from "react-icons/fi";
import { motion } from "framer-motion";
import "./styles/global.css";
import "./styles/notifications.css";
import "./styles/admin.css";

import { GoogleMapLoaderProvider } from "./components/GoogleMapLoader.jsx";

// Monkeypatch toast globally to support deduplication and error recovery
const originalToast = toast;
const wrapToastMethod = (originalMethod) => {
  return (message, options = {}) => {
    if (typeof message === "string" && window._activeToastMessages?.has(message)) {
      if (!options || !options.id) {
        return null;
      }
    }

    if (originalMethod === originalToast.success) {
      originalToast.dismiss();
    }

    return originalMethod(message, options);
  };
};

const newToast = wrapToastMethod(originalToast);
newToast.success = wrapToastMethod(originalToast.success);
newToast.error = wrapToastMethod(originalToast.error);
newToast.loading = wrapToastMethod(originalToast.loading);
newToast.custom = wrapToastMethod(originalToast.custom);
newToast.dismiss = originalToast.dismiss;
newToast.remove = originalToast.remove;

Object.assign(toast, newToast);

/* ================= TOAST SYSTEM PARSING & CONTROLS ================= */

const getToastMeta = (t) => {
  const rawMsg = String(resolveValue(t.message, t));
  
  let type = "success";
  let title = "Success";
  let icon = <FiCheck />;
  let colorClass = "success-toast";
  let showButtons = false;
  let msg = rawMsg;

  // 1. Success added to cart
  if (rawMsg.toLowerCase().includes("added to cart")) {
    type = "success";
    title = "Success";
    icon = <FiShoppingBag />;
    colorClass = "success-toast";
    showButtons = true;
    
    const cleanProductName = rawMsg.replace(/added to cart!/gi, "").replace(/🛍️|🛍/g, "").trim();
    msg = (
      <>
        <span>✓ <strong>VENUS CARE {cleanProductName}</strong> added to your cart!</span>
        <span className="toast-subtext">🛍 Continue shopping or checkout anytime.</span>
      </>
    );
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
  const [remainingTime, setRemainingTime] = useState(t.duration || 3000);

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

  const progressPercent = (remainingTime / (t.duration || 3000)) * 100;

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

  return (
    <motion.div
      layout
      initial={window.innerWidth > 768 ? { x: -150, opacity: 0, scale: 0.85 } : { y: -100, opacity: 0, scale: 0.9 }}
      animate={t.visible ? { x: 0, y: 0, opacity: 1, scale: 1 } : { opacity: 0, scale: 0.9 }}
      exit={{ opacity: 0, scale: 0.85, y: -20 }}
      transition={{ type: "spring", stiffness: 220, damping: 22 }}
      className={`luxury-toast-card ${meta.colorClass}`}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onTouchStart={handleTouchStart}
      onTouchEnd={(e) => handleTouchEnd(e, t.id)}
      style={{ pointerEvents: "auto" }}
    >
      <div className="toast-left-color-circle">
        {meta.icon}
      </div>
      
      <div className="toast-content-wrapper">
        <div className="toast-title-text">{meta.title}</div>
        <div className="toast-message-body">{meta.msg}</div>
        
        {meta.showButtons && (
          <div className="toast-buttons-row">
            <Link to="/cart" className="toast-action-view-cart-btn" onClick={() => toast.dismiss(t.id)}>
              View Cart
            </Link>
            <button className="toast-action-continue-btn" onClick={() => toast.dismiss(t.id)}>
              Continue Shopping
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
      toast.dismiss(oldest.id);
    }
  }, [toasts]);

  return null;
};

/* ================= ROOT ================= */

const root = ReactDOM.createRoot(document.getElementById("root"));

/* ================= RENDER ================= */

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <AuthProvider>
        <GoogleMapLoaderProvider>
          {/* MAIN APP */}

          <App />

          {/* TOAST NOTIFICATIONS */}

          <ToastManager />
          <Toaster
            position="top-left"
            containerClassName="premium-toast-container"
            reverseOrder={false}
            toastOptions={{
              success: { duration: 3000 },
              error: { duration: 5000 },
              blank: { duration: 3000 },
            }}
          >
            {(t) => <ToastItem t={t} />}
          </Toaster>
        </GoogleMapLoaderProvider>
      </AuthProvider>
    </Provider>
  </React.StrictMode>,
);
