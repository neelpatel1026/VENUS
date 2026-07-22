import React, { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { 
  FaInstagram, 
  FaFacebookF, 
  FaYoutube, 
  FaLinkedinIn, 
  FaPinterestP,
  FaEnvelope, 
  FaPhone, 
  FaMapMarkerAlt, 
  FaRegClock,
  FaLock,
  FaUndo,
  FaShippingFast,
  FaHeart,
  FaCheck,
  FaLeaf,
  FaHeadphones
} from "react-icons/fa";
import "../styles/footer.css";

const Footer = () => {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter a valid email address.");
      return;
    }
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      toast.success("Subscribed successfully! Welcome to VENUS CARE Club. 🎁");
      setEmail("");
    }, 800);
  };

  return (
    <footer className="luxury-footer font-outfit" aria-label="Venus Care Footer">
      <div className="luxury-footer-container">
        
        {/* 1. TOP TRUST BAR */}
        <div className="footer-trust-strip-luxury">
          <div className="trust-badge-card">
            <FaShippingFast className="trust-badge-icon" />
            <span>Free Shipping Above <strong>₹499</strong></span>
          </div>
          <div className="trust-badge-card">
            <FaLock className="trust-badge-icon" />
            <span>Secure <strong>Payments</strong></span>
          </div>
          <div className="trust-badge-card">
            <FaUndo className="trust-badge-icon" />
            <span>Easy <strong>Returns</strong></span>
          </div>
          <div className="trust-badge-card">
            <FaLeaf className="trust-badge-icon" />
            <span>Dermatologically <strong>Tested</strong></span>
          </div>
        </div>

        {/* 2. FIVE BALANCED COLUMNS */}
        <div className="luxury-footer-grid">
          
          {/* Column 1: Brand Story */}
          <div className="footer-col footer-col-brand">
            <h2 className="footer-logo-title">VENUS CARE</h2>
            <p className="footer-brand-desc">
              Premium skincare crafted using science, purity, and botanical ingredients.
            </p>
            
            {/* Simple certification text list (no boxes/badges) */}
            <div className="footer-certifications-strip">
              <span className="cert-text-item">
                <FaCheck className="cert-text-icon" /> Cruelty Free
              </span>
              <span className="cert-text-item">
                <FaCheck className="cert-text-icon" /> Dermatologically Tested
              </span>
              <span className="cert-text-item">
                <FaCheck className="cert-text-icon" /> Made in India
              </span>
              <span className="cert-text-item">
                <FaCheck className="cert-text-icon" /> Premium Ingredients
              </span>
            </div>

            {/* Social Outline Icons */}
            <div className="footer-social-wrapper">
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-circle-btn" aria-label="Follow us on Instagram">
                <FaInstagram />
              </a>
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-circle-btn" aria-label="Follow us on Facebook">
                <FaFacebookF />
              </a>
              <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="social-circle-btn" aria-label="Follow us on YouTube">
                <FaYoutube />
              </a>
              <a href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className="social-circle-btn" aria-label="Follow us on Pinterest">
                <FaPinterestP />
              </a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-circle-btn" aria-label="Follow us on LinkedIn">
                <FaLinkedinIn />
              </a>
            </div>
          </div>

          {/* Column 2: Shop links */}
          <div className="footer-col">
            <h4>Shop</h4>
            <div className="footer-links-stack">
              <Link to="/" className="footer-link-item">Home</Link>
              <Link to="/shop" className="footer-link-item">Shop</Link>
              <Link to="/shop" className="footer-link-item">Collections</Link>
              <Link to="/gifting" className="footer-link-item">Gifting</Link>
              <Link to="/shop" className="footer-link-item">New Arrivals</Link>
              <Link to="/shop" className="footer-link-item">Best Sellers</Link>
              <Link to="/shop" className="footer-link-item">Offers</Link>
              <Link to="/profile" className="footer-link-item">Track Order</Link>
            </div>
          </div>

          {/* Column 3: Support links */}
          <div className="footer-col">
            <h4>Support</h4>
            <div className="footer-links-stack">
              <Link to="/faq" className="footer-link-item">FAQ</Link>
              <Link to="/shipping-policy" className="footer-link-item">Shipping</Link>
              <Link to="/return" className="footer-link-item">Returns</Link>
              <Link to="/return" className="footer-link-item">Refund</Link>
              <Link to="/privacy-policy" className="footer-link-item">Privacy</Link>
              <Link to="/terms" className="footer-link-item">Terms</Link>
              <Link to="/my-complaints" className="footer-link-item">Support Ticket</Link>
              <Link to="/contact" className="footer-link-item">Contact Us</Link>
            </div>
          </div>

          {/* Column 4: Contact details */}
          <div className="footer-col">
            <h4>Contact</h4>
            <div className="footer-contact-details">
              <div className="contact-detail-line">
                <FaMapMarkerAlt />
                <span>Ahmedabad, Gujarat, India</span>
              </div>
              <div className="contact-detail-line">
                <FaPhone />
                <span>+91 96726 81026</span>
              </div>
              <div className="contact-detail-line">
                <FaEnvelope />
                <span>support@venuscare.com</span>
              </div>
              <div className="contact-detail-line">
                <FaRegClock />
                <span>Business Hours: Mon–Sat: 9 AM - 7 PM</span>
              </div>
              <div className="contact-detail-line">
                <FaHeadphones />
                <span>Support Hours: 24×7 Ticket Desk</span>
              </div>
            </div>
          </div>

          {/* Column 5: Newsletter */}
          <div className="footer-col footer-col-newsletter">
            <h4>Newsletter</h4>
            <div className="footer-newsletter-box">
              <p className="newsletter-subtext">
                Subscribe to receive skincare tips, product launches, and exclusive offers.
              </p>
              <form onSubmit={handleSubscribe} className="newsletter-form-row">
                <input
                  type="email"
                  placeholder="Your email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="newsletter-rounded-input"
                  required
                  aria-label="Email address for newsletter"
                />
                <button type="submit" className="newsletter-submit-pill-btn" disabled={loading}>
                  {loading ? "Subscribing..." : "Subscribe"}
                </button>
              </form>
              <span className="newsletter-spam-notice">We respect your privacy.</span>
            </div>
          </div>

        </div>

        {/* 3. PAYMENT METHODS - Monochrome style inline text badges */}
        <div className="footer-payments-row">
          <span className="payment-logo-item">Visa</span>
          <span className="payment-logo-item">Mastercard</span>
          <span className="payment-logo-item">RuPay</span>
          <span className="payment-logo-item">UPI</span>
          <span className="payment-logo-item">Google Pay</span>
          <span className="payment-logo-item">PhonePe</span>
          <span className="payment-logo-item">Paytm</span>
          <span className="payment-logo-item">Razorpay</span>
          <span className="payment-logo-item">COD</span>
        </div>

        {/* Thin divider */}
        <div className="footer-divider-line" />

        {/* 4. BOTTOM SECTION */}
        <div className="footer-bottom-bar-flex">
          <span className="bottom-credits">
            &copy; 2026 VENUS CARE
          </span>
          
          <span className="bottom-love-flag">
            Made with <FaHeart style={{ color: "#EF4444", fontSize: "11px" }} /> in India
          </span>

          <div className="bottom-links-menu">
            <Link to="/privacy-policy" className="bottom-menu-link">Privacy</Link>
            <Link to="/terms" className="bottom-menu-link">Cookies</Link>
            <Link to="/faq" className="bottom-menu-link">Sitemap</Link>
          </div>
        </div>

      </div>
    </footer>
  );
};

export default Footer;
