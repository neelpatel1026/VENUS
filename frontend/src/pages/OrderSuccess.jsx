import React from "react";
import { Link, useLocation } from "react-router-dom";
import "../styles/ordersuccess.css";

const OrderSuccess = () => {
  const location = useLocation();
  console.log(location.state);
  const paymentMethod = location.state?.paymentMethod || "COD";

  const paymentStatus = location.state?.paymentStatus || "Pending";

  return (
    <div className="success-page">
      <div className="success-card">
        <div className="success-check">✓</div>

        <span className="success-label">ORDER CONFIRMED</span>

        <h1>Thank You For Your Purchase</h1>

        <p className="success-text">
          Your order has been successfully placed and is now being prepared.
          We'll notify you as soon as it ships.
        </p>
        <div className="order-number">
          Order ID:
          <strong>#{location.state?.orderId?.slice(-8)}</strong>
        </div>
        <div className="delivery-box">
          <h4>Estimated Delivery</h4>

          <p>4 - 7 Business Days</p>
        </div>
        <div className="status-card">
          <div className="status-row">
            <span>📦 Order Status</span>
            <strong>Confirmed</strong>
          </div>

          <div className="status-row">
            <span>🚚 Shipping</span>
            <strong>Processing</strong>
          </div>

          <div className="status-row">
            <span>💳 Payment</span>

            <strong
              style={{
                color: paymentMethod === "COD" ? "#f59e0b" : "#16a34a",
              }}
            >
              {paymentMethod === "COD" ? "Pay On Delivery" : "Received"}
            </strong>
          </div>
        </div>

        <div className="success-buttons">
          <Link to="/shop" className="continue-btn">
            Continue Shopping
          </Link>

          {/* <Link to={`/order/${location.state?.orderId}`} className="orders-btn">
            Track Order
          </Link> */}
          {/* <Link
            to={`/order/${location.state?.orderId}`}
            className="details-btn"
          >
            View Order Details
          </Link> */}
          {location.state?.orderId && (
            <Link
              to={`/order/${location.state.orderId}`}
              className="orders-btn"
            >
              View Order Details
            </Link>
          )}
        </div>
      </div>
    </div>
  );
};

export default OrderSuccess;
