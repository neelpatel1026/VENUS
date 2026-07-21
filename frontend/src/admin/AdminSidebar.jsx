import { useContext, useState } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { HiMenu, HiX } from "react-icons/hi";

const AdminSidebar = () => {
  const { logout } = useContext(AuthContext);
  const location = useLocation();
  const [drawerOpen, setDrawerOpen] = useState(false);

  const menuItems = [
    { label: "📊 Dashboard", path: "/admin" },
    { label: "📦 Products List", path: "/admin/products" },
    { label: "➕ Add Product", path: "/admin/add-product" },
    { label: "🛒 Manage Orders", path: "/admin/orders" },
    { label: "🔄 Returns & Refunds", path: "/admin/returns" },
    { label: "💬 Support Complaints", path: "/admin/complaints" },
    { label: "⭐ Product Reviews", path: "/admin/reviews" },
    { label: "🎫 Coupon Discounts", path: "/admin/coupons" },
    { label: "👥 Users Directory", path: "/admin/users" },
  ];

  return (
    <>
      {/* Mobile top navigation bar */}
      <div className="admin-mobile-toggle-header">
        <button 
          className="admin-hamburger-btn" 
          onClick={() => setDrawerOpen(true)}
          aria-label="Open Admin Menu"
        >
          <HiMenu />
        </button>
        <div className="admin-sidebar-logo" style={{ fontSize: "1.1rem" }}>
          Venus<span>Care</span> Admin
        </div>
        <div style={{ width: "24px" }} /> {/* Balance space */}
      </div>

      {/* Backdrop overlay */}
      {drawerOpen && (
        <div className="admin-drawer-backdrop" onClick={() => setDrawerOpen(false)} />
      )}

      {/* Sidebar navigation drawer container */}
      <div className={`admin-sidebar-menu ${drawerOpen ? "drawer-open" : ""}`}>
        <div className="admin-sidebar-header">
          <div className="admin-sidebar-logo">
            Venus<span>Care</span>
          </div>
          <button className="admin-drawer-close-btn" onClick={() => setDrawerOpen(false)}>
            <HiX />
          </button>
        </div>
        
        <div className="admin-nav-links-list">
          {menuItems.map((item) => {
            const isActive = location.pathname === item.path;
            return (
              <Link
                key={item.path}
                to={item.path}
                className={`admin-nav-item-link ${isActive ? "active-link" : ""}`}
                onClick={() => setDrawerOpen(false)}
              >
                {item.label}
              </Link>
            );
          })}
        </div>

        <button onClick={logout} className="admin-logout-sidebar-btn">
          🚪 Sign Out
        </button>
      </div>
    </>
  );
};

export default AdminSidebar;
