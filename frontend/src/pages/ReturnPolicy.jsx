import React from "react";
import { useNavigate } from "react-router-dom";
import { FaUndo, FaSyncAlt, FaHourglassHalf, FaClipboardCheck, FaHeadphones } from "react-icons/fa";
import "../styles/policy.css";

const ReturnPolicy = () => {
  const navigate = useNavigate();

  return (
    <div className="policy-container route-fade-in" style={{ padding: "40px 20px" }}>
      <div className="policy-card">
        {/* Eligibility Section */}
        <div className="policy-section">
          <h2>
            <span className="icon-wrapper"><FaClipboardCheck /></span>
            1. Return Eligibility
          </h2>
          <p>
            Returns are accepted only for products received in damaged, defective, or incorrect condition. To qualify for a return or exchange, you must contact our care team within <strong>48 hours of delivery</strong> and submit details including product images. The items must be completely unused, housed in the same condition received, and stored inside original packaging.
          </p>
        </div>

        {/* Timeline process steps */}
        <div className="policy-section">
          <h2>
            <span className="icon-wrapper"><FaHourglassHalf /></span>
            2. Return Process Timeline
          </h2>
          <p>
            Our seamless return and exchange operations follow a simple four-step process:
          </p>
          <div className="process-timeline">
            <div className="timeline-step">
              <div className="step-number">1</div>
              <h4>Submit Request</h4>
              <p>Request return inside order history or click Support.</p>
            </div>
            <div className="timeline-step">
              <div className="step-number">2</div>
              <h4>Inspection</h4>
              <p>Support inspects package condition & details (24 hours).</p>
            </div>
            <div className="timeline-step">
              <div className="step-number">3</div>
              <h4>Pickup</h4>
              <p>Pickup team retrieves package from destination address.</p>
            </div>
            <div className="timeline-step">
              <div className="step-number">4</div>
              <h4>Resolution</h4>
              <p>Refund gateway triggers or replacement item is dispatched.</p>
            </div>
          </div>
        </div>

        {/* Refund processing */}
        <div className="policy-section">
          <h2>
            <span className="icon-wrapper"><FaUndo /></span>
            3. Refund Process
          </h2>
          <p>
            Once a return is received and inspected at our warehouse, approved refunds are credited back to your original payment method (Credit card, Net banking, or Wallet via Razorpay) within <strong>5–7 business days</strong>. For Cash on Delivery orders, refunds are issued to your provided bank account or UPI ID.
          </p>
        </div>

        {/* Exchange Policy */}
        <div className="policy-section">
          <h2>
            <span className="icon-wrapper"><FaSyncAlt /></span>
            4. Exchange Policy
          </h2>
          <p>
            If you received a damaged, defective, or incorrect cosmetic product and wish to exchange it for a fresh replacement, we will arrange a direct replacement order free of cost, subject to warehouse stock availability.
          </p>
        </div>

        {/* FAQ support section */}
        <div className="policy-section" style={{ borderTop: "1px solid #E8DFD2", paddingTop: "30px", marginTop: "10px" }}>
          <h2>
            <span className="icon-wrapper"><FaHeadphones style={{ color: "#C8A96B" }} /></span>
            Need Help with a Return?
          </h2>
          <p>
            Our customer care team is available 24/7 online to assist with any questions, return requests, or refund issues. Click the button below to log a support ticket directly.
          </p>
          <button
            onClick={() => navigate("/contact")}
            className="submit-btn"
            style={{ width: "fit-content", padding: "12px 28px", marginTop: "15px" }}
          >
            Contact Customer Support
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReturnPolicy;