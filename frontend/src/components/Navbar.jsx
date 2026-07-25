import { useContext, useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useSelector, useDispatch } from "react-redux";
import { HiMenu, HiX } from "react-icons/hi";
import { FiSearch, FiShoppingBag, FiUser, FiLayers, FiLogOut, FiMapPin, FiX, FiTrash2, FiTrendingUp } from "react-icons/fi";
import { FaStar } from "react-icons/fa";
import { clearCart } from "../redux/cartSlice";
import "../styles/navbar.css";
import toast from "react-hot-toast";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const cartItems = useSelector((state) => state.cart.cartItems);
  const navigate = useNavigate();
  const location = useLocation();
  const dispatch = useDispatch();

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Profile Dropdown state & Refs
  const [profileOpen, setProfileOpen] = useState(false);
  const dropdownRef = useRef(null);
  const triggerRef = useRef(null);
  const dropdownListRef = useRef(null);

  // Search overlay state
  const [searchQuery, setSearchQuery] = useState("");
  const [allProducts, setAllProducts] = useState([]);
  const [suggestions, setSuggestions] = useState([]);
  const [showSearchOverlay, setShowSearchOverlay] = useState(false);
  const searchInputRef = useRef(null);

  const [recentSearches, setRecentSearches] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem("venus_recent_searches") || "[]");
    } catch (e) {
      return [];
    }
  });

  const [recentlyViewed, setRecentlyViewed] = useState([]);

  useEffect(() => {
    if (showSearchOverlay) {
      try {
        const viewed = JSON.parse(localStorage.getItem("venus_recently_viewed") || "[]");
        setRecentlyViewed(viewed);
      } catch (e) {
        setRecentlyViewed([]);
      }
      try {
        const searches = JSON.parse(localStorage.getItem("venus_recent_searches") || "[]");
        setRecentSearches(searches);
      } catch (e) {
        setRecentSearches([]);
      }
    }
  }, [showSearchOverlay]);

  const popularCategories = ["Face Wash", "Serums", "Moisturizers", "Sunscreen", "Perfume", "Hair Care", "Gift Sets", "Lipstick"];
  const trendingSearches = ["Vitamin C Face Wash", "Niacinamide Serum", "Sunscreen", "Lipstick", "Hair Care"];

  const handleSearchTermClick = (term) => {
    setSearchQuery(term);
    const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 5);
    setRecentSearches(updated);
    localStorage.setItem("venus_recent_searches", JSON.stringify(updated));
    setShowSearchOverlay(false);
    navigate(`/shop?search=${encodeURIComponent(term)}`);
  };

  const removeRecentSearch = (e, term) => {
    e.stopPropagation();
    const updated = recentSearches.filter((s) => s !== term);
    setRecentSearches(updated);
    localStorage.setItem("venus_recent_searches", JSON.stringify(updated));
  };

  const clearAllRecentSearches = () => {
    setRecentSearches([]);
    localStorage.removeItem("venus_recent_searches");
  };

  // Cart animation trigger
  const [cartBounce, setCartBounce] = useState(false);

  // Lock scroll on mobile menu OR search overlay open
  useEffect(() => {
    if (menuOpen || showSearchOverlay) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [menuOpen, showSearchOverlay]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 40);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  useEffect(() => {
    if (cartItems.length > 0) {
      setCartBounce(true);
      const timer = setTimeout(() => setCartBounce(false), 500);
      return () => clearTimeout(timer);
    }
  }, [cartItems.length]);

  // Fetch products for real-time search suggestions
  useEffect(() => {
    const fetchSearchData = async () => {
      try {
        const res = await fetch("/api/products");
        const data = await res.json();
        if (Array.isArray(data)) {
          setAllProducts(data);
        }
      } catch (err) {
        console.error("Failed to load products for search suggestions:", err);
      }
    };
    fetchSearchData();
  }, []);

  // Update instant search suggestions dynamically (debounced by 300ms)
  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSuggestions([]);
      return;
    }
    const delayDebounce = setTimeout(() => {
      const query = searchQuery.toLowerCase();
      const filtered = allProducts.filter(
        (p) =>
          p.name?.toLowerCase().includes(query) ||
          p.category?.toLowerCase().includes(query) ||
          p.description?.toLowerCase().includes(query)
      );
      setSuggestions(filtered.slice(0, 5)); // Limit to top 5 suggestions
    }, 300);

    return () => clearTimeout(delayDebounce);
  }, [searchQuery, allProducts]);

  // Close dropdown on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        dropdownRef.current && 
        !dropdownRef.current.contains(event.target) &&
        triggerRef.current &&
        !triggerRef.current.contains(event.target)
      ) {
        setProfileOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  // Close dropdown on Escape key
  useEffect(() => {
    const handleKeyDownGlobal = (event) => {
      if (event.key === "Escape") {
        setProfileOpen(false);
        setShowSearchOverlay(false);
        triggerRef.current?.focus();
      }
    };
    document.addEventListener("keydown", handleKeyDownGlobal);
    return () => {
      document.removeEventListener("keydown", handleKeyDownGlobal);
    };
  }, []);

  const handleProfileToggle = (e) => {
    e.stopPropagation();
    setProfileOpen(!profileOpen);
  };

  const handleLogoutClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    logout();
    setProfileOpen(false);
    navigate("/login");
    toast.success("Logged out successfully");
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      const term = searchQuery.trim();
      const updated = [term, ...recentSearches.filter((s) => s !== term)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem("venus_recent_searches", JSON.stringify(updated));
      navigate(`/shop?search=${encodeURIComponent(term)}`);
      setSearchQuery("");
      setShowSearchOverlay(false);
    }
  };

  const handleSuggestionClick = (prodId) => {
    setSearchQuery("");
    setShowSearchOverlay(false);
    navigate(`/product/${prodId}`);
  };

  return (
    <>
      <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
        
        {/* Logo left */}
        <div className="navbar-left">
          <div className="navbar-brand centered-logo">
            <Link to="/" onClick={() => setMenuOpen(false)} style={{ display: "flex", alignItems: "center", textDecoration: "none", height: "34px" }}>
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 50" width="100%" height="100%">
                <path d="M25,12 C28,15 32,15 35,12 C35,22 25,38 25,38 C25,38 15,22 15,12 C18,15 22,15 25,12 Z" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                <path d="M25,18 C27,20 30,20 32,18 C32,25 25,35 25,35 C25,35 18,25 18,18 C20,20 23,20 25,18 Z" fill="none" stroke="currentColor" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
                <circle cx="25" cy="12" r="1.5" fill="currentColor"/>
                <text x="48" y="30" fontFamily="'Cinzel', 'Didot', 'Bodoni MT', 'Times New Roman', serif" fontSize="16.5" fontWeight="700" letterSpacing="4.5" fill="currentColor">VENUS</text>
                <text x="124" y="30" fontFamily="'Cinzel', 'Didot', 'Bodoni MT', 'Times New Roman', serif" fontSize="16.5" fontWeight="400" letterSpacing="4.5" fill="currentColor">CARE</text>
              </svg>
            </Link>
          </div>
        </div>

        {/* Center menu links (desktop only) */}
        <div className="navbar-center">
          <ul className="nav-menu-links">
            <li>
              <Link className="nav-link-item" to="/">Home</Link>
            </li>
            <li>
              <Link className="nav-link-item" to="/shop">Shop</Link>
            </li>
            <li>
              <Link className="nav-link-item" to="/gifting">Gifting</Link>
            </li>
            <li>
              <Link className="nav-link-item" to="/about">About</Link>
            </li>
            <li>
              <Link className="nav-link-item" to="/contact">Contact</Link>
            </li>
          </ul>
        </div>

        {/* Actions right */}
        <div className="navbar-right">
          <div className="nav-actions-right">
            
            {/* Outlined Search Bar (Desktop only) */}
            <div className="nav-search-outline desktop-only-search">
              <FiSearch className="nav-search-icon" />
              <form onSubmit={handleSearchSubmit} className="nav-search-form">
                <input
                  type="text"
                  className="nav-search-input"
                  placeholder="Search..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                />
              </form>
            </div>

            {/* Mobile-only Search Button */}
            <button 
              className="nav-icon-btn mobile-only-search-btn" 
              onClick={() => navigate("/search")}
              aria-label="Open search"
            >
              <FiSearch className="nav-icon" />
            </button>

            {/* Profile Dropdown */}
            <div className="profile-dropdown-container">
              {user ? (
                <>
                  <button 
                    ref={triggerRef}
                    onClick={handleProfileToggle}
                    className={`nav-icon-btn ${profileOpen ? "active" : ""}`}
                    aria-haspopup="true"
                    aria-expanded={profileOpen}
                    aria-label="User Account Menu"
                  >
                    <FiUser className="nav-icon" />
                  </button>

                  <div 
                    ref={dropdownRef}
                    className={`profile-dropdown ${profileOpen ? "open" : ""}`}
                  >
                    <div className="dropdown-user-header">
                      <div className="dropdown-avatar">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="dropdown-user-info">
                        <h4>{user.name}</h4>
                        <p>{user.email}</p>
                      </div>
                    </div>
                    <hr className="dropdown-divider" />
                    
                    <div ref={dropdownListRef} className="dropdown-menu-list">
                      <Link 
                        to="/profile" 
                        className={`dropdown-item ${location.pathname === "/profile" ? "active" : ""}`}
                        onClick={() => setProfileOpen(false)}
                      >
                        <FiUser className="dropdown-icon" />
                        <span>My Profile</span>
                      </Link>
                      
                      <Link 
                        to="/my-addresses" 
                        className={`dropdown-item ${location.pathname === "/my-addresses" ? "active" : ""}`}
                        onClick={() => setProfileOpen(false)}
                      >
                        <FiMapPin className="dropdown-icon" />
                        <span>My Addresses</span>
                      </Link>
                      
                      {user.role === "admin" && (
                        <Link 
                          to="/admin" 
                          className={`dropdown-item admin-link ${location.pathname === "/admin" ? "active" : ""}`}
                          onClick={() => setProfileOpen(false)}
                        >
                          <FiLayers className="dropdown-icon" />
                          <span>Admin Panel</span>
                        </Link>
                      )}
                      
                      <hr className="dropdown-divider" />
                      <button onClick={handleLogoutClick} className="dropdown-item logout-btn">
                        <FiLogOut className="dropdown-icon" style={{ color: "#ef4444" }} />
                        <span style={{ color: "#ef4444" }}>Logout</span>
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <Link to="/login" className="nav-icon-btn" aria-label="Account login">
                  <FiUser className="nav-icon" />
                </Link>
              )}
            </div>

            {/* Shopping Bag / Cart */}
            {user?.role !== "admin" && (
              <Link to="/cart" className="nav-icon-btn cart-icon-wrapper" aria-label="Open shopping bag">
                <FiShoppingBag className="nav-icon" />
                {cartItems.length > 0 && (
                  <span className={`cart-badge ${cartBounce ? "bounce" : ""}`}>
                    {cartItems.length}
                  </span>
                )}
              </Link>
            )}

            {/* Mobile Hamburger menu toggle */}
            <button
              className="menu-toggle-btn"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label={menuOpen ? "Close menu" : "Open menu"}
            >
              {menuOpen ? <HiX className="menu-toggle-icon" /> : <HiMenu className="menu-toggle-icon" />}
            </button>

          </div>
        </div>

        {/* MOBILE DRAWER (Slides smoothly from left) */}
        <div className={`mobile-menu-overlay ${menuOpen ? "active" : ""}`}>
          <div className="mobile-menu-drawer">
            <div className="drawer-header">
              <h3>Navigation</h3>
              <button className="drawer-close-btn" onClick={() => setMenuOpen(false)}>
                <HiX />
              </button>
            </div>
            
            <ul className="mobile-menu-links">
              <li><Link to="/" onClick={() => setMenuOpen(false)}>Home</Link></li>
              <li><Link to="/shop" onClick={() => setMenuOpen(false)}>Shop</Link></li>
              <li><Link to="/gifting" onClick={() => setMenuOpen(false)}>Gifting</Link></li>
              <li><Link to="/about" onClick={() => setMenuOpen(false)}>About</Link></li>
              <li><Link to="/contact" onClick={() => setMenuOpen(false)}>Contact</Link></li>
              
              <li className="mobile-menu-divider" />
              
              <li className="mobile-only-profile">
                {user ? (
                  <div className="mobile-profile-options">
                    <div className="drawer-user-info">
                      <span className="user-name">Hi, {user.name}</span>
                      <span className="user-email">{user.email}</span>
                    </div>
                    <Link to="/profile" onClick={() => setMenuOpen(false)}>My Profile</Link>
                    <Link to="/my-addresses" onClick={() => setMenuOpen(false)}>My Addresses</Link>
                    {user.role === "admin" && (
                      <Link to="/admin" onClick={() => setMenuOpen(false)} style={{ color: "#C8A165", fontWeight: "600" }}>
                        Admin Panel
                      </Link>
                    )}
                    <button onClick={handleLogoutClick} className="btn-logout-mobile">Logout</button>
                  </div>
                ) : (
                  <Link to="/login" onClick={() => setMenuOpen(false)} className="mobile-login-btn">
                    Account Login
                  </Link>
                )}
              </li>
            </ul>
          </div>
        </div>

      </nav>

      {/* FULLSCREEN SEARCH OVERLAY (Mobile/Tablet only) */}
      {showSearchOverlay && (
        <div className="mobile-search-overlay-container">
          <div className="search-overlay-header">
            <form onSubmit={handleSearchSubmit} className="overlay-search-input-wrapper">
              <FiSearch className="overlay-search-icon" />
              <input
                ref={searchInputRef}
                type="text"
                autoFocus
                className="overlay-search-input"
                placeholder="Search premium skincare, lipsticks, fragrances..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </form>
            <button className="overlay-close-btn" onClick={() => setShowSearchOverlay(false)} aria-label="Close search">
              <FiX />
            </button>
          </div>

          <div className="search-overlay-content">
            {suggestions.length > 0 ? (
              <div className="search-suggestions-list">
                <h4 className="suggestions-title">Suggested Products</h4>
                {suggestions.map((p) => (
                  <div 
                    key={p._id} 
                    className="suggestion-item-row"
                    onClick={() => handleSuggestionClick(p._id)}
                  >
                    <img 
                      src={p.imageUrl || "/cosmetic_1.avif"} 
                      alt={p.name} 
                      onError={(e) => { e.target.src = "/cosmetic_1.avif"; }}
                      className="suggestion-item-thumb"
                    />
                    <div className="suggestion-item-info">
                      <span className="suggestion-item-name">{p.name}</span>
                      <span className="suggestion-item-price">₹{p.price.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : searchQuery.trim() !== "" ? (
              <div className="search-no-suggestions">
                <h3>No matching products found</h3>
                <p>We couldn't find anything matching "{searchQuery}".</p>
                <div className="search-suggestions-tips">
                  <h5>Search Tips</h5>
                  <ul>
                    <li>Check spelling or try different keywords</li>
                     <li>Search for general categories like "Serums" or "Moisturizers"</li>
                     <li>Click the close button to browse all products</li>
                  </ul>
                </div>
              </div>
            ) : (
              <>
                {/* 1. Recent Searches */}
                {recentSearches.length > 0 && (
                  <div className="search-section">
                    <div className="search-section-header">
                      <h4 className="search-section-title">Recent Searches</h4>
                      <button className="recent-search-clear-all" onClick={clearAllRecentSearches}>Clear All</button>
                    </div>
                    <div className="recent-searches-list">
                      {recentSearches.map((term, index) => (
                        <div key={index} className="recent-search-row" onClick={() => handleSearchTermClick(term)}>
                          <span>{term}</span>
                          <button className="recent-search-delete-btn" onClick={(e) => removeRecentSearch(e, term)}>
                            <FiX />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* 2. Trending Searches */}
                <div className="search-section">
                  <div className="search-section-header">
                    <h4 className="search-section-title">Trending Searches</h4>
                  </div>
                  <div className="trending-links-list">
                    {trendingSearches.map((term, index) => (
                      <div key={index} className="trending-link-item" onClick={() => handleSearchTermClick(term)}>
                        <FiTrendingUp style={{ color: "#C8A165" }} />
                        <span>{term}</span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* 3. Popular Categories */}
                <div className="search-section">
                  <div className="search-section-header">
                    <h4 className="search-section-title">Popular Categories</h4>
                  </div>
                  <div className="search-pills-grid">
                    {popularCategories.map((cat, index) => (
                      <span key={index} className="search-pill-tag" onClick={() => handleSearchTermClick(cat)}>
                        {cat}
                      </span>
                    ))}
                  </div>
                </div>

                {/* 4. Recently Viewed Products */}
                {recentlyViewed.length > 0 && (
                  <div className="search-section">
                    <div className="search-section-header">
                      <h4 className="search-section-title">Recently Viewed</h4>
                    </div>
                    <div className="recently-viewed-grid">
                      {recentlyViewed.map((p) => (
                        <Link key={p._id} to={`/product/${p._id}`} className="mini-product-card" onClick={() => setShowSearchOverlay(false)}>
                          <img 
                            src={p.imageUrl || p.image || "/cosmetic_1.avif"} 
                            alt={p.name} 
                            onError={(e) => { e.target.src = "/cosmetic_1.avif"; }}
                            className="mini-product-thumb"
                          />
                          <div className="mini-product-details">
                            <span className="mini-product-name">{p.name}</span>
                            <span className="mini-product-price">₹{p.price.toFixed(2)}</span>
                            <div className="mini-product-rating">
                              <FaStar /> <span>{p.rating || "4.8"}</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}

                {/* 5. Best Sellers */}
                {allProducts.length > 0 && (
                  <div className="search-section">
                    <div className="search-section-header">
                      <h4 className="search-section-title">Best Sellers</h4>
                    </div>
                    <div className="recently-viewed-grid">
                      {allProducts.slice(0, 4).map((p) => (
                        <Link key={p._id} to={`/product/${p._id}`} className="mini-product-card" onClick={() => setShowSearchOverlay(false)}>
                          <img 
                            src={p.imageUrl || p.image || "/cosmetic_1.avif"} 
                            alt={p.name} 
                            onError={(e) => { e.target.src = "/cosmetic_1.avif"; }}
                            className="mini-product-thumb"
                          />
                          <div className="mini-product-details">
                            <span className="mini-product-name">{p.name}</span>
                            <span className="mini-product-price">₹{p.price.toFixed(2)}</span>
                            <div className="mini-product-rating">
                              <FaStar /> <span>{p.rating || "4.8"}</span>
                            </div>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
};

export default Navbar;
