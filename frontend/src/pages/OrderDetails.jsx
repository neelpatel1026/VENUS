import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useDispatch } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import { motion } from "framer-motion";
import { 
  LuPackage, 
  LuTruck, 
  LuReceipt, 
  LuRefreshCw, 
  LuStar, 
  LuShieldCheck, 
  LuMessageSquare, 
  LuDownload, 
  LuMapPin, 
  LuClock, 
  LuCheck,
  LuCopy,
  LuChevronRight,
  LuCreditCard
} from "react-icons/lu";
import toast from "react-hot-toast";
import axios from "axios";
import "../styles/orderdetails.css";

const OrderDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const { user } = useContext(AuthContext);

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [userReviews, setUserReviews] = useState([]);
  const [showReorderDialog, setShowReorderDialog] = useState(false);
  const [outOfStockItems, setOutOfStockItems] = useState([]);

  // Fetch Order details
  const fetchOrder = async () => {
    try {
      const res = await fetch(`/api/orders/myorders/${id}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        setOrder(data);
      } else {
        toast.error(data.message || "Failed to load tracking details");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load tracking details");
    } finally {
      setLoading(false);
    }
  };

  // Fetch User reviews to verify duplicate reviews
  const fetchUserReviews = async () => {
    if (!user?.token) return;
    try {
      const res = await axios.get("/api/reviews/myreviews", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      setUserReviews(res.data.reviews || []);
    } catch (err) {
      console.error("Failed to fetch user reviews", err);
    }
  };

  useEffect(() => {
    if (id && user?.token) {
      fetchOrder();
      fetchUserReviews();
    }
  }, [id, user]);

  // Real-time tracking updates (Polling every 30 seconds)
  useEffect(() => {
    if (!id || !user?.token) return;
    const interval = setInterval(() => {
      fetchOrder();
    }, 30000);
    return () => clearInterval(interval);
  }, [id, user]);

  // DOWNLOAD STATEMENT INVOICE
  const downloadInvoice = async () => {
    try {
      setInvoiceLoading(true);
      toast.loading("Generating official invoice PDF...");
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
    } finally {
      setInvoiceLoading(false);
    }
  };

  // COPY TRACKING ID
  const handleCopyTrackingId = () => {
    const trackingId = `VN-${order._id.slice(-8).toUpperCase()}`;
    navigator.clipboard.writeText(trackingId);
    toast.success("Tracking ID copied to clipboard!");
  };

  // COPY TRANSACTION ID
  const handleCopyTransactionId = (txId) => {
    if (!txId) return;
    navigator.clipboard.writeText(txId);
    toast.success("Transaction ID copied to clipboard!");
  };

  // Delhivery partner tracking gateway
  const handleTrackShipment = () => {
    toast.success("Opening partner tracking portal...");
    window.open("https://www.delhivery.com/", "_blank");
  };

  // Smooth scroll to chronology timeline
  const handleScrollToTimeline = () => {
    const el = document.getElementById("transit-chronology");
    if (el) {
      el.scrollIntoView({ behavior: "smooth" });
    }
  };

  // Prefilled support context for Need Help flow
  const handleNeedHelp = () => {
    navigate("/contact", {
      state: {
        orderId: order._id,
        productDetails: order.items.map(i => i.productName).join(", ")
      }
    });
  };

  // Reorder items
  const handleReorder = async () => {
    if (!order || !order.items) return;
    toast.loading("Verifying stock availability...");
    
    let addedCount = 0;
    let unavailable = [];

    for (const item of order.items) {
      if (item.productId) {
        try {
          const res = await axios.get(`/api/products/${item.productId}`);
          const currentProduct = res.data;
          const availableStock = currentProduct.stock || 0;

          if (availableStock >= item.qty) {
            dispatch(
              addToCart({
                _id: item.productId,
                name: item.productName,
                price: item.price,
                image: item.productImage || "/placeholder.jpg",
                stock: availableStock,
                qty: item.qty || 1,
              })
            );
            addedCount++;
          } else if (availableStock > 0) {
            dispatch(
              addToCart({
                _id: item.productId,
                name: item.productName,
                price: item.price,
                image: item.productImage || "/placeholder.jpg",
                stock: availableStock,
                qty: availableStock,
              })
            );
            addedCount++;
            unavailable.push(`${item.productName} (only ${availableStock} left)`);
          } else {
            unavailable.push(item.productName);
          }
        } catch (err) {
          console.error("Stock check failed", err);
          unavailable.push(item.productName);
        }
      }
    }

    toast.dismiss();

    if (unavailable.length > 0) {
      setOutOfStockItems(unavailable);
      setShowReorderDialog(true);
      if (addedCount > 0) {
        toast.success("Added available items to cart.");
      }
    } else {
      toast.success("All items added to cart! 🛍");
      navigate("/cart");
    }
  };

  if (loading) {
    return (
      <div className="orderdetails-loading-container" style={{ display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", minHeight: "65vh", background: "#FFFFFF" }}>
        <div className="ordersuccess-spinner" style={{ width: "42px", height: "42px", borderRadius: "50%", border: "3px solid #ECE7DF", borderTopColor: "#C8A165", animation: "spin 1s linear infinite" }} />
        <p style={{ marginTop: "16px", color: "#6B7280", fontSize: "14.5px", fontWeight: "500" }}>Retrieving real-time tracking metrics...</p>
      </div>
    );
  }

  if (!order || !order._id) {
    return (
      <div className="order-details-error-page" style={{ textAlign: "center", padding: "100px 20px", background: "#FFFFFF", minHeight: "60vh" }}>
        <h2 style={{ fontSize: "24px", color: "#1A1A1A", fontFamily: "'Cinzel', serif" }}>Order Record Not Found</h2>
        <p style={{ color: "#6B7280", margin: "12px 0 24px 0" }}>The requested order tracking log does not exist or has expired.</p>
        <Link to="/profile" style={{ textDecoration: "none", padding: "12px 28px", borderRadius: "30px", background: "#C8A165", color: "#FFFFFF", fontWeight: "700" }}>Back to Orders</Link>
      </div>
    );
  }

  const orderDate = new Date(order.createdAt);
  const today = new Date();
  const daysDiff = Math.floor((today - orderDate) / (1000 * 60 * 60 * 24));
  const isReturnPeriodActive = order.status === "Delivered" && daysDiff <= 7;
  const isReturnExpired = order.status === "Delivered" && daysDiff > 7;

  // ETA Calculation (4 days after order date)
  const getEtaDateString = () => {
    const etaDate = new Date(order.createdAt);
    etaDate.setDate(etaDate.getDate() + 4);
    return etaDate.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric", year: "numeric" });
  };

  const stepsList = ["Pending", "Processing", "Packed", "Shipped", "Out For Delivery", "Delivered"];
  const currentIdx = stepsList.indexOf(order.status);
  const isCancelled = order.status === "Cancelled";

  // Status Colors & Badge Mapping
  const getStatusBadgeStyle = (status) => {
    switch (status) {
      case "Pending":
        return { bg: "rgba(37, 99, 235, 0.08)", color: "#2563EB", label: "Confirmed" };
      case "Processing":
        return { bg: "rgba(249, 115, 22, 0.08)", color: "#F97316", label: "Processing" };
      case "Packed":
        return { bg: "rgba(139, 92, 246, 0.08)", color: "#8B5CF6", label: "Packed" };
      case "Shipped":
        return { bg: "rgba(99, 102, 241, 0.08)", color: "#6366F1", label: "Shipped" };
      case "Out For Delivery":
        return { bg: "rgba(200, 161, 101, 0.08)", color: "#C8A165", label: "Out For Delivery" };
      case "Delivered":
        return { bg: "rgba(22, 163, 74, 0.08)", color: "#16A34A", label: "Delivered" };
      case "Cancelled":
        return { bg: "rgba(220, 38, 38, 0.08)", color: "#DC2626", label: "Cancelled" };
      case "Return Requested":
      case "Return Approved":
      case "Returned":
        return { bg: "rgba(217, 119, 6, 0.08)", color: "#D97706", label: status };
      case "Refund Completed":
        return { bg: "rgba(5, 150, 105, 0.08)", color: "#059669", label: "Refunded" };
      default:
        return { bg: "#F3F4F6", color: "#6B7280", label: status };
    }
  };

  const badgeStyle = getStatusBadgeStyle(order.status);

  // Status Descriptions Dictionary
  const statusDescriptions = {
    Pending: "Order placed successfully and confirmed by merchant.",
    Processing: "Payment verified; items sent to warehouse fulfillment desk.",
    Packed: "Items packed in eco-friendly luxury box with protective cushion.",
    Shipped: "Parcel handed over to logistics carrier partner for transit.",
    "Out For Delivery": "Courier agent dispatched for final destination delivery.",
    Delivered: "Parcel delivered safely to recipient address.",
  };

  const itemsSubtotal = (order.items || []).reduce((acc, item) => acc + (item.qty * item.price), 0);
  const discountAmount = order.discountAmount || 0;
  const shippingCharge = order.shippingPrice || 0;

  return (
    <div style={{ background: "#FFFFFF", color: "#1A1A1A", minHeight: "100vh", padding: "40px 20px 80px 20px", fontFamily: "'Inter', sans-serif" }}>
      <div style={{ maxWidth: "1180px", margin: "0 auto" }}>
        
        {/* BREADCRUMB NAVIGATION */}
        <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#6B7280", marginBottom: "24px" }}>
          <Link to="/" style={{ color: "#6B7280", textDecoration: "none" }}>Home</Link>
          <LuChevronRight size={14} />
          <Link to="/profile" style={{ color: "#6B7280", textDecoration: "none" }}>Account</Link>
          <LuChevronRight size={14} />
          <span style={{ color: "#C8A165", fontWeight: "600" }}>Order #{order._id.slice(-8).toUpperCase()}</span>
        </div>

        {/* 1. TOP HEADER & METRICS BAR */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          style={{
            background: "#FFFFFF",
            border: "1px solid #ECE7DF",
            borderRadius: "24px",
            padding: "32px",
            marginBottom: "28px",
            boxShadow: "0 6px 20px rgba(0,0,0,0.02)",
          }}
        >
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px", marginBottom: "28px", borderBottom: "1px solid #F3F4F6", paddingBottom: "24px" }}>
            <div>
              <div style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#C8A165", fontSize: "11px", fontWeight: "700", letterSpacing: "1.5px", textTransform: "uppercase", marginBottom: "6px" }}>
                <span>VENUS CARE</span>
                <span>•</span>
                <span>TRACKING PORTAL</span>
              </div>
              <h1 style={{ fontSize: "clamp(1.8rem, 3.5vw, 2.4rem)", fontWeight: "700", fontFamily: "'Cinzel', 'Georgia', serif", color: "#1A1A1A", margin: 0 }}>
                Order #{order._id.slice(-8).toUpperCase()}
              </h1>
              <p style={{ color: "#6B7280", fontSize: "13.5px", marginTop: "4px" }}>
                Placed on {orderDate.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
              </p>
            </div>

            <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
              <span
                style={{
                  background: badgeStyle.bg,
                  color: badgeStyle.color,
                  padding: "8px 22px",
                  borderRadius: "30px",
                  fontSize: "13px",
                  fontWeight: "700",
                  textTransform: "uppercase",
                  letterSpacing: "0.5px",
                  border: `1px solid ${badgeStyle.color}33`,
                }}
              >
                {badgeStyle.label}
              </span>
            </div>
          </div>

          {/* Header Summary Grid */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "20px" }}>
            <div style={{ background: "#FAFAFA", padding: "16px 20px", borderRadius: "16px", border: "1px solid #ECE7DF" }}>
              <div style={{ fontSize: "11px", textTransform: "uppercase", color: "#6B7280", fontWeight: "700", letterSpacing: "0.5px" }}>Estimated Delivery</div>
              <div style={{ fontSize: "16px", fontWeight: "700", color: "#C8A165", marginTop: "4px" }}>
                {isCancelled ? "Cancelled" : order.status === "Delivered" ? "Delivered" : getEtaDateString()}
              </div>
              <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }}>Delhivery Express Service</div>
            </div>

            <div style={{ background: "#FAFAFA", padding: "16px 20px", borderRadius: "16px", border: "1px solid #ECE7DF" }}>
              <div style={{ fontSize: "11px", textTransform: "uppercase", color: "#6B7280", fontWeight: "700", letterSpacing: "0.5px" }}>AWB Tracking Number</div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "4px" }}>
                <span style={{ fontSize: "15px", fontWeight: "700", color: "#1A1A1A" }}>VN-{order._id.slice(-8).toUpperCase()}</span>
                <button onClick={handleCopyTrackingId} title="Copy Tracking ID" style={{ background: "none", border: "none", color: "#C8A165", cursor: "pointer", display: "flex", alignItems: "center" }}>
                  <LuCopy size={15} />
                </button>
              </div>
              <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }}>Courier: Delhivery Logistics</div>
            </div>

            <div style={{ background: "#FAFAFA", padding: "16px 20px", borderRadius: "16px", border: "1px solid #ECE7DF" }}>
              <div style={{ fontSize: "11px", textTransform: "uppercase", color: "#6B7280", fontWeight: "700", letterSpacing: "0.5px" }}>Payment Method</div>
              <div style={{ fontSize: "15px", fontWeight: "700", color: "#1A1A1A", marginTop: "4px" }}>{order.paymentMethod}</div>
              <div style={{ fontSize: "11px", color: order.paymentStatus === "Paid" ? "#16A34A" : "#DC2626", marginTop: "2px", fontWeight: "600" }}>Status: {order.paymentStatus}</div>
            </div>

            <div style={{ background: "#FAFAFA", padding: "16px 20px", borderRadius: "16px", border: "1px solid #ECE7DF" }}>
              <div style={{ fontSize: "11px", textTransform: "uppercase", color: "#6B7280", fontWeight: "700", letterSpacing: "0.5px" }}>Grand Total</div>
              <div style={{ fontSize: "17px", fontWeight: "800", color: "#1A1A1A", marginTop: "4px" }}>₹{order.totalAmount.toFixed(2)}</div>
              <div style={{ fontSize: "11px", color: "#9CA3AF", marginTop: "2px" }}>{order.items?.length || 0} Item(s)</div>
            </div>
          </div>
        </motion.div>

        {/* 2. QUICK ACTIONS MODULE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.1 }}
          style={{ background: "#FFFFFF", border: "1px solid #ECE7DF", borderRadius: "24px", padding: "24px 32px", marginBottom: "28px", boxShadow: "0 6px 20px rgba(0,0,0,0.02)" }}
        >
          <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1.5px", color: "#6B7280", fontWeight: "700", marginBottom: "14px" }}>
            QUICK ACTIONS & TOOLS
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "12px" }}>
            <button 
              onClick={handleTrackShipment} 
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", border: "1px solid #C8A165", background: "#C8A165", color: "#FFFFFF", padding: "11px 22px", borderRadius: "30px", fontSize: "13.5px", fontWeight: "700", cursor: "pointer" }}
            >
              <LuTruck size={16} />
              <span>Track Shipment</span>
            </button>

            <button 
              onClick={downloadInvoice} 
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", border: "1px solid #ECE7DF", background: "#FFFFFF", color: "#1A1A1A", padding: "11px 22px", borderRadius: "30px", fontSize: "13.5px", fontWeight: "600", cursor: "pointer" }}
            >
              <LuReceipt size={16} color="#C8A165" />
              <span>Download Invoice</span>
            </button>

            {order.status === "Delivered" && (
              <button 
                onClick={handleReorder} 
                style={{ display: "inline-flex", alignItems: "center", gap: "8px", border: "1px solid #ECE7DF", background: "#FFFFFF", color: "#1A1A1A", padding: "11px 22px", borderRadius: "30px", fontSize: "13.5px", fontWeight: "600", cursor: "pointer" }}
              >
                <LuRefreshCw size={16} color="#C8A165" />
                <span>Buy Again</span>
              </button>
            )}

            {isReturnPeriodActive && (
              <button 
                onClick={() => navigate(`/return/${order._id}`)} 
                style={{ display: "inline-flex", alignItems: "center", gap: "8px", border: "1px solid #EF4444", background: "#FFFFFF", color: "#EF4444", padding: "11px 22px", borderRadius: "30px", fontSize: "13.5px", fontWeight: "600", cursor: "pointer" }}
              >
                <LuRefreshCw size={16} />
                <span>Return Request</span>
              </button>
            )}

            <button 
              onClick={handleNeedHelp} 
              style={{ display: "inline-flex", alignItems: "center", gap: "8px", border: "1px solid #ECE7DF", background: "#FFFFFF", color: "#1A1A1A", padding: "11px 22px", borderRadius: "30px", fontSize: "13.5px", fontWeight: "600", cursor: "pointer" }}
            >
              <LuMessageSquare size={16} color="#C8A165" />
              <span>Need Help</span>
            </button>

            <Link
              to="/shop"
              style={{ textDecoration: "none", display: "inline-flex", alignItems: "center", gap: "8px", border: "1px solid #ECE7DF", background: "#FFFFFF", color: "#6B7280", padding: "11px 22px", borderRadius: "30px", fontSize: "13.5px", fontWeight: "600" }}
            >
              <span>Continue Shopping</span>
            </Link>
          </div>
        </motion.div>

        {/* 3. HORIZONTAL PROGRESS TRACKER */}
        {!isCancelled && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.15 }}
            style={{ background: "#FFFFFF", border: "1px solid #ECE7DF", borderRadius: "24px", padding: "32px", marginBottom: "28px", boxShadow: "0 6px 20px rgba(0,0,0,0.02)" }}
          >
            <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1.5px", color: "#6B7280", fontWeight: "700", marginBottom: "24px" }}>
              ORDER PROGRESS STAGES
            </div>

            <div className="premium-progress-tracker">
              <div className="premium-progress-line" />
              <div 
                className="premium-progress-fill" 
                style={{
                  width: window.innerWidth > 768 ? `${Math.min(100, Math.max(0, (currentIdx / (stepsList.length - 1)) * 92))}%` : "4px"
                }}
              />

              {stepsList.map((stepName, idx) => {
                const isCompleted = idx < currentIdx;
                const isCurrent = idx === currentIdx;
                
                return (
                  <div 
                    key={stepName} 
                    className={`progress-tracker-step ${isCompleted ? "completed" : ""} ${isCurrent ? "current" : ""}`}
                  >
                    <div className="progress-step-icon-wrap">
                      {isCompleted ? <LuCheck size={14} /> : idx + 1}
                    </div>
                    <span className="progress-step-label">
                      {stepName === "Pending" ? "Confirmed" : stepName}
                    </span>
                  </div>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* 4. DETAILED CHRONOLOGY TIMELINE */}
        <motion.div
          id="transit-chronology"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.2 }}
          style={{ background: "#FFFFFF", border: "1px solid #ECE7DF", borderRadius: "24px", padding: "32px", marginBottom: "28px", boxShadow: "0 6px 20px rgba(0,0,0,0.02)" }}
        >
          <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1.5px", color: "#6B7280", fontWeight: "700", marginBottom: "24px" }}>
            DETAILED TRANSIT TIMELINE
          </div>

          {isCancelled ? (
            <div style={{ display: "flex", gap: "16px", alignItems: "center", padding: "20px", background: "rgba(220, 38, 38, 0.05)", borderRadius: "16px", border: "1px solid rgba(220, 38, 38, 0.1)" }}>
              <div style={{ width: "36px", height: "36px", borderRadius: "50%", background: "#DC2626", color: "#FFFFFF", display: "flex", alignItems: "center", justifyContent: "center", fontWeight: "bold", fontSize: "18px" }}>✕</div>
              <div>
                <h4 style={{ margin: 0, color: "#DC2626", fontWeight: "700", fontSize: "16px" }}>Order Cancelled</h4>
                <p style={{ margin: "4px 0 0 0", color: "#6B7280", fontSize: "13.5px" }}>This order was cancelled. If any payment was deducted, refunds are automatically credited back to your original source.</p>
              </div>
            </div>
          ) : (
            <div style={{ display: "flex", flexDirection: "column", paddingLeft: "10px" }}>
              {stepsList.map((stepName, idx) => {
                const timelineEntry = (order.orderTimeline || []).find(t => t.status === stepName);
                const isCompleted = idx < currentIdx;
                const isCurrent = idx === currentIdx;

                let dotColor = "#E5E7EB";
                let textColor = "#9CA3AF";

                if (isCompleted) {
                  dotColor = "#16A34A";
                  textColor = "#1A1A1A";
                } else if (isCurrent) {
                  dotColor = "#C8A165";
                  textColor = "#1A1A1A";
                }

                return (
                  <div key={stepName} style={{ display: "flex", gap: "20px", position: "relative", paddingBottom: "28px" }}>
                    {idx < stepsList.length - 1 && (
                      <div style={{
                        position: "absolute",
                        left: "11px",
                        top: "26px",
                        bottom: 0,
                        width: "2px",
                        background: isCompleted ? "#16A34A" : "#F3F4F6",
                        zIndex: 1
                      }} />
                    )}

                    <div style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: isCompleted ? "#16A34A" : (isCurrent ? "#C8A165" : "#FFFFFF"),
                      border: `2px solid ${isCurrent || isCompleted ? dotColor : "#D1D5DB"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: isCompleted || isCurrent ? "#FFFFFF" : "#9CA3AF",
                      fontSize: "11px",
                      fontWeight: "bold",
                      zIndex: 2,
                      boxShadow: isCurrent ? "0 0 0 4px rgba(200, 161, 101, 0.25)" : "none"
                    }}>
                      {isCompleted ? <LuCheck size={12} /> : "○"}
                    </div>

                    <div style={{ flex: 1, marginTop: "1px" }}>
                      <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: textColor }}>
                        {stepName === "Pending" ? "Order Confirmed" : stepName}
                      </h4>
                      
                      {timelineEntry ? (
                        <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#4B5563", lineHeight: "1.5" }}>
                          {statusDescriptions[stepName] || "Milestone completed."}<br />
                          <span style={{ fontSize: "12px", color: "#6B7280" }}>
                            {new Date(timelineEntry.timestamp).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })} at {new Date(timelineEntry.timestamp).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} • {timelineEntry.updatedBy || "Logistics Hub"}
                          </span>
                        </p>
                      ) : (
                        <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#9CA3AF" }}>
                          Waiting for next update
                        </p>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </motion.div>

        {/* 5. ITEMS PURCHASED SECTION */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.25 }}
          style={{ background: "#FFFFFF", border: "1px solid #ECE7DF", borderRadius: "24px", padding: "32px", marginBottom: "28px", boxShadow: "0 6px 20px rgba(0,0,0,0.02)" }}
        >
          <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1.5px", color: "#6B7280", fontWeight: "700", marginBottom: "24px" }}>
            PURCHASED PRODUCTS ({order.items?.length || 0})
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {(order.items || []).map((item, index) => {
              const hasReviewed = userReviews.some(r => r.orderId === order._id && r.productId === item.productId);

              return (
                <div 
                  key={item._id || index}
                  style={{
                    display: "flex",
                    gap: "20px",
                    alignItems: "center",
                    flexWrap: "wrap",
                    borderBottom: index < order.items.length - 1 ? "1px solid #F3F4F6" : "none",
                    paddingBottom: index < order.items.length - 1 ? "24px" : "0"
                  }}
                >
                  <img 
                    src={item.productImage || "https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=300&auto=format&fit=crop"} 
                    alt={item.productName} 
                    style={{ width: "90px", height: "90px", borderRadius: "16px", objectFit: "cover", border: "1px solid #ECE7DF" }}
                  />

                  <div style={{ flex: 1, minWidth: "220px" }}>
                    <h4 style={{ margin: "0 0 6px 0", fontSize: "16px", color: "#1A1A1A", fontWeight: "700" }}>
                      {item.productName}
                    </h4>
                    <div style={{ display: "flex", gap: "18px", flexWrap: "wrap", fontSize: "13.5px", color: "#6B7280" }}>
                      <span>Qty: <strong>{item.qty}</strong></span>
                      <span>Unit Price: <strong>₹{item.price.toFixed(2)}</strong></span>
                      <span style={{ color: "#C8A165" }}>Subtotal: <strong>₹{(item.qty * item.price).toFixed(2)}</strong></span>
                    </div>
                  </div>

                  {/* Product Specific Action Buttons */}
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {order.status === "Delivered" && (
                      hasReviewed ? (
                        <span style={{ fontSize: "12px", padding: "8px 16px", borderRadius: "20px", background: "#FAF9F6", color: "#16A34A", fontWeight: "700", border: "1px solid #ECE7DF", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                          <LuShieldCheck size={14} /> Reviewed
                        </span>
                      ) : (
                        <Link
                          to={`/product/${item.productId}?reviewModal=true&orderId=${order._id}`}
                          style={{ fontSize: "12px", textDecoration: "none", padding: "8px 16px", borderRadius: "20px", background: "#C8A165", color: "#FFFFFF", fontWeight: "700", display: "inline-flex", alignItems: "center", gap: "6px" }}
                        >
                          <LuStar size={14} /> Write Review
                        </Link>
                      )
                    )}

                    <button
                      onClick={async () => {
                        dispatch(addToCart({
                          _id: item.productId,
                          name: item.productName,
                          price: item.price,
                          image: item.productImage || "/placeholder.jpg",
                          stock: 100,
                          qty: 1
                        }));
                        toast.success(`Added ${item.productName} to cart!`);
                        navigate("/cart");
                      }}
                      style={{ fontSize: "12px", padding: "8px 16px", borderRadius: "20px", background: "#FFFFFF", color: "#1A1A1A", fontWeight: "600", border: "1px solid #ECE7DF", cursor: "pointer" }}
                    >
                      Buy Again
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </motion.div>

        {/* 6. SPLIT GRID: FINANCIAL SUMMARY & PAYMENT CREDENTIALS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "28px", marginBottom: "28px" }}>
          
          {/* FINANCIAL SUMMARY */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.3 }}
            style={{ background: "#FFFFFF", border: "1px solid #ECE7DF", borderRadius: "24px", padding: "32px", boxShadow: "0 6px 20px rgba(0,0,0,0.02)" }}
          >
            <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1.5px", color: "#6B7280", fontWeight: "700", marginBottom: "20px" }}>
              FINANCIAL STATEMENT
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "14px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", color: "#4B5563" }}>
                <span>Items Subtotal</span>
                <span>₹{itemsSubtotal.toFixed(2)}</span>
              </div>

              {discountAmount > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", color: "#16A34A", fontWeight: "600" }}>
                  <span>Coupon Discount</span>
                  <span>- ₹{discountAmount.toFixed(2)}</span>
                </div>
              )}

              <div style={{ display: "flex", justifyContent: "space-between", color: "#4B5563" }}>
                <span>Shipping & Express Handling</span>
                <span>{shippingCharge > 0 ? `₹${shippingCharge.toFixed(2)}` : "FREE"}</span>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", color: "#4B5563" }}>
                <span>Estimated Taxes (GST Included)</span>
                <span>₹0.00</span>
              </div>

              <div style={{ borderTop: "1px dashed #ECE7DF", paddingTop: "14px", marginTop: "4px", display: "flex", justifyContent: "space-between", fontSize: "18px", fontWeight: "800", color: "#1A1A1A" }}>
                <span>Grand Total</span>
                <span style={{ color: "#C8A165" }}>₹{order.totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </motion.div>

          {/* PAYMENT CREDENTIALS */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.35 }}
            style={{ background: "#FFFFFF", border: "1px solid #ECE7DF", borderRadius: "24px", padding: "32px", boxShadow: "0 6px 20px rgba(0,0,0,0.02)" }}
          >
            <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1.5px", color: "#6B7280", fontWeight: "700", marginBottom: "20px" }}>
              PAYMENT REGISTRY
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <div>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#6B7280", fontWeight: "600", display: "block" }}>Payment Method</span>
                <div style={{ fontSize: "15px", fontWeight: "700", color: "#1A1A1A", marginTop: "2px" }}>{order.paymentMethod}</div>
              </div>

              <div>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#6B7280", fontWeight: "600", display: "block" }}>Payment Status</span>
                <div style={{ fontSize: "14px", fontWeight: "700", color: order.paymentStatus === "Paid" ? "#16A34A" : "#DC2626", marginTop: "2px" }}>
                  {order.paymentStatus}
                </div>
              </div>

              {order.paymentId && (
                <div>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#6B7280", fontWeight: "600", display: "block" }}>Transaction Reference</span>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", marginTop: "2px" }}>
                    <span style={{ fontSize: "13.5px", fontFamily: "monospace", color: "#1A1A1A", fontWeight: "600" }}>{order.paymentId}</span>
                    <button onClick={() => handleCopyTransactionId(order.paymentId)} title="Copy Transaction ID" style={{ background: "none", border: "none", color: "#C8A165", cursor: "pointer" }}>
                      <LuCopy size={14} />
                    </button>
                  </div>
                </div>
              )}
            </div>
          </motion.div>

        </div>

        {/* 7. SHIPPING & RECIPIENT INFORMATION */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.4 }}
          style={{ background: "#FFFFFF", border: "1px solid #ECE7DF", borderRadius: "24px", padding: "32px", marginBottom: "28px", boxShadow: "0 6px 20px rgba(0,0,0,0.02)" }}
        >
          <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1.5px", color: "#6B7280", fontWeight: "700", marginBottom: "20px" }}>
            SHIPPING & DESTINATION REGISTRY
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px" }}>
            <div>
              <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#6B7280", fontWeight: "600", display: "block", marginBottom: "4px" }}>Recipient</span>
              <strong style={{ fontSize: "15px", color: "#1A1A1A" }}>{order.customerName}</strong>
              <p style={{ margin: "4px 0 0 0", fontSize: "13.5px", color: "#6B7280" }}>{order.customerPhone}</p>
            </div>

            <div>
              <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#6B7280", fontWeight: "600", display: "block", marginBottom: "4px" }}>Delivery Address</span>
              <p style={{ margin: 0, fontSize: "14px", color: "#1A1A1A", lineHeight: "1.6" }}>
                {order.shippingAddress?.addressLine1},<br />
                {order.shippingAddress?.addressLine2 ? `${order.shippingAddress.addressLine2}, ` : ""}
                {order.shippingAddress?.city}, {order.shippingAddress?.state} - {order.shippingAddress?.pincode}<br />
                {order.shippingAddress?.country || "India"}
              </p>
            </div>

            <div>
              <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#6B7280", fontWeight: "600", display: "block", marginBottom: "4px" }}>Logistics Partner</span>
              <strong style={{ fontSize: "14.5px", color: "#1A1A1A", display: "block" }}>Delhivery Logistics</strong>
              <button 
                onClick={handleCopyTrackingId} 
                style={{ background: "none", border: "none", color: "#C8A165", padding: 0, cursor: "pointer", fontSize: "13px", fontWeight: "600", marginTop: "6px" }}
              >
                Copy Tracking ID
              </button>
            </div>
          </div>
        </motion.div>

        {/* 8. SUPPORT & ASSISTANCE */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, delay: 0.45 }}
          style={{ background: "#FAFAFA", border: "1px solid #ECE7DF", borderRadius: "24px", padding: "36px 32px", textAlign: "center" }}
        >
          <h4 style={{ fontSize: "17px", color: "#1A1A1A", margin: "0 0 6px 0", fontWeight: "700", fontFamily: "'Cinzel', serif" }}>
            Need Assistance With Your Delivery?
          </h4>
          <p style={{ fontSize: "14px", color: "#6B7280", margin: "0 0 20px 0" }}>
            Our luxury beauty support desk is available to resolve any shipping or returns questions.
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: "24px", flexWrap: "wrap" }}>
            <button 
              onClick={handleNeedHelp} 
              style={{ background: "none", border: "none", color: "#C8A165", cursor: "pointer", fontSize: "13.5px", fontWeight: "700" }}
            >
              Contact Support Desk
            </button>
            <Link to="/return-policy" style={{ color: "#C8A165", textDecoration: "none", fontSize: "13.5px", fontWeight: "700" }}>Return Policy</Link>
            <Link to="/shipping-policy" style={{ color: "#C8A165", textDecoration: "none", fontSize: "13.5px", fontWeight: "700" }}>Shipping FAQ</Link>
          </div>
        </motion.div>

      </div>

      {/* OUT OF STOCK REORDER DIALOG */}
      {showReorderDialog && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.35)", zIndex: 1000, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#FFFFFF", padding: "32px", borderRadius: "24px", maxWidth: "460px", width: "100%", boxShadow: "0 10px 40px rgba(0,0,0,0.15)", border: "1px solid #ECE7DF" }}>
            <h4 style={{ margin: "0 0 12px 0", fontSize: "18px", color: "#1A1A1A", fontFamily: "'Cinzel', serif" }}>
              Stock Availability Notice
            </h4>
            <p style={{ color: "#6B7280", fontSize: "14px", lineHeight: "1.6", marginBottom: "18px" }}>
              Some items from this previous transaction are currently out of stock:
            </p>
            <ul style={{ paddingLeft: "20px", margin: "0 0 24px 0", fontSize: "13.5px", color: "#DC2626", lineHeight: "1.6" }}>
              {outOfStockItems.map((name, i) => (
                <li key={i}>{name}</li>
              ))}
            </ul>
            <div style={{ display: "flex", justifyContent: "flex-end", gap: "12px" }}>
              <button 
                onClick={() => setShowReorderDialog(false)} 
                style={{ padding: "10px 22px", borderRadius: "25px", border: "1px solid #ECE7DF", background: "#FFFFFF", color: "#6B7280", cursor: "pointer", fontSize: "13.5px", fontWeight: "600" }}
              >
                Close
              </button>
              <button 
                onClick={() => {
                  setShowReorderDialog(false);
                  navigate("/cart");
                }} 
                style={{ padding: "10px 22px", borderRadius: "25px", border: "none", background: "#C8A165", color: "#FFFFFF", cursor: "pointer", fontSize: "13.5px", fontWeight: "700" }}
              >
                Go to Cart
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
