import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import axios from "axios";
import toast from "react-hot-toast";
import "../styles/Profile.css";

const Profile = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [orders, setOrders] = useState([]);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [userReviews, setUserReviews] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("All");
  const [sortBy, setSortBy] = useState("newest");
  const [visibleCount, setVisibleCount] = useState(5);
  const [expandedOrders, setExpandedOrders] = useState({});

  // Fetch customer orders history
  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }

    const fetchMyOrders = async () => {
      try {
        const res = await fetch("/api/orders/myorders", {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        const data = await res.json();
        if (res.ok) {
          setOrders(Array.isArray(data) ? data : []);
        } else {
          if (res.status === 401) {
            logout();
            navigate("/login");
          }
          setOrders([]);
        }
      } catch (error) {
        console.error(error);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };

    if (user?.role !== "admin") {
      fetchMyOrders();
    } else {
      setLoading(false);
    }
  }, [user, navigate, logout]);

  // Fetch customer reviews
  useEffect(() => {
    const fetchUserReviews = async () => {
      if (!user?.token || user?.role === "admin") return;
      try {
        const res = await axios.get("/api/reviews/myreviews", {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        setUserReviews(res.data.reviews || []);
      } catch (err) {
        console.error("Failed to load user reviews:", err);
      }
    };
    fetchUserReviews();
  }, [user]);

  // Fetch customer saved addresses
  useEffect(() => {
    const fetchAddresses = async () => {
      if (!user?.token || user?.role === "admin") return;
      try {
        const res = await axios.get("/api/address", {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        setAddresses(res.data.addresses || []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAddresses();
  }, [user]);

  // Secure client-side invoice PDF download
  const handleDownloadInvoice = async (orderId) => {
    try {
      toast.loading("Generating secure invoice...");
      const res = await axios.get(`/api/orders/${orderId}/invoice`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
        responseType: "blob",
      });

      const file = new Blob([res.data], { type: "application/pdf" });
      const fileURL = URL.createObjectURL(file);
      const link = document.createElement("a");
      link.href = fileURL;
      link.setAttribute("download", `invoice-${orderId.slice(-8)}.pdf`);
      document.body.appendChild(link);
      link.click();
      link.remove();
      toast.dismiss();
      toast.success("Invoice downloaded successfully! 📄");
    } catch (err) {
      toast.dismiss();
      console.error(err);
      toast.error("Failed to download invoice");
    }
  };

  // Reorder all products of an order with dynamic stock verification
  const handleReorderAll = async (items) => {
    if (!items || items.length === 0) return;
    toast.loading("Verifying stock availability...");
    
    let addedCount = 0;
    let unavailableItems = [];

    for (const item of items) {
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
            unavailableItems.push(`${item.productName} (only ${availableStock} units left)`);
          } else {
            unavailableItems.push(item.productName);
          }
        } catch (err) {
          console.error("Stock check failed for product", item.productId, err);
          unavailableItems.push(item.productName);
        }
      }
    }

    toast.dismiss();

    if (unavailableItems.length > 0) {
      if (addedCount > 0) {
        toast.success(`Added available items. Some items are currently unavailable: ${unavailableItems.join(", ")}`);
        navigate("/cart");
      } else {
        toast.error("Some items are currently unavailable. None could be added to cart.");
      }
    } else {
      toast.success("All items successfully added to cart! 🛍");
      navigate("/cart");
    }
  };

  const handleCancelOrder = (orderId) => {
    navigate(`/order/${orderId}`, { state: { triggerCancel: true } });
  };

  const toggleExpandOrder = (orderId) => {
    setExpandedOrders(prev => ({ ...prev, [orderId]: !prev[orderId] }));
  };

  const getProcessedOrders = () => {
    let result = [...orders];

    // Search query
    if (searchTerm.trim() !== "") {
      const term = searchTerm.toLowerCase().trim();
      result = result.filter(
        (o) =>
          o._id.toLowerCase().includes(term) ||
          (o.items && o.items.some((item) => item.productName.toLowerCase().includes(term)))
      );
    }

    // Status Filter Chip
    if (filterStatus !== "All") {
      if (filterStatus === "Delivered") {
        result = result.filter((o) => o.status === "Delivered");
      } else if (filterStatus === "Processing") {
        result = result.filter((o) => ["Pending", "Processing", "Packed"].includes(o.status));
      } else if (filterStatus === "Cancelled") {
        result = result.filter((o) => o.status === "Cancelled");
      } else if (filterStatus === "Returns") {
        result = result.filter((o) =>
          ["Return Requested", "Return Approved", "Refund Completed", "Returned"].includes(o.status)
        );
      }
    }

    // Sort order
    if (sortBy === "newest") {
      result.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    } else if (sortBy === "oldest") {
      result.sort((a, b) => new Date(a.createdAt) - new Date(b.createdAt));
    } else if (sortBy === "highest") {
      result.sort((a, b) => b.totalAmount - a.totalAmount);
    } else if (sortBy === "lowest") {
      result.sort((a, b) => a.totalAmount - b.totalAmount);
    }

    return result;
  };

  const processedOrders = getProcessedOrders();

  if (!user) return null;

  // Find default or first address
  const defaultAddress = addresses.length > 0 ? addresses[0] : null;

  // Calculate dynamic delivery ETA (4 days from order date)
  const getDeliveryEta = (orderDateString) => {
    const orderDate = new Date(orderDateString);
    orderDate.setDate(orderDate.getDate() + 4);
    return orderDate.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  // Admin routing check
  if (user?.role === "admin") {
    return (
      <div className="admin-profile-redirect-card">
        <h2>Admin Management Portal</h2>
        <p>Welcome back, Administrator. Please proceed to the dashboard controls below.</p>
        <div className="admin-routes-grid">
          <Link to="/admin" className="admin-route-btn">📊 Dashboard Overview</Link>
          <Link to="/admin/orders" className="admin-route-btn">🛒 Manage Orders</Link>
          <Link to="/admin/products" className="admin-route-btn">📦 Manage Products</Link>
          <Link to="/admin/users" className="admin-route-btn">👥 Manage Users</Link>
        </div>
        <button onClick={logout} className="btn-logout-luxury">Logout Panel</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="profile-dashboard-wrapper route-fade-in" style={{ padding: "40px 20px" }}>
        {/* Simple Profile Header Skeleton */}
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "40px", borderBottom: "1px solid #ECE7DF", paddingBottom: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <div className="shimmer-bg" style={{ width: "64px", height: "64px", borderRadius: "50%" }} />
            <div>
              <div className="shimmer-bg" style={{ height: "24px", width: "150px", borderRadius: "4px", marginBottom: "8px" }} />
              <div className="shimmer-bg" style={{ height: "14px", width: "180px", borderRadius: "4px" }} />
            </div>
          </div>
          <div style={{ display: "flex", gap: "12px" }}>
            <div className="shimmer-bg" style={{ height: "40px", width: "100px", borderRadius: "8px" }} />
            <div className="shimmer-bg" style={{ height: "40px", width: "100px", borderRadius: "8px" }} />
          </div>
        </div>

        {/* Dual column skeleton layout */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "40px" }}>
          {/* Left Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ border: "1px solid #ECE7DF", padding: "20px", borderRadius: "16px" }}>
              <div className="shimmer-bg" style={{ height: "20px", width: "120px", borderRadius: "4px", marginBottom: "16px" }} />
              <div className="shimmer-bg" style={{ height: "14px", width: "80%", borderRadius: "4px", marginBottom: "8px" }} />
              <div className="shimmer-bg" style={{ height: "14px", width: "60%", borderRadius: "4px" }} />
            </div>
            <div style={{ border: "1px solid #ECE7DF", padding: "20px", borderRadius: "16px" }}>
              <div className="shimmer-bg" style={{ height: "20px", width: "120px", borderRadius: "4px", marginBottom: "16px" }} />
              <div className="shimmer-bg" style={{ height: "40px", width: "100%", borderRadius: "8px" }} />
            </div>
          </div>
          {/* Right Column */}
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            <div style={{ border: "1px solid #ECE7DF", padding: "20px", borderRadius: "16px" }}>
              <div className="shimmer-bg" style={{ height: "20px", width: "150px", borderRadius: "4px", marginBottom: "20px" }} />
              {[1, 2].map((i) => (
                <div key={i} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid #ECE7DF", paddingBottom: "16px", marginBottom: "16px" }}>
                  <div style={{ display: "flex", gap: "12px" }}>
                    <div className="shimmer-bg" style={{ width: "60px", height: "60px", borderRadius: "8px" }} />
                    <div>
                      <div className="shimmer-bg" style={{ height: "16px", width: "140px", borderRadius: "4px", marginBottom: "8px" }} />
                      <div className="shimmer-bg" style={{ height: "14px", width: "80px", borderRadius: "4px" }} />
                    </div>
                  </div>
                  <div className="shimmer-bg" style={{ height: "30px", width: "100px", borderRadius: "6px" }} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="profile-dashboard-wrapper route-fade-in">
      {/* 1. SIMPLE PROFILE HEADER */}
      <div className="profile-hero-section">
        <div className="profile-avatar-row">
          <div className="profile-avatar-circle">
            {user.name ? user.name.charAt(0).toUpperCase() : "U"}
          </div>
          <div className="profile-user-info-text">
            <div className="membership-row">
              <h2>{user.name}</h2>
              <span className="status-verification-badge verified">✓ Verified Email</span>
            </div>
            <p className="hero-subtext">{user.email}</p>
          </div>
        </div>
        
        <div className="header-actions">
          <button onClick={() => navigate("/edit-profile")} className="btn-edit-profile-action">
            Edit Profile
          </button>
          <button onClick={logout} className="btn-logout-luxury">
            Log Out
          </button>
        </div>
      </div>

      {/* 2. DUAL COLUMN LAYOUT */}
      <div className="profile-main-layout">
        
        {/* LEFT COLUMN: Sidebar Navigation & Support */}
        <div className="profile-sidebar-col">
          
          {/* Personal Information */}
          <div className="sidebar-info-card">
            <h3>Personal Information</h3>
            <div className="info-fields-list">
              <div className="info-field-row">
                <span className="field-title">Full Name</span>
                <strong className="field-value">{user.name}</strong>
              </div>
              <div className="info-field-row">
                <span className="field-title">Email Address</span>
                <strong className="field-value">{user.email}</strong>
              </div>
            </div>
            <button onClick={() => navigate("/forgot-password")} className="btn-sidebar-link">
              Change Password
            </button>
          </div>

          {/* Saved Addresses (Default summary) */}
          <div className="sidebar-info-card">
            <h3>Saved Address</h3>
            {defaultAddress ? (
              <div className="address-snippet-box">
                <span className="address-snippet-label">{defaultAddress.label || "Home"}</span>
                <h4 className="address-snippet-name">{defaultAddress.fullName}</h4>
                <p className="address-snippet-lines">{defaultAddress.addressLine1}</p>
                <p className="address-snippet-city">
                  {defaultAddress.city}, {defaultAddress.state} - {defaultAddress.pincode}
                </p>
              </div>
            ) : (
              <p className="address-snippet-empty">No address details configured.</p>
            )}
            <button onClick={() => navigate("/my-addresses")} className="btn-sidebar-action">
              Manage Addresses
            </button>
          </div>

          {/* Customer Support options */}
          <div className="sidebar-info-card support-sidebar-card">
            <h3>Customer Support</h3>
            <div className="support-links-stack">
              <Link to="/contact" className="support-sidebar-link">Contact Support</Link>
              <Link to="/my-complaints" className="support-sidebar-link">My Complaints</Link>
              <Link to="/my-returns" className="support-sidebar-link">Return Requests</Link>
              <Link to="/faq" className="support-sidebar-link">Help Center</Link>
            </div>
          </div>

        </div>

        {/* RIGHT COLUMN: Orders History */}
        <div className="profile-content-col">
          
          <div className="dashboard-order-history-section">
            <h3 style={{ fontFamily: "'Cinzel', serif", fontWeight: "700", fontSize: "1.3rem", color: "#1A1A1A", marginBottom: "20px" }}>
              My Orders
            </h3>
            
            {loading ? (
              <div className="order-history-loading" style={{ textAlign: "center", padding: "40px 0" }}>
                <div className="ordersuccess-spinner" style={{ margin: "0 auto 16px auto" }}></div>
                <p style={{ color: "#6B7280" }}>Loading historical order statements...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="profile-empty-orders-card" style={{ textAlign: "center", padding: "60px 20px", background: "#FFFFFF", border: "1px solid #EFEFEF", borderRadius: "20px" }}>
                <span className="empty-icon" style={{ fontSize: "48px", display: "block", marginBottom: "16px" }}>🛍️</span>
                <h4 style={{ fontSize: "18px", color: "#1A1A1A", margin: "0 0 8px 0" }}>You haven't placed any orders yet</h4>
                <p style={{ color: "#6B7280", margin: "0 0 24px 0", fontSize: "14px" }}>Start shopping our organic premium cosmetic catalogs to log transactions.</p>
                <Link to="/shop" className="btn-history-track-primary" style={{ display: "inline-block", textDecoration: "none", padding: "12px 30px", borderRadius: "30px", background: "#C8A165", color: "#FFFFFF", fontWeight: "700" }}>Start Shopping</Link>
              </div>
            ) : (
              <>
                {/* Search, Filter, Sort Controls */}
                <div className="orders-control-bar" style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
                  <div style={{ display: "flex", gap: "12px", width: "100%", flexWrap: "wrap" }}>
                    <input
                      type="text"
                      placeholder="Search orders by Product Name or Order ID..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setVisibleCount(5);
                      }}
                      style={{
                        flex: 1,
                        minWidth: "260px",
                        height: "48px",
                        padding: "0 16px",
                        borderRadius: "12px",
                        border: "1px solid #ECE7DF",
                        outline: "none",
                        fontSize: "13.5px",
                        background: "#FFFFFF"
                      }}
                    />
                    
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      style={{
                        height: "48px",
                        padding: "0 16px",
                        borderRadius: "12px",
                        border: "1px solid #ECE7DF",
                        outline: "none",
                        fontSize: "13.5px",
                        background: "#FFFFFF",
                        color: "#1A1A1A",
                        cursor: "pointer"
                      }}
                    >
                      <option value="newest">Sort: Newest First</option>
                      <option value="oldest">Sort: Oldest First</option>
                      <option value="highest">Sort: Price: High to Low</option>
                      <option value="lowest">Sort: Price: Low to High</option>
                    </select>
                  </div>

                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                    {["All", "Processing", "Delivered", "Cancelled", "Returns"].map((chip) => (
                      <button
                        key={chip}
                        onClick={() => {
                          setFilterStatus(chip);
                          setVisibleCount(5);
                        }}
                        style={{
                          padding: "8px 16px",
                          borderRadius: "20px",
                          border: "1px solid",
                          borderColor: filterStatus === chip ? "#C8A165" : "#ECE7DF",
                          background: filterStatus === chip ? "#C8A165" : "#FFFFFF",
                          color: filterStatus === chip ? "#FFFFFF" : "#6B7280",
                          fontSize: "12.5px",
                          fontWeight: "600",
                          cursor: "pointer",
                          transition: "all 0.2s ease"
                        }}
                      >
                        {chip === "All" ? "All Orders" : chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Orders Card Stack */}
                {processedOrders.length === 0 ? (
                  <div style={{ textAlign: "center", padding: "40px", background: "#FFFFFF", border: "1px solid #EFEFEF", borderRadius: "20px", color: "#6B7280" }}>
                    No orders match your search criteria. Try modifying filters or search query terms.
                  </div>
                ) : (
                  <div className="order-history-cards-stack" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                    {processedOrders.slice(0, visibleCount).map((order) => {
                      const deliveredDate = order.deliveredAt ? new Date(order.deliveredAt) : null;
                      const daysSinceDelivery = deliveredDate ? Math.floor((Date.now() - deliveredDate.getTime()) / (1000 * 60 * 60 * 24)) : null;
                      
                      const isReturnEligible = order.status === "Delivered" && daysSinceDelivery !== null && daysSinceDelivery <= 7;
                      const returnWindowClosed = order.status === "Delivered" && daysSinceDelivery !== null && daysSinceDelivery > 7;
                      const isCancelable = ["Pending", "Processing"].includes(order.status);

                      const items = order.items || [];
                      const firstItem = items[0] || {};
                      const hasMultiple = items.length > 1;
                      const isExpanded = expandedOrders[order._id];

                      // Status Badge coloring mapper
                      const getBadgeStyle = (status) => {
                        switch (status) {
                          case "Pending":
                            return { bg: "rgba(59, 130, 246, 0.08)", color: "#3B82F6", border: "1px solid rgba(59, 130, 246, 0.2)" };
                          case "Processing":
                            return { bg: "rgba(249, 115, 22, 0.08)", color: "#F97316", border: "1px solid rgba(249, 115, 22, 0.2)" };
                          case "Packed":
                            return { bg: "rgba(139, 92, 246, 0.08)", color: "#8B5CF6", border: "1px solid rgba(139, 92, 246, 0.2)" };
                          case "Shipped":
                            return { bg: "rgba(99, 102, 241, 0.08)", color: "#6366F1", border: "1px solid rgba(99, 102, 241, 0.2)" };
                          case "Out For Delivery":
                            return { bg: "rgba(200, 161, 101, 0.08)", color: "#C8A165", border: "1px solid rgba(200, 161, 101, 0.2)" };
                          case "Delivered":
                            return { bg: "rgba(16, 185, 129, 0.08)", color: "#10B981", border: "1px solid rgba(16, 185, 129, 0.2)" };
                          case "Cancelled":
                            return { bg: "rgba(239, 68, 68, 0.08)", color: "#EF4444", border: "1px solid rgba(239, 68, 68, 0.2)" };
                          case "Return Requested":
                          case "Return Approved":
                          case "Returned":
                            return { bg: "rgba(217, 119, 6, 0.08)", color: "#D97706", border: "1px solid rgba(217, 119, 6, 0.2)" };
                          case "Refund Completed":
                            return { bg: "rgba(5, 150, 105, 0.08)", color: "#059669", border: "1px solid rgba(5, 150, 105, 0.2)" };
                          default:
                            return { bg: "#F3F4F6", color: "#6B7280", border: "1px solid #E5E7EB" };
                        }
                      };

                      const badge = getBadgeStyle(order.status);

                      return (
                        <div key={order._id} className="history-order-item-card" style={{ background: "#FFFFFF", border: "1px solid #EFEFEF", borderRadius: "20px", padding: "28px", display: "flex", flexDirection: "column", gap: "20px" }}>
                          
                          {/* Header metadata row */}
                          <div className="history-header-row" style={{ display: "flex", flexWrap: "wrap", gap: "16px", justifyContent: "space-between", borderBottom: "1px solid #F6F6F6", paddingBottom: "16px", margin: 0 }}>
                            <div className="meta-block">
                              <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#6B7280", display: "block", marginBottom: "4px" }}>ORDER NUMBER</span>
                              <strong style={{ fontSize: "14px", color: "#1A1A1A" }}>#{order._id.slice(-8).toUpperCase()}</strong>
                            </div>
                            <div className="meta-block">
                              <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#6B7280", display: "block", marginBottom: "4px" }}>ORDER DATE</span>
                              <strong style={{ fontSize: "14px", color: "#1A1A1A" }}>{new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</strong>
                            </div>
                            <div className="meta-block">
                              <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#6B7280", display: "block", marginBottom: "4px" }}>AMOUNT PAID</span>
                              <strong style={{ fontSize: "14px", color: "#C8A165" }}>₹{order.totalAmount.toFixed(2)}</strong>
                            </div>
                            <div className="meta-block">
                              <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#6B7280", display: "block", marginBottom: "4px" }}>STATUS</span>
                              <span style={{ padding: "4px 10px", borderRadius: "20px", fontSize: "11.5px", fontWeight: "700", textTransform: "uppercase", background: badge.bg, color: badge.color, border: badge.border }}>
                                {order.status === "Pending" ? "Confirmed" : order.status}
                              </span>
                            </div>
                            {deliveredDate && (
                              <div className="meta-block">
                                <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#6B7280", display: "block", marginBottom: "4px" }}>DELIVERED DATE</span>
                                <strong style={{ fontSize: "14px", color: "#10B981" }}>{deliveredDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</strong>
                              </div>
                            )}
                          </div>

                          {/* Expandable items listing */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                            {/* Always show first item */}
                            <div className="history-thumbnail-row" style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                              <img
                                src={firstItem.productImage || "/placeholder.jpg"}
                                alt={firstItem.productName}
                                className="history-thumb-image"
                                style={{ width: "70px", height: "70px", borderRadius: "10px", objectFit: "cover", border: "1px solid #EFEFEF" }}
                              />
                              <div className="history-thumb-details">
                                <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", color: "#1A1A1A", fontWeight: "600" }}>{firstItem.productName}</h4>
                                <p style={{ margin: 0, fontSize: "12.5px", color: "#6B7280" }}>Quantity: {firstItem.qty} • Price: ₹{firstItem.price.toFixed(2)}</p>
                              </div>
                            </div>

                            {/* Expandable rows */}
                            {hasMultiple && (
                              <>
                                {isExpanded && (
                                  <div className="expandable-items-container" style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "4px", borderTop: "1px dashed #EFEFEF", paddingTop: "12px" }}>
                                    {items.slice(1).map((item, idx) => (
                                      <div key={item._id || idx} className="history-thumbnail-row" style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                                        <img
                                          src={item.productImage || "/placeholder.jpg"}
                                          alt={item.productName}
                                          style={{ width: "70px", height: "70px", borderRadius: "10px", objectFit: "cover", border: "1px solid #EFEFEF" }}
                                        />
                                        <div className="history-thumb-details">
                                          <h4 style={{ margin: "0 0 4px 0", fontSize: "14px", color: "#1A1A1A", fontWeight: "600" }}>{item.productName}</h4>
                                          <p style={{ margin: 0, fontSize: "12.5px", color: "#6B7280" }}>Quantity: {item.qty} • Price: ₹{item.price.toFixed(2)}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                <button
                                  type="button"
                                  onClick={() => toggleExpandOrder(order._id)}
                                  style={{
                                    alignSelf: "flex-start",
                                    background: "none",
                                    border: "none",
                                    color: "#C8A165",
                                    fontWeight: "600",
                                    fontSize: "12.5px",
                                    cursor: "pointer",
                                    padding: "4px 0",
                                    outline: "none",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "4px"
                                  }}
                                >
                                  {isExpanded ? "View Less Items" : `View All Items (+${items.length - 1} more)`}
                                </button>
                              </>
                            )}
                          </div>

                          {/* Footer Actions buttons */}
                          <div className="history-actions-footer" style={{ display: "flex", flexWrap: "wrap", gap: "10px", marginTop: "8px", borderTop: "1px solid #F6F6F6", paddingTop: "18px" }}>
                            <Link to={`/order/${order._id}`} className="btn-history-track-primary" style={{ padding: "10px 20px", borderRadius: "8px", textDecoration: "none", fontSize: "13px", fontWeight: "600", background: "#C8A165", color: "#FFFFFF", display: "inline-flex", alignItems: "center" }}>
                              Track Order
                            </Link>
                            
                            <button
                              onClick={() => handleDownloadInvoice(order._id)}
                              className="btn-history-invoice-secondary"
                              style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid #1A1A1A", background: "#1A1A1A", color: "#FFFFFF", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                            >
                              Download Invoice
                            </button>

                            {order.status === "Delivered" && items.map(item => {
                              const alreadyReviewed = userReviews.some(r => r.orderId === order._id && r.productId === item.productId);
                              return (
                                <div key={item.productId} style={{ display: "inline-block" }}>
                                  {alreadyReviewed ? (
                                    <span style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #ECE7DF", background: "#FAF9F6", color: "#6B7280", fontSize: "13px", fontWeight: "600", display: "inline-block" }}>
                                      View Your Review ({item.productName.slice(0, 8)}...)
                                    </span>
                                  ) : (
                                    <Link
                                      to={`/product/${item.productId}`}
                                      className="btn-history-buyagain-outline"
                                      style={{ padding: "10px 14px", borderRadius: "8px", border: "1px solid #C8A165", background: "#FFFFFF", color: "#C8A165", textDecoration: "none", fontSize: "13px", fontWeight: "600", display: "inline-block" }}
                                    >
                                      Review {item.productName.slice(0, 8)}...
                                    </Link>
                                  )}
                                </div>
                              );
                            })}

                            {isReturnEligible && (
                              <button
                                onClick={() => navigate(`/return/${order._id}`)}
                                style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid #EF4444", background: "rgba(239, 68, 68, 0.05)", color: "#EF4444", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                              >
                                Request Return
                              </button>
                            )}

                            {returnWindowClosed && (
                              <span style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid #ECE7DF", background: "#FAF9F6", color: "#6B7280", fontSize: "13px", fontWeight: "600" }}>
                                Return Window Closed
                              </span>
                            )}

                            {isCancelable && (
                              <button
                                onClick={() => handleCancelOrder(order._id)}
                                style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid #EF4444", background: "#FFFFFF", color: "#EF4444", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                              >
                                Cancel Order
                              </button>
                            )}
                            
                            <button
                              onClick={() => handleReorderAll(order.items)}
                              className="btn-history-buyagain-outline"
                              style={{ padding: "10px 20px", borderRadius: "8px", border: "1px solid #ECE7DF", background: "#FFFFFF", color: "#6B7280", fontSize: "13px", fontWeight: "600", cursor: "pointer" }}
                            >
                              Buy Again
                            </button>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Pagination Load More */}
                {processedOrders.length > visibleCount && (
                  <div style={{ textAlign: "center", marginTop: "30px" }}>
                    <button
                      onClick={() => setVisibleCount(prev => prev + 5)}
                      style={{
                        padding: "12px 30px",
                        borderRadius: "30px",
                        border: "1px solid #C8A165",
                        background: "#FFFFFF",
                        color: "#C8A165",
                        fontSize: "14px",
                        fontWeight: "700",
                        cursor: "pointer",
                        outline: "none",
                        transition: "all 0.2s ease"
                      }}
                      className="btn-load-more"
                    >
                      Load More Orders
                    </button>
                  </div>
                )}
              </>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};

export default Profile;
