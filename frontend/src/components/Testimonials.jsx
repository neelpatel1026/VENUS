// import React, { useState } from "react";
import "../styles/testimonial.css";
import user1 from "../assets/user1.jpg";
import user2 from "../assets/user2.jpg";
import user3 from "../assets/user3.jpg";
import user4 from "../assets/user4.jpg";
import user5 from "../assets/user5.jpg";
import React, { useState } from "react";
import { FaInstagram } from "react-icons/fa";


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
  //   useEffect(() => {
  //     const interval = setInterval(() => {
  //       setActiveIndex((prev) =>
  //         prev === testimonials.length - 1 ? 0 : prev + 1,
  //       );
  //     }, 4000);

  //     return () => clearInterval(interval);
  //   }, []);
  const [activeIndex, setActiveIndex] = useState(0);

  const prevSlide = () => {
    setActiveIndex(
      activeIndex === 0 ? testimonials.length - 1 : activeIndex - 1,
    );
  };

  const nextSlide = () => {
    setActiveIndex(
      activeIndex === testimonials.length - 1 ? 0 : activeIndex + 1,
    );
  };
  const prev2 =
    testimonials[(activeIndex - 2 + testimonials.length) % testimonials.length];

  const prev1 =
    testimonials[(activeIndex - 1 + testimonials.length) % testimonials.length];

  const next1 = testimonials[(activeIndex + 1) % testimonials.length];

  const next2 = testimonials[(activeIndex + 2) % testimonials.length];

  const current = testimonials[activeIndex];

  return (
    <section className="testimonial-section">
      <h2>WHAT OUR CUSTOMERS HAVE TO SAY</h2>

      <div className="testimonial-slider">
        <button className="arrow left" onClick={prevSlide}>
          ←
        </button>

        <div className="avatars">
          <img src={prev2.image} alt={prev2.name} className="small fade" />

          <img src={prev1.image} alt={prev1.name} className="small" />

          <img src={current.image} alt={current.name} className="active" />

          <img src={next1.image} alt={next1.name} className="small" />

          <img src={next2.image} alt={next2.name} className="small fade" />
        </div>

        <button className="arrow right" onClick={nextSlide}>
          →
        </button>
      </div>

      <div className="review-content">
        <div className="stars">★★★★★</div>

        <p>{current.review}</p>

        <h4>{current.name}</h4>

        {/* <span>{current.username}</span> */}
        <div className="insta-user">
          <FaInstagram />
          <span>{current.username}</span>
        </div>
      </div>
    </section>
  );
};

export default Testimonials;
