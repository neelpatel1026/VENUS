import { FaLock, FaUserShield, FaCookie, FaDatabase, FaEnvelope } from "react-icons/fa";
import { Link } from "react-router-dom";
import "../styles/policy.css";

const PrivacyPolicy = () => {
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
            <span style={{ color: "#1F2937" }}>Privacy</span>
          </div>
          
          <span style={{ display: "inline-block", fontSize: "0.8rem", letterSpacing: "3px", textTransform: "uppercase", color: "#C8A96B", fontWeight: "700", marginBottom: "8px" }}>
            Legal Policies
          </span>
          <h1 style={{ fontFamily: "'Cinzel', 'Didot', 'Times New Roman', serif", fontSize: "2.5rem", fontWeight: "700", color: "#1F2937", margin: "0 0 10px 0", letterSpacing: "-0.5px", lineHeight: "1.2" }}>
            Privacy Policy Standards
          </h1>
          <div style={{ width: "40px", height: "1px", background: "#C8A96B", margin: "14px auto" }} />
          <p style={{ fontSize: "0.95rem", color: "#6B7280", margin: "0 auto", lineHeight: "1.6", maxWidth: "600px" }}>
            Read our privacy terms, cookies standards, and data encryption security certifications.
          </p>
        </div>
      </div>

      <div className="policy-card">
        <div className="policy-section">
          <h2>
            <span className="icon-wrapper"><FaUserShield /></span>
            1. Information Collection
          </h2>
          <p>
            At VENUS CARE, we collect information when you register an account, place an order, subscribe to our newsletter, or fill out a support form. The collected information includes your name, email address, phone number, shipping/billing address, and payment information.
          </p>
        </div>

        <div className="policy-section">
          <h2>
            <span className="icon-wrapper"><FaDatabase /></span>
            2. How We Use Your Data
          </h2>
          <p>
            Any information we collect from you may be used for the following purposes:
          </p>
          <ul>
            <li>To process your transactions and dispatch orders securely.</li>
            <li>To personalize your shopping experience and respond to customer service inquiries.</li>
            <li>To send periodic emails regarding order status, tracking updates, and promotional newsletter offers (which you can opt-out of at any time).</li>
            <li>To improve our website structure, services, and product catalog.</li>
          </ul>
        </div>

        <div className="policy-section">
          <h2>
            <span className="icon-wrapper"><FaLock /></span>
            3. Data Protection and Security
          </h2>
          <p>
            We implement a variety of premium security measures to maintain the safety of your personal information. All sensitive payment details are securely processed via tokenized pathways using encrypted Razorpay gateway protocols. We do not store credit/debit card credentials directly on our servers.
          </p>
        </div>

        <div className="policy-section">
          <h2>
            <span className="icon-wrapper"><FaCookie /></span>
            4. Cookie Policy
          </h2>
          <p>
            Our website uses cookies to recognize your browser, capture item selections in your shopping cart, and compile aggregate data about site traffic and user interactions. This helps us optimize site features and save your preferences for future visits.
          </p>
        </div>

        <div className="policy-section">
          <h2>
            <span className="icon-wrapper"><FaEnvelope /></span>
            5. Contact Information
          </h2>
          <p>
            If you have any questions or concerns regarding this privacy statement, please contact our support department at <strong>support@venuscare.com</strong> or submit a request directly through our Customer Support system.
          </p>
        </div>
      </div>
    </div>
  );
};

export default PrivacyPolicy;
