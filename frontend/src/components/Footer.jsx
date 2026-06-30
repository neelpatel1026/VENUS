import React from "react";
import { Link } from "react-router-dom";
import { FaInstagram, FaFacebookF, FaWhatsapp } from "react-icons/fa";

const Footer = () => {
  return (
    <footer style={footerStyle}>
      <div style={containerStyle}>
        {/* Brand */}
        <div>
          <h2 style={logoStyle}>VENUS</h2>

          <p style={descStyle}>
            Premium acid-free skincare crafted with purity, care, and science to
            reveal your natural beauty.
          </p>
        </div>

        {/* Quick Links */}
        <div>
          <h4 style={titleStyle}>Quick Links</h4>

          <div style={linksStyle}>
            <Link to="/" style={linkStyle}>
              Home
            </Link>

            <Link to="/shop" style={linkStyle}>
              Shop
            </Link>

            <Link to="/about" style={linkStyle}>
              About Us
            </Link>

            <Link to="/contact" style={linkStyle}>
              Contact Us
            </Link>
          </div>
        </div>

        {/* Customer Care */}
        <div>
          <h4 style={titleStyle}>Customer Care</h4>

          <div style={linksStyle}>
            <Link to="/privacy-policy" style={linkStyle}>
              Privacy Policy
            </Link>

            <Link to="/terms" style={linkStyle}>
              Terms & Conditions
            </Link>

            <Link to="/shipping-policy" style={linkStyle}>
              Shipping Policy
            </Link>

            <Link to="/return" style={linkStyle}>
              Return & Refund
            </Link>
          </div>
        </div>

        {/* Contact */}
        <div>
          <h4 style={titleStyle}>Contact Us</h4>

          <p style={contactStyle}>📍 Ahmedabad, Gujarat, India</p>

          <p style={contactStyle}>📞 +91 9672681026</p>

          <p style={contactStyle}>✉️ support@venus.com</p>

          <div style={socialWrapper}>
            <a href="#" style={socialIcon}>
              <FaInstagram />
            </a>

            <a href="#" style={socialIcon}>
              <FaFacebookF />
            </a>

            <a href="https://wa.me/919672681026" style={socialIcon}>
              <FaWhatsapp />
            </a>
          </div>
        </div>
      </div>

      {/* Bottom */}

      <div style={bottomStyle}>
        © {new Date().getFullYear()} VENUS. All Rights Reserved.
      </div>
    </footer>
  );
};


// const footerStyle = {
//   // background: "#1f2937",
//   background: "#434343",
//   padding: "80px 20px 30px",
//   borderTop: "1px solid rgba(255,255,255,0.08)",
// };

const footerStyle = {
  background: "#454545",
  padding: "80px 20px 30px",
  borderTop: "1px solid rgba(255,255,255,0.08)",
};

const containerStyle = {
  maxWidth: "1200px",
  margin: "0 auto",
  display: "grid",
  gridTemplateColumns: "repeat(auto-fit,minmax(250px,1fr))",
  gap: "50px",
};

const logoStyle = {
  fontSize: "2.2rem",
  // color: "#ffffff",
   color: "#ffffff",
  letterSpacing: "4px",
  marginBottom: "20px",
};

const descStyle = {
  // color: "#d1d5db",
   color: "#d1d5db",
  lineHeight: "1.9",
  fontSize: "15px",
};

const titleStyle = {
  color: "#ffffff",
  marginBottom: "20px",
};

const linksStyle = {
  display: "flex",
  flexDirection: "column",
  gap: "12px",
};

const linkStyle = {
  color: "#d1d5db",
  textDecoration: "none",
  transition: "0.3s",
};

const contactStyle = {
  // color: "#d1d5db",
  color: "#d1d5db",
  marginBottom: "12px",
};

const socialWrapper = {
  display: "flex",
  gap: "12px",
  marginTop: "20px",
};

const socialIcon = {
  width: "42px",
  height: "42px",
  borderRadius: "50%",
  background: "rgba(255,255,255,0.12)",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  textDecoration: "none",
};

const bottomStyle = {
  marginTop: "60px",
  borderTop: "1px solid rgba(255,255,255,0.15)",
  paddingTop: "20px",
  textAlign: "center",
  color: "#d1d5db",
};



export default Footer;
