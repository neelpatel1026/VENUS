import { useEffect, useState, useContext } from "react";
import axios from "axios";
import { useParams, Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import AdminSidebar from "./AdminSidebar";
import { 
  LuUser, 
  LuMail, 
  LuPhone, 
  LuMapPin, 
  LuCalendar, 
  LuCreditCard, 
  LuWallet, 
  LuDownload, 
  LuFileSpreadsheet, 
  LuPackage, 
  LuTruck, 
  LuClock, 
  LuCheck, 
  LuX, 
  LuChevronLeft 
} from "react-icons/lu";

const AdminOrderDetails = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [order, setOrder] = useState(null);
  const [status, setStatus] = useState("Pending");
  const [confirmStatus, setConfirmStatus] = useState(null);
  const [customerOrdersCount, setCustomerOrdersCount] = useState(1);
  const [customerSince, setCustomerSince] = useState("");

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
      toast.error("Failed to load order details");
    }
  };

  useEffect(() => {
    if (user?.token) {
      fetchOrder();
    }
  }, [id, user]);

  // Fetch other orders of this customer to calculate count and history duration
  useEffect(() => {
    const fetchCustomerHistory = async () => {
      if (!order || !user?.token) return;
      try {
        const res = await axios.get("/api/orders", {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        const allOrders = res.data || [];
        const customerEmail = order.customerEmail || (order.userId && order.userId.email);
        if (customerEmail) {
          const history = allOrders.filter(
            (o) => (o.customerEmail && o.customerEmail.toLowerCase() === customerEmail.toLowerCase()) || 
                   (o.userId && o.userId.email?.toLowerCase() === customerEmail.toLowerCase())
          );
          setCustomerOrdersCount(history.length);
          
          if (history.length > 0) {
            const dates = history.map(o => new Date(o.createdAt));
            const earliest = new Date(Math.min(...dates));
            setCustomerSince(earliest.toLocaleDateString("en-US", { month: "short", year: "numeric" }));
          }
        }
      } catch (err) {
        console.error("Failed to fetch customer history:", err);
      }
    };
    fetchCustomerHistory();
  }, [order, user]);

  const updateStatus = async (newStatus) => {
    try {
      const res = await axios.put(
        `/api/orders/${order._id}/status`,
        { status: newStatus },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (res.data.success) {
        setOrder(res.data.order);
        setStatus(newStatus);
        setConfirmStatus(null);
        toast.success(`Order status updated to ${newStatus}!`);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to update status");
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
      toast.loading("Generating secure invoice...");
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
      toast.dismiss();
      toast.success("Invoice PDF statement downloaded!");
    } catch (error) {
      toast.dismiss();
      console.error("Failed to download invoice:", error);
      toast.error("Failed to download invoice PDF");
    }
  };

  const resendEmail = async () => {
    try {
      toast.loading("Resending status email notification...");
      const res = await axios.post(
        `/api/orders/${order._id}/resend-email`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      toast.dismiss();
      if (res.data.success) {
        toast.success(res.data.message || "Notification email resent successfully!");
      }
    } catch (err) {
      toast.dismiss();
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to resend notification email");
    }
  };

  if (!order) {
    return (
      <div className="admin-layout-wrapper">
        <AdminSidebar />
        <div className="admin-content-console" style={{ textAlign: "center", padding: "100px 0" }}>
          <div className="ordersuccess-spinner" style={{ margin: "0 auto 20px auto" }}></div>
          <p style={{ color: "#6B7280" }}>Retrieving order timeline credentials...</p>
        </div>
      </div>
    );
  }

  const orderDate = new Date(order.createdAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
  });

  const updatedDate = new Date(order.updatedAt).toLocaleDateString("en-US", {
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit"
  });

  // Calculate Subtotals & Discounts dynamically
  const itemsSubtotal = order.items?.reduce((sum, item) => sum + (item.price * item.qty), 0) || 0;
  const shippingCharge = order.shippingCharge || 0;
  const taxAmount = order.taxAmount || 0;
  const discountAmount = Math.max(0, itemsSubtotal - order.totalAmount);

  // Status badge config
  const statusBadges = {
    Pending: { color: "#F59E0B", icon: <LuClock /> },
    Processing: { color: "#8B5CF6", icon: <LuClock /> },
    Packed: { color: "#2563EB", icon: <LuPackage /> },
    Shipped: { color: "#3B82F6", icon: <LuTruck /> },
    "Out For Delivery": { color: "#06B6D4", icon: <LuTruck /> },
    Delivered: { color: "#10B981", icon: <LuCheck /> },
    Cancelled: { color: "#EF4444", icon: <LuX /> },
    "Return Requested": { color: "#F59E0B", icon: <LuClock /> },
    "Return Approved": { color: "#10B981", icon: <LuCheck /> },
    "Refund Completed": { color: "#10B981", icon: <LuCheck /> },
    Returned: { color: "#EF4444", icon: <LuX /> }
  };

  const currentBadge = statusBadges[order.status] || { color: "#6B7280", icon: <LuClock /> };

  return (
    <div className="admin-layout-wrapper">
      {/* LEFT COLUMN: SIDEBAR */}
      <AdminSidebar />

      {/* RIGHT COLUMN: MAIN CONTENT */}
      <div className="admin-content-console" style={{ background: "#F8F8F8" }}>
        
        {/* Header toolbar */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "32px", flexWrap: "wrap", gap: "16px" }}>
          <div>
            <Link to="/admin/orders" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#6B7280", fontSize: "14px", textDecoration: "none", marginBottom: "8px", fontWeight: "600" }}>
              <LuChevronLeft /> Back to Orders
            </Link>
            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <h2 style={{ fontSize: "30px", fontWeight: "700", color: "#1A1A1A", fontFamily: "'Cinzel', serif", margin: "0" }}>
                Order #{order._id.slice(-8).toUpperCase()}
              </h2>
              <span className={`badge-shipment ${(order.status || "Pending").toLowerCase().replace(/\s+/g, "")}`}>
                {order.status}
              </span>
            </div>
          </div>
          
          <div style={{ display: "flex", gap: "12px" }}>
            <button onClick={downloadInvoice} className="btn-admin-invoice">
              <LuDownload /> Download Invoice
            </button>
            <button onClick={resendEmail} className="btn-admin-secondary" style={{ display: "inline-flex", alignItems: "center", gap: "6px", background: "#FFFFFF", color: "#1A1A1A", border: "1px solid #ECECEC" }}>
              📨 Resend Email
            </button>
            {order.status === "Returned" && order.paymentStatus === "Paid" && (
              <button onClick={refundOrder} className="btn-admin-export" style={{ background: "#DC2626" }}>
                💸 Issue Refund
              </button>
            )}
          </div>
        </div>

        {/* 2-COLUMN DETAILS GRID */}
        <div style={{ display: "grid", gridTemplateColumns: "2.1fr 1.1fr", gap: "28px", alignItems: "start" }}>
          
          {/* LEFT: PRODUCTS TABLE & STATUS MANAGEMENT */}
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            
            {/* Products Purchased module */}
            <div className="admin-card-container" style={{ padding: "32px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#1A1A1A", fontFamily: "'Cinzel', serif", margin: "0 0 24px 0" }}>
                Ordered Products
              </h3>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #ECECEC", textAlign: "left" }}>
                      <th style={{ paddingBottom: "12px", color: "#6B7280", fontSize: "13px", fontWeight: "600" }}>Product</th>
                      <th style={{ paddingBottom: "12px", color: "#6B7280", fontSize: "13px", fontWeight: "600" }}>Category</th>
                      <th style={{ paddingBottom: "12px", color: "#6B7280", fontSize: "13px", fontWeight: "600", textAlign: "center" }}>Qty</th>
                      <th style={{ paddingBottom: "12px", color: "#6B7280", fontSize: "13px", fontWeight: "600" }}>Price</th>
                      <th style={{ paddingBottom: "12px", color: "#6B7280", fontSize: "13px", fontWeight: "600" }}>Discount</th>
                      <th style={{ paddingBottom: "12px", color: "#6B7280", fontSize: "13px", fontWeight: "600", textAlign: "right" }}>Subtotal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(order.items || []).map((item, idx) => {
                      const itemSubtotal = item.price * item.qty;
                      const hasDiscount = item.productId?.originalPrice > item.price;
                      const discPercent = hasDiscount 
                        ? Math.round(((item.productId.originalPrice - item.price) / item.productId.originalPrice) * 100)
                        : 0;

                      return (
                        <tr key={idx} style={{ borderBottom: "1px solid #ECECEC" }}>
                          
                          {/* Image & name */}
                          <td style={{ padding: "16px 0", display: "flex", alignItems: "center", gap: "14px" }}>
                            <img 
                              src={item.productImage || "/cosmetic_1.avif"} 
                              alt={item.productName} 
                              style={{ width: "70px", height: "70px", borderRadius: "8px", objectFit: "contain", background: "#FFFFFF", border: "1px solid #ECECEC" }}
                              onError={(e) => { e.target.src = "/cosmetic_1.avif"; }}
                            />
                            <span style={{ fontWeight: "600", fontSize: "14.5px", color: "#1A1A1A" }}>{item.productName}</span>
                          </td>

                          {/* Category */}
                          <td style={{ padding: "16px 0", color: "#6B7280", fontSize: "14px" }}>
                            {item.productId?.category || "Cosmetics"}
                          </td>

                          {/* Quantity */}
                          <td style={{ padding: "16px 0", textAlign: "center", fontWeight: "600", fontSize: "14.5px", color: "#1A1A1A" }}>
                            {item.qty}
                          </td>

                          {/* Price */}
                          <td style={{ padding: "16px 0", fontSize: "14px", color: "#1A1A1A" }}>
                            ₹{item.price.toFixed(2)}
                          </td>

                          {/* Discount */}
                          <td style={{ padding: "16px 0", fontSize: "13.5px", color: discPercent > 0 ? "#16A34A" : "#6B7280" }}>
                            {discPercent > 0 ? `${discPercent}% Off` : "—"}
                          </td>

                          {/* Subtotal */}
                          <td style={{ padding: "16px 0", textAlign: "right", fontWeight: "700", fontSize: "15px", color: "#1A1A1A" }}>
                            ₹{itemSubtotal.toFixed(2)}
                          </td>

                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Total Summary Footer */}
              <div style={{ display: "flex", justifyContent: "space-between", marginTop: "24px", padding: "16px 20px", background: "#FAFAFA", borderRadius: "12px" }}>
                <span style={{ fontSize: "14px", color: "#6B7280" }}>
                  Total Products: <strong>{order.items?.length || 0}</strong>
                </span>
                <span style={{ fontSize: "14px", color: "#6B7280" }}>
                  Total Quantity: <strong>{order.items?.reduce((s, i) => s + i.qty, 0) || 0}</strong>
                </span>
              </div>

            </div>

            {/* STATUS UPDATE ACTION PANEL */}
            <div className="admin-card-container" style={{ padding: "32px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#1A1A1A", fontFamily: "'Cinzel', serif", margin: "0 0 12px 0" }}>
                Status Management
              </h3>
              <p style={{ color: "#6B7280", fontSize: "13.5px", margin: "0 0 24px 0" }}>
                Transition order sequence correctly according to premium ecommerce policies.
              </p>

              {confirmStatus ? (
                <div style={{ background: "#FAF9F6", border: "1px solid #ECE7DF", borderRadius: "12px", padding: "20px", marginBottom: "20px" }}>
                  <p style={{ margin: "0 0 15px 0", fontSize: "14px", color: "#1A1A1A", fontWeight: "500" }}>
                    Are you sure you want to transition order status from <strong>{order.status}</strong> to <strong>{confirmStatus}</strong>?
                  </p>
                  <div style={{ display: "flex", gap: "10px" }}>
                    <button 
                      type="button" 
                      onClick={() => updateStatus(confirmStatus)} 
                      style={{ background: "#C8A165", color: "#FFFFFF", border: "none", padding: "8px 16px", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}
                    >
                      Confirm Transition
                    </button>
                    <button 
                      type="button" 
                      onClick={() => setConfirmStatus(null)} 
                      style={{ background: "#FFFFFF", color: "#6B7280", border: "1px solid #ECE7DF", padding: "8px 16px", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              ) : null}

              {(() => {
                const allStatuses = [
                  "Pending",
                  "Processing",
                  "Packed",
                  "Shipped",
                  "Out For Delivery",
                  "Delivered",
                  "Cancelled",
                  "Return Requested",
                  "Return Approved",
                  "Refund Completed"
                ];

                const available = allStatuses.filter(s => s !== order.status);
                
                return (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}>
                    {available.map((s) => {
                      const cfg = statusBadges[s] || { color: "#6B7280", icon: <LuClock /> };
                      return (
                        <button
                          key={s}
                          type="button"
                          onClick={() => setConfirmStatus(s)}
                          style={{
                            display: "inline-flex",
                            alignItems: "center",
                            gap: "8px",
                            padding: "9px 16px",
                            borderRadius: "30px",
                            fontSize: "13px",
                            fontWeight: "600",
                            cursor: "pointer",
                            border: "1px solid #ECECEC",
                            transition: "all 0.2s ease",
                            background: "#FFFFFF",
                            color: "#1A1A1A"
                          }}
                          className="status-btn-hover"
                        >
                          {cfg.icon} Move to {s}
                        </button>
                      );
                    })}
                  </div>
                );
              })()}

            </div>

            {/* ORDER TIMELINE HISTORY */}
            <div className="admin-card-container" style={{ padding: "32px" }}>
              <h3 style={{ fontSize: "20px", fontWeight: "700", color: "#1A1A1A", fontFamily: "'Cinzel', serif", margin: "0 0 20px 0" }}>
                Status History Timeline
              </h3>
              <div style={{ display: "flex", flexDirection: "column", gap: "20px", position: "relative", paddingLeft: "24px", borderLeft: "2px solid #ECE7DF" }}>
                {(order.orderTimeline || []).map((t, idx) => (
                  <div key={idx} style={{ position: "relative" }}>
                    <div style={{
                      position: "absolute",
                      left: "-31px",
                      top: "4px",
                      width: "12px",
                      height: "12px",
                      borderRadius: "50%",
                      background: idx === (order.orderTimeline.length - 1) ? "#C8A165" : "#10B981",
                      border: "3px solid #FFFFFF",
                      boxShadow: "0 0 0 2px " + (idx === (order.orderTimeline.length - 1) ? "#C8A165" : "#10B981"),
                      animation: idx === (order.orderTimeline.length - 1) ? "pulse-gold 2s infinite" : "none"
                    }} />
                    <div style={{ fontWeight: "700", fontSize: "14.5px", color: "#1A1A1A" }}>{t.status}</div>
                    <div style={{ fontSize: "12px", color: "#6B7280", marginTop: "4px" }}>
                      {new Date(t.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} •{" "}
                      {new Date(t.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} • Updated by: <strong>{t.updatedBy || "System"}</strong>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          {/* RIGHT: ORDER SUMMARY & CUSTOMER DETAILS */}
          <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
            
            {/* ORDER SUMMARY CARD */}
            <div className="admin-card-container" style={{ padding: "28px" }}>
              <h4 style={{ fontSize: "18px", fontWeight: "700", color: "#1A1A1A", fontFamily: "'Cinzel', serif", margin: "0 0 20px 0" }}>
                Order Summary
              </h4>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14.5px" }}>
                  <span style={{ color: "#6B7280" }}>Subtotal</span>
                  <span style={{ color: "#1A1A1A", fontWeight: "500" }}>₹{itemsSubtotal.toFixed(2)}</span>
                </div>
                
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14.5px" }}>
                  <span style={{ color: "#6B7280" }}>Shipping</span>
                  <span style={{ color: "#16A34A", fontWeight: "600" }}>
                    {shippingCharge === 0 ? "FREE" : `₹${shippingCharge.toFixed(2)}`}
                  </span>
                </div>

                {discountAmount > 0 && (
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14.5px" }}>
                    <span style={{ color: "#16A34A" }}>Coupon Discount</span>
                    <span style={{ color: "#16A34A", fontWeight: "600" }}>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "14.5px" }}>
                  <span style={{ color: "#6B7280" }}>GST / Taxes</span>
                  <span style={{ color: "#6B7280" }}>Included</span>
                </div>

                <hr style={{ border: "0", height: "1px", background: "#ECECEC", margin: "8px 0" }} />

                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "16px" }}>
                  <span style={{ color: "#1A1A1A", fontWeight: "600" }}>Grand Total</span>
                  <strong style={{ color: "#1A1A1A", fontSize: "18px", fontWeight: "700" }}>
                    ₹{order.totalAmount.toFixed(2)}
                  </strong>
                </div>

                <hr style={{ border: "0", height: "1px", background: "#ECECEC", margin: "8px 0" }} />

                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13.5px", color: "#6B7280" }}>
                  <div>
                    Payment Method: <strong style={{ color: "#1A1A1A" }}>{order.paymentMethod}</strong>
                  </div>
                  <div>
                    Payment Status: <strong style={{ color: "#1A1A1A" }}>{order.paymentStatus}</strong>
                  </div>
                  <div>
                    Placed Date: <strong style={{ color: "#1A1A1A" }}>{orderDate}</strong>
                  </div>
                  <div>
                    Last Updated: <strong style={{ color: "#1A1A1A" }}>{updatedDate}</strong>
                  </div>
                </div>

              </div>
            </div>

            {/* CUSTOMER DETAILS CARD */}
            <div className="admin-card-container" style={{ padding: "28px" }}>
              <h4 style={{ fontSize: "18px", fontWeight: "700", color: "#1A1A1A", fontFamily: "'Cinzel', serif", margin: "0 0 20px 0" }}>
                Customer Details
              </h4>

              <div style={{ display: "flex", gap: "14px", alignItems: "center", marginBottom: "20px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "50%", background: "rgba(200, 161, 101, 0.1)", display: "flex", alignItems: "center", justifyContent: "center", color: "#C8A165" }}>
                  <LuUser style={{ fontSize: "22px" }} />
                </div>
                <div>
                  <h4 style={{ margin: "0 0 2px 0", fontSize: "15px", fontWeight: "700", color: "#1A1A1A" }}>
                    {order.customerName || (order.userId && order.userId.name) || "Guest Customer"}
                  </h4>
                  <span style={{ fontSize: "12.5px", color: "#6B7280" }}>
                    {order.customerEmail || (order.userId && order.userId.email) || ""}
                  </span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "14px" }}>
                
                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <LuPhone style={{ color: "#C8A165", marginTop: "2px", flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#6B7280", fontWeight: "600" }}>Phone</span>
                    <p style={{ margin: "2px 0 0 0", color: "#1A1A1A", fontWeight: "500" }}>
                      {order.customerPhone || "—"}
                    </p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "10px", alignItems: "flex-start" }}>
                  <LuMapPin style={{ color: "#C8A165", marginTop: "2px", flexShrink: 0 }} />
                  <div>
                    <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#6B7280", fontWeight: "600" }}>Delivery Address</span>
                    <p style={{ margin: "2px 0 0 0", color: "#1A1A1A", fontWeight: "500", lineHeight: "1.4" }}>
                      {order.shippingAddress?.fullName}
                      <br />
                      {order.shippingAddress?.addressLine1}
                      {order.shippingAddress?.addressLine2 && `, ${order.shippingAddress.addressLine2}`}
                      <br />
                      {order.shippingAddress?.city}, {order.shippingAddress?.state} - <strong>{order.shippingAddress?.pincode}</strong>
                      <br />
                      {order.shippingAddress?.country || "India"}
                    </p>
                  </div>
                </div>

                <hr style={{ border: "0", height: "1px", background: "#ECECEC", margin: "4px 0" }} />

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                  <div>
                    <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#6B7280", fontWeight: "600" }}>Order Count</span>
                    <p style={{ margin: "2px 0 0 0", color: "#1A1A1A", fontWeight: "700", fontSize: "15px" }}>
                      {customerOrdersCount} {customerOrdersCount === 1 ? "Order" : "Orders"}
                    </p>
                  </div>
                  <div>
                    <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#6B7280", fontWeight: "600" }}>Customer Since</span>
                    <p style={{ margin: "2px 0 0 0", color: "#1A1A1A", fontWeight: "700", fontSize: "15px" }}>
                      {customerSince || "New"}
                    </p>
                  </div>
                </div>

              </div>

              {/* GIFT DETAILS CARD */}
              {order.isGift && (
                <div className="admin-card-container" style={{ padding: "28px", marginTop: "28px", borderLeft: "4px solid #C8A165" }}>
                  <h4 style={{ fontSize: "18px", fontWeight: "700", color: "#1A1A1A", fontFamily: "'Cinzel', serif", margin: "0 0 20px 0" }}>
                    Gifting Information
                  </h4>
                  
                  <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "14px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#6B7280" }}>Is Gift Order:</span>
                      <strong style={{ color: "#16A34A" }}>YES</strong>
                    </div>
                    
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#6B7280" }}>Gift Wrap:</span>
                      <strong style={{ color: order.giftWrap ? "#16A34A" : "#6B7280" }}>{order.giftWrap ? "YES" : "NO"}</strong>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#6B7280" }}>Luxury Gift Box:</span>
                      <strong style={{ color: order.giftBox ? "#16A34A" : "#6B7280" }}>{order.giftBox ? "YES" : "NO"}</strong>
                    </div>

                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span style={{ color: "#6B7280" }}>Gift Receipt (Hide Price):</span>
                      <strong style={{ color: order.giftReceipt ? "#16A34A" : "#6B7280" }}>{order.giftReceipt ? "YES" : "NO"}</strong>
                    </div>

                    {order.giftMessage && (
                      <div style={{ marginTop: "10px", padding: "12px", background: "#FAFAFA", borderRadius: "8px", border: "1px solid #ECECEC" }}>
                        <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#6B7280", fontWeight: "600", display: "block", marginBottom: "4px" }}>
                          Personalized Message
                        </span>
                        <p style={{ margin: 0, color: "#1A1A1A", fontStyle: "italic", lineHeight: "1.4" }}>
                          "{order.giftMessage}"
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

            </div>

          </div>

        </div>

      </div>
    </div>
  );
};

export default AdminOrderDetails;
