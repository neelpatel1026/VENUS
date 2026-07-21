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
          setComplaints(data.complaints || []);
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
      month: "short",
      day: "numeric",
    });
  };

  if (loading) {
    return (
      <div className="complaints-page route-fade-in" style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px" }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ border: "1px solid #ECE7DF", background: "#FFFFFF", padding: "24px", borderRadius: "16px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "16px" }}>
                <div style={{ flex: 1 }}>
                  <div className="shimmer-bg" style={{ height: "20px", width: "180px", borderRadius: "4px", marginBottom: "8px" }} />
                  <div className="shimmer-bg" style={{ height: "14px", width: "120px", borderRadius: "4px" }} />
                </div>
                <div className="shimmer-bg" style={{ height: "28px", width: "80px", borderRadius: "20px" }} />
              </div>
              <div className="shimmer-bg skeleton-text-line" />
              <div className="shimmer-bg skeleton-text-line short" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="complaints-page route-fade-in">
      {complaints.length === 0 ? (
        <div 
          style={{ 
            textAlign: 'center', 
            padding: '60px 20px', 
            background: '#FFFFFF', 
            border: '1px solid #ECE7DF', 
            borderRadius: '24px',
            maxWidth: '500px',
            margin: '40px auto'
          }}
        >
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="#C9A45C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '20px' }}>
            <path d="M12 50h40l8-14H4L12 50z" />
            <path d="M18 36V18a14 14 0 1 1 28 0v18" />
            <circle cx="32" cy="18" r="3" />
          </svg>
          <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#1A1A1A', margin: '0 0 10px 0' }}>
            No Support Tickets
          </h3>
          <p style={{ color: '#6B7280', lineHeight: '1.6', margin: '0 0 24px 0', fontSize: '0.95rem' }}>
            You have not submitted any customer care complaints or assistance tickets yet. Feel free to contact us with any questions.
          </p>
          <Link
            to="/contact"
            style={{
              background: '#C8A165',
              color: '#FFFFFF',
              border: 'none',
              padding: '12px 28px',
              borderRadius: '30px',
              fontSize: '0.95rem',
              fontWeight: '600',
              cursor: 'pointer',
              textDecoration: 'none',
              display: 'inline-block',
              transition: 'all 0.2s ease'
            }}
          >
            Create Support Ticket
          </Link>
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
