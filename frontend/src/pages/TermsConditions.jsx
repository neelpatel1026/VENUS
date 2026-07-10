import { FaFileContract, FaRegHandshake, FaUserCheck, FaBan, FaBalanceScale } from "react-icons/fa";
import { Link } from "react-router-dom";
import "../styles/policy.css";

const TermsConditions = () => {
  return (
    <div className="policy-container" style={{ padding: "0 0 40px 0" }}>
      {/* Editorial Hero Header Banner */}
      <div 
        className="premium-page-hero"
        style={{ 
          background: "linear-gradient(135deg, #FAF6F0 0%, #F5ECE0 100%)", 
          borderBottom: "1px solid rgba(200, 169, 107, 0.2)", 
          padding: "40px 20px", 
          textAlign: "center", 
          position: "relative",
          overflow: "hidden",
          width: "100%",
          marginBottom: "40px"
        }}
      >
        <div style={{ position: "absolute", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(200, 169, 107, 0.08)", filter: "blur(40px)", top: "-50px", left: "-50px", pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: "250px", height: "250px", borderRadius: "50%", background: "rgba(200, 169, 107, 0.05)", filter: "blur(60px)", bottom: "-80px", right: "-50px", pointerEvents: "none" }} />
        
        <div style={{ maxWidth: "800px", margin: "0 auto", position: "relative", zIndex: "2" }}>
          <div style={{ fontSize: "0.75rem", letterSpacing: "2px", textTransform: "uppercase", color: "#8B7355", marginBottom: "14px", fontWeight: "700" }}>
            <Link to="/" style={{ color: "#8B7355", textDecoration: "none" }}>Home</Link>
            <span style={{ margin: "0 8px", opacity: 0.5 }}>/</span>
            <span style={{ color: "#1F2937" }}>Terms</span>
          </div>
          
          <span style={{ display: "inline-block", fontSize: "0.8rem", letterSpacing: "3px", textTransform: "uppercase", color: "#C8A96B", fontWeight: "700", marginBottom: "8px" }}>
            Terms of Use
          </span>
          <h1 style={{ fontFamily: "'Cinzel', 'Didot', 'Times New Roman', serif", fontSize: "2.5rem", fontWeight: "700", color: "#1F2937", margin: "0 0 10px 0", letterSpacing: "-0.5px", lineHeight: "1.2" }}>
            Terms & Conditions Guidelines
          </h1>
          <div style={{ width: "40px", height: "1px", background: "#C8A96B", margin: "14px auto" }} />
          <p style={{ fontSize: "0.95rem", color: "#6B7280", margin: "0 auto", lineHeight: "1.6", maxWidth: "600px" }}>
            Read our consumer store agreement, purchase guidelines, and returns conditions policies.
          </p>
        </div>
      </div>

      <div className="policy-card">
        <div className="policy-section">
          <h2>
            <span className="icon-wrapper"><FaRegHandshake /></span>
            1. Agreement to Terms
          </h2>
          <p>
            By accessing or purchasing from the VENUS CARE website, you unconditionally agree to be bound by these Terms and Conditions. If you do not agree with any part of these terms, you are prohibited from using our site or purchasing our cosmetic merchandise.
          </p>
        </div>

        <div className="policy-section">
          <h2>
            <span className="icon-wrapper"><FaUserCheck /></span>
            2. Customer Account Responsibility
          </h2>
          <p>
            When registering an account on our platform, you are responsible for maintaining the confidentiality of your login credentials and preventing unauthorized access to your account. You agree to assume responsibility for all activities occurring under your account.
          </p>
        </div>

        <div className="policy-section">
          <h2>
            <span className="icon-wrapper"><FaFileContract /></span>
            3. Accuracy of Billing and Orders
          </h2>
          <p>
            We reserve the right to refuse or limit any order you place with us. In the event we make a change to or cancel an order, we will notify you by contacting the email address or phone number provided at the checkout interface. You agree to provide current, complete, and accurate billing details.
          </p>
        </div>

        <div className="policy-section">
          <h2>
            <span className="icon-wrapper"><FaBan /></span>
            4. Prohibited Uses
          </h2>
          <p>
            You are prohibited from using the platform or its graphic materials: (a) for any unlawful purpose; (b) to solicit others to perform or participate in any unlawful acts; (c) to infringe upon or violate our intellectual property rights or the rights of others; or (d) to upload or transmit viruses or any other type of malicious code.
          </p>
        </div>

        <div className="policy-section">
          <h2>
            <span className="icon-wrapper"><FaBalanceScale /></span>
            5. Governing Law
          </h2>
          <p>
            These Terms and Conditions and any separate purchase agreements whereby we provide you services shall be governed by and construed in accordance with the laws of Gujarat, India, under the jurisdiction of the courts of Ahmedabad.
          </p>
        </div>
      </div>
    </div>
  );
};

export default TermsConditions;
