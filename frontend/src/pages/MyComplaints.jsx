import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";
import "../styles/complaints.css";

const MyComplaints = () => {
  const { user } = useContext(AuthContext);
  const [complaints, setComplaints] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchComplaints = async () => {
      try {
        const config = {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        };
        const { data } = await axios.get("/api/complaints/my", config);
        if (data.success) {
          setComplaints(data.complaints);
        }
      } catch (error) {
        toast.error(error.response?.data?.message || "Failed to fetch complaints");
      } finally {
        setLoading(false);
      }
    };

    if (user && user.token) {
      fetchComplaints();
    }
  }, [user]);

  const getStatusClass = (status) => {
    switch (status) {
      case "Pending":
        return "pending";
      case "In Progress":
        return "in-progress";
      case "Resolved":
        return "resolved";
      case "Closed":
        return "closed";
      default:
        return "pending";
    }
  };

  const formatDate = (dateStr) => {
    return new Date(dateStr).toLocaleDateString("en-IN", {
      year: "numeric",
      month: "long",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="complaints-page" style={{ textAlign: "center", padding: "100px 0" }}>
        <span className="spinner" style={{ display: "inline-block", borderColor: "rgba(0,0,0,0.1)", borderTopColor: "#C8A96B", width: "40px", height: "40px" }}></span>
        <p style={{ marginTop: "20px", color: "#6B7280" }}>Loading complaints history...</p>
      </div>
    );
  }

  return (
    <div className="complaints-page">
      <h1>My Support Tickets</h1>

      {complaints.length === 0 ? (
        <div className="empty-state">
          <p>You have not submitted any support complaints or tickets yet.</p>
          <Link to="/contact">Create a Ticket / Contact Us</Link>
        </div>
      ) : (
        <div className="complaints-grid">
          {complaints.map((ticket) => (
            <div key={ticket._id} className="complaint-card">
              <div className="complaint-card-header">
                <div>
                  <h3>
                    {ticket.subject}
                    <span className="ticket-id">#{ticket._id.substring(ticket._id.length - 8)}</span>
                  </h3>
                  <div className="complaint-meta" style={{ marginTop: "5px" }}>
                    <span>
                      Category: <strong>{ticket.category}</strong>
                    </span>
                    <span>
                      Date: <strong>{formatDate(ticket.createdAt)}</strong>
                    </span>
                    {ticket.orderNumber && (
                      <span>
                        Order: <strong>{ticket.orderNumber}</strong>
                      </span>
                    )}
                  </div>
                </div>

                <span className={`status-badge ${getStatusClass(ticket.status)}`}>
                  {ticket.status}
                </span>
              </div>

              <div className="complaint-body">
                <p style={{ whiteSpace: "pre-wrap" }}>{ticket.message}</p>
              </div>

              {ticket.adminReply && (
                <div className="reply-box">
                  <h5>Response from Customer Care</h5>
                  <p style={{ whiteSpace: "pre-wrap" }}>{ticket.adminReply}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyComplaints;
