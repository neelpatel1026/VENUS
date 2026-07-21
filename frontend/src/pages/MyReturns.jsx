import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/MyReturns.css";

const MyReturns = () => {
  const { user } = useContext(AuthContext);
  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

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
        console.error(error);
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
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(350px, 1fr))", gap: "24px" }}>
          {[1, 2].map((i) => (
            <div key={i} style={{ border: "1px solid #ECE7DF", background: "#FFFFFF", padding: "24px", borderRadius: "16px" }}>
              <div className="shimmer-bg" style={{ height: "20px", width: "120px", borderRadius: "4px", marginBottom: "16px" }} />
              <div className="shimmer-bg" style={{ height: "14px", width: "80%", borderRadius: "4px", marginBottom: "8px" }} />
              <div className="shimmer-bg" style={{ height: "14px", width: "50%", borderRadius: "4px" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="myreturns-page route-fade-in">
      {returns.length === 0 ? (
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
            <circle cx="32" cy="32" r="30" />
            <path d="M32 18v28M18 32h28" style={{ transform: "rotate(45deg)", transformOrigin: "32px 32px" }} />
          </svg>
          <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#1A1A1A', margin: '0 0 10px 0' }}>
            No Return Requests
          </h3>
          <p style={{ color: '#6B7280', lineHeight: '1.6', margin: '0 0 24px 0', fontSize: '0.95rem' }}>
            You haven't initiated any return or refund requests. If you have issues with your product delivery, please reach out.
          </p>
          <Link
            to="/profile"
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
            Back to Dashboard
          </Link>
        </div>
      ) : (
        <div className="returns-grid">
          {returns.map((item) => (
            <div className="return-card" key={item._id}>
              <div className="return-header">
                <h3>Order #{item.orderId?._id?.slice(-8) || "N/A"}</h3>
                <span className={`status ${item.status.toLowerCase().replace(/\s/g, "-")}`}>
                  {item.status}
                </span>
              </div>

              <p style={{ color: "#1A1A1A" }}>
                <strong>Reason:</strong> {item.reason}
              </p>

              {item.adminRemark && (
                <p style={{ color: "#6B7280", marginTop: "8px" }}>
                  <strong>Admin Remark:</strong> {item.adminRemark}
                </p>
              )}

              {item.returnImages?.length > 0 && (
                <div className="images">
                  {item.returnImages.map((img, index) => (
                    <img key={index} src={img} alt="" loading="lazy" />
                  ))}
                </div>
              )}

              <div className="dates">
                <span>
                  Created: {new Date(item.createdAt).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyReturns;
