import React, { useEffect, useState, useRef } from "react";
import { Link } from "react-router-dom";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";
import "../styles/offerbar.css";

const offers = [
  "🎁 BUY 2 GET 1 FREE",
  "🚚 FREE SHIPPING ABOVE ₹499",
  "✨ FLAT ₹200 OFF",
  "💳 EXTRA 10% OFF FIRST ORDER",
  "🎉 FESTIVAL SALE LIVE"
];

const OfferBar = () => {
  const [index, setIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  const nextOffer = () => {
    setIndex((prev) => (prev === offers.length - 1 ? 0 : prev + 1));
  };

  const prevOffer = () => {
    setIndex((prev) => (prev === 0 ? offers.length - 1 : prev - 1));
  };

  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(nextOffer, 4000); // 4 seconds auto transition
    return () => clearInterval(interval);
  }, [isPaused]);

  // Touch Swipe handlers
  const handleTouchStart = (e) => {
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e) => {
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (diff > 50) {
      // Swiped Left -> Next
      nextOffer();
    } else if (diff < -50) {
      // Swiped Right -> Prev
      prevOffer();
    }
  };

  return (
    <div 
      className="offer-bar"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      <button className="offer-arrow" onClick={(e) => { e.stopPropagation(); prevOffer(); }} aria-label="Previous offer">
        <FiChevronLeft className="offer-arrow-icon" />
      </button>
      
      <Link to="/offers" className="offer-content-link">
        <div className="offer-content">
          <p key={index} className="offer-text">
            {offers[index]}
          </p>
        </div>
      </Link>

      <button className="offer-arrow" onClick={(e) => { e.stopPropagation(); nextOffer(); }} aria-label="Next offer">
        <FiChevronRight className="offer-arrow-icon" />
      </button>
    </div>
  );
};

export default OfferBar;