import { Link } from "react-router-dom";
import {
  FaLeaf,
  FaShieldAlt,
  FaHeart,
  FaFlask,
} from "react-icons/fa";

const About = () => {
  const features = [
    {
      icon: <FaLeaf />,
      title: "100% Acid-Free",
      desc: "Gentle skincare suitable for all skin types.",
    },
    {
      icon: <FaShieldAlt />,
      title: "Safe Ingredients",
      desc: "Carefully selected ingredients for healthy skin.",
    },
    {
      icon: <FaHeart />,
      title: "Cruelty Free",
      desc: "Never tested on animals, always ethically made.",
    },
    {
      icon: <FaFlask />,
      title: "Skin Friendly",
      desc: "Formulated to nourish and protect naturally.",
    },
  ];

  const stats = [
    { number: "5000+", label: "Happy Customers" },
    { number: "20+", label: "Premium Products" },
    { number: "98%", label: "Positive Reviews" },
    { number: "100%", label: "Acid-Free Formula" },
  ];

  return (
    <div style={{ background: "#FCFBF9", minHeight: "100vh" }}>
      
      {/* Editorial Hero Header Banner */}
      <div 
        className="premium-page-hero"
        style={{ 
          background: "linear-gradient(135deg, #FAF6F0 0%, #F5ECE0 100%)", 
          borderBottom: "1px solid rgba(200, 169, 107, 0.2)", 
          padding: "40px 20px", 
          textAlign: "center", 
          position: "relative",
          overflow: "hidden"
        }}
      >
        <div style={{ position: "absolute", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(200, 169, 107, 0.08)", filter: "blur(40px)", top: "-50px", left: "-50px", pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: "250px", height: "250px", borderRadius: "50%", background: "rgba(200, 169, 107, 0.05)", filter: "blur(60px)", bottom: "-80px", right: "-50px", pointerEvents: "none" }} />
        
        <div style={{ maxWidth: "800px", margin: "0 auto", position: "relative", zIndex: "2" }}>
          <div style={{ fontSize: "0.75rem", letterSpacing: "2px", textTransform: "uppercase", color: "#8B7355", marginBottom: "14px", fontWeight: "700" }}>
            <Link to="/" style={{ color: "#8B7355", textDecoration: "none" }}>Home</Link>
            <span style={{ margin: "0 8px", opacity: 0.5 }}>/</span>
            <span style={{ color: "#1F2937" }}>About</span>
          </div>
          
          <span style={{ display: "inline-block", fontSize: "0.8rem", letterSpacing: "3px", textTransform: "uppercase", color: "#C8A96B", fontWeight: "700", marginBottom: "8px" }}>
            Venus Care Story
          </span>
          <h1 style={{ fontFamily: "'Cinzel', 'Didot', 'Times New Roman', serif", fontSize: "2.5rem", fontWeight: "700", color: "#1F2937", margin: "0 0 10px 0", letterSpacing: "-0.5px", lineHeight: "1.2" }}>
            Crafted for Luxury Beauty
          </h1>
          <div style={{ width: "40px", height: "1px", background: "#C8A96B", margin: "14px auto" }} />
          <p style={{ fontSize: "0.95rem", color: "#6B7280", margin: "0 auto", lineHeight: "1.6", maxWidth: "600px" }}>
            Learn about our heritage of clean botanical formulations, organic ingredients, and modern skin science.
          </p>
        </div>
      </div>

      {/* Main Content */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "auto",
          padding: "60px 20px",
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit,minmax(320px,1fr))",
          gap: "50px",
          alignItems: "center",
        }}
      >
        {/* Image */}
        <div>
          <img
            src="https://images.unsplash.com/photo-1556228578-8c89e6adf883?q=80&w=1200&auto=format&fit=crop"
            alt="Venus Skincare"
            loading="lazy"
            style={{
              width: "85%",
              display: "block",
              margin: "0 auto",
              borderRadius: "20px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.05)",
            }}
          />
        </div>

        {/* Content */}
        <div>
          <span
            style={{
              color: "#C8A96B",
              fontWeight: "700",
              letterSpacing: "2px",
              fontSize: "0.8rem",
            }}
          >
            PREMIUM APOTHECARY BRAND
          </span>

          <h2
            style={{
              fontSize: "2.5rem",
              margin: "15px 0",
              color: "#1F2937",
              fontFamily: "'Cinzel', 'Didot', serif",
            }}
          >
            Pure Skincare Rituals
          </h2>

          <h3
            style={{
              color: "#C8A96B",
              marginBottom: "20px",
              fontSize: "1.2rem",
              fontWeight: "600",
            }}
          >
            Premium Acid-Free Botanicals
          </h3>

          <p
            style={{
              color: "#6B7280",
              lineHeight: "1.9",
              fontSize: "1.05rem",
            }}
          >
            At VENUS, we are committed to redefining skincare
            with premium acid-free formulations designed to
            nourish, protect, and enhance natural beauty.
            Every product is carefully crafted using
            skin-friendly ingredients that deliver effective
            results while maintaining purity and safety.
          </p>

          <p
            style={{
              color: "#6B7280",
              lineHeight: "1.9",
              marginTop: "15px",
            }}
          >
            Our goal is simple — to help everyone achieve
            healthy, radiant, and confident skin through
            trusted skincare solutions inspired by nature
            and backed by quality.
          </p>
        </div>
      </div>

      {/* Why Choose Venus */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto",
          padding: "20px",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            fontSize: "2.2rem",
            color: "#1F2937",
            marginBottom: "50px",
            fontFamily: "'Cinzel', 'Didot', serif",
          }}
        >
          Standards of Pure Care
        </h2>

        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(250px,1fr))",
            gap: "25px",
          }}
        >
          {features.map((item, index) => (
            <div
              key={index}
              style={{
                background: "#fff",
                padding: "30px",
                borderRadius: "16px",
                textAlign: "center",
                boxShadow: "0 5px 20px rgba(0,0,0,0.02)",
                border: "1px solid #E8DFD2",
                transition: "0.3s",
              }}
            >
              <div
                style={{
                  fontSize: "2rem",
                  color: "#C8A96B",
                  marginBottom: "15px",
                }}
              >
                {item.icon}
              </div>

              <h3
                style={{
                  marginBottom: "10px",
                  color: "#1F2937",
                }}
              >
                {item.title}
              </h3>

              <p
                style={{
                  color: "#6B7280",
                  lineHeight: "1.7",
                }}
              >
                {item.desc}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Statistics */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "100px auto",
          background: "#1F2937",
          borderRadius: "20px",
          padding: "50px 20px",
        }}
      >
        <div
          style={{
            display: "grid",
            gridTemplateColumns:
              "repeat(auto-fit,minmax(180px,1fr))",
            gap: "30px",
            textAlign: "center",
          }}
        >
          {stats.map((item, index) => (
            <div key={index}>
              <h2
                style={{
                  color: "#C8A96B",
                  fontSize: "2.5rem",
                  marginBottom: "10px",
                }}
              >
                {item.number}
              </h2>

              <p
                style={{
                  color: "#fff",
                }}
              >
                {item.label}
              </p>
            </div>
          ))}
        </div>
      </div>

      {/* Mission & Vision */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "auto",
          padding: "0 20px 100px 20px",
          display: "grid",
          gridTemplateColumns:
            "repeat(auto-fit,minmax(300px,1fr))",
          gap: "30px",
        }}
      >
        <div
          style={{
            background: "#fff",
            padding: "35px",
            borderRadius: "18px",
            boxShadow: "0 5px 20px rgba(0,0,0,0.02)",
            border: "1px solid #E8DFD2",
          }}
        >
          <h2
            style={{
              color: "#C8A96B",
              marginBottom: "15px",
              fontFamily: "'Cinzel', 'Didot', serif",
            }}
          >
            Our Mission
          </h2>

          <p
            style={{
              color: "#6B7280",
              lineHeight: "1.8",
            }}
          >
            To create premium skincare products that
            combine nature, science, and purity while
            helping people feel confident in their skin.
          </p>
        </div>

        <div
          style={{
            background: "#fff",
            padding: "35px",
            borderRadius: "18px",
            boxShadow: "0 5px 20px rgba(0,0,0,0.02)",
            border: "1px solid #E8DFD2",
          }}
        >
          <h2
            style={{
              color: "#C8A96B",
              marginBottom: "15px",
              fontFamily: "'Cinzel', 'Didot', serif",
            }}
          >
            Our Vision
          </h2>

          <p
            style={{
              color: "#6B7280",
              lineHeight: "1.8",
            }}
          >
            To become India's most trusted skincare
            brand by delivering safe, effective, and
            innovative beauty solutions for everyone.
          </p>
        </div>
      </div>

      {/* CTA Banner */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "0 auto 100px auto",
          background:
            "linear-gradient(135deg, #1F2937 0%, #111827 100%)",
          padding: "60px 30px",
          borderRadius: "20px",
          textAlign: "center",
          color: "#fff",
        }}
      >
        <h2
          style={{
            fontSize: "2.5rem",
            marginBottom: "15px",
            fontFamily: "'Cinzel', 'Didot', serif",
          }}
        >
          Healthy Skin Starts With Pure Ingredients
        </h2>

        <p
          style={{
            marginBottom: "25px",
            fontSize: "1.05rem",
            color: "#D1D5DB"
          }}
        >
          Discover our premium collection and experience
          skincare that truly cares.
        </p>

        <Link
          to="/shop"
          style={{
            background: "#C8A96B",
            color: "#fff",
            padding: "14px 30px",
            borderRadius: "50px",
            textDecoration: "none",
            fontWeight: "bold",
            transition: "0.3s",
            display: "inline-block"
          }}
        >
          Shop Collection
        </Link>
      </div>
    </div>
  );
};

export default About;
