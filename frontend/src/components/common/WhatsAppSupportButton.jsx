import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import "./WhatsAppSupportButton.css";

const WhatsAppSupportButton = () => {
  const location = useLocation();
  const [showTooltip, setShowTooltip] = useState(false);

  // Excluded routes where the WhatsApp widget should not render
  const path = location.pathname.toLowerCase();
  const isAdminRoute = path.startsWith("/admin");
  const isAuthRoute = path === "/login" || path === "/register";

  useEffect(() => {
    if (isAdminRoute || isAuthRoute) return;

    // Show tooltip after a brief 1.5s delay
    const showTimer = setTimeout(() => {
      setShowTooltip(true);
    }, 1500);

    // Auto hide tooltip after 6 seconds of display (total 7.5s from mount)
    const hideTimer = setTimeout(() => {
      setShowTooltip(false);
    }, 7500);

    return () => {
      clearTimeout(showTimer);
      clearTimeout(hideTimer);
    };
  }, [location.pathname, isAdminRoute, isAuthRoute]);

  if (isAdminRoute || isAuthRoute) return null;

  const handleMouseEnter = () => {
    setShowTooltip(true);
  };

  const handleMouseLeave = () => {
    setShowTooltip(false);
  };

  return (
    <div 
      className="whatsapp-support-wrapper"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {showTooltip && (
        <div className="whatsapp-tooltip" role="tooltip">
          Need help? Chat with us
        </div>
      )}
      <a
        href="https://wa.me/91XXXXXXXXXX?text=Hi%20VENUS%20CARE%2C%20I%20need%20help%20with%20my%20order%20and%20skincare%20consultation."
        target="_blank"
        rel="noopener noreferrer"
        className="whatsapp-float-btn"
        aria-label="Chat with VENUS CARE on WhatsApp"
      >
        <svg 
          viewBox="0 0 448 512" 
          className="whatsapp-svg-icon"
          fill="currentColor"
          xmlns="http://www.w3.org/2000/svg"
        >
          <path d="M380.9 97.1C339 55.1 283.2 32 223.9 32c-122.4 0-222 99.6-222 222 0 39.1 10.2 77.3 29.6 111L32 503l138.2-36.2c32.4 17.7 68.8 26.9 105.8 26.9h.1c122.3 0 224.1-99.6 224.1-222 0-59.3-25.2-115-67.1-157zm-157 341.6c-33.2 0-65.7-8.9-94-25.7l-6.7-4-82.1 21.5 21.9-80-4.4-7c-18.5-29.4-28.2-63.3-28.2-98.2 0-101.7 82.8-184.5 184.6-184.5 49.3 0 95.6 19.2 130.4 54.1 34.8 34.9 56.2 81.2 56.1 130.5 0 101.8-84.9 184.6-186.6 184.6zm101.2-138.2c-5.5-2.8-32.8-16.2-37.9-18-5.1-1.9-8.8-2.8-12.5 2.8-3.7 5.6-14.3 18-17.6 21.8-3.2 3.7-6.5 4.2-12 1.4-32.6-16.3-54-29.1-75.5-66-5.7-9.8 5.7-9.1 16.3-30.3 1.8-3.7.9-6.9-.5-9.7-1.4-2.8-12.5-30.1-17.1-41.2-4.5-10.8-9.1-9.3-12.5-9.5-3.2-.2-6.9-.2-10.6-.2-3.7 0-9.7 1.4-14.8 6.9-5.1 5.6-19.4 19-19.4 46.3 0 27.3 19.9 53.7 22.6 57.4 2.8 3.7 39.1 59.7 94.8 83.8 35.2 15.2 49 16.5 66.6 13.9 10.7-1.6 32.8-13.4 37.4-26.4 4.6-13 4.6-24.1 3.2-26.4-1.3-2.5-5-3.9-10.5-6.6z"/>
        </svg>
      </a>
    </div>
  );
};

export default WhatsAppSupportButton;
