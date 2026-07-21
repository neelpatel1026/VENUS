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
    originalPrice: '',
    availableAsGift: false,
    giftWrapAvailable: false,
    luxuryGiftBoxAvailable: false,
    giftMessageAllowed: false,
    giftBadgeText: '',
    estimatedPackingTime: '1-2 days',
    giftPrice: ''
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
          stock: data.stock,
          availableAsGift: data.availableAsGift || false,
          giftWrapAvailable: data.giftWrapAvailable || false,
          luxuryGiftBoxAvailable: data.luxuryGiftBoxAvailable || false,
          giftMessageAllowed: data.giftMessageAllowed || false,
          giftBadgeText: data.giftBadgeText || '',
          estimatedPackingTime: data.estimatedPackingTime || '1-2 days',
          giftPrice: data.giftPrice || ''
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
      
      // Gifting details
      data.append('availableAsGift', formData.availableAsGift);
      data.append('giftWrapAvailable', formData.giftWrapAvailable);
      data.append('luxuryGiftBoxAvailable', formData.luxuryGiftBoxAvailable);
      data.append('giftMessageAllowed', formData.giftMessageAllowed);
      data.append('giftBadgeText', formData.giftBadgeText);
      data.append('estimatedPackingTime', formData.estimatedPackingTime);
      data.append('giftPrice', formData.giftPrice || 0);

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
            <h2>Inventory Catalog</h2>
            <p>Update and publish premium skincare cosmetics items.</p>
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
              <label>Product Image</label>
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

            {/* Gifting Checkboxes & Details */}
            <div className="admin-form-group" style={{ flexDirection: "row", alignItems: "center", gap: "10px", marginTop: "24px" }}>
              <input
                type="checkbox"
                id="availableAsGift"
                checked={formData.availableAsGift}
                onChange={(e) => setFormData({ ...formData, availableAsGift: e.target.checked })}
                style={{ width: "18px", height: "18px", accentColor: "#C8A165", cursor: "pointer" }}
              />
              <label htmlFor="availableAsGift" style={{ textTransform: "none", cursor: "pointer", fontSize: "14px", fontWeight: "600" }}>
                Available as Gift (Publish in Luxury Gift Collection)
              </label>
            </div>

            {formData.availableAsGift && (
              <div style={{ padding: "24px", background: "#FAFAFA", borderRadius: "16px", border: "1px solid #ECECEC", marginTop: "16px", display: "flex", flexDirection: "column", gap: "18px" }}>
                <h4 style={{ margin: "0 0 4px 0", color: "#1A1A1A", fontFamily: "'Cinzel', serif", fontSize: "16px", fontWeight: "700" }}>
                  Gift Configurations
                </h4>
                
                <div style={{ display: "flex", gap: "24px", flexWrap: "wrap" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input
                      type="checkbox"
                      id="giftWrapAvailable"
                      checked={formData.giftWrapAvailable}
                      onChange={(e) => setFormData({ ...formData, giftWrapAvailable: e.target.checked })}
                      style={{ accentColor: "#C8A165", cursor: "pointer", width: "16px", height: "16px" }}
                    />
                    <label htmlFor="giftWrapAvailable" style={{ textTransform: "none", cursor: "pointer", fontSize: "13.5px", fontWeight: "500", color: "#1A1A1A" }}>Gift Wrap Available</label>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input
                      type="checkbox"
                      id="luxuryGiftBoxAvailable"
                      checked={formData.luxuryGiftBoxAvailable}
                      onChange={(e) => setFormData({ ...formData, luxuryGiftBoxAvailable: e.target.checked })}
                      style={{ accentColor: "#C8A165", cursor: "pointer", width: "16px", height: "16px" }}
                    />
                    <label htmlFor="luxuryGiftBoxAvailable" style={{ textTransform: "none", cursor: "pointer", fontSize: "13.5px", fontWeight: "500", color: "#1A1A1A" }}>Luxury Gift Box Available</label>
                  </div>

                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <input
                      type="checkbox"
                      id="giftMessageAllowed"
                      checked={formData.giftMessageAllowed}
                      onChange={(e) => setFormData({ ...formData, giftMessageAllowed: e.target.checked })}
                      style={{ accentColor: "#C8A165", cursor: "pointer", width: "16px", height: "16px" }}
                    />
                    <label htmlFor="giftMessageAllowed" style={{ textTransform: "none", cursor: "pointer", fontSize: "13.5px", fontWeight: "500", color: "#1A1A1A" }}>Gift Message Allowed</label>
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
                  <div className="admin-form-group">
                    <label style={{ fontSize: "11px" }}>Gift Badge Text</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="e.g. Best Seller Gift"
                      value={formData.giftBadgeText}
                      onChange={(e) => setFormData({ ...formData, giftBadgeText: e.target.value })}
                      style={{ background: "#FFFFFF" }}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label style={{ fontSize: "11px" }}>Estimated Packing Time</label>
                    <input
                      type="text"
                      className="admin-form-input"
                      placeholder="e.g. 1-2 days"
                      value={formData.estimatedPackingTime}
                      onChange={(e) => setFormData({ ...formData, estimatedPackingTime: e.target.value })}
                      style={{ background: "#FFFFFF" }}
                    />
                  </div>

                  <div className="admin-form-group">
                    <label style={{ fontSize: "11px" }}>Gift Service Price (₹)</label>
                    <input
                      type="number"
                      className="admin-form-input"
                      placeholder="e.g. 99"
                      value={formData.giftPrice}
                      onChange={(e) => setFormData({ ...formData, giftPrice: e.target.value })}
                      style={{ background: "#FFFFFF" }}
                    />
                  </div>
                </div>
              </div>
            )}

            <div style={{ marginTop: "30px", display: "flex", gap: "12px" }}>
              <button type="submit" className="btn-admin-primary" disabled={loading}>
                {loading ? "Saving..." : "Save Changes"}
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
