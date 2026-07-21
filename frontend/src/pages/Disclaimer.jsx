import React from 'react';
import { FaInfoCircle } from 'react-icons/fa';
import "../styles/policy.css";

const Disclaimer = () => {
  return (
    <div className="policy-container route-fade-in" style={{ padding: "40px 20px" }}>
      <div className="policy-card">
        
        <div className="policy-section">
          <h2>
            <span className="icon-wrapper"><FaInfoCircle /></span>
            Disclaimer
          </h2>
          <p>
            Welcome to VENUS CARE. We are committed to providing high-quality,
            100% acid-free skincare products designed to support healthy and
            radiant skin. Please read the following disclaimer carefully before
            using our website or products.
          </p>
        </div>

        <div className="policy-section">
          <h2>1. Product Information</h2>
          <p>
            We strive to ensure that all product descriptions, images,
            ingredients, and information displayed on our website are accurate.
            However, actual product packaging and appearance may vary slightly.
          </p>
        </div>

        <div className="policy-section">
          <h2>2. Individual Results May Vary</h2>
          <p>
            Skincare results vary from person to person depending on skin type,
            lifestyle, and individual conditions. VENUS CARE does not guarantee
            specific results from the use of any product.
          </p>
        </div>

        <div className="policy-section">
          <h2>3. Medical Advice</h2>
          <p>
            The information provided on this website is for general educational
            and informational purposes only and should not be considered medical
            advice. If you have a skin condition, allergy, or medical concern,
            please consult a qualified healthcare professional before using any
            skincare product.
          </p>
        </div>

        <div className="policy-section">
          <h2>4. Allergic Reactions</h2>
          <p>
            Although our products are formulated with carefully selected
            ingredients, individual sensitivities may occur. We recommend
            performing a patch test before regular use of any skincare product.
          </p>
        </div>

        <div className="policy-section">
          <h2>5. External Links</h2>
          <p>
            Our website may contain links to third-party websites for additional
            information or services. VENUS CARE is not responsible for the content,
            privacy policies, or practices of such external websites.
          </p>
        </div>

        <div className="policy-section">
          <h2>6. Limitation of Liability</h2>
          <p>
            VENUS CARE shall not be held liable for any direct, indirect,
            incidental, or consequential damages resulting from the use or
            misuse of our products or website. By using our website, you agree
            to these terms and conditions.
          </p>
        </div>

        <p style={{ marginTop: '20px', fontStyle: 'italic', fontSize: '0.9rem', color: 'var(--muted)' }}>
          By accessing and using the VENUS CARE website, you acknowledge that
          you have read, understood, and agreed to this disclaimer.
        </p>

      </div>
    </div>
  );
};

export default Disclaimer;