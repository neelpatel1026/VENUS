import { useState, useEffect, useCallback, useRef } from "react";
import { Link } from "react-router-dom";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

import "./../styles/heroslider.css";

import hero1Desktop from "../assets/hero/hero-sunscreen-radiant.webp";
import hero1Mobile from "../assets/hero/hero-sunscreen-radiant-mobile.webp";
import hero2Desktop from "../assets/hero/hero-serum-rosegold.webp";
import hero2Mobile from "../assets/hero/hero-serum-rosegold-mobile.webp";
import hero3Desktop from "../assets/hero/hero-botanical-ritual.webp";
import hero3Mobile from "../assets/hero/hero-botanical-ritual-mobile.webp";
import hero4Desktop from "../assets/hero/hero-golden-glow.webp";
import hero4Mobile from "../assets/hero/hero-glow-mobile.webp";

const slides = [
  {
    desktopImage: hero1Desktop,
    mobileImage: hero1Mobile,
    subtitle: "Luxury Botanical Skincare",
    title: "Reveal Your Natural Glow",
    buttonText: "Shop Collection",
    align: "right",
  },
  {
    desktopImage: hero2Desktop,
    mobileImage: hero2Mobile,
    subtitle: "Amla & Bhringraj Rituals",
    title: "Nourish Every Strand",
    buttonText: "Shop Haircare",
    align: "left",
  },
  {
    desktopImage: hero3Desktop,
    mobileImage: hero3Mobile,
    subtitle: "Hydration Apothecary Rituals",
    title: "Deep Skin Hydration",
    buttonText: "Discover More",
    align: "right",
  },
  {
    desktopImage: hero4Desktop,
    mobileImage: hero4Mobile,
    subtitle: "Amber & Golden Apothecary",
    title: "The Golden Glow Ritual",
    buttonText: "Shop Collection",
    align: "left",
  }
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
              <source media="(max-width: 768px)" srcSet={slide.mobileImage} width="900" height="1200" />
              <img
                src={slide.desktopImage}
                alt={slide.title}
                className="hero-slide-image"
                loading={index === 0 ? "eager" : "lazy"}
                fetchPriority={index === 0 ? "high" : undefined}
                decoding="async"
                width="1920"
                height="800"
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
