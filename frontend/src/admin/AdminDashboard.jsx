import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import toast from "react-hot-toast";
import {
  FiAlertTriangle,
  FiCheckCircle,
  FiPercent,
  FiRefreshCw,
  FiBarChart2,
  FiBox,
  FiShoppingBag,
  FiGift,
  FiMessageSquare,
  FiStar,
  FiUsers,
  FiTruck,
  FiSearch,
  FiTrendingUp,
  FiDollarSign
} from "react-icons/fi";
import { LuShoppingCart, LuSearch, LuTrendingUp } from "react-icons/lu";

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  // Global Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState(null);
  const [searching, setSearching] = useState(false);

  // Quick Restock Value Dictionary
  const [restockValues, setRestockValues] = useState({});

  const fetchStats = async () => {
    try {
      const res = await fetch("/api/analytics", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const data = await res.json();

      if (res.ok) {
        setStats(data);
      } else {
        if (res.status === 401) {
          navigate("/login");
        }
        setStats({
          totalOrders: 0,
          totalProducts: 0,
          totalUsers: 0,
          totalRevenue: 0,
        });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/");
      return;
    }
    fetchStats();
  }, [user, navigate]);

  // Handle Instant Search Debounce
  useEffect(() => {
    if (!searchQuery.trim()) {
      setSearchResults(null);
      return;
    }

    const delayDebounce = setTimeout(async () => {
      setSearching(true);
      try {
        const res = await fetch(`/api/analytics/search?q=${encodeURIComponent(searchQuery)}`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        const data = await res.json();
        if (res.ok && data.success) {
          setSearchResults(data.results);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setSearching(false);
      }
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, user]);

  const handleQuickRestock = async (productId, amount) => {
    if (amount === undefined || isNaN(amount) || amount < 0) {
      toast.error("Please enter a valid stock amount");
      return;
    }
    toast.loading("Updating stock values...");
    try {
      const res = await fetch(`/api/products/${productId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ stock: Number(amount) }),
      });
      if (res.ok) {
        toast.dismiss();
        toast.success("Product restocked successfully!");
        setRestockValues(prev => ({ ...prev, [productId]: "" }));
        fetchStats();
      } else {
        const errData = await res.json();
        toast.dismiss();
        toast.error(errData.message || "Failed to restock");
      }
    } catch (err) {
      toast.dismiss();
      toast.error("Restock request failed");
    }
  };

  const getGreeting = () => {
    const hrs = new Date().getHours();
    if (hrs < 12) return "Good Morning";
    if (hrs < 17) return "Good Afternoon";
    return "Good Evening";
  };

  const getFormattedDate = () => {
    return new Date().toLocaleDateString("en-US", {
      weekday: "long",
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  const buildActionCards = (stats) => {
    if (!stats) return [];

    const cards = [];

    // Critical Priority
    if (stats.lowStockProducts && stats.lowStockProducts.length > 0) {
      cards.push({
        id: "low_stock",
        title: "Products Running Low",
        description: `Only ${stats.lowStockProducts.length} items are running low on inventory stock.`,
        count: stats.lowStockProducts.length,
        priority: "critical",
        priorityLabel: "Critical Priority",
        color: "#DC2626",
        icon: <FiBox size={22} color="#DC2626" />,
        primaryAction: () => navigate("/admin/products"),
        primaryText: "Restock Products",
        secondaryAction: () => navigate("/admin/products"),
        secondaryText: "Manage Inventory",
        extraContent: (
          <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
            {stats.lowStockProducts.slice(0, 3).map(p => (
              <img key={p._id} src={p.image} alt={p.name} style={{ width: "28px", height: "28px", borderRadius: "4px", border: "1px solid #ECECEC", objectFit: "cover" }} title={`${p.name} (Stock: ${p.stock})`} />
            ))}
            {stats.lowStockProducts.length > 3 && (
              <span style={{ fontSize: "11px", color: "#6B7280", alignSelf: "center", marginLeft: "4px" }}>+{stats.lowStockProducts.length - 3} more</span>
            )}
          </div>
        )
      });
    }

    if (stats.pendingReturnsCount > 0) {
      cards.push({
        id: "pending_returns",
        title: "Pending Return Requests",
        description: `${stats.pendingReturnsCount} return cases are awaiting merchant review.`,
        count: stats.pendingReturnsCount,
        priority: "critical",
        priorityLabel: "Critical Priority",
        color: "#DC2626",
        icon: <FiRefreshCw size={22} color="#DC2626" />,
        primaryAction: () => navigate("/admin/returns"),
        primaryText: "Review Returns",
        secondaryAction: () => navigate("/admin/returns"),
        secondaryText: "View Requests"
      });
    }

    if (stats.ordersProcessing > 0) {
      cards.push({
        id: "pending_orders",
        title: "Orders Waiting for Processing",
        description: `${stats.ordersProcessing} newly received checkouts require processing.`,
        count: stats.ordersProcessing,
        priority: "critical",
        priorityLabel: "Critical Priority",
        color: "#DC2626",
        icon: <FiShoppingBag size={22} color="#DC2626" />,
        primaryAction: () => navigate("/admin/orders"),
        primaryText: "Process Orders",
        secondaryAction: () => navigate("/admin/orders"),
        secondaryText: "View Orders"
      });
    }

    // Medium Priority
    if (stats.ordersPacked > 0) {
      cards.push({
        id: "packing_queue",
        title: "Orders Ready for Packing",
        description: `${stats.ordersPacked} items are packed and awaiting courier pickups.`,
        count: stats.ordersPacked,
        priority: "medium",
        priorityLabel: "Medium Priority",
        color: "#F59E0B",
        icon: <FiBox size={22} color="#F59E0B" />,
        primaryAction: () => navigate("/admin/orders"),
        primaryText: "Pack Orders",
        secondaryAction: () => navigate("/admin/orders"),
        secondaryText: "View Queue"
      });
    }

    if (stats.ordersOutForDelivery > 0) {
      cards.push({
        id: "delivery_monitor",
        title: "Orders Out for Delivery",
        description: `${stats.ordersOutForDelivery} parcels are currently transit-active today.`,
        count: stats.ordersOutForDelivery,
        priority: "medium",
        priorityLabel: "Medium Priority",
        color: "#F59E0B",
        icon: <FiTruck size={22} color="#F59E0B" />,
        primaryAction: () => navigate("/admin/orders"),
        primaryText: "Track Deliveries",
        secondaryAction: () => navigate("/admin/orders"),
        secondaryText: "View Orders"
      });
    }

    if (stats.expiringCouponsCount > 0) {
      cards.push({
        id: "coupons_expiry",
        title: "Coupons Expiring Soon",
        description: `${stats.expiringCouponsCount} discount campaigns will expire within 7 days.`,
        count: stats.expiringCouponsCount,
        priority: "medium",
        priorityLabel: "Medium Priority",
        color: "#F59E0B",
        icon: <FiGift size={22} color="#F59E0B" />,
        primaryAction: () => navigate("/admin/coupons"),
        primaryText: "Manage Coupons",
        secondaryAction: () => navigate("/admin/coupons"),
        secondaryText: "Extend Expiry"
      });
    }

    // Low Priority
    if (stats.reviewsAwaitingApprovalCount > 0) {
      cards.push({
        id: "reviews_mod",
        title: "Reviews Awaiting Approval",
        description: `${stats.reviewsAwaitingApprovalCount} new customer reviews are awaiting moderation.`,
        count: stats.reviewsAwaitingApprovalCount,
        priority: "low",
        priorityLabel: "Low Priority",
        color: "#2563EB",
        icon: <FiStar size={22} color="#2563EB" />,
        primaryAction: () => navigate("/admin/reviews"),
        primaryText: "Moderate Reviews",
        secondaryAction: () => navigate("/admin/reviews"),
        secondaryText: "View All"
      });
    }

    if (stats.newCustomersToday > 0) {
      cards.push({
        id: "new_customers",
        title: "New Customers Today",
        description: `${stats.newCustomersToday} new beauty shoppers registered on the platform today.`,
        count: stats.newCustomersToday,
        priority: "low",
        priorityLabel: "Low Priority",
        color: "#C8A165",
        icon: <FiUsers size={22} color="#C8A165" />,
        primaryAction: () => navigate("/admin/users"),
        primaryText: "View Customers",
        secondaryAction: () => navigate("/admin/users"),
        secondaryText: "Customer Analytics"
      });
    }

    if (stats.openTicketsCount > 0) {
      cards.push({
        id: "support_tickets",
        title: "Support Tickets Active",
        description: `${stats.openTicketsCount} complaints are open and require merchant responses.`,
        count: stats.openTicketsCount,
        priority: "low",
        priorityLabel: "Low Priority",
        color: "#2563EB",
        icon: <FiMessageSquare size={22} color="#2563EB" />,
        primaryAction: () => navigate("/admin/complaints"),
        primaryText: "Reply",
        secondaryAction: () => navigate("/admin/complaints"),
        secondaryText: "Open Support"
      });
    }

    const priorityOrder = { critical: 1, medium: 2, low: 3 };
    return cards.sort((a, b) => priorityOrder[a.priority] - priorityOrder[b.priority]);
  };

  if (!user || user.role !== "admin") return null;

  // SVG Chart Generators
  const renderLineChart = (data) => {
    if (!data || data.length === 0) return <div style={{ color: "#6B7280" }}>No chart data.</div>;
    const maxVal = Math.max(...data.map(d => d.revenue || 0), 1000);
    const width = 500;
    const height = 180;
    const padding = 35;
    const denominator = Math.max(1, data.length - 1);
    
    const points = data.map((d, i) => {
      const x = padding + (i * (width - 2 * padding)) / denominator;
      const y = height - padding - ((d.revenue || 0) * (height - 2 * padding)) / maxVal;
      return `${x},${y}`;
    }).join(" ");

    return (
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="200" style={{ overflow: "visible" }}>
        <line x1={padding} y1={padding} x2={width - padding} y2={padding} stroke="#F3F4F6" strokeWidth={1} />
        <line x1={padding} y1={height / 2} x2={width - padding} y2={height / 2} stroke="#F3F4F6" strokeWidth={1} />
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#E5E7EB" strokeWidth={1} />

        <polyline fill="none" stroke="#C8A165" strokeWidth="3" points={points} />
        
        {data.map((d, i) => {
          const x = padding + (i * (width - 2 * padding)) / denominator;
          const y = height - padding - ((d.revenue || 0) * (height - 2 * padding)) / maxVal;
          return (
            <g key={i}>
              <circle cx={x} cy={y} r="5" fill="#C8A165" stroke="#FFFFFF" strokeWidth="2" />
              <text x={x} y={height - 12} fontSize="9" textAnchor="middle" fill="#6B7280" fontWeight="600">
                {d.month}
              </text>
              <text x={x} y={y - 10} fontSize="9" textAnchor="middle" fill="#1A1A1A" fontWeight="700">
                ₹{Math.round((d.revenue || 0) / 1000)}k
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  const renderBarChart = (data) => {
    if (!data || data.length === 0) return <div style={{ color: "#6B7280" }}>No chart data.</div>;
    const maxVal = Math.max(...data.map(d => d.orders || 0), 5);
    const width = 500;
    const height = 180;
    const padding = 35;
    const barWidth = 24;
    const denominator = Math.max(1, data.length - 1);

    return (
      <svg viewBox={`0 0 ${width} ${height}`} width="100%" height="200" style={{ overflow: "visible" }}>
        <line x1={padding} y1={height - padding} x2={width - padding} y2={height - padding} stroke="#E5E7EB" strokeWidth={1} />
        
        {data.map((d, i) => {
          const x = padding + (i * (width - 2 * padding)) / denominator - barWidth / 2;
          const barHeight = ((d.orders || 0) * (height - 2 * padding)) / maxVal;
          const y = height - padding - barHeight;
          return (
            <g key={i}>
              <rect x={x} y={y} width={barWidth} height={barHeight} fill="rgba(200, 161, 101, 0.15)" stroke="#C8A165" strokeWidth="1.5" rx="4" />
              <text x={x + barWidth / 2} y={height - 12} fontSize="9" textAnchor="middle" fill="#6B7280" fontWeight="600">
                {d.month}
              </text>
              <text x={x + barWidth / 2} y={y - 8} fontSize="9" textAnchor="middle" fill="#1A1A1A" fontWeight="700">
                {d.orders || 0}
              </text>
            </g>
          );
        })}
      </svg>
    );
  };

  return (
    <div className="admin-layout-wrapper">
      {/* LEFT COLUMN: SIDEBAR */}
      <AdminSidebar />

      {/* RIGHT COLUMN: MAIN CONSOLE */}
      <div className="admin-content-console" style={{ background: "#F8F8F8" }}>
        
        {/* GLOBAL HEADER WITH SEARCH BAR */}
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "20px", marginBottom: "32px", borderBottom: "1px solid #ECECEC", paddingBottom: "24px" }}>
          <div>
            <h2 style={{ fontSize: "28px", fontWeight: "700", color: "#1A1A1A", fontFamily: "'Cinzel', serif" }}>
              {getGreeting()}, {user.name}
            </h2>
            <p style={{ color: "#6B7280", fontSize: "14px", marginTop: "4px", fontWeight: "500" }}>
              📅 {getFormattedDate()} | Here's everything that needs your attention today.
            </p>
          </div>

          {/* Global Instant Search Container */}
          <div style={{ position: "relative", width: "100%", maxWidth: "420px" }}>
            <div style={{ display: "flex", alignItems: "center", background: "#FFFFFF", border: "1px solid #E5E7EB", borderRadius: "12px", padding: "0 14px", height: "46px" }}>
              <LuSearch color="#6B7280" size={18} style={{ marginRight: "10px" }} />
              <input
                type="text"
                placeholder="Global search orders, users, products..."
                style={{ border: "none", outline: "none", width: "100%", fontSize: "14px", color: "#1A1A1A" }}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              {searching && <div className="auth-spinner" style={{ width: "16px", height: "16px", borderWidth: "2px" }} />}
            </div>

            {/* Dropdown Instant Results Panel */}
            {searchResults && (
              <div style={{ position: "absolute", top: "52px", left: 0, right: 0, background: "#FFFFFF", borderRadius: "12px", border: "1px solid #ECECEC", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.1)", zIndex: 100, maxHeight: "380px", overflowY: "auto", padding: "12px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px", borderBottom: "1px solid #F3F4F6", pb: "8px" }}>
                  <span style={{ fontSize: "11px", textTransform: "uppercase", fontWeight: "700", color: "#6B7280" }}>Global Search Results</span>
                  <button onClick={() => setSearchQuery("")} style={{ background: "none", border: "none", fontSize: "11px", color: "#C8A165", cursor: "pointer", fontWeight: "600" }}>Clear</button>
                </div>

                {/* Orders Matches */}
                {searchResults.orders?.length > 0 && (
                  <div style={{ marginBottom: "12px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#C8A165", display: "block", marginBottom: "4px" }}>Orders</span>
                    {searchResults.orders.map(o => (
                      <Link key={o._id} to={`/admin/orders/${o._id}`} onClick={() => setSearchQuery("")} style={{ display: "flex", justifyContent: "space-between", padding: "8px", borderRadius: "6px", textDecoration: "none", color: "#1A1A1A", fontSize: "13px" }} className="search-result-item-link">
                        <span>#{o._id.slice(-8).toUpperCase()} - {o.customerName}</span>
                        <strong style={{ color: "#C8A165" }}>₹{o.totalAmount}</strong>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Products Matches */}
                {searchResults.products?.length > 0 && (
                  <div style={{ marginBottom: "12px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#C8A165", display: "block", marginBottom: "4px" }}>Products</span>
                    {searchResults.products.map(p => (
                      <Link key={p._id} to="/admin/products" onClick={() => setSearchQuery("")} style={{ display: "flex", justifyContent: "space-between", padding: "8px", borderRadius: "6px", textDecoration: "none", color: "#1A1A1A", fontSize: "13px" }}>
                        <span>{p.name}</span>
                        <span style={{ color: p.stock < 5 ? "#DC2626" : "#6B7280" }}>Stock: {p.stock}</span>
                      </Link>
                    ))}
                  </div>
                )}

                {/* Users Matches */}
                {searchResults.users?.length > 0 && (
                  <div style={{ marginBottom: "4px" }}>
                    <span style={{ fontSize: "11px", fontWeight: "700", color: "#C8A165", display: "block", marginBottom: "4px" }}>Customers</span>
                    {searchResults.users.map(u => (
                      <Link key={u._id} to={`/admin/users/${u._id}`} onClick={() => setSearchQuery("")} style={{ display: "flex", flexDirection: "column", padding: "8px", borderRadius: "6px", textDecoration: "none", color: "#1A1A1A", fontSize: "13px" }}>
                        <strong>{u.name}</strong>
                        <span style={{ fontSize: "11px", color: "#6B7280" }}>{u.email} | {u.phone}</span>
                      </Link>
                    ))}
                  </div>
                )}

                {searchResults.orders?.length === 0 && searchResults.products?.length === 0 && searchResults.users?.length === 0 && (
                  <div style={{ padding: "16px 8px", textAlign: "center", color: "#6B7280", fontSize: "13px" }}>No matched records found.</div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* TODAY'S ACTION CENTER */}
        {stats && (() => {
          const actionCards = buildActionCards(stats);
          return (
            <div style={{ background: "#FFFFFF", padding: "28px", borderRadius: "24px", border: "1px solid #ECECEC", boxShadow: "0 10px 25px -5px rgba(0,0,0,0.02)", marginBottom: "32px" }}>
              <style>{`
                .action-card-hover:hover {
                  transform: translateY(-4px);
                  box-shadow: 0 12px 20px -5px rgba(0, 0, 0, 0.05);
                  border-color: #D1D5DB !important;
                }
                .btn-primary-action-hover:hover {
                  background: #B68E54 !important;
                }
                .search-result-item-link:hover {
                  background: #F9FAFB !important;
                }
              `}</style>
              
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #F3F4F6", paddingBottom: "16px" }}>
                <div>
                  <h3 style={{ fontSize: "18px", fontWeight: "700", color: "#1A1A1A" }}>⚡ Today's Action Center</h3>
                  <p style={{ fontSize: "13px", color: "#6B7280", marginTop: "2px" }}>Real-time priorities requiring merchant operations attention.</p>
                </div>
                {actionCards.length > 0 && (
                  <span style={{ fontSize: "12px", background: "#DC2626", color: "#FFFFFF", padding: "4px 10px", borderRadius: "20px", fontWeight: "700" }}>
                    {actionCards.length} Tasks Pending
                  </span>
                )}
              </div>

              {actionCards.length === 0 ? (
                /* Empty State */
                <div style={{ textAlign: "center", padding: "40px 20px" }}>
                  <div style={{ fontSize: "40px", marginBottom: "12px" }}>✅</div>
                  <h4 style={{ fontSize: "16px", fontWeight: "700", color: "#16A34A" }}>Everything looks great today!</h4>
                  <p style={{ fontSize: "13px", color: "#6B7280", marginTop: "4px" }}>No urgent operational actions require your attention right now.</p>
                </div>
              ) : (
                /* Action Cards Grid */
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "20px" }}>
                  {actionCards.map((card) => (
                    <div 
                      key={card.id} 
                      style={{ 
                        background: "#FFFFFF", 
                        border: "1px solid #ECECEC", 
                        borderRadius: "16px", 
                        padding: "20px", 
                        borderLeft: `4px solid ${card.color}`, 
                        transition: "all 0.25s ease",
                        display: "flex",
                        flexDirection: "column",
                        justifyContent: "space-between",
                        minHeight: "180px"
                      }}
                      className="action-card-hover"
                    >
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "10px" }}>
                          <span style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", width: "42px", height: "42px", borderRadius: "10px", background: `${card.color}10` }}>
                            {card.icon}
                          </span>
                          <span style={{ fontSize: "11px", fontWeight: "700", textTransform: "uppercase", background: `${card.color}15`, color: card.color, padding: "3px 8px", borderRadius: "20px" }}>
                            {card.count} {card.priorityLabel}
                          </span>
                        </div>

                        <h4 style={{ fontSize: "15px", fontWeight: "700", color: "#1A1A1A", marginTop: "14px" }}>{card.title}</h4>
                        <p style={{ fontSize: "12.5px", color: "#6B7280", marginTop: "6px", lineHeight: "1.4" }}>{card.description}</p>
                        
                        {card.extraContent}
                      </div>

                      <div style={{ display: "flex", gap: "8px", marginTop: "16px", borderTop: "1px solid #F3F4F6", paddingTop: "12px" }}>
                        <button
                          onClick={card.primaryAction}
                          style={{
                            flex: 1,
                            height: "32px",
                            background: "#C8A165",
                            color: "#FFFFFF",
                            border: "none",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer",
                            transition: "background 0.2s"
                          }}
                          className="btn-primary-action-hover"
                        >
                          {card.primaryText}
                        </button>
                        <button
                          onClick={card.secondaryAction}
                          style={{
                            flex: 1,
                            height: "32px",
                            background: "#FFFFFF",
                            color: "#6B7280",
                            border: "1px solid #E5E7EB",
                            borderRadius: "6px",
                            fontSize: "12px",
                            fontWeight: "600",
                            cursor: "pointer",
                            transition: "all 0.2s"
                          }}
                        >
                          {card.secondaryText}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          );
        })()}

        {/* TOP STATISTICS GRID - TODAY VS WEEK VS MONTH */}
        {stats && (
          <div style={{ marginBottom: "32px" }}>
            <h3 style={{ fontSize: "14px", fontWeight: "700", textTransform: "uppercase", color: "#6B7280", letterSpacing: "0.5px", marginBottom: "16px" }}>Store Performance Dashboard</h3>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px" }}>
              
              {/* Today's Revenue */}
              <div className="admin-kpi-card" style={{ background: "#FFFFFF", padding: "24px", borderRadius: "16px", border: "1px solid #ECECEC", boxShadow: "0 1px 3px rgba(0,0,0,0.02)" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13.5px", fontWeight: "600", color: "#6B7280" }}>Today's Revenue</span>
                  <FiDollarSign color="#C8A165" size={20} />
                </div>
                <h3 style={{ fontSize: "26px", fontWeight: "700", color: "#1A1A1A", margin: "12px 0 4px 0" }}>₹{stats.todayRev?.toFixed(2) || "0.00"}</h3>
                <span style={{ fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px", color: stats.revenueGrowthToday >= 0 ? "#16A34A" : "#DC2626", fontWeight: "700" }}>
                  {stats.revenueGrowthToday >= 0 ? "↑" : "↓"} {Math.abs(stats.revenueGrowthToday)}% <span style={{ color: "#9CA3AF", fontWeight: "400" }}>vs yesterday</span>
                </span>
              </div>

              {/* Today's Orders */}
              <div className="admin-kpi-card" style={{ background: "#FFFFFF", padding: "24px", borderRadius: "16px", border: "1px solid #ECECEC" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13.5px", fontWeight: "600", color: "#6B7280" }}>Today's Orders</span>
                  <LuShoppingCart color="#C8A165" size={20} />
                </div>
                <h3 style={{ fontSize: "26px", fontWeight: "700", color: "#1A1A1A", margin: "12px 0 4px 0" }}>{stats.todayOrders || 0}</h3>
                <span style={{ fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px", color: stats.ordersGrowthToday >= 0 ? "#16A34A" : "#DC2626", fontWeight: "700" }}>
                  {stats.ordersGrowthToday >= 0 ? "↑" : "↓"} {Math.abs(stats.ordersGrowthToday)}% <span style={{ color: "#9CA3AF", fontWeight: "400" }}>vs yesterday</span>
                </span>
              </div>

              {/* Weekly Performance */}
              <div className="admin-kpi-card" style={{ background: "#FFFFFF", padding: "24px", borderRadius: "16px", border: "1px solid #ECECEC" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13.5px", fontWeight: "600", color: "#6B7280" }}>This Week Sales</span>
                  <LuTrendingUp color="#C8A165" size={20} />
                </div>
                <h3 style={{ fontSize: "26px", fontWeight: "700", color: "#1A1A1A", margin: "12px 0 4px 0" }}>₹{stats.thisWeekRev?.toFixed(0) || 0}</h3>
                <span style={{ fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px", color: stats.revenueGrowthWeek >= 0 ? "#16A34A" : "#DC2626", fontWeight: "700" }}>
                  {stats.revenueGrowthWeek >= 0 ? "↑" : "↓"} {Math.abs(stats.revenueGrowthWeek)}% <span style={{ color: "#9CA3AF", fontWeight: "400" }}>vs last week</span>
                </span>
              </div>

              {/* Monthly Performance */}
              <div className="admin-kpi-card" style={{ background: "#FFFFFF", padding: "24px", borderRadius: "16px", border: "1px solid #ECECEC" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "13.5px", fontWeight: "600", color: "#6B7280" }}>This Month Sales</span>
                  <FiBarChart2 color="#C8A165" size={20} />
                </div>
                <h3 style={{ fontSize: "26px", fontWeight: "700", color: "#1A1A1A", margin: "12px 0 4px 0" }}>₹{stats.thisMonthRev?.toFixed(0) || 0}</h3>
                <span style={{ fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "4px", color: stats.revenueGrowthMonth >= 0 ? "#16A34A" : "#DC2626", fontWeight: "700" }}>
                  {stats.revenueGrowthMonth >= 0 ? "↑" : "↓"} {Math.abs(stats.revenueGrowthMonth)}% <span style={{ color: "#9CA3AF", fontWeight: "400" }}>vs last month</span>
                </span>
              </div>

            </div>

            {/* SECONDARY ROW KPI COUNTS */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "16px", marginTop: "20px" }}>
              <div style={{ background: "#FFFFFF", padding: "16px 20px", borderRadius: "12px", border: "1px solid #ECECEC" }}>
                <span style={{ fontSize: "12px", color: "#6B7280", fontWeight: "600" }}>Total Revenue</span>
                <div style={{ fontSize: "18px", fontWeight: "700", color: "#C8A165", marginTop: "6px" }}>₹{stats.totalRevenue?.toFixed(0)}</div>
              </div>
              <div style={{ background: "#FFFFFF", padding: "16px 20px", borderRadius: "12px", border: "1px solid #ECECEC" }}>
                <span style={{ fontSize: "12px", color: "#6B7280", fontWeight: "600" }}>Active Customers</span>
                <div style={{ fontSize: "18px", fontWeight: "700", color: "#1A1A1A", marginTop: "6px" }}>{stats.totalUsers}</div>
              </div>
              <div style={{ background: "#FFFFFF", padding: "16px 20px", borderRadius: "12px", border: "1px solid #ECECEC" }}>
                <span style={{ fontSize: "12px", color: "#6B7280", fontWeight: "600" }}>Catalogs Catalog</span>
                <div style={{ fontSize: "18px", fontWeight: "700", color: "#1A1A1A", marginTop: "6px" }}>{stats.totalProducts} items</div>
              </div>
              <div style={{ background: "#FFFFFF", padding: "16px 20px", borderRadius: "12px", border: "1px solid #ECECEC" }}>
                <span style={{ fontSize: "12px", color: "#6B7280", fontWeight: "600" }}>Customer Returns</span>
                <div style={{ fontSize: "18px", fontWeight: "700", color: "#DC2626", marginTop: "6px" }}>{stats.ordersReturned} cases</div>
              </div>
            </div>
          </div>
        )}

        {/* LOW STOCK ACTION ALERT PANEL */}
        {stats && stats.lowStockProducts?.length > 0 && (
          <div className="admin-card-container" style={{ borderLeft: "4px solid #DC2626", background: "#FFF5F5", padding: "24px", marginBottom: "32px", borderRadius: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "16px" }}>
              <FiAlertTriangle color="#DC2626" size={24} />
              <h3 style={{ fontSize: "16px", fontWeight: "700", color: "#991B1B" }}>Critical Low Stock Warning</h3>
            </div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
              {stats.lowStockProducts.map(p => (
                <div key={p._id} style={{ display: "flex", flexWrap: "wrap", alignItems: "center", justifyContent: "space-between", background: "#FFFFFF", padding: "12px 18px", borderRadius: "10px", border: "1px solid #FEE2E2", gap: "12px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <img src={p.image} alt={p.name} style={{ width: "40px", height: "40px", borderRadius: "6px", objectFit: "cover" }} />
                    <div>
                      <strong style={{ fontSize: "14px", color: "#1A1A1A" }}>{p.name}</strong>
                      <div style={{ fontSize: "12px", color: "#6B7280" }}>Category: {p.category} | Price: ₹{p.price}</div>
                    </div>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                    <span style={{ background: "#FEE2E2", color: "#991B1B", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" }}>
                      Only {p.stock} units left
                    </span>

                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <input
                        type="number"
                        placeholder="Qty"
                        value={restockValues[p._id] !== undefined ? restockValues[p._id] : ""}
                        onChange={(e) => setRestockValues(prev => ({ ...prev, [p._id]: e.target.value }))}
                        style={{ width: "68px", height: "34px", textAlign: "center", borderRadius: "8px", border: "1px solid #D1D5DB", outline: "none", fontSize: "13px" }}
                      />
                      <button
                        onClick={() => handleQuickRestock(p._id, restockValues[p._id])}
                        style={{ height: "34px", padding: "0 14px", background: "#1A1A1A", color: "#FFFFFF", border: "none", borderRadius: "8px", fontSize: "12.5px", fontWeight: "600", cursor: "pointer" }}
                      >
                        Restock
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* VISUAL ANALYTICS CHARTS GRID */}
        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px", marginBottom: "32px" }}>
            
            {/* Revenue Trend Line */}
            <div className="admin-card-container" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <h4 style={{ fontSize: "16px", fontWeight: "700", color: "#1A1A1A" }}>Monthly Revenue Trend</h4>
                  <p style={{ fontSize: "12px", color: "#6B7280" }}>Sales values over the last 6 calendar periods</p>
                </div>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#C8A165" }}>Line Chart</span>
              </div>
              <div style={{ background: "#FAFAFA", borderRadius: "12px", padding: "16px", display: "flex", justifyContent: "center" }}>
                {renderLineChart(stats.monthlyTrend)}
              </div>
            </div>

            {/* Orders Volume Bar */}
            <div className="admin-card-container" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <h4 style={{ fontSize: "16px", fontWeight: "700", color: "#1A1A1A" }}>Orders Volume</h4>
                  <p style={{ fontSize: "12px", color: "#6B7280" }}>Quantity metrics of placed invoices</p>
                </div>
                <span style={{ fontSize: "12px", fontWeight: "700", color: "#C8A165" }}>Bar Chart</span>
              </div>
              <div style={{ background: "#FAFAFA", borderRadius: "12px", padding: "16px", display: "flex", justifyContent: "center" }}>
                {renderBarChart(stats.monthlyTrend)}
              </div>
            </div>

          </div>
        )}

        {/* BOTTOM METRICS DUAL GRID: RECENT ORDERS & TOP SELLING PRODUCTS */}
        {stats && (
          <div style={{ display: "grid", gridTemplateColumns: "3fr 2fr", gap: "24px", marginBottom: "32px" }}>
            
            {/* Recent Orders List */}
            <div className="admin-card-container" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <h4 style={{ fontSize: "16px", fontWeight: "700", color: "#1A1A1A" }}>Recent Order Actions</h4>
                  <p style={{ fontSize: "12px", color: "#6B7280" }}>Latest order checkout logs</p>
                </div>
                <Link to="/admin/orders" style={{ fontSize: "12.5px", fontWeight: "600", color: "#C8A165", textDecoration: "none" }}>View All</Link>
              </div>

              <div style={{ overflowX: "auto" }}>
                <table style={{ width: "100%", borderCollapse: "collapse", textAlign: "left" }}>
                  <thead>
                    <tr style={{ borderBottom: "1px solid #ECECEC" }}>
                      <th style={{ padding: "12px 8px", fontSize: "12px", color: "#6B7280", fontWeight: "700" }}>ORDER ID</th>
                      <th style={{ padding: "12px 8px", fontSize: "12px", color: "#6B7280", fontWeight: "700" }}>CUSTOMER</th>
                      <th style={{ padding: "12px 8px", fontSize: "12px", color: "#6B7280", fontWeight: "700" }}>AMOUNT</th>
                      <th style={{ padding: "12px 8px", fontSize: "12px", color: "#6B7280", fontWeight: "700", textAlign: "center" }}>STATUS</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentOrders?.map(o => (
                      <tr key={o._id} style={{ borderBottom: "1px solid #F3F4F6" }}>
                        <td style={{ padding: "14px 8px", fontFamily: "monospace", fontWeight: "700" }}>
                          <Link to={`/admin/orders/${o._id}`} style={{ color: "#1A1A1A", textDecoration: "none" }}>
                            #{o._id.slice(-8).toUpperCase()}
                          </Link>
                        </td>
                        <td style={{ padding: "14px 8px", fontSize: "13.5px" }}>{o.customerName}</td>
                        <td style={{ padding: "14px 8px", fontSize: "13.5px", fontWeight: "700", color: "#C8A165" }}>₹{o.totalAmount}</td>
                        <td style={{ padding: "14px 8px", textAlign: "center" }}>
                          <span className={`badge-shipment ${o.status?.toLowerCase().replace(/\s+/g, "")}`} style={{ fontSize: "11px", padding: "3px 8px" }}>
                            {o.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Top Selling Products */}
            <div className="admin-card-container" style={{ padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                <div>
                  <h4 style={{ fontSize: "16px", fontWeight: "700", color: "#1A1A1A" }}>Best Selling Products</h4>
                  <p style={{ fontSize: "12px", color: "#6B7280" }}>Highest revenue generating items</p>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {stats.topProducts?.map(p => (
                  <div key={p.id} style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                      <img src={p.image} alt={p.name} style={{ width: "36px", height: "36px", borderRadius: "6px", objectFit: "cover" }} />
                      <div>
                        <strong style={{ fontSize: "13.5px", color: "#1A1A1A", display: "block" }}>{p.name}</strong>
                        <span style={{ fontSize: "11.5px", color: "#6B7280" }}>{p.unitsSold} units sold</span>
                      </div>
                    </div>
                    <div style={{ textAlign: "right" }}>
                      <strong style={{ fontSize: "13.5px", color: "#C8A165" }}>₹{Math.round(p.revenue)}</strong>
                      <span style={{ display: "block", fontSize: "10.5px", color: p.stockRemaining < 5 ? "#DC2626" : "#6B7280" }}>
                        Stock: {p.stockRemaining}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
};

export default AdminDashboard;
