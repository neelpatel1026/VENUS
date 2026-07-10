import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import AdminSidebar from "./AdminSidebar";

const AdminOrders = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exporting, setExporting] = useState(false);

  const navigate = useNavigate();

  /* ================= FETCH ORDERS ================= */
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

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  /* ================= REFRESH ================= */
  const refreshData = async () => {
    await fetchOrders();
    toast.success("Orders list updated!");
  };

  /* ================= EXPORT TO EXCEL ================= */
  const handleExportExcel = async () => {
    setExporting(true);
    try {
      const params = new URLSearchParams();
      if (searchTerm) params.append("search", searchTerm);
      if (statusFilter) params.append("status", statusFilter);
      if (paymentFilter) params.append("paymentMethod", paymentFilter);
      if (startDate) params.append("startDate", startDate);
      if (endDate) params.append("endDate", endDate);

      const res = await fetch(`/api/orders/export/excel?${params.toString()}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to export orders");
      }

      const blob = await res.blob();
      const fileURL = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = fileURL;

      const d = new Date();
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      link.setAttribute("download", `Orders_${dateStr}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.success("Orders Excel sheet downloaded!");
    } catch (error) {
      console.error(error);
      toast.error("Failed to generate excel file");
    } finally {
      setExporting(false);
    }
  };

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
            order._id === id ? { ...order, status } : order
          )
        );
        toast.success(`Order status updated to ${status}`);
      } else {
        toast.error("Failed to update status");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error updating status");
    }
  };

  // Client-side filtering to match table view with query parameters
  const filteredOrders = orders.filter((order) => {
    const matchesSearch =
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.user && order.user.name.toLowerCase().includes(searchTerm.toLowerCase())) ||
      order.customerName.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === "" || order.status === statusFilter;
    const matchesPayment = paymentFilter === "" || order.paymentMethod === paymentFilter;

    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && new Date(order.createdAt) >= new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(order.createdAt) <= end;
    }

    return matchesSearch && matchesStatus && matchesPayment && matchesDate;
  });

  return (
    <div className="admin-layout-wrapper">
      {/* LEFT COLUMN: SIDEBAR */}
      <AdminSidebar />

      {/* RIGHT COLUMN: MAIN CONTENT */}
      <div className="admin-content-console">
        <div className="admin-page-header">
          <div>
            <h2>Manage Orders</h2>
            <p>Track shipment statuses, payments, and invoice downloads.</p>
          </div>
        </div>

        {/* ORDERS TABLE CONTAINER */}
        <div className="admin-table-container">
          
          {/* SEARCH & FILTERS TOOLBAR */}
          <div className="admin-table-search-bar" style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "20px 24px" }}>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "12px", width: "100%" }}>
              <input
                type="text"
                placeholder="Search by ID or customer..."
                className="admin-search-input"
                style={{ flex: "1", minWidth: "200px" }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="admin-form-input"
                style={{ minWidth: "140px", padding: "8px 12px" }}
              >
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Shipped">Shipped</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Returned">Returned</option>
              </select>

              <select
                value={paymentFilter}
                onChange={(e) => setPaymentFilter(e.target.value)}
                className="admin-form-input"
                style={{ minWidth: "140px", padding: "8px 12px" }}
              >
                <option value="">All Payments</option>
                <option value="COD">Cash On Delivery (COD)</option>
                <option value="Razorpay">Online (Razorpay)</option>
              </select>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "12px", width: "100%", borderTop: "1px solid var(--admin-border)", paddingTop: "14px" }}>
              <div style={{ display: "flex", flexWrap: "wrap", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "0.8rem", fontWeight: "600", color: "var(--admin-text-muted)" }}>Date Range:</span>
                <input
                  type="date"
                  className="admin-form-input"
                  style={{ padding: "6px 10px", fontSize: "0.85rem" }}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                />
                <span style={{ color: "var(--admin-text-muted)" }}>to</span>
                <input
                  type="date"
                  className="admin-form-input"
                  style={{ padding: "6px 10px", fontSize: "0.85rem" }}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                />
                
                <button onClick={refreshData} className="btn-admin-outline" style={{ padding: "6px 12px", fontSize: "0.8rem" }}>
                  🔄 Refresh
                </button>
              </div>

              {/* EXCEL EXPORT BUTTON */}
              <div>
                <button
                  onClick={handleExportExcel}
                  className="btn-admin-primary"
                  disabled={exporting}
                  style={{ display: "flex", alignItems: "center", gap: "8px" }}
                >
                  🟢 Export Orders (.xlsx) {exporting && "..."}
                </button>
              </div>
            </div>
          </div>

          <table className="admin-premium-table">
            <thead>
              <tr>
                <th>Order ID</th>
                <th>Customer</th>
                <th>Total Price</th>
                <th>Order Date</th>
                <th>Status Badge</th>
                <th>Change Status</th>
                <th>Details</th>
              </tr>
            </thead>
            <tbody>
              {filteredOrders.map((order) => {
                const orderDate = new Date(order.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });
                return (
                  <tr key={order._id}>
                    <td>
                      <strong style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>
                        #{order._id.slice(-8).toUpperCase()}
                      </strong>
                    </td>
                    <td>
                      <div>
                        <strong style={{ fontWeight: "600" }}>{order.user ? order.user.name : "Guest User"}</strong>
                        <div style={{ fontSize: "0.75rem", color: "var(--admin-text-muted)" }}>
                          {order.user ? order.user.email : ""}
                        </div>
                      </div>
                    </td>
                    <td>
                      <strong className="amount-gold">₹{order.totalAmount.toFixed(2)}</strong>
                    </td>
                    <td>{orderDate}</td>
                    <td>
                      <span className={`status-pill pill-${order.status.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </td>
                    <td>
                      <select
                        value={order.status}
                        onChange={(e) => updateStatus(order._id, e.target.value)}
                        className="admin-form-input"
                        style={{ padding: "6px 12px", fontSize: "0.8rem", width: "auto", minWidth: "120px" }}
                      >
                        <option value="Pending">Pending</option>
                        <option value="Confirmed">Confirmed</option>
                        <option value="Preparing">Preparing</option>
                        <option value="Packed">Packed</option>
                        <option value="Shipped">Shipped</option>
                        <option value="Out For Delivery">Out For Delivery</option>
                        <option value="Delivered">Delivered</option>
                        <option value="Cancelled">Cancelled</option>
                        <option value="Returned">Returned</option>
                      </select>
                    </td>
                    <td>
                      <button
                        onClick={() => navigate(`/admin/orders/${order._id}`)}
                        className="btn-admin-outline"
                      >
                        View Details
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {filteredOrders.length === 0 && (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--admin-text-muted)" }}>
              No orders found matching filters.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminOrders;
