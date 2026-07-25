import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft, FiSearch, FiX, FiTrendingUp, FiTrash2 } from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import "../styles/searchMobile.css";

const SearchMobile = () => {
  const navigate = useNavigate();
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
  const trendingSearches = ["Vitamin C Face Wash", "Niacinamide Serum", "Sunscreen", "Lipstick", "Hair Care"];

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
    <div className="mobile-search-page-wrapper">
      {/* 1. STICKY TOP HEADER */}
      <header className="mobile-search-header-sticky">
        <button 
          className="search-header-back-arrow-btn" 
          onClick={() => navigate(-1)}
          aria-label="Go back"
        >
          <FiArrowLeft />
        </button>

        <form onSubmit={handleFormSubmit} className="search-bar-input-form-control">
          <FiSearch className="search-bar-left-icon" />
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
                  <div key={index} className="trending-link-row-item" onClick={() => handleTermSearchSubmit(term)}>
                    <FiTrendingUp className="trend-arrow-up-icon" />
                    <span>{term}</span>
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

            {/* 2.4 Best Sellers */}
            {bestSellers.length > 0 && (
              <section className="search-landing-section-block">
                <div className="section-title-line-row">
                  <h3>Best Sellers</h3>
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
            {filteredProducts.length > 0 ? (
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
                <p>No products match "{searchQuery}"</p>
                <small>Try checking your spelling or search for general ingredients like Niacinamide or Vitamin C.</small>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
};

export default SearchMobile;
