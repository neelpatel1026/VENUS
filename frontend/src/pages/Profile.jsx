import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate, Link } from "react-router-dom";
import "../styles/Profile.css";

const Profile = () => {
  const { user, logout } = useContext(AuthContext);
  const navigate = useNavigate();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);

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

  const handleLogout = () => {
    logout();
    navigate("/login");
  };

  const containerStyle = {
    maxWidth: "1000px",
    margin: "40px auto",
    padding: "30px",
    background: "#FAF7F2",
    borderRadius: "20px",
    border: "1px solid #E8DFD2",
    color: "#222222",
    boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
  };

  const badgeStyle = {
    background: "#F5E6C8",
    color: "#8B6B3D",
    padding: "8px 16px",
    borderRadius: "30px",
    fontSize: "0.9rem",
    fontWeight: "600",
    display: "inline-block",
  };

  const adminCardStyle = {
    background: "#FFFFFF",
    padding: "25px",
    borderRadius: "18px",
    border: "1px solid #E8DFD2",
    boxShadow: "0 4px 15px rgba(0,0,0,.05)",
    cursor: "pointer",
    transition: "all 0.3s ease",
  };

  if (!user) return null;

  return (
    <div style={containerStyle}>
      {/* Profile Header */}
      <div
        style={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "flex-start",
          borderBottom: "1px solid #E8DFD2",
          paddingBottom: "30px",
          marginBottom: "30px",
          flexWrap: "wrap",
          gap: "20px",
        }}
      >
        <div>
          <h2>Welcome Back, {user.name} 👋</h2>

          <p
            style={{
              color: "#777",
              marginTop: "8px",
            }}
          >
            Manage your account, orders and addresses.
          </p>

          {/* Profile Stats */}

          <div
            style={{
              background: "#fff",
              padding: "25px",
              borderRadius: "18px",
              border: "1px solid #E8DFD2",
              marginTop: "20px",
            }}
          >
            <h3 style={{ marginBottom: "20px" }}>Personal Information</h3>

            <div className="hero-profile-grid">
              <div className="profile-card account-card">
                <h3>👤 Account Information</h3>

                <div className="profile-details">
                  <div>
                    <span>Name</span>
                    <h4>{user.name}</h4>
                  </div>

                  <div>
                    <span>Email</span>
                    <h4>{user.email}</h4>
                  </div>

                  <div>
                    <span>Phone</span>
                    <h4>{orders[0]?.customerPhone || "Not Added"}</h4>
                  </div>

                  <div>
                    <span>Address</span>
                    <h4>{orders[0]?.shippingAddress?.city || "Not Added"}</h4>
                  </div>
                </div>

                {/* <button className="edit-btn">Edit Profile</button> */}
                <button
                  className="edit-btn"
                  onClick={() => navigate("/edit-profile")}
                >
                  Edit Profile
                </button>
              </div>

              {orders.length > 0 && (
                <div className="profile-card latest-order-card">
                  <h3>📦 Latest Order</h3>

                  <div className="latest-order-content">
                    <h2>#{orders[0]._id.slice(-8)}</h2>

                    <h1>₹{orders[0].totalAmount}</h1>

                    <span className="status-badge status-delivered">
                      {orders[0].status}
                    </span>

                    <Link
                      to={`/order/${orders[0]._id}`}
                      className="view-order-btn"
                    >
                      View Details
                    </Link>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleLogout}
            className="btn"
            style={{
              background: "#222",
              color: "#fff",
              borderRadius: "50px",
              padding: "12px 25px",
            }}
          >
            Logout
          </button>
        </div>

        {/* Welcome / Admin Card */}
      </div>

      {/* Admin Quick Access */}
      {user?.role === "admin" && (
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "repeat(auto-fit,minmax(220px,1fr))",
            gap: "20px",
            marginBottom: "30px",
          }}
        >
          <div
            // style={adminCardStyle}
            className="admin-card"
            onClick={() => navigate("/admin")}
          >
            <h3>📊 Dashboard</h3>
            <p>View Analytics</p>
          </div>

          <div
            // style={adminCardStyle}
            className="admin-card"
            onClick={() => navigate("/admin/orders")}
          >
            <h3>🛒 Orders</h3>
            <p>Manage Orders</p>
          </div>

          <div
            // style={adminCardStyle}
            className="admin-card"
            onClick={() => navigate("/admin/products")}
          >
            <h3>📦 Products</h3>
            <p>Manage Products</p>
          </div>

          <div
            // style={adminCardStyle}
            className="admin-card"
            onClick={() => navigate("/admin/users")}
          >
            <h3>👥 Users</h3>
            <p>Manage Users</p>
          </div>
        </div>
      )}

      {/* <div className="profile-admin-grid">
        <div className="admin-card">
          <h3>❤️ Wishlist</h3>
          <p>0 Saved Products</p>
        </div>
        <div className="admin-card" onClick={() => navigate("/my-returns")}>
          <h3>↩️ Returns</h3>
          <p>Track return requests</p>
        </div>

        <Link
          to="/my-addresses"
          style={{
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <div className="admin-card">
            <h3>📍 My Addresses</h3>
            <p>Manage saved delivery addresses</p>
          </div>
        </Link>
      </div> */}
      <div className="profile-admin-grid">
        <div className="admin-card">
          <h3>❤️ Wishlist</h3>
          <p>0 Saved Products</p>
        </div>

        <div className="admin-card" onClick={() => navigate("/my-returns")}>
          <h3>↩️ Returns</h3>
          <p>Track return requests</p>
        </div>

        <Link
          to="/wallet"
          style={{
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <div className="admin-card">
            <h3>💰 My Wallet</h3>
            <p>View wallet balance & refunds</p>
          </div>
        </Link>

        <Link
          to="/my-addresses"
          style={{
            textDecoration: "none",
            color: "inherit",
          }}
        >
          <div className="admin-card">
            <h3>📍 My Addresses</h3>
            <p>Manage saved delivery addresses</p>
          </div>
        </Link>
      </div>

      {/* User Order History Only */}
      {user?.role !== "admin" && (
        <>
          <div
            style={{
              display: "grid",
              // gridTemplateColumns: "repeat(3,1fr)",
              gridTemplateColumns: "repeat(4,1fr)",
              gap: "20px",
              marginBottom: "30px",
            }}
          >
            <div className="admin-card">
              <h2>
                {orders.filter((o) => o.paymentStatus === "Refunded").length}
              </h2>

              <p>Refunded Orders</p>
            </div>
            <div className="admin-card">
              <h2>{orders.length}</h2>
              <p>Total Orders</p>
            </div>

            <div className="admin-card">
              <h3>{orders.filter((o) => o.status === "Pending").length}</h3>
              <p>Pending Orders</p>
            </div>

            <div className="admin-card">
              <h2>{orders.filter((o) => o.status === "Delivered").length}</h2>
              <p>Delivered Orders</p>
            </div>
          </div>
          <div className="admin-card">
            <h2>
              {orders.filter((o) => o.paymentStatus === "Refunded").length}
            </h2>

            <p>Refunded Orders</p>
          </div>

          <h3
            style={{
              color: "#C8A165",
              marginBottom: "20px",
              fontSize: "1.6rem",
              fontWeight: "700",
            }}
          >
            Order History
          </h3>

          {loading ? (
            <p style={{ color: "#666" }}>Fetching your orders...</p>
          ) : orders.length === 0 ? (
            <div
              style={{
                background: "#FFFFFF",
                padding: "30px",
                borderRadius: "18px",
                textAlign: "center",
                border: "1px solid #E8DFD2",
                boxShadow: "0 4px 15px rgba(0,0,0,0.04)",
              }}
            >
              <p style={{ color: "#666", marginBottom: "15px" }}>
                You haven't placed any orders yet.
              </p>

              <Link to="/shop" className="btn">
                Start Shopping
              </Link>
            </div>
          ) : (
            <div
              style={{
                display: "grid",
                gap: "20px",
              }}
            >
              {orders.map((order) => (
                <div
                  key={order._id}
                  style={{
                    background: "#FFFFFF",
                    padding: "20px",
                    borderRadius: "18px",
                    border: "1px solid #E8DFD2",
                    // display: "flex",
                    // flexWrap: "wrap",
                    display: "grid",
                    gridTemplateColumns: "2fr auto",
                    alignItems: "center",
                    justifyContent: "space-between",
                    // alignItems: "center",
                    gap: "20px",
                    boxShadow: "0 6px 20px rgba(0,0,0,0.05)",
                  }}
                >
                  <div>
                    <p
                      style={{
                        color: "#666",
                        fontSize: "0.9rem",
                        marginBottom: "5px",
                      }}
                    >
                      Order #
                      <span
                        style={{
                          color: "#222",
                          fontWeight: "700",
                          marginLeft: "5px",
                        }}
                      >
                        {order._id.slice(-8)}
                      </span>
                    </p>

                    <p
                      style={{
                        color: "#666",
                        fontSize: "0.9rem",
                        marginBottom: "5px",
                      }}
                    >
                      Placed On:
                      <span
                        style={{
                          color: "#222",
                          fontWeight: "600",
                          marginLeft: "5px",
                        }}
                      >
                        {new Date(order.createdAt).toLocaleDateString()}
                      </span>
                    </p>

                    <p
                      style={{
                        color: "#666",
                        fontSize: "0.9rem",
                      }}
                    >
                      Total:
                      <strong
                        style={{
                          color: "#C8A165",
                          marginLeft: "5px",
                        }}
                      >
                        ₹{order.totalAmount.toFixed(2)}
                      </strong>
                    </p>
                    <p
                      style={{
                        color: "#666",
                        fontSize: "0.9rem",
                        marginTop: "5px",
                      }}
                    >
                      Items:
                      <strong
                        style={{
                          marginLeft: "5px",
                          color: "#222",
                        }}
                      >
                        {order.items?.length || 0}
                      </strong>
                    </p>
                  </div>

                  <div
                    style={{
                      display: "flex",
                      gap: "10px",
                      alignItems: "center",
                    }}
                  >
                    <span
                      style={{
                        background:
                          order.status === "Delivered"
                            ? "#E7F8EE"
                            : order.status === "Shipped"
                              ? "#E8F0FE"
                              : "#FFF4E5",

                        color:
                          order.status === "Delivered"
                            ? "#16A34A"
                            : order.status === "Shipped"
                              ? "#2563EB"
                              : "#D97706",

                        padding: "10px 18px",
                        borderRadius: "30px",
                        fontWeight: "600",
                        fontSize: "14px",
                      }}
                    >
                      {order.status}
                    </span>

                    <Link
                      to={`/order/${order._id}`}
                      style={{
                        background: "#C8A165",
                        color: "#fff",
                        padding: "10px 18px",
                        borderRadius: "30px",
                        textDecoration: "none",
                        fontWeight: "600",
                      }}
                    >
                      View Details
                    </Link>

                    <button
                      style={{
                        background: "#222",
                        color: "#fff",
                        border: "none",
                        padding: "10px 18px",
                        borderRadius: "30px",
                        cursor: "pointer",
                      }}
                    >
                      Reorder
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default Profile;
