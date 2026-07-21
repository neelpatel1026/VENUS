import { FaLock, FaUserShield, FaCookie, FaDatabase, FaEnvelope } from "react-icons/fa";
import { Link } from "react-router-dom";
import "../styles/policy.css";

const PrivacyPolicy = () => {
  return (
    <div className="policy-container route-fade-in" style={{ padding: "40px 20px" }}>
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
