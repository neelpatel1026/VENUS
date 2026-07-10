import React, { useState } from "react";
import { Link } from "react-router-dom";
import toast from "react-hot-toast";
import { FaInstagram, FaFacebookF, FaYoutube, FaLinkedinIn } from "react-icons/fa";

const Footer = () => {
  const [email, setEmail] = useState("");

  const handleSubscribe = (e) => {
    e.preventDefault();
    if (!email) {
      toast.error("Please enter a valid email address.");
      return;
    }
    toast.success("Subscribed successfully! Thank you for joining VENUS CARE.");
    setEmail("");
  };

  return (
    <footer style={footerStyle}>
      <div style={containerStyle}>
        {/* Brand Column */}
        <div style={columnStyle}>
          <h2 style={logoStyle}>VENUS CARE</h2>
          <p style={descStyle}>
            Premium skincare crafted with science, purity, and care. Reveal your skin's natural radiance with our acid-free formulas.
          </p>
          <div style={socialWrapper}>
            <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" style={socialIcon} title="Instagram">
              <FaInstagram />
            </a>
            <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" style={socialIcon} title="Facebook">
              <FaFacebookF />
            </a>
            <a href="https://youtube.com" target="_blank" rel="noopener noreferrer" style={socialIcon} title="YouTube">
              <FaYoutube />
            </a>
            <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" style={socialIcon} title="LinkedIn">
              <FaLinkedinIn />
            </a>
          </div>
        </div>

        {/* Quick Links Column */}
        <div style={columnStyle}>
          <h4 style={titleStyle}>Quick Links</h4>
          <div style={linksStyle}>
            <Link to="/" style={linkStyle} onMouseEnter={(e) => e.target.style.color = "#C8A96B"} onMouseLeave={(e) => e.target.style.color = "#D1D5DB"}>Home</Link>
            <Link to="/shop" style={linkStyle} onMouseEnter={(e) => e.target.style.color = "#C8A96B"} onMouseLeave={(e) => e.target.style.color = "#D1D5DB"}>Shop</Link>
            <Link to="/about" style={linkStyle} onMouseEnter={(e) => e.target.style.color = "#C8A96B"} onMouseLeave={(e) => e.target.style.color = "#D1D5DB"}>About Us</Link>
            <Link to="/contact" style={linkStyle} onMouseEnter={(e) => e.target.style.color = "#C8A96B"} onMouseLeave={(e) => e.target.style.color = "#D1D5DB"}>Contact Us</Link>
            <Link to="/my-complaints" style={linkStyle} onMouseEnter={(e) => e.target.style.color = "#C8A96B"} onMouseLeave={(e) => e.target.style.color = "#D1D5DB"}>Support Tickets</Link>
          </div>
        </div>

        {/* Customer Care Column */}
        <div style={columnStyle}>
          <h4 style={titleStyle}>Customer Care</h4>
          <div style={linksStyle}>
            <Link to="/privacy-policy" style={linkStyle} onMouseEnter={(e) => e.target.style.color = "#C8A96B"} onMouseLeave={(e) => e.target.style.color = "#D1D5DB"}>Privacy Policy</Link>
            <Link to="/terms" style={linkStyle} onMouseEnter={(e) => e.target.style.color = "#C8A96B"} onMouseLeave={(e) => e.target.style.color = "#D1D5DB"}>Terms & Conditions</Link>
            <Link to="/shipping-policy" style={linkStyle} onMouseEnter={(e) => e.target.style.color = "#C8A96B"} onMouseLeave={(e) => e.target.style.color = "#D1D5DB"}>Shipping Policy</Link>
            <Link to="/return" style={linkStyle} onMouseEnter={(e) => e.target.style.color = "#C8A96B"} onMouseLeave={(e) => e.target.style.color = "#D1D5DB"}>Return & Refund Policy</Link>
            <Link to="/faq" style={linkStyle} onMouseEnter={(e) => e.target.style.color = "#C8A96B"} onMouseLeave={(e) => e.target.style.color = "#D1D5DB"}>FAQ</Link>
          </div>
        </div>

        {/* Contact Info Column */}
        <div style={columnStyle}>
          <h4 style={titleStyle}>Contact</h4>
          <div style={infoWrapperStyle}>
            <p style={contactStyle}>📍 Ahmedabad, Gujarat, India</p>
            <p style={contactStyle}>📞 +91 96726 81026</p>
            <p style={contactStyle}>✉️ support@venuscare.com</p>
            <p style={contactStyle}>🕒 Mon - Sat: 9:00 AM - 7:00 PM</p>
            <p style={contactStyle}>🎟️ 24x7 Ticket Support</p>
          </div>
        </div>

        {/* Newsletter Column */}
        <div style={columnStyle}>
          <h4 style={titleStyle}>Newsletter</h4>
          <p style={newsletterDescStyle}>Subscribe to receive skincare tips, product launches, and exclusive offers.</p>
          <form onSubmit={handleSubscribe} style={newsletterFormStyle}>
            <input
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              style={newsletterInputStyle}
            />
            <button type="submit" style={newsletterBtnStyle}>
              Subscribe
            </button>
          </form>
        </div>
      </div>

      {/* Bottom Footer Credits */}
      <div style={bottomStyle}>
        © {new Date().getFullYear()} VENUS CARE. All Rights Reserved.
      </div>
    </footer>
  );
};

