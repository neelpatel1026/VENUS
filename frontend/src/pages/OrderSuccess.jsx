import React, { useState, useEffect, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import ProductCard from "../components/ProductCard";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import { 
  FaCheck, 
  FaShoppingBag, 
  FaDownload, 
  FaTruck, 
  FaArrowRight, 
  FaClipboardList, 
  FaShieldAlt, 
  FaRegCreditCard, 
  FaStar, 
  FaUndo, 
  FaHeadphones, 
  FaWhatsapp, 
  FaEnvelope, 
  FaPhone,
  FaCalendarAlt,
  FaInfoCircle
} from "react-icons/fa";
import "../styles/ordersuccess.css";

const OrderSuccess = () => {
  const location = useLocation();
  const { user } = useContext(AuthContext);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [recommendedProducts, setRecommendedProducts] = useState([]);

  const orderId = location.state?.orderId;
  const paymentMethod = location.state?.paymentMethod || "COD";
  const paymentStatus = location.state?.paymentStatus || "Pending";

  // Fetch full order details
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!orderId || !user?.token) {
        setLoading(false);
        return;
      }
      try {
        const { data } = await axios.get(`/api/orders/myorders/${orderId}`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        setOrder(data);
      } catch (err) {
        console.error(err);
        toast.error("Failed to load order breakdown details");
      } finally {
        setLoading(false);
      }
    };

    fetchOrderDetails();
  }, [orderId, user]);

  // Fetch product recommendations
  useEffect(() => {
    const fetchRecommendations = async () => {
      try {
        const { data } = await axios.get("/api/products");
        setRecommendedProducts(data.slice(0, 4));
      } catch (err) {
        console.error(err);
      }
    };
    fetchRecommendations();
  }, []);

  // Secure client-side invoice PDF download
  const handleDownloadInvoice = async () => {
    if (!order) return;
    try {
      toast.loading("Generating secure invoice...");
      const res = await axios.get(`/api/orders/${order._id}/invoice`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        responseType: "blob",
      });

      const file = new Blob([res.data], { type: "application/pdf" });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = fileURL;
      link.setAttribute("download", `invoice_${order._id.slice(-8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.dismiss();
      toast.success("Invoice downloaded successfully! 📄");
    } catch (err) {
      toast.dismiss();
      console.error(err);
      toast.error("Failed to retrieve order invoice document");
    }
  };

  if (loading) {
    return (
      <div className="ordersuccess-loading-container">
        <div className="ordersuccess-spinner"></div>
        <p>Loading your secure transaction record...</p>
      </div>
    );
  }

  // Calculate savings values
  const subtotal = order ? order.items.reduce((sum, item) => sum + (item.price * item.qty), 0) : 0;
  const totalPaid = order ? order.totalAmount : 0;
  const savings = Math.max(0, subtotal - totalPaid);

  // Expected delivery range formatter helper (e.g. 25-27 July)
  const getDeliveryRange = (dateStr) => {
    const baseDate = dateStr ? new Date(dateStr) : new Date();
    const start = new Date(baseDate);
    start.setDate(baseDate.getDate() + 3);
    const end = new Date(baseDate);
    end.setDate(baseDate.getDate() + 5);

    const startDay = start.getDate();
    const endDay = end.getDate();
    const month = start.toLocaleDateString("en-US", { month: "short" });

    return `${startDay}–${endDay} ${month}`;
  };

  const getFormattedDate = (dateStr) => {
    return dateStr 
      ? new Date(dateStr).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) 
      : new Date().toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
  };

  return (
    <div className="ordersuccess-page-wrapper route-fade-in font-outfit">
      
      {/* 1. SUCCESS CELEBRATION HEADER */}
      <div className="ordersuccess-premium-header">
        
        {/* Animated Checkmark Badge */}
        <div className="success-checkmark-animated-wrapper">
          <motion.div
            initial={{ scale: 0, rotate: -45 }}
            animate={{ scale: 1, rotate: 0 }}
            transition={{ type: "spring", stiffness: 200, damping: 15 }}
            style={{
              width: "72px",
              height: "72px",
              borderRadius: "50%",
              background: "#C8A165",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              color: "#FFFFFF"
            }}
          >
            <FaCheck size={32} />
          </motion.div>
        </div>

        <h1>Order Confirmed</h1>
        <h2>Thank you for shopping with VENUS CARE</h2>
        
        <p className="hero-subtext">
          We've received your order and have emailed your confirmation statements. Your parcel dispatch tracking details will follow soon.
        </p>

        {/* Header metrics metadata */}
        <div className="header-metrics-row-luxury">
          <div className="header-metric-item">
            <span className="header-metric-label">Order Number</span>
            <strong className="header-metric-val">#{order?._id ? `VC${order._id.slice(-6).toUpperCase()}` : `VC${orderId?.slice(-6).toUpperCase() || "102548"}`}</strong>
          </div>
          
          <div className="header-metric-item">
            <span className="header-metric-label">Payment Method</span>
            <strong className="header-metric-val">{order?.paymentMethod || paymentMethod}</strong>
          </div>

          <div className="header-metric-item">
            <span className="header-metric-label">Order Date</span>
            <strong className="header-metric-val">{getFormattedDate(order?.createdAt)}</strong>
          </div>

          <div className="header-metric-item">
            <span className="header-metric-label">Expected Delivery</span>
            <strong className="header-metric-val" style={{ color: "#C8A165" }}>
              {getDeliveryRange(order?.createdAt)}
            </strong>
          </div>
        </div>
      </div>

      <div className="ordersuccess-content-grid">
        
        {/* LEFT COLUMN: Addresses, Purchased Products, Payment & Timeline */}
        <div className="ordersuccess-details-col">
          
          {/* Connected horizontal Delivery Timeline */}
          <div className="ordersuccess-card-luxury">
            <h3><FaTruck /> Delivery Progress Timeline</h3>
            <div className="progress-timeline-horizontal">
              {[
                { label: "Confirmed", status: "completed" },
                { label: "Preparing", status: "completed" },
                { label: "Packed", status: "pending" },
                { label: "Shipped", status: "pending" },
                { label: "Out for Delivery", status: "pending" },
                { label: "Delivered", status: "pending" }
              ].map((step, index) => (
                <div 
                  key={index} 
                  className={`timeline-step-item ${step.status === "completed" ? "completed" : ""} ${index === 1 ? "active" : ""}`}
                >
                  <div className="step-indicator-dot">
                    {step.status === "completed" ? "✓" : index + 1}
                  </div>
                  <span className="step-label-text">{step.label}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Purchased Products details */}
          <div className="ordersuccess-card-luxury">
            <h3><FaShoppingBag /> Purchased Skincare Items</h3>
            <div className="purchased-products-list">
              {order?.items ? (
                order.items.map((item) => (
                  <Link 
                    to={`/product/${item.productId || item._id}`} 
                    key={item.productId || item._id} 
                    className="purchased-item-row"
                  >
                    <img 
                      src={item.productImage || item.imageUrl || item.image || "/cosmetic_1.avif"} 
                      alt={item.productName} 
                      className="purchased-item-thumb"
                      onError={(e) => { e.target.src = "/cosmetic_1.avif"; }}
                    />
                    <div className="purchased-item-info">
                      <h4 className="purchased-item-title">{item.productName}</h4>
                      <span className="purchased-item-meta">
                        Quantity: {item.qty} &bull; Base Price: ₹{item.price.toFixed(2)}
                      </span>
                    </div>
                    <span className="purchased-item-price-val">
                      ₹{(item.qty * item.price).toFixed(2)}
                    </span>
                  </Link>
                ))
              ) : (
                <p>Order item lists are loading...</p>
              )}
            </div>
          </div>

          {/* Shipping Address details */}
          <div className="ordersuccess-card-luxury">
            <h3><FaClipboardList /> Shipping Destination Address</h3>
            {order?.shippingAddress ? (
              <div className="shipping-details-box">
                <h4 className="recipient-name">{order.shippingAddress.fullName}</h4>
                <p className="recipient-phone">📞 {order.shippingAddress.phone || order.customerPhone}</p>
                <div className="recipient-address-lines">
                  <p>{order.shippingAddress.addressLine1}</p>
                  {order.shippingAddress.addressLine2 && <p>{order.shippingAddress.addressLine2}</p>}
                  <p>
                    {order.shippingAddress.city}, {order.shippingAddress.state} - <strong>{order.shippingAddress.pincode}</strong>
                  </p>
                  <p className="shipping-country">{order.shippingAddress.country || "India"}</p>
                </div>
                
                <div className="shipping-eta-info-row">
                  <span>Estimated Arrival window:</span>
                  <strong>{getDeliveryRange(order.createdAt)}</strong>
                </div>
              </div>
            ) : (
              <p>Shipping destination details not found.</p>
            )}
          </div>

          {/* Payment Information */}
          <div className="ordersuccess-card-luxury">
            <h3><FaRegCreditCard /> Payment & Invoice Records</h3>
            <div className="metrics-data-grid">
              <div className="metric-item">
                <span className="metric-label">Gateway Method</span>
                <strong className="metric-val">{order?.paymentMethod || paymentMethod}</strong>
              </div>
              <div className="metric-item">
                <span className="metric-label">Transaction Status</span>
                <strong className="metric-val" style={{ color: order?.paymentStatus === "Paid" ? "#16A34A" : "#D97706" }}>
                  {order?.paymentStatus || paymentStatus}
                </strong>
              </div>
              <div className="metric-item">
                <span className="metric-label">Transaction Reference</span>
                <strong className="metric-val" style={{ fontSize: "12px", fontFamily: "monospace" }}>
                  {order?._id ? `TXN-${order._id.slice(0, 12).toUpperCase()}` : "TXN-SECUREPAY"}
                </strong>
              </div>
              <div className="metric-item">
                <span className="metric-label">Invoice Number</span>
                <strong className="metric-val">
                  {order?._id ? `INV-${order._id.slice(-8).toUpperCase()}` : "INV-DRAFT"}
                </strong>
              </div>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Actions, Pricing Summary, Loyalty reward & Support */}
        <div className="ordersuccess-summary-col">
          
          {/* Action CTAs */}
          <div className="ordersuccess-card-luxury">
            <h3>Order Dashboard Quick Actions</h3>
            <div className="success-actions-stack-luxury">
              {order && (
                <button 
                  onClick={handleDownloadInvoice} 
                  className="btn-success-luxury-primary"
                  style={{ gridColumn: "span 2" }}
                >
                  <FaDownload /> Download Invoice
                </button>
              )}
              
              {order?._id && (
                <Link to={`/order/${order._id}`} className="btn-success-luxury-secondary">
                  Track Order
                </Link>
              )}

              <Link to="/shop" className="btn-success-luxury-secondary">
                Continue Shop
              </Link>
              
              <Link 
                to="/profile" 
                className="btn-success-luxury-secondary"
                style={{ gridColumn: "span 2", borderStyle: "dashed" }}
              >
                Go to My Orders
              </Link>
            </div>
          </div>

          {/* Pricing Summary card */}
          <div className="ordersuccess-card-luxury">
            <h3>Payment Summary</h3>
            <div className="summary-pricing-stack-luxury">
              <div className="pricing-line-item">
                <span>Subtotal ({order?.items?.length || 0} items)</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              
              {savings > 0 && (
                <div className="pricing-line-item savings-row">
                  <span>Discount Applied</span>
                  <span>-₹{savings.toFixed(2)}</span>
                </div>
              )}

              <div className="pricing-line-item">
                <span>Shipping Fees</span>
                <span style={{ color: "#16A34A", fontWeight: "700" }}>FREE</span>
              </div>

              <div className="grand-total-row">
                <span className="grand-total-label">Grand Total</span>
                <span className="grand-total-val">₹{totalPaid.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Luxury Loyalty Card */}
          <div className="loyalty-reward-card-gold">
            <div className="loyalty-title-flex">
              <span className="loyalty-badge-gold">Venus VIP Club</span>
              <FaStar style={{ color: "#C8A165" }} />
            </div>
            
            <h4 className="loyalty-points-earned">150 Reward Points Earned</h4>
            <p className="loyalty-points-balance-sub">
              Your points balance: <strong>540 reward points</strong>
            </p>

            <div className="loyalty-progress-container">
              <div className="loyalty-progress-track">
                <div className="loyalty-progress-fill" style={{ width: "54%" }} />
              </div>
              <div className="loyalty-milestone-text">
                <span>Next Milestone: 1000 Points</span>
                <span>460 more to go</span>
              </div>
            </div>
          </div>

          {/* Order Tracking Preview */}
          <div className="visual-package-tracker-box font-outfit">
            <FaTruck className="tracker-illustration-svg" />
            <div className="tracker-details-block">
              <span className="tracker-status-label">Current Status</span>
              <span className="tracker-status-val">Preparing Order</span>
              <span className="tracker-expected-dispatch">
                Expected dispatch: Tomorrow
              </span>
            </div>
          </div>

          {/* Email and Whatsapp confirmation notifications block */}
          <div className="notification-bell-alerts-bar">
            <FaShieldAlt className="alert-bell-icon" />
            <div className="alert-bell-text-block">
              <span className="alert-bell-title">Purchase Alerts Configured</span>
              <p className="alert-bell-body">
                Invoice copy and live courier transit updates will be pushed directly to your registered email and WhatsApp.
              </p>
            </div>
          </div>

          {/* Trust assurances check panel */}
          <div className="ordersuccess-card-luxury">
            <h3>Our Security & Service Guarantees</h3>
            <div className="trust-badges-horizontal-grid">
              <div className="trust-badge-item">
                <FaShieldAlt className="trust-badge-icon" />
                <span className="trust-badge-label">100% Authentic</span>
              </div>
              <div className="trust-badge-item">
                <FaRegCreditCard className="trust-badge-icon" />
                <span className="trust-badge-label">Secure Pay</span>
              </div>
              <div className="trust-badge-item">
                <FaUndo className="trust-badge-icon" />
                <span className="trust-badge-label">Easy Returns</span>
              </div>
            </div>
          </div>

          {/* Help channels Desk card */}
          <div className="ordersuccess-card-luxury">
            <h3>Need Any Help?</h3>
            <div className="help-desk-channels-list">
              <a href="https://wa.me/919999999999" target="_blank" rel="noopener noreferrer" className="help-channel-btn">
                <FaWhatsapp /> WhatsApp
              </a>
              <a href="mailto:support@venuscare.com" className="help-channel-btn">
                <FaEnvelope /> Email Support
              </a>
              <a href="tel:+919999999999" className="help-channel-btn">
                <FaPhone /> Direct Call
              </a>
            </div>
          </div>

        </div>

      </div>

      {/* Curated Recommendations ("You may also like") */}
      {recommendedProducts.length > 0 && (
        <div className="ordersuccess-recommendations-section">
          <h2 className="recommendations-title-luxury">You May Also Like</h2>
          <p className="recommendations-subtitle-luxury">
            Explore customer-favorite products curated to elevate your beauty routine.
          </p>
          <div className="recommendations-flex-grid">
            {recommendedProducts.map((prod) => (
              <ProductCard key={prod._id} product={prod} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default OrderSuccess;
