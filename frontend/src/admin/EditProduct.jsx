import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import AdminSidebar from "./AdminSidebar";

const EditProduct = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    category: '',
    stock: '',
    originalPrice: ''
  });

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        const res = await fetch(`/api/products/${id}`);
        const data = await res.json();
        setFormData({
          name: data.name,
          description: data.description,
          price: data.price,
          originalPrice: data.originalPrice || data.price,
          category: data.category,
          stock: data.stock
        });
        if (data.imageUrl) {
          setImagePreview(data.imageUrl);
        }
      } catch (error) {
        console.error(error);
      }
    };
    fetchProduct();
  }, [id]);

  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (Number(formData.price) < 0) {
      toast.error("Price cannot be negative");
      return;
    }

    if (Number(formData.originalPrice) < 0) {
      toast.error("Original Price cannot be negative");
      return;
    }

    if (Number(formData.stock) < 0) {
      toast.error("Stock cannot be negative");
      return;
    }

    if (Number(formData.originalPrice) < Number(formData.price)) {
      toast.error("Original Price must be greater than or equal to Price");
      return;
    }

    setLoading(true);
    try {
      const data = new FormData();
      data.append('name', formData.name);
      data.append('description', formData.description);
      data.append('price', formData.price);
      data.append('category', formData.category);
      data.append('stock', formData.stock);
      data.append('originalPrice', formData.originalPrice);
      if (image) {
        data.append('image', image);
      }

      const res = await fetch(`/api/products/${id}`, {
        method: 'PUT',
        headers: {
          Authorization: `Bearer ${user.token}`
        },
        body: data
      });

      if (res.ok) {
        toast.success('Product updated successfully!');
        navigate('/admin/products');
      } else {
        const errData = await res.json();
        toast.error(errData.message || 'Failed to update product');
      }
    } catch (error) {
      console.error(error);
      toast.error('Failed to update product');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-layout-wrapper">
      {/* LEFT COLUMN: SIDEBAR */}
      <AdminSidebar />

      {/* RIGHT COLUMN: MAIN CONTENT */}
      <div className="admin-content-console">
        <div className="admin-page-header">
          <div>
            <h2>Edit Catalog Product</h2>
            <p>Modify and re-publish custom cosmetic formulas.</p>
          </div>
        </div>

        <div className="admin-form-card" style={{ maxWidth: "800px" }}>
          <form onSubmit={handleSubmit}>
            
            <div className="admin-form-group">
              <label>Product Name</label>
              <input
                type="text"
                className="admin-form-input"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            <div className="admin-form-group">
              <label>Description</label>
              <textarea
                className="admin-form-input"
                required
                rows="4"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="admin-form-group">
                <label>Sale Price (₹)</label>
                <input
                  type="number"
                  className="admin-form-input"
                  required
                  value={formData.price}
                  onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label>Original Price (₹)</label>
                <input
                  type="number"
                  className="admin-form-input"
                  required
                  value={formData.originalPrice}
                  onChange={(e) => setFormData({ ...formData, originalPrice: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="admin-form-group">
                <label>Category</label>
                <input
                  type="text"
                  className="admin-form-input"
                  required
                  value={formData.category}
                  onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label>Stock Count</label>
                <input
                  type="number"
                  className="admin-form-input"
                  required
                  value={formData.stock}
                  onChange={(e) => setFormData({ ...formData, stock: e.target.value })}
                />
              </div>
            </div>

            <div className="admin-form-group">
              <label>Change Product Image</label>
              <input
                type="file"
                className="admin-form-input"
                accept="image/*"
                onChange={handleImageChange}
              />
              {imagePreview && (
                <div style={{ marginTop: "12px" }}>
                  <div className="admin-image-upload-preview-box">
                    <img src={imagePreview} alt="Preview" />
                  </div>
                </div>
              )}
            </div>

            <div style={{ marginTop: "30px", display: "flex", gap: "12px" }}>
              <button type="submit" className="btn-admin-primary" disabled={loading}>
                {loading ? "Saving..." : "Update Product"}
              </button>
              <button type="button" className="btn-admin-secondary" onClick={() => navigate("/admin/products")}>
                Cancel
              </button>
            </div>

          </form>
        </div>

      </div>
    </div>
  );
};

export default EditProduct;
