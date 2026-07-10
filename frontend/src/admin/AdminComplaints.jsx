import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";
import AdminSidebar from "./AdminSidebar";

const AdminComplaints = () => {
  const { user } = useContext(AuthContext);

  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  // Filters state
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState("");
  const [priority, setPriority] = useState("");
  const [category, setCategory] = useState("");
  const [sort, setSort] = useState("newest");

  const fetchComplaints = async () => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const params = {};
      if (search) params.search = search;
      if (status) params.status = status;
      if (priority) params.priority = priority;
      if (category) params.category = category;
      if (sort) params.sort = sort;

      const { data } = await axios.get("/api/complaints", { ...config, params });

      if (data.success) {
        setComplaints(data.complaints);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to load complaints");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user && user.token) {
      fetchComplaints();
    }
  }, [user, search, status, priority, category, sort]);

  const updateStatus = async (id, newStatus) => {
    try {
      const config = {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      };

      const { data } = await axios.put(
        `/api/complaints/${id}/status`,
        { status: newStatus },
        config
      );

      if (data.success) {
        toast.success("Ticket status updated successfully!");
        fetchComplaints();
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to update status");
    }
  };

  return (
    <div className="admin-layout-wrapper">
      {/* LEFT COLUMN: SIDEBAR */}
      <AdminSidebar />

      {/* RIGHT COLUMN: MAIN CONTENT */}
      <div className="admin-content-console">
        <div className="admin-page-header">
          <div>
            <h2>Support Tickets</h2>
            <p>Resolve customer complaints, track priority tickets, and update feedback.</p>
          </div>
        </div>

        {/* FILTERS CONTAINER */}
        <div className="admin-table-container" style={{ padding: "20px", marginBottom: "20px" }}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "12px" }}>
            <input
              type="text"
              placeholder="Search by ID or Subject..."
              className="admin-search-input"
              style={{ width: "100%", minWidth: "auto" }}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
            <select
              value={status}
              onChange={(e) => setStatus(e.target.value)}
              className="admin-form-input"
              style={{ width: "100%" }}
            >
              <option value="">All Statuses</option>
              <option value="Open">Open</option>
              <option value="In Progress">In Progress</option>
              <option value="Resolved">Resolved</option>
              <option value="Closed">Closed</option>
            </select>
            <select
              value={priority}
              onChange={(e) => setPriority(e.target.value)}
              className="admin-form-input"
              style={{ width: "100%" }}
            >
              <option value="">All Priorities</option>
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>
        </div>

        {/* COMPLAINTS TABLE */}
        <div className="admin-table-container">
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--admin-text-muted)" }}>
              Loading ticket queue...
            </div>
          ) : complaints.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--admin-text-muted)" }}>
              No support tickets found matching filters.
            </div>
          ) : (
            <table className="admin-premium-table">
              <thead>
                <tr>
                  <th>Ticket ID</th>
                  <th>Customer Email</th>
                  <th>Subject</th>
                  <th>Priority</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {complaints.map((ticket) => {
                  const tId = `#${ticket._id.slice(-8).toUpperCase()}`;
                  return (
                    <tr key={ticket._id}>
                      <td>
                        <strong style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>{tId}</strong>
                      </td>
                      <td>
                        <strong style={{ fontWeight: "600" }}>{ticket.user?.email || "Guest"}</strong>
                      </td>
                      <td>{ticket.subject}</td>
                      <td>
                        <span className={`status-pill ${ticket.priority === 'High' ? 'pill-rejected' : ticket.priority === 'Medium' ? 'pill-pending' : 'pill-active'}`}>
                          {ticket.priority}
                        </span>
                      </td>
                      <td>
                        <select
                          value={ticket.status}
                          onChange={(e) => updateStatus(ticket._id, e.target.value)}
                          className="admin-form-input"
                          style={{ padding: "6px 12px", fontSize: "0.8rem", width: "auto", minWidth: "120px" }}
                        >
                          <option value="Open">Open</option>
                          <option value="In Progress">In Progress</option>
                          <option value="Resolved">Resolved</option>
                          <option value="Closed">Closed</option>
                        </select>
                      </td>
                      <td>
                        <Link to={`/admin/complaints/${ticket._id}`} className="btn-admin-outline">
                          View Details
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminComplaints;
