import React, { useEffect } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import toast from "react-hot-toast";

// 1. Axios global configurations and request/response interceptors
axios.defaults.withCredentials = true;
axios.interceptors.request.use(
  async (config) => {
    const method = (config.method || "get").toLowerCase();
    const isStateChanging = ["post", "put", "delete", "patch"].includes(method);
    
    // Skip if bypass header is explicitly provided
    if (isStateChanging && config.headers?.["x-csrf-bypass"] !== "true") {
      let csrfToken = window._csrfToken;
      if (!csrfToken) {
        try {
          const res = await axios.get("/api/csrf/token", {
            headers: { "x-csrf-bypass": "true" }
          });
          csrfToken = res.data.csrfToken;
          window._csrfToken = csrfToken;
        } catch (err) {
          console.error("Failed to retrieve CSRF token via Axios", err);
        }
      }
      if (csrfToken) {
        config.headers["X-CSRF-Token"] = csrfToken;
      }
    }
    return config;
  },
  (error) => Promise.reject(error)
);

axios.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response && error.response.status === 429) {
      toast.error(error.response.data?.message || "Too many requests. Please slow down and try again.", {
        id: "rate-limit-toast",
      });
    }
    return Promise.reject(error);
  }
);

// 2. Native fetch global monkeypatch for non-Axios operations
const originalFetch = window.fetch;
window.fetch = async function (url, options = {}) {
  const method = (options.method || "GET").toUpperCase();
  const isStateChanging = ["POST", "PUT", "DELETE", "PATCH"].includes(method);
  
  if (isStateChanging && url.toString().startsWith("/api/")) {
    let csrfToken = window._csrfToken;
    if (!csrfToken) {
      try {
        const res = await originalFetch("/api/csrf/token");
        if (res.ok && res.headers.get("content-type")?.includes("application/json")) {
          const data = await res.json();
          csrfToken = data.csrfToken;
          window._csrfToken = csrfToken;
        }
      } catch (err) {
        console.error("Failed to retrieve CSRF token via fetch", err);
      }
    }
    if (csrfToken) {
      options.headers = {
        ...options.headers,
        "X-CSRF-Token": csrfToken,
      };
    }
  }
  const response = await originalFetch(url, options);
  if (response.status === 429) {
    toast.error("Too many requests. Please slow down and try again.", {
      id: "rate-limit-toast",
    });
  }
  return response;
};

import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import OfferBar from "./components/OfferBar";
import ErrorBoundary from "./components/ErrorBoundary.jsx";

/* PAGES */

import Home from "./pages/Home.jsx";
import Shop from "./pages/Shop.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import Gifting from "./pages/Gifting.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Profile from "./pages/Profile.jsx";
import OrderSuccess from "./pages/OrderSuccess.jsx";
const About = React.lazy(() => import("./pages/About.jsx"));
const Disclaimer = React.lazy(() => import("./pages/Disclaimer.jsx"));
const ReturnPolicy = React.lazy(() => import("./pages/ReturnPolicy.jsx"));
const ForgotPassword = React.lazy(() => import("./pages/ForgotPassword.jsx"));
const OrderDetails = React.lazy(() => import("./pages/OrderDetails.jsx"));
const MyAddresses = React.lazy(() => import("./pages/MyAddresses.jsx"));
const ReturnRequest = React.lazy(() => import("./pages/ReturnRequest"));
const ReturnSuccess = React.lazy(() => import("./pages/ReturnSuccess.jsx"));
const MyReturns = React.lazy(() => import("./pages/MyReturns"));
const EditProfile = React.lazy(() => import("./pages/EditProfile.jsx"));
const Contact = React.lazy(() => import("./pages/Contact.jsx"));
const MyComplaints = React.lazy(() => import("./pages/MyComplaints.jsx"));
const PrivacyPolicy = React.lazy(() => import("./pages/PrivacyPolicy.jsx"));
const TermsConditions = React.lazy(() => import("./pages/TermsConditions.jsx"));
const ShippingPolicy = React.lazy(() => import("./pages/ShippingPolicy.jsx"));
const FAQ = React.lazy(() => import("./pages/FAQ.jsx"));

/* ADMIN */

const AdminDashboard = React.lazy(() => import("./admin/AdminDashboard.jsx"));
const AddProduct = React.lazy(() => import("./admin/AddProduct.jsx"));
const AdminProducts = React.lazy(() => import("./admin/AdminProducts.jsx"));
const EditProduct = React.lazy(() => import("./admin/EditProduct.jsx"));
const AdminOrders = React.lazy(() => import("./admin/AdminOrders.jsx"));
const AdminUsers = React.lazy(() => import("./admin/AdminUsers.jsx"));
const AdminOrderDetails = React.lazy(() => import("./admin/AdminOrderDetails.jsx"));
const AdminUserDetails = React.lazy(() => import("./admin/AdminUserDetails.jsx"));
const AdminReturns = React.lazy(() => import("./admin/AdminReturns"));
const AdminComplaints = React.lazy(() => import("./admin/AdminComplaints.jsx"));
const AdminComplaintDetails = React.lazy(() => import("./admin/AdminComplaintDetails.jsx"));
const AdminReviews = React.lazy(() => import("./admin/AdminReviews.jsx"));
const AdminCoupons = React.lazy(() => import("./admin/AdminCoupons.jsx"));

