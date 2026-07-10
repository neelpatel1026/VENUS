import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import axios from "axios";
import "../styles/orderdetails.css";

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/myorders/${id}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const data = await res.json();
      setOrder(data);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load tracking details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (id && user?.token) {
      fetchOrder();
    }
  }, [id, user]);

  // Real-time tracking updates (Polling hook ready for WebSocket / Socket.io integrations)
  useEffect(() => {
    if (!id || !user?.token) return;
    const interval = setInterval(() => {
      fetchOrder();
    }, 30000); // Poll every 30 seconds
    return () => clearInterval(interval);
  }, [id, user]);

  const downloadInvoice = async () => {
    try {
      toast.loading("Generating secure invoice...");
      const response = await axios.get(`/api/orders/${order._id}/invoice`, {
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `invoice-${order._id.slice(-8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.dismiss();
      toast.success("Invoice downloaded successfully! 📄");
    } catch (error) {
      toast.dismiss();
      console.error(error);
      toast.error("Failed to download invoice");
    }
  };

  const handleCopyTrackingId = () => {
    const trackingId = `VN-${order._id.slice(-8).toUpperCase()}`;
    navigator.clipboard.writeText(trackingId);
    toast.success("Tracking ID copied to clipboard!");
  };

  const handleTrackShipment = () => {
    toast.success("Opening partner tracking gateway...");
    window.open("https://www.delhivery.com/", "_blank");
  };

  if (loading) {
    return (
      <div className="orderdetails-loading-container">
        <div className="orderdetails-spinner"></div>
        <p>Retrieving real-time tracking metrics...</p>
      </div>
    );
  }

  if (!order || !order._id) {
    return (
      <div className="order-details-error-page">
        <h2>Order Not Found</h2>
        <p>The requested order tracking log does not exist or has expired.</p>
        <Link to="/shop" className="btn-gold-accent">Return to Shop</Link>
      </div>
    );
  }

  const orderDate = new Date(order.createdAt);
  const today = new Date();
  const daysDiff = Math.floor((today - orderDate) / (1000 * 60 * 60 * 24));
  const canReturn = order.status === "Delivered" && daysDiff <= 7;

  // Calculate dynamic ETA date (4 days from order creation)
  const getEtaDateString = () => {
    const etaDate = new Date(order.createdAt);
    etaDate.setDate(etaDate.getDate() + 4);
    return etaDate.toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric" });
  };

  // Determine shipping progress percentage
  const getProgressPercentage = () => {
    switch (order.status) {
      case "Pending": return 15;
      case "Confirmed": return 30;
      case "Preparing":
      case "Packed": return 55;
      case "Shipped": return 75;
      case "Out For Delivery": return 90;
      case "Delivered": return 100;
      case "Cancelled":
      case "Returned":
      case "Refunded": return 0;
      default: return 10;
    }
  };

  // Determine stage completion classes
  const getStageClass = (stageName) => {
    const statusSequence = ["Pending", "Confirmed", "Preparing", "Packed", "Shipped", "Out For Delivery", "Delivered"];
    const currentIndex = statusSequence.indexOf(order.status);
    const targetIndex = statusSequence.indexOf(stageName);

    if (currentIndex === -1) {
      return "future-step";
    }

    if (currentIndex >= targetIndex) {
      if (currentIndex === targetIndex) {
        return "active-step";
      }
      return "completed-step";
    }

    return "future-step";
  };

  const isOrderCancelled = order.status === "Cancelled";
  const isOrderReturned = order.status === "Returned" || order.status === "Refunded";

  return (
    <div className="order-details-container">
      
      {/* 1. TOP HEADER SUMMARY */}
      <div className="order-details-header-row">
        <div>
          <h1>Order Tracking Panel</h1>
          <p className="subtext">Monitor real-time delivery status & parcel movements</p>
        </div>
        <div className={`status-summary-badge status-${order.status.toLowerCase().replace(/\s+/g, "-")}`}>
          {order.status}
        </div>
      </div>

      {/* 2. STATS OVERVIEW CARDS */}
      <div className="stats-grid">
        <div className="stat-card">
          <h4>Order ID</h4>
          <p>#{order._id.slice(-8).toUpperCase()}</p>
        </div>
        <div className="stat-card">
          <h4>Order Date</h4>
          <p>{new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</p>
        </div>
        <div className="stat-card">
          <h4>Paid Total</h4>
          <p>₹{order.totalAmount.toFixed(2)}</p>
        </div>
        <div className="stat-card">
          <h4>Payment Method</h4>
          <p>{order.paymentMethod} ({order.paymentStatus})</p>
        </div>
      </div>

      {/* 3. COURIER ETA & PROGRESS SLIDER */}
      {!isOrderCancelled && !isOrderReturned && (
        <div className="details-section-card eta-progress-card">
          <div className="eta-header-details">
            <div>
              <span className="eta-card-badge">Estimated Delivery</span>
              <h2>{getEtaDateString()}</h2>
              <p className="eta-time-window">Expected Arrival Window: <strong>2:00 PM - 5:00 PM</strong></p>
            </div>
            <div className="courier-badge-box">
              <span>Partner: Delhivery</span>
            </div>
          </div>

          <div className="shipping-completion-tracker">
            <div className="progress-bar-label-row">
              <span>Transit Completion</span>
              <strong>{getProgressPercentage()}%</strong>
            </div>
            <div className="progress-bar-track-line">
              <div className="progress-bar-fill-line" style={{ width: `${getProgressPercentage()}%` }}></div>
            </div>
          </div>
        </div>
      )}

      {/* 4. TRACKING TIMELINE SECTION */}
      <div className="details-section-card tracking-timeline-section-card">
        <h3>Transit Chronology</h3>

        {isOrderCancelled ? (
          <div className="special-status-timeline cancelled">
            <div className="special-icon">✕</div>
            <div>
              <h4>Order Cancelled</h4>
              <p>This order was marked as cancelled. No delivery attempts scheduled.</p>
            </div>
          </div>
        ) : isOrderReturned ? (
          <div className="special-status-timeline returned">
            <div className="special-icon">↩</div>
            <div>
              <h4>Return & Refund Processed</h4>
              <p>Items returned to warehouse. Refund status: <strong>{order.paymentStatus}</strong></p>
            </div>
          </div>
        ) : (
          <div className="tracker-timeline-vertical-flow">
            
            {/* Step 1: Placed */}
            <div className={`timeline-tracker-step ${getStageClass("Pending")}`}>
              <div className="tracker-dot">✓</div>
              <div className="tracker-step-content">
                <div className="step-title-row">
                  <h4>Order Placed</h4>
                  <span className="step-badge">Placed</span>
                </div>
                <p className="step-desc">Your order has been placed successfully and payment verification is confirmed.</p>
              </div>
            </div>

            {/* Step 2: Confirmed */}
            <div className={`timeline-tracker-step ${getStageClass("Confirmed")}`}>
              <div className="tracker-dot">
                {getStageClass("Confirmed") === "completed-step" ? "✓" : "●"}
              </div>
              <div className="tracker-step-content">
                <div className="step-title-row">
                  <h4>Order Confirmed</h4>
                  <span className="step-badge">Confirmed</span>
                </div>
                <p className="step-desc">Billing and invoice records generated. Order sent to preparation.</p>
              </div>
            </div>

            {/* Step 3: Preparing */}
            <div className={`timeline-tracker-step ${getStageClass("Preparing")}`}>
              <div className="tracker-dot">
                {getStageClass("Preparing") === "completed-step" ? "✓" : "●"}
              </div>
              <div className="tracker-step-content">
                <div className="step-title-row">
                  <h4>Preparing Formula</h4>
                  <span className="step-badge">Preparing</span>
                </div>
                <p className="step-desc">Items are sourced, checked for purity, and prepared in laboratory wraps.</p>
              </div>
            </div>

            {/* Step 4: Packed */}
            <div className={`timeline-tracker-step ${getStageClass("Packed")}`}>
              <div className="tracker-dot">
                {getStageClass("Packed") === "completed-step" ? "✓" : "●"}
              </div>
              <div className="tracker-step-content">
                <div className="step-title-row">
                  <h4>Package Packed</h4>
                  <span className="step-badge">Packed</span>
                </div>
                <p className="step-desc">Handcrafted items wrapped in cushion seals and locked in carrier boxes.</p>
              </div>
            </div>

            {/* Step 5: Shipped */}
            <div className={`timeline-tracker-step ${getStageClass("Shipped")}`}>
              <div className="tracker-dot">
                {getStageClass("Shipped") === "completed-step" ? "✓" : "●"}
              </div>
              <div className="tracker-step-content">
                <div className="step-title-row">
                  <h4>Dispatched & Shipped</h4>
                  <span className="step-badge">Shipped</span>
                </div>
                <p className="step-desc">Parcel handed over to courier partner. Transit tracking code initialized.</p>
              </div>
            </div>

            {/* Step 6: Out For Delivery */}
            <div className={`timeline-tracker-step ${getStageClass("Out For Delivery")}`}>
              <div className="tracker-dot">
                {getStageClass("Out For Delivery") === "completed-step" ? "✓" : "●"}
              </div>
              <div className="tracker-step-content">
                <div className="step-title-row">
                  <h4>Out For Delivery</h4>
                  <span className="step-badge">Out For Delivery</span>
                </div>
                <p className="step-desc">Local courier associate has dispatched the package to your destination region route.</p>
              </div>
            </div>

            {/* Step 7: Delivered */}
            <div className={`timeline-tracker-step ${getStageClass("Delivered")}`}>
              <div className="tracker-dot">
                {getStageClass("Delivered") === "completed-step" ? "✓" : "●"}
              </div>
              <div className="tracker-step-content">
                <div className="step-title-row">
                  <h4>Delivered</h4>
                  <span className="step-badge">Delivered</span>
                </div>
                <p className="step-desc">Parcel successfully signed at destination. Thank you for shopping with Venus Care!</p>
              </div>
            </div>

          </div>
        )}
      </div>

      {/* 5. SHIPMENT DETAILS & ACTIONS */}
      {!isOrderCancelled && !isOrderReturned && (
        <div className="details-section-card shipment-actions-card">
          <h3>Courier Tracking Portal</h3>
          <div className="courier-meta-grid">
            <div className="meta-col">
              <span>Courier Partner</span>
              <strong>Delhivery Logistics</strong>
            </div>
            <div className="meta-col">
              <span>Tracking AWB ID</span>
              <strong>VN-{order._id.slice(-8).toUpperCase()}</strong>
            </div>
          </div>
          <div className="courier-actions-row">
            <button onClick={handleTrackShipment} className="btn-courier-primary">
              Track Shipment Live
            </button>
            <button onClick={handleCopyTrackingId} className="btn-courier-secondary">
              Copy Tracking ID
            </button>
            <button onClick={handleTrackShipment} className="btn-courier-outline">
              Open Delhivery Web
            </button>
          </div>
        </div>
      )}

      {/* 6. PRODUCTS PURCHASED CARD */}
      <div className="details-section-card items-purchased-card">
        <h3>Products Purchased</h3>
        <div className="purchased-items-stack">
          {order.items.map((item, index) => (
            <div className="purchased-item-row" key={item._id || index}>
              <img src={item.productImage || "/placeholder.jpg"} alt={item.productName} className="item-thumb" />
              <div className="item-details-box">
                <h4>{item.productName}</h4>
                <div className="item-meta-row">
                  <span>Quantity: {item.qty}</span>
                  <span>Price: ₹{item.price.toFixed(2)}</span>
                  <span className="item-subtotal-tag">Subtotal: ₹{(item.qty * item.price).toFixed(2)}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* 7. CUSTOMER INFORMATION */}
      <div className="details-section-card info-split-card">
        <div className="info-box-column">
          <h3>Customer Details</h3>
          <div className="info-fields-stack">
            <div className="field-group">
              <label>Name</label>
              <span>{order.customerName}</span>
            </div>
            <div className="field-group">
              <label>Email Address</label>
              <span>{order.customerEmail}</span>
            </div>
            <div className="field-group">
              <label>Phone Number</label>
              <span>{order.customerPhone}</span>
            </div>
          </div>
        </div>

        <div className="info-box-column">
          <h3>Delivery Address</h3>
          <div className="info-fields-stack">
            <div className="field-group">
              <label>Address Details</label>
              <span>{order.shippingAddress.addressLine1}</span>
              {order.shippingAddress.addressLine2 && <span>{order.shippingAddress.addressLine2}</span>}
            </div>
            <div className="field-group">
              <label>City & State</label>
              <span>{order.shippingAddress.city}, {order.shippingAddress.state}</span>
            </div>
            <div className="field-group">
              <label>Pincode / Country</label>
              <span>{order.shippingAddress.pincode} - {order.shippingAddress.country || "India"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* 8. SYSTEM ACTIONS FOOTER */}
      <div className="order-details-actions-row">
        <button className="btn-invoice-download" onClick={downloadInvoice}>
          📥 Download Statement Invoice
        </button>
        {canReturn && (
          <button className="btn-product-return" onClick={() => navigate(`/return/${order._id}`)}>
            ↩ Request Product Return
          </button>
        )}
      </div>

      {/* 9. REASSURANCE & FAQ MATRIX */}
      <div className="details-section-card support-reassurance-card">
        <h4>Need Assistance with this order?</h4>
        <p className="reassurance-subtitle font-luxury">Our dedicated beauty experts are available 24/7 to support your logistics queries.</p>
        <div className="support-links-row">
          <Link to="/contact">Contact Support</Link>
          <Link to="/return-policy">Return Policy</Link>
          <Link to="/shipping-policy">Shipping FAQ</Link>
          <Link to="/terms-conditions">Refund Terms</Link>
        </div>
      </div>

    </div>
  );
};

export default OrderDetails;
