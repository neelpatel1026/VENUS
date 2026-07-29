import { useContext, useState, useEffect, useRef } from "react";
import { Link, useNavigate, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useSelector, useDispatch } from "react-redux";
import { HiMenu, HiX } from "react-icons/hi";
import { FiSearch, FiShoppingBag, FiUser, FiLayers, FiLogOut, FiMapPin, FiX, FiTrash2, FiTrendingUp, FiChevronDown, FiChevronUp, FiChevronRight, FiHome, FiTag, FiPhoneCall, FiInfo } from "react-icons/fi";
import { FaStar, FaInstagram, FaFacebookF, FaYoutube, FaPinterestP, FaLinkedinIn, FaWhatsapp, FaEnvelope, FaMapMarkerAlt, FaClock, FaCheckCircle } from "react-icons/fa";
import { clearCart } from "../redux/cartSlice";
import { motion, AnimatePresence } from "framer-motion";
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
  const [expandedCategory, setExpandedCategory] = useState(null);

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
      {/* DESKTOP NAVBAR */}
      <nav className={`navbar desktop-navbar-container ${scrolled ? "scrolled" : ""}`}>
        
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
              <Link className="nav-link-item" to="/offers">Offers</Link>
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
                        {user.avatarUrl ? (
                          <img 
                            src={user.avatarUrl} 
                            alt="Navbar Avatar" 
                            style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover" }} 
                          />
                        ) : (
                          user.name.charAt(0).toUpperCase()
                        )}
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

      </nav>

      {/* MOBILE NAVBAR */}
      <nav className={`navbar-mobile mobile-navbar-container ${scrolled ? "scrolled" : ""}`}>
        {/* LEFT: Hamburger menu */}
        <div className="navbar-mobile-left">
          <button
            className="menu-toggle-btn-mobile"
            onClick={() => setMenuOpen(!menuOpen)}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
          >
            {menuOpen ? <HiX className="menu-toggle-icon-mobile" /> : <HiMenu className="menu-toggle-icon-mobile" />}
          </button>
        </div>

        {/* CENTER: Logo with registered mark */}
        <div className="navbar-mobile-center">
          <Link to="/" onClick={() => setMenuOpen(false)} className="mobile-navbar-brand-link">
            <span className="mobile-brand-text">
              VENUS CARE<span className="mobile-brand-trademark">®</span>
            </span>
          </Link>
        </div>

        {/* RIGHT: Search, Profile, Cart */}
        <div className="navbar-mobile-right">
          {/* Search Icon */}
          <button 
            className="mobile-header-icon-btn" 
            onClick={() => navigate("/search")}
            aria-label="Open search"
          >
            <FiSearch className="mobile-header-icon" />
          </button>

          {/* Profile Icon */}
          {user ? (
            <Link to="/profile" className="mobile-header-icon-btn" aria-label="My Profile">
              <FiUser className="mobile-header-icon" />
            </Link>
          ) : (
            <Link to="/login" className="mobile-header-icon-btn" aria-label="Account login">
              <FiUser className="mobile-header-icon" />
            </Link>
          )}

          {/* Cart Icon with Badge */}
          {user?.role !== "admin" && (
            <Link to="/cart" className="mobile-header-icon-btn mobile-cart-wrapper" aria-label="Open shopping bag">
              <FiShoppingBag className="mobile-header-icon" />
              {cartItems.length > 0 && (
                <span className={`mobile-cart-badge ${cartBounce ? "bounce" : ""}`}>
                  {cartItems.length > 99 ? "99+" : cartItems.length}
                </span>
              )}
            </Link>
          )}
        </div>
      </nav>

      {/* MOBILE DRAWER (Slides smoothly from left using Framer Motion) */}
      <AnimatePresence>
        {menuOpen && (
          <>
            {/* Backdrop Dark Overlay */}
            <motion.div
              className="luxury-mobile-menu-backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 0.5 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
              onClick={() => setMenuOpen(false)}
            />

            {/* Side Drawer Panel */}
            <motion.div
              className="luxury-mobile-menu-drawer"
              initial={{ x: "-100%" }}
              animate={{ x: 0 }}
              exit={{ x: "-100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
            >
              {/* HEADER */}
              <div className="drawer-luxury-header">
                <Link to="/" onClick={() => setMenuOpen(false)} className="drawer-logo-link">
                  <span className="drawer-logo-text">
                    VENUS CARE<span className="drawer-logo-trademark">®</span>
                  </span>
                </Link>
                <button className="drawer-luxury-close-btn" onClick={() => setMenuOpen(false)} aria-label="Close menu">
                  <FiX />
                </button>
              </div>

              {/* DRAWER BODY AREA */}
              <div className="drawer-luxury-body">
                {/* 1. User Welcome & Quick Action Cards */}
                <div className="drawer-welcome-row">
                  <span>{user ? `Hi, ${user.name}` : "Welcome to Venus Care"}</span>
                </div>
                
                <div className="drawer-quick-cards-grid">
                  <div className="quick-action-card" onClick={() => { setMenuOpen(false); navigate(user ? "/profile" : "/login"); }}>
                    <div className="quick-card-icon-box">📦</div>
                    <div className="quick-card-text-box">
                      <h4>My Orders</h4>
                      <p>View All</p>
                    </div>
                  </div>
                  <div className="quick-action-card" onClick={() => { setMenuOpen(false); navigate(user ? "/profile" : "/login"); }}>
                    <div className="quick-card-icon-box">🚚</div>
                    <div className="quick-card-text-box">
                      <h4>Track Order</h4>
                      <p>Track shipment</p>
                    </div>
                  </div>
                </div>

                {/* 2. Category Showcase */}
                <div className="drawer-section-header-luxury">
                  <h3 className="drawer-section-title-luxury">SHOP BY CATEGORY</h3>
                  <span className="drawer-section-subtitle-luxury">Explore premium collections</span>
                  <div className="drawer-luxury-divider" />
                </div>

                <div className="drawer-categories-scroll-row-luxury">
                  {[
                    { label: "Face Care", img: "/about_hero.jpg", query: "Face Wash" },
                    { label: "Serums", img: "/about_formulation.jpg", query: "Serums" },
                    { label: "Sunscreen", img: "/about_avatar.jpg", query: "Sunscreen" },
                    { label: "Hair Care", img: "/about_lab.jpg", query: "Hair Care" },
                    { label: "Fragrance", img: "/about_cta.jpg", query: "Perfume" },
                    { label: "Cosmetics", img: "/about_avatar.jpg", query: "Lipstick" },
                    { label: "Body Care", img: "/about_hero.jpg", query: "Moisturizers" },
                    { label: "Gift Sets", img: "/hero3_mobile.jpg", query: "Gift Sets" }
                  ].map((cat, idx) => (
                    <motion.div 
                      key={idx} 
                      className="category-luxury-card"
                      whileTap={{ scale: 0.95 }}
                      whileHover={{ scale: 1.02 }}
                      onClick={() => { setMenuOpen(false); navigate(`/shop?search=${encodeURIComponent(cat.query)}`); }}
                    >
                      <div className="category-luxury-img-wrapper">
                        <img src={cat.img} alt={cat.label} loading="lazy" onError={(e) => { e.target.src = "/about_hero.jpg"; }} />
                      </div>
                      <span className="category-luxury-label">{cat.label}</span>
                    </motion.div>
                  ))}
                </div>

                {/* 3. Promotional Banner */}
                <div className="drawer-promotional-banner-luxury" onClick={() => { setMenuOpen(false); navigate("/offers"); }} style={{ padding: 0, overflow: "hidden", background: "none", border: "none", boxShadow: "none", display: "block", width: "100%" }}>
                  <img 
                    src="/hero1_mobile.jpg" 
                    alt="Venus Care Luxury Promotion" 
                    style={{ width: "100%", height: "auto", display: "block", borderRadius: "16px", objectFit: "cover" }} 
                    loading="lazy"
                    onError={(e) => { e.target.src = "/about_hero.jpg"; }}
                  />
                </div>

                {/* 4. Small Horizontal Scrolling Promotional Cards */}
                <div className="drawer-promo-collections-row">
                  {[
                    { title: "Vitamin C Collection", subtitle: "Super Radiant Skin", link: "/shop?search=Vitamin C" },
                    { title: "Summer Essentials", subtitle: "UV Shield & Hydration", link: "/shop?search=Sunscreen" },
                    { title: "Glow Collection", subtitle: "Overnight Repair Serum", link: "/shop?search=Serums" },
                    { title: "Luxury Gift Sets", subtitle: "Perfect Present for Loved Ones", link: "/shop?search=Gift Sets" },
                    { title: "Anti-Aging Collection", subtitle: "Rewind Fine Lines", link: "/shop?search=Moisturizers" }
                  ].map((collection, cIdx) => (
                    <motion.div 
                      key={cIdx} 
                      className="promo-collection-mini-card"
                      whileTap={{ scale: 0.98 }}
                      onClick={() => { setMenuOpen(false); navigate(collection.link); }}
                    >
                      <div className="promo-collection-mini-bg" />
                      <div className="promo-collection-mini-content">
                        <h5>{collection.title}</h5>
                        <p>{collection.subtitle}</p>
                      </div>
                    </motion.div>
                  ))}
                </div>

                {/* 4. Luxury Navigation List with Accordion Submenus */}
                <div className="drawer-menu-list-items">
                  {/* Home */}
                  <div className="drawer-menu-list-row-item" onClick={() => { setMenuOpen(false); navigate("/"); }}>
                    <span className="row-icon-title"><FiHome className="row-icon-main" /> Home</span>
                    <FiChevronRight className="row-chevron-right" />
                  </div>

                  {/* Shop All */}
                  <div className="drawer-menu-list-row-item" onClick={() => { setMenuOpen(false); navigate("/shop"); }}>
                    <span className="row-icon-title"><FiShoppingBag className="row-icon-main" /> Shop All</span>
                    <FiChevronRight className="row-chevron-right" />
                  </div>

                  {/* Skincare (Expandable) */}
                  <div className="drawer-menu-collapsible-group">
                    <div className="drawer-menu-list-row-item" onClick={() => toggleExpand("skincare")}>
                      <span className="row-icon-title">🧴 Skincare</span>
                      {expandedCategory === "skincare" ? <FiChevronUp className="row-chevron-right" /> : <FiChevronDown className="row-chevron-right" />}
                    </div>
                    <motion.div
                      initial={false}
                      animate={{ height: expandedCategory === "skincare" ? "auto" : 0 }}
                      className="drawer-submenu-collapsible-wrapper"
                      style={{ overflow: "hidden" }}
                    >
                      {[
                        { label: "Face Wash", query: "Face Wash" },
                        { label: "Serum", query: "Serums" },
                        { label: "Moisturizer", query: "Moisturizers" },
                        { label: "Sunscreen", query: "Sunscreen" },
                        { label: "Night Cream", query: "Moisturizers" }
                      ].map((sub, sIdx) => (
                        <div 
                          key={sIdx} 
                          className="drawer-submenu-item-row"
                          onClick={() => { setMenuOpen(false); navigate(`/shop?search=${encodeURIComponent(sub.query)}`); }}
                        >
                          {sub.label}
                        </div>
                      ))}
                    </motion.div>
                  </div>

                  {/* Hair Care (Expandable) */}
                  <div className="drawer-menu-collapsible-group">
                    <div className="drawer-menu-list-row-item" onClick={() => toggleExpand("hair")}>
                      <span className="row-icon-title">💇 Hair Care</span>
                      {expandedCategory === "hair" ? <FiChevronUp className="row-chevron-right" /> : <FiChevronDown className="row-chevron-right" />}
                    </div>
                    <motion.div
                      initial={false}
                      animate={{ height: expandedCategory === "hair" ? "auto" : 0 }}
                      className="drawer-submenu-collapsible-wrapper"
                      style={{ overflow: "hidden" }}
                    >
                      {[
                        { label: "Hair Oil", query: "Hair Care" },
                        { label: "Hair Serum", query: "Hair Care" },
                        { label: "Shampoo", query: "Hair Care" },
                        { label: "Conditioner", query: "Hair Care" }
                      ].map((sub, sIdx) => (
                        <div 
                          key={sIdx} 
                          className="drawer-submenu-item-row"
                          onClick={() => { setMenuOpen(false); navigate(`/shop?search=${encodeURIComponent(sub.query)}`); }}
                        >
                          {sub.label}
                        </div>
                      ))}
                    </motion.div>
                  </div>

                  {/* Perfume (Expandable) */}
                  <div className="drawer-menu-collapsible-group">
                    <div className="drawer-menu-list-row-item" onClick={() => toggleExpand("perfume")}>
                      <span className="row-icon-title">🌸 Fragrance</span>
                      {expandedCategory === "perfume" ? <FiChevronUp className="row-chevron-right" /> : <FiChevronDown className="row-chevron-right" />}
                    </div>
                    <motion.div
                      initial={false}
                      animate={{ height: expandedCategory === "perfume" ? "auto" : 0 }}
                      className="drawer-submenu-collapsible-wrapper"
                      style={{ overflow: "hidden" }}
                    >
                      {[
                        { label: "Luxury Oils", query: "Perfume" },
                        { label: "Unisex Cologne", query: "Perfume" },
                        { label: "Women's Collection", query: "Perfume" },
                        { label: "Men's Collection", query: "Perfume" }
                      ].map((sub, sIdx) => (
                        <div 
                          key={sIdx} 
                          className="drawer-submenu-item-row"
                          onClick={() => { setMenuOpen(false); navigate(`/shop?search=${encodeURIComponent(sub.query)}`); }}
                        >
                          {sub.label}
                        </div>
                      ))}
                    </motion.div>
                  </div>

                  {/* Cosmetics (Expandable) */}
                  <div className="drawer-menu-collapsible-group">
                    <div className="drawer-menu-list-row-item" onClick={() => toggleExpand("cosmetics")}>
                      <span className="row-icon-title">💄 Cosmetics</span>
                      {expandedCategory === "cosmetics" ? <FiChevronUp className="row-chevron-right" /> : <FiChevronDown className="row-chevron-right" />}
                    </div>
                    <motion.div
                      initial={false}
                      animate={{ height: expandedCategory === "cosmetics" ? "auto" : 0 }}
                      className="drawer-submenu-collapsible-wrapper"
                      style={{ overflow: "hidden" }}
                    >
                      {[
                        { label: "Lipstick", query: "Lipstick" },
                        { label: "Eyeliner", query: "Lipstick" },
                        { label: "Foundation", query: "Lipstick" },
                        { label: "Nail Polish", query: "Lipstick" }
                      ].map((sub, sIdx) => (
                        <div 
                          key={sIdx} 
                          className="drawer-submenu-item-row"
                          onClick={() => { setMenuOpen(false); navigate(`/shop?search=${encodeURIComponent(sub.query)}`); }}
                        >
                          {sub.label}
                        </div>
                      ))}
                    </motion.div>
                  </div>

                  {/* Offers */}
                  <div className="drawer-menu-list-row-item" onClick={() => { setMenuOpen(false); navigate("/offers"); }}>
                    <span className="row-icon-title"><FiTag className="row-icon-main" /> Special Offers</span>
                    <FiChevronRight className="row-chevron-right" />
                  </div>

                  {/* About */}
                  <div className="drawer-menu-list-row-item" onClick={() => { setMenuOpen(false); navigate("/about"); }}>
                    <span className="row-icon-title"><FiInfo className="row-icon-main" /> About Brand</span>
                    <FiChevronRight className="row-chevron-right" />
                  </div>

                  {/* Contact */}
                  <div className="drawer-menu-list-row-item" onClick={() => { setMenuOpen(false); navigate("/contact"); }}>
                    <span className="row-icon-title"><FiPhoneCall className="row-icon-main" /> Contact Support</span>
                    <FiChevronRight className="row-chevron-right" />
                  </div>
                </div>

                {/* 5. Luxury Brand Support Card Section */}
                <div className="drawer-luxury-fixed-bottom-section">
                  <div className="drawer-support-card-luxury">
                    <h4 className="support-card-title-luxury">✨ Need Help?</h4>
                    <p className="support-card-subtitle-luxury">Our skincare experts are always happy to assist you.</p>
                    
                    <div className="support-info-items-list">
                      <a href="mailto:support@venuscare.in" className="support-info-item-row-link">
                        <FaEnvelope className="info-row-icon" /> support@venuscare.in
                      </a>
                      <a href="https://wa.me/919999988888" target="_blank" rel="noopener noreferrer" className="support-info-item-row-link">
                        <FaWhatsapp className="info-row-icon" /> WhatsApp Support
                      </a>
                      <div className="support-info-item-row-static">
                        <FaMapMarkerAlt className="info-row-icon" /> Ahmedabad, Gujarat, India
                      </div>
                      <div className="support-info-item-row-static">
                        <FaClock className="info-row-icon" /> Mon–Sat | 9:00 AM – 7:00 PM
                      </div>
                    </div>

                    <div className="support-trust-badges-grid-luxury">
                      <span className="trust-badge-item"><FaCheckCircle className="badge-check-icon" /> Secure Payments</span>
                      <span className="trust-badge-item"><FaCheckCircle className="badge-check-icon" /> Fast Delivery</span>
                      <span className="trust-badge-item"><FaCheckCircle className="badge-check-icon" /> Easy Returns</span>
                      <span className="trust-badge-item"><FaCheckCircle className="badge-check-icon" /> Premium Quality</span>
                    </div>

                    <div className="support-action-buttons-stack">
                      <button 
                        type="button" 
                        className="support-primary-action-btn-gold" 
                        onClick={() => { setMenuOpen(false); navigate("/contact"); }}
                      >
                        Contact Support
                      </button>
                      <a 
                        href="https://wa.me/919999988888" 
                        target="_blank" 
                        rel="noopener noreferrer" 
                        className="support-secondary-action-btn-whatsapp"
                      >
                        <FaWhatsapp /> WhatsApp Chat
                      </a>
                    </div>

                    <div className="support-card-socials-row">
                      <motion.a whileTap={{ scale: 0.9 }} href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="circular-social-icon-btn">
                        <FaInstagram />
                      </motion.a>
                      <motion.a whileTap={{ scale: 0.9 }} href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="circular-social-icon-btn">
                        <FaFacebookF />
                      </motion.a>
                      <motion.a whileTap={{ scale: 0.9 }} href="https://youtube.com" target="_blank" rel="noopener noreferrer" className="circular-social-icon-btn">
                        <FaYoutube />
                      </motion.a>
                      <motion.a whileTap={{ scale: 0.9 }} href="https://pinterest.com" target="_blank" rel="noopener noreferrer" className="circular-social-icon-btn">
                        <FaPinterestP />
                      </motion.a>
                      <motion.a whileTap={{ scale: 0.9 }} href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="circular-social-icon-btn">
                        <FaLinkedinIn />
                      </motion.a>
                    </div>

                    <p className="support-card-brand-message">
                      "Crafted with premium botanical ingredients for healthy, glowing skin."
                    </p>
                  </div>

                  <div className="bottom-privacy-terms-row">
                    <Link to="/privacy-policy" onClick={() => setMenuOpen(false)}>Privacy Policy</Link>
                    <span className="bullet-dot">•</span>
                    <Link to="/terms-conditions" onClick={() => setMenuOpen(false)}>Terms & Conditions</Link>
                  </div>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>

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