import ProtectedRoute from "./components/ProtectedRoute";

/* OPTIONAL 404 PAGE */

const NotFound = () => {
  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        color: "#1A1A1A",
        fontSize: "2rem",
      }}
    >
      404 | Page Not Found
    </div>
  );
};

const PageLoader = () => (
  <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
    <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid #E8DFD2", borderTopColor: "#C8A96B", animation: "spin 1s linear infinite" }}></div>
    <style>{`
      @keyframes spin {
        0% { transform: rotate(0deg); }
        100% { transform: rotate(360deg); }
      }
    `}</style>
  </div>
);

function App() {
  return (
    <Router>
      {/* AUTO SCROLL TOP */}

      <ScrollToTop />

      {/* NAVBAR */}

      <OfferBar />
      <Navbar />

      {/* MAIN CONTENT */}

      <div className="main-content">
        <ErrorBoundary>
          <React.Suspense fallback={<PageLoader />}>
            <Routes>
              {/* USER ROUTES */}
              <Route path="/" element={<Home />} />
              <Route path="/shop" element={<Shop />} />
              <Route path="/gifting" element={<Gifting />} />
              <Route path="/product/:id" element={<ProductDetail />} />
              <Route path="/cart" element={<Cart />} />
              <Route
                path="/checkout"
                element={
                  <ProtectedRoute>
                    <Checkout />
                  </ProtectedRoute>
                }
              />
              <Route path="/login" element={<Login />} />
              <Route path="/register" element={<Register />} />
              <Route
                path="/profile"
                element={
                  <ProtectedRoute>
                    <Profile />
                  </ProtectedRoute>
                }
              />
              <Route
                path="/my-addresses"
                element={
                  <ProtectedRoute>
                    <MyAddresses />
                  </ProtectedRoute>
                }
              />
              <Route path="/ordersuccess" element={<OrderSuccess />} />
              <Route path="/forgot-password" element={<ForgotPassword />} />
              <Route
                path="/my-returns"
                element={
                  <ProtectedRoute>
                    <MyReturns />
                  </ProtectedRoute>
                }
              />
              <Route path="/edit-profile" element={<EditProfile />} />
              <Route path="/about" element={<About />} />
              <Route path="/contact" element={<Contact />} />
              <Route
                path="/my-complaints"
                element={
                  <ProtectedRoute>
                    <MyComplaints />
                  </ProtectedRoute>
                }
              />
              <Route path="/privacy-policy" element={<PrivacyPolicy />} />
              <Route path="/terms" element={<TermsConditions />} />
              <Route path="/shipping-policy" element={<ShippingPolicy />} />
              <Route path="/faq" element={<FAQ />} />
              <Route path="/disclaimer" element={<Disclaimer />} />
              <Route path="/return" element={<ReturnPolicy />} />
              <Route path="/return-policy" element={<ReturnPolicy />} />
              <Route path="/return/:id" element={<ReturnRequest />} />

              {/* ADMIN ROUTES */}
              <Route path="/admin" element={<AdminDashboard />} />
              <Route path="/admin/add-product" element={<AddProduct />} />
              <Route path="/admin/products" element={<AdminProducts />} />
              <Route path="/admin/edit-product/:id" element={<EditProduct />} />
              <Route path="/admin/orders" element={<AdminOrders />} />
              <Route path="/admin/users" element={<AdminUsers />} />
              <Route path="/admin/users/:id" element={<AdminUserDetails />} />
              <Route path="/admin/orders/:id" element={<AdminOrderDetails />} />
              <Route
                path="/order/:id"
                element={
                  <ProtectedRoute>
                    <OrderDetails />
                  </ProtectedRoute>
                }
              />
              <Route path="/admin/returns" element={<AdminReturns />} />
              <Route path="/admin/complaints" element={<AdminComplaints />} />
              <Route path="/admin/complaints/:id" element={<AdminComplaintDetails />} />
              <Route path="/admin/reviews" element={<AdminReviews />} />
              <Route path="/admin/coupons" element={<AdminCoupons />} />
              <Route path="/return-success" element={<ReturnSuccess />} />

              {/* 404 PAGE */}
              <Route path="*" element={<NotFound />} />
            </Routes>
          </React.Suspense>
        </ErrorBoundary>
      </div>

      {/* FOOTER */}

      <Footer />
    </Router>
  );
}

export default App;
