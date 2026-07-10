import React from "react";
import { FaTruck, FaMapMarkerAlt, FaCalendarCheck, FaClock, FaBoxOpen } from "react-icons/fa";
import "../styles/policy.css";

const ShippingPolicy = () => {
  return (
    <div className="policy-container">
      <div className="policy-hero">
        <h1>Shipping Policy</h1>
        <p>Learn about our shipping procedures, delivery timelines, and transit rates.</p>
      </div>

      <div className="policy-card">
        <div className="policy-section">
          <h2>
            <span className="icon-wrapper"><FaClock /></span>
            1. Order Processing Time
          </h2>
          <p>
            All VENUS CARE orders are processed and prepared for shipping within <strong>1–2 business days</strong>. Orders placed on Sundays or public holidays will be processed on the following business working day. Once shipped, you will receive a tracking confirmation number via email.
          </p>
        </div>

        <div className="policy-section">
          <h2>
            <span className="icon-wrapper"><FaTruck /></span>
            2. Domestic Delivery Timelines
          </h2>
          <p>
            We partner with premier courier networks to deliver cosmetic packages safely across India. Typical delivery time frames depend on destinations:
          </p>
          <ul>
            <li>Metro Cities: <strong>3–5 business days</strong></li>
            <li>Rest of India: <strong>5–7 business days</strong></li>
            <li>Remote Regions: <strong>7–10 business days</strong></li>
          </ul>
        </div>

        <div className="policy-section">
          <h2>
            <span className="icon-wrapper"><FaBoxOpen /></span>
            3. Shipping Rates
          </h2>
          <p>
            Shipping costs are calculated automatically at checkout based on order totals:
          </p>
          <ul>
            <li>Free standard shipping is provided on all orders of ₹499 and above.</li>
            <li>A nominal flat shipping charge of ₹50 applies to orders below ₹499.</li>
          </ul>
        </div>

        <div className="policy-section">
          <h2>
            <span className="icon-wrapper"><FaMapMarkerAlt /></span>
            4. Delivery Attempts and Address Issues
          </h2>
          <p>
            Our logistics partners will attempt delivery up to three times. If a package is returned to our warehouse due to incorrect shipping addresses, incomplete contact details, or unavailability after multiple attempts, shipping charges for resending the order may apply.
          </p>
        </div>

        <div className="policy-section">
          <h2>
            <span className="icon-wrapper"><FaCalendarCheck /></span>
            5. Damages and Lost Shipments
          </h2>
          <p>
            If your package is delivered damaged or incorrect, please reach out within 48 hours of delivery and provide clear photographs through the Contact Us page or submit a support ticket so our care team can quickly dispatch replacements.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ShippingPolicy;
