import { FaFileContract, FaRegHandshake, FaUserCheck, FaBan, FaBalanceScale } from "react-icons/fa";
import { Link } from "react-router-dom";
import "../styles/policy.css";

const TermsConditions = () => {
  return (
    <div className="policy-container route-fade-in" style={{ padding: "40px 20px" }}>
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
