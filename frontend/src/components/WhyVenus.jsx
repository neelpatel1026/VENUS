import React from "react";
import { GiRabbit, GiPerfumeBottle } from "react-icons/gi";
import { BsGem, BsGenderAmbiguous } from "react-icons/bs";
import "../styles/whyVenus.css";

const WhyVenus = () => {
  return (
    <section className="why-venus-section font-outfit">
      {/* Decorative background circle */}
      <div className="why-decor-circle" />

      {/* Header Block */}
      <div className="why-header">
        <span className="why-tagline">WHY CHOOSE VENUS</span>
        <h2 className="why-main-title font-serif">Why Thousands Choose VENUS</h2>
        <p className="why-subtitle">Premium skincare inspired by nature and backed by science.</p>
      </div>

      {/* Cards Grid */}
      <div className="why-grid-lux">
        <div className="why-card-lux">
          <div className="why-icon-badge">
            <GiRabbit className="why-icon-svg" />
          </div>
          <h3>Cruelty Free</h3>
          <p>
            Kindness in every bottle. Our commitment to cruelty-free products.
          </p>
        </div>

        <div className="why-card-lux">
          <div className="why-icon-badge">
            <GiPerfumeBottle className="why-icon-svg" />
          </div>
          <h3>Fragrance Forward</h3>
          <p>Luxury ingredients carefully selected for superior skincare.</p>
        </div>

        <div className="why-card-lux">
          <div className="why-icon-badge">
            <BsGem className="why-icon-svg" />
          </div>
          <h3>Affordable Luxury</h3>
          <p>Premium quality and elegance at a reasonable price.</p>
        </div>

        <div className="why-card-lux">
          <div className="why-icon-badge">
            <BsGenderAmbiguous className="why-icon-svg" />
          </div>
          <h3>Gender Neutral</h3>
          <p>Safe and gentle for every skin type.</p>
        </div>
      </div>

      {/* Statistics Row */}
      <div className="why-stats-row">
        <div className="why-stat-card">
          <span className="stat-number">25K+</span>
          <span className="stat-label">Happy Customers</span>
        </div>
        <div className="why-stat-card">
          <span className="stat-number">4.9★</span>
          <span className="stat-label">Average Rating</span>
        </div>
        <div className="why-stat-card">
          <span className="stat-number">100%</span>
          <span className="stat-label">Cruelty Free</span>
        </div>
        <div className="why-stat-card">
          <span className="stat-number">48 Hr</span>
          <span className="stat-label">Fast Delivery</span>
        </div>
      </div>
    </section>
  );
};

export default WhyVenus;
