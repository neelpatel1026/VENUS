import React from "react";
import "../styles/gallery.css";

const galleryImages = [
  { id: 1, src: "/about_hero.jpg", alt: "Botanical skincare application" },
  { id: 2, src: "/about_cta.jpg", alt: "Luxury droppers and serums" },
  { id: 3, src: "/about_formulation.jpg", alt: "Natural plants and formulation" },
  { id: 4, src: "/about_lab.jpg", alt: "Dermatologist testing lab" },
];

const Gallery = () => {
  return (
    <section className="brand-gallery-section font-outfit">
      <div className="gallery-lux-container">
        
        {/* Header */}
        <div className="gallery-header">
          <span className="gallery-tag">VISUAL INSPIRATION</span>
          <h2 className="gallery-title font-serif">The Venus Lifestyle</h2>
          <p className="gallery-subtitle">A glimpse into our world of botanical luxury, conscious science, and pure beauty rituals.</p>
        </div>

        {/* Grid layout: 4 columns desktop, 2 columns tablet/mobile */}
        <div className="gallery-grid-lux">
          {galleryImages.map((img) => (
            <div key={img.id} className="gallery-item-wrapper">
              <img 
                src={img.src} 
                alt={img.alt} 
                className="gallery-img"
                loading="lazy"
              />
              <div className="gallery-overlay">
                <span className="overlay-text font-serif">Venus Care</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
};

export default Gallery;
