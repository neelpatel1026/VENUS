import React from "react";
import { FaInstagram } from "react-icons/fa";
import "../styles/instagramFeed.css";

const instaPosts = [
  { id: 1, src: "/hero1_desktop.jpg", link: "https://instagram.com" },
  { id: 2, src: "/hero2_desktop.jpg", link: "https://instagram.com" },
  { id: 3, src: "/hero3_desktop.jpg", link: "https://instagram.com" },
  { id: 4, src: "/hero4_desktop.jpg", link: "https://instagram.com" },
];

const InstagramFeed = () => {
  return (
    <section className="insta-feed-section font-outfit">
      <div className="insta-lux-container">
        
        {/* Header */}
        <div className="insta-header">
          <FaInstagram className="insta-header-icon" />
          <span className="insta-tag">INSTAGRAM RITUALS</span>
          <h2 className="insta-title font-serif">Follow @venuscare</h2>
          <p className="insta-subtitle">Join our online self-care circle for daily inspiration, product updates, and skincare tips.</p>
        </div>

        {/* Grid layout: 4 columns desktop, 2 columns tablet/mobile */}
        <div className="insta-grid-lux">
          {instaPosts.map((post) => (
            <a 
              key={post.id} 
              href={post.link} 
              target="_blank" 
              rel="noopener noreferrer" 
              className="insta-item-wrapper"
            >
              <img 
                src={post.src} 
                alt="Instagram self-care post" 
                className="insta-img"
                loading="lazy"
              />
              <div className="insta-overlay">
                <FaInstagram className="overlay-insta-icon" />
                <span className="overlay-text font-serif">View Post</span>
              </div>
            </a>
          ))}
        </div>

        {/* CTA Button */}
        <div className="insta-cta-wrapper">
          <a 
            href="https://instagram.com" 
            target="_blank" 
            rel="noopener noreferrer" 
            className="btn-insta-follow font-serif"
          >
            Follow on Instagram
          </a>
        </div>

      </div>
    </section>
  );
};

export default InstagramFeed;
