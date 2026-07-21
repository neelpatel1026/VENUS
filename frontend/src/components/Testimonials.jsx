import React, { useState, useEffect } from "react";
import "../styles/testimonial.css";
import user1 from "../assets/user1.jpg";
import user2 from "../assets/user2.jpg";
import user3 from "../assets/user3.jpg";
import user4 from "../assets/user4.jpg";
import user5 from "../assets/user5.jpg";
import { FaInstagram } from "react-icons/fa";
import { FiChevronLeft, FiChevronRight } from "react-icons/fi";

const testimonials = [
  {
    id: 1,
    name: "Priya Sharma",
    username: "@priya_sharma",
    image: user1,
    review: "My skin feels healthier and more radiant than ever.",
  },
  {
    id: 2,
    name: "Riya Patel",
    username: "@riya_patel",
    image: user2,
    review: "Luxury skincare that actually delivers results.",
  },
  {
    id: 3,
    name: "Neel Patel",
    username: "@patelneel1026",
    image: user3,
    review: "Premium quality products at an affordable price.",
  },
  {
    id: 4,
    name: "Jevin Shah",
    username: "@jevin_shah",
    image: user4,
    review: "The best skincare products I've used this year.",
  },
  {
    id: 5,
    name: "Ayush Mehta",
    username: "@ayush_mehta",
    image: user5,
    review: "My go-to brand for daily skincare essentials.",
  },
];

const Testimonials = () => {
  const [activeIndex, setActiveIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  // Touch swiping state variables
  const [touchStart, setTouchStart] = useState(null);
  const [touchEnd, setTouchEnd] = useState(null);
  const minSwipeDistance = 50;

  const prevSlide = () => {
    setActiveIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  const nextSlide = () => {
    setActiveIndex((prev) => (prev + 1) % testimonials.length);
  };

  // Autoplay loop with smooth pause-on-hover logic
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 4000);
    return () => clearInterval(interval);
  }, [isPaused]);

  // Touch event callbacks
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
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }
  };

  // Map absolute indexes of the 5 visible slides to keep calculations precise
  const prev2Idx = (activeIndex - 2 + testimonials.length) % testimonials.length;
  const prev1Idx = (activeIndex - 1 + testimonials.length) % testimonials.length;
  const next1Idx = (activeIndex + 1) % testimonials.length;
  const next2Idx = (activeIndex + 2) % testimonials.length;

  const prev2 = testimonials[prev2Idx];
  const prev1 = testimonials[prev1Idx];
  const next1 = testimonials[next1Idx];
  const next2 = testimonials[next2Idx];
  const current = testimonials[activeIndex];

  return (
    <section 
      className="testimonial-section"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      <h2>WHAT OUR CUSTOMERS HAVE TO SAY</h2>

      <div className="testimonial-slider">
        <button className="arrow left" onClick={prevSlide} aria-label="Previous review">
          <FiChevronLeft className="arrow-icon" />
        </button>

        <div className="avatars">
          {/* Every visible avatar card is clickable to transition smoothly to the center */}
          <img 
            src={prev2.image} 
            alt={prev2.name} 
            className="small fade" 
            onClick={() => setActiveIndex(prev2Idx)}
          />
          <img 
            src={prev1.image} 
            alt={prev1.name} 
            className="small" 
            onClick={() => setActiveIndex(prev1Idx)}
          />
          <img 
            src={current.image} 
            alt={current.name} 
            className="active" 
            onClick={() => {}}
          />
          <img 
            src={next1.image} 
            alt={next1.name} 
            className="small" 
            onClick={() => setActiveIndex(next1Idx)}
          />
          <img 
            src={next2.image} 
            alt={next2.name} 
            className="small fade" 
            onClick={() => setActiveIndex(next2Idx)}
          />
        </div>

        <button className="arrow right" onClick={nextSlide} aria-label="Next review">
          <FiChevronRight className="arrow-icon" />
        </button>
      </div>

      <div className="review-content">
        <div className="stars">★★★★★</div>
        <p>{current.review}</p>
        <h4>{current.name}</h4>
        <div className="insta-user">
          <FaInstagram />
          <span>{current.username}</span>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
