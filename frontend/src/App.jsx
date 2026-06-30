import React, { useEffect } from "react";
import axios from "axios";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";

import Navbar from "./components/Navbar.jsx";
import Footer from "./components/Footer.jsx";
import ScrollToTop from "./components/ScrollToTop.jsx";
import OfferBar from "./components/OfferBar";

/* PAGES */

import Home from "./pages/Home.jsx";
import Shop from "./pages/Shop.jsx";
import ProductDetail from "./pages/ProductDetail.jsx";
import Cart from "./pages/Cart.jsx";
import Checkout from "./pages/Checkout.jsx";
import Login from "./pages/Login.jsx";
import Register from "./pages/Register.jsx";
import Profile from "./pages/Profile.jsx";
import OrderSuccess from "./pages/OrderSuccess.jsx";
import About from "./pages/About.jsx";
import Disclaimer from "./pages/Disclaimer.jsx";
import ReturnPolicy from "./pages/ReturnPolicy.jsx";
import ForgotPassword from "./pages/ForgotPassword.jsx";
// import MyOrders from "./pages/MyOrders.jsx";
import OrderDetails from "./pages/OrderDetails.jsx";
import MyAddresses from "./pages/MyAddresses.jsx";
import ReturnRequest from "./pages/ReturnRequest";
import ReturnSuccess from "./pages/ReturnSuccess.jsx";
import MyReturns from "./pages/MyReturns";
import Wallet from "./pages/Wallet";
import EditProfile from "./pages/EditProfile.jsx";
// import AdminReturns from "./admin/AdminReturns";

/* ADMIN */

import AdminDashboard from "./admin/AdminDashboard.jsx";
import AddProduct from "./admin/AddProduct.jsx";
import AdminProducts from "./admin/AdminProducts.jsx";
import EditProduct from "./admin/EditProduct.jsx";
import AdminOrders from "./admin/AdminOrders.jsx";
import AdminUsers from "./admin/AdminUsers.jsx";
import AdminOrderDetails from "./admin/AdminOrderDetails.jsx";
import AdminUserDetails from "./admin/AdminUserDetails.jsx";
import AdminReturns from "./admin/AdminReturns";

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
        color: "white",
        fontSize: "2rem",
      }}
    >
      404 | Page Not Found
    </div>
  );
};

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
        <Routes>
          {/* USER ROUTES */}

          <Route path="/" element={<Home />} />

          <Route path="/shop" element={<Shop />} />

          <Route path="/product/:id" element={<ProductDetail />} />

          <Route path="/cart" element={<Cart />} />

          {/* <Route path="/checkout" element={<Checkout />} /> */}
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

          {/* <Route path="/profile" element={<Profile />} /> */}
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

          {/* FOOTER PAGES */}

          <Route path="/about" element={<About />} />

          <Route path="/disclaimer" element={<Disclaimer />} />

          <Route path="/return" element={<ReturnPolicy />} />
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
          <Route path="/return-success" element={<ReturnSuccess />} />
          <Route
            path="/wallet"
            element={
              <ProtectedRoute>
                <Wallet />
              </ProtectedRoute>
            }
          />
          {/* 404 PAGE */}

          <Route path="*" element={<NotFound />} />
        </Routes>
      </div>

      {/* FOOTER */}

      <Footer />
    </Router>
  );
}

export default App;
