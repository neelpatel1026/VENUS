import React, { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useSelector } from "react-redux";
import { HiMenu, HiX } from "react-icons/hi";
import { FiSearch } from "react-icons/fi";
import "../styles/navbar.css";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const cartItems = useSelector((state) => state.cart.cartItems);
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    const confirmLogout = window.confirm("Are you sure you want to logout?");

    if (confirmLogout) {
      logout();

      navigate("/login");

      setMenuOpen(false);
    }
  };
  return (
    // <nav className="navbar">
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      {/* LOGO */}
      <div className="navbar-brand">
        <Link to="/" onClick={() => setMenuOpen(false)}>
          <img
            src="https://img.magnific.com/premium-vector/natural-cosmetics-logo-design-minimal-style_278222-5189.jpg?semt=ais_hybrid&w=740&q=80"
            alt="venus"
            style={{
              height: "38px",
              width: "38px",
              borderRadius: "10px",
              objectFit: "cover",
              filter: "drop-shadow(0 2px 8px rgba(249, 115, 22, 0.35))",
            }}
          />

          {/* <span>venus</span> */}
          <span className="brand-name">Venus</span>
        </Link>
      </div>

      {/* MOBILE MENU BUTTON */}
      <div className="menu-toggle" onClick={() => setMenuOpen(!menuOpen)}>
        {menuOpen ? <HiX /> : <HiMenu />}
      </div>

      {/* NAV LINKS */}
      {/* <ul className={`navbar-links ${menuOpen ? "active" : ""}`}>
        <li>
          <Link to="/shop" onClick={() => setMenuOpen(false)}>
            Shop
          </Link>
        </li>

        {user?.role !== "admin" && (
          <li>
            <Link to="/cart" onClick={() => setMenuOpen(false)}>
              Cart ({cartItems.length})
            </Link>
          </li>
        )}

        {user ? (
          <>
            <li>
              <Link to="/profile" onClick={() => setMenuOpen(false)}>
                Hi, {user.name}
              </Link>
            </li>

            {user.role === "admin" && (
              <li>
                <Link to="/admin" onClick={() => setMenuOpen(false)}>
                  Admin
                </Link>
              </li>
            )}

            <li>
              <button onClick={handleLogout} className="btn-logout">
                Logout
              </button>
            </li>
          </>
        ) : (
          <li>
            <Link to="/login" onClick={() => setMenuOpen(false)}>
              Login
            </Link>
          </li>
        )}
      </ul> */}

      <ul className={`navbar-links ${menuOpen ? "active" : ""}`}>
        <li>
          <Link to="/" onClick={() => setMenuOpen(false)}>
            Home
          </Link>
        </li>

        <li>
          <Link to="/shop" onClick={() => setMenuOpen(false)}>
            Shop
          </Link>
        </li>

        {/* <li className="dropdown">
          <Link to="/shop">Products</Link>

          <div className="dropdown-menu">
            <Link to="/shop?category=skincare">Skincare</Link>
            <Link to="/shop?category=haircare">Haircare</Link>
            <Link to="/shop?category=makeup">Makeup</Link>
          </div>
        </li> */}

        {/* <li>
          <Link to="/hot-products" onClick={() => setMenuOpen(false)}>
            Hot Products
          </Link>
        </li> */}

        {user?.role !== "admin" && (
          <li>
            <Link to="/cart" onClick={() => setMenuOpen(false)}>
              Cart ({cartItems.length})
            </Link>
          </li>
        )}

        <li>
          <Link to="/about" onClick={() => setMenuOpen(false)}>
            About Us
          </Link>
        </li>

        <li>
          <Link to="/contact" onClick={() => setMenuOpen(false)}>
            Contact Us
          </Link>
        </li>

        {user && (
          <li>
            <Link to="/profile" onClick={() => setMenuOpen(false)}>
              Hi, {user.name}
            </Link>
          </li>
        )}

        {user?.role === "admin" && (
          <li>
            <Link to="/admin" onClick={() => setMenuOpen(false)}>
              Admin
            </Link>
          </li>
        )}

        {user ? (
          <li>
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </li>
        ) : (
          <li>
            <Link to="/login" onClick={() => setMenuOpen(false)}>
              Login
            </Link>
          </li>
        )}
      </ul>

      <div className="navbar-right">
        <Link to="/search">
          <FiSearch className="nav-icon" />
        </Link>
      </div>
    </nav>
  );
};
export default Navbar;
