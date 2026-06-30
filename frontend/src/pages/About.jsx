// import React from "react";

// const About = () => {
//   const containerStyle = {
//     maxWidth: "900px",
//     margin: "0 auto",
//     padding: "40px",
//     background: "#18181b",
//     borderRadius: "16px",
//     border: "1px solid rgba(255, 255, 255, 0.05)",
//     boxShadow: "0 10px 40px rgba(0,0,0,0.5)",
//     textAlign: "center",
//   };

//   const socialBtnStyle = {
//     display: "inline-block",
//     margin: "10px",
//     padding: "10px 20px",
//     background: "#27272a",
//     color: "#fff",
//     borderRadius: "8px",
//     textDecoration: "none",
//     transition: "all 0.3s ease",
//     border: "1px solid rgba(255, 255, 255, 0.1)",
//   };

//   return (
//     <div style={containerStyle}>
//       <img
//         // src="/dp.jpg"
//         src="https://d1csarkz8obe9u.cloudfront.net/posterpreviews/bird-logo-small-bird-logo-design-template-c4348de128885c179590981155618672_screen.jpg?ts=1677414261"
//         alt="@ELYSORIA"
//         style={{
//           width: "180px",
//           height: "180px",
//           borderRadius: "50%",
//           objectFit: "cover",
//           border: "4px solid #f97316",
//           marginBottom: "20px",
//           boxShadow: "0 4px 20px rgba(249, 115, 22, 0.4)",
//         }}
//       />
//       <h2 style={{ fontSize: "2.5rem", marginBottom: "10px", color: "#fff" }}>
//         About VENUS
//       </h2>
//       <h3
//         style={{ fontSize: "1.5rem", color: "#f97316", marginBottom: "15px" }}
//       >
//         VENUS Premium Acid-Free Skincare
//       </h3>

//       {/* <p style={{ color: '#a1a1aa', fontSize: '1.2rem', lineHeight: '1.8', maxWidth: '600px', margin: '0 auto 30px auto' }}>
//         <strong>Join the community and grow together!</strong> Welcome to my platform where we build, deploy, and scale highly engineered systems.
//       </p> */}
//       <p
//         style={{
//           color: "#a1a1aa",
//           fontSize: "1.2rem",
//           lineHeight: "1.8",
//           maxWidth: "600px",
//           margin: "0 auto 30px auto",
//         }}
//       >
//         <strong>Reveal Your Natural Beauty with VENUS.</strong> We are dedicated
//         to creating premium 100% acid-free skincare products that care for your
//         skin gently while delivering effective results. Because healthy, glowing
//         skin begins with pure ingredients.
//       </p>
//       <div
//         style={{
//           display: "flex",
//           flexWrap: "wrap",
//           justifyContent: "center",
//           gap: "10px",
//           marginTop: "20px",
//         }}
//       >
//         {/* <a href="https://instagram.com/patelneel1026" target="_blank" rel="noreferrer" style={{ ...socialBtnStyle, background: 'rgba(236, 72, 153, 0.2)', borderColor: '#ec4899', color: '#ec4899' }}>📸 Instagram</a> */}
//         <a
//           href="https://www.instagram.com/patelneel1026/"
//           target="_blank"
//           rel="noopener noreferrer"
//           style={{
//             ...socialBtnStyle,
//             background: "rgba(236, 72, 153, 0.2)",
//             borderColor: "#ec4899",
//             color: "#ec4899",
//           }}
//         >
//           📸 Instagram{" "}
//         </a>
//         <a
//           href="https://www.linkedin.com/in/neel-patel-628434285/"
//           target="_blank"
//           rel="noopener noreferrer"
//           style={{
//             ...socialBtnStyle,
//             background: "rgba(59, 130, 246, 0.2)",
//             borderColor: "#3b82f6",
//             color: "#3b82f6",
//           }}
//         >
//           💼 LinkedIn
//         </a>
//         <a
//           href="https://x.com/patelneel1026"
//           target="_blank"
//           rel="noreferrer"
//           style={socialBtnStyle}
//         >
//           ✖️ X (Twitter)
//         </a>
//         <a
//           href="https://wa.me/919672681026"
//           target="_blank"
//           rel="noopener noreferrer"
//           style={{
//             ...socialBtnStyle,
//             background: "rgba(34, 197, 94, 0.2)",
//             borderColor: "#22c55e",
//             color: "#22c55e",
//           }}
//         >
//           💬 WhatsApp
//         </a>
//       </div>
//     </div>
//   );
// };

// export default About;

import React from "react";
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
    <div
      style={{
        background: "#fafafa",
        minHeight: "100vh",
        padding: "60px 20px",
      }}
    >
      {/* Hero Section */}
      <div
        style={{
          maxWidth: "1200px",
          margin: "auto",
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
            style={{
              width: "100%",
              borderRadius: "20px",
              boxShadow: "0 10px 30px rgba(0,0,0,0.1)",
            }}
          />
        </div>

        {/* Content */}
        <div>
          <span
            style={{
              color: "#f97316",
              fontWeight: "600",
              letterSpacing: "1px",
            }}
          >
            PREMIUM SKINCARE BRAND
          </span>

          <h1
            style={{
              fontSize: "3rem",
              margin: "15px 0",
              color: "#18181b",
            }}
          >
            About VENUS
          </h1>

          <h3
            style={{
              color: "#f97316",
              marginBottom: "20px",
            }}
          >
            Premium Acid-Free Skincare
          </h3>

          <p
            style={{
              color: "#525252",
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
              color: "#525252",
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
          margin: "100px auto 0",
        }}
      >
        <h2
          style={{
            textAlign: "center",
            fontSize: "2.2rem",
            color: "#18181b",
            marginBottom: "50px",
          }}
        >
          Why Choose VENUS?
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
                boxShadow: "0 5px 20px rgba(0,0,0,0.08)",
                transition: "0.3s",
              }}
            >
              <div
                style={{
                  fontSize: "2rem",
                  color: "#f97316",
                  marginBottom: "15px",
                }}
              >
                {item.icon}
              </div>

              <h3
                style={{
                  marginBottom: "10px",
                  color: "#18181b",
                }}
              >
                {item.title}
              </h3>

              <p
                style={{
                  color: "#525252",
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
          background: "#18181b",
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
                  color: "#f97316",
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
            boxShadow: "0 5px 20px rgba(0,0,0,0.08)",
          }}
        >
          <h2
            style={{
              color: "#f97316",
              marginBottom: "15px",
            }}
          >
            Our Mission
          </h2>

          <p
            style={{
              color: "#525252",
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
            boxShadow: "0 5px 20px rgba(0,0,0,0.08)",
          }}
        >
          <h2
            style={{
              color: "#f97316",
              marginBottom: "15px",
            }}
          >
            Our Vision
          </h2>

          <p
            style={{
              color: "#525252",
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
          margin: "100px auto 0",
          background:
            "linear-gradient(135deg,#f97316,#ea580c)",
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
          }}
        >
          Healthy Skin Starts With Pure Ingredients
        </h2>

        <p
          style={{
            marginBottom: "25px",
            fontSize: "1.05rem",
          }}
        >
          Discover our premium collection and experience
          skincare that truly cares.
        </p>

        <Link
          to="/shop"
          style={{
            background: "#fff",
            color: "#f97316",
            padding: "14px 30px",
            borderRadius: "50px",
            textDecoration: "none",
            fontWeight: "bold",
          }}
        >
          Shop Collection
        </Link>
      </div>
    </div>
  );
};

export default About;
