import { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
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
    giftPrice: '',

    // Extended fields
    subtitle: '',
    tagline: '',
    howToUse: '',
    ingredients: '',
    otherInfo: '',
    isBestSeller: false,
    discountPercentage: 0,
  });

  const [imagesList, setImagesList] = useState([]); // Array of strings (image URLs)
  const [newImageUrl, setNewImageUrl] = useState("");
  const [highlightsInput, setHighlightsInput] = useState("");
  const [benefitsInput, setBenefitsInput] = useState("");
  const [usageTagsInput, setUsageTagsInput] = useState("");

  const [faqs, setFaqs] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");

  const [notes, setNotes] = useState([]);
  const [newNoteTitle, setNewNoteTitle] = useState("");
  const [newNoteDesc, setNewNoteDesc] = useState("");
  const [newNoteImage, setNewNoteImage] = useState("");

  const [comboProductsList, setComboProductsList] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [selectedComboId, setSelectedComboId] = useState("");

  const [image, setImage] = useState(null);
  const [imagePreview, setImagePreview] = useState(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchAllProducts = async () => {
      try {
        const res = await fetch('/api/products');
        const data = await res.json();
        setAllProducts(Array.isArray(data) ? data.filter(p => p._id !== id) : []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAllProducts();
  }, [id]);

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
          giftPrice: data.giftPrice || '',
          
          subtitle: data.subtitle || '',
          tagline: data.tagline || '',
          howToUse: data.howToUse || '',
          ingredients: data.ingredients || '',
          otherInfo: data.otherInfo || '',
          isBestSeller: data.isBestSeller || false,
          discountPercentage: data.discountPercentage || 0,
        });

        if (data.imageUrl) {
          setImagePreview(data.imageUrl);
        }

        setImagesList(Array.isArray(data.images) ? data.images : []);
        setHighlightsInput(Array.isArray(data.highlights) ? data.highlights.join(", ") : "");
        setBenefitsInput(Array.isArray(data.benefits) ? data.benefits.join(", ") : "");
        setUsageTagsInput(Array.isArray(data.usageTags) ? data.usageTags.join(", ") : "");
        setFaqs(Array.isArray(data.faq) ? data.faq : []);
        setNotes(Array.isArray(data.notes) ? data.notes : []);
        setComboProductsList(Array.isArray(data.comboProducts) ? data.comboProducts.map(p => typeof p === 'object' ? p._id : p) : []);

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

  const addImageToList = () => {
    if (!newImageUrl.trim()) return;
    setImagesList([...imagesList, newImageUrl.trim()]);
    setNewImageUrl("");
    toast.success("Additional image added!");
  };

  const removeImageFromList = (index) => {
    setImagesList(imagesList.filter((_, i) => i !== index));
  };

  const addFaq = () => {
    if (!newQuestion.trim() || !newAnswer.trim()) return;
    setFaqs([...faqs, { question: newQuestion.trim(), answer: newAnswer.trim() }]);
    setNewQuestion("");
    setNewAnswer("");
    toast.success("FAQ added!");
  };

  const removeFaq = (index) => {
    setFaqs(faqs.filter((_, i) => i !== index));
  };

  const addNote = () => {
    if (!newNoteTitle.trim()) return;
    setNotes([...notes, { title: newNoteTitle.trim(), description: newNoteDesc.trim(), image: newNoteImage.trim() }]);
    setNewNoteTitle("");
    setNewNoteDesc("");
    setNewNoteImage("");
    toast.success("Ingredient Note added!");
  };

  const removeNote = (index) => {
    setNotes(notes.filter((_, i) => i !== index));
  };

  const addComboProduct = () => {
    if (!selectedComboId) return;
    if (comboProductsList.includes(selectedComboId)) return;
    setComboProductsList([...comboProductsList, selectedComboId]);
    setSelectedComboId("");
    toast.success("Linked Combo Product added!");
  };

  const removeComboProduct = (id) => {
    setComboProductsList(comboProductsList.filter(item => item !== id));
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
      
      data.append('availableAsGift', formData.availableAsGift);
      data.append('giftWrapAvailable', formData.giftWrapAvailable);
      data.append('luxuryGiftBoxAvailable', formData.luxuryGiftBoxAvailable);
      data.append('giftMessageAllowed', formData.giftMessageAllowed);
      data.append('giftBadgeText', formData.giftBadgeText);
      data.append('estimatedPackingTime', formData.estimatedPackingTime);
      data.append('giftPrice', formData.giftPrice || 0);

      // Premium fields
      data.append('subtitle', formData.subtitle);
      data.append('tagline', formData.tagline);
      data.append('howToUse', formData.howToUse);
      data.append('ingredients', formData.ingredients);
      data.append('otherInfo', formData.otherInfo);
      data.append('isBestSeller', formData.isBestSeller);
      
      const highlightsArr = highlightsInput.split(',').map(item => item.trim()).filter(Boolean);
      data.append('highlights', JSON.stringify(highlightsArr));

      const benefitsArr = benefitsInput.split(',').map(item => item.trim()).filter(Boolean);
      data.append('benefits', JSON.stringify(benefitsArr));

      const tagsArr = usageTagsInput.split(',').map(item => item.trim()).filter(Boolean);
      data.append('usageTags', JSON.stringify(tagsArr));

      data.append('images', JSON.stringify(imagesList));
      data.append('faq', JSON.stringify(faqs));
      data.append('notes', JSON.stringify(notes));
      data.append('comboProducts', JSON.stringify(comboProductsList));

      const calculatedDiscount = formData.originalPrice > formData.price 
        ? Math.round(((formData.originalPrice - formData.price) / formData.originalPrice) * 100)
        : 0;
      data.append('discountPercentage', calculatedDiscount);

      if (image) {
        data.append('image', image);
      }

      const res = await axios.put(`/api/products/${id}`, data, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Product updated successfully!');
      navigate('/admin/products');
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || 'Failed to update product';
      toast.error(errMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-layout-wrapper">
      <AdminSidebar />

      <div className="admin-content-console">
        <div className="admin-page-header">
          <div>
            <h2>Inventory Catalog CMS</h2>
            <p>Update and publish premium skincare cosmetics items with rich page blocks.</p>
          </div>
        </div>

        <div className="admin-form-card" style={{ maxWidth: "900px" }}>
          <form onSubmit={handleSubmit}>
            
            {/* Row 1 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
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
                <label>Subtitle / Short Tagline</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                />
              </div>
            </div>

            {/* Description */}
            <div className="admin-form-group">
              <label>Description</label>
              <textarea
                className="admin-form-input"
                required
                rows="3"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              />
            </div>

            {/* Pricing / Stock */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "16px" }}>
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

            {/* Media uploads */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", margin: "20px 0" }}>
              <div className="admin-form-group" style={{ borderRight: "1px solid #ECECEC", paddingRight: "16px" }}>
                <label>Primary Product Image (Local Upload)</label>
                <input
                  type="file"
                  className="admin-form-input"
                  accept="image/*"
                  onChange={handleImageChange}
                />
                {imagePreview && (
                  <div style={{ marginTop: "12px" }}>
                    <div className="admin-image-upload-preview-box" style={{ height: "120px", width: "120px" }}>
                      <img src={imagePreview} alt="Preview" style={{ objectFit: "contain", height: "100%", width: "100%" }} />
                    </div>
                  </div>
                )}
              </div>

              <div className="admin-form-group">
                <label>Additional Gallery Images (Paste URLs)</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    className="admin-form-input"
                    placeholder="https://..."
                    value={newImageUrl}
                    onChange={(e) => setNewImageUrl(e.target.value)}
                  />
                  <button type="button" onClick={addImageToList} style={{ background: "#C8A165", color: "#FFFFFF", padding: "0 16px", border: "none", borderRadius: "8px", cursor: "pointer" }}>+</button>
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "10px" }}>
                  {imagesList.map((url, idx) => (
                    <div key={idx} style={{ position: "relative", width: "50px", height: "50px", border: "1px solid #ECECEC", borderRadius: "6px", overflow: "hidden" }}>
                      <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button type="button" onClick={() => removeImageFromList(idx)} style={{ position: "absolute", top: 0, right: 0, background: "rgba(0,0,0,0.6)", color: "#FFF", border: "none", fontSize: "9px", cursor: "pointer" }}>x</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Rich Content Blocks */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="admin-form-group">
                <label>Highlights (Comma separated list)</label>
                <input
                  type="text"
                  className="admin-form-input"
                  placeholder="e.g. SPF 50+, Matte Finish, Non-greasy"
                  value={highlightsInput}
                  onChange={(e) => setHighlightsInput(e.target.value)}
                />
              </div>

              <div className="admin-form-group">
                <label>Benefits (Comma separated list)</label>
                <input
                  type="text"
                  className="admin-form-input"
                  placeholder="e.g. Protects skin cells, Nourishes deeply"
                  value={benefitsInput}
                  onChange={(e) => setBenefitsInput(e.target.value)}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
              <div className="admin-form-group">
                <label>How to Use</label>
                <textarea
                  className="admin-form-input"
                  rows="2"
                  value={formData.howToUse}
                  onChange={(e) => setFormData({ ...formData, howToUse: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label>Ingredients Profile</label>
                <textarea
                  className="admin-form-input"
                  rows="2"
                  value={formData.ingredients}
                  onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                />
              </div>
            </div>

            {/* FAQs Block */}
            <div style={{ border: "1px solid #ECECEC", borderRadius: "12px", padding: "16px", margin: "16px 0", background: "#FAFAFA" }}>
              <h4 style={{ margin: "0 0 10px 0" }}>FAQ Manager</h4>
              <div style={{ display: "flex", gap: "8px", marginBottom: "10px" }}>
                <input type="text" placeholder="Question" className="admin-form-input" value={newQuestion} onChange={(e) => setNewQuestion(e.target.value)} />
                <input type="text" placeholder="Answer" className="admin-form-input" value={newAnswer} onChange={(e) => setNewAnswer(e.target.value)} />
                <button type="button" onClick={addFaq} style={{ background: "#111112", color: "#FFFFFF", padding: "0 16px", border: "none", borderRadius: "8px", cursor: "pointer" }}>Add</button>
              </div>
              <div>
                {faqs.map((faq, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", background: "#FFFFFF", padding: "8px", border: "1px solid #EAEAEA", borderRadius: "6px", marginBottom: "6px", fontSize: "12px" }}>
                    <span><strong>Q:</strong> {faq.question}</span>
                    <button type="button" onClick={() => removeFaq(idx)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}>Delete</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Note Cards Block */}
            <div style={{ border: "1px solid #ECECEC", borderRadius: "12px", padding: "16px", margin: "16px 0", background: "#FAFAFA" }}>
              <h4 style={{ margin: "0 0 10px 0" }}>Ingredient Notes Profile</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr 1fr", gap: "8px", marginBottom: "10px" }}>
                <input type="text" placeholder="Title" className="admin-form-input" value={newNoteTitle} onChange={(e) => setNewNoteTitle(e.target.value)} />
                <input type="text" placeholder="Description" className="admin-form-input" value={newNoteDesc} onChange={(e) => setNewNoteDesc(e.target.value)} />
                <input type="text" placeholder="Image URL" className="admin-form-input" value={newNoteImage} onChange={(e) => setNewNoteImage(e.target.value)} />
              </div>
              <button type="button" onClick={addNote} style={{ background: "#111112", color: "#FFFFFF", padding: "10px 16px", border: "none", borderRadius: "8px", cursor: "pointer", width: "100%", marginBottom: "10px" }}>Add Note Card</button>
              <div>
                {notes.map((n, idx) => (
                  <div key={idx} style={{ display: "flex", justifyContent: "space-between", background: "#FFFFFF", padding: "8px", border: "1px solid #EAEAEA", borderRadius: "6px", marginBottom: "6px", fontSize: "12px" }}>
                    <span><strong>{n.title}:</strong> {n.description}</span>
                    <button type="button" onClick={() => removeNote(idx)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer" }}>Delete</button>
                  </div>
                ))}
              </div>
            </div>

            {/* Combos product selector */}
            <div style={{ border: "1px solid #ECECEC", borderRadius: "12px", padding: "16px", margin: "16px 0", background: "#FAFAFA" }}>
              <h4 style={{ margin: "0 0 10px 0" }}>Bestseller Combo Pairs</h4>
              <div style={{ display: "flex", gap: "8px" }}>
                <select className="admin-form-input" value={selectedComboId} onChange={(e) => setSelectedComboId(e.target.value)}>
                  <option value="">-- Select Product --</option>
                  {allProducts.map((p) => <option key={p._id} value={p._id}>{p.name}</option>)}
                </select>
                <button type="button" onClick={addComboProduct} style={{ background: "#111112", color: "#FFFFFF", padding: "0 16px", border: "none", borderRadius: "8px", cursor: "pointer" }}>Link Pair</button>
              </div>
              <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "10px" }}>
                {comboProductsList.map((cid) => {
                  const prod = allProducts.find(p => p._id === cid);
                  return (
                    <span key={cid} style={{ background: "#FFFFFF", padding: "4px 8px", borderRadius: "6px", border: "1px solid #EAEAEA", fontSize: "12px", display: "flex", gap: "6px", alignItems: "center" }}>
                      {prod ? prod.name : cid}
                      <button type="button" onClick={() => removeComboProduct(cid)} style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontWeight: "700" }}>x</button>
                    </span>
                  );
                })}
              </div>
            </div>

            {/* Usage tags & Bestseller check */}
            <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "16px", margin: "16px 0" }}>
              <div className="admin-form-group">
                <label>Usage Tags (Comma separated)</label>
                <input type="text" placeholder="e.g. Daily Wear, Date Night, Travel" className="admin-form-input" value={usageTagsInput} onChange={(e) => setUsageTagsInput(e.target.value)} />
              </div>
              <div className="admin-form-group" style={{ display: "flex", flexDirection: "row", alignItems: "center", gap: "10px", marginTop: "24px" }}>
                <input
                  type="checkbox"
                  id="isBestSeller"
                  checked={formData.isBestSeller}
                  onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
                  style={{ width: "20px", height: "20px", accentColor: "#C8A165" }}
                />
                <label htmlFor="isBestSeller" style={{ textTransform: "none", cursor: "pointer" }}>Mark Bestseller</label>
              </div>
            </div>

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
