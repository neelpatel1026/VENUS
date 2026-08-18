import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import {
  FiArrowLeft,
  FiPackage,
  FiCheckCircle,
  FiClock,
  FiAlertCircle,
  FiX,
  FiTruck,
  FiShield,
  FiDollarSign,
  FiCheck
} from "react-icons/fi";
import "../styles/MyReturns.css";

// 5 Standard Visual Milestones for the Customer Return Journey
const TIMELINE_STEPS = [
  { id: "REQUESTED", label: "Return Requested", desc: "Submitted with proof" },
  { id: "APPROVED", label: "Approved & Pickup", desc: "Reverse courier assigned" },
  { id: "TRANSIT", label: "Picked Up & In Transit", desc: "En route to warehouse" },
  { id: "QC", label: "Quality Inspection", desc: "Verified at facility" },
  { id: "REFUND", label: "Refund Settled", desc: "Amount credited" },
];

const getMilestoneIndex = (status) => {
  if (!status) return 0;
  const s = status.toLowerCase();
  if (s.includes("refund completed") || s.includes("refunded")) return 4;
  if (s.includes("quality check passed") || s.includes("refund pending") || s.includes("refund initiated")) return 3.5;
  if (s.includes("product received") || s.includes("quality check")) return 3;
  if (s.includes("in transit") || s.includes("picked up")) return 2;
  if (s.includes("pickup scheduled") || s.includes("pickup created") || s.includes("return approved") || s.includes("approved")) return 1;
  return 0;
};

