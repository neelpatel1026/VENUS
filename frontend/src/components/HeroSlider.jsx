import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

import "./../styles/heroslider.css";

const slides = [
  {
    desktopImage: "/hero1_desktop.jpg",
    mobileImage: "/hero1_mobile.jpg",
    subtitle: "Luxury Botanical Skincare",
    title: "Reveal Your Natural Glow",
    buttonText: "Shop Collection",
    align: "right",
  },
  {
    desktopImage: "/hero2_desktop.jpg",
    mobileImage: "/hero2_mobile.jpg",
    subtitle: "Vitamin C Collection",
    title: "Brighten Every Day",
    buttonText: "Shop Vitamin C",
    align: "left",
  },
  {
    desktopImage: "/hero3_desktop.jpg",
    mobileImage: "/hero3_mobile.jpg",
    subtitle: "Hydration Collection",
    title: "Deep Hydration",
    buttonText: "Discover More",
    align: "right",
  },
  {
    desktopImage: "/hero4_desktop.jpg",
    mobileImage: "/hero4_mobile.jpg",
    subtitle: "Luxury Anti-Aging",
    title: "Timeless Beauty",
    buttonText: "Explore Collection",
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
            <picture style={{ display: "block", width: "100%", height: "100%" }}>
              <source media="(max-width: 768px)" srcSet={slide.mobileImage} />
              <img
                src={slide.desktopImage}
                alt={slide.title}
                className="hero-slide-image"
                loading={index === 0 ? "eager" : "lazy"}
                style={{ width: "100%", height: "100%", objectFit: "cover", display: "block" }}
              />
            </picture>
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
