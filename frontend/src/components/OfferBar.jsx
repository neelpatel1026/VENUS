import React, { useEffect, useState } from "react";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import "../styles/offerbar.css";

const offers = [
  "🚚 Free Shipping Above ₹499",
  "🎁 Buy 2 Get 1 Free",
  "💚 Flat 20% OFF",
  "✨ Premium Skincare Collection"
];

const OfferBar = () => {
  const [index, setIndex] = useState(0);

  // Next Offer Function
  const nextOffer = () => {
    setIndex((prev) => (prev === offers.length - 1 ? 0 : prev + 1));
  };

  // Previous Offer Function
  const prevOffer = () => {
    setIndex((prev) => (prev === 0 ? offers.length - 1 : prev - 1));
  };

  // Auto-sliding effect
  useEffect(() => {
    const interval = setInterval(nextOffer, 5000); // 5 seconds for luxury speed
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="offer-bar">
      <button className="offer-arrow" onClick={prevOffer} aria-label="Previous offer">
        <FiChevronLeft className="offer-arrow-icon" />
      </button>
      
      <div className="offer-content">
        <p key={index} className="offer-text">
          {offers[index]}
        </p>
      </div>

      <button className="offer-arrow" onClick={nextOffer} aria-label="Next offer">
        <FiChevronRight className="offer-arrow-icon" />
      </button>
    </div>
  );
};

export default OfferBar;