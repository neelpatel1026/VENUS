import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { Provider } from "react-redux";
import { store } from "./redux/store.js";
import { AuthProvider } from "./context/AuthContext.jsx";
import { Toaster } from "react-hot-toast";
import "./styles/global.css";
import "./styles/notifications.css";
import "./styles/admin.css";

import { GoogleMapLoaderProvider } from "./components/GoogleMapLoader.jsx";

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
            reverseOrder={false}
            toastOptions={{
              className: "premium-toast-card",
              duration: 3500,
              success: {
                className: "premium-toast-card success-toast",
                iconTheme: {
                  primary: "#16A34A",
                  secondary: "#ffffff",
                },
              },
              error: {
                className: "premium-toast-card error-toast",
                duration: 6000,
                iconTheme: {
                  primary: "#DC2626",
                  secondary: "#ffffff",
                },
              },
              loading: {
                className: "premium-toast-card loading-toast",
                iconTheme: {
                  primary: "#C8A165",
                  secondary: "#ffffff",
                },
              }
            }}
          />
        </GoogleMapLoaderProvider>
      </AuthProvider>
    </Provider>
  </React.StrictMode>,
);
