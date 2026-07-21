import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import { useNavigate, Link } from "react-router-dom";
import toast from "react-hot-toast";
import AdminSidebar from "./AdminSidebar";
import { 
  LuSearch, 
  LuFilter, 
  LuRefreshCw, 
  LuDownload, 
  LuEye, 
  LuCalendar, 
  LuPackage, 
  LuDollarSign, 
  LuTruck 
} from "react-icons/lu";

import axios from "axios";

const AdminOrders = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [exporting, setExporting] = useState(false);

  const [selectedIds, setSelectedIds] = useState([]);
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const navigate = useNavigate();

  const handleSelectRow = (id) => {
    setSelectedIds(prev =>
      prev.includes(id) ? prev.filter(item => item !== id) : [...prev, id]
    );
  };

  const handleSelectAll = (filteredList) => {
    const ids = filteredList.map(o => o._id);
    const allSelected = ids.every(id => selectedIds.includes(id));
    if (allSelected) {
      setSelectedIds(prev => prev.filter(id => !ids.includes(id)));
    } else {
      setSelectedIds(prev => [...new Set([...prev, ...ids])]);
    }
  };

  const handleBulkStatusUpdate = async (status) => {
    const confirm = window.confirm(`Are you sure you want to update the status of ${selectedIds.length} orders to ${status}?`);
    if (!confirm) return;
    toast.loading(`Updating status of ${selectedIds.length} orders...`);
    try {
      const res = await axios.put("/api/orders/bulk-status", {
        orderIds: selectedIds,
        status,
      }, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      toast.dismiss();
      if (res.data.success) {
        toast.success(`Updated ${res.data.updatedCount || selectedIds.length} orders to ${status}!`);
        setSelectedIds([]);
        fetchOrders();
      } else {
        toast.error(res.data.message || "Failed to update orders");
      }
    } catch (err) {
      toast.dismiss();
      toast.error(err.response?.data?.message || "Failed to update orders");
    }
  };

  const handleBulkDelete = async () => {
    const confirm = window.confirm(`WARNING: Are you sure you want to permanently DELETE ${selectedIds.length} orders? This cannot be undone.`);
    if (!confirm) return;
    toast.loading(`Deleting ${selectedIds.length} orders...`);
    try {
      await Promise.all(
        selectedIds.map(id =>
          axios.delete(`/api/orders/${id}`, {
            headers: { Authorization: `Bearer ${user.token}` }
          })
        )
      );
      toast.dismiss();
      toast.success("Bulk deletion completed!");
      setSelectedIds([]);
      fetchOrders();
    } catch (err) {
      toast.dismiss();
      toast.error("Failed to delete some orders");
    }
  };

  const handleBulkEmail = async () => {
    const confirm = window.confirm(`Send automated order tracking emails to ${selectedIds.length} customers?`);
    if (!confirm) return;
    toast.loading("Sending automated updates...");
    try {
      await Promise.all(
        selectedIds.map(id =>
          axios.post(`/api/orders/${id}/resend-email`, {}, {
            headers: { Authorization: `Bearer ${user.token}` }
          })
        )
      );
      toast.dismiss();
      toast.success("Bulk emails dispatched!");
      setSelectedIds([]);
    } catch (err) {
      toast.dismiss();
      toast.error("Failed to email some customers");
    }
  };

  const handleBulkPrintInvoices = async () => {
    const confirm = window.confirm(`Download PDF invoices for ${selectedIds.length} orders in parallel?`);
    if (!confirm) return;
    for (const id of selectedIds) {
      await downloadInvoice(id);
    }
    setSelectedIds([]);
  };

  const handleSort = (field) => {
    const isAsc = sortField === field && sortDirection === "asc";
    setSortDirection(isAsc ? "desc" : "asc");
    setSortField(field);
  };

  /* ================= FETCH ORDERS ================= */
  const fetchOrders = async () => {
    setLoading(true);
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
    } finally {
      setLoading(false);
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

  /* ================= DOWNLOAD INVOICE ================= */
  const downloadInvoice = async (orderId) => {
    try {
      toast.loading("Generating secure invoice...");
      const res = await fetch(`/api/orders/${orderId}/invoice`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (!res.ok) {
        throw new Error("Failed to download invoice");
      }

      const blob = await res.blob();
      const fileURL = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = fileURL;
      link.setAttribute("download", `Invoice-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.dismiss();
      toast.success("Invoice PDF downloaded successfully!");
    } catch (error) {
      toast.dismiss();
      console.error(error);
      toast.error("Failed to download invoice PDF");
    }
  };

  /* ================= UPDATE STATUS ================= */
  const updateStatus = async (id, status) => {
    try {
      const res = await axios.put(
        `/api/orders/${id}/status`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (res.data.success) {
        setOrders(
          orders.map((order) =>
            order._id === id ? { ...order, status } : order
          )
        );
        toast.success(`Order status updated to ${status}`);
      } else {
        toast.error(res.data.message || "Failed to update status");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  // Client-side filtering including customer name, email, phone, and product name
  const filteredOrders = orders.filter((order) => {
    const customerName = order.customerName || (order.userId && order.userId.name) || "Guest User";
    const customerEmail = order.customerEmail || (order.userId && order.userId.email) || "";
    const customerPhone = order.customerPhone || (order.userId && order.userId.phone) || "";
    
    const matchesSearch =
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerPhone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items?.some(item => item.productName?.toLowerCase().includes(searchTerm.toLowerCase()));

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

  const sortedOrders = [...filteredOrders].sort((a, b) => {
    let aVal = a[sortField];
    let bVal = b[sortField];

    if (sortField === "customerName") {
      aVal = a.customerName || (a.userId && a.userId.name) || "";
      bVal = b.customerName || (b.userId && b.userId.name) || "";
    }

    if (typeof aVal === "string") {
      return sortDirection === "asc"
        ? aVal.localeCompare(bVal)
        : bVal.localeCompare(aVal);
    } else {
      return sortDirection === "asc"
        ? aVal - bVal
        : bVal - aVal;
    }
  });

  const totalPages = Math.ceil(sortedOrders.length / itemsPerPage);
  const paginatedOrders = sortedOrders.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  return (
    <div className="admin-layout-wrapper">
      {/* LEFT COLUMN: SIDEBAR */}
      <AdminSidebar />

      {/* RIGHT COLUMN: MAIN CONTENT */}
      <div className="admin-content-console" style={{ background: "#F8F8F8" }}>
        
        <div className="admin-page-header" style={{ marginBottom: "32px" }}>
          <div>
            <h2 style={{ fontSize: "30px", fontWeight: "700", color: "#1A1A1A", fontFamily: "'Cinzel', 'Didot', serif" }}>
              Order Management
            </h2>
            <p style={{ color: "#6B7280", fontSize: "14px", marginTop: "4px" }}>
              Redesign shipment states, process bulk export archives, and track billing pathways.
            </p>
          </div>
        </div>

        {/* BULK ACTIONS HEADER PANEL */}
        {selectedIds.length > 0 && (
          <div className="admin-card-container" style={{ marginBottom: "20px", padding: "16px 24px", background: "#FFFBEB", border: "1px solid #FDE68A", display: "flex", flexWrap: "wrap", justifyContext: "space-between", alignItems: "center", gap: "16px", borderRadius: "16px" }}>
            <div style={{ flex: 1 }}>
              <span style={{ fontSize: "14px", fontWeight: "600", color: "#B45309" }}>
                ⚡ {selectedIds.length} orders selected
              </span>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "10px", alignItems: "center" }}>
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkStatusUpdate(e.target.value);
                    e.target.value = "";
                  }
                }}
                style={{ height: "36px", padding: "0 12px", borderRadius: "8px", border: "1px solid #FCD34D", fontSize: "13px", background: "#FFFFFF", fontWeight: "600" }}
              >
                <option value="">Bulk Update Status</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Packed">Packed</option>
                <option value="Shipped">Shipped</option>
                <option value="Out For Delivery">Out For Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Returned">Returned</option>
              </select>

              <button
                onClick={handleBulkPrintInvoices}
                className="btn-admin-secondary"
                style={{ height: "36px", padding: "0 14px", fontSize: "13px", border: "1px solid #FCD34D", borderRadius: "8px" }}
              >
                Download Invoices
              </button>

              <button
                onClick={handleBulkEmail}
                className="btn-admin-secondary"
                style={{ height: "36px", padding: "0 14px", fontSize: "13px", border: "1px solid #FCD34D", borderRadius: "8px" }}
              >
                Resend Emails
              </button>

              <button
                onClick={handleBulkDelete}
                className="btn-admin-primary"
                style={{ height: "36px", padding: "0 14px", fontSize: "13px", background: "#DC2626", border: "none", color: "#FFFFFF", borderRadius: "8px" }}
              >
                Delete Selected
              </button>

              <button
                onClick={() => setSelectedIds([])}
                style={{ background: "none", border: "none", color: "#6B7280", cursor: "pointer", fontSize: "13px", textDecoration: "underline" }}
              >
                Cancel Selection
              </button>
            </div>
          </div>
        )}

        {/* CONTROLS CARD CONTAINER */}
        <div className="admin-card-container" style={{ marginBottom: "32px", padding: "28px" }}>
          
          {/* SEARCH & FILTERS BAR */}
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr 1fr", gap: "16px" }}>
              {/* Search Field */}
              <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
                <LuSearch style={{ position: "absolute", left: "16px", color: "#6B7280", fontSize: "18px" }} />
                <input
                  type="text"
                  placeholder="Search by Order ID, Customer name, email, phone or products..."
                  className="admin-form-input"
                  style={{ width: "100%", paddingLeft: "46px", height: "48px", background: "#FFFFFF", borderRadius: "12px", border: "1px solid #ECECEC" }}
                  value={searchTerm}
                  onChange={(e) => {
                    setSearchTerm(e.target.value);
                    setCurrentPage(1);
                  }}
                />
              </div>

              {/* Status Selector */}
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="admin-form-input"
                style={{ height: "48px", background: "#FFFFFF", borderRadius: "12px", border: "1px solid #ECECEC", padding: "0 16px", color: "#1A1A1A", fontWeight: "500" }}
              >
                <option value="">All Shipment States</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Packed">Packed</option>
                <option value="Shipped">Shipped</option>
                <option value="Out For Delivery">Out For Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Returned">Returned</option>
              </select>

              {/* Payment Selector */}
              <select
                value={paymentFilter}
                onChange={(e) => {
                  setPaymentFilter(e.target.value);
                  setCurrentPage(1);
                }}
                className="admin-form-input"
                style={{ height: "48px", background: "#FFFFFF", borderRadius: "12px", border: "1px solid #ECECEC", padding: "0 16px", color: "#1A1A1A", fontWeight: "500" }}
              >
                <option value="">All Payments</option>
                <option value="COD">Cash On Delivery (COD)</option>
                <option value="Razorpay">Online (Razorpay)</option>
              </select>
            </div>

            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px", borderTop: "1px solid #ECECEC", paddingTop: "20px" }}>
              
              {/* Date Filters */}
              <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
                <span style={{ fontSize: "13px", fontWeight: "600", color: "#6B7280", display: "inline-flex", alignItems: "center", gap: "6px" }}>
                  <LuCalendar /> Date Limits:
                </span>
                <input
                  type="date"
                  className="admin-form-input"
                  style={{ height: "38px", background: "#FFFFFF", borderRadius: "8px", border: "1px solid #ECECEC", padding: "0 12px", fontSize: "13px" }}
                  value={startDate}
                  onChange={(e) => {
                    setStartDate(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                <span style={{ color: "#6B7280", fontSize: "13px" }}>to</span>
                <input
                  type="date"
                  className="admin-form-input"
                  style={{ height: "38px", background: "#FFFFFF", borderRadius: "8px", border: "1px solid #ECECEC", padding: "0 12px", fontSize: "13px" }}
                  value={endDate}
                  onChange={(e) => {
                    setEndDate(e.target.value);
                    setCurrentPage(1);
                  }}
                />
                <button 
                  onClick={refreshData} 
                  className="btn-admin-invoice" 
                  style={{ height: "38px", padding: "0 16px", display: "inline-flex", alignItems: "center", gap: "8px" }}
                >
                  <LuRefreshCw /> Refresh List
                </button>
              </div>

              {/* Bulk Export Excel Button */}
              <div>
                <button
                  onClick={handleExportExcel}
                  className="btn-admin-export"
                  disabled={exporting}
                >
                  <LuDownload /> Export Excel (.xlsx) {exporting && "..."}
                </button>
              </div>

            </div>

          </div>

        </div>

        {/* ORDERS TABLE CARD CONTAINER */}
        <div className="admin-card-container" style={{ padding: "0", overflow: "hidden", borderRadius: "20px" }}>
          
          <table className="admin-premium-table" style={{ width: "100%", borderCollapse: "collapse" }}>
            <thead>
              <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #ECECEC" }}>
                <th style={{ padding: "18px 24px", textAlign: "left", width: "40px" }}>
                  <input
                    type="checkbox"
                    checked={filteredOrders.length > 0 && filteredOrders.every(o => selectedIds.includes(o._id))}
                    onChange={() => handleSelectAll(filteredOrders)}
                    style={{ cursor: "pointer", width: "16px", height: "16px" }}
                  />
                </th>
                <th 
                  onClick={() => handleSort("_id")}
                  style={{ padding: "18px 24px", textAlign: "left", fontSize: "13px", fontWeight: "700", color: "#6B7280", textTransform: "uppercase", cursor: "pointer" }}
                >
                  Order ID {sortField === "_id" && (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th 
                  onClick={() => handleSort("customerName")}
                  style={{ padding: "18px 24px", textAlign: "left", fontSize: "13px", fontWeight: "700", color: "#6B7280", textTransform: "uppercase", cursor: "pointer" }}
                >
                  Customer Details {sortField === "customerName" && (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th style={{ padding: "18px 24px", textAlign: "left", fontSize: "13px", fontWeight: "700", color: "#6B7280", textTransform: "uppercase" }}>Products Preview</th>
                <th style={{ padding: "18px 24px", textAlign: "center", fontSize: "13px", fontWeight: "700", color: "#6B7280", textTransform: "uppercase" }}>Items</th>
                <th 
                  onClick={() => handleSort("totalAmount")}
                  style={{ padding: "18px 24px", textAlign: "left", fontSize: "13px", fontWeight: "700", color: "#6B7280", textTransform: "uppercase", cursor: "pointer" }}
                >
                  Grand Total {sortField === "totalAmount" && (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th style={{ padding: "18px 24px", textAlign: "center", fontSize: "13px", fontWeight: "700", color: "#6B7280", textTransform: "uppercase" }}>Payment Status</th>
                <th style={{ padding: "18px 24px", textAlign: "center", fontSize: "13px", fontWeight: "700", color: "#6B7280", textTransform: "uppercase" }}>Shipment Status</th>
                <th 
                  onClick={() => handleSort("createdAt")}
                  style={{ padding: "18px 24px", textAlign: "left", fontSize: "13px", fontWeight: "700", color: "#6B7280", textTransform: "uppercase", cursor: "pointer" }}
                >
                  Order Date {sortField === "createdAt" && (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th style={{ padding: "18px 24px", textAlign: "right", fontSize: "13px", fontWeight: "700", color: "#6B7280", textTransform: "uppercase" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #ECECEC" }}>
                    <td style={{ padding: "20px 24px" }} />
                    <td style={{ padding: "20px 24px" }}><div className="shimmer-bg" style={{ height: "16px", width: "80px", borderRadius: "4px" }} /></td>
                    <td style={{ padding: "20px 24px" }}>
                      <div className="shimmer-bg" style={{ height: "16px", width: "120px", borderRadius: "4px", marginBottom: "6px" }} />
                      <div className="shimmer-bg" style={{ height: "12px", width: "160px", borderRadius: "4px" }} />
                    </td>
                    <td style={{ padding: "20px 24px" }}><div className="shimmer-bg" style={{ height: "16px", width: "140px", borderRadius: "4px" }} /></td>
                    <td style={{ padding: "20px 24px", textAlign: "center" }}><div className="shimmer-bg" style={{ height: "16px", width: "30px", borderRadius: "4px", margin: "0 auto" }} /></td>
                    <td style={{ padding: "20px 24px" }}><div className="shimmer-bg" style={{ height: "16px", width: "70px", borderRadius: "4px" }} /></td>
                    <td style={{ padding: "20px 24px", textAlign: "center" }}><div className="shimmer-bg" style={{ height: "24px", width: "80px", borderRadius: "20px", margin: "0 auto" }} /></td>
                    <td style={{ padding: "20px 24px", textAlign: "center" }}><div className="shimmer-bg" style={{ height: "24px", width: "85px", borderRadius: "20px", margin: "0 auto" }} /></td>
                    <td style={{ padding: "20px 24px" }}><div className="shimmer-bg" style={{ height: "16px", width: "90px", borderRadius: "4px" }} /></td>
                    <td style={{ padding: "20px 24px", textAlign: "right" }}><div className="shimmer-bg" style={{ height: "30px", width: "110px", borderRadius: "6px", display: "inline-block" }} /></td>
                  </tr>
                ))
              ) : paginatedOrders.map((order) => {
                const orderDate = new Date(order.createdAt).toLocaleDateString("en-US", {
                  month: "short",
                  day: "numeric",
                  year: "numeric",
                });

                // Resolve customer details properly
                const customerName = order.customerName || (order.userId && order.userId.name) || "Guest User";
                const customerEmail = order.customerEmail || (order.userId && order.userId.email) || "";
                
                // Calculate total quantities
                const totalQty = order.items?.reduce((sum, item) => sum + item.qty, 0) || 1;

                // Payment Status Styling Badges
                const paymentStatusStr = (order.paymentStatus || "Pending").toLowerCase();
                
                // Shipment Status Selector & Badges
                const shipmentStatusStr = (order.status || "Pending").toLowerCase().replace(/\s+/g, "");

                return (
                  <tr key={order._id} style={{ borderBottom: "1px solid #ECECEC", transition: "background 0.2s" }} className="table-row-hover">
                    
                    {/* Checkbox column */}
                    <td style={{ padding: "20px 24px" }}>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(order._id)}
                        onChange={() => handleSelectRow(order._id)}
                        style={{ cursor: "pointer", width: "16px", height: "16px" }}
                      />
                    </td>

                    {/* Order ID */}
                    <td style={{ padding: "20px 24px" }}>
                      <strong style={{ fontFamily: "monospace", fontSize: "14px", color: "#1A1A1A" }}>
                        #{order._id.slice(-8).toUpperCase()}
                      </strong>
                    </td>

                    {/* Customer Info Card Details */}
                    <td style={{ padding: "20px 24px" }}>
                      <div style={{ display: "flex", flexDirection: "column" }}>
                        <span style={{ fontWeight: "600", fontSize: "15px", color: "#1A1A1A" }}>
                          {customerName}
                        </span>
                        <span style={{ fontSize: "12.5px", color: "#6B7280", marginTop: "2px" }}>
                          {customerEmail}
                        </span>
                      </div>
                    </td>

                    {/* Shopify style product preview thumbnails */}
                    <td style={{ padding: "20px 24px" }}>
                      <div className="product-thumbs-preview">
                        {(order.items || []).slice(0, 3).map((item, idx) => (
                          <img
                            key={idx}
                            src={item.productImage || "/cosmetic_1.avif"}
                            alt={item.productName}
                            className="product-preview-img"
                            title={item.productName}
                            onError={(e) => { e.target.src = "/cosmetic_1.avif"; }}
                          />
                        ))}
                        {order.items?.length > 3 && (
                          <span className="product-preview-more-badge">
                            +{order.items.length - 3}
                          </span>
                        )}
                      </div>
                    </td>

                    {/* Total Quantity */}
                    <td style={{ padding: "20px 24px", textAlign: "center" }}>
                      <span style={{ fontSize: "15px", fontWeight: "600", color: "#1A1A1A" }}>
                        {totalQty}
                      </span>
                    </td>

                    {/* Total price */}
                    <td style={{ padding: "20px 24px" }}>
                      <span style={{ fontSize: "16px", fontWeight: "700", color: "#C8A165" }}>
                        ₹{order.totalAmount.toFixed(2)}
                      </span>
                    </td>

                    {/* Payment Status Badges */}
                    <td style={{ padding: "20px 24px", textAlign: "center" }}>
                      <span className={`badge-payment ${paymentStatusStr}`}>
                        {order.paymentStatus || "Pending"}
                      </span>
                    </td>

                    {/* Shipment Status dropdown and badge */}
                    <td style={{ padding: "20px 24px", textAlign: "center" }}>
                      <span className={`badge-shipment ${shipmentStatusStr}`}>
                        {order.status || "Pending"}
                      </span>
                    </td>

                    {/* Order Date */}
                    <td style={{ padding: "20px 24px", color: "#6B7280", fontSize: "14px" }}>
                      {orderDate}
                    </td>

                    {/* Action buttons */}
                    <td style={{ padding: "20px 24px", textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "8px" }}>
                        <button 
                          onClick={() => downloadInvoice(order._id)}
                          className="btn-admin-invoice"
                          title="Download PDF statement"
                        >
                          <LuDownload /> PDF
                        </button>
                        
                        <Link 
                          to={`/admin/orders/${order._id}`} 
                          className="btn-admin-view"
                          style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}
                        >
                          <LuEye /> View
                        </Link>
                      </div>
                    </td>

                  </tr>
                );
              })}
            </tbody>
          </table>

          {!loading && filteredOrders.length === 0 && (
            <div style={{ padding: "50px", textAlign: "center", color: "#6B7280", fontSize: "15px" }}>
              No orders found matching the filter guidelines.
            </div>
          )}

          {/* PAGINATION FOOTER BAR */}
          {!loading && totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderTop: "1px solid #ECECEC", background: "#FFFFFF" }}>
              <span style={{ fontSize: "13.5px", color: "#6B7280" }}>
                Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to <strong>{Math.min(currentPage * itemsPerPage, sortedOrders.length)}</strong> of <strong>{sortedOrders.length}</strong> orders
              </span>
              <div style={{ display: "flex", gap: "8px" }}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="btn-admin-secondary"
                  style={{ height: "36px", padding: "0 16px", borderRadius: "8px", fontSize: "13px" }}
                >
                  Previous
                </button>
                <div style={{ display: "flex", alignItems: "center", gap: "4px", fontSize: "13.5px", color: "#1A1A1A", fontWeight: "600" }}>
                  <span>Page</span>
                  <strong style={{ color: "#C8A165" }}>{currentPage}</strong>
                  <span>of</span>
                  <strong>{totalPages}</strong>
                </div>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="btn-admin-secondary"
                  style={{ height: "36px", padding: "0 16px", borderRadius: "8px", fontSize: "13px" }}
                >
                  Next
                </button>
              </div>
            </div>
          )}

        </div>

      </div>
    </div>
  );
};

export default AdminOrders;
