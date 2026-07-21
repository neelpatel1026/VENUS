import React from "react";
import { Link } from "react-router-dom";
import "../styles/ordersuccess.css";

const ReturnSuccess = () => {
  return (
    <div className="ordersuccess-page-wrapper route-fade-in" style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "65vh" }}>
      <div className="ordersuccess-hero-card" style={{ maxWidth: "600px", width: "100%", margin: "0 auto" }}>
        
        <div className="success-icon-badge">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="32" height="32" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
            <polyline points="20 6 9 17 4 12" />
          </svg>
        </div>

        <span className="hero-status-label">Success</span>
        <h1 style={{ fontSize: "2rem", fontFamily: "'Cinzel', serif", fontWeight: "600" }}>Return Submitted</h1>

        <p className="hero-subtext" style={{ fontSize: "0.95rem", margin: "16px 0 32px 0" }}>
          Your request has been successfully recorded. Our quality assurance team will review the details and images within 24-48 hours.
        </p>

        <Link to="/my-returns" className="btn" style={{ borderRadius: "30px", textTransform: "uppercase", letterSpacing: "1px", padding: "12px 32px" }}>
          Track Return Request
        </Link>
      </div>
    </div>
  );
};

export default ReturnSuccess;
