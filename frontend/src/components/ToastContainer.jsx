import React, { useEffect } from "react";
import { Toaster, toast, resolveValue, useToasterStore } from "react-hot-toast";
import { Link } from "react-router-dom";
import { FiCheck, FiHeart, FiTrash2, FiAlertTriangle, FiX } from "react-icons/fi";
import { motion } from "framer-motion";

/* ================= LUXURY TOAST SYSTEM PARSING & CONTROLS ================= */

const getToastMeta = (t) => {
  const resolved = resolveValue(t.message, t);
  let rawMsg = "";
  let isCustomElement = false;

  if (React.isValidElement(resolved)) {
    isCustomElement = true;
  } else if (typeof resolved === "string") {
    rawMsg = resolved;
  } else if (resolved && typeof resolved === "object") {
    rawMsg = resolved.message || resolved.error || "Notification";
  } else {
    rawMsg = String(resolved || "");
  }

  if (rawMsg === "[object Object]") {
    rawMsg = "Notification";
  }
  
  let type = t.type || "success";
  let title = type === "error" ? "Error" : "Success";
  let icon = <FiCheck />;
  let colorClass = "success-toast";
  let isCartSuccess = false;
  let productData = null;

  // Access product passed in options or toast object
  const product = t.product || (t.options && t.options.product);

  // 1. Success added to cart
  if (
    rawMsg.toLowerCase().includes("added to cart") ||
    rawMsg.toLowerCase().includes("shopping bag") ||
    rawMsg.toLowerCase().includes("combo pack added") ||
    product
  ) {
    type = "cart-success";
    title = "Added to Cart";
    colorClass = "success-toast cart-success-toast";
    isCartSuccess = true;

    if (product) {
      productData = {
        name: product.name || product.title || "VENUS CARE Product",
        image: product.imageUrl || product.image || product.productImage || (product.images && product.images[0]) || "/cosmetic_1.avif"
      };
    } else {
      const cleanProductName = rawMsg
        .replace(/added to cart!?/gi, "")
        .replace(/added to your shopping bag!?/gi, "")
        .replace(/added to shopping bag!?/gi, "")
        .replace(/combo pack added to cart!?/gi, "Combo Pack")
        .replace(/🛍️|🛍|✓|!/g, "")
        .trim();

      productData = {
        name: cleanProductName || "VENUS CARE Product",
        image: "/cosmetic_1.avif"
      };
    }
  }
  // 2. Wishlist Added / Removed
  else if (rawMsg.toLowerCase().includes("wishlist")) {
    type = "wishlist";
    title = "Wishlist";
    icon = <FiHeart />;
    colorClass = "wishlist-toast";
    if (rawMsg.toLowerCase().includes("removed")) {
      icon = <FiTrash2 />;
      colorClass = "removed-toast";
      title = "Removed";
    }
  }
  // 3. Removed from Cart
  else if (rawMsg.toLowerCase().includes("removed from cart") || rawMsg.toLowerCase().includes("item removed")) {
    type = "removed";
    title = "Removed";
    icon = <FiTrash2 />;
    colorClass = "removed-toast";
  }
  // 4. Error / Failed
  else if (t.type === "error" || rawMsg.toLowerCase().includes("failed") || rawMsg.toLowerCase().includes("error") || rawMsg.toLowerCase().includes("unable")) {
    type = "error";
    title = "Error";
    icon = <FiX />;
    colorClass = "error-toast";
  }
  // 5. Warning / Low Stock
  else if (rawMsg.toLowerCase().includes("warning") || rawMsg.toLowerCase().includes("stock") || rawMsg.toLowerCase().includes("low")) {
    type = "warning";
    title = "Warning";
    icon = <FiAlertTriangle />;
    colorClass = "warning-toast";
  }

  return { type, title, icon, colorClass, isCartSuccess, productData, rawMsg, isCustomElement, resolved };
};

