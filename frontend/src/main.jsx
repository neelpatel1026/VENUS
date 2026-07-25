import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { Provider } from "react-redux";
import { store } from "./redux/store.js";
import { AuthProvider } from "./context/AuthContext.jsx";
import { Toaster, toast, resolveValue } from "react-hot-toast";
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

          {/* TOAST NOTIFICATIONS */}

          <Toaster
            position="top-right"
            containerClassName="premium-toast-container"
            reverseOrder={false}
            toastOptions={{
              className: "premium-toast-card",
              success: {
                className: "premium-toast-card success-toast",
                duration: 2800, // 2.5–3 seconds
                iconTheme: {
                  primary: "#16A34A",
                  secondary: "#ffffff",
                },
              },
              error: {
                className: "premium-toast-card error-toast",
                duration: 5000, // 5 seconds
                iconTheme: {
                  primary: "#DC2626",
                  secondary: "#ffffff",
                },
              },
              loading: {
                className: "premium-toast-card loading-toast",
                duration: Infinity, // Loading holds until resolved
                iconTheme: {
                  primary: "#C8A165",
                  secondary: "#ffffff",
                },
              },
              blank: {
                className: "premium-toast-card info-toast",
                duration: 3000, // 3 seconds
              }
            }}
          >
            {(t) => {
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
                <div 
                  className={`premium-toast-bar-wrapper ${t.visible ? 'active' : ''}`}
                  onTouchStart={handleTouchStart}
                  onTouchEnd={(e) => handleTouchEnd(e, t.id)}
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: "10px",
                    width: "100%",
                    justifyContent: "space-between"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "10px", flex: 1 }}>
                    {t.icon}
                    <div style={{ flex: 1, textAlign: "left", fontSize: "14px", fontWeight: "500" }}>
                      {resolveValue(t.message, t)}
                    </div>
                  </div>
                  {t.type !== 'loading' && (
                    <button 
                      onClick={() => toast.dismiss(t.id)}
                      className="premium-toast-close-btn"
                      aria-label="Close notification"
                    >
                      ×
                    </button>
                  )}
                </div>
              );
            }}
          </Toaster>
        </GoogleMapLoaderProvider>
      </AuthProvider>
    </Provider>
  </React.StrictMode>,
);
