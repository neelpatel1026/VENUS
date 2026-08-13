import React from "react";
import "./AnnouncementBar.css";

const AnnouncementBar = () => {
  return (
    <div 
      className="announcement-bar"
      role="status"
      aria-live="polite"
    >
      <div className="announcement-content">
        <span className="announcement-text">
          🚚 Free Shipping on Orders Above ₹1499 • 💳 Cash on Delivery Available Across India
        </span>
      </div>
    </div>
  );
};

export default AnnouncementBar;
