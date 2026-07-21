import { useEffect, useState, useContext } from "react";
import { AuthContext } from "../context/AuthContext.jsx";
import AdminSidebar from "./AdminSidebar";
import toast from "react-hot-toast";
import { LuTag, LuTrash, LuPlus, LuCalendar, LuPercent, LuDollarSign, LuTrendingUp } from "react-icons/lu";

const AdminCoupons = () => {
  const { user } = useContext(AuthContext);
  const [coupons, setCoupons] = useState([]);
  const [analytics, setAnalytics] = useState([]);
  const [loading, setLoading] = useState(true);

  // Form State
  const [code, setCode] = useState("");
  const [discountType, setDiscountType] = useState("percentage");
  const [discount, setDiscount] = useState("");
  const [startDate, setStartDate] = useState("");
  const [expiryDate, setExpiryDate] = useState("");
  const [minOrderValue, setMinOrderValue] = useState("");
  const [maxDiscount, setMaxDiscount] = useState("");
  const [usageLimit, setUsageLimit] = useState("");
  const [perUserLimit, setPerUserLimit] = useState("1");
  const [showAddForm, setShowAddForm] = useState(false);

  const fetchCoupons = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/coupons", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.success) {
        setCoupons(data.coupons);
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load coupons list");
    } finally {
      setLoading(false);
    }
  };

  const fetchAnalytics = async () => {
    try {
      const res = await fetch("/api/analytics", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const data = await res.json();
      if (res.ok && data.couponAnalytics) {
        setAnalytics(data.couponAnalytics);
      }
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (user) {
      fetchCoupons();
      fetchAnalytics();
    }
  }, [user]);

  const handleCreateCoupon = async (e) => {
    e.preventDefault();
    if (!code || !discount || !expiryDate) {
      toast.error("Code, discount amount, and expiry date are required");
      return;
    }

    toast.loading("Creating coupon...");
    try {
      const res = await fetch("/api/coupons", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          code: code.trim().toUpperCase(),
          discountType,
          discount: Number(discount),
          startDate: startDate || undefined,
          expiryDate,
          minOrderValue: Number(minOrderValue) || 0,
          maxDiscount: Number(maxDiscount) || 0,
          usageLimit: Number(usageLimit) || 0,
          perUserLimit: Number(perUserLimit) || 1,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.dismiss();
        toast.success("Coupon code created successfully!");
        setShowAddForm(false);
        // Reset fields
        setCode("");
        setDiscountType("percentage");
        setDiscount("");
        setStartDate("");
        setExpiryDate("");
        setMinOrderValue("");
        setMaxDiscount("");
        setUsageLimit("");
        setPerUserLimit("1");
        fetchCoupons();
        fetchAnalytics();
      } else {
        toast.dismiss();
        toast.error(data.message || "Failed to create coupon");
      }
    } catch (err) {
      toast.dismiss();
      toast.error("Request error occurred");
    }
  };

  const handleDelete = async (id) => {
    const confirm = window.confirm("Are you sure you want to permanently delete this coupon?");
    if (!confirm) return;

    toast.loading("Deleting coupon...");
    try {
      const res = await fetch(`/api/coupons/${id}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      const data = await res.json();
      if (res.ok && data.success) {
        toast.dismiss();
        toast.success("Coupon deleted successfully");
        fetchCoupons();
        fetchAnalytics();
      } else {
        toast.dismiss();
        toast.error(data.message || "Failed to delete coupon");
      }
    } catch (err) {
      toast.dismiss();
      toast.error("Failed to process delete");
    }
  };

  const toggleActiveStatus = async (id, currentStatus) => {
    try {
      const res = await fetch(`/api/coupons/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({ active: !currentStatus }),
      });
      const data = await res.json();
      if (res.ok && data.success) {
        toast.success(`Coupon status set to ${!currentStatus ? "Active" : "Inactive"}`);
        fetchCoupons();
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to update status");
    }
  };

  // Compute aggregated stats
  const totalUses = analytics.reduce((acc, item) => acc + (item.timesUsed || 0), 0);
  const revenueGenerated = analytics.reduce((acc, item) => acc + (item.revenueGenerated || 0), 0);
  const activeCoupons = coupons.filter(c => c.active && new Date(c.expiryDate) >= new Date()).length;

  return (
    <div className="admin-layout-wrapper">
      <AdminSidebar />

      <div className="admin-content-console" style={{ background: "#F8F8F8" }}>
        
        <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "16px", marginBottom: "32px" }}>
          <div>
            <h2 style={{ fontSize: "30px", fontWeight: "700", color: "#1A1A1A", fontFamily: "'Cinzel', 'Didot', serif" }}>
              Coupon & Discount Management
            </h2>
            <p style={{ color: "#6B7280", fontSize: "14px", marginTop: "4px" }}>
              Configure luxury discount codes, set usage caps, and review performance campaigns.
            </p>
          </div>
          <button
            onClick={() => setShowAddForm(!showAddForm)}
            className="btn-admin-primary"
            style={{ display: "inline-flex", alignItems: "center", gap: "8px" }}
          >
            <LuPlus size={18} /> {showAddForm ? "View Coupon List" : "Create New Coupon"}
          </button>
        </div>

        {/* COUPON ANALYTICS PANELS */}
        {!showAddForm && (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "20px", marginBottom: "32px" }}>
            <div style={{ background: "#FFFFFF", padding: "24px", borderRadius: "16px", border: "1px solid #ECECEC" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13.5px", fontWeight: "600", color: "#6B7280" }}>Times Used</span>
                <LuTag color="#C8A165" size={20} />
              </div>
              <h3 style={{ fontSize: "26px", fontWeight: "700", color: "#1A1A1A", margin: "12px 0 4px 0" }}>{totalUses}</h3>
              <span style={{ fontSize: "12px", color: "#6B7280" }}>Aggregated checkouts</span>
            </div>

            <div style={{ background: "#FFFFFF", padding: "24px", borderRadius: "16px", border: "1px solid #ECECEC" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13.5px", fontWeight: "600", color: "#6B7280" }}>Revenue Generated</span>
                <LuTrendingUp color="#C8A165" size={20} />
              </div>
              <h3 style={{ fontSize: "26px", fontWeight: "700", color: "#1A1A1A", margin: "12px 0 4px 0" }}>₹{revenueGenerated.toFixed(2)}</h3>
              <span style={{ fontSize: "12px", color: "#6B7280" }}>Total gross order metrics</span>
            </div>

            <div style={{ background: "#FFFFFF", padding: "24px", borderRadius: "16px", border: "1px solid #ECECEC" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "13.5px", fontWeight: "600", color: "#6B7280" }}>Active Coupons</span>
                <LuPercent color="#C8A165" size={20} />
              </div>
              <h3 style={{ fontSize: "26px", fontWeight: "700", color: "#1A1A1A", margin: "12px 0 4px 0" }}>{activeCoupons}</h3>
              <span style={{ fontSize: "12px", color: "#6B7280" }}>Currently eligible codes</span>
            </div>
          </div>
        )}

        {showAddForm ? (
          /* CREATE NEW COUPON FORM */
          <div className="admin-card-container" style={{ padding: "32px", maxWidth: "800px" }}>
            <h3 style={{ fontSize: "18px", fontWeight: "700", marginBottom: "24px", color: "#1A1A1A" }}>Configure Luxury Coupon Discount</h3>
            
            <form onSubmit={handleCreateCoupon} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1A1A1A", marginBottom: "8px" }}>Coupon Code (Uppercase)</label>
                  <input
                    type="text"
                    placeholder="e.g. VENUSCARE20"
                    style={{ width: "100%", height: "46px", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "0 14px", textTransform: "uppercase" }}
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    required
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1A1A1A", marginBottom: "8px" }}>Discount Type</label>
                  <select
                    style={{ width: "100%", height: "46px", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "0 14px" }}
                    value={discountType}
                    onChange={(e) => setDiscountType(e.target.value)}
                  >
                    <option value="percentage">Percentage Discount (%)</option>
                    <option value="fixed">Fixed Flat Discount (₹)</option>
                  </select>
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1A1A1A", marginBottom: "8px" }}>Discount Value</label>
                  <input
                    type="number"
                    placeholder="e.g. 15 for 15% or 200 for ₹200"
                    style={{ width: "100%", height: "46px", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "0 14px" }}
                    value={discount}
                    onChange={(e) => setDiscount(e.target.value)}
                    min="1"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1A1A1A", marginBottom: "8px" }}>Minimum Order Value (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 999 (0 means no limit)"
                    style={{ width: "100%", height: "46px", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "0 14px" }}
                    value={minOrderValue}
                    onChange={(e) => setMinOrderValue(e.target.value)}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1A1A1A", marginBottom: "8px" }}>Start Date</label>
                  <input
                    type="date"
                    style={{ width: "100%", height: "46px", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "0 14px" }}
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1A1A1A", marginBottom: "8px" }}>Expiry Date</label>
                  <input
                    type="date"
                    style={{ width: "100%", height: "46px", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "0 14px" }}
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    required
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1A1A1A", marginBottom: "8px" }}>Maximum Discount Cap (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 500 (0 means unlimited)"
                    style={{ width: "100%", height: "46px", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "0 14px" }}
                    value={maxDiscount}
                    onChange={(e) => setMaxDiscount(e.target.value)}
                  />
                </div>

                <div>
                  <label style={{ display: "block", fontSize: "13px", fontWeight: "600", color: "#1A1A1A", marginBottom: "8px" }}>Total Usage Limit</label>
                  <input
                    type="number"
                    placeholder="e.g. 100 (0 means unlimited)"
                    style={{ width: "100%", height: "46px", border: "1px solid #E5E7EB", borderRadius: "10px", padding: "0 14px" }}
                    value={usageLimit}
                    onChange={(e) => setUsageLimit(e.target.value)}
                  />
                </div>
              </div>

              <button
                type="submit"
                className="btn-admin-primary"
                style={{ width: "100%", height: "48px", marginTop: "12px", border: "none" }}
              >
                Create Coupon Campaign
              </button>
            </form>
          </div>
        ) : (
          /* COUPONS LIST TABLE */
          <div className="admin-card-container" style={{ padding: "0", overflow: "hidden", borderRadius: "20px" }}>
            <table className="admin-premium-table" style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ background: "#FAFAFA", borderBottom: "1px solid #ECECEC" }}>
                  <th style={{ padding: "18px 24px", textAlign: "left", fontSize: "13px", color: "#6B7280", textTransform: "uppercase" }}>Coupon Code</th>
                  <th style={{ padding: "18px 24px", textAlign: "left", fontSize: "13px", color: "#6B7280", textTransform: "uppercase" }}>Type / Value</th>
                  <th style={{ padding: "18px 24px", textAlign: "left", fontSize: "13px", color: "#6B7280", textTransform: "uppercase" }}>Valid Duration</th>
                  <th style={{ padding: "18px 24px", textAlign: "center", fontSize: "13px", color: "#6B7280", textTransform: "uppercase" }}>Min Order / Cap</th>
                  <th style={{ padding: "18px 24px", textAlign: "center", fontSize: "13px", color: "#6B7280", textTransform: "uppercase" }}>Usage count</th>
                  <th style={{ padding: "18px 24px", textAlign: "center", fontSize: "13px", color: "#6B7280", textTransform: "uppercase" }}>Status</th>
                  <th style={{ padding: "18px 24px", textAlign: "right", fontSize: "13px", color: "#6B7280", textTransform: "uppercase" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  [...Array(3)].map((_, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid #ECECEC" }}>
                      <td style={{ padding: "20px 24px" }}><div className="shimmer-bg" style={{ height: "16px", width: "110px", borderRadius: "4px" }} /></td>
                      <td style={{ padding: "20px 24px" }}><div className="shimmer-bg" style={{ height: "16px", width: "90px", borderRadius: "4px" }} /></td>
                      <td style={{ padding: "20px 24px" }}><div className="shimmer-bg" style={{ height: "16px", width: "140px", borderRadius: "4px" }} /></td>
                      <td style={{ padding: "20px 24px" }}><div className="shimmer-bg" style={{ height: "16px", width: "80px", borderRadius: "4px" }} /></td>
                      <td style={{ padding: "20px 24px" }}><div className="shimmer-bg" style={{ height: "16px", width: "50px", borderRadius: "4px" }} /></td>
                      <td style={{ padding: "20px 24px" }}><div className="shimmer-bg" style={{ height: "24px", width: "70px", borderRadius: "20px" }} /></td>
                      <td style={{ padding: "20px 24px" }} />
                    </tr>
                  ))
                ) : coupons.map((c) => {
                  const hasExpired = new Date(c.expiryDate) < new Date();
                  const matchedAnal = analytics.find(a => a.code === c.code) || { timesUsed: 0, revenueGenerated: 0 };
                  
                  return (
                    <tr key={c._id} style={{ borderBottom: "1px solid #ECECEC" }} className="table-row-hover">
                      <td style={{ padding: "20px 24px" }}>
                        <span style={{ background: "#F5F5F5", color: "#1A1A1A", padding: "6px 12px", borderRadius: "8px", fontWeight: "700", fontFamily: "monospace", fontSize: "14px", border: "1px dashed #D1D5DB" }}>
                          {c.code}
                        </span>
                      </td>

                      <td style={{ padding: "20px 24px" }}>
                        <span style={{ fontWeight: "700", color: "#C8A165", fontSize: "15px" }}>
                          {c.discountType === "percentage" ? `${c.discount}% Off` : `₹${c.discount} Flat`}
                        </span>
                      </td>

                      <td style={{ padding: "20px 24px", fontSize: "13.5px", color: "#6B7280" }}>
                        <div>Start: {new Date(c.startDate).toLocaleDateString()}</div>
                        <div style={{ marginTop: "2px" }}>End: {new Date(c.expiryDate).toLocaleDateString()}</div>
                      </td>

                      <td style={{ padding: "20px 24px", textAlign: "center", fontSize: "13.5px", color: "#1A1A1A" }}>
                        <div>Min Order: ₹{c.minOrderValue || 0}</div>
                        {c.maxDiscount > 0 && <div style={{ fontSize: "11px", color: "#6B7280" }}>Max Cap: ₹{c.maxDiscount}</div>}
                      </td>

                      <td style={{ padding: "20px 24px", textAlign: "center" }}>
                        <div style={{ fontWeight: "700", color: "#1A1A1A" }}>{matchedAnal.timesUsed} uses</div>
                        {c.usageLimit > 0 && <div style={{ fontSize: "11px", color: "#6B7280" }}>Limit: {c.usageLimit}</div>}
                      </td>

                      <td style={{ padding: "20px 24px", textAlign: "center" }}>
                        {hasExpired ? (
                          <span style={{ background: "#FEE2E2", color: "#DC2626", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" }}>
                            Expired
                          </span>
                        ) : c.active ? (
                          <span style={{ background: "#D1FAE5", color: "#16A34A", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" }}>
                            Active
                          </span>
                        ) : (
                          <span style={{ background: "#F3F4F6", color: "#6B7280", padding: "4px 10px", borderRadius: "20px", fontSize: "12px", fontWeight: "700" }}>
                            Inactive
                          </span>
                        )}
                      </td>

                      <td style={{ padding: "20px 24px", textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "10px", alignItems: "center" }}>
                          <button
                            onClick={() => toggleActiveStatus(c._id, c.active)}
                            style={{ background: "none", border: "none", color: "#C8A165", cursor: "pointer", fontSize: "13px", fontWeight: "600" }}
                          >
                            {c.active ? "Pause" : "Activate"}
                          </button>
                          
                          <button
                            onClick={() => handleDelete(c._id)}
                            style={{ background: "none", border: "none", color: "#DC2626", cursor: "pointer", display: "inline-flex", alignItems: "center" }}
                            title="Delete campaign"
                          >
                            <LuTrash size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {!loading && coupons.length === 0 && (
              <div style={{ padding: "50px", textAlign: "center", color: "#6B7280" }}>No coupons configured yet. Click "Create New Coupon" to start.</div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default AdminCoupons;