const MyReturns = () => {
  const { user } = useContext(AuthContext);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [previewModalImg, setPreviewModalImg] = useState(null);

  useEffect(() => {
    const fetchReturns = async () => {
      try {
        const { data } = await axios.get("/api/returns/my", {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        setReturns(data || []);
      } catch (error) {
        console.error("Failed to fetch returns:", error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchReturns();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="myreturns-page route-fade-in" style={{ padding: "40px 20px", maxWidth: "1200px", margin: "0 auto" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(340px, 1fr))", gap: "20px" }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ border: "1px solid #ECE7DF", background: "#FFFFFF", padding: "24px", borderRadius: "16px" }}>
              <div className="shimmer-bg" style={{ height: "20px", width: "140px", borderRadius: "4px", marginBottom: "16px" }} />
              <div className="shimmer-bg" style={{ height: "14px", width: "70%", borderRadius: "4px", marginBottom: "8px" }} />
              <div className="shimmer-bg" style={{ height: "14px", width: "90%", borderRadius: "4px", marginBottom: "16px" }} />
              <div className="shimmer-bg" style={{ height: "90px", width: "100%", borderRadius: "8px" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="myreturns-page route-fade-in font-outfit">
      <div style={{ maxWidth: "1000px", margin: "0 auto", padding: "0 10px" }}>
        
        {/* Header navigation */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "24px", flexWrap: "wrap", gap: "12px" }}>
          <div>
            <Link to="/profile" style={{ display: "inline-flex", alignItems: "center", gap: "6px", color: "#6B7280", textDecoration: "none", fontSize: "13px", fontWeight: "600", marginBottom: "6px" }}>
              <FiArrowLeft size={14} /> Back to Account
            </Link>
            <h1 style={{ fontFamily: "'Cinzel', serif", fontSize: "24px", fontWeight: "700", color: "#111112", margin: 0 }}>
              My Return & Reverse Pickup Requests
            </h1>
          </div>
          <span style={{ fontSize: "12.5px", color: "#6B7280", background: "#FAF7F2", padding: "6px 14px", borderRadius: "20px", border: "1px solid #ECE7DF" }}>
            Total Applications: <strong>{returns.length}</strong>
          </span>
        </div>

        {returns.length === 0 ? (
          <div 
            style={{ 
              textAlign: 'center', 
              padding: '60px 20px', 
              background: '#FFFFFF', 
              border: '1px solid #ECE7DF', 
              borderRadius: '20px',
              maxWidth: '520px',
              margin: '40px auto'
            }}
          >
            <div style={{ width: "64px", height: "64px", borderRadius: "50%", background: "#FAF7F2", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 16px auto", border: "1px solid #ECE7DF" }}>
              <FiPackage size={28} color="#C8A165" />
            </div>
            <h3 style={{ fontSize: '1.3rem', fontWeight: '700', color: '#111112', margin: '0 0 10px 0' }}>
              No Active Return Requests
            </h3>
            <p style={{ color: '#6B7280', lineHeight: '1.6', margin: '0 0 24px 0', fontSize: '0.95rem' }}>
              You haven't submitted any return or refund requests. If you have delivered orders eligible for return, you can initiate a request from your Order Details page.
            </p>
            <Link
              to="/MyOrders"
              style={{
                background: '#111112',
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
              View Delivered Orders
            </Link>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
            {returns.map((item) => {
              const orderNum = item.orderId?._id ? item.orderId._id.slice(-8).toUpperCase() : "N/A";
              const currentStepIdx = getMilestoneIndex(item.status);
              const isRejected = item.status === "Return Rejected" || item.status === "Quality Check Failed";

              return (
                <div className="return-card" key={item._id} style={{ background: "#FFFFFF", border: "1px solid #ECE7DF", borderRadius: "20px", padding: "24px", boxShadow: "0 4px 20px rgba(0,0,0,0.03)" }}>
                  
                  {/* Top Header Row */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", borderBottom: "1px solid #ECE7DF", paddingBottom: "16px", marginBottom: "18px" }}>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
                        <Link to={`/order/${item.orderId?._id || item.orderId}`} style={{ textDecoration: "none", color: "#111112" }}>
                          <h3 style={{ margin: 0, fontSize: "16px", fontWeight: "700" }}>Order #{orderNum}</h3>
                        </Link>
                        <span style={{ fontSize: "12px", fontWeight: "700", color: "#C8A165", background: "rgba(200, 161, 101, 0.1)", padding: "3px 10px", borderRadius: "12px" }}>
                          {item.reasonCategory}
                        </span>
                      </div>
                      <span style={{ fontSize: "12px", color: "#6B7280", marginTop: "4px", display: "block" }}>
                        Requested on {new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                      </span>
                    </div>

                    <span className={`status ${item.status.toLowerCase().replace(/\s/g, "-")}`} style={{ fontSize: "12px", fontWeight: "700", padding: "6px 14px", borderRadius: "20px" }}>
                      {item.status}
                    </span>
                  </div>

                  {/* RETURN LIFECYCLE PROGRESS BAR (DESKTOP & MOBILE) */}
                  {!isRejected ? (
                    <div style={{ margin: "20px 0 24px 0", background: "#FAF7F2", padding: "16px", borderRadius: "14px", border: "1px solid #EAE4DC" }}>
                      <div style={{ fontSize: "11px", fontWeight: "700", color: "#8B7355", textTransform: "uppercase", letterSpacing: "0.8px", marginBottom: "14px" }}>
                        Reverse Logistics Journey
                      </div>
                      <div className="return-progress-stepper">
                        {TIMELINE_STEPS.map((step, idx) => {
                          const isDone = currentStepIdx >= idx;
                          const isCurrent = Math.floor(currentStepIdx) === idx;
                          return (
                            <div key={step.id} className={`step-node ${isDone ? "completed" : ""} ${isCurrent ? "active" : ""}`}>
                              <div className="node-icon-circle">
                                {isDone ? <FiCheck size={12} /> : <span>{idx + 1}</span>}
                              </div>
                              <div className="node-text-wrap">
                                <span className="node-label">{step.label}</span>
                                <span className="node-desc">{step.desc}</span>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <div style={{ margin: "16px 0", background: "#FEF2F2", border: "1px solid #FCA5A5", borderRadius: "12px", padding: "14px 16px", display: "flex", alignItems: "flex-start", gap: "10px" }}>
                      <FiAlertCircle size={20} color="#DC2626" style={{ flexShrink: 0, marginTop: "2px" }} />
                      <div>
                        <strong style={{ fontSize: "13.5px", color: "#DC2626", display: "block" }}>Return Request Declined</strong>
                        <p style={{ fontSize: "12.5px", color: "#7F1D1D", margin: "4px 0 0 0" }}>
                          {item.adminRemark || item.qualityCheckRemarks || "Does not meet standard return eligibility guidelines."}
                        </p>
                      </div>
                    </div>
                  )}

                  {/* COURIER & REVERSE PICKUP DETAILS (IF SCHEDULED) */}
                  {item.pickupTrackingId && (
                    <div style={{ background: "#FFFFFF", border: "1px solid #ECE7DF", borderRadius: "12px", padding: "14px 16px", marginBottom: "16px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "12px" }}>
                      <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                        <div style={{ width: "38px", height: "38px", borderRadius: "50%", background: "#FAF7F2", border: "1px solid #ECE7DF", display: "flex", alignItems: "center", justifyContent: "center" }}>
                          <FiTruck size={18} color="#C8A165" />
                        </div>
                        <div>
                          <span style={{ fontSize: "11px", fontWeight: "700", color: "#6B7280", textTransform: "uppercase" }}>Reverse Logistics Partner</span>
                          <h4 style={{ margin: "2px 0 0 0", fontSize: "13.5px", fontWeight: "700", color: "#111112" }}>
                            {item.pickupProvider} • <span style={{ fontFamily: "monospace", color: "#C8A165" }}>{item.pickupTrackingId}</span>
                          </h4>
                        </div>
                      </div>

                      {item.pickupEstimatedDate && (
                        <div style={{ fontSize: "12px", color: "#4B5563" }}>
                          Estimated Pickup: <strong>{new Date(item.pickupEstimatedDate).toLocaleDateString("en-IN", { day: "numeric", month: "short" })}</strong>
                        </div>
                      )}
                    </div>
                  )}

                  {/* CUSTOMER DETAILS & PROOF PHOTOS */}
                  <div style={{ marginBottom: "16px" }}>
                    <p style={{ color: "#374151", fontSize: "13.5px", lineHeight: "1.5", margin: "0 0 10px 0" }}>
                      <strong>Customer Note:</strong> "{item.reason}"
                    </p>

                    {item.returnImages?.length > 0 && (
                      <div className="images" style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                        {item.returnImages.map((img, index) => (
                          <img
                            key={index}
                            src={img}
                            alt={`Proof ${index + 1}`}
                            onClick={() => setPreviewModalImg(img)}
                            style={{ width: "64px", height: "64px", borderRadius: "8px", objectFit: "cover", border: "1px solid #ECE7DF", cursor: "zoom-in" }}
                            title="Click to view full photo"
                          />
                        ))}
                      </div>
                    )}
                  </div>

                  {/* REFUND SUMMARY BLOCK */}
                  <div style={{ borderTop: "1px solid #ECE7DF", paddingTop: "14px", display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "10px" }}>
                    <div>
                      <span style={{ fontSize: "12px", color: "#6B7280" }}>Authorized Refund:</span>
                      <strong style={{ fontSize: "14px", color: "#111112", marginLeft: "6px" }}>
                        ₹{Number(item.refundAmount || item.orderId?.totalAmount || 0).toFixed(2)}
                      </strong>
                      {item.refundId && (
                        <span style={{ fontSize: "11px", color: "#16A34A", background: "#DCFCE7", padding: "2px 8px", borderRadius: "10px", marginLeft: "8px", fontWeight: "600" }}>
                          Ref: {item.refundId}
                        </span>
                      )}
                    </div>

                    <Link to={`/order/${item.orderId?._id || item.orderId}`} style={{ fontSize: "12.5px", color: "#C8A165", fontWeight: "700", textDecoration: "none" }}>
                      View Order Details →
                    </Link>
                  </div>

                </div>
              );
            })}
          </div>
        )}

        {/* Lightbox Modal */}
        {previewModalImg && (
          <div
            onClick={() => setPreviewModalImg(null)}
            style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0, 0, 0, 0.85)",
              zIndex: 999999,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              padding: "20px"
            }}
          >
            <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
              <button
                type="button"
                onClick={() => setPreviewModalImg(null)}
                style={{
                  position: "absolute",
                  top: "-40px",
                  right: "0",
                  background: "transparent",
                  border: "none",
                  color: "#FFFFFF",
                  cursor: "pointer",
                  fontSize: "24px"
                }}
              >
                <FiX />
              </button>
              <img
                src={previewModalImg}
                alt="Enlarged Proof"
                style={{ maxWidth: "100%", maxHeight: "85vh", borderRadius: "12px", objectFit: "contain" }}
              />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default MyReturns;
