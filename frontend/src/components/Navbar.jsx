import { useContext, useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { useSelector } from "react-redux";
import { HiMenu, HiX } from "react-icons/hi";
import { FiSearch } from "react-icons/fi";
import "../styles/navbar.css";
import toast from "react-hot-toast";

const Navbar = () => {
  const { user, logout } = useContext(AuthContext);
  const cartItems = useSelector((state) => state.cart.cartItems);
  const navigate = useNavigate();

  const [menuOpen, setMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    if (menuOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [menuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };

    window.addEventListener("scroll", handleScroll);

    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const handleLogout = () => {
    toast((t) => (
      <div className="custom-confirm-toast">
        <p style={{ margin: "0 0 10px 0", fontWeight: "600", fontSize: "0.95rem" }}>Are you sure you want to logout?</p>
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button
            onClick={() => {
              toast.dismiss(t.id);
              logout();
              navigate("/login");
              setMenuOpen(false);
              toast.success("Logged out successfully");
            }}
            style={{
              background: "#C8A165",
              color: "#fff",
              border: "none",
              padding: "6px 14px",
              borderRadius: "6px",
              fontSize: "0.85rem",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Logout
          </button>
          <button
            onClick={() => toast.dismiss(t.id)}
            style={{
              background: "#F3F4F6",
              color: "#1F2937",
              border: "1px solid #E5E7EB",
              padding: "6px 14px",
              borderRadius: "6px",
              fontSize: "0.85rem",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    ), {
      duration: 6000,
      position: "top-center",
      style: {
        borderLeft: "4px solid #C8A165",
      }
    });
  };
  return (
    <nav className={`navbar ${scrolled ? "scrolled" : ""}`}>
      {/* LOGO */}
      <div className="navbar-brand" style={{ display: "flex", alignItems: "center" }}>
        <Link to="/" onClick={() => setMenuOpen(false)} style={{ display: "flex", alignItems: "center", textDecoration: "none", height: "46px", width: "220px" }}>
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 220 50" width="100%" height="100%">
            {/* Icon: Delicate Luxury Rose / Lotus Gold Line Art */}
            <path d="M25,12 C28,15 32,15 35,12 C35,22 25,38 25,38 C25,38 15,22 15,12 C18,15 22,15 25,12 Z" fill="none" stroke="#C8A165" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
            <path d="M25,18 C27,20 30,20 32,18 C32,25 25,35 25,35 C25,35 18,25 18,18 C20,20 23,20 25,18 Z" fill="none" stroke="#C8A165" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round"/>
            <circle cx="25" cy="12" r="1.5" fill="#C8A165"/>
            {/* Text: Elegant Serif Custom Letter-spaced Typeface */}
            <text x="48" y="26" fontFamily="'Cinzel', 'Didot', 'Bodoni MT', 'Times New Roman', serif" fontSize="16" fontWeight="700" letterSpacing="4" fill="#1F2937">VENUS</text>
            <text x="122" y="26" fontFamily="'Cinzel', 'Didot', 'Bodoni MT', 'Times New Roman', serif" fontSize="16" fontWeight="400" letterSpacing="4" fill="#C8A165">CARE</text>
            <text x="49" y="38" fontFamily="'Inter', 'Montserrat', 'Helvetica', sans-serif" fontSize="7.5" fontWeight="600" letterSpacing="5.5" fill="#9CA3AF">SKINCARE APOTHECARY</text>
          </svg>
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
