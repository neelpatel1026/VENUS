import React, { useEffect, useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { LuTruck } from "react-icons/lu";
import axios from "axios";

const TrackOrder = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [activeOrders, setActiveOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    const fetchActiveOrders = async () => {
      try {
        const res = await fetch("/api/orders/myorders", {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        const data = await res.json();
        if (res.ok) {
          // Filter to select active orders (all except Cancelled or Delivered)
          const list = Array.isArray(data) ? data : [];
          const activeList = list.filter(o => !["Cancelled", "Delivered"].includes(o.status));
          
          if (activeList.length === 1) {
            // Redirect directly to details page of this single active order
            navigate(`/order/${activeList[0]._id}`);
            return;
          }
          setActiveOrders(activeList);
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchActiveOrders();
  }, [user, navigate]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ width: "24px", height: "24px", borderRadius: "50%", border: "2px solid #EEE", borderTopColor: "#C8A165", animation: "spin 1s linear infinite" }}></div>
      </div>
    );
  }

  return (
    <div style={{ background: "#FAFAFA", minHeight: "100vh", padding: "20px 16px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {/* Back navigation */}
        <button 
          onClick={() => navigate(-1)} 
          style={{ background: "none", border: "none", color: "#C8A165", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px", padding: 0 }}
        >
          ← Back
        </button>

        <h1 style={{ fontFamily: "Cinzel, serif", fontSize: "22px", margin: "0 0 20px 0", color: "#1A1A1A" }}>Track Orders</h1>

        {activeOrders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "#FFFFFF", borderRadius: "16px", border: "1px solid #ECECEC" }}>
            <span style={{ fontSize: "40px", display: "block", marginBottom: "12px" }}>🚚</span>
            <h3 style={{ fontSize: "16px", margin: "0 0 8px 0", color: "#1A1A1A" }}>No Shipments to Track</h3>
            <p style={{ fontSize: "13px", color: "#6B7280", margin: "0 0 20px 0" }}>You do not have any active shipments in transit.</p>
            <Link to="/shop" style={{ display: "inline-block", background: "#C8A165", color: "#FFFFFF", padding: "10px 24px", borderRadius: "30px", textDecoration: "none", fontSize: "13px", fontWeight: "700" }}>
              Go To Shop
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <h2 style={{ fontSize: "14px", margin: "0 0 10px 0", color: "#6B7280", fontWeight: "600", textTransform: "uppercase", letterSpacing: "0.5px" }}>
              Select Order to Track
            </h2>
            {activeOrders.map(order => (
              <div key={order._id} style={{ background: "#FFFFFF", border: "1px solid #ECECEC", borderRadius: "16px", padding: "16px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: "14px", color: "#1A1A1A", display: "block", marginBottom: "4px" }}>Order ID: #VC{order._id.slice(-6).toUpperCase()}</strong>
                  <span style={{ fontSize: "12px", color: "#6B7280", display: "block", marginBottom: "6px" }}>
                    Placed: {new Date(order.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                  </span>
                  <span style={{
                    fontSize: "10.5px",
                    fontWeight: "700",
                    padding: "2px 8px",
                    borderRadius: "12px",
                    background: "#FFF3E0",
                    color: "#EF6C00"
                  }}>
                    {order.status}
                  </span>
                </div>
                <button
                  onClick={() => navigate(`/order/${order._id}`)}
                  style={{
                    background: "#C8A165",
                    border: "none",
                    color: "#FFFFFF",
                    fontSize: "12.5px",
                    padding: "8px 16px",
                    borderRadius: "20px",
                    fontWeight: "700",
                    cursor: "pointer",
                    boxShadow: "0 2px 8px rgba(200, 161, 101, 0.2)"
                  }}
                >
                  Track Action
                </button>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default TrackOrder;
