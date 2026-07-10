import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [stats, setStats] = useState(null);

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/");
      return;
    }

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
      }
    };

    fetchStats();
  }, [user, navigate]);

  if (!user || user.role !== "admin") return null;

  return (
    <div className="admin-layout-wrapper">
      {/* LEFT COLUMN: SHARED SIDEBAR */}
      <AdminSidebar />

      {/* RIGHT COLUMN: MAIN CONSOLE */}
      <div className="admin-content-console">
        <div className="admin-page-header">
          <div>
            <h2>Venus Care Admin</h2>
            <p>Welcome back, {user.name}. Overview of today's store performance metrics.</p>
          </div>
          <div className="header-actions">
            <Link to="/admin/add-product" className="btn-admin-primary">
              + New Product
            </Link>
          </div>
        </div>

        {/* KPI CARDS */}
        {stats ? (
          <div className="admin-kpis-grid">
            <div className="admin-kpi-card">
              <span className="kpi-title">Total Revenue</span>
              <h3 className="kpi-val gold-text">₹{stats.totalRevenue.toFixed(2)}</h3>
            </div>
            <div className="admin-kpi-card">
              <span className="kpi-title">Total Orders</span>
              <h3 className="kpi-val">{stats.totalOrders}</h3>
            </div>
            <div className="admin-kpi-card">
              <span className="kpi-title">Total Products</span>
              <h3 className="kpi-val">{stats.totalProducts}</h3>
            </div>
            <div className="admin-kpi-card">
              <span className="kpi-title">Active Customers</span>
              <h3 className="kpi-val">{stats.totalUsers}</h3>
            </div>
          </div>
        ) : (
          <div className="admin-kpis-grid">
            <div className="admin-kpi-card">Loading KPI metrics...</div>
          </div>
        )}

        {/* ADMIN CONTROL TRYS */}
        <div className="admin-form-card" style={{ maxWidth: "100%" }}>
          <h3 style={{ marginBottom: "8px", fontWeight: "600", fontSize: "1.1rem" }}>
            Operational Directory
          </h3>
          <p style={{ color: "var(--admin-text-muted)", fontSize: "0.88rem", marginBottom: "24px" }}>
            Quickly jump into inventory editing, customer ticket resolutions, or refund processing.
          </p>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px" }}>
            <Link to="/admin/products" className="btn-admin-secondary" style={{ textAlign: "center" }}>
              📦 Inventory Management
            </Link>
            <Link to="/admin/orders" className="btn-admin-secondary" style={{ textAlign: "center" }}>
              🚚 Customer Order logs
            </Link>
            <Link to="/admin/returns" className="btn-admin-secondary" style={{ textAlign: "center" }}>
              🔄 Return Requests
            </Link>
            <Link to="/admin/complaints" className="btn-admin-secondary" style={{ textAlign: "center" }}>
              💬 Support Tickets
            </Link>
            <Link to="/admin/users" className="btn-admin-secondary" style={{ textAlign: "center" }}>
              👥 User Directory
            </Link>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboard;
