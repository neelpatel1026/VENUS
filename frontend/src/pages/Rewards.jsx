import React, { useEffect, useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";

const Rewards = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [wallet, setWallet] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate("/login");
      return;
    }
    const fetchWallet = async () => {
      try {
        const res = await fetch("/api/rewards/wallet", {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        const data = await res.json();
        if (res.ok) {
          setWallet(data);
        } else {
          toast.error("Failed to load rewards balance");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
    fetchWallet();
  }, [user, navigate]);

  if (loading) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ width: "24px", height: "24px", borderRadius: "50%", border: "2px solid #EEE", borderTopColor: "#C8A165", animation: "spin 1s linear infinite" }}></div>
      </div>
    );
  }

  const balance = wallet?.walletBalance || 0;
  const earned = wallet?.totalEarned || 0;
  const redeemed = wallet?.totalRedeemed || 0;

  // Level Logic
  let level = "Bronze";
  let color = "#CD7F32";
  let min = 0;
  let max = 499;

  if (earned >= 500 && earned < 1500) {
    level = "Silver";
    color = "#C0C0C0";
    min = 500;
    max = 1499;
  } else if (earned >= 1500 && earned < 3000) {
    level = "Gold";
    color = "#C8A165";
    min = 1500;
    max = 2999;
  } else if (earned >= 3000) {
    level = "Platinum";
    color = "#E5E4E2";
    min = 3000;
    max = 10000;
  }

  const progressPercentage = Math.min(100, Math.max(0, ((earned - min) / (max - min)) * 100));

  return (
    <div style={{ background: "#FAFAFA", minHeight: "100vh", padding: "20px 16px" }}>
      <div style={{ maxWidth: "800px", margin: "0 auto" }}>
        {/* Back navigation */}
        <button 
          onClick={() => navigate(-1)} 
          style={{ background: "none", border: "none", color: "#C8A165", fontSize: "14px", fontWeight: "600", cursor: "pointer", display: "flex", alignItems: "center", gap: "6px", marginBottom: "16px", padding: 0 }}
        >
          ← Back
        </button>

        {/* Level card banner */}
        <div style={{ background: "linear-gradient(135deg, #1A1A1A 0%, #2A2A2A 100%)", borderRadius: "20px", padding: "24px", color: "#FFFFFF", marginBottom: "20px", position: "relative", overflow: "hidden", boxShadow: "0 10px 30px rgba(0,0,0,0.15)" }}>
          <div style={{ position: "absolute", right: "-20px", bottom: "-20px", fontSize: "120px", opacity: 0.05 }}>⭐</div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
            <div>
              <span style={{ fontSize: "11px", textTransform: "uppercase", letterSpacing: "1.5px", color: color, fontWeight: "700" }}>{level} Membership</span>
              <h2 style={{ fontSize: "28px", margin: "4px 0 0 0", fontFamily: "Cinzel, serif", fontWeight: "400" }}>
                ⭐ {balance} <span style={{ fontSize: "16px", color: "#C8A165" }}>Coins</span>
              </h2>
              <p style={{ fontSize: "12.5px", color: "#9CA3AF", margin: "4px 0 0 0" }}>Wallet Value: ₹{balance}</p>
            </div>
            <div style={{ background: "rgba(200, 161, 101, 0.15)", border: `1px solid ${color}`, borderRadius: "30px", padding: "6px 16px", fontSize: "12px", fontWeight: "700", color: "#FFFFFF" }}>
              {level} Tier
            </div>
          </div>

          <div style={{ marginBottom: "6px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#9CA3AF", marginBottom: "6px" }}>
              <span>Lifetime Earned: {earned} Coins</span>
              <span>Next Milestone: {max + 1} Coins</span>
            </div>
            <div style={{ background: "rgba(255,255,255,0.1)", height: "6px", borderRadius: "3px", overflow: "hidden" }}>
              <div style={{ background: color, width: `${progressPercentage}%`, height: "100%", transition: "width 0.4s ease" }}></div>
            </div>
          </div>
        </div>

        {/* Transactions block */}
        <h3 style={{ fontSize: "15px", fontWeight: "600", textTransform: "uppercase", letterSpacing: "1px", margin: "0 0 12px 0", color: "#1A1A1A" }}>Reward Transactions</h3>

        {wallet?.transactions?.length === 0 ? (
          <div style={{ textAlign: "center", padding: "40px 20px", background: "#FFFFFF", borderRadius: "16px", border: "1px solid #ECECEC" }}>
            <p style={{ fontSize: "13px", color: "#6B7280", margin: 0 }}>No coins transactions loaded yet.</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
            {[...(wallet?.transactions || [])].reverse().map((t, idx) => (
              <div key={idx} style={{ background: "#FFFFFF", border: "1px solid #ECECEC", borderRadius: "14px", padding: "14px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <div>
                  <strong style={{ fontSize: "13.5px", color: "#1A1A1A", display: "block" }}>{t.transactionType}</strong>
                  <span style={{ fontSize: "12px", color: "#9CA3AF", display: "block", marginTop: "2px" }}>
                    {new Date(t.createdAt).toLocaleDateString()} • {t.description || "Cashback award"}
                  </span>
                </div>
                <strong style={{ fontSize: "15px", color: ["Earned", "Refund Reversal"].includes(t.transactionType) ? "#2E7D32" : "#C62828" }}>
                  {["Earned", "Refund Reversal"].includes(t.transactionType) ? `+${t.coins}` : `-${t.coins}`}
                </strong>
              </div>
            ))}
          </div>
        )}
      </div>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
};

export default Rewards;
