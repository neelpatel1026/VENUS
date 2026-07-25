import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { LuChevronRight, LuCopy, LuStar, LuReceipt, LuRefreshCw, LuMessageSquare, LuTruck, LuPackage, LuHeart, LuEye } from "react-icons/lu";
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
  const [recommendedProducts, setRecommendedProducts] = useState([]);

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        if (res.ok) {
          setRecommendedProducts(data.slice(0, 4));
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchProducts();
  }, []);

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
            <div className="orders-section-header-luxury">
              <h3 className="orders-section-title-luxury">My Order History</h3>
              <p className="orders-section-subtitle-luxury">Manage and track your premium cosmetic deliveries</p>
            </div>
            
            {loading ? (
              <div className="order-history-loading-luxury">
                <div className="ordersuccess-spinner"></div>
                <p>Loading historical order statements...</p>
              </div>
            ) : orders.length === 0 ? (
              <div className="profile-empty-orders-card-luxury">
                <div className="empty-orders-illustration-box">
                  <LuPackage className="empty-orders-box-vector" />
                </div>
                <h4 className="empty-orders-title">No Orders Yet</h4>
                <p className="empty-orders-subtitle">
                  You haven't placed your first order yet. Discover our premium botanical skincare collection.
                </p>
                <div className="empty-orders-actions-row">
                  <Link to="/shop" className="btn-empty-orders-start-shopping">
                    ✨ Start Shopping
                  </Link>
                  <Link to="/shop?filter=bestsellers" className="btn-empty-orders-bestsellers">
                    🔥 View Best Sellers
                  </Link>
                </div>

                {recommendedProducts.length > 0 && (
                  <div className="empty-orders-recommendations-section">
                    <h5 className="recommendations-header-title">Trending Skincare For You</h5>
                    <div className="recommendations-products-grid">
                      {recommendedProducts.map((p) => (
                        <div key={p._id} className="recommendation-mini-product-card" onClick={() => navigate(`/product/${p._id}`)}>
                          <div className="recommendation-card-image-box">
                            <img src={p.imageUrl || "/cosmetic_1.avif"} alt={p.name} onError={(e) => { e.target.src = "/cosmetic_1.avif"; }} />
                          </div>
                          <div className="recommendation-card-details">
                            <h6>{p.name}</h6>
                            <span className="recommendation-card-price">₹{p.price.toFixed(2)}</span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            ) : (
              <>
                {/* Search, Filter, Sort Controls */}
                <div className="orders-control-bar-luxury">
                  <div className="orders-search-filter-inputs-row">
                    <input
                      type="text"
                      placeholder="Search orders by Product Name or Order ID..."
                      value={searchTerm}
                      onChange={(e) => {
                        setSearchTerm(e.target.value);
                        setVisibleCount(5);
                      }}
                      className="orders-search-input-field-luxury"
                    />
                    
                    <select
                      value={sortBy}
                      onChange={(e) => setSortBy(e.target.value)}
                      className="orders-sort-select-field-luxury"
                    >
                      <option value="newest">Sort: Newest First</option>
                      <option value="oldest">Sort: Oldest First</option>
                      <option value="highest">Sort: Price: High to Low</option>
                      <option value="lowest">Sort: Price: Low to High</option>
                    </select>
                  </div>

                  <div className="orders-status-filter-chips-list">
                    {["All", "Processing", "Delivered", "Cancelled", "Returns"].map((chip) => (
                      <button
                        key={chip}
                        type="button"
                        onClick={() => {
                          setFilterStatus(chip);
                          setVisibleCount(5);
                        }}
                        className={`orders-filter-chip-btn ${filterStatus === chip ? "active" : ""}`}
                      >
                        {chip === "All" ? "All Orders" : chip}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Orders Card Stack */}
                {processedOrders.length === 0 ? (
                  <div className="orders-empty-filter-match-luxury">
                    No orders match your search criteria. Try modifying filters or search query terms.
                  </div>
                ) : (
                  <div className="order-history-cards-stack-luxury">
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

                      return (
                        <div key={order._id} className="history-order-item-card-luxury">
                          
                          {/* Header metadata row */}
                          <div className="history-header-row-luxury">
                            <div className="meta-block-luxury">
                              <span className="meta-label-luxury">ORDER NUMBER</span>
                              <strong className="meta-value-luxury">#{order._id.slice(-8).toUpperCase()}</strong>
                            </div>
                            <div className="meta-block-luxury">
                              <span className="meta-label-luxury">ORDER DATE</span>
                              <strong className="meta-value-luxury">{new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</strong>
                            </div>
                            <div className="meta-block-luxury">
                              <span className="meta-label-luxury">AMOUNT PAID</span>
                              <strong className="meta-value-luxury price-luxury">₹{order.totalAmount.toFixed(2)}</strong>
                            </div>
                            <div className="meta-block-luxury">
                              <span className="meta-label-luxury">STATUS</span>
                              <span className={`status-badge-luxury status-${order.status.toLowerCase().replace(/\s+/g, "-")}`}>
                                {order.status === "Pending" ? "Confirmed" : order.status}
                              </span>
                            </div>
                            {deliveredDate && (
                              <div className="meta-block-luxury">
                                <span className="meta-label-luxury">DELIVERED DATE</span>
                                <strong className="meta-value-luxury delivery-success-luxury">{deliveredDate.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}</strong>
                              </div>
                            )}
                          </div>

                          {/* Items listing */}
                          <div className="history-items-list-container-luxury">
                            {/* Always show first item */}
                            <div className="history-thumbnail-row-luxury">
                              <img
                                src={firstItem.productImage || "/placeholder.jpg"}
                                alt={firstItem.productName}
                                className="history-thumb-image-luxury"
                              />
                              <div className="history-thumb-details-luxury">
                                <h4 className="product-title-luxury">{firstItem.productName}</h4>
                                <p className="product-meta-subtext-luxury">Quantity: {firstItem.qty} • Price: ₹{firstItem.price.toFixed(2)}</p>
                              </div>
                            </div>

                            {/* Expandable rows */}
                            {hasMultiple && (
                              <>
                                {isExpanded && (
                                  <div className="expandable-items-container-luxury">
                                    {items.slice(1).map((item, idx) => (
                                      <div key={item._id || idx} className="history-thumbnail-row-luxury">
                                        <img
                                          src={item.productImage || "/placeholder.jpg"}
                                          alt={item.productName}
                                          className="history-thumb-image-luxury"
                                        />
                                        <div className="history-thumb-details-luxury">
                                          <h4 className="product-title-luxury">{item.productName}</h4>
                                          <p className="product-meta-subtext-luxury">Quantity: {item.qty} • Price: ₹{item.price.toFixed(2)}</p>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                )}
                                
                                <button
                                  type="button"
                                  onClick={() => toggleExpandOrder(order._id)}
                                  className="toggle-expand-items-btn-luxury"
                                >
                                  {isExpanded ? "View Less Items" : `View All Items (+${items.length - 1} more)`}
                                </button>
                              </>
                            )}
                          </div>

                          {/* Footer Actions buttons */}
                          <div className="history-actions-footer-luxury">
                            <Link to={`/order/${order._id}`} className="btn-luxury-action-primary">
                              <LuTruck /> Track Order
                            </Link>
                            
                            <button
                              type="button"
                              onClick={() => handleDownloadInvoice(order._id)}
                              className="btn-luxury-action-secondary"
                            >
                              <LuReceipt /> Download Invoice
                            </button>

                            {order.status === "Delivered" && items.map(item => {
                              const alreadyReviewed = userReviews.some(r => r.orderId === order._id && r.productId === item.productId);
                              return (
                                <div key={item.productId} className="inline-action-item-wrap">
                                  {alreadyReviewed ? (
                                    <span className="btn-luxury-action-status-badge">
                                      ✓ Reviewed ({item.productName.slice(0, 10)}...)
                                    </span>
                                  ) : (
                                    <Link
                                      to={`/product/${item.productId}`}
                                      className="btn-luxury-action-outline-gold"
                                    >
                                      <LuStar /> Review {item.productName.slice(0, 10)}...
                                    </Link>
                                  )}
                                </div>
                              );
                            })}

                            {isReturnEligible && (
                              <button
                                type="button"
                                onClick={() => navigate(`/return/${order._id}`)}
                                className="btn-luxury-action-outline-danger"
                              >
                                Request Return
                              </button>
                            )}

                            {returnWindowClosed && (
                              <span className="btn-luxury-action-status-badge">
                                Return Window Closed
                              </span>
                            )}

                            {isCancelable && (
                              <button
                                type="button"
                                onClick={() => handleCancelOrder(order._id)}
                                className="btn-luxury-action-outline-danger"
                              >
                                Cancel Order
                              </button>
                            )}
                            
                            <button
                              type="button"
                              onClick={() => handleReorderAll(order.items)}
                              className="btn-luxury-action-outline-gold"
                            >
                              <LuRefreshCw /> Buy Again
                            </button>
                          </div>

                        </div>
                      );
                    })}
                  </div>
                )}

                {/* Pagination Load More */}
                {processedOrders.length > visibleCount && (
                  <div className="pagination-load-more-row-luxury">
                    <button
                      type="button"
                      onClick={() => setVisibleCount(prev => prev + 5)}
                      className="btn-load-more-orders-luxury"
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
