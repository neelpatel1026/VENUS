import { useState, useContext, useEffect } from 'react';
import { AuthContext } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import axios from 'axios';
import AdminSidebar from "./AdminSidebar";

const AddProduct = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    name: '',
    slug: '',
    brand: 'VENUS CARE',
    description: '',
    price: '',
    originalPrice: '',
    category: '',
    stock: '',
    sku: '',
    isBestSeller: false,
    isNewArrival: false,
    isActive: true,
    availableAsGift: false,
    giftWrapAvailable: false,
    luxuryGiftBoxAvailable: false,
    giftMessageAllowed: false,
    giftBadgeText: '',
    estimatedPackingTime: '1-2 days',
    giftPrice: '',
    
    // Redesign Fields
    subtitle: '',
    tagline: '',
    howToUse: '',
    ingredients: '',
    otherInformation: '',
    productHighlights: '',
    metaTitle: '',
    metaDescription: '',
    metaKeywords: ''
  });

  const [galleryUrls, setGalleryUrls] = useState([]);
  const [newGalleryUrl, setNewGalleryUrl] = useState("");
  const [trustBadges, setTrustBadges] = useState(["Imported Oils", "Cruelty-Free", "IFRA Certified", "Assured Delivery"]);

  const [notesInSet, setNotesInSet] = useState([]);
  const [noteTitleInput, setNoteTitleInput] = useState("");
  const [noteImageInput, setNoteImageInput] = useState("");
  const [noteVal1Input, setNoteVal1Input] = useState("");
  const [noteVal2Input, setNoteVal2Input] = useState("");
  const [noteVal3Input, setNoteVal3Input] = useState("");

  const [wearTagsInput, setWearTagsInput] = useState("");
  const [faqs, setFaqs] = useState([]);
  const [newQuestion, setNewQuestion] = useState("");
  const [newAnswer, setNewAnswer] = useState("");

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
        setAllProducts(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error(err);
      }
    };
    fetchAllProducts();
  }, []);

  if (!user || user.role !== 'admin') {
    navigate('/');
    return null;
  }

  // Handle local image file previews
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setImage(file);
      setImagePreview(URL.createObjectURL(file));
    }
  };

  const addGalleryUrl = () => {
    if (!newGalleryUrl.trim()) return;
    setGalleryUrls([...galleryUrls, newGalleryUrl.trim()]);
    setNewGalleryUrl("");
    toast.success("Gallery URL added!");
  };

  const removeGalleryUrl = (index) => {
    setGalleryUrls(galleryUrls.filter((_, i) => i !== index));
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

  const addNoteInSet = () => {
    if (!noteTitleInput.trim()) return;
    setNotesInSet([...notesInSet, {
      title: noteTitleInput.trim(),
      image: noteImageInput.trim(),
      note1: noteVal1Input.trim(),
      note2: noteVal2Input.trim(),
      note3: noteVal3Input.trim()
    }]);
    setNoteTitleInput("");
    setNoteImageInput("");
    setNoteVal1Input("");
    setNoteVal2Input("");
    setNoteVal3Input("");
    toast.success("Set Note card added!");
  };

  const removeNoteInSet = (index) => {
    setNotesInSet(notesInSet.filter((_, i) => i !== index));
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

    if (Number(formData.originalPrice) < Number(formData.price)) {
      toast.error("Original Price must be greater than Price");
      return;
    }

    if (!image) {
      toast.error('Please select a primary product image');
      return;
    }

    setLoading(true);
    const data = new FormData();
    data.append('name', formData.name);
    data.append('slug', formData.slug || formData.name.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, ''));
    data.append('brand', formData.brand);
    data.append('description', formData.description);
    data.append('price', formData.price);
    data.append('category', formData.category);
    data.append('stock', formData.stock);
    data.append('sku', formData.sku);
    data.append('originalPrice', formData.originalPrice);
    data.append('image', image);
    
    // Gifting configuration fields
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
    data.append('productHighlights', formData.productHighlights);
    data.append('otherInformation', formData.otherInformation);
    data.append('isBestSeller', formData.isBestSeller);
    data.append('isNewArrival', formData.isNewArrival);
    data.append('isActive', formData.isActive);
    
    // Redesign Lists
    data.append('gallery', JSON.stringify(galleryUrls));
    data.append('trustBadges', JSON.stringify(trustBadges));
    data.append('notesInSet', JSON.stringify(notesInSet));
    data.append('faq', JSON.stringify(faqs));
    data.append('comboProducts', JSON.stringify(comboProductsList));

    const wearTagsArr = wearTagsInput.split(',').map(t => t.trim()).filter(Boolean);
    data.append('wearTags', JSON.stringify(wearTagsArr));

    const seoPayload = {
      metaTitle: formData.metaTitle || formData.name,
      metaDescription: formData.metaDescription || formData.description.substring(0, 150),
      metaKeywords: formData.metaKeywords
    };
    data.append('seo', JSON.stringify(seoPayload));

    const calculatedDiscount = formData.originalPrice > formData.price 
      ? Math.round(((formData.originalPrice - formData.price) / formData.originalPrice) * 100)
      : 0;
    data.append('discountPercentage', calculatedDiscount);

    try {
      const res = await axios.post('/api/products', data, {
        headers: {
          Authorization: `Bearer ${user.token}`,
          'Content-Type': 'multipart/form-data'
        }
      });

      toast.success('Product created successfully!');
      navigate('/admin/products');
    } catch (error) {
      console.error(error);
      const errMsg = error.response?.data?.message || 'Failed to create product';
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
            <p>Publish premium skincare cosmetics items with rich page blocks.</p>
          </div>
        </div>

        <div className="admin-form-card" style={{ maxWidth: "900px" }}>
          <form onSubmit={handleSubmit}>
            
            {/* Basic Info Row 1 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
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
                <label>Slug (URL key)</label>
                <input
                  type="text"
                  className="admin-form-input"
                  placeholder="e.g. anti-aging-serum"
                  value={formData.slug}
                  onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label>Brand</label>
                <input
                  type="text"
                  className="admin-form-input"
                  required
                  value={formData.brand}
                  onChange={(e) => setFormData({ ...formData, brand: e.target.value })}
                />
              </div>
            </div>

            {/* Row 2 */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "16px" }}>
              <div className="admin-form-group">
                <label>SKU</label>
                <input
                  type="text"
                  className="admin-form-input"
                  placeholder="e.g. VEN-SUN-100"
                  value={formData.sku}
                  onChange={(e) => setFormData({ ...formData, sku: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label>Short Subtitle</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={formData.subtitle}
                  onChange={(e) => setFormData({ ...formData, subtitle: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label>Short Tagline</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={formData.tagline}
                  onChange={(e) => setFormData({ ...formData, tagline: e.target.value })}
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

            {/* Toggles */}
            <div style={{ display: "flex", gap: "24px", margin: "16px 0", flexWrap: "wrap" }}>
              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.isBestSeller}
                  onChange={(e) => setFormData({ ...formData, isBestSeller: e.target.checked })}
                  style={{ width: "18px", height: "18px", accentColor: "#C9A063" }}
                />
                Mark Bestseller
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.isNewArrival}
                  onChange={(e) => setFormData({ ...formData, isNewArrival: e.target.checked })}
                  style={{ width: "18px", height: "18px", accentColor: "#C9A063" }}
                />
                Mark New Arrival
              </label>

              <label style={{ display: "flex", alignItems: "center", gap: "8px", cursor: "pointer" }}>
                <input
                  type="checkbox"
                  checked={formData.isActive}
                  onChange={(e) => setFormData({ ...formData, isActive: e.target.checked })}
                  style={{ width: "18px", height: "18px", accentColor: "#C9A063" }}
                />
                Active (Show on Shop Catalog)
              </label>
            </div>

            {/* Media Upload & Gallery URLs */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", margin: "20px 0" }}>
              <div className="admin-form-group" style={{ borderRight: "1px solid #ECECEC", paddingRight: "16px" }}>
                <label>Primary Image (Local Upload File)</label>
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
                <label>Additional Gallery URLs (Bellavita Multi-Image Carousel)</label>
                <div style={{ display: "flex", gap: "8px" }}>
                  <input
                    type="text"
                    className="admin-form-input"
                    placeholder="https://images.unsplash.com/..."
                    value={newGalleryUrl}
                    onChange={(e) => setNewGalleryUrl(e.target.value)}
                  />
                  <button type="button" onClick={addGalleryUrl} style={{ background: "#C8A165", color: "#FFFFFF", padding: "0 16px", border: "none", borderRadius: "8px", cursor: "pointer" }}>+</button>
                </div>
                <div style={{ display: "flex", gap: "6px", flexWrap: "wrap", marginTop: "10px" }}>
                  {galleryUrls.map((url, idx) => (
                    <div key={idx} style={{ position: "relative", width: "50px", height: "50px", border: "1px solid #ECECEC", borderRadius: "6px", overflow: "hidden" }}>
                      <img src={url} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                      <button type="button" onClick={() => removeGalleryUrl(idx)} style={{ position: "absolute", top: 0, right: 0, background: "rgba(0,0,0,0.6)", color: "#FFF", border: "none", fontSize: "9px", cursor: "pointer" }}>x</button>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Badges Multi-select mock */}
            <div className="admin-form-group">
              <label>Trust Badges Selection (IFRA, Oils etc.)</label>
              <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                {["Imported Oils", "Cruelty-Free", "IFRA Certified", "Assured Delivery", "100% Vegan", "Secure Payment"].map((badge) => {
                  const exists = trustBadges.includes(badge);
                  return (
                    <button
                      type="button"
                      key={badge}
                      onClick={() => {
                        if (exists) {
                          setTrustBadges(trustBadges.filter(b => b !== badge));
                        } else {
                          setTrustBadges([...trustBadges, badge]);
                        }
                      }}
                      style={{
                        padding: "6px 12px",
                        borderRadius: "20px",
                        border: exists ? "1px solid #C8A165" : "1px solid #EAEAEA",
                        background: exists ? "#FAF7F2" : "#FFFFFF",
                        color: exists ? "#C8A165" : "#1B1B1B",
                        cursor: "pointer",
                        fontSize: "12.5px"
                      }}
                    >
                      {exists ? "✓ " : ""} {badge}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Accordion text fields */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", margin: "20px 0" }}>
              <div className="admin-form-group">
                <label>Product Highlights Accordion Block (Rich Text / Description)</label>
                <textarea
                  className="admin-form-input"
                  rows="3"
                  value={formData.productHighlights}
                  onChange={(e) => setFormData({ ...formData, productHighlights: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label>How to Use Accordion Block</label>
                <textarea
                  className="admin-form-input"
                  rows="3"
                  value={formData.howToUse}
                  onChange={(e) => setFormData({ ...formData, howToUse: e.target.value })}
                />
              </div>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", margin: "20px 0" }}>
              <div className="admin-form-group">
                <label>All Ingredients Accordion Block</label>
                <textarea
                  className="admin-form-input"
                  rows="3"
                  value={formData.ingredients}
                  onChange={(e) => setFormData({ ...formData, ingredients: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label>Other Information Accordion Block</label>
                <textarea
                  className="admin-form-input"
                  rows="3"
                  value={formData.otherInformation}
                  onChange={(e) => setFormData({ ...formData, otherInformation: e.target.value })}
                />
              </div>
            </div>

            {/* Notes In This Set */}
            <div style={{ border: "1px solid #ECECEC", borderRadius: "12px", padding: "16px", margin: "20px 0", background: "#FAFAFA" }}>
              <h4 style={{ margin: "0 0 12px 0", fontFamily: "Cinzel, serif" }}>Notes in This Set (Bellavita Style Cards)</h4>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "12px", marginBottom: "12px" }}>
                <input type="text" placeholder="Note Card Title (e.g. Vanilla Musk)" className="admin-form-input" value={noteTitleInput} onChange={(e) => setNoteTitleInput(e.target.value)} />
                <input type="text" placeholder="Card Image URL" className="admin-form-input" value={noteImageInput} onChange={(e) => setNoteImageInput(e.target.value)} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                <input type="text" placeholder="Sub-note 1 (e.g. Top Note: Honey)" className="admin-form-input" value={noteVal1Input} onChange={(e) => setNoteVal1Input(e.target.value)} />
                <input type="text" placeholder="Sub-note 2 (e.g. Heart Note: Jasmine)" className="admin-form-input" value={noteVal2Input} onChange={(e) => setNoteVal2Input(e.target.value)} />
                <input type="text" placeholder="Sub-note 3 (e.g. Base Note: Amber)" className="admin-form-input" value={noteVal3Input} onChange={(e) => setNoteVal3Input(e.target.value)} />
              </div>
              <button type="button" onClick={addNoteInSet} style={{ background: "#111112", color: "#FFFFFF", padding: "10px 16px", border: "none", borderRadius: "8px", cursor: "pointer", width: "100%", fontWeight: "700" }}>Add Note Card</button>
              
              <div style={{ display: "flex", gap: "10px", flexWrap: "wrap", marginTop: "12px" }}>
                {notesInSet.map((item, idx) => (
                  <div key={idx} style={{ background: "#FFFFFF", padding: "12px", borderRadius: "8px", border: "1px solid #EAEAEA", display: "flex", flexDirection: "column", gap: "4px", minWidth: "150px", position: "relative" }}>
                    <strong style={{ fontSize: "13px" }}>{item.title}</strong>
                    <span style={{ fontSize: "11px", color: "#6B6B6B" }}>1. {item.note1}</span>
                    <span style={{ fontSize: "11px", color: "#6B6B6B" }}>2. {item.note2}</span>
                    <button type="button" onClick={() => removeNoteInSet(idx)} style={{ position: "absolute", top: "4px", right: "4px", color: "#ef4444", border: "none", background: "none", cursor: "pointer", fontWeight: "700" }}>x</button>
                  </div>
                ))}
              </div>
            </div>

            {/* FAQ Row Builder */}
            <div style={{ border: "1px solid #ECECEC", borderRadius: "12px", padding: "16px", margin: "20px 0", background: "#FAFAFA" }}>
              <h4 style={{ margin: "0 0 10px 0", fontFamily: "Cinzel, serif" }}>FAQ Manager</h4>
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

            {/* Where to wear tags */}
            <div className="admin-form-group">
              <label>Where To Wear It (Comma separated tags)</label>
              <input
                type="text"
                className="admin-form-input"
                placeholder="e.g. Event, Party, Date, Office"
                value={wearTagsInput}
                onChange={(e) => setWearTagsInput(e.target.value)}
              />
            </div>

            {/* Combos product selector */}
            <div style={{ border: "1px solid #ECECEC", borderRadius: "12px", padding: "16px", margin: "20px 0", background: "#FAFAFA" }}>
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

            {/* SEO Section */}
            <div style={{ border: "1px solid #ECECEC", borderRadius: "12px", padding: "16px", margin: "20px 0", background: "#FAFAFA" }}>
              <h4 style={{ margin: "0 0 12px 0", fontFamily: "Cinzel, serif" }}>SEO Settings</h4>
              <div className="admin-form-group">
                <label>Meta Title</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={formData.metaTitle}
                  onChange={(e) => setFormData({ ...formData, metaTitle: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label>Meta Description</label>
                <textarea
                  className="admin-form-input"
                  rows="2"
                  value={formData.metaDescription}
                  onChange={(e) => setFormData({ ...formData, metaDescription: e.target.value })}
                />
              </div>

              <div className="admin-form-group">
                <label>Meta Keywords (Comma separated)</label>
                <input
                  type="text"
                  className="admin-form-input"
                  value={formData.metaKeywords}
                  onChange={(e) => setFormData({ ...formData, metaKeywords: e.target.value })}
                />
              </div>
            </div>

            <div style={{ marginTop: "30px", display: "flex", gap: "12px" }}>
              <button type="submit" className="btn-admin-primary" disabled={loading}>
                {loading ? "Creating..." : "Save Product"}
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

export default AddProduct;