// Styles
const footerStyle = {
  background: "#1F2937",
  padding: "70px 20px 30px",
  borderTop: "1px solid rgba(255, 255, 255, 0.05)",
  color: "#D1D5DB",
};

const containerStyle = {
  maxWidth: "1200px",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))",
  gap: "40px",
};

const columnStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "15px",
};

const logoStyle = {
  fontSize: "1.8rem",
  color: "#C8A96B",
  letterSpacing: "2px",
  margin: 0,
  fontWeight: "700",
};

const descStyle = {
  color: "#9CA3AF",
  lineHeight: "1.7",
  fontSize: "0.9rem",
  margin: 0,
};

const titleStyle = {
  color: "#FFFFFF",
  fontSize: "1.1rem",
  fontWeight: "600",
  margin: 0,
  borderBottom: "1px solid rgba(200, 169, 107, 0.2)",
  paddingBottom: "8px",
};

const linksStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const linkStyle = {
  color: "#D1D5DB",
  textDecoration: "none",
  fontSize: "0.9rem",
  transition: "color 0.2s ease",
};

const infoWrapperStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "8px",
};

const contactStyle = {
  color: "#D1D5DB",
  fontSize: "0.9rem",
  margin: 0,
};

const socialWrapper = {
  display: "flex",
  gap: "10px",
  marginTop: "10px",
};

const socialIcon = {
  width: "36px",
  height: "36px",
  borderRadius: "50%",
  background: "rgba(255, 255, 255, 0.08)",
  color: "#FFFFFF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
  transition: "all 0.2s ease",
};

const newsletterDescStyle = {
  fontSize: "0.85rem",
  color: "#9CA3AF",
  lineHeight: "1.6",
  margin: 0,
};

const newsletterFormStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "10px",
};

const newsletterInputStyle = {
  padding: "10px 14px",
  background: "rgba(255, 255, 255, 0.05)",
  border: "1px solid rgba(255, 255, 255, 0.15)",
  borderRadius: "8px",
  color: "#FFFFFF",
  fontSize: "0.9rem",
  outline: "none",
};

const newsletterBtnStyle = {
  background: "#C8A96B",
  color: "#FFFFFF",
  border: "none",
  padding: "10px",
  borderRadius: "8px",
  fontWeight: "600",
  cursor: "pointer",
  transition: "background 0.2s ease",
};

const bottomStyle = {
  marginTop: "50px",
  borderTop: "1px solid rgba(255, 255, 255, 0.08)",
  paddingTop: "20px",
  textAlign: "center",
  color: "#9CA3AF",
  fontSize: "0.85rem",
};

export default Footer;
