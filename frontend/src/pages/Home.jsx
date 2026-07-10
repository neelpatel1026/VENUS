import { useEffect, useState } from "react";

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
    <div className="home-container">
      {/* Hero Section */}
      <HeroSlider />

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
          <div className="product-loader">
            {[...Array(4)].map((_, index) => (
              <div key={index} className="skeleton-card"></div>
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
