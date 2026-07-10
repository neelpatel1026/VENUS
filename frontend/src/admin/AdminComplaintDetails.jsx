import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { useParams, Link } from "react-router-dom";
import toast from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";
import AdminSidebar from "./AdminSidebar";

const AdminComplaintDetails = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);

  const [complaint, setComplaint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

  // Form edit states
  const [status, setStatus] = useState("Pending");
  const [priority, setPriority] = useState("Medium");
  const [adminReply, setAdminReply] = useState("");
  const [internalNotes, setInternalNotes] = useState("");

  const fetchDetails = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.get(`/api/complaints/${id}`, config);

      if (data.success) {
        setComplaint(data.complaint);
        setStatus(data.complaint.status);
        setPriority(data.complaint.priority);
        setAdminReply(data.complaint.adminReply || "");
        setInternalNotes(data.complaint.internalNotes || "");
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load complaint details");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.token) {
      fetchDetails();
    }
  }, [user, id]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setUpdating(true);

    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.put(
        `/api/complaints/${id}`,
        { status, priority, adminReply, internalNotes },
        config
      );

      if (data.success) {
        toast.success("Ticket details updated successfully!");
        setComplaint(data.complaint);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save updates");
    } finally {
      setUpdating(false);
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  if (loading) {
    return (
      <div className="admin-layout-wrapper">
        <AdminSidebar />
        <div className="admin-content-console" style={{ textAlign: "center", padding: "100px 0" }}>
          <p style={{ color: "var(--admin-text-muted)" }}>Loading complaint details...</p>
        </div>
      </div>
    );
  }

  if (!complaint) {
    return (
      <div className="admin-layout-wrapper">
        <AdminSidebar />
        <div className="admin-content-console" style={{ textAlign: "center", padding: "80px 20px" }}>
          <h2>Ticket Not Found</h2>
          <p style={{ color: "var(--admin-text-muted)", marginBottom: "20px" }}>
            The ticket ID may be incorrect, or you may not have permission to view it.
          </p>
          <Link to="/admin/complaints" className="btn-admin-primary">
            Back to Complaints
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="admin-layout-wrapper">
      {/* LEFT COLUMN: SIDEBAR */}
      <AdminSidebar />

      {/* RIGHT COLUMN: MAIN CONTENT */}
      <div className="admin-content-console">
        <div className="admin-page-header">
          <div style={{ display: "flex", alignItems: "center", gap: "12px", flexWrap: "wrap" }}>
            <h2>Ticket Details</h2>
            <span className={`status-pill pill-${complaint.status.toLowerCase().replace(/\s+/g, "-")}`}>
              {complaint.status}
            </span>
          </div>
          <Link to="/admin/complaints" className="btn-admin-secondary">
            Back to Directory
          </Link>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "30px", alignItems: "start" }}>
          {/* LEFT SIDE: TICKET CARD */}
          <div className="admin-form-card" style={{ maxWidth: "100%" }}>
            <h3 style={{ fontSize: "1.2rem", fontWeight: "700", marginBottom: "6px" }}>
              {complaint.subject}
            </h3>
            <span style={{ fontSize: "0.82rem", color: "var(--admin-text-muted)", display: "block", marginBottom: "24px" }}>
              ID: #{complaint._id.toUpperCase()}
            </span>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
              <div>
                <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--admin-text-muted)", uppercase: true }}>
                  Customer Name
                </span>
                <p style={{ fontWeight: "600", margin: "4px 0 0 0" }}>{complaint.name}</p>
              </div>
              <div>
                <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--admin-text-muted)", uppercase: true }}>
                  Email Address
                </span>
                <p style={{ fontWeight: "600", margin: "4px 0 0 0" }}>{complaint.email}</p>
              </div>
              <div>
                <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--admin-text-muted)", uppercase: true }}>
                  Phone Number
                </span>
                <p style={{ fontWeight: "600", margin: "4px 0 0 0" }}>{complaint.phone || "N/A"}</p>
              </div>
              <div>
                <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--admin-text-muted)", uppercase: true }}>
                  Category
                </span>
                <p style={{ fontWeight: "600", margin: "4px 0 0 0" }}>{complaint.category}</p>
              </div>
              <div>
                <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--admin-text-muted)", uppercase: true }}>
                  Order Number
                </span>
                <p style={{ fontWeight: "600", margin: "4px 0 0 0" }}>{complaint.orderNumber || "No Linked Order"}</p>
              </div>
              <div>
                <span style={{ fontSize: "0.78rem", fontWeight: "600", color: "var(--admin-text-muted)", uppercase: true }}>
                  Submitted Date
                </span>
                <p style={{ fontWeight: "600", margin: "4px 0 0 0" }}>{formatDate(complaint.createdAt)}</p>
              </div>
            </div>

            <div style={{ background: "#FAFAF9", padding: "16px 20px", borderRadius: "10px", border: "1px solid var(--admin-border)", marginBottom: "20px" }}>
              <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "var(--admin-text-muted)", textTransform: "uppercase" }}>
                Customer message
              </span>
              <p style={{ fontSize: "0.9rem", color: "var(--admin-text-main)", margin: "8px 0 0 0", lineHeight: "1.6" }}>
                {complaint.message}
              </p>
            </div>
          </div>

          {/* RIGHT SIDE: OPERATIONS PANEL */}
          <div className="admin-form-card" style={{ maxWidth: "100%" }}>
            <h3 style={{ marginBottom: "20px", fontWeight: "600", fontSize: "1.1rem" }}>
              Ticket Operations
            </h3>

            <form onSubmit={handleUpdate}>
              <div className="admin-form-group">
                <label>Update Status</label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="admin-form-input"
                >
                  <option value="Pending">Pending</option>
                  <option value="In Progress">In Progress</option>
                  <option value="Resolved">Resolved</option>
                  <option value="Closed">Closed</option>
                </select>
              </div>

              <div className="admin-form-group">
                <label>Set Priority</label>
                <select
                  value={priority}
                  onChange={(e) => setPriority(e.target.value)}
                  className="admin-form-input"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Urgent">Urgent</option>
                </select>
              </div>

              <div className="admin-form-group">
                <label>Internal Operations Notes</label>
                <textarea
                  rows="3"
                  className="admin-form-input"
                  placeholder="Private notes (internal staff audit logging only)..."
                  value={internalNotes}
                  onChange={(e) => setInternalNotes(e.target.value)}
                />
              </div>

              <div className="admin-form-group">
                <label>Reply to Customer</label>
                <textarea
                  rows="4"
                  className="admin-form-input"
                  placeholder="Type reply message visible directly on the user's details panel..."
                  value={adminReply}
                  onChange={(e) => setAdminReply(e.target.value)}
                />
              </div>

              <button type="submit" className="btn-admin-primary" disabled={updating}>
                {updating ? "Saving Changes..." : "Save Actions Settings"}
              </button>
            </form>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminComplaintDetails;
