import React from "react";
import { Link } from "react-router-dom";
import { FaCheckCircle, FaLeaf, FaTruck, FaArrowRight } from "react-icons/fa";
import "../styles/promoSection.css";

const PromoSection = () => {
  return (
    <section className="promo-section-lux font-outfit">
      <div className="promo-lux-container">
        
        {/* Left Side: Content */}
        <div className="promo-lux-content">
          <span className="promo-lux-tag">EXCLUSIVE INVITATION</span>
          <h2 className="promo-lux-heading font-serif">
            Discover Skincare Crafted For Pure Radiance
          </h2>
          <p className="promo-lux-desc">
            Indulge in botanical formulations engineered to rejuvenate your skin barrier. 
            Experience absolute luxury with dermatologist-verified purity and results you can see.
          </p>

          {/* 3 Offer Cards */}
          <div className="promo-lux-cards">
            <div className="promo-card-item">
              <div className="promo-card-icon-wrapper">
                <FaCheckCircle className="promo-card-icon" />
              </div>
              <div className="promo-card-info">
                <h4>Dermatologist Tested</h4>
                <p>100% hypoallergenic</p>
              </div>
            </div>

            <div className="promo-card-item">
              <div className="promo-card-icon-wrapper">
                <FaLeaf className="promo-card-icon" />
              </div>
              <div className="promo-card-info">
                <h4>Natural Ingredients</h4>
                <p>Pure botanical extracts</p>
              </div>
            </div>

            <div className="promo-card-item">
              <div className="promo-card-icon-wrapper">
                <FaTruck className="promo-card-icon" />
              </div>
              <div className="promo-card-info">
                <h4>Fast Delivery</h4>
                <p>Complimentary 48-hr shipping</p>
              </div>
            </div>
          </div>

          {/* CTA Buttons */}
          <div className="promo-lux-ctas">
            <Link to="/shop" className="btn-promo-primary font-serif">
              Shop Collection <FaArrowRight className="btn-arrow-icon" />
            </Link>
            <Link to="/about" className="btn-promo-secondary">
              Learn More
            </Link>
          </div>
        </div>

        {/* Right Side: Image Banner */}
        <div className="promo-lux-image-wrapper">
          <picture className="promo-lux-picture">
            <source media="(max-width: 576px)" srcSet="/about_hero.jpg" />
            <source media="(max-width: 1024px)" srcSet="/about_formulation.jpg" />
            <img
              src="/about_cta.jpg"
              alt="Premium Skincare Routine"
              className="promo-lux-img"
              loading="lazy"
            />
          </picture>
        </div>

      </div>
    </section>
  );
};

export default PromoSection;
