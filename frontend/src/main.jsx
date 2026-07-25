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

        </GoogleMapLoaderProvider>
      </AuthProvider>
    </Provider>
  </React.StrictMode>,
);
