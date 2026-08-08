import { useEffect, useState } from 'react';
import { Link, useSearchParams, useNavigate } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { FiSearch } from 'react-icons/fi';
import '../styles/product.css';
import api from '../utils/api';
import axios from 'axios';

const Shop = () => {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [searchParams] = useSearchParams();

  const handleBackClick = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate("/");
    }
  };

  // Filter & Sort States
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('All');
  const [priceRange, setPriceRange] = useState('all');
  const [sortBy, setSortBy] = useState('featured');

  useEffect(() => {
    const cat = searchParams.get('category');
    if (cat) {
      setSelectedCategory(cat);
    } else {
      setSelectedCategory('All');
    }
  }, [searchParams]);

  const fetchProducts = async (signal) => {
    try {
      setLoading(true);
      setErrorMsg('');
      const res = await api.get('/products', { signal });
      setProducts(res.data);
    } catch (error) {
      if (axios.isCancel(error)) {
        console.log("Fetch products request cancelled");
        return;
      }
      console.error(error);
      setErrorMsg('Unable to load products. Please try again.');
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

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setPriceRange('all');
    setSortBy('featured');
  };

  // Get dynamic categories list from current database products
  const categoriesMap = new Map();
  products.forEach(p => {
    if (p.category) {
      const key = p.category.trim().toLowerCase();
      if (!categoriesMap.has(key)) {
        categoriesMap.set(key, p.category.trim());
      }
    }
  });
  const categories = ['All', ...categoriesMap.values()];

  // Filter & Sort Logic
  const filteredProducts = products
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'All' || 
                              (p.category && p.category.trim().toLowerCase() === selectedCategory.trim().toLowerCase());

      let matchesPrice = true;
      if (priceRange === 'under-500') matchesPrice = p.price < 500;
      else if (priceRange === '500-1000') matchesPrice = p.price >= 500 && p.price <= 1000;
      else if (priceRange === 'over-1000') matchesPrice = p.price > 1000;

      return matchesSearch && matchesCategory && matchesPrice;
    })
    .sort((a, b) => {
      if (sortBy === 'price-asc') return a.price - b.price;
      if (sortBy === 'price-desc') return b.price - a.price;
      if (sortBy === 'rating-desc') return (b.rating || 0) - (a.rating || 0);
      return 0; // default featured
    });

  return (
    <div className="shop-page-wrapper route-fade-in" style={{ background: '#FFFFFF', minHeight: '100vh' }}>
      <div className="shop-container-inner">
        
        {/* BACK NAV ACTION */}
        <button 
          type="button" 
          onClick={handleBackClick}
          className="shop-back-nav-btn font-outfit"
        >
          ← Back
        </button>

        {/* MOBILE PROMOTIONAL OFFER BANNER */}
        <div className="shop-promo-banner-mobile">
          <div className="shop-promo-content">
            <div className="shop-promo-badge">Limited Time Offer</div>
            <h3 className="shop-promo-title">FLAT ₹200 OFF</h3>
            <p className="shop-promo-subtitle">On Orders Above ₹999 • Code: VENUS200</p>
            <button className="shop-promo-cta" onClick={() => setSelectedCategory("All")}>Shop Now</button>
          </div>
          <div className="shop-promo-decor">🌿</div>
        </div>

        {/* 2. DYNAMIC CATEGORY PILLS BAR */}
        <div className="category-scroll-relative-wrapper" style={{ marginBottom: '36px' }}>
          <div className="category-scroll-wrapper" style={{ marginBottom: '0px' }}>
            {categories.map((cat) => {
              const isActive = selectedCategory === cat;
              return (
                <button
                  key={cat}
                  onClick={() => setSelectedCategory(cat)}
                  className={`category-pill ${isActive ? 'active' : ''}`}
                  style={{ scrollSnapAlign: 'start', flexShrink: 0 }}
                >
                  {cat}
                </button>
              );
            })}
          </div>
        </div>

        {/* 3. STICKY FILTER TOOLBAR */}
        <div className="shop-filter-toolbar-luxury-container">
          {/* Row 1: Search Wrapper */}
          <div className="shop-search-wrapper-luxury">
            <FiSearch style={{ color: '#9CA3AF', marginRight: '10px' }} />
            <input
              type="text"
              placeholder="Search products by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="shop-search-input-luxury"
            />
          </div>

          {/* Row 2: Filters controls (Side-by-side dropdowns) */}
          <div className="shop-filters-row-luxury">
            
            {/* Price Filter dropdown */}
            <div className="shop-filter-select-wrapper">
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                className="shop-filter-select-element"
              >
                <option value="all">Price: All</option>
                <option value="under-500">Price: Under ₹500</option>
                <option value="500-1000">Price: ₹500-₹1000</option>
                <option value="over-1000">Price: Over ₹1000</option>
              </select>
            </div>

            {/* Sort Options */}
            <div className="shop-filter-select-wrapper">
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="shop-filter-select-element"
              >
                <option value="featured">Sort: Best Selling</option>
                <option value="price-asc">Sort: Price Low → High</option>
                <option value="price-desc">Sort: Price High → Low</option>
                <option value="rating-desc">Sort: Highest Rated</option>
              </select>
            </div>

            {/* Reset Filters button - inline icon-only if filters active */}
            {(searchQuery || selectedCategory !== 'All' || priceRange !== 'all' || sortBy !== 'featured') && (
              <button
                onClick={handleResetFilters}
                className="shop-filter-reset-btn-luxury"
                title="Reset Filters"
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M2.15 2v6h6M21.85 22v-6h-6"/>
                  <path d="M22 11.5a10 10 0 1 0-1.9 5.5"/>
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* 4. PRODUCT GRID OR SKELETONS */}
        {loading ? (
          <div className="product-grid">
            {[...Array(8)].map((_, idx) => (
              <div 
                key={idx} 
                style={{ 
                  background: '#FFFFFF', 
                  borderRadius: '20px', 
                  border: '1px solid rgba(0, 0, 0, 0.05)', 
                  padding: '16px', 
                  height: '380px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '12px'
                }}
              >
                {/* Product Image Skeleton */}
                <div className="shimmer-bg" style={{ flex: '1', borderRadius: '12px', minHeight: '180px' }}></div>
                
                {/* Product Category/Title Skeleton */}
                <div className="shimmer-bg" style={{ height: '14px', width: '35%', borderRadius: '4px' }}></div>
                <div className="shimmer-bg" style={{ height: '18px', width: '85%', borderRadius: '4px' }}></div>
                
                {/* Rating Placeholder stars */}
                <div style={{ display: 'flex', gap: '4px', margin: '2px 0' }}>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="shimmer-bg" style={{ width: '12px', height: '12px', borderRadius: '50%' }}></div>
                  ))}
                </div>
                
                {/* Price and Add button layout row */}
                <div style={{ display: 'flex', justifyContent: 'between', alignItems: 'center', marginTop: 'auto', gap: '10px' }}>
                  <div className="shimmer-bg" style={{ height: '20px', width: '30%', borderRadius: '4px' }}></div>
                  <div className="shimmer-bg" style={{ height: '36px', flex: '1', borderRadius: '8px' }}></div>
                </div>
              </div>
            ))}
          </div>
        ) : errorMsg ? (
          <div className="error-fallback-luxury" style={{ textAlign: "center", padding: "40px 20px", background: "#FFF8F8", border: "1px dashed #EF4444", borderRadius: "16px", maxWidth: "450px", margin: "40px auto" }}>
            <span style={{ fontSize: "28px" }}>⚠️</span>
            <h4 style={{ fontFamily: "Cinzel, serif", fontSize: "16px", margin: "12px 0 6px 0", color: "#1A1A1A" }}>Connection Delayed</h4>
            <p style={{ fontSize: "13px", color: "#6B7280", margin: "0 0 16px 0", lineHeight: "1.5" }}>{errorMsg}</p>
            <button 
              onClick={handleRetry} 
              style={{ padding: "10px 24px", background: "#C9A45C", color: "#FFFFFF", border: "none", borderRadius: "20px", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", cursor: "pointer", boxShadow: "0 4px 10px rgba(200, 161, 101, 0.2)" }}
            >
              Retry Loading
            </button>
          </div>
        ) : filteredProducts.length === 0 ? (
          
          /* 5. ELEGANT EMPTY STATE */
          <div 
            style={{ 
              textAlign: 'center', 
              padding: '60px 20px', 
              background: '#FFFFFF', 
              border: '1px solid rgba(0, 0, 0, 0.06)', 
              borderRadius: '24px',
              maxWidth: '500px',
              margin: '40px auto'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="#C9A45C" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '20px' }}>
              <rect x="18" y="24" width="28" height="32" rx="4" />
              <path d="M26 24v-6a6 6 0 0 1 12 0v6" />
              <line x1="18" y1="36" x2="46" y2="36" />
              <circle cx="32" cy="46" r="3" />
            </svg>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#1C1C1C', margin: '0 0 10px 0' }}>
              No Products Found
            </h3>
            <p style={{ color: '#666666', lineHeight: '1.6', margin: '0 0 24px 0', fontSize: '0.95rem' }}>
              We couldn't find any products matching your active filters. Try refining your search query, adjusting pricing limits, or selecting another category.
            </p>
            <button
              onClick={handleResetFilters}
              style={{
                background: '#C9A45C',
                color: '#FFFFFF',
                border: 'none',
                padding: '12px 28px',
                borderRadius: '30px',
                fontSize: '0.95rem',
                fontWeight: '600',
                cursor: 'pointer',
                transition: 'all 0.2s ease'
              }}
            >
              Clear All Filters
            </button>
          </div>
        ) : (
          <>
            {/* Count line */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px' }}>
              <span style={{ fontSize: '0.95rem', color: '#666666', fontWeight: '500' }}>
                Showing <strong>{filteredProducts.length}</strong> of {products.length} premium products
              </span>
            </div>
            
            {/* Products grid */}
            <div className="product-grid">
              {filteredProducts.map((product) => (
                <ProductCard key={product._id} product={product} />
              ))}
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default Shop;