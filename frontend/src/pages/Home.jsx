import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import HeroSlider from "../components/HeroSlider";
import WhyVenus from "../components/WhyVenus";
import PromoSection from "../components/PromoSection";
import Testimonials from "../components/Testimonials";
import Gallery from "../components/Gallery";
import FeaturedLogos from "../components/FeaturedLogos";
import InstagramFeed from "../components/InstagramFeed";
import Newsletter from "../components/Newsletter";
import ProductCard from "../components/ProductCard";
import "../styles/home.css"

import "swiper/css";
import "swiper/css/navigation";

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const fetchProducts = async (signal) => {
    try {
      setLoading(true);
      setError("");

      const res = await fetch("/api/products", { signal });

      if (!res.ok) {
        throw new Error("Unable to fetch collections. Please try again.");
      }

      const data = await res.json();
      setProducts(data);
    } catch (err) {
      if (err.name === "AbortError") {
        console.log("Fetch products request aborted");
        return;
      }
      console.error(err);
      setError("Products loading timed out or service is unavailable.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10s request timeout safety

    fetchProducts(controller.signal).finally(() => clearTimeout(timeoutId));

    return () => {
      controller.abort();
      clearTimeout(timeoutId);
    };
  }, []);

  const handleRetry = () => {
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);
    fetchProducts(controller.signal).finally(() => clearTimeout(timeoutId));
  };

  return (
    <div className="home-container route-fade-in">
      {/* Hero Section */}
      <HeroSlider />

      {/* Categories chips horizontal scroll */}
      <section className="home-category-section">
        <div className="section-header" style={{ marginBottom: "28px" }}>
          <span className="section-tag">CATEGORIES</span>
          <h2 style={{ fontSize: "28px", marginTop: "8px" }}>Shop By Ritual</h2>
        </div>
        <div className="category-scroll-relative-wrapper">
          <div className="category-scroll-wrapper">
            <Link to="/shop?category=Face%20Care" className="category-chip-item">
              <span className="chip-icon">✨</span> Face Care
            </Link>
            <Link to="/shop?category=Fragrance" className="category-chip-item">
              <span className="chip-icon">🌸</span> Fragrance
            </Link>
            <Link to="/shop?category=Body%20Care" className="category-chip-item">
              <span className="chip-icon">🧴</span> Body Care
            </Link>
            <Link to="/shop?category=Serum" className="category-chip-item">
              <span className="chip-icon">💧</span> Serums
            </Link>
            <Link to="/shop?category=Gifting" className="category-chip-item">
              <span className="chip-icon">🎁</span> Gift Sets
            </Link>
          </div>
        </div>
      </section>

      {/* Featured Products */}
      <section className="featured-section">
        <div className="section-header">
          <span className="section-tag">BESTSELLERS</span>

          <h2>Featured Skincare Collection</h2>

          <p>
            Luxury skincare and beauty essentials crafted for modern lifestyles.
          </p>
        </div>

        {loading ? (
          <div className="featured-products-grid">
            {[...Array(4)].map((_, index) => (
              <div key={index} style={{ border: "1px solid #ECE7DF", background: "#FFFFFF", padding: "16px", borderRadius: "16px", height: "420px", display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className="shimmer-bg" style={{ flex: '1', borderRadius: '12px' }}></div>
                <div className="shimmer-bg skeleton-text-line" />
                <div className="shimmer-bg skeleton-text-line short" />
                <div className="shimmer-bg" style={{ height: "40px", borderRadius: "8px" }}></div>
              </div>
            ))}
          </div>
        ) : error ? (
          <div className="error-fallback-luxury" style={{ textAlign: "center", padding: "40px 20px", background: "#FFF8F8", border: "1px dashed #EF4444", borderRadius: "16px", maxWidth: "450px", margin: "0 auto" }}>
            <span style={{ fontSize: "28px" }}>⚠️</span>
            <h4 style={{ fontFamily: "Cinzel, serif", fontSize: "16px", margin: "12px 0 6px 0", color: "#1A1A1A" }}>Connection Delayed</h4>
            <p style={{ fontSize: "13px", color: "#6B7280", margin: "0 0 16px 0", lineHeight: "1.5" }}>{error}</p>
            <button 
              onClick={handleRetry} 
              style={{ padding: "10px 24px", background: "#C8A165", color: "#FFFFFF", border: "none", borderRadius: "20px", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", cursor: "pointer", boxShadow: "0 4px 10px rgba(200, 161, 101, 0.2)" }}
            >
              Retry Loading
            </button>
          </div>
        ) : products.length === 0 ? (
          <div className="empty-fallback-luxury" style={{ textAlign: "center", padding: "40px 20px", background: "#FAF9F6", border: "1px dashed #E8DFD2", borderRadius: "16px", maxWidth: "450px", margin: "0 auto", color: "#6B7280" }}>
            <span style={{ fontSize: "28px" }}>✨</span>
            <h4 style={{ fontFamily: "Cinzel, serif", fontSize: "16px", margin: "12px 0 6px 0", color: "#1A1A1A" }}>Products Coming Soon</h4>
            <p style={{ fontSize: "13px", color: "#6B7280", margin: 0 }}>We are currently updating our luxury skincare catalog. Please check back shortly!</p>
          </div>
        ) : (
          <div className="featured-products-grid">
            {products.slice(0, 8).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      <WhyVenus />

      <PromoSection />

      <Testimonials />

      <Gallery />

      <FeaturedLogos />

      <InstagramFeed />

      <Newsletter />
    </div>
  );
};

export default Home;
