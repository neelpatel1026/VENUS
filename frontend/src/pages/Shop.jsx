import { useEffect, useState } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import ProductCard from '../components/ProductCard';
import { FiSearch } from 'react-icons/fi';
import '../styles/product.css';

const Shop = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();

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

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        setProducts(data);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  // Reset Filters
  const handleResetFilters = () => {
    setSearchQuery('');
    setSelectedCategory('All');
    setPriceRange('all');
    setSortBy('featured');
  };

  // Get dynamic categories list from current database products
  const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];

  // Filter & Sort Logic
  const filteredProducts = products
    .filter(p => {
      const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                            (p.category && p.category.toLowerCase().includes(searchQuery.toLowerCase()));
      const matchesCategory = selectedCategory === 'All' || p.category === selectedCategory;

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
      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '36px 20px 60px 20px' }}>
        
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
        <div className="shop-filter-toolbar">
          {/* Search Wrapper */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#FFFFFF', borderRadius: '10px', border: '1px solid rgba(0, 0, 0, 0.06)', padding: '8px 16px', flex: '1', minWidth: '260px' }}>
            <FiSearch style={{ color: '#9CA3AF', marginRight: '10px' }} />
            <input
              type="text"
              placeholder="Search products by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.95rem', width: '100%', color: '#1C1C1C' }}
            />
          </div>

          {/* Filters controls */}
          <div className="shop-filter-toolbar-controls" style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
            
            {/* Price Filter dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#666666' }}>Price:</span>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.06)', fontSize: '0.9rem', outline: 'none', background: '#FFFFFF', cursor: 'pointer', fontWeight: '500', color: '#1C1C1C' }}
              >
                <option value="all">All Prices</option>
                <option value="under-500">Under ₹500</option>
                <option value="500-1000">₹500 - ₹1000</option>
                <option value="over-1000">Over ₹1000</option>
              </select>
            </div>

            {/* Sort Options */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#666666' }}>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid rgba(0, 0, 0, 0.06)', fontSize: '0.9rem', outline: 'none', background: '#FFFFFF', cursor: 'pointer', fontWeight: '500', color: '#1C1C1C' }}
              >
                <option value="featured">Best Selling</option>
                <option value="price-asc">Price Low → High</option>
                <option value="price-desc">Price High → Low</option>
                <option value="rating-desc">Highest Rated</option>
              </select>
            </div>

            {/* Reset Filters button */}
            {(searchQuery || selectedCategory !== 'All' || priceRange !== 'all' || sortBy !== 'featured') && (
              <button
                onClick={handleResetFilters}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 14px',
                  borderRadius: '8px',
                  border: '1px solid rgba(0, 0, 0, 0.06)',
                  background: '#FFFFFF',
                  color: '#ef4444',
                  cursor: 'pointer',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  transition: 'all 0.2s ease'
                }}
              >
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: '4px' }}>
                  <path d="M2.15 2v6h6M21.85 22v-6h-6"/>
                  <path d="M22 11.5a10 10 0 1 0-1.9 5.5"/>
                </svg>
                Reset
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
                  border: '1px solid rgba(0, 0, 0, 0.06)', 
                  padding: '20px', 
                  height: '380px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '15px'
                }}
              >
                <div className="shimmer-bg" style={{ flex: '1', borderRadius: '14px' }}></div>
                <div className="shimmer-bg" style={{ height: '16px', width: '40%', borderRadius: '4px' }}></div>
                <div className="shimmer-bg" style={{ height: '24px', width: '80%', borderRadius: '4px' }}></div>
                <div className="shimmer-bg" style={{ height: '20px', width: '50%', borderRadius: '4px' }}></div>
                <div className="shimmer-bg" style={{ height: '40px', borderRadius: '8px' }}></div>
              </div>
            ))}
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