import React, { useState } from "react";
import { FaPaperPlane, FaGift, FaStar, FaInfoCircle } from "react-icons/fa";
import "../styles/newsletter.css";

const Newsletter = () => {
  const [email, setEmail] = useState("");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    if (email.trim()) {
      setSubmitted(true);
      setEmail("");
    }
  };

  return (
    <section className="newsletter-section-lux font-outfit">
      <div className="newsletter-lux-container">
        
        {/* Left Side: Text and Benefits */}
        <div className="newsletter-lux-info">
          <span className="newsletter-lux-tag">VENUS BEAUTY CLUB</span>
          <h2 className="newsletter-lux-title font-serif">Join the VENUS Beauty Club</h2>
          <p className="newsletter-lux-subtitle">
            Subscribe to receive skincare rituals, early product releases, and exclusive member-only invitations.
          </p>

          <div className="newsletter-benefits-list">
            <div className="benefit-item-lux">
              <FaGift className="benefit-icon-lux" />
              <span>Exclusive Offers</span>
            </div>
            <div className="benefit-item-lux">
              <FaStar className="benefit-icon-lux" />
              <span>Early Product Launches</span>
            </div>
            <div className="benefit-item-lux">
              <FaInfoCircle className="benefit-icon-lux" />
              <span>Beauty & Skincare Tips</span>
            </div>
          </div>
        </div>

        {/* Right Side: Subscription Form */}
        <div className="newsletter-lux-form-wrapper">
          {submitted ? (
            <div className="newsletter-success-message">
              <h3>Thank You!</h3>
              <p>Welcome to the VENUS Beauty Club. Please check your inbox for details.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="newsletter-lux-form">
              <input 
                type="email" 
                placeholder="Enter your email address" 
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className="newsletter-lux-input"
              />
              <button type="submit" className="btn-newsletter-submit font-serif">
                Subscribe <FaPaperPlane className="btn-send-icon" />
              </button>
            </form>
          )}
        </div>

      </div>
    </section>
  );
};

export default Newsletter;
