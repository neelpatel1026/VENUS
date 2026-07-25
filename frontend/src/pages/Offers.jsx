import React, { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { FiCopy, FiCheck, FiChevronDown, FiChevronUp, FiClock, FiPercent, FiTrendingUp } from "react-icons/fi";
import { motion } from "framer-motion";
import toast from "react-hot-toast";
import "../styles/offers.css";

const Offers = () => {
  const navigate = useNavigate();
  
  // Set page meta for SEO
  useEffect(() => {
    document.title = "VENUS CARE Offers | Exclusive Cosmetic Deals";
    const metaDesc = document.querySelector('meta[name="description"]');
    if (metaDesc) {
      metaDesc.setAttribute("content", "Premium skincare offers, combo discounts, free shipping, festival sales, and exclusive coupon codes.");
    }
  }, []);

  // Countdown timer state
  const [timeLeft, setTimeLeft] = useState({ hours: 14, minutes: 32, seconds: 45 });
  useEffect(() => {
    const timer = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev.seconds > 0) {
          return { ...prev, seconds: prev.seconds - 1 };
        } else if (prev.minutes > 0) {
          return { ...prev, minutes: prev.minutes - 1, seconds: 59 };
        } else if (prev.hours > 0) {
          return { hours: prev.hours - 1, minutes: 59, seconds: 59 };
        } else {
          return { hours: 24, minutes: 0, seconds: 0 }; // Loop back
        }
      });
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // Copied state for coupon codes
  const [copiedCode, setCopiedCode] = useState(null);
  const handleCopyCode = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Coupon "${code}" copied successfully!`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  // FAQ Accordion State
  const [activeFaq, setActiveFaq] = useState(null);
  const toggleFaq = (index) => {
    setActiveFaq(activeFaq === index ? null : index);
  };

  return (
    <motion.div 
      className="offers-page-container"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.5 }}
    >
      {/* ================= HERO SECTION ================= */}
      <section className="offers-hero-section">
        {/* Replace with custom banner background artwork link if needed */}
        <div className="hero-banner-image-background-overlay">
          <img 
            src="/about_hero.jpg" 
            alt="Luxury premium cosmetics background banner" 
            className="hero-luxury-banner-bg"
          />
          <div className="hero-overlay-darkening-layer" />
        </div>

        <div className="offers-hero-content-box">
          <motion.h1 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.2, duration: 0.5 }}
          >
            Exclusive Offers
          </motion.h1>
          <motion.p 
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.3, duration: 0.5 }}
          >
            Save More On Your Favorite Premium Skincare Products.
          </motion.p>
          <motion.div 
            className="hero-buttons-row"
            initial={{ y: 30, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.4, duration: 0.5 }}
          >
            <button className="offers-cta-btn" onClick={() => navigate("/shop")}>Shop Now</button>
            <a href="#live-coupons" className="offers-cta-btn secondary-gold-outline-btn">Explore Offers</a>
          </motion.div>
        </div>
      </section>

      {/* ================= CURRENT LIVE OFFERS ================= */}
      <section className="offers-grid-section-layout">
        <div className="offers-section-header-centered">
          <h2>Current Live Offers</h2>
          <div className="gold-accent-line" />
        </div>

        <div className="live-offers-cards-masonry-grid">
          {/* Card 1 */}
          <div className="live-offer-card-item">
            <div className="live-card-badge-top">skincare special</div>
            <div className="live-card-icon-emoji">🎁</div>
            <h3>BUY 2 GET 1 FREE</h3>
            <p>On selected skincare formulations and scrubs. Add 3 to checkout cart.</p>
            <button onClick={() => navigate("/shop?search=Serums")} className="live-offer-card-action-btn">Shop Offer</button>
          </div>

          {/* Card 2 */}
          <div className="live-offer-card-item">
            <div className="live-card-badge-top">everyday shipping</div>
            <div className="live-card-icon-emoji">🚚</div>
            <h3>FREE SHIPPING</h3>
            <p>No coupon required. Valid automatically on all orders above ₹499.</p>
            <button onClick={() => navigate("/shop")} className="live-offer-card-action-btn">Shop Products</button>
          </div>

          {/* Card 3 */}
          <div className="live-offer-card-item">
            <div className="live-card-badge-top">flat discount</div>
            <div className="live-card-icon-emoji">💳</div>
            <h3>FLAT ₹200 OFF</h3>
            <p>On orders above ₹1499. Apply code at payment validation.</p>
            <div className="live-card-coupon-display-box">
              <span>VENUS200</span>
              <button onClick={() => handleCopyCode("VENUS200")} className="live-copy-code-btn">
                {copiedCode === "VENUS200" ? <FiCheck /> : <FiCopy />}
              </button>
            </div>
          </div>

          {/* Card 4 */}
          <div className="live-offer-card-item">
            <div className="live-card-badge-top">new customer</div>
            <div className="live-card-icon-emoji">✨</div>
            <h3>15% OFF FIRST ORDER</h3>
            <p>First order discount. Valid on premium creams and fragrances.</p>
            <div className="live-card-coupon-display-box">
              <span>WELCOME15</span>
              <button onClick={() => handleCopyCode("WELCOME15")} className="live-copy-code-btn">
                {copiedCode === "WELCOME15" ? <FiCheck /> : <FiCopy />}
              </button>
            </div>
          </div>

          {/* Card 5 */}
          <div className="live-offer-card-item">
            <div className="live-card-badge-top">limited festival</div>
            <div className="live-card-icon-emoji">🎉</div>
            <h3>FESTIVAL SPECIAL</h3>
            <p>Up to 40% discount on complete bridal beauty packages. Limited time.</p>
            <button onClick={() => navigate("/shop?search=Gift")} className="live-offer-card-action-btn">Explore Packages</button>
          </div>

          {/* Card 6 */}
          <div className="live-offer-card-item">
            <div className="live-card-badge-top">exclusive combo</div>
            <div className="live-card-icon-emoji">💝</div>
            <h3>COMBO OFFERS</h3>
            <p>Buy organic Face Wash + Anti-Aging Serum bundle. Save flat ₹350.</p>
            <button onClick={() => navigate("/shop?search=Face")} className="live-offer-card-action-btn">Buy Combo</button>
          </div>
        </div>
      </section>

      {/* ================= LIMITED TIME DEALS ================= */}
      <section className="offers-grid-section-layout background-cream-tint">
        <div className="offers-section-header-centered">
          <h2>Limited Time Deals</h2>
          <div className="gold-accent-line" />
        </div>

        <div className="deals-timer-countdown-row">
          <div className="timer-title-box">
            <FiClock style={{ color: "#C8A96B" }} />
            <span>Deals expire in:</span>
          </div>
          <div className="countdown-digits-box">
            <div className="digit-unit"><strong>{timeLeft.hours}</strong><span>hrs</span></div>
            <span className="digit-separator">:</span>
            <div className="digit-unit"><strong>{timeLeft.minutes}</strong><span>mins</span></div>
            <span className="digit-separator">:</span>
            <div className="digit-unit"><strong>{timeLeft.seconds}</strong><span>secs</span></div>
          </div>
        </div>

        <div className="deals-products-cards-grid-list">
          {[
            { id: "combo1", name: "Gluthathione Radiance Cream", img: "/about_cta.jpg", discount: "30% OFF", price: 699, oldPrice: 999 },
            { id: "combo2", name: "Vitamin C Luxury Face Wash", img: "/about_hero.jpg", discount: "25% OFF", price: 449, oldPrice: 599 },
            { id: "combo3", name: "Pure Sandalwood Essential Oil", img: "/about_lab.jpg", discount: "40% OFF", price: 899, oldPrice: 1499 }
          ].map((deal, idx) => (
            <div key={idx} className="limited-deal-card-item">
              <div className="deal-discount-badge-top">{deal.discount}</div>
              <div className="deal-image-wrapper">
                {/* Replace with actual product deal campaign image */}
                <img src={deal.img} alt={deal.name} loading="lazy" onError={(e) => { e.target.src = "/cosmetic_1.avif"; }} />
              </div>
              <div className="deal-details-box">
                <h4>{deal.name}</h4>
                <div className="deal-prices-row">
                  <span className="price-current">₹{deal.price}</span>
                  <span className="price-original">₹{deal.oldPrice}</span>
                </div>
                <button className="deal-shop-btn" onClick={() => navigate("/shop")}>Shop Now</button>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= CATEGORY OFFERS ================= */}
      <section className="offers-grid-section-layout">
        <div className="offers-section-header-centered">
          <h2>Shop Offers by Category</h2>
          <div className="gold-accent-line" />
        </div>

        <div className="category-offers-horizontal-flex-grid">
          {[
            { name: "Face Wash", img: "/about_hero.jpg", discount: "Min 15% OFF", price: "₹299" },
            { name: "Serums", img: "/about_formulation.jpg", discount: "Up to 30% OFF", price: "₹499" },
            { name: "Hair Oil", img: "/about_lab.jpg", discount: "Flat 25% OFF", price: "₹349" },
            { name: "Sunscreen", img: "/about_cta.jpg", discount: "Min 20% OFF", price: "₹399" },
            { name: "Soap", img: "/cosmetic_1.avif", discount: "Buy 3 Get 1 Free", price: "₹199" },
            { name: "Gift Sets", img: "/about_hero.jpg", discount: "Up to 40% OFF", price: "₹999" }
          ].map((cat, idx) => (
            <div 
              key={idx} 
              className="category-offer-card-item"
              onClick={() => navigate(`/shop?search=${encodeURIComponent(cat.name)}`)}
            >
              <div className="cat-offer-image-box">
                {/* Replace with custom category offer image */}
                <img src={cat.img} alt={cat.name} loading="lazy" onError={(e) => { e.target.src = "/cosmetic_1.avif"; }} />
              </div>
              <div className="cat-offer-meta-box">
                <span className="cat-offer-discount-tag">{cat.discount}</span>
                <h4>{cat.name}</h4>
                <p>Starting at {cat.price}</p>
                <span className="cat-offer-action-link">Shop Category →</span>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= PROMOTION BANNERS ================= */}
      <section className="offers-promotional-banners-section">
        {/* Banner 1 */}
        <div className="offers-promotional-banner-card-item" onClick={() => navigate("/shop")}>
          {/* Replace with campaign artwork banner */}
          <img src="/about_cta.jpg" alt="Skincare Festival banner" className="promo-banner-img" onError={(e) => { e.target.src = "/about_hero.jpg"; }} />
          <div className="promo-banner-darkening-layer" />
          <div className="promo-banner-content-inner">
            <span className="banner-badge-text">Luxury Glow Week</span>
            <h2>Luxury Skincare Festival</h2>
            <p>Complete your beauty ritual with premium droppers and organic extracts.</p>
            <span className="banner-cta-link">Shop The Collection</span>
          </div>
        </div>

        {/* Banner 2 */}
        <div className="offers-promotional-banner-card-item" onClick={() => navigate("/shop")}>
          {/* Replace with campaign artwork banner */}
          <img src="/about_formulation.jpg" alt="Monsoon Glow banner" className="promo-banner-img" onError={(e) => { e.target.src = "/about_hero.jpg"; }} />
          <div className="promo-banner-darkening-layer" />
          <div className="promo-banner-content-inner">
            <span className="banner-badge-text">Weekend Flash Sale</span>
            <h2>Monsoon Hydration Care</h2>
            <p>Save flat 25% on moisture locks and premium organic formulations.</p>
            <span className="banner-cta-link">Explore Sale</span>
          </div>
        </div>
      </section>

      {/* ================= COUPON SECTION ================= */}
      <section id="live-coupons" className="offers-grid-section-layout background-cream-tint">
        <div className="offers-section-header-centered">
          <h2>Active Coupon Codes</h2>
          <div className="gold-accent-line" />
        </div>

        <div className="coupons-cards-flex-grid-list">
          {[
            { code: "WELCOME15", desc: "Get 15% discount on your first order. Valid on all products.", minOrder: "No minimum order", expiry: "Valid till Dec 2026" },
            { code: "VENUS200", desc: "Enjoy flat ₹200 off on shopping above ₹1499.", minOrder: "Orders above ₹1499", expiry: "Valid till Nov 2026" },
            { code: "GLOW10", desc: "Extra 10% off on all organic Serums and moisturizers.", minOrder: "Orders above ₹999", expiry: "Valid till Dec 2026" },
            { code: "SKINCARE25", desc: "Flat 25% discount on buying any 3 products.", minOrder: "Minimum 3 items in cart", expiry: "Valid till Oct 2026" }
          ].map((cop, idx) => (
            <div key={idx} className="coupon-item-card-display">
              <div className="coupon-left-dashed-section">
                <div className="coupon-code-badge-text">{cop.code}</div>
                <button 
                  onClick={() => handleCopyCode(cop.code)}
                  className="coupon-copy-icon-btn"
                  aria-label="Copy coupon code"
                >
                  {copiedCode === cop.code ? <FiCheck style={{ color: "#16A34A" }} /> : <FiCopy />}
                </button>
              </div>
              <div className="coupon-right-details-section">
                <p className="coupon-desc-text">{cop.desc}</p>
                <div className="coupon-metadata-footer">
                  <span><strong>Min Order:</strong> {cop.minOrder}</span>
                  <span><strong>Expiry:</strong> {cop.expiry}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* ================= HOW TO AVAIL OFFER ================= */}
      <section className="offers-grid-section-layout">
        <div className="offers-section-header-centered">
          <h2>How To Avail Offers</h2>
          <div className="gold-accent-line" />
        </div>

        <div className="avail-process-timeline-layout">
          {[
            { num: 1, title: "Browse Products", desc: "Explore our collection of premium organic creams and serums." },
            { num: 2, title: "Add To Cart", desc: "Add qualifying items to your shopping cart to unlock combinations." },
            { num: 3, title: "Apply Coupon", desc: "Copy and paste active coupon codes in checkout coupon panel." },
            { num: 4, title: "Enjoy Discount", desc: "Complete transaction via secure gateways and claim benefits." }
          ].map((step, idx) => (
            <div key={idx} className="avail-timeline-step-card">
              <div className="step-card-number-badge">{step.num}</div>
              <h4>{step.title}</h4>
              <p>{step.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ================= FAQ SECTION ================= */}
      <section className="offers-grid-section-layout background-cream-tint">
        <div className="offers-section-header-centered">
          <h2>Frequently Asked Questions</h2>
          <div className="gold-accent-line" />
        </div>

        <div className="offers-faqs-accordion-container">
          {[
            { q: "Can I combine coupons?", a: "Only one coupon code can be applied per order. Free shipping offers apply automatically and can be combined with item discounts." },
            { q: "Do offers expire?", a: "Yes, offers are time-bound campaigns. Specific coupon details, terms, and expiration dates are visible on each coupon badge." },
            { q: "Can I use multiple coupons?", a: "Multiple coupon code entries are blocked. If you apply a new code, it replaces the previously applied code." },
            { q: "Shipping offer details", a: "Free shipping is triggered automatically on all orders exceeding ₹499 destination total. Orders under ₹499 carry a flat ₹50 shipping charge." },
            { q: "Return policy for discounted items", a: "Items purchased under special campaign codes or combo deals are fully covered by our damage/incorrect item return policies. Returns must be logged within 48 hours." }
          ].map((faq, idx) => (
            <div key={idx} className="faq-accordion-item-box">
              <button 
                type="button"
                className="faq-accordion-trigger-button"
                onClick={() => toggleFaq(idx)}
              >
                <span>{faq.q}</span>
                {activeFaq === idx ? <FiChevronUp /> : <FiChevronDown />}
              </button>
              {activeFaq === idx && (
                <div className="faq-accordion-content-panel">
                  <p>{faq.a}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>

      {/* ================= NEWSLETTER ================= */}
      <section className="offers-newsletter-subscribe-section">
        <div className="newsletter-card-inner-box">
          <h2>Get Exclusive Offers</h2>
          <p>Subscribe to our newsletter list. Get customized promo notifications and secret discount codes.</p>
          <form onSubmit={(e) => { e.preventDefault(); toast.success("Subscribed successfully!"); e.target.reset(); }} className="newsletter-email-form-control">
            <input 
              type="email" 
              placeholder="Enter your email address" 
              className="newsletter-email-text-input" 
              required
            />
            <button type="submit" className="newsletter-subscribe-submit-btn">Subscribe</button>
          </form>
        </div>
      </section>
    </motion.div>
  );
};

export default Offers;
