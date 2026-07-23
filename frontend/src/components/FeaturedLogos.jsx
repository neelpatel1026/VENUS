import React from "react";
import "../styles/featuredLogos.css";

const logos = [
  { id: 1, name: "VOGUE" },
  { id: 2, name: "ELLE" },
  { id: 3, name: "COSMOPOLITAN" },
  { id: 4, name: "HARPER'S BAZAAR" },
  { id: 5, name: "FORBES" },
  { id: 6, name: "BEAUTY INSIDER" },
];

const FeaturedLogos = () => {
  return (
    <section className="featured-logos-section font-outfit">
      <div className="logos-lux-container">
        <h3 className="logos-title">AS FEATURED IN</h3>
        <div className="logos-grid-lux">
          {logos.map((logo) => (
            <div key={logo.id} className="logo-item-wrapper">
              <span className="logo-text font-serif">{logo.name}</span>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedLogos;
