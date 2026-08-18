import { useState, useEffect, useContext } from "react";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import AdminSidebar from "./AdminSidebar";
import {
  FiEye,
  FiCheckCircle,
  FiXCircle,
  FiTruck,
  FiRefreshCw,
  FiX,
  FiBox,
  FiShield,
  FiDollarSign,
  FiClock,
  FiAlertTriangle,
  FiSearch
} from "react-icons/fi";

const AdminReturns = () => {
  const { user } = useContext(AuthContext);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");

  // Selected Return for Full Inspection Drawer
  const [selectedReturn, setSelectedReturn] = useState(null);

  // Modals state
  const [qcModalItem, setQcModalItem] = useState(null);
  const [qcChecklist, setQcChecklist] = useState({
    isConditionAcceptable: true,
    isProductOpened: false,
    isDamaged: false,
    isQuantityCorrect: true,
    isPackagingIntact: true,
  });
  const [qcRemarks, setQcRemarks] = useState("");
  const [qcSubmitting, setQcSubmitting] = useState(false);

  const [refundModalItem, setRefundModalItem] = useState(null);
  const [refundTransactionRef, setRefundTransactionRef] = useState("");
  const [refundSubmitting, setRefundSubmitting] = useState(false);

  const [rejectModalItem, setRejectModalItem] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [rejectSubmitting, setRejectSubmitting] = useState(false);

  const [lightboxImg, setLightboxImg] = useState(null);

  const fetchReturns = async () => {
    try {
      const { data } = await axios.get("/api/returns", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      setReturns(data || []);
    } catch (error) {
      console.error(error);
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

  // 1. APPROVE & SCHEDULE PICKUP
  const handleApproveAndPickup = async (item) => {
    const toastId = toast.loading("Scheduling reverse logistics pickup...");
    try {
      const { data } = await axios.post(
        `/api/returns/${item._id}/approve`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      toast.success(data.message || "Return approved and reverse pickup scheduled! 🚚", { id: toastId });
      fetchReturns();
      if (selectedReturn?._id === item._id) {
        setSelectedReturn(data.returnRequest);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to approve return", { id: toastId });
    }
  };

  // 2. MARK RECEIVED AT HUB
  const handleMarkReceived = async (item) => {
    const toastId = toast.loading("Marking parcel as received...");
    try {
      const { data } = await axios.put(
        `/api/returns/${item._id}/receive`,
        {},
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      toast.success("Product marked as received! Quality check unlocked.", { id: toastId });
      fetchReturns();
      if (selectedReturn?._id === item._id) {
        setSelectedReturn(data.returnRequest);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to mark received", { id: toastId });
    }
  };

  // 3. SUBMIT QUALITY CHECK (PASS / FAIL)
  const handleSubmitQC = async (status) => {
    if (status === "Failed" && (!qcRemarks || qcRemarks.trim().length < 10)) {
      toast.error("Please enter a detailed quality inspection failure reason (min 10 chars).");
      return;
    }

    setQcSubmitting(true);
    try {
      const { data } = await axios.post(
        `/api/returns/${qcModalItem._id}/quality-check`,
        {
          status,
          remarks: qcRemarks.trim(),
          checklist: qcChecklist,
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      toast.success(`Quality check ${status === "Passed" ? "approved" : "rejected"}!`);
      setQcModalItem(null);
      setQcRemarks("");
      fetchReturns();
      if (selectedReturn?._id === qcModalItem._id) {
        setSelectedReturn(data.returnRequest);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Quality check submission failed.");
    } finally {
      setQcSubmitting(false);
    }
  };

  // 4. EXECUTE REFUND
  const handleExecuteRefund = async () => {
    setRefundSubmitting(true);
    try {
      const { data } = await axios.post(
        `/api/returns/${refundModalItem._id}/refund`,
        {
          transactionRef: refundTransactionRef.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      toast.success(data.message || "Refund processed successfully! 💸");
      setRefundModalItem(null);
      setRefundTransactionRef("");
      fetchReturns();
      if (selectedReturn?._id === refundModalItem._id) {
        setSelectedReturn(data.returnRequest);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to process refund.");
    } finally {
      setRefundSubmitting(false);
    }
  };

  // 5. REJECT RETURN
  const handleRejectReturn = async () => {
    if (!rejectReason || rejectReason.trim().length < 10) {
      toast.error("Please provide a meaningful rejection reason (min 10 characters).");
      return;
    }

    setRejectSubmitting(true);
    try {
      const { data } = await axios.post(
        `/api/returns/${rejectModalItem._id}/reject`,
        {
          reason: rejectReason.trim(),
        },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        }
      );
      toast.success("Return request rejected.");
      setRejectModalItem(null);
      setRejectReason("");
      fetchReturns();
      if (selectedReturn?._id === rejectModalItem._id) {
        setSelectedReturn(data.returnRequest);
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to reject return.");
    } finally {
      setRejectSubmitting(false);
    }
  };

  // Filtered return requests
  const filteredReturns = returns.filter((item) => {
    const oId = item.orderId?._id ? String(item.orderId._id) : "";
    const customer = item.userId?.name || "";
    const email = item.userId?.email || "";
    const matchesSearch =
      oId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      customer.toLowerCase().includes(searchTerm.toLowerCase()) ||
      email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.pickupTrackingId && item.pickupTrackingId.toLowerCase().includes(searchTerm.toLowerCase()));

    if (filterStatus === "all") return matchesSearch;
    if (filterStatus === "pending") return matchesSearch && (item.status === "Return Requested" || item.status === "Pending");
    if (filterStatus === "pickup") return matchesSearch && (item.status === "Pickup Scheduled" || item.status === "Picked Up" || item.status === "In Transit");
    if (filterStatus === "qc") return matchesSearch && (item.status === "Product Received" || item.status === "Quality Check");
    if (filterStatus === "refund") return matchesSearch && (item.status === "Quality Check Passed" || item.status === "Refund Pending" || item.status === "Refund Initiated" || item.status === "Refund Failed");
    if (filterStatus === "completed") return matchesSearch && (item.status === "Refund Completed" || item.status === "Refunded");
    if (filterStatus === "rejected") return matchesSearch && (item.status === "Return Rejected" || item.status === "Quality Check Failed" || item.status === "Rejected");
    return matchesSearch;
  });

  return (
    <div className="admin-layout-wrapper font-outfit">
      {/* LEFT COLUMN: SIDEBAR */}
      <AdminSidebar />

      {/* RIGHT COLUMN: MAIN CONTENT */}
      <div className="admin-content-console">
        <div className="admin-page-header">
          <div>
            <h2 style={{ fontFamily: "'Cinzel', serif" }}>Reverse Logistics & Refund Center</h2>
            <p>End-to-end lifecycle management: Return Verification → Reverse Pickup → Quality Check → Payouts.</p>
          </div>
          <span style={{ background: "rgba(200, 161, 101, 0.12)", color: "#C8A165", padding: "6px 14px", borderRadius: "20px", fontSize: "13px", fontWeight: "700" }}>
            {returns.length} Total Applications
          </span>
        </div>

        {/* TOOLBAR & SEARCH */}
        <div style={{ display: "flex", gap: "12px", marginBottom: "20px", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
          <div style={{ position: "relative", minWidth: "260px" }}>
            <FiSearch style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
            <input
              type="text"
              placeholder="Search Order ID, Customer, Tracking ID..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="admin-form-input"
              style={{ paddingLeft: "36px", width: "100%" }}
            />
          </div>

          <div style={{ display: "flex", gap: "6px", flexWrap: "wrap" }}>
            {[
              { id: "all", label: "All" },
              { id: "pending", label: "Pending Review" },
              { id: "pickup", label: "In Pickup / Transit" },
              { id: "qc", label: "Needs QC" },
              { id: "refund", label: "Refund Pending" },
              { id: "completed", label: "Completed" },
              { id: "rejected", label: "Rejected" },
            ].map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setFilterStatus(f.id)}
                style={{
                  padding: "6px 12px",
                  borderRadius: "20px",
                  fontSize: "12px",
                  fontWeight: "600",
                  border: filterStatus === f.id ? "1px solid #C8A165" : "1px solid #E5E7EB",
                  background: filterStatus === f.id ? "#111112" : "#FFFFFF",
                  color: filterStatus === f.id ? "#FFFFFF" : "#374151",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        {/* RETURNS TABLE */}
        <div className="admin-table-container">
          {loading ? (
            <div style={{ padding: "50px", textAlign: "center", color: "#6B7280" }}>
              Loading reverse logistics database...
            </div>
          ) : filteredReturns.length === 0 ? (
            <div style={{ padding: "50px", textAlign: "center", color: "#6B7280" }}>
              No matching return or refund applications found.
            </div>
          ) : (
            <table className="admin-premium-table">
              <thead>
                <tr>
                  <th>Order & Customer</th>
                  <th>Reason & Proof</th>
                  <th>Reverse Pickup</th>
                  <th>Current State</th>
                  <th>Refund Amount</th>
                  <th>Lifecycle Action</th>
                </tr>
              </thead>
              <tbody>
                {filteredReturns.map((item) => {
                  const oId = item.orderId?._id
                    ? `#${item.orderId._id.slice(-8).toUpperCase()}`
                    : `#${item.orderId ? String(item.orderId).slice(-8).toUpperCase() : "N/A"}`;

                  const customerName = item.userId?.name || "Customer";
                  const customerEmail = item.userId?.email || "";
                  const refundableAmt = item.refundAmount || item.orderId?.totalAmount || 0;

                  return (
                    <tr key={item._id}>
                      {/* Order & Customer */}
                      <td>
                        <strong style={{ fontFamily: "monospace", fontSize: "0.88rem", color: "#111112" }}>{oId}</strong>
                        <div style={{ fontSize: "0.78rem", color: "#4B5563", marginTop: "2px" }}>
                          {customerName}<br />
                          <span style={{ fontSize: "0.72rem", color: "#9CA3AF" }}>{customerEmail}</span>
                        </div>
                      </td>

                      {/* Reason & Proof */}
                      <td style={{ maxWidth: "220px" }}>
                        <span style={{ display: "inline-block", background: "rgba(200, 161, 101, 0.12)", color: "#C8A165", fontSize: "0.72rem", fontWeight: "700", padding: "2px 8px", borderRadius: "10px", marginBottom: "4px" }}>
                          {item.reasonCategory}
                        </span>
                        <p style={{ fontSize: "0.8rem", color: "#374151", margin: "0 0 6px 0", lineHeight: "1.3", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          "{item.reason}"
                        </p>
                        {item.returnImages && item.returnImages.length > 0 && (
                          <div style={{ display: "flex", gap: "4px" }}>
                            {item.returnImages.map((img, idx) => (
                              <img
                                key={idx}
                                src={img}
                                alt={`Proof ${idx + 1}`}
                                onClick={() => setLightboxImg(img)}
                                style={{ width: "32px", height: "32px", borderRadius: "4px", objectFit: "cover", border: "1px solid #E5E7EB", cursor: "zoom-in" }}
                              />
                            ))}
                          </div>
                        )}
                      </td>

                      {/* Reverse Pickup */}
                      <td>
                        {item.pickupTrackingId ? (
                          <div>
                            <span style={{ fontFamily: "monospace", fontSize: "0.78rem", fontWeight: "700", color: "#111112", display: "block" }}>
                              {item.pickupTrackingId}
                            </span>
                            <span style={{ fontSize: "0.72rem", color: "#6B7280" }}>
                              {item.pickupProvider}
                            </span>
                          </div>
                        ) : (
                          <span style={{ fontSize: "0.75rem", color: "#9CA3AF" }}>Not assigned</span>
                        )}
                      </td>

                      {/* Status */}
                      <td>
                        <span className={`status-pill pill-${item.status.toLowerCase().replace(/\s+/g, "-")}`}>
                          {item.status}
                        </span>
                      </td>

                      {/* Refund Amount */}
                      <td>
                        <strong style={{ fontSize: "0.88rem", color: "#111112" }}>₹{Number(refundableAmt).toFixed(2)}</strong>
                        <span style={{ fontSize: "0.72rem", color: "#6B7280", display: "block" }}>
                          Via {item.refundMethod || "Original Payment"}
                        </span>
                      </td>

                      {/* Lifecycle Action */}
                      <td>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px", minWidth: "140px" }}>
                          {/* 1. Return Requested -> Approve or Reject */}
                          {(item.status === "Return Requested" || item.status === "Pending") && (
                            <>
                              <button
                                type="button"
                                onClick={() => handleApproveAndPickup(item)}
                                style={{ background: "#111112", color: "#FFFFFF", border: "none", padding: "6px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "600", cursor: "pointer" }}
                              >
                                Approve & Schedule Pickup
                              </button>
                              <button
                                type="button"
                                onClick={() => setRejectModalItem(item)}
                                style={{ background: "#FEE2E2", color: "#DC2626", border: "none", padding: "4px 8px", borderRadius: "6px", fontSize: "0.72rem", fontWeight: "600", cursor: "pointer" }}
                              >
                                Reject Return
                              </button>
                            </>
                          )}

                          {/* 2. Pickup in Progress -> Mark Received */}
                          {(item.status === "Pickup Scheduled" || item.status === "Picked Up" || item.status === "In Transit") && (
                            <button
                              type="button"
                              onClick={() => handleMarkReceived(item)}
                              style={{ background: "#C8A165", color: "#FFFFFF", border: "none", padding: "6px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "600", cursor: "pointer" }}
                            >
                              Mark Package Received
                            </button>
                          )}

                          {/* 3. Product Received -> Start QC */}
                          {(item.status === "Product Received" || item.status === "Quality Check") && (
                            <button
                              type="button"
                              onClick={() => setQcModalItem(item)}
                              style={{ background: "#2563EB", color: "#FFFFFF", border: "none", padding: "6px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "600", cursor: "pointer" }}
                            >
                              Perform Quality Check
                            </button>
                          )}

                          {/* 4. QC Passed -> Execute Refund */}
                          {(item.status === "Quality Check Passed" || item.status === "Refund Pending" || item.status === "Refund Failed") && (
                            <button
                              type="button"
                              onClick={() => setRefundModalItem(item)}
                              style={{ background: "#16A34A", color: "#FFFFFF", border: "none", padding: "6px 10px", borderRadius: "6px", fontSize: "0.75rem", fontWeight: "600", cursor: "pointer" }}
                            >
                              {item.status === "Refund Failed" ? "Retry Refund (₹" + refundableAmt + ")" : "Process Refund (₹" + refundableAmt + ")"}
                            </button>
                          )}

                          {/* 5. Refund Completed */}
                          {(item.status === "Refund Completed" || item.status === "Refunded") && (
                            <span style={{ fontSize: "0.75rem", fontWeight: "700", color: "#16A34A" }}>
                              ✓ Payout Settled ({item.refundId ? item.refundId.slice(-8) : "Completed"})
                            </span>
                          )}

                          {/* Detailed Audit Drawer button */}
                          <button
                            type="button"
                            onClick={() => setSelectedReturn(item)}
                            style={{ background: "#F3F4F6", border: "1px solid #E5E7EB", padding: "3px 8px", borderRadius: "4px", fontSize: "0.72rem", color: "#4B5563", cursor: "pointer" }}
                          >
                            Inspect Audit Trail →
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

        {/* QUALITY CHECK MODAL */}
        {qcModalItem && (
          <div className="admin-modal-backdrop" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: "28px", maxWidth: "520px", width: "100%", maxHeight: "90vh", overflowY: "auto" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #E5E7EB", paddingBottom: "12px" }}>
                <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "700" }}>Product Quality Inspection</h3>
                <button type="button" onClick={() => setQcModalItem(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px" }}><FiX /></button>
              </div>

              <p style={{ fontSize: "0.85rem", color: "#6B7280", marginBottom: "16px" }}>
                Verify physical contents and packaging before unlocking customer refund execution.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "16px" }}>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", cursor: "pointer" }}>
                  <input type="checkbox" checked={qcChecklist.isConditionAcceptable} onChange={(e) => setQcChecklist({ ...qcChecklist, isConditionAcceptable: e.target.checked })} />
                  Physical item condition matches returned reason
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", cursor: "pointer" }}>
                  <input type="checkbox" checked={qcChecklist.isPackagingIntact} onChange={(e) => setQcChecklist({ ...qcChecklist, isPackagingIntact: e.target.checked })} />
                  Original brand packaging / box present
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", cursor: "pointer" }}>
                  <input type="checkbox" checked={qcChecklist.isQuantityCorrect} onChange={(e) => setQcChecklist({ ...qcChecklist, isQuantityCorrect: e.target.checked })} />
                  All components / bundle items accounted for
                </label>
                <label style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "0.85rem", cursor: "pointer" }}>
                  <input type="checkbox" checked={qcChecklist.isProductOpened} onChange={(e) => setQcChecklist({ ...qcChecklist, isProductOpened: e.target.checked })} />
                  Bottle / jar seal opened or used (mark if applicable)
                </label>
              </div>

              <div style={{ marginBottom: "20px" }}>
                <label style={{ fontSize: "0.85rem", fontWeight: "600", display: "block", marginBottom: "6px" }}>Inspector Remarks / Notes *</label>
                <textarea
                  rows={3}
                  value={qcRemarks}
                  onChange={(e) => setQcRemarks(e.target.value)}
                  placeholder="e.g. 'Item inspected in warehouse. Seal broken as claimed. Approved for refund.'"
                  className="admin-form-input"
                  style={{ width: "100%", padding: "10px", fontSize: "0.85rem" }}
                />
              </div>

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  disabled={qcSubmitting}
                  onClick={() => handleSubmitQC("Failed")}
                  style={{ background: "#FEE2E2", color: "#DC2626", border: "none", padding: "10px 18px", borderRadius: "8px", fontWeight: "600", fontSize: "0.85rem", cursor: "pointer" }}
                >
                  Fail Inspection
                </button>
                <button
                  type="button"
                  disabled={qcSubmitting}
                  onClick={() => handleSubmitQC("Passed")}
                  style={{ background: "#16A34A", color: "#FFFFFF", border: "none", padding: "10px 22px", borderRadius: "8px", fontWeight: "600", fontSize: "0.85rem", cursor: "pointer" }}
                >
                  {qcSubmitting ? "Saving..." : "Pass Inspection & Restock"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* PROCESS REFUND MODAL */}
        {refundModalItem && (
          <div className="admin-modal-backdrop" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: "28px", maxWidth: "500px", width: "100%" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", borderBottom: "1px solid #E5E7EB", paddingBottom: "12px" }}>
                <h3 style={{ margin: 0, fontSize: "1.15rem", fontWeight: "700" }}>Execute Customer Refund</h3>
                <button type="button" onClick={() => setRefundModalItem(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "20px" }}><FiX /></button>
              </div>

              <div style={{ background: "#FAF7F2", border: "1px solid #ECE7DF", borderRadius: "12px", padding: "16px", marginBottom: "18px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "0.85rem", color: "#6B7280" }}>Refund Amount:</span>
                  <strong style={{ fontSize: "1.05rem", color: "#111112" }}>₹{Number(refundModalItem.refundAmount || refundModalItem.orderId?.totalAmount).toFixed(2)}</strong>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                  <span style={{ fontSize: "0.85rem", color: "#6B7280" }}>Payment Method:</span>
                  <span style={{ fontSize: "0.85rem", fontWeight: "600" }}>{refundModalItem.orderId?.paymentMethod || "Prepaid"}</span>
                </div>
                {refundModalItem.upiId && (
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                    <span style={{ fontSize: "0.85rem", color: "#6B7280" }}>Customer UPI:</span>
                    <strong style={{ fontSize: "0.85rem", color: "#2563EB" }}>{refundModalItem.upiId}</strong>
                  </div>
                )}
                {refundModalItem.accountNumber && (
                  <div style={{ fontSize: "0.82rem", color: "#4B5563", marginTop: "4px" }}>
                    Bank: {refundModalItem.bankName} | A/C: {refundModalItem.accountNumber} | IFSC: {refundModalItem.ifscCode}
                  </div>
                )}
              </div>

              {refundModalItem.orderId?.paymentMethod === "COD" && (
                <div style={{ marginBottom: "18px" }}>
                  <label style={{ fontSize: "0.85rem", fontWeight: "600", display: "block", marginBottom: "6px" }}>Bank / UPI UTR Transaction Reference *</label>
                  <input
                    type="text"
                    placeholder="e.g. UTR123456789 / IMPS ref"
                    value={refundTransactionRef}
                    onChange={(e) => setRefundTransactionRef(e.target.value)}
                    className="admin-form-input"
                    style={{ width: "100%", padding: "10px" }}
                  />
                </div>
              )}

              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  onClick={() => setRefundModalItem(null)}
                  style={{ background: "#F3F4F6", border: "1px solid #E5E7EB", padding: "10px 18px", borderRadius: "8px", fontWeight: "600", fontSize: "0.85rem", cursor: "pointer" }}
                >
                  Cancel
                </button>
                <button
                  type="button"
                  disabled={refundSubmitting}
                  onClick={handleExecuteRefund}
                  style={{ background: "#16A34A", color: "#FFFFFF", border: "none", padding: "10px 24px", borderRadius: "8px", fontWeight: "600", fontSize: "0.85rem", cursor: "pointer" }}
                >
                  {refundSubmitting ? "Executing..." : "Confirm & Settle Payout"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* REJECT RETURN MODAL */}
        {rejectModalItem && (
          <div className="admin-modal-backdrop" style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0,0,0,0.6)", zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div style={{ background: "#FFFFFF", borderRadius: "16px", padding: "28px", maxWidth: "480px", width: "100%" }}>
              <h3 style={{ margin: "0 0 12px 0", fontSize: "1.15rem", fontWeight: "700", color: "#DC2626" }}>Decline Return Request</h3>
              <p style={{ fontSize: "0.85rem", color: "#6B7280", marginBottom: "16px" }}>
                Please provide a mandatory explanation. This explanation will be sent directly to the customer email and displayed on their tracking screen.
              </p>
              <textarea
                rows={3}
                value={rejectReason}
                onChange={(e) => setRejectReason(e.target.value)}
                placeholder="e.g. 'Return window exceeded or non-returnable cosmetic product without damage evidence.'"
                className="admin-form-input"
                style={{ width: "100%", padding: "10px", marginBottom: "18px" }}
              />
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button type="button" onClick={() => setRejectModalItem(null)} style={{ background: "#F3F4F6", border: "1px solid #E5E7EB", padding: "8px 16px", borderRadius: "6px", cursor: "pointer" }}>Cancel</button>
                <button
                  type="button"
                  disabled={rejectSubmitting}
                  onClick={handleRejectReturn}
                  style={{ background: "#DC2626", color: "#FFFFFF", border: "none", padding: "8px 20px", borderRadius: "6px", fontWeight: "600", cursor: "pointer" }}
                >
                  {rejectSubmitting ? "Rejecting..." : "Confirm Rejection"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* FULL AUDIT DRAWER */}
        {selectedReturn && (
          <div style={{ position: "fixed", top: 0, right: 0, bottom: 0, width: "100%", maxWidth: "520px", background: "#FFFFFF", boxShadow: "-10px 0 30px rgba(0,0,0,0.15)", zIndex: 999999, overflowY: "auto", padding: "28px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px", borderBottom: "1px solid #ECE7DF", paddingBottom: "14px" }}>
              <div>
                <h3 style={{ margin: 0, fontSize: "1.2rem", fontWeight: "700" }}>Return Audit Details</h3>
                <span style={{ fontSize: "0.8rem", color: "#6B7280" }}>ID: {selectedReturn._id}</span>
              </div>
              <button type="button" onClick={() => setSelectedReturn(null)} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "22px" }}><FiX /></button>
            </div>

            {/* Status Header */}
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FAF7F2", padding: "12px 16px", borderRadius: "12px", marginBottom: "18px" }}>
              <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#4B5563" }}>Lifecycle State:</span>
              <span className={`status-pill pill-${selectedReturn.status.toLowerCase().replace(/\s+/g, "-")}`}>
                {selectedReturn.status}
              </span>
            </div>

            {/* Logistics Info */}
            <div style={{ border: "1px solid #ECE7DF", borderRadius: "12px", padding: "16px", marginBottom: "18px" }}>
              <h4 style={{ margin: "0 0 10px 0", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "6px" }}><FiTruck color="#C8A165" /> Reverse Logistics</h4>
              <div style={{ fontSize: "0.85rem", color: "#4B5563", display: "flex", flexDirection: "column", gap: "4px" }}>
                <div><strong>Courier:</strong> {selectedReturn.pickupProvider || "Venus Express Logistics"}</div>
                <div><strong>Tracking ID:</strong> {selectedReturn.pickupTrackingId || "Pending Schedule"}</div>
                {selectedReturn.pickupScheduledAt && <div><strong>Scheduled:</strong> {new Date(selectedReturn.pickupScheduledAt).toLocaleString("en-IN")}</div>}
                {selectedReturn.receivedAt && <div><strong>Received at Hub:</strong> {new Date(selectedReturn.receivedAt).toLocaleString("en-IN")}</div>}
              </div>
            </div>

            {/* Reason & Photos */}
            <div style={{ border: "1px solid #ECE7DF", borderRadius: "12px", padding: "16px", marginBottom: "18px" }}>
              <h4 style={{ margin: "0 0 10px 0", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "6px" }}><FiShield color="#C8A165" /> Customer Claim</h4>
              <span style={{ fontSize: "0.78rem", fontWeight: "700", color: "#C8A165", background: "rgba(200, 161, 101, 0.1)", padding: "3px 8px", borderRadius: "8px", display: "inline-block", marginBottom: "6px" }}>
                {selectedReturn.reasonCategory}
              </span>
              <p style={{ fontSize: "0.85rem", color: "#374151", margin: "0 0 10px 0" }}>"{selectedReturn.reason}"</p>
              {selectedReturn.returnImages?.length > 0 && (
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap" }}>
                  {selectedReturn.returnImages.map((img, idx) => (
                    <img key={idx} src={img} alt={`Proof ${idx + 1}`} onClick={() => setLightboxImg(img)} style={{ width: "60px", height: "60px", borderRadius: "8px", objectFit: "cover", border: "1px solid #ECE7DF", cursor: "zoom-in" }} />
                  ))}
                </div>
              )}
            </div>

            {/* Audit Timeline */}
            <div style={{ border: "1px solid #ECE7DF", borderRadius: "12px", padding: "16px", marginBottom: "18px" }}>
              <h4 style={{ margin: "0 0 12px 0", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: "6px" }}><FiClock color="#C8A165" /> Audit Trail</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {(selectedReturn.returnTimeline || []).map((tl, index) => (
                  <div key={index} style={{ borderLeft: "2px solid #C8A165", paddingLeft: "12px" }}>
                    <div style={{ fontSize: "0.85rem", fontWeight: "700", color: "#111112" }}>{tl.status}</div>
                    <div style={{ fontSize: "0.8rem", color: "#6B7280" }}>{tl.message}</div>
                    <div style={{ fontSize: "0.72rem", color: "#9CA3AF" }}>{new Date(tl.timestamp).toLocaleString("en-IN")} • by {tl.updatedBy}</div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Lightbox Modal */}
        {lightboxImg && (
          <div onClick={() => setLightboxImg(null)} style={{ position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(0, 0, 0, 0.85)", zIndex: 9999999, display: "flex", alignItems: "center", justifyContent: "center", padding: "20px" }}>
            <div style={{ position: "relative", maxWidth: "90vw", maxHeight: "90vh" }} onClick={(e) => e.stopPropagation()}>
              <button type="button" onClick={() => setLightboxImg(null)} style={{ position: "absolute", top: "-40px", right: "0", background: "transparent", border: "none", color: "#FFFFFF", cursor: "pointer", fontSize: "24px" }}><FiX /></button>
              <img src={lightboxImg} alt="Enlarged Proof" style={{ maxWidth: "100%", maxHeight: "85vh", borderRadius: "10px", objectFit: "contain" }} />
            </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminReturns;
