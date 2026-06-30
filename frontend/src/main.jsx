import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";
import { Provider } from "react-redux";
import { store } from "./redux/store.js";
import { AuthProvider } from "./context/AuthContext.jsx";
import { GoogleOAuthProvider } from "@react-oauth/google";
import { Toaster } from "react-hot-toast";
import "./styles/global.css";

/* ================= ROOT ================= */

const root = ReactDOM.createRoot(document.getElementById("root"));

/* ================= RENDER ================= */

root.render(
  <React.StrictMode>
    <Provider store={store}>
      <AuthProvider>
        <GoogleOAuthProvider clientId={import.meta.env.VITE_GOOGLE_CLIENT_ID}>
          {/* MAIN APP */}

          <App />

          {/* TOAST NOTIFICATIONS */}

          <Toaster
            position="top-right"
            reverseOrder={false}
            toastOptions={{
              duration: 3000,
              style: {
                background: "#111",
                color: "#fff",
                border: "1px solid #333",
                borderRadius: "12px",
              },
            }}
          />
        </GoogleOAuthProvider>
      </AuthProvider>
    </Provider>
  </React.StrictMode>,
);
