import { useEffect, useState, useContext, useMemo } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import AdminSidebar from "./AdminSidebar";
import { getThumbnailUrl } from "../utils/imageHelper.js";
import { FiAlertCircle, FiAlertTriangle, FiCheckCircle } from "react-icons/fi";

const AdminProducts = () => {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);
  const [stockFilter, setStockFilter] = useState("all");

  /* ================= FETCH PRODUCTS ================= */
  useEffect(() => {
    const fetchProducts = async () => {
      setLoading(true);
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

  /* ================= DELETE PRODUCT ================= */
  const handleDelete = (id) => {
    toast((t) => (
      <div className="custom-confirm-toast">
        <p style={{ margin: "0 0 10px 0", fontWeight: "600", fontSize: "0.95rem" }}>Are you sure you want to delete this product?</p>
        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end" }}>
          <button
            onClick={async () => {
              toast.dismiss(t.id);
              try {
                const res = await axios.delete(`/api/products/${id}`, {
                  headers: {
                    Authorization: `Bearer ${user.token}`
                  }
                });

                setProducts(products.filter((p) => p._id !== id));
                toast.success("Product deleted successfully");
              } catch (error) {
                console.error(error);
                const errMsg = error.response?.data?.message || "Failed to delete product";
                toast.error(errMsg);
              }
            }}
            style={{
              background: "#DC2626",
              color: "#fff",
              border: "none",
              padding: "6px 14px",
              borderRadius: "6px",
              fontSize: "0.85rem",
              fontWeight: "600",
              cursor: "pointer"
            }}
          >
            Delete
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
      duration: 8000,
      position: "top-center",
      style: {
        borderLeft: "4px solid #DC2626",
      }
    });
  };

  const totalProducts = products.length;
  const inStockCount = products.filter(p => p.stock >= 10).length;
  const lowStockCount = products.filter(p => p.stock > 0 && p.stock < 10).length;
  const outOfStockCount = products.filter(p => p.stock === 0).length;

  const filteredProducts = useMemo(() => {
    let data = [...products];

    // Search filter
    if (searchTerm.trim() !== "") {
      data = data.filter(product =>
        product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        product.category.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Stock level filter
    if (stockFilter === "lowStock") {
      data = data.filter(p => p.stock > 0 && p.stock < 10);
    } else if (stockFilter === "outOfStock") {
      data = data.filter(p => p.stock === 0);
    } else if (stockFilter === "inStock") {
      data = data.filter(p => p.stock >= 10);
    }

    // Default priority sorting: Out of Stock (0) -> Low Stock (1) -> In Stock (2)
    const stockPriority = (stock) => {
      if (stock === 0) return 0;
      if (stock < 10) return 1;
      return 2;
    };

    data.sort((a, b) => stockPriority(a.stock) - stockPriority(b.stock));

    return data;
  }, [products, searchTerm, stockFilter]);

  return (
    <div className="admin-layout-wrapper">
      {/* LEFT COLUMN: SIDEBAR */}
      <AdminSidebar />

      {/* RIGHT COLUMN: MAIN CONTENT */}
      <div className="admin-content-console">
        <div className="admin-page-header">
          <div>
            <h2>Store Products</h2>
            <p>Manage skincare stock, prices, categories, and catalogs.</p>
          </div>
          <Link to="/admin/add-product" className="btn-admin-primary">
            + New Product
          </Link>
        </div>

        {/* INVENTORY SUMMARY CARDS */}
        {!loading && (
          <div className="admin-dashboard-metrics-grid" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
            <div className="metric-metric-card" style={{ padding: "16px", background: "#FFFFFF", borderRadius: "12px", border: "1px solid #FAF7F2", boxShadow: "0 2px 10px rgba(0,0,0,0.01)" }}>
              <span style={{ fontSize: "12px", textTransform: "uppercase", color: "#6B7280", fontWeight: "700" }}>Total Products</span>
              <h3 style={{ fontSize: "24px", margin: "8px 0 0 0", color: "#1A1A1A", fontFamily: "'Cinzel', serif" }}>{totalProducts}</h3>
            </div>
            <div className="metric-metric-card" style={{ padding: "16px", background: "#FFFFFF", borderRadius: "12px", border: "1px solid #FAF7F2", boxShadow: "0 2px 10px rgba(0,0,0,0.01)" }}>
              <span style={{ fontSize: "12px", textTransform: "uppercase", color: "#16A34A", fontWeight: "700" }}>In Stock</span>
              <h3 style={{ fontSize: "24px", margin: "8px 0 0 0", color: "#16A34A", fontFamily: "'Cinzel', serif" }}>{inStockCount}</h3>
            </div>
            <div className="metric-metric-card" style={{ padding: "16px", background: "#FFFFFF", borderRadius: "12px", border: "1px solid #FAF7F2", boxShadow: "0 2px 10px rgba(0,0,0,0.01)" }}>
              <span style={{ fontSize: "12px", textTransform: "uppercase", color: "#D97706", fontWeight: "700" }}>Low Stock</span>
              <h3 style={{ fontSize: "24px", margin: "8px 0 0 0", color: "#D97706", fontFamily: "'Cinzel', serif" }}>{lowStockCount}</h3>
            </div>
            <div className="metric-metric-card" style={{ padding: "16px", background: "#FFFFFF", borderRadius: "12px", border: "1px solid #FAF7F2", boxShadow: "0 2px 10px rgba(0,0,0,0.01)" }}>
              <span style={{ fontSize: "12px", textTransform: "uppercase", color: "#DC2626", fontWeight: "700" }}>Out of Stock</span>
              <h3 style={{ fontSize: "24px", margin: "8px 0 0 0", color: "#DC2626", fontFamily: "'Cinzel', serif" }}>{outOfStockCount}</h3>
            </div>
          </div>
        )}

        {/* SEARCH AND TABLE */}
        <div className="admin-table-container">
          <div className="admin-table-search-bar" style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center" }}>
            <input
              type="text"
              placeholder="Search products by name or category..."
              className="admin-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              style={{ flex: 1, minWidth: "260px" }}
            />
            
            <select
              value={stockFilter}
              onChange={(e) => setStockFilter(e.target.value)}
              className="admin-search-input"
              style={{ width: "auto", minWidth: "160px", padding: "8px 12px", height: "auto" }}
              aria-label="Filter products by stock status"
            >
              <option value="all">All Products</option>
              <option value="inStock">In Stock (10+)</option>
              <option value="lowStock">Low Stock (&lt;10)</option>
              <option value="outOfStock">Out of Stock (0)</option>
            </select>
          </div>

          <table className="admin-premium-table">
            <thead>
              <tr>
                <th>Image</th>
                <th>Product Name</th>
                <th>Category</th>
                <th>Price</th>
                <th>Stock</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                [...Array(5)].map((_, idx) => (
                  <tr key={idx}>
                    <td><div className="shimmer-bg" style={{ width: "44px", height: "44px", borderRadius: "8px" }} /></td>
                    <td><div className="shimmer-bg" style={{ height: "16px", width: "160px", borderRadius: "4px" }} /></td>
                    <td><div className="shimmer-bg" style={{ height: "16px", width: "100px", borderRadius: "4px" }} /></td>
                    <td><div className="shimmer-bg" style={{ height: "16px", width: "70px", borderRadius: "4px" }} /></td>
                    <td><div className="shimmer-bg" style={{ height: "16px", width: "50px", borderRadius: "4px" }} /></td>
                    <td><div className="shimmer-bg" style={{ height: "30px", width: "110px", borderRadius: "6px" }} /></td>
                  </tr>
                ))
              ) : filteredProducts.map((product) => {
                const rowClass = product.stock === 0 ? "bg-red-50" : product.stock < 10 ? "bg-amber-50" : "";
                return (
                  <tr key={product._id} className={rowClass}>
                    <td>
                      <img
                        src={getThumbnailUrl(product.imageUrl)}
                        alt={product.name}
                        loading="lazy"
                        style={{
                          width: "44px",
                          height: "44px",
                          borderRadius: "8px",
                          objectFit: "cover",
                          border: "1px solid var(--admin-border)",
                        }}
                      />
                    </td>
                    <td>
                      <strong style={{ fontWeight: "600" }}>{product.name}</strong>
                    </td>
                    <td>
                      <span className="status-pill" style={{ background: "#F3F4F6", color: "#374151" }}>
                        {product.category}
                      </span>
                    </td>
                    <td>
                      <span style={{ fontWeight: "600", color: "var(--admin-gold)" }}>
                        ₹{product.price.toFixed(2)}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      {product.stock === 0 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-700" style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "12px", fontSize: "11px", background: "#FEE2E2", color: "#B91C1C" }}>
                          <FiAlertCircle style={{ width: "12px", height: "12px" }} aria-hidden="true" />
                          {product.stock} Out of Stock
                        </span>
                      ) : product.stock < 10 ? (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-amber-100 text-amber-700" style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "12px", fontSize: "11px", background: "#FEF3C7", color: "#B45309" }}>
                          <FiAlertTriangle style={{ width: "12px", height: "12px" }} aria-hidden="true" />
                          {product.stock} Low Stock
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-semibold bg-green-100 text-green-700" style={{ display: "inline-flex", alignItems: "center", gap: "4px", padding: "4px 8px", borderRadius: "12px", fontSize: "11px", background: "#D1FAE5", color: "#047857" }}>
                          <FiCheckCircle style={{ width: "12px", height: "12px" }} aria-hidden="true" />
                          {product.stock} In Stock
                        </span>
                      )}
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                        <Link to={`/admin/edit-product/${product._id}`} className="btn-admin-outline">
                          Edit
                        </Link>
                        {product.stock < 10 && (
                          <Link
                            to={`/admin/edit-product/${product._id}`}
                            className="btn-admin-outline"
                            style={{ borderColor: "#D97706", color: "#D97706", background: "#FFFBEB" }}
                          >
                            Restock
                          </Link>
                        )}
                        <button
                          onClick={() => handleDelete(product._id)}
                          className="btn-admin-outline"
                          style={{ borderColor: "#DC2626", color: "#DC2626" }}
                        >
                          Delete
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {!loading && filteredProducts.length === 0 && (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--admin-text-muted)" }}>
              {stockFilter === "lowStock" 
                ? "Great! No products are currently low in stock." 
                : "No products found matching filters."
              }
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminProducts;