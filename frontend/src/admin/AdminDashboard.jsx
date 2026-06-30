import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const AdminDashboard = () => {
  const { user } = useContext(AuthContext);

  const navigate = useNavigate();

  const [stats, setStats] = useState(null);

  /* ================= FETCH DATA ================= */

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

  /* ================= STYLES ================= */

  const containerStyle = {
    padding: "20px",

    maxWidth: "1200px",

    margin: "0 auto",
  };

  const topSectionStyle = {
    display: "flex",

    alignItems: "center",

    gap: "15px",

    marginBottom: "10px",

    flexWrap: "wrap",
  };

  const logoStyle = {
    height: "42px",

    width: "42px",

    borderRadius: "10px",

    objectFit: "cover",

    filter: "drop-shadow(0 0px 10px rgba(249,115,22,0.3))",
  };

  const subtitleStyle = {
    fontSize: "1rem",
    color: "#6B7280",
    marginBottom: "40px",
    lineHeight: "1.8",
  };

  const statsGridStyle = {
    display: "grid",

    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",

    gap: "20px",
  };

  const cardStyle = {
    padding: "30px",

    background: "#FFFFFF",

    border: "1px solid #ECE6DC",

    borderRadius: "24px",

    boxShadow: "0 15px 35px rgba(0,0,0,.06)",

    textAlign: "center",

    display: "flex",

    flexDirection: "column",

    justifyContent: "center",

    gap: "12px",

    transition: "0.3s ease",
  };

  const headingStyle = {
    color: "#6B7280",
    fontSize: "14px",
    textTransform: "uppercase",
    letterSpacing: "1px",
  };

  const numberStyle = {
    fontSize: "2.8rem",

    fontWeight: "700",

    color: "#C8A96B",
  };

  const controlBoxStyle = {
    marginTop: "50px",

    padding: "40px",

    background: "#FFFFFF",

    border: "1px solid #ECE6DC",

    borderRadius: "28px",

    boxShadow: "0 15px 35px rgba(0,0,0,.06)",
  };

  const buttonContainerStyle = {
    display: "grid",

    gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))",

    gap: "18px",

    marginTop: "25px",
  };

  const secondaryButtonStyle = {
    background: "#27272a",
  };

  /* ================= UI ================= */

  return (
    <div style={containerStyle}>
      {/* HEADER */}

      <div style={topSectionStyle}>
        <img src="/ShopNestLogo.png" alt="Logo" style={logoStyle} />

        {/* <h2 style={{ margin: 0 }}>
          Admin Dashboard
        </h2> */}

        <div>
          <span
            style={{
              color: "#C8A96B",
              letterSpacing: "3px",
              fontSize: "12px",
              textTransform: "uppercase",
            }}
          >
            ShopNest Admin
          </span>

          <h2 style={{ margin: 0 }}>Admin Dashboard</h2>
        </div>
      </div>

      <p style={subtitleStyle}>
        Welcome back,
        <span style={{ color: "#1F2937" }}> {user?.name}</span>
      </p>

      {/* STATS */}

      {stats ? (
        <div style={statsGridStyle}>
          <div style={cardStyle}>
            <h4 style={headingStyle}>Total Orders</h4>

            <div style={numberStyle}>{stats.totalOrders}</div>
          </div>

          <div style={cardStyle}>
            <h4 style={headingStyle}>Total Products</h4>

            <div style={numberStyle}>{stats.totalProducts}</div>
          </div>

          <div style={cardStyle}>
            <h4 style={headingStyle}>Total Users</h4>

            <div style={numberStyle}>{stats.totalUsers}</div>
          </div>

          <div style={cardStyle}>
            <h4 style={headingStyle}>Total Revenue</h4>

            <div style={numberStyle}>₹{stats.totalRevenue.toFixed(2)}</div>
          </div>
        </div>
      ) : (
        <div
          style={{
            textAlign: "center",
            margin: "60px 0",
            color: "#f97316",
            fontSize: "1.1rem",
          }}
        >
          Loading metrics...
        </div>
      )}

      {/* CONTROLS */}

      <div style={controlBoxStyle}>
        <h3
          style={{
            marginBottom: "10px",
            color: "#1F2937",
          }}
        >
          Administrative Controls
        </h3>

        <p
          style={{
            color: "#6B7280",
            marginBottom: "25px",
          }}
        >
          Manage your products, orders, users and store data.
        </p>

        <div style={buttonContainerStyle}>
          <button
            className="btn"
            onClick={() => navigate("/admin/add-product")}
          >
            + Add Product
          </button>

          <button
            className="btn"
            style={secondaryButtonStyle}
            onClick={() => navigate("/admin/products")}
          >
            📦 Manage Products
          </button>

          <button
            className="btn"
            style={secondaryButtonStyle}
            onClick={() => navigate("/admin/orders")}
          >
            🚚 Manage Orders
          </button>

          <button
            className="btn"
            style={secondaryButtonStyle}
            onClick={() => navigate("/admin/users")}
          >
            👥 Users Directory
          </button>
          <button
            className="btn"
            style={secondaryButtonStyle}
            onClick={() => navigate("/admin/returns")}
          >
            ↩️ Return Requests
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;
