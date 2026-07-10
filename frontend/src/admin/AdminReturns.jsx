import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import AdminSidebar from "./AdminSidebar";

const AdminReturns = () => {
  const { user } = useContext(AuthContext);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReturns = async () => {
    try {
      const { data } = await axios.get("/api/returns", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      setReturns(data);
    } catch (error) {
      console.log(error);
      toast.error("Failed to load return requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchReturns();
    }
  }, [user]);

  const updateStatus = async (id, status) => {
    try {
      await axios.put(
        `/api/returns/${id}`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      toast.success(`Return request status updated to ${status}`);
      fetchReturns();
    } catch (error) {
      console.log(error);
      toast.error("Failed to update status");
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
            <h2>Return Requests</h2>
            <p>Process product refund applications, inspect issues, and execute payouts.</p>
          </div>
        </div>

        {/* RETURNS TABLE */}
        <div className="admin-table-container">
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--admin-text-muted)" }}>
              Loading return queries...
            </div>
          ) : returns.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--admin-text-muted)" }}>
              No active return request statements found.
            </div>
          ) : (
            <table className="admin-premium-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Customer Reason</th>
                  <th>Status</th>
                  <th>Uploaded Proof</th>
                  <th>Update Status</th>
                </tr>
              </thead>
              <tbody>
                {returns.map((item) => {
                  const oId = item.orderId?._id 
                    ? `#${item.orderId._id.slice(-8).toUpperCase()}`
                    : `#${item.orderId ? String(item.orderId).slice(-8).toUpperCase() : "N/A"}`;
                  return (
                    <tr key={item._id}>
                      <td>
                        <strong style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>{oId}</strong>
                      </td>
                      <td>
                        <span style={{ fontSize: "0.88rem", color: "var(--admin-text-main)" }}>
                          {item.reason}
                        </span>
                      </td>
                      <td>
                        <span className={`status-pill pill-${item.status.toLowerCase().replace(/\s+/g, "-")}`}>
                          {item.status}
                        </span>
                      </td>
                      <td>
                        {item.returnImages && item.returnImages.length > 0 ? (
                          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
                            {item.returnImages.map((imgUrl, index) => (
                              <a
                                key={index}
                                href={imgUrl}
                                target="_blank"
                                rel="noreferrer"
                              >
                                <img
                                  src={imgUrl}
                                  alt={`Proof ${index + 1}`}
                                  style={{
                                    width: "36px",
                                    height: "36px",
                                    borderRadius: "4px",
                                    objectFit: "cover",
                                    border: "1px solid var(--admin-border)",
                                    cursor: "zoom-in"
                                  }}
                                />
                              </a>
                            ))}
                          </div>
                        ) : (
                          <span style={{ fontSize: "0.8rem", color: "var(--admin-text-muted)" }}>No media proof</span>
                        )}
                      </td>
                      <td>
                        <select
                          value={item.status}
                          onChange={(e) => updateStatus(item._id, e.target.value)}
                          className="admin-form-input"
                          style={{ padding: "6px 12px", fontSize: "0.8rem", width: "auto", minWidth: "140px" }}
                        >
                          <option value="Pending">Pending</option>
                          <option value="Approved">Approved</option>
                          <option value="Pickup Scheduled">Pickup Scheduled</option>
                          <option value="Picked Up">Picked Up</option>
                          <option value="Refunded">Refunded</option>
                          <option value="Rejected">Rejected</option>
                        </select>
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

export default AdminReturns;
