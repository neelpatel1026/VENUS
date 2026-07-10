import React, { useState, useEffect, useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import ProductCard from "../components/ProductCard";
import toast from "react-hot-toast";
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

  return (
    <div className="ordersuccess-page-wrapper" style={{ padding: "0 0 40px 0" }}>
      {/* Editorial Hero Header Banner */}
      <div 
        className="premium-page-hero"
        style={{ 
          background: "linear-gradient(135deg, #FAF6F0 0%, #F5ECE0 100%)", 
          borderBottom: "1px solid rgba(200, 169, 107, 0.2)", 
          padding: "40px 20px", 
          textAlign: "center", 
          position: "relative",
          overflow: "hidden",
          width: "100%",
          marginBottom: "40px"
        }}
      >
        <div style={{ position: "absolute", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(200, 169, 107, 0.08)", filter: "blur(40px)", top: "-50px", left: "-50px", pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: "250px", height: "250px", borderRadius: "50%", background: "rgba(200, 169, 107, 0.05)", filter: "blur(60px)", bottom: "-80px", right: "-50px", pointerEvents: "none" }} />
        
        <div style={{ maxWidth: "800px", margin: "0 auto", position: "relative", zIndex: "2" }}>
          <div style={{ fontSize: "0.75rem", letterSpacing: "2px", textTransform: "uppercase", color: "#8B7355", marginBottom: "14px", fontWeight: "700" }}>
            <Link to="/" style={{ color: "#8B7355", textDecoration: "none" }}>Home</Link>
            <span style={{ margin: "0 8px", opacity: 0.5 }}>/</span>
            <span style={{ color: "#1F2937" }}>Success</span>
          </div>
          
          <span style={{ display: "inline-block", fontSize: "0.8rem", letterSpacing: "3px", textTransform: "uppercase", color: "#C8A96B", fontWeight: "700", marginBottom: "8px" }}>
            Fulfillment Confirmed
          </span>
          <h1 style={{ fontFamily: "'Cinzel', 'Didot', 'Times New Roman', serif", fontSize: "2.5rem", fontWeight: "700", color: "#1F2937", margin: "0 0 10px 0", letterSpacing: "-0.5px", lineHeight: "1.2" }}>
            Thank You For Your Purchase
          </h1>
          <div style={{ width: "40px", height: "1px", background: "#C8A96B", margin: "14px auto" }} />
          <p style={{ fontSize: "0.95rem", color: "#6B7280", margin: "0 auto", lineHeight: "1.6", maxWidth: "600px" }}>
            Your order has been registered and sent to billing. You can track your parcel tracking timelines below.
          </p>
        </div>
      </div>

      {/* 1. TOP CELEBRATION HEADER */}
      <div className="ordersuccess-hero-card">
        <div className="confetti-holder">
          <svg className="confetti-svg" viewBox="0 0 100 100" fill="none">
            <circle cx="20" cy="20" r="1.5" fill="#C8A96B" />
            <circle cx="80" cy="15" r="1" fill="#1F2937" />
            <rect x="50" y="30" width="2" height="2" fill="#C8A96B" transform="rotate(45 50 30)" />
            <circle cx="15" cy="70" r="2" fill="#E8DFD2" />
            <rect x="75" y="65" width="1.5" height="3" fill="#C8A96B" transform="rotate(15 75 65)" />
          </svg>
        </div>

        <div className="success-icon-badge">
          <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>
        
        <span className="hero-status-label">Transaction Secure & Confirmed</span>
        <h1>Thank You For Your Order!</h1>
        <p className="hero-subtext">
          Your order has been logged in our systems. A confirmation statement has been sent to <strong>{order?.customerEmail || user?.email}</strong>.
        </p>

        {/* Loyalty Reward Banner */}
        <div className="success-loyalty-highlight-card">
          <div className="loyalty-badge-glow">🎉 Brand Loyalty Reward</div>
          <h4>You earned 150 VIP Reward Points!</h4>
          <p>Thank you for choosing VENUS CARE. Use promo code <strong>VENUSLOYAL</strong> for 15% off your next purchase.</p>
        </div>
      </div>

      <div className="ordersuccess-content-grid">
        
        {/* LEFT COLUMN: Order Details & Timeline */}
        <div className="ordersuccess-details-col">
          
          {/* Order Metrics Card */}
          <div className="ordersuccess-card">
            <h3>Order Information</h3>
            <div className="metrics-data-grid">
              <div className="metric-item">
                <span className="metric-label">Order ID</span>
                <strong className="metric-val">#{order?._id || orderId}</strong>
              </div>
              <div className="metric-item">
                <span className="metric-label">Date Placed</span>
                <strong className="metric-val">
                  {order ? new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) : new Date().toLocaleDateString()}
                </strong>
              </div>
              <div className="metric-item">
                <span className="metric-label">Payment Method</span>
                <strong className="metric-val">{order?.paymentMethod || paymentMethod}</strong>
              </div>
              <div className="metric-item">
                <span className="metric-label">Payment Status</span>
                <strong className={`metric-val status-${order?.paymentStatus?.toLowerCase() || paymentStatus.toLowerCase()}`}>
                  {order?.paymentStatus || paymentStatus}
                </strong>
              </div>
            </div>
          </div>

          {/* Connected Order Timeline */}
          <div className="ordersuccess-card">
            <h3>Delivery Progress Tracker</h3>
            <div className="timeline-vertical-flow">
              
              <div className="timeline-stage completed">
                <div className="stage-marker">✓</div>
                <div className="stage-content">
                  <h4>Order Successfully Logged</h4>
                  <p>Venus care database has logged your purchase cart items.</p>
                </div>
              </div>

              <div className={`timeline-stage ${(order?.paymentStatus === "Paid" || paymentStatus === "Paid" || paymentMethod === "COD") ? "completed" : "pending"}`}>
                <div className="stage-marker">
                  {(order?.paymentStatus === "Paid" || paymentStatus === "Paid" || paymentMethod === "COD") ? "✓" : "●"}
                </div>
                <div className="stage-content">
                  <h4>Payment Confirmed</h4>
                  <p>{order?.paymentMethod === "COD" ? "Cash verification scheduled on delivery." : "Secure gateway verification completed."}</p>
                </div>
              </div>

              <div className="timeline-stage active">
                <div className="stage-marker">●</div>
                <div className="stage-content">
                  <h4>Preparing Package</h4>
                  <p>Our warehouse team is carefully packing your cosmetic products.</p>
                </div>
              </div>

              <div className="timeline-stage next">
                <div className="stage-marker">○</div>
                <div className="stage-content">
                  <h4>Shipped via Partners</h4>
                  <p>Package handed over to BlueDart or Delhivery logistics.</p>
                </div>
              </div>

              <div className="timeline-stage next">
                <div className="stage-marker">○</div>
                <div className="stage-content">
                  <h4>Delivered</h4>
                  <p>Secure parcel signed at your destination.</p>
                </div>
              </div>

            </div>
          </div>

          {/* What happens next instructions */}
          <div className="ordersuccess-card next-instructions-card">
            <h3>What Happens Next?</h3>
            <ol className="next-steps-list">
              <li>
                <strong>Warehouse packing:</strong> We carefully wrap and pack your liquid formulas in break-proof organic boxes.
              </li>
              <li>
                <strong>Transit tracking:</strong> You will receive a second email notification with Delhivery or BlueDart air waybill tracker once the package is dispatched.
              </li>
              <li>
                <strong>Delivery dispatch:</strong> Our courier partners will contact you via SMS/phone before arrival to confirm dropoff timings.
              </li>
            </ol>
          </div>

          {/* Destination Address details */}
          <div className="ordersuccess-card">
            <h3>Shipping Details</h3>
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
                  <span>Estimated Delivery Date:</span>
                  <strong>
                    {new Date(Date.now() + 4 * 24 * 60 * 60 * 1000).toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })}
                  </strong>
                </div>
              </div>
            ) : (
              <p className="address-placeholder-warn">Address data will populate in your profile details.</p>
            )}
          </div>

        </div>

        {/* RIGHT COLUMN: Order Summary & Actions */}
        <div className="ordersuccess-summary-col">
          
          {/* Action CTAs */}
          <div className="ordersuccess-card actions-btn-card">
            <h3>Checkout Actions</h3>
            <div className="success-actions-stack">
              {order && (
                <button onClick={handleDownloadInvoice} className="btn-success-primary">
                  Download Invoice (PDF)
                </button>
              )}
              {order?._id && (
                <Link to={`/order/${order._id}`} className="btn-success-secondary">
                  Track Order Details
                </Link>
              )}
              <Link to="/shop" className="btn-success-outline">
                Continue Shopping
              </Link>
              <Link to="/profile" className="btn-success-link">
                View All My Orders
              </Link>
              <Link to="/contact" className="btn-success-link">
                Contact Customer Support
              </Link>
            </div>
          </div>

          {/* Checkout Totals Summary */}
          <div className="ordersuccess-card order-items-summary-card">
            <h3>Order Summary</h3>
            
            <div className="purchased-items-list-flow">
              {order?.items ? (
                order.items.map((item) => (
                  <div key={item.productId || item._id} className="summary-item-row-data">
                    <img src={item.productImage || "/placeholder.jpg"} alt={item.productName} className="summary-item-thumb" />
                    <div className="summary-item-text">
                      <h4 className="summary-item-title">{item.productName}</h4>
                      <span className="summary-item-qty">Qty: {item.qty} × ₹{item.price.toFixed(2)}</span>
                    </div>
                    <span className="summary-item-row-total">₹{(item.qty * item.price).toFixed(2)}</span>
                  </div>
                ))
              ) : (
                <p className="items-list-placeholder">Order item list is being processed...</p>
              )}
            </div>

            <div className="summary-pricing-stack">
              <div className="pricing-line">
                <span>Subtotal</span>
                <span>₹{subtotal.toFixed(2)}</span>
              </div>
              {savings > 0 && (
                <div className="pricing-line discount-amount">
                  <span>Total Savings</span>
                  <span>-₹{savings.toFixed(2)}</span>
                </div>
              )}
              <div className="pricing-line">
                <span>Shipping</span>
                <span className="free-shipping-indicator">FREE</span>
              </div>
              
              <div className="summary-divider-line" />

              <div className="pricing-line final-paid-line">
                <span>Paid Amount</span>
                <span className="final-paid-val">₹{totalPaid.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Social Proof Trust Section */}
          <div className="ordersuccess-card social-proof-card">
            <div className="stars-review">★★★★★</div>
            <h4>Rated by Thousands of Happy Customers</h4>
            <p className="proof-sub">100% Genuine Products • Cruelty Free • Fast Delivery</p>
            <div className="reassurance-checklist-grid">
              <span>🛡 100% Secure Gateway</span>
              <span>🚚 Safe Logistics Packing</span>
              <span>↩ 7-Day Refund Policy</span>
              <span>💬 24/7 Priority Support</span>
            </div>
          </div>

        </div>

      </div>

      {/* 4. PRODUCT RECOMMENDATIONS ("You may also like") */}
      {recommendedProducts.length > 0 && (
        <div className="ordersuccess-recommendations-section">
          <h2>You May Also Like</h2>
          <p className="section-subtitle">Specially curated premium skincare for your daily routine.</p>
          <div className="recommendations-flex-grid">
            {recommendedProducts.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </div>
      )}

    </div>
  );
};

export default OrderSuccess;
