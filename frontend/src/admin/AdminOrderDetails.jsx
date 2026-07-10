import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import AdminSidebar from "./AdminSidebar";

const AdminOrderDetails = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [order, setOrder] = useState(null);
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
        }
      );

      if (res.data.success) {
        setOrder((prev) => ({
          ...prev,
          status,
        }));
        toast.success("Order status updated successfully!");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update status");
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
        }
      );

      if (res.data.success) {
        setOrder((prev) => ({
          ...prev,
          paymentStatus: "Refunded",
        }));
        toast.success("Refund processed successfully!");
      }
    } catch (error) {
      console.error(error.response?.data?.message || error.message);
      toast.error(error.response?.data?.message || "Failed to issue refund");
    }
  };

  const downloadInvoice = async () => {
    try {
      const response = await axios.get(`/api/orders/${order._id}/invoice`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        responseType: "blob",
      });

      const file = new Blob([response.data], { type: "application/pdf" });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = fileURL;
      link.setAttribute("download", `Invoice-${order._id}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error("Failed to download invoice:", error);
      toast.error("Failed to download invoice PDF");
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
    return (
      <div className="admin-layout-wrapper">
        <AdminSidebar />
        <div className="admin-content-console" style={{ textAlign: "center", padding: "100px 0" }}>
          <p style={{ color: "var(--admin-text-muted)" }}>Loading order details...</p>
        </div>
      </div>
    );
  }

  const orderDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  return (
    <div className="admin-layout-wrapper">
      {/* LEFT COLUMN: SIDEBAR */}
      <AdminSidebar />

      {/* RIGHT COLUMN: MAIN CONTENT */}
      <div className="admin-content-console">
        <div className="admin-page-header">
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <h2>Order Details</h2>
            <span className={`status-pill pill-${order.status.toLowerCase()}`}>{order.status}</span>
          </div>
          <div style={{ display: "flex", gap: "10px" }}>
            <button onClick={downloadInvoice} className="btn-admin-primary">
              📄 Invoice PDF
            </button>
            {order.status === "Returned" && order.paymentStatus === "Paid" && (
              <button onClick={refundOrder} className="btn-admin-outline" style={{ borderColor: "#DC2626", color: "#DC2626" }}>
                💸 Issue Refund
              </button>
            )}
            <Link to="/admin/orders" className="btn-admin-secondary">
              Back to Orders
            </Link>
          </div>
        </div>

        {/* ORDER OVERVIEW KPIs */}
        <div className="admin-kpis-grid">
          <div className="admin-kpi-card">
            <span className="kpi-title">Order ID</span>
            <h3 className="kpi-val" style={{ fontFamily: "monospace", fontSize: "1.1rem" }}>
              #{order._id.toUpperCase()}
            </h3>
          </div>
          <div className="admin-kpi-card">
            <span className="kpi-title">Order Date</span>
            <h3 className="kpi-val" style={{ fontSize: "1.1rem" }}>{orderDate}</h3>
          </div>
          <div className="admin-kpi-card">
            <span className="kpi-title">Payment Status</span>
            <h3 className="kpi-val" style={{ fontSize: "1.1rem" }}>{order.paymentStatus}</h3>
          </div>
          <div className="admin-kpi-card">
            <span className="kpi-title">Total Transaction</span>
            <h3 className="kpi-val gold-text" style={{ fontSize: "1.1rem" }}>₹{order.totalAmount.toFixed(2)}</h3>
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", alignItems: "start" }}>
          {/* CUSTOMER INFORMATION CARD */}
          <div className="admin-form-card" style={{ maxWidth: "100%" }}>
            <h3 style={{ marginBottom: "20px", fontWeight: "600", fontSize: "1.1rem" }}>
              Customer Shipping Address
            </h3>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div>
                <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--admin-text-muted)" }}>Name</span>
                <p style={{ fontWeight: "600", margin: "4px 0 0 0" }}>{order.customerName}</p>
              </div>
              <div>
                <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--admin-text-muted)" }}>Email</span>
                <p style={{ fontWeight: "600", margin: "4px 0 0 0" }}>{order.customerEmail}</p>
              </div>
              <div>
                <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--admin-text-muted)" }}>Phone</span>
                <p style={{ fontWeight: "600", margin: "4px 0 0 0" }}>{order.customerPhone}</p>
              </div>
              <div>
                <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--admin-text-muted)" }}>City / State</span>
                <p style={{ fontWeight: "600", margin: "4px 0 0 0" }}>
                  {order.shippingAddress?.city}, {order.shippingAddress?.state}
                </p>
              </div>
              <div style={{ gridColumn: "span 2" }}>
                <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--admin-text-muted)" }}>Address Street</span>
                <p style={{ fontWeight: "600", margin: "4px 0 0 0" }}>{order.shippingAddress?.addressLine}</p>
              </div>
            </div>
          </div>

          {/* UPDATE SHIPMENT STATUS CARD */}
          <div className="admin-form-card" style={{ maxWidth: "100%" }}>
            <h3 style={{ marginBottom: "20px", fontWeight: "600", fontSize: "1.1rem" }}>
              Update Order Status
            </h3>
            <div className="admin-form-group">
              <label>Shipment State</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value)}
                className="admin-form-input"
              >
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Preparing">Preparing</option>
                <option value="Packed">Packed</option>
                <option value="Shipped">Shipped</option>
                <option value="Out For Delivery">Out For Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Returned">Returned</option>
              </select>
            </div>
            <button onClick={updateStatus} className="btn-admin-primary">
              Apply Status Update
            </button>
          </div>
        </div>

        {/* PRODUCTS PURCHASED TABLE */}
        <div className="admin-table-container" style={{ marginTop: "40px" }}>
          <div className="admin-table-search-bar">
            <h3 style={{ margin: 0, fontWeight: "600", fontSize: "1.05rem" }}>Ordered Items</h3>
          </div>
          <table className="admin-premium-table">
            <thead>
              <tr>
                <th>Product Name</th>
                <th>Price</th>
                <th>Quantity</th>
                <th>Total Subtotal</th>
              </tr>
            </thead>
            <tbody>
              {order.products?.map((item, index) => {
                const subtotal = item.price * item.quantity;
                return (
                  <tr key={index}>
                    <td>
                      <strong style={{ fontWeight: "600" }}>{item.product?.name || "Product Item"}</strong>
                    </td>
                    <td>₹{item.price.toFixed(2)}</td>
                    <td>{item.quantity}</td>
                    <td>
                      <strong className="amount-gold">₹{subtotal.toFixed(2)}</strong>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

      </div>
    </div>
  );
};

export default AdminOrderDetails;
