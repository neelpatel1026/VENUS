import React, { useEffect, useState, useContext } from "react";
import { useParams, useNavigate } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";
import { AuthContext } from "../context/AuthContext";
import axios from "axios";
import toast from "react-hot-toast";

const AdminUserDetails = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [targetUser, setTargetUser] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Coin Adjustment variables
  const [adjustType, setAdjustType] = useState("Earned");
  const [coinsAmount, setCoinsAmount] = useState(0);
  const [adjustDesc, setAdjustDesc] = useState("");

  const fetchUserDetails = async () => {
    try {
      // Get target user using standard API
      const res = await axios.get("/api/auth/users", {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      const found = res.data.find(u => u._id === id);
      if (found) {
        setTargetUser(found);
      } else {
        toast.error("User not found");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to load user information");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user?.role !== "admin") {
      navigate("/");
      return;
    }
    fetchUserDetails();
  }, [id, user]);

  const handleAdjustCoins = async (e) => {
    e.preventDefault();
    if (coinsAmount <= 0) {
      toast.error("Amount must be greater than zero");
      return;
    }
    try {
      toast.loading("Processing adjustments...");
      const res = await axios.post("/api/rewards/admin/adjust", {
        userId: id,
        transactionType: adjustType,
        coins: coinsAmount,
        description: adjustDesc
      }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.dismiss();
      if (res.data?.success) {
        toast.success("Wallet coins adjusted successfully!");
        setCoinsAmount(0);
        setAdjustDesc("");
        fetchUserDetails();
      }
    } catch (err) {
      toast.dismiss();
      toast.error(err.response?.data?.message || "Adjustment failed");
    }
  };

  const handleToggleFreeze = async (freeze) => {
    try {
      toast.loading(freeze ? "Freezing wallet..." : "Unfreezing wallet...");
      const path = freeze ? "/api/rewards/admin/freeze" : "/api/rewards/admin/unfreeze";
      await axios.post(path, { userId: id }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.dismiss();
      toast.success(freeze ? "Wallet Frozen ✓" : "Wallet Unfrozen ✓");
      fetchUserDetails();
    } catch (err) {
      toast.dismiss();
      toast.error("Failed to update wallet state");
    }
  };

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "80vh" }}>
        <span>Loading account info...</span>
      </div>
    );
  }

  return (
    <div className="admin-layout-wrapper">
      <AdminSidebar />
      <div className="admin-content-console" style={{ padding: "20px", background: "#FAF8F5", minHeight: "100vh", flex: 1 }}>
        <button onClick={() => navigate(-1)} style={{ background: "none", border: "none", color: "#C8A165", cursor: "pointer", fontWeight: "600", marginBottom: "12px" }}>
          ← Back to Users
        </button>

        <div style={{ background: "#FFFFFF", border: "1px solid #ECEBE7", borderRadius: "16px", padding: "20px", marginBottom: "20px" }}>
          <h2 style={{ fontSize: "18px", margin: "0 0 14px 0", color: "#1A1A1A" }}>User Rewards Overview</h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px" }}>
            <div style={{ background: "#FAF8F5", padding: "14px", borderRadius: "12px" }}>
              <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#9CA3AF" }}>Email Address</span>
              <strong style={{ display: "block", fontSize: "14px", marginTop: "4px" }}>{targetUser?.email}</strong>
            </div>
            <div style={{ background: "#FAF8F5", padding: "14px", borderRadius: "12px" }}>
              <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#9CA3AF" }}>Wallet Balance</span>
              <strong style={{ display: "block", fontSize: "18px", color: "#C8A165", marginTop: "4px" }}>⭐ {targetUser?.walletBalance || 0} Coins</strong>
            </div>
            <div style={{ background: "#FAF8F5", padding: "14px", borderRadius: "12px" }}>
              <span style={{ fontSize: "11px", textTransform: "uppercase", color: "#9CA3AF" }}>Wallet State</span>
              <strong style={{ display: "block", fontSize: "14px", color: targetUser?.isWalletFrozen ? "#DC2626" : "#16A34A", marginTop: "4px" }}>
                {targetUser?.isWalletFrozen ? "FREEZED" : "ACTIVE"}
              </strong>
            </div>
          </div>
        </div>

        {/* Adjust Coins Console */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
          <div style={{ background: "#FFFFFF", border: "1px solid #ECEBE7", borderRadius: "16px", padding: "20px" }}>
            <h3 style={{ fontSize: "15px", margin: "0 0 14px 0" }}>Adjust Coins Balance</h3>
            <form onSubmit={handleAdjustCoins}>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "12px", display: "block", marginBottom: "4px" }}>Adjustment Action</label>
                <select value={adjustType} onChange={(e) => setAdjustType(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #ECEBE7" }}>
                  <option value="Earned">Add Coins (Earned)</option>
                  <option value="Used">Deduct Coins (Used)</option>
                  <option value="Adjusted">Adjust (Custom)</option>
                  <option value="Refund Reversal">Refund Reversal</option>
                  <option value="Expired">Expire Coins</option>
                </select>
              </div>
              <div style={{ marginBottom: "12px" }}>
                <label style={{ fontSize: "12px", display: "block", marginBottom: "4px" }}>Coins Count</label>
                <input type="number" value={coinsAmount} onChange={(e) => setCoinsAmount(Number(e.target.value))} style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #ECEBE7" }} />
              </div>
              <div style={{ marginBottom: "14px" }}>
                <label style={{ fontSize: "12px", display: "block", marginBottom: "4px" }}>Reason/Remarks</label>
                <input type="text" placeholder="e.g. Campaign Cashback adjustments" value={adjustDesc} onChange={(e) => setAdjustDesc(e.target.value)} style={{ width: "100%", padding: "8px", borderRadius: "8px", border: "1px solid #ECEBE7" }} />
              </div>
              <button type="submit" style={{ width: "100%", background: "#C8A165", color: "#FFFFFF", border: "none", padding: "10px", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}>
                Submit Action
              </button>
            </form>
          </div>

          <div style={{ background: "#FFFFFF", border: "1px solid #ECEBE7", borderRadius: "16px", padding: "20px" }}>
            <h3 style={{ fontSize: "15px", margin: "0 0 14px 0" }}>Wallet Security Adjustments</h3>
            <p style={{ fontSize: "13px", color: "#6B7280", lineHeight: "1.5" }}>
              Freezing a wallet locks down the balance, preventing the customer from applying any coins during coupon checkout routes.
            </p>
            {targetUser?.isWalletFrozen ? (
              <button onClick={() => handleToggleFreeze(false)} style={{ background: "#16A34A", color: "#FFFFFF", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", marginTop: "12px" }}>
                Unfreeze Rewards Wallet
              </button>
            ) : (
              <button onClick={() => handleToggleFreeze(true)} style={{ background: "#DC2626", color: "#FFFFFF", border: "none", padding: "10px 20px", borderRadius: "8px", fontWeight: "700", cursor: "pointer", marginTop: "12px" }}>
                Freeze Rewards Wallet
              </button>
            )}
          </div>
        </div>

        {/* Transactions log table */}
        <div style={{ background: "#FFFFFF", border: "1px solid #ECEBE7", borderRadius: "16px", padding: "20px", marginTop: "20px" }}>
          <h3 style={{ fontSize: "15px", margin: "0 0 14px 0" }}>Wallet Transaction Logs</h3>
          {targetUser?.rewardTransactions?.length === 0 ? (
            <p style={{ fontSize: "13.5px", color: "#6B7280" }}>No transaction records for this user.</p>
          ) : (
            <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
              <thead>
                <tr style={{ background: "#FAF8F5", borderBottom: "1px solid #ECEBE7", textAlign: "left" }}>
                  <th style={{ padding: "8px" }}>Type</th>
                  <th style={{ padding: "8px" }}>Coins</th>
                  <th style={{ padding: "8px" }}>Remarks</th>
                  <th style={{ padding: "8px" }}>Admin</th>
                  <th style={{ padding: "8px" }}>Date</th>
                </tr>
              </thead>
              <tbody>
                {[...(targetUser?.rewardTransactions || [])].reverse().map((t, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid #FAF8F5" }}>
                    <td style={{ padding: "8px" }}><strong>{t.transactionType}</strong></td>
                    <td style={{ padding: "8px", color: "#C8A165" }}>⭐ {t.coins}</td>
                    <td style={{ padding: "8px", color: "#4B5563" }}>{t.description || "N/A"}</td>
                    <td style={{ padding: "8px" }}>{t.adminName || "System"}</td>
                    <td style={{ padding: "8px" }}>{new Date(t.createdAt).toLocaleDateString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminUserDetails;