import React, { useEffect, useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useDispatch } from "react-redux";
import { addToCart } from "../redux/cartSlice";
import axios from "axios";
import toast from "react-hot-toast";

const MyOrders = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const dispatch = useDispatch();

  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    const fetchOrders = async () => {
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
          setOrders([]);
        }
      } catch (err) {
        console.error(err);
        setOrders([]);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [user, navigate]);

  const handleReorder = async (items) => {
    if (!items || items.length === 0) return;
    toast.loading("Adding items to cart...");
    for (const item of items) {
      if (item.productId) {
        try {
          const res = await axios.get(`/api/products/${item.productId}`);
          const p = res.data;
          dispatch(
            addToCart({
              _id: item.productId,
              name: item.productName,
              price: item.price,
              image: item.productImage || "/placeholder.jpg",
              stock: p.stock || 10,
              qty: item.qty || 1,
            })
          );
        } catch (e) {
          console.error(e);
        }
      }
    }
    toast.dismiss();
    toast.success("Items added to cart!");
    navigate("/cart");
  };

  const getFilteredOrders = () => {
    if (activeTab === "All") return orders;
    if (activeTab === "Processing") {
      return orders.filter(o => ["Pending", "Processing", "Packed"].includes(o.status));
    }
    return orders.filter(o => o.status === activeTab);
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ width: "24px", height: "24px", borderRadius: "50%", border: "2px solid #EEE", borderTopColor: "#C8A165", animation: "spin 1s linear infinite" }}></div>
      </div>
    );
  }

  const filteredOrders = getFilteredOrders();

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

        <h1 style={{ fontFamily: "Cinzel, serif", fontSize: "22px", margin: "0 0 20px 0", color: "#1A1A1A" }}>My Orders</h1>

        {/* Tab Filters */}
        <div style={{ display: "flex", gap: "8px", overflowX: "auto", paddingBottom: "12px", marginBottom: "20px" }}>
          {["All", "Processing", "Delivered", "Cancelled"].map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                padding: "8px 16px",
                borderRadius: "20px",
                border: "1px solid",
                borderColor: activeTab === tab ? "#C8A165" : "#ECECEC",
                background: activeTab === tab ? "#C8A165" : "#FFFFFF",
                color: activeTab === tab ? "#FFFFFF" : "#6B7280",
                fontSize: "12.5px",
                fontWeight: "600",
                cursor: "pointer",
                whiteSpace: "nowrap",
                transition: "all 0.2s"
              }}
            >
              {tab}
            </button>
          ))}
        </div>

        {filteredOrders.length === 0 ? (
          <div style={{ textAlign: "center", padding: "60px 20px", background: "#FFFFFF", borderRadius: "16px", border: "1px solid #ECECEC" }}>
            <span style={{ fontSize: "40px", display: "block", marginBottom: "12px" }}>📦</span>
            <h3 style={{ fontSize: "16px", margin: "0 0 8px 0", color: "#1A1A1A" }}>No Orders Yet</h3>
            <p style={{ fontSize: "13px", color: "#6B7280", margin: "0 0 20px 0" }}>Start your beauty routine collection today.</p>
            <Link to="/shop" style={{ display: "inline-block", background: "#C8A165", color: "#FFFFFF", padding: "10px 24px", borderRadius: "30px", textDecoration: "none", fontSize: "13px", fontWeight: "700" }}>
              Start Shopping
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {filteredOrders.map(order => (
              <div key={order._id} style={{ background: "#FFFFFF", border: "1px solid #ECECEC", borderRadius: "16px", padding: "16px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px", borderBottom: "1px solid #FAFAFA", paddingBottom: "10px" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "#9CA3AF", textTransform: "uppercase", display: "block" }}>Order ID</span>
                    <strong style={{ fontSize: "13px", color: "#1A1A1A" }}>#VC{order._id.slice(-6).toUpperCase()}</strong>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <span style={{ fontSize: "11px", color: "#9CA3AF", textTransform: "uppercase", display: "block" }}>Status</span>
                    <span style={{
                      fontSize: "11px",
                      fontWeight: "700",
                      padding: "2px 8px",
                      borderRadius: "12px",
                      background: order.status === "Delivered" ? "#E8F5E9" : (order.status === "Cancelled" ? "#FFEBEE" : "#FFF3E0"),
                      color: order.status === "Delivered" ? "#2E7D32" : (order.status === "Cancelled" ? "#C62828" : "#EF6C00"),
                    }}>
                      {order.status}
                    </span>
                  </div>
                </div>

                {order.items?.map((item, idx) => (
                  <div key={idx} style={{ display: "flex", gap: "12px", marginBottom: "12px" }}>
                    <img
                      src={item.productImage || "/cosmetic_1.avif"}
                      alt={item.productName}
                      style={{ width: "50px", height: "50px", objectFit: "contain", border: "1px solid #ECECEC", borderRadius: "8px" }}
                      onError={(e) => { e.target.src = "/cosmetic_1.avif"; }}
                    />
                    <div style={{ flex: 1 }}>
                      <h4 style={{ fontSize: "13px", margin: "0 0 4px 0", color: "#1A1A1A", fontWeight: "600" }}>{item.productName}</h4>
                      <span style={{ fontSize: "11.5px", color: "#6B7280" }}>Qty: {item.qty} • ₹{item.price.toFixed(2)}</span>
                    </div>
                  </div>
                ))}

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid #FAFAFA", paddingTop: "12px", marginTop: "12px" }}>
                  <div>
                    <span style={{ fontSize: "11px", color: "#9CA3AF", textTransform: "uppercase", display: "block" }}>Total Paid</span>
                    <strong style={{ fontSize: "15px", color: "#C8A165" }}>₹{order.totalAmount.toFixed(2)}</strong>
                  </div>
                  <div style={{ display: "flex", gap: "8px" }}>
                    <button
                      onClick={() => navigate(`/order/${order._id}`)}
                      style={{ background: "#FFFFFF", border: "1px solid #ECECEC", color: "#4B5563", fontSize: "12px", padding: "6px 12px", borderRadius: "20px", fontWeight: "600", cursor: "pointer" }}
                    >
                      Details
                    </button>
                    <button
                      onClick={() => handleReorder(order.items)}
                      style={{ background: "#C8A165", border: "none", color: "#FFFFFF", fontSize: "12px", padding: "6px 12px", borderRadius: "20px", fontWeight: "600", cursor: "pointer" }}
                    >
                      Buy Again
                    </button>
                  </div>
                </div>
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

export default MyOrders;
