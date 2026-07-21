import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext.jsx';
import { Link } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminSidebar from "./AdminSidebar";
import { getThumbnailUrl } from "../utils/imageHelper.js";

const AdminProducts = () => {
  const { user } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [loading, setLoading] = useState(true);

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
                const res = await fetch(`/api/products/${id}`, {
                  method: 'DELETE',
                  headers: {
                    Authorization: `Bearer ${user.token}`
                  }
                });

                if (res.ok) {
                  setProducts(products.filter((p) => p._id !== id));
                  toast.success("Product deleted successfully");
                } else {
                  const errData = await res.json();
                  toast.error(errData.message || "Failed to delete product");
                }
              } catch (error) {
                console.error(error);
                toast.error("Failed to delete product");
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

  const filteredProducts = products.filter(product =>
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.category.toLowerCase().includes(searchTerm.toLowerCase())
  );

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

        {/* SEARCH AND TABLE */}
        <div className="admin-table-container">
          <div className="admin-table-search-bar">
            <input
              type="text"
              placeholder="Search products by name or category..."
              className="admin-search-input"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
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
                const isLowStock = product.stock <= 3;
                return (
                  <tr key={product._id}>
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
                    <td>
                      <span className={`status-pill ${isLowStock ? "pill-rejected" : "pill-active"}`}>
                        {product.stock} left {isLowStock && "⚠️"}
                      </span>
                    </td>
                    <td>
                      <div style={{ display: "flex", gap: "10px" }}>
                        <Link to={`/admin/edit-product/${product._id}`} className="btn-admin-outline">
                          Edit
                        </Link>
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
              No products found matching filters.
            </div>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminProducts;