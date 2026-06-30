import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/AdminOrderDetails.css";

const AdminOrderDetails = () => {
  const { id } = useParams();

  const { user } = useContext(AuthContext);

  const [order, setOrder] = useState(null);
  // const [status, setStatus] = useState(order?.status || "Pending");
  const [status, setStatus] = useState("Pending");

  const updateStatus = async () => {
    try {
      const res = await axios.put(
        `/api/orders/${order._id}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );

      console.log(res.data);

      if (res.data.success) {
        setOrder((prev) => ({
          ...prev,
          status,
        }));

        alert("Status Updated Successfully");
      }
    } catch (error) {
      console.error(error);
      alert("Failed to update status");
    }
  };
  const refundOrder = async () => {
    try {
      const res = await axios.post(
        `/api/payment/refund/${order._id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );

      alert(res.data.message);

      window.location.reload();
    } catch (error) {
      alert(error.response?.data?.message);
    }
  };

  const downloadInvoice = async () => {
    try {
      const response = await fetch(`/api/orders/${order._id}/invoice`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download = `invoice-${order._id}.pdf`;

      document.body.appendChild(link);

      link.click();

      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
    }
  };
  useEffect(() => {
    const fetchOrder = async () => {
      try {
        const res = await axios.get(`/api/orders/${id}`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        setOrder(res.data);
        setStatus(res.data.status);
      } catch (error) {
        console.error(error);
      }
    };

    if (user?.token) {
      fetchOrder();
    }
  }, [id, user]);

  if (!order) {
    return <h2>Loading...</h2>;
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
      {/* <a
        href={`/api/orders/${order._id}/invoice`}
        target="_blank"
        rel="noreferrer"
        className="invoice-btn"
      >
        Download Invoice
      </a> */}

      <button onClick={downloadInvoice} className="invoice-btn">
        Download Invoice
      </button>
      {/* {order.status === "Returned" && order.paymentStatus !== "Refunded" && ( */}
      {order.status === "Returned" && order.paymentStatus === "Paid" && (
        <button onClick={refundOrder} className="refund-btn">
          Refund Customer
        </button>
      )}
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

        {order.items.map((item, index) => (
          <div className="product-card" key={index}>
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
      {order.deliveredAt && (
        <div className="info-card">
          <h2>Return Window</h2>

          <div className="info-grid">
            <div>
              <label>Delivered At</label>

              <span>{new Date(order.deliveredAt).toLocaleDateString()}</span>
            </div>

            <div>
              <label>Return Allowed Till</label>

              <span>
                {new Date(order.returnAllowedTill).toLocaleDateString()}
              </span>
            </div>
          </div>
        </div>
      )}

      <div className="info-card">
        <h2>Payment Details</h2>
        {order.paymentStatus === "Refunded" && (
          <div className="info-card">
            <h2>Refund Information</h2>

            <div className="info-grid">
              <div>
                <label>Refund Status</label>

                <span>{order.refundTracking?.status}</span>
              </div>

              <div>
                <label>Refund Date</label>

                <span>
                  {order.refundedAt
                    ? new Date(order.refundedAt).toLocaleDateString()
                    : "N/A"}
                </span>
              </div>
            </div>
          </div>
        )}
        <div className="info-card">
          <h2>Admin Notes</h2>

          <textarea
            value={order.adminNotes || ""}
            readOnly
            style={{
              width: "100%",
              minHeight: "120px",
              padding: "15px",
              borderRadius: "10px",
              border: "1px solid #ddd",
            }}
          />
        </div>

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
      {/* <div className="status-section"> */}

      <div className="status-section premium-status">
        <h3>Order Status</h3>

        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          {/* <option value="Pending">Pending</option>
          <option value="Processing">Processing</option>
          <option value="Shipped">Shipped</option>
          <option value="Delivered">Delivered</option>
          <option value="Cancelled">Cancelled</option>
          <option value="Refunded">Refunded</option> */}

          <option value="Pending">Pending</option>
          <option value="Confirmed">Confirmed</option>
          <option value="Packed">Packed</option>
          <option value="Shipped">Shipped</option>
          <option value="Out For Delivery">Out For Delivery</option>
          <option value="Delivered">Delivered</option>
          <option value="Returned">Returned</option>
          <option value="Cancelled">Cancelled</option>
        </select>

        {/* <button onClick={updateStatus}>Update Status</button> */}
        <button onClick={updateStatus}>✓ Update Status</button>
      </div>
    </div>
  );
};

export default AdminOrderDetails;
