import { useEffect, useState, useContext } from "react";
import { useParams, useNavigate, Link, useLocation } from "react-router-dom";
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
  const location = useLocation();

  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [invoiceLoading, setInvoiceLoading] = useState(false);
  const [userReviews, setUserReviews] = useState([]);
  const [showReorderDialog, setShowReorderDialog] = useState(false);
  const [outOfStockItems, setOutOfStockItems] = useState([]);

  // Cancellation Wizard States
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelStep, setCancelStep] = useState(1);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelComments, setCancelComments] = useState("");
  const [understandCancel, setUnderstandCancel] = useState(false);
  const [cancelSuccess, setCancelSuccess] = useState(false);
  const [submittingCancel, setSubmittingCancel] = useState(false);

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

  // Auto-trigger cancellation wizard if navigated from Profile with triggerCancel state
  useEffect(() => {
    if (location.state?.triggerCancel && order && isCancelable) {
      setShowCancelModal(true);
      window.history.replaceState({}, document.title);
    }
  }, [location.state, order, isCancelable]);

  // Real-time tracking updates (Polling every 30 seconds)
  useEffect(() => {
    if (!id || !user?.token) return;
    const interval = setInterval(() => {
      fetchOrder();
    }, 30000);
    return () => clearInterval(interval);
  }, [id, user]);

  // CONFIRM ORDER CANCELLATION REQUEST
  const handleConfirmCancellation = async () => {
    if (!understandCancel) {
      toast.error("Please confirm that you understand the cancellation request.");
      return;
    }
    
    setSubmittingCancel(true);
    toast.loading("Submitting cancellation request...");
    
    try {
      const res = await axios.put(
        `/api/orders/${order._id}/cancel`,
        {
          cancellationReason: cancelReason,
          cancellationComments: cancelReason === "Other" ? cancelComments : "",
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      
      toast.dismiss();
      if (res.data.success) {
        toast.success("Cancellation request submitted successfully!");
        setCancelSuccess(true);
        fetchOrder();
      }
    } catch (err) {
      toast.dismiss();
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to submit cancellation request");
    } finally {
      setSubmittingCancel(false);
    }
  };

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
  const isCancelable = ["Pending", "Processing"].includes(order.status);

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
      case "Cancellation Requested":
        return { bg: "rgba(220, 38, 38, 0.08)", color: "#DC2626", label: "Cancellation Requested" };
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

            {isCancelable && (
              <button 
                onClick={() => setShowCancelModal(true)} 
                style={{ display: "inline-flex", alignItems: "center", gap: "8px", border: "1px solid #DC2626", background: "#FFFFFF", color: "#DC2626", padding: "11px 22px", borderRadius: "30px", fontSize: "13.5px", fontWeight: "600", cursor: "pointer" }}
              >
                <span>Cancel Order</span>
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

        {/* CANCELLATION & REFUND DETAILS CARD */}
        {(order.status === "Cancellation Requested" || order.status === "Cancelled" || order.refundStatus) && (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.4, delay: 0.1 }}
            style={{ 
              background: "#FFFFFF", 
              border: "1px solid #ECE7DF", 
              borderRadius: "24px", 
              padding: "32px", 
              marginBottom: "28px", 
              boxShadow: "0 6px 20px rgba(0,0,0,0.02)" 
            }}
          >
            <div style={{ fontSize: "12px", textTransform: "uppercase", letterSpacing: "1.5px", color: "#6B7280", fontWeight: "700", marginBottom: "20px" }}>
              CANCELLATION & REFUND STATUS
            </div>
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "24px" }}>
              <div>
                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#6B7280", fontWeight: "600", display: "block", marginBottom: "4px" }}>Cancellation Status</span>
                <strong style={{ fontSize: "15px", color: order.status === "Cancelled" ? "#DC2626" : "#C8A165" }}>
                  {order.status === "Cancellation Requested" ? "Pending Approval" : "Approved & Cancelled"}
                </strong>
                {order.cancelledAt && (
                  <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#9CA3AF" }}>
                    Request Date: {new Date(order.cancelledAt).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                  </p>
                )}
              </div>

              {order.cancellationReason && (
                <div>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#6B7280", fontWeight: "600", display: "block", marginBottom: "4px" }}>Reason for Cancellation</span>
                  <p style={{ margin: 0, fontSize: "14.5px", color: "#1A1A1A", fontWeight: "600" }}>{order.cancellationReason}</p>
                  {order.cancellationComments && (
                    <p style={{ margin: "4px 0 0 0", fontSize: "13px", color: "#6B7280", fontStyle: "italic" }}>
                      "{order.cancellationComments}"
                    </p>
                  )}
                </div>
              )}

              {order.refundStatus && (
                <div>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#6B7280", fontWeight: "600", display: "block", marginBottom: "4px" }}>Refund Details</span>
                  <div style={{ fontSize: "14px", color: "#1A1A1A" }}>
                    Status: <strong style={{ color: order.refundStatus === "Refunded" ? "#16A34A" : "#C8A165" }}>{order.refundStatus}</strong><br />
                    Amount: <strong>₹{order.refundAmount?.toFixed(2) || order.totalAmount?.toFixed(2)}</strong><br />
                    Method: <strong>{order.refundMethod || order.paymentMethod}</strong>
                  </div>
                </div>
              )}

              {(order.refundExpectedDate || order.refundDate || order.refundTransactionId || order.refundRemarks) && (
                <div>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#6B7280", fontWeight: "600", display: "block", marginBottom: "4px" }}>Refund Tracking</span>
                  <div style={{ fontSize: "13.5px", color: "#6B7280", lineHeight: "1.6" }}>
                    {order.refundStatus === "Refunded" && order.refundDate && (
                      <div>Refund Date: <strong style={{ color: "#1A1A1A" }}>{new Date(order.refundDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}</strong></div>
                    )}
                    {order.refundStatus !== "Refunded" && order.refundExpectedDate && (
                      <div>Expected By: <strong style={{ color: "#1A1A1A" }}>{new Date(order.refundExpectedDate).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}</strong></div>
                    )}
                    {order.refundTransactionId && (
                      <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                        Txn ID: <code style={{ color: "#1A1A1A", fontWeight: "600" }}>{order.refundTransactionId}</code>
                      </div>
                    )}
                    {order.refundRemarks && (
                      <div style={{ marginTop: "4px", fontStyle: "italic" }}>Remarks: {order.refundRemarks}</div>
                    )}
                  </div>
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* 3. HORIZONTAL PROGRESS TRACKER */}
        {!isCancelled && order.status !== "Cancellation Requested" && (
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

          {isCancelled || order.status === "Cancellation Requested" || (order.orderTimeline || []).some(t => t.status.includes("Cancel") || t.status.includes("Refund")) ? (
            <div style={{ display: "flex", flexDirection: "column", paddingLeft: "10px" }}>
              {(order.orderTimeline || []).map((entry, idx) => {
                const isLast = idx === order.orderTimeline.length - 1;
                const formattedTime = new Date(entry.timestamp).toLocaleString("en-IN", {
                  day: "numeric",
                  month: "short",
                  year: "numeric",
                  hour: "2-digit",
                  minute: "2-digit"
                });

                return (
                  <div key={idx} style={{ display: "flex", gap: "20px", position: "relative", paddingBottom: isLast ? "0" : "28px" }}>
                    {!isLast && (
                      <div style={{
                        position: "absolute",
                        left: "11px",
                        top: "26px",
                        bottom: 0,
                        width: "2px",
                        background: "#16A34A",
                        zIndex: 1
                      }} />
                    )}

                    <div style={{
                      width: "24px",
                      height: "24px",
                      borderRadius: "50%",
                      background: isLast ? "#C8A165" : "#16A34A",
                      border: `2px solid ${isLast ? "#C8A165" : "#16A34A"}`,
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      color: "#FFFFFF",
                      fontSize: "11px",
                      fontWeight: "bold",
                      zIndex: 2,
                      boxShadow: isLast ? "0 0 0 4px rgba(200, 161, 101, 0.25)" : "none"
                    }}>
                      <LuCheck size={12} />
                    </div>

                    <div style={{ flex: 1, marginTop: "1px" }}>
                      <h4 style={{ margin: 0, fontSize: "15px", fontWeight: "700", color: "#1A1A1A" }}>
                        {entry.status === "Pending" ? "Order Placed" : (entry.status === "Processing" ? "Order Confirmed" : entry.status)}
                      </h4>
                      <p style={{ margin: "4px 0 0 0", fontSize: "13.5px", color: "#4B5563" }}>
                        <span style={{ fontSize: "12px", color: "#6B7280" }}>
                          {formattedTime} • {entry.updatedBy || "System"}
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })}
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

      {/* CANCELLATION WIZARD MODAL */}
      {showCancelModal && (
        <div style={{ position: "fixed", top: 0, left: 0, width: "100%", height: "100%", background: "rgba(0,0,0,0.45)", zIndex: 1100, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
          <div style={{ background: "#FFFFFF", borderRadius: "24px", maxWidth: "520px", width: "100%", boxShadow: "0 10px 40px rgba(0,0,0,0.15)", border: "1px solid #ECE7DF", overflow: "hidden", display: "flex", flexDirection: "column" }}>
            
            {/* Header */}
            <div style={{ padding: "24px 32px", borderBottom: "1px solid #FAF9F6", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FAF9F6" }}>
              <h4 style={{ margin: 0, fontSize: "18px", color: "#1A1A1A", fontFamily: "'Cinzel', serif", fontWeight: "700" }}>
                {!cancelSuccess ? `Cancel Order Request (Step ${cancelStep}/4)` : "Request Submitted"}
              </h4>
              {!cancelSuccess && (
                <button 
                  onClick={() => {
                    setShowCancelModal(false);
                    setCancelStep(1);
                    setCancelReason("");
                    setCancelComments("");
                    setUnderstandCancel(false);
                  }}
                  style={{ background: "none", border: "none", fontSize: "20px", color: "#6B7280", cursor: "pointer" }}
                >
                  ✕
                </button>
              )}
            </div>

            {/* Content */}
            <div style={{ padding: "32px", maxHeight: "65vh", overflowY: "auto" }}>
              {!cancelSuccess ? (
                <>
                  {/* Step 1: Confirmation snapshot */}
                  {cancelStep === 1 && (
                    <div>
                      <h5 style={{ margin: "0 0 16px 0", fontSize: "16px", color: "#1A1A1A", fontWeight: "700" }}>
                        Are you sure you want to cancel this order?
                      </h5>
                      <div style={{ background: "#FAFAFA", border: "1px solid #ECE7DF", borderRadius: "16px", padding: "20px", display: "flex", flexDirection: "column", gap: "10px", fontSize: "14px", color: "#4B5563" }}>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span>Order Number</span>
                          <strong style={{ color: "#1A1A1A" }}>VN-{order._id.slice(-8).toUpperCase()}</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span>Amount Paid</span>
                          <strong style={{ color: "#C8A165" }}>₹{order.totalAmount.toFixed(2)}</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span>Payment Method</span>
                          <strong style={{ color: "#1A1A1A" }}>{order.paymentMethod}</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between" }}>
                          <span>Items Count</span>
                          <strong style={{ color: "#1A1A1A" }}>{order.items?.length || 0} item(s)</strong>
                        </div>
                      </div>
                      <p style={{ fontSize: "13px", color: "#6B7280", marginTop: "16px", lineHeight: "1.6" }}>
                        Please note: Cancellations are only eligible before dispatch. Once dispatched, return request policies apply.
                      </p>
                    </div>
                  )}

                  {/* Step 2: Reason Selector */}
                  {cancelStep === 2 && (
                    <div>
                      <h5 style={{ margin: "0 0 16px 0", fontSize: "15.5px", color: "#1A1A1A", fontWeight: "700" }}>
                        Please select a reason for cancellation:
                      </h5>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {[
                          "Ordered by mistake",
                          "Found a better price",
                          "Delivery taking too long",
                          "Need to change address",
                          "Wrong product selected",
                          "Payment issue",
                          "Ordered duplicate item",
                          "Other"
                        ].map((reason) => (
                          <label key={reason} style={{ display: "flex", alignItems: "center", gap: "10px", fontSize: "14.5px", color: "#4B5563", cursor: "pointer", padding: "10px 14px", border: "1px solid #ECE7DF", borderRadius: "12px", background: cancelReason === reason ? "rgba(200, 161, 101, 0.05)" : "#FFFFFF", borderColor: cancelReason === reason ? "#C8A165" : "#ECE7DF" }}>
                            <input 
                              type="radio" 
                              name="cancelReason" 
                              value={reason} 
                              checked={cancelReason === reason}
                              onChange={(e) => setCancelReason(e.target.value)}
                              style={{ accentColor: "#C8A165" }}
                            />
                            <span>{reason}</span>
                          </label>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Step 3: Other details */}
                  {cancelStep === 3 && (
                    <div>
                      <h5 style={{ margin: "0 0 12px 0", fontSize: "15px", color: "#1A1A1A", fontWeight: "700" }}>
                        Please tell us why you want to cancel this order:
                      </h5>
                      <textarea 
                        rows={4}
                        placeholder="Write your cancellation reason here (minimum 10 characters)..."
                        value={cancelComments}
                        onChange={(e) => setCancelComments(e.target.value)}
                        style={{ width: "100%", padding: "14px", borderRadius: "12px", border: "1px solid #ECE7DF", fontSize: "14px", outline: "none", resize: "none", fontFamily: "inherit" }}
                      />
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#9CA3AF", marginTop: "6px" }}>
                        <span>Minimum 10 characters</span>
                        <span>{cancelComments.trim().length} / 500</span>
                      </div>
                    </div>
                  )}

                  {/* Step 4: Refund & Eligibility Details */}
                  {cancelStep === 4 && (
                    <div>
                      <h5 style={{ margin: "0 0 16px 0", fontSize: "15px", color: "#1A1A1A", fontWeight: "700" }}>
                        Review Refund & Eligibility
                      </h5>

                      <div style={{ background: "#FAF9F6", border: "1px solid #ECE7DF", borderRadius: "16px", padding: "20px", marginBottom: "20px", fontSize: "14px" }}>
                        <div style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1px", color: "#8B7355", fontWeight: "700", marginBottom: "12px" }}>
                          Expected Refund Information
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #ECE7DF", paddingBottom: "10px", marginBottom: "10px" }}>
                          <span style={{ color: "#6B7280" }}>Payment Method</span>
                          <strong style={{ color: "#1A1A1A" }}>{order.paymentMethod}</strong>
                        </div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ color: "#6B7280" }}>Refund Timeline</span>
                          <strong style={{ color: "#16A34A" }}>
                            {order.paymentMethod === "COD" && "No refund required"}
                            {order.paymentMethod === "UPI" && "2–5 business days"}
                            {["Credit Card", "Debit Card"].includes(order.paymentMethod) && "5–7 business days"}
                            {order.paymentMethod === "Razorpay" && "3–5 business days"}
                          </strong>
                        </div>
                      </div>

                      <div style={{ border: "1px solid #E5E7EB", borderRadius: "16px", padding: "16px", marginBottom: "24px", display: "flex", gap: "10px", alignItems: "center", background: "#F9FAFB" }}>
                        <div style={{ color: "#16A34A", fontSize: "18px" }}>✓</div>
                        <div style={{ fontSize: "13.5px", color: "#4B5563" }}>
                          <strong>Cancellation Available</strong>: Order package has not shipped.
                        </div>
                      </div>

                      <label style={{ display: "flex", gap: "10px", cursor: "pointer", fontSize: "13.5px", color: "#1A1A1A", fontWeight: "600" }}>
                        <input 
                          type="checkbox" 
                          checked={understandCancel}
                          onChange={(e) => setUnderstandCancel(e.target.checked)}
                          style={{ accentColor: "#C8A165", marginTop: "2px" }}
                        />
                        <span>I understand that this order will be cancelled.</span>
                      </label>
                    </div>
                  )}

                  {/* Wizard Buttons */}
                  <div style={{ display: "flex", justifyContent: "space-between", gap: "12px", marginTop: "32px", borderTop: "1px solid #FAF9F6", paddingTop: "24px" }}>
                    {cancelStep > 1 ? (
                      <button 
                        onClick={() => {
                          if (cancelStep === 4 && cancelReason !== "Other") {
                            setCancelStep(2);
                          } else {
                            setCancelStep(prev => prev - 1);
                          }
                        }}
                        style={{ padding: "10px 22px", borderRadius: "25px", border: "1px solid #ECE7DF", background: "#FFFFFF", color: "#6B7280", cursor: "pointer", fontSize: "13.5px", fontWeight: "600" }}
                      >
                        Back
                      </button>
                    ) : (
                      <button 
                        onClick={() => setShowCancelModal(false)}
                        style={{ padding: "10px 22px", borderRadius: "25px", border: "1px solid #ECE7DF", background: "#FFFFFF", color: "#6B7280", cursor: "pointer", fontSize: "13.5px", fontWeight: "600" }}
                      >
                        Keep Order
                      </button>
                    )}

                    {cancelStep < 4 ? (
                      <button 
                        onClick={() => {
                          if (cancelStep === 1) {
                            setCancelStep(2);
                          } else if (cancelStep === 2) {
                            if (!cancelReason) {
                              toast.error("Please select a cancellation reason.");
                              return;
                            }
                            if (cancelReason === "Other") {
                              setCancelStep(3);
                            } else {
                              setCancelStep(4);
                            }
                          } else if (cancelStep === 3) {
                            if (cancelComments.trim().length < 10 || cancelComments.trim().length > 500) {
                              toast.error("Comments must be between 10 and 500 characters.");
                              return;
                            }
                            setCancelStep(4);
                          }
                        }}
                        style={{ padding: "10px 22px", borderRadius: "25px", border: "none", background: "#C8A165", color: "#FFFFFF", cursor: "pointer", fontSize: "13.5px", fontWeight: "700" }}
                      >
                        Continue
                      </button>
                    ) : (
                      <button 
                        onClick={handleConfirmCancellation}
                        disabled={submittingCancel || !understandCancel}
                        style={{ padding: "10px 22px", borderRadius: "25px", border: "none", background: "#DC2626", color: "#FFFFFF", cursor: "pointer", fontSize: "13.5px", fontWeight: "700", opacity: submittingCancel || !understandCancel ? 0.5 : 1 }}
                      >
                        Confirm Cancellation
                      </button>
                    )}
                  </div>
                </>
              ) : (
                <div style={{ textAlign: "center", padding: "20px 0" }}>
                  <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#FAF9F6", color: "#C8A165", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 20px auto", fontSize: "32px", fontWeight: "bold" }}>
                    ✓
                  </div>
                  <h4 style={{ margin: "0 0 8px 0", fontSize: "18px", color: "#1A1A1A", fontFamily: "'Cinzel', serif", fontWeight: "700" }}>
                    Cancellation Requested
                  </h4>
                  <p style={{ margin: "0 0 24px 0", color: "#6B7280", fontSize: "14px", lineHeight: "1.6" }}>
                    Your request has been logged successfully. Our operations desk is checking shipping registry.
                  </p>

                  <div style={{ background: "#FAFAFA", border: "1px solid #ECE7DF", borderRadius: "16px", padding: "20px", textAlign: "left", fontSize: "13.5px", color: "#4B5563", display: "flex", flexDirection: "column", gap: "10px", marginBottom: "32px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Refund Status</span>
                      <strong style={{ color: order.paymentMethod === "COD" ? "#6B7280" : "#C8A165" }}>
                        {order.paymentMethod === "COD" ? "No Refund Required" : "Refund Pending Approval"}
                      </strong>
                    </div>
                    {order.paymentMethod !== "COD" && (
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>Estimated Refund Date</span>
                        <strong style={{ color: "#1A1A1A" }}>
                          {new Date(Date.now() + 5 * 24 * 60 * 60 * 1000).toLocaleDateString("en-IN", { day: 'numeric', month: 'short', year: 'numeric' })}
                        </strong>
                      </div>
                    )}
                    <div style={{ display: "flex", justifyContent: "space-between" }}>
                      <span>Tracking Ref</span>
                      <strong style={{ color: "#1A1A1A" }}>VN-{order._id.slice(-8).toUpperCase()}</strong>
                    </div>
                  </div>

                  <div style={{ display: "flex", justifyContent: "center", gap: "12px" }}>
                    <button 
                      onClick={() => {
                        setShowCancelModal(false);
                        setCancelStep(1);
                        setCancelReason("");
                        setCancelComments("");
                        setUnderstandCancel(false);
                        setCancelSuccess(false);
                      }}
                      style={{ padding: "10px 22px", borderRadius: "25px", border: "1px solid #ECE7DF", background: "#FFFFFF", color: "#6B7280", cursor: "pointer", fontSize: "13.5px", fontWeight: "600" }}
                    >
                      Close Modal
                    </button>
                    <button 
                      onClick={() => {
                        setShowCancelModal(false);
                        navigate("/shop");
                      }}
                      style={{ padding: "10px 22px", borderRadius: "25px", border: "none", background: "#C8A165", color: "#FFFFFF", cursor: "pointer", fontSize: "13.5px", fontWeight: "700" }}
                    >
                      Continue Shopping
                    </button>
                  </div>
                </div>
              )}
            </div>

          </div>
        </div>
      )}
    </div>
  );
};

export default OrderDetails;
