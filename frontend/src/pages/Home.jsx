import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import axios from "axios";

import HeroSlider from "../components/HeroSlider";
import WhyVenus from "../components/WhyVenus";
import PromoSection from "../components/PromoSection";
import Testimonials from "../components/Testimonials";
import Gallery from "../components/Gallery";
import FeaturedLogos from "../components/FeaturedLogos";
import InstagramFeed from "../components/InstagramFeed";
import Newsletter from "../components/Newsletter";
import ProductCard from "../components/ProductCard";
import ProductCardSkeleton from "../components/ProductCardSkeleton";
import "../styles/home.css"

import "swiper/css";
import "swiper/css/navigation";

import api from "../lib/api";

const Home = () => {
  const [products, setProducts] = useState(() => {
    // Populate with last successful product list backup if less than 5 minutes old
    try {
      const cached = localStorage.getItem("venus_products_cache");
      const stamp = localStorage.getItem("venus_products_cache_time");
      if (cached && stamp && (Date.now() - Number(stamp) < 300000)) {
        return JSON.parse(cached);
      }
    } catch (e) {
      console.warn("Products local storage recovery failed:", e);
    }
    return [];
  });
  const [loading, setLoading] = useState(products.length === 0);
  const [error, setError] = useState("");

  const fetchProducts = async (signal) => {
    try {
      setLoading(true);
      setError("");

      const res = await api.get("/api/products", { signal });
      if (res.data && Array.isArray(res.data)) {
        setProducts(res.data);
        try {
          localStorage.setItem("venus_products_cache", JSON.stringify(res.data));
          localStorage.setItem("venus_products_cache_time", String(Date.now()));
        } catch (e) {
          console.warn("Saving products to local cache failed:", e);
        }
      }
    } catch (err) {
      if (axios.isCancel(err)) {
        console.log("Fetch products request aborted");
        return;
      }
      console.error(err);
      
      // If we already have cached backup products, keep them and do not render the error screen
      if (products && products.length > 0) {
        console.log("Product fetch failed; serving cached backup list");
      } else {
        setError("Unable to load products. Please try again.");
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const controller = new AbortController();
    fetchProducts(controller.signal);

    return () => {
      controller.abort();
    };
  }, []);

  const handleRetry = () => {
    const controller = new AbortController();
    fetchProducts(controller.signal);
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
              <ProductCardSkeleton key={index} />
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
