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
    <div className="shop-page-wrapper" style={{ background: '#FCFBF9', minHeight: '100vh' }}>
      
      {/* 1. PREMIUM HEADER / COLLECTION BANNER */}
      <div 
        className="shop-header-banner" 
        style={{ 
          background: 'linear-gradient(to right, #FAF6F0, #F3ECE2)', 
          padding: '60px 20px', 
          textAlign: 'center',
          borderBottom: '1px solid #E8DFD2'
        }}
      >
        <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ fontSize: '0.85rem', letterSpacing: '1.5px', textTransform: 'uppercase', color: '#8B7355', marginBottom: '12px', fontWeight: '600' }}>
            <Link to="/" style={{ color: '#8B7355', textDecoration: 'none' }}>Home</Link>
            <span style={{ margin: '0 8px' }}>/</span>
            <span style={{ color: '#1F2937' }}>Shop</span>
          </div>
          <h1 style={{ fontSize: '3rem', fontWeight: '700', color: '#1F2937', margin: '0 0 12px 0', letterSpacing: '-0.5px' }}>
            The Premium Collection
          </h1>
          <p style={{ fontSize: '1.05rem', color: '#6B7280', margin: '0 auto 16px auto', lineHeight: '1.7', maxWidth: '600px' }}>
            Indulge in our curated range of luxury skincare, rare perfumes, and pure apothecary formulas designed for ultimate beauty results.
          </p>
          <span style={{ display: 'inline-block', background: '#FFFFFF', border: '1px solid #E8DFD2', padding: '6px 16px', borderRadius: '30px', fontSize: '0.85rem', fontWeight: '600', color: '#8B7355' }}>
            {products.length} Exquisite Products
          </span>
        </div>
      </div>

      <div style={{ maxWidth: '1280px', margin: '0 auto', padding: '40px 20px' }}>
        
        {/* 2. DYNAMIC CATEGORY PILLS BAR */}
        <div style={{ display: 'flex', justifyContent: 'center', flexWrap: 'wrap', gap: '10px', marginBottom: '35px' }}>
          {categories.map((cat) => {
            const isActive = selectedCategory === cat;
            return (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                style={{
                  padding: '10px 24px',
                  borderRadius: '30px',
                  fontSize: '0.9rem',
                  fontWeight: '600',
                  border: isActive ? 'none' : '1px solid #E8DFD2',
                  background: isActive ? '#C8A96B' : '#FFFFFF',
                  color: isActive ? '#FFFFFF' : '#1F2937',
                  cursor: 'pointer',
                  transition: 'all 0.3s cubic-bezier(0.16, 1, 0.3, 1)',
                  boxShadow: isActive ? '0 4px 14px rgba(200, 169, 107, 0.25)' : 'none'
                }}
              >
                {cat}
              </button>
            );
          })}
        </div>

        {/* 3. STICKY FILTER TOOLBAR */}
        <div 
          className="sticky-filter-toolbar" 
          style={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            justifyContent: 'space-between', 
            alignItems: 'center', 
            gap: '20px', 
            background: '#FFFFFF', 
            border: '1px solid #E8DFD2', 
            padding: '18px 24px', 
            borderRadius: '16px', 
            marginBottom: '40px',
            position: 'sticky',
            top: '80px',
            zIndex: '100',
            boxShadow: '0 4px 20px rgba(0, 0, 0, 0.02)'
          }}
        >
          {/* Search Wrapper */}
          <div style={{ display: 'flex', alignItems: 'center', background: '#FAF7F2', borderRadius: '10px', border: '1px solid #ECE6DC', padding: '8px 16px', flex: '1', minWidth: '260px' }}>
            <FiSearch style={{ color: '#9CA3AF', marginRight: '10px' }} />
            <input
              type="text"
              placeholder="Search products by name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              style={{ border: 'none', background: 'transparent', outline: 'none', fontSize: '0.95rem', width: '100%', color: '#1F2937' }}
            />
          </div>

          {/* Filters controls */}
          <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '16px' }}>
            
            {/* Price Filter dropdown */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#6B7280' }}>Price:</span>
              <select
                value={priceRange}
                onChange={(e) => setPriceRange(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #ECE6DC', fontSize: '0.9rem', outline: 'none', background: '#FFFFFF', cursor: 'pointer', fontWeight: '500', color: '#1F2937' }}
              >
                <option value="all">All Prices</option>
                <option value="under-500">Under ₹500</option>
                <option value="500-1000">₹500 - ₹1000</option>
                <option value="over-1000">Over ₹1000</option>
              </select>
            </div>

            {/* Sort Options */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '0.85rem', fontWeight: '600', color: '#6B7280' }}>Sort:</span>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                style={{ padding: '8px 14px', borderRadius: '8px', border: '1px solid #ECE6DC', fontSize: '0.9rem', outline: 'none', background: '#FFFFFF', cursor: 'pointer', fontWeight: '500', color: '#1F2937' }}
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
                  border: '1px solid #ECE6DC',
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
                  border: '1px solid #E8DFD2', 
                  padding: '20px', 
                  height: '380px',
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '15px'
                }}
              >
                <div style={{ flex: '1', background: '#FAF7F2', borderRadius: '14px', animation: 'pulse 1.5s infinite ease-in-out' }}></div>
                <div style={{ height: '16px', width: '40%', background: '#F3F4F6', borderRadius: '4px' }}></div>
                <div style={{ height: '24px', width: '80%', background: '#F3F4F6', borderRadius: '4px' }}></div>
                <div style={{ height: '20px', width: '50%', background: '#F3F4F6', borderRadius: '4px' }}></div>
                <div style={{ height: '40px', background: '#F3F4F6', borderRadius: '8px' }}></div>
              </div>
            ))}
            <style>{`
              @keyframes pulse {
                0% { opacity: 0.6; }
                50% { opacity: 1; }
                100% { opacity: 0.6; }
              }
            `}</style>
          </div>
        ) : filteredProducts.length === 0 ? (
          
          /* 5. ELEGANT EMPTY STATE */
          <div 
            style={{ 
              textAlign: 'center', 
              padding: '60px 20px', 
              background: '#FFFFFF', 
              border: '1px solid #E8DFD2', 
              borderRadius: '24px',
              maxWidth: '500px',
              margin: '40px auto'
            }}
          >
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64" fill="none" stroke="#C8A96B" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginBottom: '20px' }}>
              <rect x="18" y="24" width="28" height="32" rx="4" />
              <path d="M26 24v-6a6 6 0 0 1 12 0v6" />
              <line x1="18" y1="36" x2="46" y2="36" />
              <circle cx="32" cy="46" r="3" />
            </svg>
            <h3 style={{ fontSize: '1.4rem', fontWeight: '700', color: '#1F2937', margin: '0 0 10px 0' }}>
              No Products Found
            </h3>
            <p style={{ color: '#6B7280', lineHeight: '1.6', margin: '0 0 24px 0', fontSize: '0.95rem' }}>
              We couldn't find any products matching your active filters. Try refining your search query, adjusting pricing limits, or selecting another category.
            </p>
            <button
              onClick={handleResetFilters}
              style={{
                background: '#1F2937',
                color: '#FFFFFF',
                border: 'none',
                padding: '12px 28px',
                borderRadius: '10px',
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
              <span style={{ fontSize: '0.95rem', color: '#6B7280', fontWeight: '500' }}>
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