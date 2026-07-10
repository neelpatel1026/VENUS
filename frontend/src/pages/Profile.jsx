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
          setOrders(Array.isArray(data) ? data.slice(0, 5) : []);
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

  // Reorder all products of an order
  const handleReorderAll = (items) => {
    if (!items || items.length === 0) return;
    items.forEach((item) => {
      if (item.productId) {
        dispatch(
          addToCart({
            _id: item.productId,
            name: item.productName,
            price: item.price,
            image: item.productImage || "/placeholder.jpg",
            stock: 10,
            qty: item.qty || 1,
          })
        );
      }
    });
    toast.success("All items added to cart! 🛍");
    navigate("/cart");
  };

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

  return (
    <div className="profile-dashboard-wrapper" style={{ padding: "0 0 40px 0" }}>
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
            <span style={{ color: "#1F2937" }}>Profile</span>
          </div>
          
          <span style={{ display: "inline-block", fontSize: "0.8rem", letterSpacing: "3px", textTransform: "uppercase", color: "#C8A96B", fontWeight: "700", marginBottom: "8px" }}>
            Customer Account Panel
          </span>
          <h1 style={{ fontFamily: "'Cinzel', 'Didot', 'Times New Roman', serif", fontSize: "2.5rem", fontWeight: "700", color: "#1F2937", margin: "0 0 10px 0", letterSpacing: "-0.5px", lineHeight: "1.2" }}>
            Welcome Back
          </h1>
          <div style={{ width: "40px", height: "1px", background: "#C8A96B", margin: "14px auto" }} />
          <p style={{ fontSize: "0.95rem", color: "#6B7280", margin: "0 auto", lineHeight: "1.6", maxWidth: "600px" }}>
            Manage your shipping credentials, track active order shipments, or check your wallet transactions.
          </p>
        </div>
      </div>

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
            <h3>Recent Orders</h3>
            
            {loading ? (
              <div className="order-history-loading">
                <div className="spinner-indicator"></div>
                <p>Loading historical order statements...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="profile-empty-orders-card">
                <span className="empty-icon">📦</span>
                <h4>No Orders Yet</h4>
                <p>Start shopping from our cosmetic range to log transactions.</p>
                <Link to="/shop" className="btn-shop-redirect">Shop Skincare</Link>
              </div>
            ) : (
              <div className="order-history-cards-stack">
                {orders.map((order) => (
                  <div key={order._id} className="history-order-item-card">
                    
                    {/* Header: Date, Amount, Status Badge */}
                    <div className="history-header-row">
                      <div className="meta-block">
                        <span>ORDER DATE</span>
                        <strong>{new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</strong>
                      </div>
                      <div className="meta-block">
                        <span>AMOUNT PAID</span>
                        <strong className="amount-gold">₹{order.totalAmount.toFixed(2)}</strong>
                      </div>
                      <div className="meta-block">
                        <span>ORDER STATUS</span>
                        <span className={`status-pill status-${order.status.toLowerCase().replace(/\s+/g, "-")}`}>
                          {order.status}
                        </span>
                      </div>
                      <div className="meta-block">
                        <span>ESTIMATED DELIVERY</span>
                        <strong>{getDeliveryEta(order.createdAt)}</strong>
                      </div>
                    </div>

                    {/* Products details */}
                    <div className="history-items-thumbnail-list">
                      {order.items &&
                        order.items.map((item, idx) => (
                          <div key={item._id || idx} className="history-thumbnail-row">
                            <img
                              src={item.productImage || "/placeholder.jpg"}
                              alt={item.productName}
                              className="history-thumb-image"
                            />
                            <div className="history-thumb-details">
                              <h4>{item.productName}</h4>
                              <p>Quantity: {item.qty} • Price: ₹{item.price.toFixed(2)}</p>
                            </div>
                          </div>
                        ))}
                    </div>

                    {/* Actions Panel (Hierarchical Gold Primary, Dark Secondary, Outline Buy Again) */}
                    <div className="history-actions-footer">
                      <Link to={`/order/${order._id}`} className="btn-history-track-primary">
                        Track Order
                      </Link>
                      <button
                        onClick={() => handleDownloadInvoice(order._id)}
                        className="btn-history-invoice-secondary"
                      >
                        Download Invoice
                      </button>
                      <button
                        onClick={() => handleReorderAll(order.items)}
                        className="btn-history-buyagain-outline"
                      >
                        Buy Again
                      </button>
                    </div>

                  </div>
                ))}
              </div>
            )}
          </div>

        </div>

      </div>

    </div>
  );
};

export default Profile;
