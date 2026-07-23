import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  FiCheckCircle,
  FiShield,
  FiHeart,
  FiAward,
  FiTruck,
  FiRefreshCw,
  FiFeather,
  FiUsers,
  FiStar,
  FiArrowRight,
  FiBox,
  FiSmile
} from "react-icons/fi";
import "../styles/aboutPage.css";

const About = () => {
  // Animation Variants
  const fadeInUp = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0, transition: { duration: 0.6, ease: "easeOut" } },
  };

  const staggerContainer = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.12,
      },
    },
  };

  const featureCards = [
    {
      icon: <FiFeather style={{ color: "#C8A165" }} />,
      title: "Acid-Free Formulations",
      desc: "Balanced pH formulas engineered to nourish delicate skin barriers without harsh chemical peeling.",
    },
    {
      icon: <FiHeart style={{ color: "#C8A165" }} />,
      title: "100% Cruelty-Free",
      desc: "Ethically harvested, completely vegan components. We never test on animals — ever.",
    },
    {
      icon: <FiShield style={{ color: "#C8A165" }} />,
      title: "Dermatologically Tested",
      desc: "Rigorously evaluated by independent dermatologists for non-comedogenic and hypoallergenic safety.",
    },
    {
      icon: <FiAward style={{ color: "#C8A165" }} />,
      title: "Botanical Purity",
      desc: "Pure cold-pressed plant extracts and natural oils sourced directly from organic botanical farms.",
    },
    {
      icon: <FiTruck style={{ color: "#C8A165" }} />,
      title: "Express Luxury Delivery",
      desc: "Safely cushioned in tamper-evident luxury wraps and delivered directly to your doorstep.",
    },
    {
      icon: <FiRefreshCw style={{ color: "#C8A165" }} />,
      title: "14-Day Easy Guarantee",
      desc: "Complete peace of mind. Hassle-free return policies with swift refund processing.",
    },
    {
      icon: <FiBox style={{ color: "#C8A165" }} />,
      title: "Eco-Conscious Packaging",
      desc: "Recyclable glass vessels and FSC-certified biodegradable cartons to preserve our planet.",
    },
    {
      icon: <FiUsers style={{ color: "#C8A165" }} />,
      title: "24/7 Dedicated Care",
      desc: "Expert skin advice and order assistance available around the clock through our beauty desk.",
    },
  ];

  const statsData = [
    { value: "50,000+", label: "Happy Glow Customers" },
    { value: "99.4%", label: "Satisfaction Rate" },
    { value: "100%", label: "Clean & Acid-Free" },
    { value: "150+", label: "Cities Delivered Across India" },
  ];

  const processSteps = [
    { number: "01", title: "Ethical Sourcing", desc: "Selecting pure, wild-harvested botanical extracts." },
    { number: "02", title: "Cold Extraction", desc: "Preserving active nutrient potency without high heat." },
    { number: "03", title: "Derm Testing", desc: "Passing rigorous allergen & sensitivity trials." },
    { number: "04", title: "Glass Bottling", desc: "UV-protected sealing for maximum shelf vitality." },
    { number: "05", title: "Doorstep Care", desc: "Fresh batch delivery packed with luxury precision." },
  ];

  return (
    <div className="about-page-wrapper route-fade-in">
      
      {/* 1. HERO SECTION */}
      <section className="about-hero-section">
        <motion.div
          initial="hidden"
          animate="visible"
          variants={staggerContainer}
          className="about-hero-grid"
        >
          {/* Hero Left Text */}
          <motion.div variants={fadeInUp}>
            <div className="about-hero-badge">
              <span>VENUS CARE</span>
              <span>•</span>
              <span>Pure Apothecary</span>
            </div>

            <h1 className="about-hero-title">
              Pure Botanical Luxury, Backed By Science.
            </h1>

            <p className="about-hero-desc">
              At VENUS CARE, we believe skincare is an intimate daily ritual. We craft acid-free, nutrient-dense botanical formulations that honour your natural beauty — with zero compromise on safety or performance.
            </p>

            <div className="about-hero-buttons">
              <Link
                to="/shop"
                style={{
                  padding: "16px 36px",
                  background: "#C8A165",
                  color: "#FFFFFF",
                  borderRadius: "50px",
                  fontWeight: "700",
                  fontSize: "14px",
                  textDecoration: "none",
                  letterSpacing: "0.5px",
                  boxShadow: "0 8px 24px rgba(200, 161, 101, 0.25)",
                  transition: "transform 0.2s, background-color 0.2s",
                }}
              >
                Explore Collection
              </Link>
              <a
                href="#our-story"
                style={{
                  padding: "16px 32px",
                  background: "#FAF9F6",
                  color: "#1A1A1A",
                  borderRadius: "50px",
                  fontWeight: "600",
                  fontSize: "14px",
                  textDecoration: "none",
                  border: "1px solid #ECE7DF",
                  transition: "background 0.2s",
                }}
              >
                Our Philosophy
              </a>
            </div>
          </motion.div>

          {/* Hero Right Image Showcase */}
          <motion.div variants={fadeInUp} className="about-hero-img-wrapper">
            <div className="about-hero-img-box">
              <img
                src="/about_hero.jpg"
                alt="Venus Care Hero Botanical"
                className="about-hero-img"
                loading="lazy"
                onError={(e) => { e.target.onerror = null; e.target.src = "/cosmetic_1.avif"; }}
              />
            </div>

            {/* Floating Trust Badge */}
            <motion.div
              animate={{ y: [0, -10, 0] }}
              transition={{ repeat: Infinity, duration: 4, ease: "easeInOut" }}
              className="about-hero-floating-badge"
            >
              <div style={{ width: "42px", height: "42px", borderRadius: "50%", background: "#FAF9F6", display: "flex", alignItems: "center", justifyContent: "center", color: "#C8A165", fontSize: "20px", flexShrink: 0 }}>
                <FiAward />
              </div>
              <div>
                <div style={{ fontSize: "14px", fontWeight: "700", color: "#1A1A1A" }}>100% Acid-Free</div>
                <div style={{ fontSize: "12px", color: "#6B7280" }}>Dermatologically Approved</div>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
      </section>

      {/* 2. OUR STORY (ALTERNATING LAYOUT) */}
      <section id="our-story" className="about-story-section">
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="about-story-header"
          >
            <span style={{ color: "#C8A165", fontWeight: "700", letterSpacing: "2px", fontSize: "12px", textTransform: "uppercase" }}>THE VENUS HERITAGE</span>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", fontFamily: "'Cinzel', 'Georgia', serif", fontWeight: "700", color: "#1A1A1A", marginTop: "10px" }}>
              Crafted For Radiant, Healthy Skin
            </h2>
          </motion.div>

          {/* Block 1 */}
          <div className="about-story-grid" style={{ marginBottom: "40px" }}>
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
              <h3 style={{ fontSize: "1.8rem", fontFamily: "'Cinzel', serif", color: "#1A1A1A", marginBottom: "16px" }}>The Genesis of Pure Care</h3>
              <p style={{ fontSize: "1.05rem", lineHeight: "1.8", color: "#4B5563", marginBottom: "20px" }}>
                VENUS CARE was born out of a simple revelation: conventional skincare relied heavily on harsh exfoliating acids that stripped the skin's natural barrier.
              </p>
              <p style={{ fontSize: "1.05rem", lineHeight: "1.8", color: "#4B5563" }}>
                Our team of herbalists and cosmetic chemists set out to engineer potent botanical formulas that nourish, repair, and protect without causing redness or irritation.
              </p>
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
              <img
                src="/about_lab.jpg"
                alt="Apothecary Lab"
                className="about-story-img"
                loading="lazy"
                onError={(e) => { e.target.onerror = null; e.target.src = "/cosmetic_1.avif"; }}
              />
            </motion.div>
          </div>

          {/* Block 2 */}
          <div className="about-story-grid">
            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
              <img
                src="/about_formulation.jpg"
                alt="Clean Formulations"
                className="about-story-img"
                loading="lazy"
                onError={(e) => { e.target.onerror = null; e.target.src = "/cosmetic_1.avif"; }}
              />
            </motion.div>

            <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
              <h3 style={{ fontSize: "1.8rem", fontFamily: "'Cinzel', serif", color: "#1A1A1A", marginBottom: "16px" }}>Science Meets Nature</h3>
              <p style={{ fontSize: "1.05rem", lineHeight: "1.8", color: "#4B5563", marginBottom: "20px" }}>
                We blend rare organic cold-pressed oils, bio-identical peptides, and gentle plant actives to create harmonious formulas tailored for modern skin stress.
              </p>
              <p style={{ fontSize: "1.05rem", lineHeight: "1.8", color: "#4B5563" }}>
                Every batch undergoes multi-tiered quality control checks to guarantee peak stability, active ingredient freshness, and pristine texture.
              </p>
            </motion.div>
          </div>

        </div>
      </section>

      {/* 3. WHY CHOOSE VENUS CARE (FEATURE CARDS) */}
      <section className="about-features-section">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="about-features-header">
          <span style={{ color: "#C8A165", fontWeight: "700", letterSpacing: "2px", fontSize: "12px", textTransform: "uppercase" }}>STANDARDS OF EXCELLENCE</span>
          <h2 style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", fontFamily: "'Cinzel', 'Georgia', serif", fontWeight: "700", color: "#1A1A1A", marginTop: "10px" }}>
            Why Discerning Clients Trust VENUS CARE
          </h2>
        </motion.div>

        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="about-features-grid"
        >
          {featureCards.map((card, idx) => (
            <motion.div
              key={idx}
              variants={fadeInUp}
              whileHover={{ y: -6, transition: { duration: 0.2 } }}
              className="about-feature-card"
            >
              <div style={{ fontSize: "28px", marginBottom: "18px" }}>{card.icon}</div>
              <h4 style={{ fontSize: "1.15rem", fontWeight: "700", color: "#1A1A1A", marginBottom: "10px" }}>{card.title}</h4>
              <p style={{ fontSize: "0.95rem", lineHeight: "1.6", color: "#6B7280" }}>{card.desc}</p>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 4. MISSION & VISION (LUXURY GLASS DUAL CARDS) */}
      <section className="about-mission-section">
        <div className="about-mission-grid">
          
          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="about-mission-card"
          >
            <div style={{ color: "#C8A165", fontWeight: "700", letterSpacing: "1.5px", fontSize: "12px", textTransform: "uppercase", marginBottom: "12px" }}>PURPOSE & CALLING</div>
            <h3 style={{ fontSize: "2rem", fontFamily: "'Cinzel', serif", color: "#1A1A1A", marginBottom: "18px" }}>Our Mission</h3>
            <p style={{ fontSize: "1.05rem", lineHeight: "1.8", color: "#4B5563" }}>
              To empower individuals worldwide through gentle, non-irritating botanical formulations that respect the skin's biological balance, inspiring radiant self-confidence every day.
            </p>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={fadeInUp}
            className="about-mission-card"
          >
            <div style={{ color: "#C8A165", fontWeight: "700", letterSpacing: "1.5px", fontSize: "12px", textTransform: "uppercase", marginBottom: "12px" }}>FUTURE HORIZONS</div>
            <h3 style={{ fontSize: "2rem", fontFamily: "'Cinzel', serif", color: "#1A1A1A", marginBottom: "18px" }}>Our Vision</h3>
            <p style={{ fontSize: "1.05rem", lineHeight: "1.8", color: "#4B5563" }}>
              To redefine luxury skincare by creating an uncompromising benchmark for zero-acid botanical purity, complete ingredient transparency, and sustainable apothecary craftsmanship.
            </p>
          </motion.div>

        </div>
      </section>

      {/* 5. CUSTOMER TRUST & STATS */}
      <section className="about-stats-section">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={staggerContainer}
          className="about-stats-grid"
        >
          {statsData.map((stat, idx) => (
            <motion.div key={idx} variants={fadeInUp} className="about-stat-card">
              <div style={{ fontSize: "2.8rem", fontWeight: "800", color: "#C8A165", fontFamily: "'Cinzel', serif", marginBottom: "8px" }}>{stat.value}</div>
              <div style={{ fontSize: "0.95rem", fontWeight: "600", color: "#4B5563" }}>{stat.label}</div>
            </motion.div>
          ))}
        </motion.div>
      </section>

      {/* 6. OUR CRAFTSMANSHIP PROCESS (TIMELINE) */}
      <section className="about-process-section">
        <div style={{ maxWidth: "1280px", margin: "0 auto" }}>
          
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp} className="about-process-header">
            <span style={{ color: "#C8A165", fontWeight: "700", letterSpacing: "2px", fontSize: "12px", textTransform: "uppercase" }}>FROM FARM TO RITUAL</span>
            <h2 style={{ fontSize: "clamp(2rem, 4vw, 2.8rem)", fontFamily: "'Cinzel', 'Georgia', serif", fontWeight: "700", color: "#1A1A1A", marginTop: "10px" }}>
              Our 5-Step Botanical Process
            </h2>
          </motion.div>

          <motion.div
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={staggerContainer}
            className="about-process-grid"
          >
            {processSteps.map((step, idx) => (
              <motion.div key={idx} variants={fadeInUp} className="about-process-card">
                <div style={{ fontSize: "24px", fontWeight: "800", color: "#C8A165", opacity: 0.6, marginBottom: "12px", fontFamily: "'Cinzel', serif" }}>{step.number}</div>
                <h4 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#1A1A1A", marginBottom: "8px" }}>{step.title}</h4>
                <p style={{ fontSize: "0.9rem", color: "#6B7280", lineHeight: "1.6" }}>{step.desc}</p>
              </motion.div>
            ))}
          </motion.div>

        </div>
      </section>

      {/* 7. CUSTOMER TESTIMONIAL HIGHLIGHT */}
      <section className="about-testimonial-section">
        <motion.div initial="hidden" whileInView="visible" viewport={{ once: true }} variants={fadeInUp}>
          <div style={{ display: "flex", justifyContent: "center", gap: "4px", color: "#C8A165", fontSize: "20px", marginBottom: "20px" }}>
            {[...Array(5)].map((_, i) => (
              <FiStar key={i} style={{ fill: "#C8A165" }} />
            ))}
          </div>
          
          <blockquote style={{ fontSize: "clamp(1.2rem, 3vw, 1.6rem)", fontFamily: "'Cinzel', 'Georgia', serif", lineHeight: "1.7", color: "#1A1A1A", fontStyle: "italic", marginBottom: "30px" }}>
            "VENUS CARE transformed my skincare routine. My sensitive skin has never felt this calm, hydrated, and naturally luminous. The acid-free formulation is truly revolutionary."
          </blockquote>

          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "14px" }}>
             <img
               src="/about_avatar.jpg"
               alt="Client Avatar"
               style={{ width: "50px", height: "50px", borderRadius: "50%", objectFit: "cover", border: "2px solid #C8A165" }}
               loading="lazy"
               onError={(e) => { e.target.onerror = null; e.target.src = "/cosmetic_1.avif"; }}
             />
            <div style={{ textAlign: "left" }}>
              <div style={{ fontWeight: "700", color: "#1A1A1A", fontSize: "15px" }}>Ananya Roy</div>
              <div style={{ fontSize: "12px", color: "#6B7280" }}>Verified Client • Mumbai</div>
            </div>
          </div>
        </motion.div>
      </section>

      {/* 8. FINAL CTA BANNER */}
      <section className="luxury-about-cta-section">
        <motion.div
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true }}
          variants={fadeInUp}
          className="luxury-about-cta-container"
        >
          {/* Left Column: Text Content and Buttons */}
          <div className="luxury-about-cta-left">
            <span className="luxury-badge">
              <span className="gold-accent-dot" style={{ display: "inline-block", width: "6px", height: "6px", background: "#C8A165", borderRadius: "50%" }} />
              Elevate Your Daily Ritual
            </span>
            
            <h2 className="luxury-heading">
              Reveal Your Natural Glow
            </h2>
            
            <p className="luxury-description">
              Experience our pure botanical formulations handcrafted for radiant, healthy skin. Luxury skincare crafted for everyday confidence.
            </p>

            <div className="luxury-cta-buttons">
              <Link to="/shop" className="luxury-btn-primary">
                Shop Collection
              </Link>
              <Link to="/contact" className="luxury-btn-secondary">
                Contact Beauty Experts
              </Link>
            </div>
          </div>

          {/* Right Column: Premium Skincare Arrangement Image */}
          <div className="luxury-about-cta-right">
            <img 
              src="/about_cta.jpg" 
              alt="Premium Venus Care skincare arrangement" 
              className="luxury-product-img"
              loading="lazy"
              onError={(e) => { e.target.onerror = null; e.target.src = "/cosmetic_1.avif"; }}
            />
          </div>
        </motion.div>
      </section>

    </div>
  );
};

export default About;
