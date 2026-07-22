import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import toast from "react-hot-toast";
import AdminSidebar from "./AdminSidebar";
import { HiStar, HiTrash, HiEye, HiEyeOff } from "react-icons/hi";

const AdminReviews = () => {
  const { user } = useContext(AuthContext);
  const [reviews, setReviews] = useState([]);
  const [loading, setLoading] = useState(true);
  const [campaignStats, setCampaignStats] = useState({
    totalRemindersSent: 0,
    totalReviewsCount: 0,
    pendingEligibleOrders: 0,
    conversionRate: 0,
  });
  
  // Search and Filter states
  const [searchTerm, setSearchTerm] = useState("");
  const [ratingFilter, setRatingFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);

  // Reply Modal states
  const [showReplyModal, setShowReplyModal] = useState(false);
  const [replyText, setReplyText] = useState("");
  const [replyingReviewId, setReplyingReviewId] = useState("");

  useEffect(() => {
    const fetchCampaignStats = async () => {
      if (!user?.token) return;
      try {
        const res = await fetch("/api/reviews/admin/campaign-stats", {
          headers: { Authorization: `Bearer ${user.token}` },
        });
        if (res.ok) {
          const data = await res.json();
          setCampaignStats(data.stats);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchCampaignStats();
  }, [user]);

  const fetchReviews = async () => {
    if (!user?.token) return;
    try {
      setLoading(true);
      const query = new URLSearchParams({
        page,
        limit: 10,
        search: searchTerm,
        rating: ratingFilter,
        status: statusFilter === "reported" ? "" : statusFilter,
        reported: statusFilter === "reported" ? "true" : "",
      });

      const res = await fetch(`/api/reviews/admin?${query.toString()}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      const data = await res.json();
      if (res.ok) {
        setReviews(data.reviews || []);
        setTotalPages(data.pagination?.pages || 1);
      } else {
        toast.error(data.message || "Failed to load reviews");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error loading reviews");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReviews();
  }, [user, page, ratingFilter, statusFilter]);

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    setPage(1);
    fetchReviews();
  };

  const toggleVisibility = async (id, isHidden) => {
    try {
      const res = await fetch(`/api/reviews/admin/${id}/visibility`, {
        method: "PUT",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success(data.message || "Visibility toggled successfully");
        setReviews((prev) =>
          prev.map((r) => (r._id === id ? { ...r, isHidden: !isHidden } : r))
        );
      } else {
        toast.error(data.message || "Failed to toggle visibility");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error toggling visibility");
    }
  };

  const handleDelete = (id) => {
    toast((t) => (
      <div className="custom-confirm-toast">
        <p style={{ margin: "0 0 10px 0", fontWeight: "600", fontSize: "0.95rem" }}>
          Are you sure you want to permanently delete this customer review?
        </p>
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const res = await fetch(`/api/reviews/admin/${id}`, {
                  method: "DELETE",
                  headers: {
                    Authorization: `Bearer ${user.token}`,
                  },
                });

                if (res.ok) {
                  setReviews(reviews.filter((r) => r._id !== id));
                  toast.success("Review permanently deleted");
                } else {
                  const errData = await res.json();
                  toast.error(errData.message || "Failed to delete review");
                }
              } catch (error) {
                console.error(error);
                toast.error("Failed to delete review");
              }
            }}
            style={{
              background: "#DC2626",
              color: "#fff",
              border: "none",
              padding: "6px 14px",
              borderRadius: "6px",
              fontSize: "0.85rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Delete
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            style={{
              background: "#F3F4F6",
              color: "#1F2937",
              border: "1px solid #E5E7EB",
              padding: "6px 14px",
              borderRadius: "6px",
              fontSize: "0.85rem",
              fontWeight: "600",
              cursor: "pointer",
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    ), {
      duration: 8000,
      position: "top-center",
      style: {
        borderLeft: "4px solid #DC2626",
      },
    });
  };

  const handlePostReply = async (e) => {
    e.preventDefault();
    if (!replyText.trim() || !replyingReviewId) return;

    try {
      const res = await fetch(`/api/reviews/admin/${replyingReviewId}/reply`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ replyText: replyText.trim() }),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success("Merchant reply posted successfully");
        setReviews((prev) =>
          prev.map((r) =>
            r._id === replyingReviewId
              ? {
                  ...r,
                  merchantReply: {
                    replyText: replyText.trim(),
                    repliedAt: new Date(),
                  },
                }
              : r
          )
        );
        setShowReplyModal(false);
        setReplyText("");
        setReplyingReviewId("");
      } else {
        toast.error(data.message || "Failed to post merchant reply");
      }
    } catch (error) {
      console.error(error);
      toast.error("Error posting reply");
    }
  };

  return (
    <div className="admin-layout-wrapper route-fade-in">
      <AdminSidebar />

      <div className="admin-content-console">
        <div className="admin-page-header">
          <div>
            <h2>Product Reviews & Automation</h2>
            <p>Moderate customer ratings, verified purchases, and monitor automated email campaign metrics.</p>
          </div>
        </div>

        {/* REVIEW CAMPAIGN AUTOMATION STATS CARDS */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
          <div style={{ background: "#FFFFFF", padding: "18px 20px", borderRadius: "14px", border: "1px solid var(--admin-border)", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
            <div style={{ fontSize: "11px", textTransform: "uppercase", color: "#6B7280", fontWeight: "600", letterSpacing: "0.5px" }}>Reminders Sent</div>
            <div style={{ fontSize: "26px", fontWeight: "700", color: "#1A1A1A", marginTop: "4px" }}>{campaignStats.totalRemindersSent}</div>
            <div style={{ fontSize: "11px", color: "#C8A165", marginTop: "2px", fontWeight: "500" }}>Automated Dispatches</div>
          </div>
          <div style={{ background: "#FFFFFF", padding: "18px 20px", borderRadius: "14px", border: "1px solid var(--admin-border)", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
            <div style={{ fontSize: "11px", textTransform: "uppercase", color: "#6B7280", fontWeight: "600", letterSpacing: "0.5px" }}>Total Reviews</div>
            <div style={{ fontSize: "26px", fontWeight: "700", color: "#10B981", marginTop: "4px" }}>{campaignStats.totalReviewsCount}</div>
            <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "2px" }}>Verified Customer Reviews</div>
          </div>
          <div style={{ background: "#FFFFFF", padding: "18px 20px", borderRadius: "14px", border: "1px solid var(--admin-border)", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
            <div style={{ fontSize: "11px", textTransform: "uppercase", color: "#6B7280", fontWeight: "600", letterSpacing: "0.5px" }}>Response Rate</div>
            <div style={{ fontSize: "26px", fontWeight: "700", color: "#C8A165", marginTop: "4px" }}>{campaignStats.conversionRate}%</div>
            <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "2px" }}>Review Conversion</div>
          </div>
          <div style={{ background: "#FFFFFF", padding: "18px 20px", borderRadius: "14px", border: "1px solid var(--admin-border)", boxShadow: "0 2px 8px rgba(0,0,0,0.02)" }}>
            <div style={{ fontSize: "11px", textTransform: "uppercase", color: "#6B7280", fontWeight: "600", letterSpacing: "0.5px" }}>Active Queue</div>
            <div style={{ fontSize: "26px", fontWeight: "700", color: "#6366F1", marginTop: "4px" }}>{campaignStats.pendingEligibleOrders}</div>
            <div style={{ fontSize: "11px", color: "#6B7280", marginTop: "2px" }}>Delivered Pending Orders</div>
          </div>
        </div>

        {/* Filters and Search toolbar */}
        <div className="admin-table-container">
          <div className="admin-table-search-bar" style={{ display: "flex", flexWrap: "wrap", gap: "16px", padding: "20px" }}>
            <form onSubmit={handleSearchSubmit} style={{ display: "flex", flex: 1, gap: "10px" }}>
              <input
                type="text"
                placeholder="Search reviews by customer name or content..."
                className="admin-search-input"
                style={{ flex: 1, margin: 0 }}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
              <button type="submit" className="btn-admin-primary" style={{ padding: "10px 20px", fontSize: "14px" }}>
                Search
              </button>
            </form>

            <select
              value={ratingFilter}
              onChange={(e) => {
                setRatingFilter(e.target.value);
                setPage(1);
              }}
              style={{ padding: "10px", border: "1px solid #ECE7DF", borderRadius: "10px", minWidth: "140px" }}
            >
              <option value="">All Ratings</option>
              <option value="5">5 Stars</option>
              <option value="4">4 Stars</option>
              <option value="3">3 Stars</option>
              <option value="2">2 Stars</option>
              <option value="1">1 Star</option>
            </select>

            <select
              value={statusFilter}
              onChange={(e) => {
                setStatusFilter(e.target.value);
                setPage(1);
              }}
              style={{ padding: "10px", border: "1px solid #ECE7DF", borderRadius: "10px", minWidth: "140px" }}
            >
              <option value="">All Statuses</option>
              <option value="visible">Visible</option>
              <option value="hidden">Hidden</option>
              <option value="reported">Reported Only</option>
            </select>
          </div>

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center" }}>
              <div className="admin-table-loading-shimmer">
                {[...Array(5)].map((_, i) => (
                  <div key={i} className="shimmer-bg" style={{ height: "48px", width: "100%", borderRadius: "8px", marginBottom: "12px" }} />
                ))}
              </div>
            </div>
          ) : reviews.length === 0 ? (
            <div style={{ padding: "60px", textAlign: "center", color: "#6B7280" }}>
              No client product reviews found matching search terms.
            </div>
          ) : (
            <>
              <table className="admin-premium-table">
                <thead>
                  <tr>
                    <th>Product</th>
                    <th>Customer Name</th>
                    <th>Rating</th>
                    <th>Content</th>
                    <th>Verified</th>
                    <th>Visibility</th>
                    <th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {reviews.map((rev) => (
                    <tr key={rev._id}>
                      <td style={{ maxWidth: "200px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                          <img
                            src={rev.productId?.imageUrl || rev.productId?.image || "/cosmetic_1.avif"}
                            alt=""
                            style={{ width: "40px", height: "40px", borderRadius: "8px", objectFit: "cover" }}
                            onError={(e) => { e.target.src = "/cosmetic_1.avif"; }}
                          />
                          <span style={{ fontSize: "13px", fontWeight: "600" }}>{rev.productId?.name || "Deleted Product"}</span>
                        </div>
                      </td>
                      <td>{rev.customerName}</td>
                      <td>
                        <div style={{ display: "flex", color: "#C8A165", gap: "2px" }}>
                          {[...Array(5)].map((_, idx) => (
                            <HiStar key={idx} style={{ color: idx < rev.rating ? "#C8A165" : "#E5E7EB" }} />
                          ))}
                        </div>
                      </td>
                      <td style={{ maxWidth: "300px" }}>
                        <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap", marginBottom: "4px" }}>
                          <span style={{ fontWeight: "600", fontSize: "13.5px" }}>{rev.title}</span>
                          {rev.reported && (
                            <span style={{ fontSize: "10px", padding: "2px 6px", background: "#FEE2E2", color: "#DC2626", borderRadius: "4px", fontWeight: "700", textTransform: "uppercase" }}>
                              🚨 Reported
                            </span>
                          )}
                          {rev.edited && (
                            <span style={{ fontSize: "10px", padding: "2px 6px", background: "#FEF3C7", color: "#D97706", borderRadius: "4px", fontWeight: "600" }}>
                              Edited
                            </span>
                          )}
                        </div>
                        <div style={{ fontSize: "12.5px", color: "#6B7280", whiteSpace: "pre-wrap", marginTop: "4px" }}>
                          {rev.review}
                        </div>
                        
                        {/* Merchant Reply preview */}
                        {rev.merchantReply && rev.merchantReply.replyText && (
                          <div style={{ background: "#FAF9F6", borderLeft: "3px solid #C8A165", padding: "8px 12px", borderRadius: "6px", marginTop: "8px", fontSize: "12px" }}>
                            <div style={{ fontWeight: "700", color: "#1A1A1A" }}>Merchant Response:</div>
                            <div style={{ color: "#4B5563", marginTop: "2px" }}>{rev.merchantReply.replyText}</div>
                          </div>
                        )}

                        {/* Photo/Video Moderation list */}
                        {Array.isArray(rev.images) && rev.images.length > 0 && (
                          <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                            {rev.images.map((img, i) => (
                              <img
                                key={i}
                                src={img}
                                alt=""
                                style={{ width: "36px", height: "36px", borderRadius: "4px", objectFit: "cover", border: "1px solid #ECE7DF" }}
                              />
                            ))}
                          </div>
                        )}
                        {rev.video && (
                          <div style={{ display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "6px", fontSize: "11px", color: "#C8A165", fontWeight: "600" }}>
                            📹 Video review attached
                          </div>
                        )}
                      </td>
                      <td>
                        <span style={{ 
                          fontSize: "11px", 
                          padding: "4px 8px", 
                          borderRadius: "12px", 
                          background: rev.isVerifiedPurchase ? "#DCFCE7" : "#F3F4F6",
                          color: rev.isVerifiedPurchase ? "#166534" : "#4B5563",
                          fontWeight: "700"
                        }}>
                          {rev.isVerifiedPurchase ? "VERIFIED" : "NO"}
                        </span>
                      </td>
                      <td>
                        <span style={{ 
                          fontSize: "11px", 
                          padding: "4px 8px", 
                          borderRadius: "12px", 
                          background: rev.isHidden ? "#FEE2E2" : "#DBEAFE",
                          color: rev.isHidden ? "#991B1B" : "#1E40AF",
                          fontWeight: "700"
                        }}>
                          {rev.isHidden ? "HIDDEN" : "VISIBLE"}
                        </span>
                      </td>
                      <td>
                        <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                          <button
                            onClick={() => {
                              setReplyingReviewId(rev._id);
                              setReplyText(rev.merchantReply?.replyText || "");
                              setShowReplyModal(true);
                            }}
                            className="edit-btn"
                            style={{ 
                              background: "#C8A165", 
                              padding: "6px 12px", 
                              fontSize: "12px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px"
                            }}
                          >
                            Reply
                          </button>
                          <button
                            onClick={() => toggleVisibility(rev._id, rev.isHidden)}
                            className="edit-btn"
                            style={{ 
                              background: rev.isHidden ? "#0f766e" : "#B88C4A", 
                              padding: "6px 12px", 
                              fontSize: "12px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px" 
                            }}
                            title={rev.isHidden ? "Restore Review" : "Hide Review"}
                          >
                            {rev.isHidden ? <HiEye size={14} /> : <HiEyeOff size={14} />}
                            {rev.isHidden ? "Restore" : "Hide"}
                          </button>
                          <button
                            onClick={() => handleDelete(rev._id)}
                            className="delete-btn"
                            style={{ 
                              padding: "6px 12px", 
                              fontSize: "12px",
                              display: "inline-flex",
                              alignItems: "center",
                              gap: "4px" 
                            }}
                            title="Delete Review"
                          >
                            <HiTrash size={14} /> Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Pagination Row */}
              {totalPages > 1 && (
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "20px" }}>
                  <button
                    disabled={page === 1}
                    onClick={() => setPage(page - 1)}
                    className="btn-modal-cancel"
                    style={{ padding: "8px 16px", borderRadius: "30px", width: "100px", cursor: "pointer" }}
                  >
                    Previous
                  </button>
                  <span style={{ fontSize: "14px", color: "#6B7280" }}>
                    Page <strong>{page}</strong> of {totalPages}
                  </span>
                  <button
                    disabled={page === totalPages}
                    onClick={() => setPage(page + 1)}
                    className="btn-modal-cancel"
                    style={{ padding: "8px 16px", borderRadius: "30px", width: "100px", cursor: "pointer" }}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {/* Merchant Reply Modal Overlay */}
      {showReplyModal && (
        <div className="modal-overlay">
          <div className="modal-content-card" style={{ maxWidth: "500px" }}>
            <h3>Write Merchant Reply</h3>
            <p style={{ fontSize: "13px", color: "#6B7280", marginBottom: "16px" }}>
              Provide a professional, consumer-facing reply to this customer's feedback.
            </p>

            <form onSubmit={handlePostReply} className="modal-form">
              <textarea
                placeholder="Write your merchant reply here (e.g. Thank you for your feedback. We are thrilled to hear that!)..."
                value={replyText}
                onChange={(e) => setReplyText(e.target.value)}
                required
                rows={5}
                maxLength={1000}
                style={{ width: "100%", padding: "12px", border: "1px solid #ECE7DF", borderRadius: "10px", outline: "none", fontSize: "14px" }}
              />

              <div className="modal-actions-row" style={{ marginTop: "16px" }}>
                <button
                  type="button"
                  onClick={() => {
                    setShowReplyModal(false);
                    setReplyText("");
                    setReplyingReviewId("");
                  }}
                  className="btn-modal-cancel"
                >
                  Cancel
                </button>
                <button type="submit" className="btn-modal-submit">
                  Submit Response
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminReviews;
