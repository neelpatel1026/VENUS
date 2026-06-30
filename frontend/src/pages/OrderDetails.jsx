import React, { useEffect, useState, useContext } from "react";
import { useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/AdminOrderDetails.css";
import { useNavigate } from "react-router-dom";
import axios from "axios";

const OrderDetails = () => {
  const { id } = useParams();

  const navigate = useNavigate();

  const { user } = useContext(AuthContext);

  const [order, setOrder] = useState(null);
  const orderDate = order ? new Date(order.createdAt) : null;

  const today = new Date();

  const daysDiff = orderDate
    ? Math.floor((today - orderDate) / (1000 * 60 * 60 * 24))
    : 999;

  const canReturn = order && order.status === "Delivered" && daysDiff <= 7;

  useEffect(() => {
    const fetchOrder = async () => {
      const res = await fetch(`/api/orders/myorders/${id}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const data = await res.json();
      setOrder(data);
    };

    fetchOrder();
  }, [id, user]);

  const downloadInvoice = async () => {
    try {
      // const response = await axios.get(`/api/orders/${order._id}/invoice`, {
      //   responseType: "blob",
      //   headers: {
      //     Authorization: `Bearer ${localStorage.getItem("token")}`,
      //   },
      // });
      const response = await axios.get(`/api/orders/${order._id}/invoice`, {
        responseType: "blob",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      const url = window.URL.createObjectURL(new Blob([response.data]));

      const link = document.createElement("a");

      link.href = url;
      link.setAttribute("download", `invoice-${order._id}.pdf`);

      document.body.appendChild(link);
      link.click();
      link.remove();
    } catch (error) {
      console.error(error);
    }
  };

  if (!order || !order._id) {
    return <h2>Order Not Found</h2>;
  }

  return (
    <div className="order-details-container">
      <div className="stats-grid">
        <div className="stat-card">
          <h4>Order ID</h4>
          <p>{order._id.slice(-8)}</p>
        </div>

        <div className="stat-card">
          <h4>Date</h4>
          <p>{new Date(order.createdAt).toLocaleDateString()}</p>
        </div>

        <div className="stat-card">
          <h4>Payment</h4>
          <p>{order.paymentStatus}</p>
        </div>

        <div className="stat-card">
          <h4>Total</h4>
          <p>₹{order.totalAmount}</p>
        </div>
      </div>
      <div className="page-header">
        <div>
          <h1>Order Details</h1>

          <p>Complete customer order information</p>
        </div>

        <div
          className={`status-badge ${
            order.status === "Delivered" ? "success" : "warning"
          }`}
        >
          {order.status}
        </div>
      </div>
      <div className="info-card">
        <h2>Customer Information</h2>

        <div className="info-grid">
          <div>
            <label>Customer Name</label>
            <span>{order.customerName}</span>
          </div>

          <div>
            <label>Email</label>
            <span>{order.customerEmail}</span>
          </div>

          <div>
            <label>Phone</label>
            <span>{order.customerPhone}</span>
          </div>

          <div>
            <label>Order ID</label>
            <span>{order._id}</span>
          </div>
        </div>
      </div>

      {/* <h2>Products Purchased</h2> */}
      <div className="info-card">
        <h2>Products Purchased</h2>

        {/* {order.items.map((item) => (
          <div className="product-card"> */}
        {order.items.map((item, index) => (
          <div className="product-card" key={item._id || index}>
            <img
              src={item.productImage}
              alt={item.productName}
              className="product-image"
            />

            <div className="product-details">
              <h3>{item.productName}</h3>

              <div className="product-meta">
                <span>Qty: {item.qty}</span>

                <span>₹{item.price}</span>

                <span className="subtotal-pill">
                  Subtotal ₹{item.qty * item.price}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="info-card">
        <h2>Shipping Address</h2>

        <div className="info-grid">
          <div>
            <label>Name</label>
            <span>{order.shippingAddress.fullName}</span>
          </div>

          <div>
            <label>Phone</label>
            <span>{order.shippingAddress.phone}</span>
          </div>

          <div>
            <label>Address</label>
            <span>{order.shippingAddress.addressLine1}</span>
          </div>

          <div>
            <label>City</label>
            <span>{order.shippingAddress.city}</span>
          </div>

          <div>
            <label>State</label>
            <span>{order.shippingAddress.state}</span>
          </div>

          <div>
            <label>Pincode</label>
            <span>{order.shippingAddress.pincode}</span>
          </div>
        </div>
      </div>

      <div className="info-card">
        <h2>Payment Details</h2>

        <div className="info-grid">
          <div>
            <label>Method</label>
            <span>{order.paymentMethod}</span>
          </div>

          <div>
            <label>Status</label>

            <span
              className={order.paymentStatus === "Paid" ? "paid" : "pending"}
            >
              {order.paymentStatus}
            </span>
          </div>

          <div>
            <label>Payment ID</label>
            <span>{order.paymentId || "N/A"}</span>
          </div>
        </div>
      </div>

      <div className="summary-card">
        <h2>Order Summary</h2>

        <div className="summary-row">
          <span>Subtotal</span>
          <span>₹{order.subtotal}</span>
        </div>

        <div className="summary-row">
          <span>Shipping</span>
          <span>₹{order.shippingCharge}</span>
        </div>

        <div className="summary-row">
          <span>Tax</span>
          <span>₹{order.taxAmount}</span>
        </div>

        <div className="summary-row total">
          <span>Total</span>
          <span>₹{order.totalAmount}</span>
        </div>
        <div className="summary-row">
          <span>Order Status</span>

          <span
            style={{
              color: "#C8A96B",
              fontWeight: "700",
            }}
          >
            {order.status}
          </span>
        </div>
      </div>

      {/* <button className="invoice-btn" onClick={downloadInvoice}>
        Download Invoice
      </button> */}
      <div className="action-buttons">
        <button className="invoice-btn" onClick={downloadInvoice}>
          Download Invoice
        </button>

        {canReturn && (
          <button
            className="return-btn"
            onClick={() => navigate(`/return/${order._id}`)}
          >
            Return Product
          </button>
        )}
      </div>
    </div>
  );
};

export default OrderDetails;