const ToastItem = ({ t }) => {
  const meta = getToastMeta(t);

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

  // Custom interactive JSX elements
  if (meta.isCustomElement) {
    return (
      <motion.div
        layout
        initial={{ y: -16, opacity: 0, scale: 0.96 }}
        animate={t.visible ? { y: 0, opacity: 1, scale: 1 } : { y: -16, opacity: 0, scale: 0.96 }}
        exit={{ y: -16, opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="luxury-toast-card"
        onTouchStart={handleTouchStart}
        onTouchEnd={(e) => handleTouchEnd(e, t.id)}
        style={{ pointerEvents: "auto", padding: "16px", minWidth: "300px" }}
      >
        {meta.resolved}
      </motion.div>
    );
  }

  // Cart Success Notification (Bellavita-style luxury card)
  if (meta.isCartSuccess && meta.productData) {
    return (
      <motion.div
        layout
        initial={{ y: -16, opacity: 0, scale: 0.96 }}
        animate={t.visible ? { y: 0, opacity: 1, scale: 1 } : { y: -16, opacity: 0, scale: 0.96 }}
        exit={{ y: -16, opacity: 0, scale: 0.96 }}
        transition={{ duration: 0.22, ease: "easeOut" }}
        className="luxury-toast-card luxury-cart-success-card"
        onTouchStart={handleTouchStart}
        onTouchEnd={(e) => handleTouchEnd(e, t.id)}
        style={{ pointerEvents: "auto" }}
      >
        {/* Close Button */}
        <button
          type="button"
          className="luxury-toast-close-btn"
          onClick={() => toast.dismiss(t.id)}
          aria-label="Close notification"
        >
          <FiX />
        </button>

        {/* Product Image */}
        <div className="cart-toast-image-wrapper">
          <img
            src={meta.productData.image}
            alt={meta.productData.name}
            className="cart-toast-img"
            onError={(e) => {
              e.target.src = "/cosmetic_1.avif";
            }}
          />
        </div>

        {/* Product Info & Action Buttons */}
        <div className="cart-toast-body">
          <div className="cart-toast-text-block">
            <h4 className="cart-toast-product-name">{meta.productData.name}</h4>
            <p className="cart-toast-success-subtext">Added to cart successfully</p>
          </div>

          <div className="cart-toast-actions-row">
            <Link
              to="/cart"
              className="cart-toast-view-cart-btn"
              onClick={() => toast.dismiss(t.id)}
            >
              VIEW CART →
            </Link>
            <button
              type="button"
              className="cart-toast-continue-btn"
              onClick={() => toast.dismiss(t.id)}
            >
              CONTINUE
            </button>
          </div>
        </div>
      </motion.div>
    );
  }

  // Standard non-cart notification
  return (
    <motion.div
      layout
      initial={{ y: -16, opacity: 0, scale: 0.96 }}
      animate={t.visible ? { y: 0, opacity: 1, scale: 1 } : { y: -16, opacity: 0, scale: 0.96 }}
      exit={{ y: -16, opacity: 0, scale: 0.96 }}
      transition={{ duration: 0.22, ease: "easeOut" }}
      className={`luxury-toast-card ${meta.colorClass}`}
      onTouchStart={handleTouchStart}
      onTouchEnd={(e) => handleTouchEnd(e, t.id)}
      style={{ pointerEvents: "auto" }}
    >
      <div className="toast-left-color-circle">
        {meta.icon}
      </div>

      <div className="toast-content-wrapper">
        <div className="toast-title-text">{meta.title}</div>
        <div className="toast-message-body">{meta.rawMsg}</div>
      </div>

      {t.type !== "loading" && (
        <button
          type="button"
          className="luxury-toast-close-btn"
          onClick={() => toast.dismiss(t.id)}
          aria-label="Close notification"
        >
          <FiX />
        </button>
      )}
    </motion.div>
  );
};

const ToastManager = () => {
  const { toasts } = useToasterStore();

  useEffect(() => {
    // Limit to maximum 2 active notifications
    const activeToasts = toasts.filter((t) => t.visible);
    if (activeToasts.length > 2) {
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
          duration: 3500,
        }}
      >
        {(t) => <ToastItem t={t} />}
      </Toaster>
    </>
  );
};
