import { useEffect, useState, useContext, useRef } from "react";
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
  LuTruck,
  LuBell,
  LuClock,
  LuUser,
  LuTag,
  LuMapPin,
  LuInfo,
  LuPrinter,
  LuMail,
  LuChevronRight,
  LuFileText,
  LuPlus
} from "react-icons/lu";
import axios from "axios";

const AdminOrders = () => {
  const { user } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Advanced Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [paymentFilter, setPaymentFilter] = useState("");
  const [priorityFilter, setPriorityFilter] = useState("");
  const [courierFilter, setCourierFilter] = useState("");
  const [cityFilter, setCityFilter] = useState("");
  const [stateFilter, setStateFilter] = useState("");
  const [pincodeFilter, setPincodeFilter] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  
  // Selection and Sorting
  const [selectedIds, setSelectedIds] = useState([]);
  const [sortField, setSortField] = useState("createdAt");
  const [sortDirection, setSortDirection] = useState("desc");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 12;

  // Active Order Detail Drawer
  const [activeOrder, setActiveOrder] = useState(null);
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [editingTracking, setEditingTracking] = useState(false);
  const [newNote, setNewNote] = useState("");
  const [newTag, setNewTag] = useState("");

  // Cancellation Rejection & Refund States
  const [rejectionReason, setRejectionReason] = useState("");
  const [showRejectionForm, setShowRejectionForm] = useState(false);
  const [refundTxId, setRefundTxId] = useState("");
  const [showRefundForm, setShowRefundForm] = useState(false);
  
  // Tracking form inputs
  const [trackingForm, setTrackingForm] = useState({
    courier: "",
    trackingNumber: "",
    expectedDeliveryDate: "",
    dispatchDate: "",
    shippingCost: 0
  });

  // Packing Checklist
  const [packingChecklist, setPackingChecklist] = useState({});

  // Notifications Center states
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [lastOrderCount, setLastOrderCount] = useState(0);

  // Customer Insights Popover hover state
  const [hoveredCustomer, setHoveredCustomer] = useState(null);
  const [hoverPos, setHoverPos] = useState({ x: 0, y: 0 });

  const navigate = useNavigate();

  // Load notifications history from LocalStorage
  useEffect(() => {
    const saved = localStorage.getItem("admin_order_notifications");
    if (saved) {
      setNotifications(JSON.parse(saved));
    } else {
      const initial = [
        { id: 1, type: "NEW ORDER", message: "New prepaid order received: #INV-49281", timestamp: new Date(Date.now() - 30 * 60000).toISOString(), read: false },
        { id: 2, type: "COMPLAINT", message: "Complaint ticket created by Meera Shah for product damage", timestamp: new Date(Date.now() - 2 * 3600000).toISOString(), read: false },
        { id: 3, type: "LOW STOCK", message: "Stock Alert: Niacinamide Glowing Serum is below 5 units", timestamp: new Date(Date.now() - 5 * 3600000).toISOString(), read: true },
        { id: 4, type: "RETURN", message: "Return requested for Order #INV-38290 (Size mismatch)", timestamp: new Date(Date.now() - 8 * 3600000).toISOString(), read: false }
      ];
      setNotifications(initial);
      localStorage.setItem("admin_order_notifications", JSON.stringify(initial));
    }
  }, []);

  // Save notifications to LocalStorage when changed
  const saveNotifications = (updated) => {
    setNotifications(updated);
    localStorage.setItem("admin_order_notifications", JSON.stringify(updated));
  };

  const triggerNotification = (type, message) => {
    const newNotif = {
      id: Date.now(),
      type,
      message,
      timestamp: new Date().toISOString(),
      read: false
    };
    const updated = [newNotif, ...notifications];
    saveNotifications(updated);
    toast.success(`🔔 [${type}] ${message}`, { duration: 4000 });
  };

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

  // FETCH ORDERS
  const fetchOrders = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/orders", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const data = await res.json();
      const list = Array.isArray(data) ? data : [];
      setOrders(list);

      // Realtime notification simulation for new orders
      if (lastOrderCount > 0 && list.length > lastOrderCount) {
        const diff = list.length - lastOrderCount;
        triggerNotification("NEW ORDER", `${diff} new customer order(s) received just now!`);
      }
      setLastOrderCount(list.length);
    } catch (error) {
      console.error(error);
      toast.error("Failed to sync order listings from database.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchOrders();
    }
  }, [user]);

  // Polling simulation for Real-time Updates (every 30 seconds)
  useEffect(() => {
    const interval = setInterval(() => {
      if (user) {
        fetchOrders();
      }
    }, 30000);
    return () => clearInterval(interval);
  }, [user, lastOrderCount]);

  const refreshData = async () => {
    await fetchOrders();
    toast.success("Operations console updated in real-time!");
  };

  // DOWNLOAD INVOICE PDF
  const downloadInvoice = async (orderId) => {
    try {
      toast.loading("Generating secure invoice PDF...", { id: "inv-pdf" });
      const res = await fetch(`/api/orders/${orderId}/invoice`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (!res.ok) throw new Error("Invoice generation failed");

      const blob = await res.blob();
      const fileURL = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = fileURL;
      link.setAttribute("download", `Invoice-${orderId}.pdf`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.dismiss("inv-pdf");
      toast.success("Invoice PDF statement downloaded!");
    } catch (error) {
      toast.dismiss("inv-pdf");
      console.error(error);
      toast.error("Failed to download invoice PDF");
    }
  };

  // UPDATE ORDER (Status, priority, tags, note, tracking)
  const handleUpdateOrderDetails = async (payload, successMsg = "Order details saved!") => {
    if (!activeOrder) return;
    try {
      toast.loading("Updating order...", { id: "order-update" });
      const res = await axios.put(
        `/api/orders/${activeOrder._id}/status`,
        payload,
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );

      if (res.data.success) {
        // Sync local order states
        const updated = res.data.order;
        setOrders(prev => prev.map(o => o._id === updated._id ? updated : o));
        setActiveOrder(updated);
        toast.dismiss("order-update");
        toast.success(successMsg);
      } else {
        toast.dismiss("order-update");
        toast.error(res.data.message || "Failed to save updates");
      }
    } catch (error) {
      toast.dismiss("order-update");
      toast.error(error.response?.data?.message || "Failed to update order");
    }
  };

  // ADMIN APPROVE ORDER CANCELLATION
  const handleApproveCancellation = async (orderId) => {
    if (!window.confirm("Are you sure you want to APPROVE this cancellation request? This will cancel the order, restock items, and initiate refund status.")) return;
    toast.loading("Approving cancellation...", { id: "c-approve" });
    try {
      const res = await axios.put(
        `/api/orders/${orderId}/approve-cancellation`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      toast.dismiss("c-approve");
      if (res.data.success) {
        toast.success("Cancellation approved successfully!");
        setOrders(prev => prev.map(o => o._id === orderId ? res.data.order : o));
        setActiveOrder(res.data.order);
      }
    } catch (err) {
      toast.dismiss("c-approve");
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to approve cancellation");
    }
  };

  // ADMIN REJECT ORDER CANCELLATION
  const handleRejectCancellation = async (orderId) => {
    if (!rejectionReason.trim()) {
      toast.error("Please enter a rejection reason");
      return;
    }
    toast.loading("Rejecting cancellation...", { id: "c-reject" });
    try {
      const res = await axios.put(
        `/api/orders/${orderId}/reject-cancellation`,
        { refundRemarks: rejectionReason },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      toast.dismiss("c-reject");
      if (res.data.success) {
        toast.success("Cancellation request rejected!");
        setOrders(prev => prev.map(o => o._id === orderId ? res.data.order : o));
        setActiveOrder(res.data.order);
        setShowRejectionForm(false);
        setRejectionReason("");
      }
    } catch (err) {
      toast.dismiss("c-reject");
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to reject cancellation");
    }
  };

  // ADMIN UPDATE REFUND STATUS
  const handleUpdateRefund = async (orderId, refundStatus, remarks = "") => {
    toast.loading("Updating refund status...", { id: "ref-update" });
    try {
      const res = await axios.put(
        `/api/orders/${orderId}/refund`,
        {
          refundStatus,
          refundTransactionId: refundStatus === "Refunded" ? refundTxId : "",
          refundRemarks: remarks || "Updated by Admin",
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      toast.dismiss("ref-update");
      if (res.data.success) {
        toast.success(`Refund marked as ${refundStatus}!`);
        setOrders(prev => prev.map(o => o._id === orderId ? res.data.order : o));
        setActiveOrder(res.data.order);
        setShowRefundForm(false);
        setRefundTxId("");
      }
    } catch (err) {
      toast.dismiss("ref-update");
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update refund status");
    }
  };

  // BULK UPDATE STATUS
  const handleBulkStatusUpdate = async (status) => {
    const confirm = window.confirm(`Update the shipment status of ${selectedIds.length} orders to ${status}?`);
    if (!confirm) return;
    toast.loading(`Bulk processing status updates...`, { id: "bulk-update" });
    try {
      const res = await axios.put("/api/orders/bulk-status", {
        orderIds: selectedIds,
        status,
      }, {
        headers: { Authorization: `Bearer ${user.token}` },
      });

      toast.dismiss("bulk-update");
      if (res.data.success) {
        toast.success(`Successfully updated ${res.data.updatedCount || selectedIds.length} orders to ${status}!`);
        triggerNotification("STATUS UPDATE", `Bulk changed ${selectedIds.length} orders to ${status}`);
        setSelectedIds([]);
        fetchOrders();
      } else {
        toast.error(res.data.message || "Bulk update failed");
      }
    } catch (err) {
      toast.dismiss("bulk-update");
      toast.error(err.response?.data?.message || "Failed to process bulk status changes");
    }
  };

  const handleBulkDelete = async () => {
    const confirm = window.confirm(`WARNING: Are you sure you want to permanently DELETE ${selectedIds.length} orders? This action is tracked in audit logs and cannot be undone.`);
    if (!confirm) return;
    toast.loading(`Permanently removing selected orders...`, { id: "bulk-delete" });
    try {
      await Promise.all(
        selectedIds.map(id =>
          axios.delete(`/api/orders/${id}`, {
            headers: { Authorization: `Bearer ${user.token}` }
          })
        )
      );
      toast.dismiss("bulk-delete");
      toast.success("Bulk order deletion completed!");
      triggerNotification("ORDER CANCELLED", `Permanently removed ${selectedIds.length} orders`);
      setSelectedIds([]);
      fetchOrders();
    } catch (err) {
      toast.dismiss("bulk-delete");
      toast.error("Failed to delete some orders");
    }
  };

  const handleBulkEmail = async () => {
    const confirm = window.confirm(`Dispatch promotional order updates email to ${selectedIds.length} customers?`);
    if (!confirm) return;
    toast.loading("Emailing updates...", { id: "bulk-email" });
    try {
      await Promise.all(
        selectedIds.map(id =>
          axios.post(`/api/orders/${id}/resend-email`, {}, {
            headers: { Authorization: `Bearer ${user.token}` }
          })
        )
      );
      toast.dismiss("bulk-email");
      toast.success("Dispatched updates emails in bulk!");
      setSelectedIds([]);
    } catch (err) {
      toast.dismiss("bulk-email");
      toast.error("Failed to send some emails");
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

  // EXPORT EXCEL (.xlsx)
  const handleExportExcel = async () => {
    toast.loading("Preparing operations export file...", { id: "excel-export" });
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

      if (!res.ok) throw new Error("Excel generation failed");

      const blob = await res.blob();
      const fileURL = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = fileURL;

      const d = new Date();
      const dateStr = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

      link.setAttribute("download", `Shopify_Orders_Export_${dateStr}.xlsx`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      toast.dismiss("excel-export");
      toast.success("Spreadsheet downloaded successfully!");
    } catch (error) {
      toast.dismiss("excel-export");
      console.error(error);
      toast.error("Failed to generate excel file");
    }
  };

  // CLIENT SIDE CSV EXPORT
  const handleExportCSV = () => {
    if (filteredOrders.length === 0) {
      toast.error("No filtered orders available to export!");
      return;
    }
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Order ID,Customer Name,Customer Email,Customer Phone,Items Qty,Total Amount,Payment Method,Payment Status,Shipment Status,Priority,Date,Tags\n";

    filteredOrders.forEach((o) => {
      const name = o.customerName || (o.userId && o.userId.name) || "Guest";
      const email = o.customerEmail || (o.userId && o.userId.email) || "";
      const phone = o.customerPhone || (o.userId && o.userId.phone) || "";
      const totalQty = o.items?.reduce((s, i) => s + i.qty, 0) || 1;
      const tagsStr = (o.tags || []).join("|");
      
      csvContent += `"${o._id}","${name}","${email}","${phone}",${totalQty},${o.totalAmount},"${o.paymentMethod}","${o.paymentStatus}","${o.status}","${o.priority || "Medium"}","${o.createdAt}","${tagsStr}"\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Order_Console_Export_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("CSV export downloaded successfully!");
  };

  const handleSort = (field) => {
    const isAsc = sortField === field && sortDirection === "asc";
    setSortDirection(isAsc ? "desc" : "asc");
    setSortField(field);
  };

  // Open Drawer Details Panel
  const handleOpenDrawer = (order) => {
    setActiveOrder(order);
    setTrackingForm({
      courier: order.courier || "",
      trackingNumber: order.trackingNumber || "",
      expectedDeliveryDate: order.expectedDeliveryDate ? order.expectedDeliveryDate.slice(0, 10) : "",
      dispatchDate: order.dispatchDate ? order.dispatchDate.slice(0, 10) : "",
      shippingCost: order.shippingCost || 0
    });
    // Set checklist
    const checklist = {};
    (order.items || []).forEach(item => {
      checklist[item._id] = false;
    });
    setPackingChecklist(checklist);
    setNewNote("");
    setNewTag("");
    setEditingTracking(false);
    setDrawerOpen(true);
  };

  // CUSTOMER INSIGHTS HOVER DETAILS
  const handleCustomerMouseEnter = (e, order) => {
    const rect = e.target.getBoundingClientRect();
    setHoverPos({
      x: rect.left + window.scrollX,
      y: rect.top + window.scrollY - 180
    });
    
    // Resolve loyalty level and statistics dynamically
    const name = order.customerName || (order.userId && order.userId.name) || "Guest";
    const email = order.customerEmail || (order.userId && order.userId.email) || "";
    
    // Gather all customer orders
    const customerOrders = orders.filter(o => {
      const checkEmail = o.customerEmail || (o.userId && o.userId.email) || "";
      return checkEmail === email;
    });

    const totalSpend = customerOrders.reduce((sum, o) => sum + o.totalAmount, 0);
    const returnsCount = customerOrders.filter(o => o.status === "Returned" || o.status === "Return Requested").length;

    setHoveredCustomer({
      name,
      email,
      phone: order.customerPhone || "N/A",
      totalOrders: customerOrders.length,
      spend: totalSpend,
      returns: returnsCount,
      loyalty: totalSpend > 8000 ? "VIP Gold" : totalSpend > 3000 ? "Silver Member" : "Bronze Buyer"
    });
  };

  const handleCustomerMouseLeave = () => {
    setHoveredCustomer(null);
  };

  // Smart Search & Filters
  const filteredOrders = orders.filter((order) => {
    const customerName = order.customerName || (order.userId && order.userId.name) || "Guest User";
    const customerEmail = order.customerEmail || (order.userId && order.userId.email) || "";
    const customerPhone = order.customerPhone || (order.userId && order.userId.phone) || "";
    
    const matchesSearch =
      order._id.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerEmail.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customerPhone.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.courier || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (order.trackingNumber || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      order.items?.some(item => item.productName?.toLowerCase().includes(searchTerm.toLowerCase()));

    const matchesStatus = statusFilter === "" || order.status === statusFilter;
    const matchesPayment = paymentFilter === "" || order.paymentMethod === paymentFilter;
    const matchesPriority = priorityFilter === "" || (order.priority || "Medium") === priorityFilter;
    const matchesCourier = courierFilter === "" || (order.courier || "").toLowerCase().includes(courierFilter.toLowerCase());
    
    const shipping = order.shippingAddress || {};
    const matchesCity = cityFilter === "" || (shipping.city || "").toLowerCase().includes(cityFilter.toLowerCase());
    const matchesState = stateFilter === "" || (shipping.state || "").toLowerCase().includes(stateFilter.toLowerCase());
    const matchesPincode = pincodeFilter === "" || (shipping.pincode || "").includes(pincodeFilter);

    let matchesDate = true;
    if (startDate) {
      matchesDate = matchesDate && new Date(order.createdAt) >= new Date(startDate);
    }
    if (endDate) {
      const end = new Date(endDate);
      end.setHours(23, 59, 59, 999);
      matchesDate = matchesDate && new Date(order.createdAt) <= end;
    }

    return matchesSearch && matchesStatus && matchesPayment && matchesPriority && matchesCourier && matchesCity && matchesState && matchesPincode && matchesDate;
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

  // DYNAMIC STATISTICS CALCULATIONS FOR KPI CARDS
  const totalRevenue = orders.reduce((sum, o) => sum + o.totalAmount, 0);
  const totalAOV = orders.length > 0 ? (totalRevenue / orders.length) : 0;
  
  // Today's Orders & Revenue calculation
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);
  const todayOrdersList = orders.filter(o => new Date(o.createdAt) >= todayStart);
  const todayRevenue = todayOrdersList.reduce((sum, o) => sum + o.totalAmount, 0);

  // Monthly Revenue
  const currentMonthStart = new Date();
  currentMonthStart.setDate(1);
  currentMonthStart.setHours(0, 0, 0, 0);
  const monthlyRevenue = orders
    .filter(o => new Date(o.createdAt) >= currentMonthStart)
    .reduce((sum, o) => sum + o.totalAmount, 0);

  const getKPIVal = (type) => {
    switch (type) {
      case "TODAY_ORDERS": return todayOrdersList.length;
      case "TODAY_REV": return `₹${todayRevenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
      case "MONTHLY_REV": return `₹${monthlyRevenue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
      case "AOV": return `₹${totalAOV.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
      case "PENDING": return orders.filter(o => o.status === "Pending").length;
      case "PROCESSING": return orders.filter(o => o.status === "Processing" || o.status === "Confirmed").length;
      case "PACKED": return orders.filter(o => o.status === "Packed").length;
      case "SHIPPED": return orders.filter(o => o.status === "Shipped").length;
      case "DELIVERED": return orders.filter(o => o.status === "Delivered").length;
      case "CANCELLED": return orders.filter(o => o.status === "Cancelled").length;
      case "CANCELLATION_REQUESTED": return orders.filter(o => o.status === "Cancellation Requested").length;
      case "RETURNS": return orders.filter(o => o.status === "Returned" || o.status === "Return Requested" || o.status === "Return Approved").length;
      default: return 0;
    }
  };

  return (
    <div className="admin-layout-wrapper">
      <AdminSidebar />

      <div className="admin-content-console flex-1" style={{ background: "#F8F9FA", position: "relative" }}>
        
        {/* CORE COMMAND TOP HEADER BLOCK */}
        <div className="admin-page-header" style={{ marginBottom: "28px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <div>
            <h2 className="font-serif" style={{ fontSize: "28px", fontWeight: "700", color: "#1F2937" }}>
              Shopify Admin Central Command
            </h2>
            <p style={{ color: "#6B7280", fontSize: "13.5px" }}>
              Manage shipping dispatch lines, monitor live notification logs, and execute bulk order tags.
            </p>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <button onClick={refreshData} className="btn-admin-secondary" style={{ padding: "8px 16px", borderRadius: "30px", display: "flex", alignItems: "center", gap: "8px" }}>
              <LuRefreshCw /> Refresh Sync
            </button>

            {/* NOTIFICATION BELL ICON */}
            <div style={{ position: "relative" }}>
              <button 
                onClick={() => setShowNotifications(!showNotifications)} 
                className="admin-bell-icon-btn" 
                style={{ background: "#FFF", border: "1px solid #ECE7DF", borderRadius: "50%", padding: "10px", position: "relative", cursor: "pointer", display: "flex" }}
              >
                <LuBell style={{ fontSize: "20px", color: "#1F2937" }} />
                {notifications.filter(n => !n.read).length > 0 && (
                  <span className="notif-badge-bubble">
                    {notifications.filter(n => !n.read).length}
                  </span>
                )}
              </button>

              {/* NOTIFICATIONS CONTAINER POPUP */}
              {showNotifications && (
                <div className="admin-notifications-dropdown-menu font-outfit">
                  <div className="dropdown-header">
                    <h4>Operations Logs</h4>
                    <div style={{ display: "flex", gap: "10px" }}>
                      <button onClick={() => {
                        const updated = notifications.map(n => ({ ...n, read: true }));
                        saveNotifications(updated);
                      }}>Mark read</button>
                      <button onClick={() => saveNotifications([])}>Clear all</button>
                    </div>
                  </div>
                  <div className="dropdown-list">
                    {notifications.length === 0 ? (
                      <div className="empty-notif">No operations logs registered</div>
                    ) : (
                      notifications.map(n => (
                        <div key={n.id} className={`dropdown-item ${n.read ? "read" : ""}`}>
                          <span className={`notif-tag-badge ${n.type.toLowerCase().replace(/\s+/g, "")}`}>{n.type}</span>
                          <p>{n.message}</p>
                          <small>{new Date(n.timestamp).toLocaleTimeString()}</small>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* TOP SUMMARY KPI DASHBOARD GRID */}
        <div className="admin-kpi-metric-cards-scroll-grid">
          {[
            { title: "Today's Orders", key: "TODAY_ORDERS", icon: <LuPackage /> },
            { title: "Today's Revenue", key: "TODAY_REV", icon: <LuDollarSign />, gold: true },
            { title: "Monthly Sales", key: "MONTHLY_REV", icon: <LuDollarSign /> },
            { title: "Average Value", key: "AOV", icon: <LuInfo /> },
            { title: "Pending Orders", key: "PENDING", filter: "Pending" },
            { title: "Confirmed/Proc", key: "PROCESSING", filter: "Processing" },
            { title: "Packed", key: "PACKED", filter: "Packed" },
            { title: "Shipped", key: "SHIPPED", filter: "Shipped" },
            { title: "Delivered", key: "DELIVERED", filter: "Delivered" },
            { title: "Cancelled", key: "CANCELLED", filter: "Cancelled" },
            { title: "Cancellation Requested", key: "CANCELLATION_REQUESTED", filter: "Cancellation Requested" },
            { title: "Returns/Refunds", key: "RETURNS", filter: "Returned" },
          ].map((card, idx) => (
            <div 
              key={idx} 
              className={`kpi-metric-panel-card ${statusFilter === card.filter ? "active-kpi" : ""}`}
              onClick={() => {
                if (card.filter !== undefined) {
                  setStatusFilter(card.filter);
                  setCurrentPage(1);
                }
              }}
              style={{ cursor: card.filter !== undefined ? "pointer" : "default" }}
            >
              <div className="panel-header-row">
                <span className="card-lbl">{card.title}</span>
                <span className="card-ic">{card.icon}</span>
              </div>
              <h3 className={`card-v ${card.gold ? "gold-highlight" : ""}`}>{getKPIVal(card.key)}</h3>
            </div>
          ))}
        </div>

        {/* ADVANCED FILTER BOX SECTION */}
        <div className="admin-card-container" style={{ padding: "20px", marginBottom: "24px" }}>
          <div className="advance-filters-flex-row">
            
            {/* Search Input Box */}
            <div style={{ flex: 1, minWidth: "300px", position: "relative" }}>
              <LuSearch className="search-field-left-ic" />
              <input
                type="text"
                placeholder="Search Order ID, Customer name, phone, email, tracking, courier, SKU..."
                value={searchTerm}
                onChange={(e) => { setSearchTerm(e.target.value); setCurrentPage(1); }}
                className="search-field-checkout-console"
              />
            </div>

            {/* Quick action downloads */}
            <div style={{ display: "flex", gap: "10px" }}>
              <button onClick={handleExportCSV} className="btn-admin-secondary" style={{ borderRadius: "8px", height: "46px" }}>
                Export CSV
              </button>
              <button onClick={handleExportExcel} className="btn-admin-outline" style={{ borderRadius: "8px", height: "46px" }}>
                <LuDownload /> Export Excel
              </button>
            </div>
          </div>

          {/* Filtering accordion drawer */}
          <div className="filters-accordion-drawer-inputs font-outfit" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px", marginTop: "16px", borderTop: "1px solid #EFECE6", paddingTop: "16px" }}>
            
            <div className="filter-select-group">
              <label>Status Filter</label>
              <select value={statusFilter} onChange={(e) => { setStatusFilter(e.target.value); setCurrentPage(1); }}>
                <option value="">All Statuses</option>
                <option value="Pending">Pending</option>
                <option value="Confirmed">Confirmed</option>
                <option value="Processing">Processing</option>
                <option value="Packed">Packed</option>
                <option value="Shipped">Shipped</option>
                <option value="Out For Delivery">Out For Delivery</option>
                <option value="Delivered">Delivered</option>
                <option value="Cancelled">Cancelled</option>
                <option value="Cancellation Requested">Cancellation Requested</option>
                <option value="Returned">Returned</option>
              </select>
            </div>

            <div className="filter-select-group">
              <label>Payment Path</label>
              <select value={paymentFilter} onChange={(e) => { setPaymentFilter(e.target.value); setCurrentPage(1); }}>
                <option value="">All Payments</option>
                <option value="COD">COD</option>
                <option value="Razorpay">Razorpay</option>
              </select>
            </div>

            <div className="filter-select-group">
              <label>Order Priority</label>
              <select value={priorityFilter} onChange={(e) => { setPriorityFilter(e.target.value); setCurrentPage(1); }}>
                <option value="">All Priorities</option>
                <option value="High">High</option>
                <option value="Medium">Medium</option>
                <option value="Low">Low</option>
              </select>
            </div>

            <div className="filter-select-group">
              <label>Courier Service</label>
              <input 
                type="text" 
                placeholder="e.g. Delhivery" 
                value={courierFilter} 
                onChange={(e) => { setCourierFilter(e.target.value); setCurrentPage(1); }} 
              />
            </div>

            <div className="filter-select-group">
              <label>Destination City</label>
              <input 
                type="text" 
                placeholder="e.g. Mumbai" 
                value={cityFilter} 
                onChange={(e) => { setCityFilter(e.target.value); setCurrentPage(1); }} 
              />
            </div>

            <div className="filter-select-group">
              <label>Destination State</label>
              <input 
                type="text" 
                placeholder="e.g. Gujarat" 
                value={stateFilter} 
                onChange={(e) => { setStateFilter(e.target.value); setCurrentPage(1); }} 
              />
            </div>

            <div className="filter-select-group">
              <label>Pincode ZIP</label>
              <input 
                type="text" 
                placeholder="e.g. 382350" 
                value={pincodeFilter} 
                onChange={(e) => { setPincodeFilter(e.target.value); setCurrentPage(1); }} 
              />
            </div>
          </div>
        </div>

        {/* CORE DATA TABLE DISPLAY CARD */}
        <div className="admin-card-container font-outfit" style={{ padding: "0", overflow: "hidden", borderRadius: "16px" }}>
          
          <table className="admin-premium-table">
            <thead>
              <tr style={{ background: "#FAF9F6", borderBottom: "1px solid #ECE7DF" }}>
                <th style={{ width: "40px" }}>
                  <input
                    type="checkbox"
                    checked={filteredOrders.length > 0 && filteredOrders.every(o => selectedIds.includes(o._id))}
                    onChange={() => handleSelectAll(filteredOrders)}
                    style={{ cursor: "pointer", width: "16px", height: "16px" }}
                  />
                </th>
                <th onClick={() => handleSort("_id")} style={{ cursor: "pointer" }}>
                  Order ID {sortField === "_id" && (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th onClick={() => handleSort("customerName")} style={{ cursor: "pointer" }}>
                  Customer
                </th>
                <th>Priority</th>
                <th>Products</th>
                <th>Price Total</th>
                <th>Payment</th>
                <th>Shipment Status</th>
                <th onClick={() => handleSort("createdAt")} style={{ cursor: "pointer" }}>
                  Ordered Date {sortField === "createdAt" && (sortDirection === "asc" ? "▲" : "▼")}
                </th>
                <th>Tags</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(6)].map((_, idx) => (
                  <tr key={idx}>
                    <td colSpan="11" style={{ padding: "20px", textAlign: "center" }}>
                      <div className="shimmer-line" style={{ height: "20px", width: "100%", borderRadius: "4px" }} />
                    </td>
                  </tr>
                ))
              ) : paginatedOrders.length === 0 ? (
                <tr>
                  <td colSpan="11" style={{ padding: "60px", textAlign: "center", color: "#6B7280" }}>
                    No operations targets match current search criteria.
                  </td>
                </tr>
              ) : paginatedOrders.map((order) => {
                const customerName = order.customerName || (order.userId && order.userId.name) || "Guest";
                const priority = order.priority || "Medium";
                
                return (
                  <tr key={order._id} className="table-row-hover">
                    <td>
                      <input
                        type="checkbox"
                        checked={selectedIds.includes(order._id)}
                        onChange={() => handleSelectRow(order._id)}
                        style={{ cursor: "pointer", width: "16px", height: "16px" }}
                      />
                    </td>
                    <td>
                      <strong style={{ fontFamily: "monospace", fontSize: "13px", color: "#111827" }}>
                        #{order._id.slice(-8).toUpperCase()}
                      </strong>
                    </td>
                    
                    {/* Hover insights trigger */}
                    <td 
                      onMouseEnter={(e) => handleCustomerMouseEnter(e, order)}
                      onMouseLeave={handleCustomerMouseLeave}
                      style={{ cursor: "pointer", textDecoration: "underline", color: "#1F2937", fontWeight: "600" }}
                    >
                      {customerName}
                    </td>

                    <td>
                      <span className={`priority-tag-pill ${priority.toLowerCase()}`}>
                        {priority}
                      </span>
                    </td>

                    <td>
                      <div className="product-thumbs-preview">
                        {(order.items || []).slice(0, 3).map((item, idx) => (
                          <img
                            key={idx}
                            src={item.productImage || "/cosmetic_1.avif"}
                            alt={item.productName}
                            className="product-preview-img"
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

                    <td>
                      <strong style={{ color: "#C8A165" }}>
                        ₹{order.totalAmount.toFixed(2)}
                      </strong>
                    </td>

                    <td>
                      <span className={`badge-payment ${order.paymentStatus?.toLowerCase() || "pending"}`}>
                        {order.paymentStatus || "Pending"}
                      </span>
                    </td>

                    <td>
                      <span className={`badge-shipment ${order.status?.toLowerCase().replace(/\s+/g, "") || "pending"}`}>
                        {order.status || "Pending"}
                      </span>
                    </td>

                    <td style={{ fontSize: "12.5px", color: "#6B7280" }}>
                      {new Date(order.createdAt).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                    </td>

                    <td>
                      <div style={{ display: "flex", gap: "4px", flexWrap: "wrap" }}>
                        {(order.tags || []).slice(0, 2).map((t, i) => (
                          <span key={i} className="row-tag-chip">{t}</span>
                        ))}
                      </div>
                    </td>

                    <td style={{ textAlign: "right" }}>
                      <div style={{ display: "inline-flex", gap: "6px" }}>
                        <button onClick={() => handleOpenDrawer(order)} className="btn-admin-outline" style={{ display: "flex", alignItems: "center", gap: "4px", padding: "6px 12px" }}>
                          <LuEye /> Process
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* TABLE PAGINATION */}
          {!loading && totalPages > 1 && (
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px 24px", borderTop: "1px solid #ECE7DF", background: "#FFFFFF" }}>
              <span style={{ fontSize: "13px", color: "#6B7280" }}>
                Showing <strong>{(currentPage - 1) * itemsPerPage + 1}</strong> to <strong>{Math.min(currentPage * itemsPerPage, sortedOrders.length)}</strong> of <strong>{sortedOrders.length}</strong> orders
              </span>
              <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <button
                  onClick={() => setCurrentPage(prev => Math.max(prev - 1, 1))}
                  disabled={currentPage === 1}
                  className="btn-admin-secondary"
                  style={{ height: "34px", padding: "0 14px", borderRadius: "8px" }}
                >
                  Prev
                </button>
                <span style={{ fontSize: "13px" }}>Page <strong>{currentPage}</strong> of <strong>{totalPages}</strong></span>
                <button
                  onClick={() => setCurrentPage(prev => Math.min(prev + 1, totalPages))}
                  disabled={currentPage === totalPages}
                  className="btn-admin-secondary"
                  style={{ height: "34px", padding: "0 14px", borderRadius: "8px" }}
                >
                  Next
                </button>
              </div>
            </div>
          )}
        </div>

        {/* STICKY FLOATING ACTION TOOLBAR (BULK OPERATIONS) */}
        {selectedIds.length > 0 && (
          <div className="floating-bulk-operations-bar font-outfit">
            <div className="selected-counter">
              <span>⚡ <strong>{selectedIds.length}</strong> orders selected</span>
            </div>

            <div className="action-buttons-flex">
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    handleBulkStatusUpdate(e.target.value);
                    e.target.value = "";
                  }
                }}
                className="bulk-select-dropdown"
              >
                <option value="">Bulk Status Update</option>
                <option value="Confirmed">Bulk Confirm</option>
                <option value="Processing">Bulk Processing</option>
                <option value="Packed">Bulk Pack</option>
                <option value="Shipped">Bulk Ship</option>
                <option value="Out For Delivery">Bulk Out For Delivery</option>
                <option value="Delivered">Bulk Deliver</option>
                <option value="Cancelled">Bulk Cancel</option>
              </select>

              <button onClick={handleBulkPrintInvoices} className="btn-bulk-act">
                <LuPrinter /> Download Invoices
              </button>
              <button onClick={handleBulkEmail} className="btn-bulk-act">
                <LuMail /> Dispatch Email
              </button>
              
              {/* Customer marketing campaigns actions */}
              <select 
                className="bulk-select-dropdown"
                onChange={(e) => {
                  if (!e.target.value) return;
                  toast.success(`Promo action triggered: ${e.target.value} for selected customers! 📣`);
                  e.target.value = "";
                }}
              >
                <option value="">Customer Marketing Actions</option>
                <option value="PROMO">Bulk Promotional Coupons</option>
                <option value="LOYALTY">Award Loyalty Points (+100)</option>
                <option value="NEWSLETTER">Opt-in Newsletter Dispatch</option>
              </select>

              <button onClick={handleBulkDelete} className="btn-bulk-act delete">
                Remove Selected
              </button>

              <button onClick={() => setSelectedIds([])} className="btn-bulk-cancel">
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* CUSTOMER INSIGHTS POPUP PANEL */}
        {hoveredCustomer && (
          <div 
            className="customer-hover-popover-panel font-outfit"
            style={{ 
              top: `${hoverPos.y}px`, 
              left: `${hoverPos.x}px`,
              position: "absolute"
            }}
          >
            <h4>{hoveredCustomer.name}</h4>
            <p className="email-txt">{hoveredCustomer.email}</p>
            <p className="phone-txt">{hoveredCustomer.phone}</p>
            <hr />
            <div className="insights-grid-two">
              <div>
                <span>Total Orders</span>
                <strong>{hoveredCustomer.totalOrders}</strong>
              </div>
              <div>
                <span>Total Spend</span>
                <strong>₹{hoveredCustomer.spend.toFixed(2)}</strong>
              </div>
              <div>
                <span>Returns</span>
                <strong className={hoveredCustomer.returns > 0 ? "error-txt" : ""}>{hoveredCustomer.returns}</strong>
              </div>
              <div>
                <span>Loyalty Class</span>
                <strong className="vip-txt">{hoveredCustomer.loyalty}</strong>
              </div>
            </div>
          </div>
        )}

        {/* ORDER DETAILS PROCESSING RIGHT DRAWER */}
        {drawerOpen && activeOrder && (
          <div className="order-details-side-drawer-mask">
            <div className="order-details-side-drawer font-outfit">
              
              <div className="drawer-header-row">
                <h3>Order Details: #{activeOrder._id.slice(-8).toUpperCase()}</h3>
                <button onClick={() => setDrawerOpen(false)} className="close-drawer-btn">✕</button>
              </div>

              <div className="drawer-scroll-body">

                {/* CANCELLATION REQUEST DETAILS & ACTION WORKFLOW */}
                {(activeOrder.status === "Cancellation Requested" || activeOrder.status === "Cancelled" || activeOrder.refundStatus) && (
                  <div className="drawer-info-section-card" style={{ border: "2px solid #C8A165", background: "rgba(200, 161, 101, 0.03)" }}>
                    <h4 style={{ color: "#8B7355", display: "flex", justifyContent: "space-between" }}>
                      <span>Order Cancellation Details</span>
                      <span className="badge-payment pending" style={{ textTransform: "uppercase", fontSize: "10px" }}>
                        {activeOrder.status}
                      </span>
                    </h4>
                    
                    <div style={{ fontSize: "13px", lineHeight: "1.6", display: "flex", flexDirection: "column", gap: "8px", marginTop: "10px" }}>
                      <p><strong>Reason:</strong> {activeOrder.cancellationReason || "Not specified"}</p>
                      {activeOrder.cancellationComments && (
                        <p><strong>Comments:</strong> <em style={{ color: "#6B7280" }}>"{activeOrder.cancellationComments}"</em></p>
                      )}
                      
                      {activeOrder.cancelledAt && (
                        <p><strong>Requested At:</strong> {new Date(activeOrder.cancelledAt).toLocaleString()}</p>
                      )}

                      <hr style={{ border: "0", borderTop: "1px dashed #ECE7DF", margin: "8px 0" }} />

                      <p><strong>Payment Method:</strong> {activeOrder.paymentMethod}</p>
                      <p><strong>Refund Amount:</strong> <strong style={{ color: "#C8A165" }}>₹{activeOrder.refundAmount || activeOrder.totalAmount}</strong></p>
                      <p><strong>Refund Status:</strong> <strong style={{ textTransform: "uppercase" }}>{activeOrder.refundStatus || "None"}</strong></p>
                      
                      {activeOrder.refundTransactionId && (
                        <p><strong>Refund Tx ID:</strong> <code>{activeOrder.refundTransactionId}</code></p>
                      )}
                      {activeOrder.refundDate && (
                        <p><strong>Refund Date:</strong> {new Date(activeOrder.refundDate).toLocaleString()}</p>
                      )}
                      {activeOrder.refundRemarks && (
                        <p><strong>Refund Remarks:</strong> {activeOrder.refundRemarks}</p>
                      )}

                      {/* Admin Actions */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "14px" }}>
                        {activeOrder.status === "Cancellation Requested" && (
                          <>
                            <button 
                              onClick={() => handleApproveCancellation(activeOrder._id)}
                              className="btn-admin-secondary"
                              style={{ width: "100%", height: "36px" }}
                            >
                              Approve Cancellation
                            </button>
                            
                            {!showRejectionForm ? (
                              <button 
                                onClick={() => setShowRejectionForm(true)}
                                className="btn-admin-outline"
                                style={{ width: "100%", height: "36px", borderColor: "#DC2626", color: "#DC2626" }}
                              >
                                Reject Cancellation
                              </button>
                            ) : (
                              <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "12px", border: "1px solid #ECE7DF", borderRadius: "12px", background: "#FFFFFF" }}>
                                <label style={{ fontSize: "11px", fontWeight: "700" }}>Reason for Rejection</label>
                                <textarea 
                                  placeholder="Enter reason (e.g. Package already shipped)..."
                                  value={rejectionReason}
                                  onChange={(e) => setRejectionReason(e.target.value)}
                                  rows={2}
                                  style={{ width: "100%", padding: "8px", fontSize: "12.5px", borderRadius: "6px", border: "1px solid #ECE7DF" }}
                                />
                                <div style={{ display: "flex", gap: "8px" }}>
                                  <button 
                                    onClick={() => handleRejectCancellation(activeOrder._id)}
                                    className="btn-admin-secondary"
                                    style={{ flex: 1, height: "30px", fontSize: "11px" }}
                                  >
                                    Submit Reject
                                  </button>
                                  <button 
                                    onClick={() => setShowRejectionForm(false)}
                                    className="btn-admin-outline"
                                    style={{ flex: 1, height: "30px", fontSize: "11px" }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        )}

                        {activeOrder.status === "Cancelled" && activeOrder.refundStatus === "Initiated" && (
                          <>
                            {!showRefundForm ? (
                              <button 
                                onClick={() => setShowRefundForm(true)}
                                className="btn-admin-secondary"
                                style={{ width: "100%", height: "36px" }}
                              >
                                Mark Refund Completed
                              </button>
                            ) : (
                              <div style={{ display: "flex", flexDirection: "column", gap: "8px", padding: "12px", border: "1px solid #ECE7DF", borderRadius: "12px", background: "#FFFFFF" }}>
                                <label style={{ fontSize: "11px", fontWeight: "700" }}>Refund Transaction ID</label>
                                <input 
                                  type="text"
                                  placeholder="Txn ID reference..."
                                  value={refundTxId}
                                  onChange={(e) => setRefundTxId(e.target.value)}
                                  style={{ width: "100%", padding: "8px", fontSize: "12.5px", borderRadius: "6px", border: "1px solid #ECE7DF" }}
                                />
                                <div style={{ display: "flex", gap: "8px" }}>
                                  <button 
                                    onClick={() => handleUpdateRefund(activeOrder._id, "Refunded")}
                                    className="btn-admin-secondary"
                                    style={{ flex: 1, height: "30px", fontSize: "11px" }}
                                  >
                                    Save Completed
                                  </button>
                                  <button 
                                    onClick={() => setShowRefundForm(false)}
                                    className="btn-admin-outline"
                                    style={{ flex: 1, height: "30px", fontSize: "11px" }}
                                  >
                                    Cancel
                                  </button>
                                </div>
                              </div>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                )}
                
                {/* 1. CUSTOMER INFO CARD */}
                <div className="drawer-info-section-card">
                  <h4>Customer Profile</h4>
                  <div className="customer-details-block">
                    <p><strong>Name:</strong> {activeOrder.customerName || "Guest"}</p>
                    <p><strong>Email:</strong> {activeOrder.customerEmail}</p>
                    <p><strong>Phone:</strong> {activeOrder.customerPhone}</p>
                    <div style={{ marginTop: "10px", padding: "10px", background: "#FAF9F6", borderRadius: "8px" }}>
                      <p style={{ fontSize: "11px", fontWeight: "700", color: "#6B7280", margin: "0 0 4px 0" }}>SHIPPING ADDRESS</p>
                      <p style={{ fontSize: "12.5px", margin: "0" }}>
                        {activeOrder.shippingAddress?.fullName} ({activeOrder.shippingAddress?.phone})<br />
                        {activeOrder.shippingAddress?.addressLine1}, {activeOrder.shippingAddress?.addressLine2}<br />
                        {activeOrder.shippingAddress?.city}, {activeOrder.shippingAddress?.state} - {activeOrder.shippingAddress?.pincode}
                      </p>
                    </div>
                  </div>
                </div>

                {/* 2. ORDER PRIORITY & TAGS CONFIGURATION */}
                <div className="drawer-info-section-card">
                  <h4>Priority & Operational Tags</h4>
                  
                  <div style={{ display: "flex", gap: "10px", marginBottom: "12px" }}>
                    <div style={{ flex: 1 }}>
                      <label style={{ fontSize: "11px", fontWeight: "700" }}>Set Order Priority</label>
                      <select 
                        value={activeOrder.priority || "Medium"} 
                        onChange={(e) => handleUpdateOrderDetails({ priority: e.target.value }, "Priority updated!")}
                        style={{ height: "36px", marginTop: "4px", width: "100%" }}
                      >
                        <option value="High">High</option>
                        <option value="Medium">Medium</option>
                        <option value="Low">Low</option>
                      </select>
                    </div>
                  </div>

                  <div>
                    <label style={{ fontSize: "11px", fontWeight: "700" }}>Order Tags</label>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px", margin: "6px 0" }}>
                      {(activeOrder.tags || []).map((tag, idx) => (
                        <span key={idx} className="interactive-tag-badge">
                          {tag}
                          <button onClick={() => {
                            const filtered = activeOrder.tags.filter(t => t !== tag);
                            handleUpdateOrderDetails({ tags: filtered }, "Tag removed!");
                          }}>×</button>
                        </span>
                      ))}
                    </div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                      <input 
                        type="text" 
                        placeholder="Add tag (e.g. VIP)" 
                        value={newTag}
                        onChange={(e) => setNewTag(e.target.value)}
                        style={{ height: "32px", padding: "0 10px", fontSize: "12px", flex: 1 }}
                      />
                      <button 
                        onClick={() => {
                          if (!newTag.trim()) return;
                          const updated = [...(activeOrder.tags || []), newTag.trim()];
                          handleUpdateOrderDetails({ tags: updated }, "Tag added!");
                          setNewTag("");
                        }}
                        style={{ height: "32px", background: "#C8A165", border: "none", color: "#FFF", padding: "0 12px", borderRadius: "6px", cursor: "pointer" }}
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>

                {/* 3. PRODUCTS LIST & PACKING CHECKLIST */}
                <div className="drawer-info-section-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <h4>Packing Checklist Workflow</h4>
                    <button 
                      onClick={() => downloadInvoice(activeOrder._id)}
                      className="btn-admin-outline"
                      style={{ fontSize: "11px", padding: "4px 10px" }}
                    >
                      Print Label
                    </button>
                  </div>
                  
                  <div className="checklist-items-stack">
                    {(activeOrder.items || []).map((item) => (
                      <div key={item._id} className="checklist-item-row">
                        <input 
                          type="checkbox" 
                          checked={!!packingChecklist[item._id]}
                          onChange={(e) => {
                            setPackingChecklist({
                              ...packingChecklist,
                              [item._id]: e.target.checked
                            });
                          }}
                        />
                        <img 
                          src={item.productImage || "/cosmetic_1.avif"} 
                          alt={item.productName} 
                          onError={(e) => { e.target.src = "/cosmetic_1.avif"; }}
                        />
                        <div style={{ flex: 1 }}>
                          <h5>{item.productName}</h5>
                          <small>Qty: <strong>{item.qty}</strong> | Price: <strong>₹{item.price}</strong></small>
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Checklist Submit action */}
                  <div style={{ marginTop: "14px" }}>
                    <button 
                      onClick={() => {
                        const allChecked = Object.values(packingChecklist).every(val => val === true);
                        if (!allChecked) {
                          toast.error("Please verify quantity checklist checkbox on all items first!");
                          return;
                        }
                        handleUpdateOrderDetails({ status: "Packed" }, "Order verified and marked Packed! 📦");
                      }}
                      className="btn-admin-secondary" 
                      style={{ width: "100%", height: "38px" }}
                    >
                      Verify Checklist & Mark Packed
                    </button>
                  </div>
                </div>

                {/* 4. SHIPPING / COURIER MANAGER */}
                <div className="drawer-info-section-card">
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                    <h4>Courier & Tracking Management</h4>
                    <button 
                      onClick={() => setEditingTracking(!editingTracking)} 
                      className="btn-admin-outline"
                      style={{ fontSize: "11px", padding: "4px 8px" }}
                    >
                      {editingTracking ? "Cancel" : "Edit tracking"}
                    </button>
                  </div>

                  {editingTracking ? (
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }} className="tracking-form-drawer">
                      <input 
                        type="text" 
                        placeholder="Courier Name (e.g. Bluedart)" 
                        value={trackingForm.courier}
                        onChange={(e) => setTrackingForm({ ...trackingForm, courier: e.target.value })}
                      />
                      <input 
                        type="text" 
                        placeholder="Tracking Number" 
                        value={trackingForm.trackingNumber}
                        onChange={(e) => setTrackingForm({ ...trackingForm, trackingNumber: e.target.value })}
                      />
                      <div>
                        <label style={{ fontSize: "10px" }}>Expected Delivery</label>
                        <input 
                          type="date" 
                          value={trackingForm.expectedDeliveryDate}
                          onChange={(e) => setTrackingForm({ ...trackingForm, expectedDeliveryDate: e.target.value })}
                        />
                      </div>
                      <div>
                        <label style={{ fontSize: "10px" }}>Dispatch Date</label>
                        <input 
                          type="date" 
                          value={trackingForm.dispatchDate}
                          onChange={(e) => setTrackingForm({ ...trackingForm, dispatchDate: e.target.value })}
                        />
                      </div>
                      <input 
                        type="number" 
                        placeholder="Shipping Cost" 
                        value={trackingForm.shippingCost}
                        onChange={(e) => setTrackingForm({ ...trackingForm, shippingCost: e.target.value })}
                      />
                      <button 
                        onClick={() => {
                          handleUpdateOrderDetails(trackingForm, "Courier dispatch info saved!");
                          setEditingTracking(false);
                        }}
                        className="btn-admin-secondary"
                        style={{ height: "34px", marginTop: "6px" }}
                      >
                        Save Dispatch Details
                      </button>
                    </div>
                  ) : (
                    <div className="shipping-tracking-details-preview">
                      <p><strong>Courier Partner:</strong> {activeOrder.courier || "Not configured"}</p>
                      <p><strong>Tracking Waybill:</strong> {activeOrder.trackingNumber || "Not configured"}</p>
                      <p><strong>Shipping Cost:</strong> ₹{activeOrder.shippingCost || 0}</p>
                      {activeOrder.expectedDeliveryDate && (
                        <p><strong>Expected Delivery:</strong> {new Date(activeOrder.expectedDeliveryDate).toLocaleDateString()}</p>
                      )}
                      {activeOrder.dispatchDate && (
                        <p><strong>Dispatch Date:</strong> {new Date(activeOrder.dispatchDate).toLocaleDateString()}</p>
                      )}
                    </div>
                  )}

                  {/* Shipment transitions quick actions */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginTop: "14px" }}>
                    <button 
                      onClick={() => handleUpdateOrderDetails({ status: "Shipped" }, "Order status set to Shipped!")} 
                      className="btn-admin-outline"
                    >
                      Ship Order
                    </button>
                    <button 
                      onClick={() => handleUpdateOrderDetails({ status: "Out For Delivery" }, "Order is Out For Delivery!")} 
                      className="btn-admin-outline"
                    >
                      Out For Delivery
                    </button>
                    <button 
                      onClick={() => handleUpdateOrderDetails({ status: "Delivered" }, "Order set to Delivered!")} 
                      className="btn-admin-secondary" 
                      style={{ gridColumn: "span 2" }}
                    >
                      Deliver Package
                    </button>
                  </div>
                </div>

                {/* 5. INTERNAL NOTES LOG */}
                <div className="drawer-info-section-card">
                  <h4>Internal Admin Notes Logs</h4>
                  
                  <div className="notes-list-stack">
                    {!(activeOrder.adminNotesLog?.length > 0) ? (
                      <p style={{ fontSize: "12.5px", color: "#9CA3AF", fontStyle: "italic" }}>No internal operations log recorded.</p>
                    ) : (
                      activeOrder.adminNotesLog.map((log, idx) => (
                        <div key={idx} className="note-item-log">
                          <p className="note-txt">{log.noteText}</p>
                          <small>{log.adminName} @ {new Date(log.timestamp).toLocaleString("en-IN", { timeStyle: "short", dateStyle: "short" })}</small>
                        </div>
                      ))
                    )}
                  </div>

                  <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
                    <input 
                      type="text" 
                      placeholder="Type internal operations note..." 
                      value={newNote}
                      onChange={(e) => setNewNote(e.target.value)}
                      style={{ height: "36px", padding: "0 10px", fontSize: "12.5px", flex: 1 }}
                    />
                    <button 
                      onClick={() => {
                        if (!newNote.trim()) return;
                        handleUpdateOrderDetails({ adminNote: newNote.trim() }, "Note recorded successfully!");
                        setNewNote("");
                      }}
                      style={{ height: "36px", background: "#1F2937", border: "none", color: "#FFF", padding: "0 14px", borderRadius: "8px", cursor: "pointer" }}
                    >
                      Log
                    </button>
                  </div>
                </div>

                {/* 6. ORDER ACTIVITY TIMELINE */}
                <div className="drawer-info-section-card">
                  <h4>Order Activity Timeline</h4>
                  <div className="drawer-timeline-stack">
                    {(activeOrder.orderTimeline || []).map((tl, idx) => (
                      <div key={idx} className="timeline-node-item">
                        <div className="node-icon">✓</div>
                        <div className="node-details">
                          <h5>{tl.status}</h5>
                          <p>Updated by: {tl.updatedBy}</p>
                          <small>{new Date(tl.timestamp).toLocaleString()}</small>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminOrders;
