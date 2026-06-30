import React, { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";

const AdminOrders = () => {
  const { user } = useContext(AuthContext);

  const [orders, setOrders] = useState([]);
  const navigate = useNavigate();
  /* ================= FETCH ORDERS ================= */

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const res = await fetch("/api/orders", {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        const data = await res.json();

        setOrders(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
      }
    };

    fetchOrders();
  }, [user]);

  /* ================= UPDATE STATUS ================= */

  const updateStatus = async (id, status) => {
    try {
      const res = await fetch(`/api/orders/${id}/status`, {
        method: "PUT",

        headers: {
          "Content-Type": "application/json",

          Authorization: `Bearer ${user.token}`,
        },

        body: JSON.stringify({ status }),
      });

      if (res.ok) {
        setOrders(
          orders.map((order) =>
            order._id === id ? { ...order, status } : order,
          ),
        );
      }
    } catch (error) {
      console.error(error);
    }
  };
  const exportExcel = async () => {
    try {
      const response = await fetch("/api/orders/export/excel", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      const blob = await response.blob();

      const url = window.URL.createObjectURL(blob);

      const link = document.createElement("a");

      link.href = url;

      link.download = "orders.xlsx";

      document.body.appendChild(link);

      link.click();

      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
    }
  };

  /* ================= UI ================= */

  return (
    <div style={containerStyle}>

      <div style={headerStyle}>
        <div style={headerTopStyle}>
          <div>
            <h2 style={headingStyle}>Manage Orders</h2>

            <p style={subHeadingStyle}>Track and update customer orders</p>
          </div>

          <button onClick={exportExcel} style={exportBtnStyle}>
            📊 Export Excel
          </button>
        </div>
      </div>

      {/* MOBILE CARDS */}

      <div style={mobileWrapperStyle}>
        {orders.map((order) => (
          <div key={order._id} style={mobileCardStyle}>
            <div style={mobileRowStyle}>
              <span style={labelStyle}>Order ID</span>

              <span style={valueStyle}>{order._id.substring(0, 8)}...</span>
            </div>

            <div style={mobileRowStyle}>
              <span style={labelStyle}>User</span>

              <span style={valueStyle}>
                {order.userId?.name || "Deleted User"}
              </span>
            </div>

            <div style={mobileRowStyle}>
              <span style={labelStyle}>Total</span>

              <span style={priceStyle}>₹{order.totalAmount.toFixed(2)}</span>
            </div>

            <div style={mobileRowStyle}>
              <span style={labelStyle}>Date</span>

              <span style={valueStyle}>
                {new Date(order.createdAt).toLocaleDateString()}
              </span>
            </div>

            <div style={mobileRowStyle}>
              <span style={labelStyle}>Status</span>

              <select
                value={order.status}
                onChange={(e) => updateStatus(order._id, e.target.value)}
                style={selectStyle}
              >
                <option value="Pending">Pending</option>

                <option value="Shipped">Shipped</option>

                <option value="Delivered">Delivered</option>
              </select>
            </div>
            <button
              onClick={() => navigate(`/admin/orders/${order._id}`)}
              style={mobileViewBtnStyle}
            >
              View Details
            </button>
          </div>
        ))}
      </div>

      {/* DESKTOP TABLE */}

      <div style={tableWrapperStyle}>
        <table style={tableStyle}>
          <thead>
            <tr style={rowStyle}>
              <th style={thStyle}>ACTION</th>

              <th style={thStyle}>ORDER ID</th>

              <th style={thStyle}>USER</th>

              <th style={thStyle}>TOTAL</th>

              <th style={thStyle}>DATE</th>

              <th style={thStyle}>STATUS</th>
            </tr>
          </thead>

          <tbody>
            {orders.map((order) => (
              <tr key={order._id} style={rowStyle}>
                <td style={tdStyle}>
                  <button
                    onClick={() => navigate(`/admin/orders/${order._id}`)}
                    style={{
                      background: "#C8A96B",
                      color: "#fff",
                      border: "none",
                      padding: "8px 14px",
                      borderRadius: "8px",
                      cursor: "pointer",
                      fontWeight: "600",
                    }}
                  >
                    View Details
                  </button>
                </td>
                <td style={tdStyle}>{order._id.slice(-8)}</td>
                <td style={tdStyle}>{order.userId?.name || "Deleted User"}</td>

                <td style={priceCellStyle}>₹{order.totalAmount.toFixed(2)}</td>

                <td style={tdStyle}>
                  {new Date(order.createdAt).toLocaleDateString()}
                </td>

                <td style={tdStyle}>
                  <select
                    value={order.status}
                    onChange={(e) => updateStatus(order._id, e.target.value)}
                    style={selectStyle}
                  >
                    <option
                      value="Pending"
                      style={{ color: "#1F2937", background: "#FFFFFF" }}
                    >
                      Pending
                    </option>

                    <option
                      value="Shipped"
                      style={{ color: "#1F2937", background: "#FFFFFF" }}
                    >
                      Shipped
                    </option>

                    <option
                      value="Delivered"
                      style={{ color: "#1F2937", background: "#FFFFFF" }}
                    >
                      Delivered
                    </option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

/* ================= STYLES ================= */

const containerStyle = {
  maxWidth: "1200px",
  margin: "40px auto",
  padding: "30px",
  // background: '#18181b',
  background: "#FFFFFF",
  borderRadius: "18px",
  border: "1px solid rgba(255,255,255,0.05)",
  // color: '#fafafa',
  color: "#1F2937",
  boxShadow: "0 10px 40px rgba(0,0,0,0.3)",
};

const headerStyle = {
  marginBottom: "30px",
};
const headerTopStyle = {
  display: "flex",
  justifyContent: "space-between",
  alignItems: "center",
  gap: "20px",
  flexWrap: "wrap",
};

const exportBtnStyle = {
  background: "#C8A96B",
  color: "#fff",
  border: "none",
  padding: "12px 20px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "14px",
  display: "flex",
  alignItems: "center",
  gap: "8px",
  boxShadow: "0 4px 12px rgba(200,169,107,0.25)",
};

const headingStyle = {
  color: "#C8A96B",

  marginBottom: "10px",
};

const subHeadingStyle = {
  // color: '#6B7280'
  color: "#6B7280",
};

const tableWrapperStyle = {
  overflowX: "auto",
};

const tableStyle = {
  width: "100%",

  borderCollapse: "collapse",

  minWidth: "700px",
};

const rowStyle = {
  borderBottom: "1px solid #ECE6DC",
};

const thStyle = {
  padding: "18px 15px",

  textAlign: "left",

  color: "#8B7355",
  fontSize: "0.9rem",

  fontWeight: "600",
};
const tdStyle = {
  padding: "18px 15px",
  color: "#1F2937",
  fontWeight: "500",
};

const priceCellStyle = {
  ...tdStyle,
  color: "#C8A96B",
  fontWeight: "700",
};

const mobileViewBtnStyle = {
  width: "100%",
  marginTop: "12px",
  background: "#C8A96B",
  color: "#fff",
  border: "none",
  padding: "12px",
  borderRadius: "10px",
  cursor: "pointer",
  fontWeight: "600",
  fontSize: "14px",
};

const selectStyle = {
  background: "#FFFFFF",
  color: "#1F2937",
  padding: "10px 12px",
  border: "1px solid #D6D6D6",
  borderRadius: "10px",
  outline: "none",
  cursor: "pointer",
  fontWeight: "600",
};
/* ================= MOBILE ================= */

const mobileWrapperStyle = {
  display: "none",

  flexDirection: "column",

  gap: "18px",

  marginBottom: "20px",
};

const mobileCardStyle = {
  background: "#FFFFFF",
  border: "1px solid #ECE6DC",
  borderRadius: "14px",
  padding: "18px",
};

const mobileRowStyle = {
  display: "flex",

  justifyContent: "space-between",

  alignItems: "center",

  gap: "15px",

  marginBottom: "14px",

  flexWrap: "wrap",
};

const labelStyle = {
  color: "#a1a1aa",

  fontSize: "14px",
};

const valueStyle = {
  color: "#1F2937",
  fontWeight: "600",
};

const priceStyle = {
  color: "#f97316",

  fontWeight: "700",
};

export default AdminOrders;
