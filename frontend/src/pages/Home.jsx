import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

import HeroSlider from "../components/HeroSlider";
import WhyVenus from "../components/WhyVenus";
import AppPromo from "../components/AppPromo";
import Testimonials from "../components/Testimonials";
import ProductCard from "../components/ProductCard";
import "../styles/home.css"

import "swiper/css";
import "swiper/css/navigation";

const Home = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);

        const res = await fetch("/api/products");

        if (!res.ok) {
          throw new Error("Failed to fetch products");
        }

        const data = await res.json();

        setProducts(data);
      } catch (err) {
        console.error(err);
        setError("Unable to load products.");
      } finally {
        setLoading(false);
      }
    };

    fetchProducts();
  }, []);

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
          <p className="error-message">{error}</p>
        ) : (
          <div className="featured-products-grid">
            {products.slice(0, 8).map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        )}
      </section>

      <WhyVenus />

      <AppPromo />

      <Testimonials />
    </div>
  );
};

export default Home;
