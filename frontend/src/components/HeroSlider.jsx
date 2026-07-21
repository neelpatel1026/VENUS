import { useState, useEffect, useCallback, useRef } from "react";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

import hero1 from "../assets/hero1.jpg";
import hero2 from "../assets/hero2.jpg";
import hero3 from "../assets/hero3.jpg";
import hero4 from "../assets/hero4.jpg";

import "./../styles/heroslider.css";

const slides = [
  {
    image: hero1,
    subtitle: "THE SKINCARE APOTHECARY",
    title: "Reveal Your Skin's Radiance",
    buttonText: "Shop Collection",
    align: "right",
  },
  {
    image: hero2,
    subtitle: "ELIXIR OF YOUTH",
    title: "Timeless Plant Hydration",
    buttonText: "Discover Luxury",
    align: "left",
  },
  {
    image: hero3,
    subtitle: "SENSORY PERFECTION",
    title: "Pure Botanical Rituals",
    buttonText: "Explore Collection",
    align: "right",
  },
  {
    image: hero4,
    subtitle: "CLEAN BEAUTY ESSENCE",
    title: "Vegan & Active Nutrition",
    buttonText: "Discover More",
    align: "left",
  },
];

export default function HeroSlider() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const autoplayTimer = useRef(null);

  // Swipe gesture hooks
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

  const startAutoplay = useCallback(() => {
    if (autoplayTimer.current) {
      clearInterval(autoplayTimer.current);
    }
    autoplayTimer.current = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % slides.length);
    }, 5000);
  }, []);

  useEffect(() => {
    startAutoplay();
    return () => {
      if (autoplayTimer.current) {
        clearInterval(autoplayTimer.current);
      }
    };
  }, [startAutoplay]);

  const handleNext = () => {
    setCurrentIndex((prev) => (prev + 1) % slides.length);
    startAutoplay();
  };

  const handlePrev = () => {
    setCurrentIndex((prev) => (prev - 1 + slides.length) % slides.length);
    startAutoplay();
  };

  const handleDotClick = (index) => {
    setCurrentIndex(index);
    startAutoplay();
  };

  // Touch handlers for swipe support
  const onTouchStart = (e) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    if (isLeftSwipe) {
      handleNext();
    } else if (isRightSwipe) {
      handlePrev();
    }
  };

  return (
    <div className="hero-slider-container">
      {slides.map((slide, index) => {
        const isActive = index === currentIndex;
        return (
          <div
            key={index}
            className={`hero-slide-wrapper ${isActive ? "active" : ""}`}
            style={{ pointerEvents: isActive ? "auto" : "none" }}
            onTouchStart={onTouchStart}
            onTouchMove={onTouchMove}
            onTouchEnd={onTouchEnd}
          >
            <img
              src={slide.image}
              alt={slide.title}
              className="hero-slide-image"
              loading={index === 0 ? "eager" : "lazy"}
            />
            {/* TEXT CONTENT OVERLAY (Responsive, luxury alignment) */}
            <div className={`hero-slide-content-overlay align-${slide.align}`}>
              <span className="hero-slide-subtitle">
                {slide.subtitle}
              </span>
              <h2 className="hero-slide-title">
                {slide.title}
              </h2>
              <div style={{ marginTop: "14px" }}>
                <Link to="/shop" className="hero-slide-btn">
                  {slide.buttonText}
                </Link>
              </div>
            </div>
          </div>
        );
      })}

      {/* Glassmorphic Arrows */}
      <button 
        className="nav-arrow prev-arrow" 
        onClick={handlePrev} 
        aria-label="Previous slide"
      >
        <FiChevronLeft />
      </button>
      <button 
        className="nav-arrow next-arrow" 
        onClick={handleNext} 
        aria-label="Next slide"
      >
        <FiChevronRight />
      </button>

      {/* Rounded indicators */}
      <div className="hero-indicators">
        {slides.map((_, index) => (
          <button
            key={index}
            className={`indicator-dot ${index === currentIndex ? "active" : ""}`}
            onClick={() => handleDotClick(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>
    </div>
  );
}
