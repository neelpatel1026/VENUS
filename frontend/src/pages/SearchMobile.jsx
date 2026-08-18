import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";
import { FiArrowLeft, FiSearch, FiX, FiTrendingUp, FiChevronRight } from "react-icons/fi";
import { FaStar, FaShoppingBag } from "react-icons/fa";
import { addToCart } from "../redux/cartSlice";
import toast from "react-hot-toast";
import "../styles/searchMobile.css";

const SearchMobile = () => {
  const navigate = useNavigate();
  const dispatch = useDispatch();
  const searchInputRef = useRef(null);

  const [searchQuery, setSearchQuery] = useState("");
  const [allProducts, setAllProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [bestSellers, setBestSellers] = useState([]);
  const [loading, setLoading] = useState(false);

  // LocalStorage searches
  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("venus_recent_searches") || "[]");
    } catch (e) {
      return [];
    }
  });

  const popularCategories = ["Face Wash", "Serums", "Perfume", "Hair Care", "Gift Sets", "Lipstick", "Moisturizers"];
  const trendingSearches = [
    { title: "Vitamin C Face Wash", subtitle: "Popular Today" },
    { title: "Niacinamide Serum", subtitle: "Trending Now" },
    { title: "Sunscreen SPF 50", subtitle: "Highly Rated" },
    { title: "Lipstick Velvet Matte", subtitle: "Best Seller" },
    { title: "Hair Growth Oil", subtitle: "New Arrival" }
  ];

  // Cache object for search queries
  const searchCache = useRef({});

  // Focus search input on mount
  useEffect(() => {
    if (searchInputRef.current) {
      searchInputRef.current.focus();
    }
  }, []);

  // Fetch products from API on mount
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        if (Array.isArray(data)) {
          setAllProducts(data);
          // Set top bestsellers (rating >= 4.5 or top 5)
          const sorted = [...data]
            .sort((a, b) => (b.rating || 0) - (a.rating || 0))
            .slice(0, 5);
          setBestSellers(sorted);
        }
      } catch (err) {
        console.error("Failed to fetch products for search page:", err);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Debounced search logic with caching
  useEffect(() => {
    const query = searchQuery.trim().toLowerCase();
    if (query === "") {
      setFilteredProducts([]);
      return;
    }

    // Check cache
    if (searchCache.current[query]) {
      setFilteredProducts(searchCache.current[query]);
      return;
    }

    const timer = setTimeout(() => {
      const matches = allProducts.filter((p) => {
        return (
          p.name?.toLowerCase().includes(query) ||
          p.category?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
        );
      });
      // Store in cache
      searchCache.current[query] = matches;
      setFilteredProducts(matches);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery, allProducts]);

  // Handle click on category or trending search
  const handleTermSearchSubmit = (term) => {
    saveSearchTerm(term);
    navigate(`/shop?search=${encodeURIComponent(term)}`);
  };

  // Add search term to LocalStorage (limit to 8)
  const saveSearchTerm = (term) => {
    const cleanTerm = term.trim();
    if (!cleanTerm) return;
    const updated = [cleanTerm, ...recentSearches.filter((s) => s !== cleanTerm)].slice(0, 8);
    setRecentSearches(updated);
    localStorage.setItem("venus_recent_searches", JSON.stringify(updated));
  };

  // Form submit (keyboard Search key or tapping search icon)
  const handleFormSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      handleTermSearchSubmit(searchQuery);
    }
  };

  const removeRecentSearch = (e, term) => {
    e.stopPropagation();
    const updated = recentSearches.filter((s) => s !== term);
    setRecentSearches(updated);
    localStorage.setItem("venus_recent_searches", JSON.stringify(updated));
  };

  const clearAllRecent = () => {
    setRecentSearches([]);
    localStorage.removeItem("venus_recent_searches");
  };

  const handleAddToCart = (e, product) => {
    e.stopPropagation();
    dispatch(
      addToCart({
        productId: product._id,
        name: product.name,
        price: product.price,
        image: product.imageUrl || product.image,
        qty: 1,
        stock: product.stock || 10,
        category: product.category,
        originalPrice: product.originalPrice || product.price,
      })
    );
    toast.success(`${product.name} added to cart! 🛍️`, { product });
  };

  // Highlight matching text in search results
  const renderHighlightedText = (text, highlight) => {
    if (!highlight.trim()) return text;
    const regex = new RegExp(`(${highlight.replace(/[-\/\\^$*+?.()|[\]{}]/g, "\\$&")})`, "gi");
    const parts = text.split(regex);
    return parts.map((part, i) =>
      regex.test(part) ? (
        <mark key={i} className="highlighted-text-match">{part}</mark>
      ) : (
        part
      )
    );
  };

  return (
    <div className="mobile-search-page-wrapper font-outfit">
      {/* 1. PREMIUM STICKY TOP HEADER */}
      <header className="mobile-search-header-sticky">
        <button 
          className="search-header-back-arrow-btn" 
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <FiArrowLeft />
        </button>

        <form onSubmit={handleFormSubmit} className="search-bar-input-form-control">
          <input
            ref={searchInputRef}
            type="text"
            className="search-bar-inner-text-input"
            placeholder="Search premium skincare, perfumes..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          {searchQuery && (
            <button 
              type="button"
              className="search-bar-clear-text-btn"
              onClick={() => setSearchQuery("")}
              aria-label="Clear input text"
            >
              <FiX />
            </button>
          )}
        </form>
      </header>

      {/* 2. BODY CONTENT */}
      <main className="mobile-search-content-body-area">
        {searchQuery.trim() === "" ? (
          <>
            {/* 2.1 Recent Searches */}
            {recentSearches.length > 0 && (
              <section className="search-landing-section-block">
                <div className="section-title-line-row">
                  <h3>Recent Searches</h3>
                  <button className="clear-all-recent-searches-btn" onClick={clearAllRecent}>Clear All</button>
                </div>
                <div className="recent-searches-pill-stack">
                  {recentSearches.map((term, index) => (
                    <div key={index} className="recent-search-pill-card" onClick={() => handleTermSearchSubmit(term)}>
                      <span>{term}</span>
                      <button 
                        type="button" 
                        onClick={(e) => removeRecentSearch(e, term)}
                        className="delete-recent-item-btn"
                        aria-label="Delete recent search"
                      >
                        <FiX />
                      </button>
                    </div>
                  ))}
                </div>
              </section>
            )}

            {/* 2.2 Trending Searches */}
            <section className="search-landing-section-block">
              <div className="section-title-line-row">
                <h3>Trending Searches</h3>
              </div>
              <div className="trending-links-stack-list">
                {trendingSearches.map((term, index) => (
                  <div 
                    key={index} 
                    className="trending-link-row-item" 
                    onClick={() => handleTermSearchSubmit(term.title)}
                  >
                    <div className="trending-item-left">
                      <FiTrendingUp className="trend-arrow-up-icon" />
                      <div className="trending-text-col">
                        <span className="trending-title-span">{term.title}</span>
                        <span className="trending-subtitle-span">{term.subtitle}</span>
                      </div>
                    </div>
                    <FiChevronRight className="trending-chevron-icon" />
                  </div>
                ))}
              </div>
            </section>

            {/* 2.3 Popular Categories */}
            <section className="search-landing-section-block">
              <div className="section-title-line-row">
                <h3>Popular Categories</h3>
              </div>
              <div className="popular-categories-chips-grid">
                {popularCategories.map((cat, index) => (
                  <button 
                    key={index} 
                    type="button" 
                    className="category-badge-chip-item"
                    onClick={() => handleTermSearchSubmit(cat)}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </section>

            {/* 2.4 Recommended Products */}
            {bestSellers.length > 0 && (
              <section className="search-landing-section-block">
                <div className="section-title-line-row">
                  <h3>✨ Recommended Products</h3>
                </div>
                <div className="bestsellers-horizontal-scroll-row">
                  {bestSellers.map((prod) => {
                    const discount = prod.originalPrice && prod.originalPrice > prod.price
                      ? Math.round(((prod.originalPrice - prod.price) / prod.originalPrice) * 100)
                      : 0;

                    return (
                      <div 
                        key={prod._id} 
                        className="bestseller-mini-product-card"
                        onClick={() => navigate(`/product/${prod._id}`)}
                      >
                        <div className="mini-card-image-box">
                          <img 
                            src={prod.imageUrl || "/cosmetic_1.avif"} 
                            alt={prod.name}
                            loading="lazy"
                            onError={(e) => { e.target.src = "/cosmetic_1.avif"; }}
                          />
                          {discount > 0 && <span className="mini-card-discount-tag">-{discount}%</span>}
                        </div>
                        <div className="mini-card-details-box">
                          <span className="mini-product-category">{prod.category || "Skincare"}</span>
                          <h4 className="mini-product-name">{prod.name}</h4>
                          <div className="mini-product-price-and-rating">
                            <strong>₹{prod.price.toFixed(0)}</strong>
                            {prod.rating && (
                              <div className="mini-product-rating-badge">
                                <FaStar className="star-icon" />
                                <span>{prod.rating.toFixed(1)}</span>
                              </div>
                            )}
                          </div>
                          <button 
                            type="button"
                            className="mini-card-add-to-cart-btn"
                            onClick={(e) => handleAddToCart(e, prod)}
                          >
                            Add to Bag
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            )}
          </>
        ) : (
          /* 3. LIVE SEARCH RESULTS */
          <div className="live-search-results-viewport">
            {loading ? (
              <div className="live-results-products-list">
                {[...Array(6)].map((_, i) => (
                  <div key={i} className="live-result-item-row" style={{ borderBottom: "1px solid rgba(0,0,0,0.05)", padding: "12px", display: "flex", gap: "14px" }}>
                    <div className="shimmer-bg" style={{ width: "64px", height: "64px", borderRadius: "8px", flexShrink: 0 }} />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div className="shimmer-bg" style={{ height: "12px", width: "30%", borderRadius: "4px" }} />
                      <div className="shimmer-bg" style={{ height: "16px", width: "85%", borderRadius: "4px" }} />
                      <div className="shimmer-bg" style={{ height: "14px", width: "40%", borderRadius: "4px", marginTop: "auto" }} />
                    </div>
                  </div>
                ))}
              </div>
            ) : filteredProducts.length > 0 ? (
              <div className="live-results-products-list">
                {filteredProducts.map((p) => (
                  <div 
                    key={p._id} 
                    className="live-result-item-row"
                    onClick={() => navigate(`/product/${p._id}`)}
                  >
                    <img 
                      src={p.imageUrl || "/cosmetic_1.avif"} 
                      alt={p.name}
                      onError={(e) => { e.target.src = "/cosmetic_1.avif"; }}
                      className="live-result-thumb"
                    />
                    <div className="live-result-details">
                      <span className="live-result-category">{p.category || "Skincare"}</span>
                      <h4 className="live-result-title">{renderHighlightedText(p.name, searchQuery)}</h4>
                      <div className="live-result-footer">
                        <strong className="live-result-price">₹{p.price.toFixed(2)}</strong>
                        {p.rating && (
                          <div className="live-result-rating">
                            <FaStar className="star-icon" />
                            <span>{p.rating.toFixed(1)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="live-search-no-match-box">
                <div className="no-result-illustration">🔍</div>
                <p>No products match "{searchQuery}"</p>
                <small>Try checking your spelling or search for general ingredients like Niacinamide or Vitamin C.</small>
                <button 
                  type="button" 
                  className="btn-continue-shopping font-serif"
                  style={{ marginTop: "24px", display: "inline-block", padding: "12px 28px", background: "#C8A165", color: "#FFF", border: "none", borderRadius: "30px", cursor: "pointer", fontWeight: "600" }}
                  onClick={() => navigate("/shop")}
                >
                  Continue Shopping
                </button>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default SearchMobile;
