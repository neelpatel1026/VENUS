import React, { useState, useEffect } from "react";
import { FaStar, FaChevronLeft, FaChevronRight, FaCheckCircle } from "react-icons/fa";
import user1 from "../assets/user1.jpg";
import user2 from "../assets/user2.jpg";
import user3 from "../assets/user3.jpg";
import user4 from "../assets/user4.jpg";
import user5 from "../assets/user5.jpg";
import "../styles/testimonial.css";

const testimonials = [
  {
    id: 1,
    name: "Aanya Sen",
    location: "Mumbai, India",
    image: user1,
    rating: 5,
    text: "Venus skincare has completely transformed my dry patches. The natural botanical extracts feel so luxury, and it absorbs incredibly fast. 10/10 recommend!",
  },
  {
    id: 2,
    name: "Rohan Mehra",
    location: "Delhi, India",
    image: user2,
    rating: 5,
    text: "The formulation is extremely lightweight and premium. My skin tone feels more balanced and glowing after just two weeks of daily use.",
  },
  {
    id: 3,
    name: "Ira Patel",
    location: "Ahmedabad, India",
    image: user3,
    rating: 5,
    text: "Absolutely stunning packaging and even better performance. Feels like an expensive spa routine at home. My friends keep asking about my glow!",
  },
  {
    id: 4,
    name: "Karan Shah",
    location: "Bangalore, India",
    image: user4,
    rating: 5,
    text: "Being dermatologist tested was a major selling point for my sensitive skin. Zero breakouts and beautiful moisturized skin every single morning.",
  },
  {
    id: 5,
    name: "Mira Singhania",
    location: "Kolkata, India",
    image: user5,
    rating: 5,
    text: "Hands down the best cruelty-free skincare brand on the market. It leaves my skin feeling deeply hydrated and balanced without any greasy residue.",
  },
];

const Testimonials = () => {
  const [startIndex, setStartIndex] = useState(0);
  const [isPaused, setIsPaused] = useState(false);

  const nextSlide = () => {
    setStartIndex((prev) => (prev + 1) % testimonials.length);
  };

  const prevSlide = () => {
    setStartIndex((prev) => (prev - 1 + testimonials.length) % testimonials.length);
  };

  // Auto-slide loop with pause-on-hover logic
  useEffect(() => {
    if (isPaused) return;
    const interval = setInterval(() => {
      nextSlide();
    }, 4500);
    return () => clearInterval(interval);
  }, [isPaused]);

  // Compute visible slides
  const visibleSlides = [
    testimonials[startIndex],
    testimonials[(startIndex + 1) % testimonials.length],
    testimonials[(startIndex + 2) % testimonials.length],
  ];

  return (
    <section 
      className="testimonials-section-lux font-outfit"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
    >
      <div className="testimonials-lux-container">
        
        {/* Section Header */}
        <div className="testimonials-header">
          <span className="testimonials-tag">TESTIMONIALS</span>
          <h2 className="testimonials-title font-serif">What Our Customers Have to Say</h2>
          <p className="testimonials-subtitle">Verified feedback from real users sharing their skincare journeys.</p>
        </div>

        {/* Carousel Wrapper */}
        <div className="testimonials-slider-wrapper">
          
          {/* Navigation Left Arrow */}
          <button className="slider-arrow arrow-left" onClick={prevSlide} aria-label="Previous testimonial">
            <FaChevronLeft />
          </button>

          {/* Cards Grid */}
          <div className="testimonials-grid-lux">
            {visibleSlides.map((item, index) => (
              <div 
                key={item.id} 
                className={`testimonial-card-lux slide-index-${index}`}
              >
                <div className="card-top-row">
                  <div className="stars-lux-row">
                    {[...Array(item.rating)].map((_, i) => (
                      <FaStar key={i} className="star-gold" />
                    ))}
                  </div>
                  <span className="verified-badge">
                    <FaCheckCircle /> Verified Buyer
                  </span>
                </div>

                <p className="testimonial-text font-serif">"{item.text}"</p>

                <div className="testimonial-user-row">
                  <img 
                    src={item.image} 
                    alt={item.name} 
                    className="user-avatar-img"
                    loading="lazy" 
                  />
                  <div className="user-meta-info">
                    <h4>{item.name}</h4>
                    <p>{item.location}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Navigation Right Arrow */}
          <button className="slider-arrow arrow-right" onClick={nextSlide} aria-label="Next testimonial">
            <FaChevronRight />
          </button>

        </div>

      </div>
    </section>
  );
};

export default Testimonials;
