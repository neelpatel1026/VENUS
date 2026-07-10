import { useContext } from "react";
import { Link, useLocation } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const AdminSidebar = () => {
  const { logout } = useContext(AuthContext);
  const location = useLocation();

  const menuItems = [
    { label: "📊 Dashboard", path: "/admin" },
    { label: "📦 Products List", path: "/admin/products" },
    { label: "➕ Add Product", path: "/admin/add-product" },
    { label: "🛒 Manage Orders", path: "/admin/orders" },
    { label: "🔄 Returns & Refunds", path: "/admin/returns" },
    { label: "💬 Support Complaints", path: "/admin/complaints" },
    { label: "👥 Users Directory", path: "/admin/users" },
  ];

  return (
    <div className="admin-sidebar-menu">
      <div className="admin-sidebar-header">
        <div className="admin-sidebar-logo">
          Venus<span>Care</span>
        </div>
      </div>
      
      <div className="admin-nav-links-list">
        {menuItems.map((item) => {
          const isActive = location.pathname === item.path;
          return (
            <Link
              key={item.path}
              to={item.path}
              className={`admin-nav-item-link ${isActive ? "active-link" : ""}`}
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
  );
};

export default AdminSidebar;
