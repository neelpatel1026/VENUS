import { useEffect, useState, useContext } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { addToCart } from "../redux/cartSlice";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import { 
  LuGift, 
  LuSparkles, 
  LuCheck, 
  LuX, 
  LuInfo, 
  LuPenTool, 
  LuCalendar,
  LuShoppingBag
} from "react-icons/lu";
import "../styles/gifting.css";

const OCCASIONS = [
  "Birthday",
  "Anniversary",
  "Wedding",
  "Festival",
  "Self Care",
  "Thank You"
];

const Gifting = () => {
  const dispatch = useDispatch();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedOccasion, setSelectedOccasion] = useState("");
  
  // Customization Modal states
  const [activeProduct, setActiveProduct] = useState(null);
  const [giftWrap, setGiftWrap] = useState(false);
  const [giftBox, setGiftBox] = useState(false);
  const [giftReceipt, setGiftReceipt] = useState(false);
  const [giftMessage, setGiftMessage] = useState("");

  const fetchProducts = async () => {
    try {
      const res = await fetch("/api/products");
      const data = await res.json();
      // Filter for items marked as giftable
      const giftable = Array.isArray(data) 
        ? data.filter(p => p.availableAsGift === true)
        : [];
      setProducts(giftable);
    } catch (err) {
      console.error(err);
      toast.error("Failed to load luxury gift collections");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const handleOpenCustomize = (product) => {
    // Reset options
    setActiveProduct(product);
    setGiftWrap(false);
    setGiftBox(false);
    setGiftReceipt(false);
    setGiftMessage("");
  };

  const handleAddToCart = () => {
    if (!activeProduct) return;

    if (activeProduct.stock <= 0) {
      toast.error("This collection is temporarily out of stock");
      return;
    }

    const cartPayload = {
      productId: activeProduct._id,
      productName: activeProduct.name,
      productImage: activeProduct.imageUrl,
      qty: 1,
      price: activeProduct.price,
      stock: activeProduct.stock,
      // Gifting flags
      isGift: true,
      giftWrap,
      giftBox,
      giftReceipt,
      giftMessage: giftWrap || giftBox || giftReceipt ? giftMessage : ""
    };

    dispatch(addToCart(cartPayload));
    toast.success(`${activeProduct.name} added to your shopping bag!`);
    setActiveProduct(null);
  };

  // Chip filtration matches names, categories, tags or descriptions containing occasion word
  const filteredProducts = products.filter(p => {
    if (!selectedOccasion) return true;
    const key = selectedOccasion.toLowerCase();
    return p.name.toLowerCase().includes(key) || 
           p.description.toLowerCase().includes(key) || 
           p.category.toLowerCase().includes(key) || 
           (p.giftBadgeText && p.giftBadgeText.toLowerCase().includes(key));
  });

  if (loading) {
    return (
      <div className="gifting-container route-fade-in" style={{ padding: "40px 20px" }}>
        <div className="gifting-header" style={{ textAlign: "center", marginBottom: "30px" }}>
          <div className="shimmer-bg" style={{ height: "32px", width: "240px", margin: "0 auto 12px auto", borderRadius: "4px" }} />
          <div className="shimmer-bg" style={{ height: "16px", width: "340px", margin: "0 auto", borderRadius: "4px" }} />
        </div>
        <div className="gifting-chips-container" style={{ display: "flex", gap: "10px", justifyContent: "center", overflowX: "auto", padding: "10px 0" }}>
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="shimmer-bg" style={{ height: "38px", width: "90px", borderRadius: "20px", flexShrink: 0 }} />
          ))}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "24px", marginTop: "30px" }}>
          {[1, 2, 3, 4].map((i) => (
            <div key={i} style={{ border: "1px solid #ECE7DF", background: "#FFFFFF", padding: "16px", borderRadius: "16px" }}>
              <div className="shimmer-bg" style={{ height: "240px", width: "100%", borderRadius: "12px", marginBottom: "16px" }} />
              <div className="shimmer-bg skeleton-text-line" />
              <div className="shimmer-bg skeleton-text-line short" />
              <div className="shimmer-bg" style={{ height: "40px", width: "100%", borderRadius: "8px", marginTop: "16px" }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="gifting-container route-fade-in">
      
      {/* HEADER BAR */}
      <div className="gifting-header">
        <h1 className="gifting-title">Luxury Gift Collection</h1>
        <p className="gifting-subtitle">
          Beautifully packaged skincare and fragrance gifts for every special occasion.
        </p>
      </div>

      {/* LUXURY OCCASION CHIPS */}
      <div className="gifting-chips-container">
        <button 
          className={`gifting-chip ${!selectedOccasion ? "active" : ""}`}
          onClick={() => setSelectedOccasion("")}
        >
          All Collections
        </button>
        {OCCASIONS.map(oc => (
          <button 
            key={oc}
            className={`gifting-chip ${selectedOccasion === oc ? "active" : ""}`}
            onClick={() => setSelectedOccasion(selectedOccasion === oc ? "" : oc)}
          >
            {oc}
          </button>
        ))}
      </div>

      {/* LUXURY PRODUCTS GRID */}
      {filteredProducts.length > 0 ? (
        <div className="gifting-grid">
          {filteredProducts.map(product => {
            const hasDiscount = product.originalPrice > product.price;
            const discountPercent = hasDiscount 
              ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
              : 0;

            const hasPackaging = product.giftWrapAvailable || product.luxuryGiftBoxAvailable;

            return (
              <div className="gift-card" key={product._id}>
                
                {/* Image panel */}
                <div className="gift-card-image-box">
                  {/* Luxury badge */}
                  <span className="gift-badge-exclusive">
                    {product.giftBadgeText || "Luxury Collection"}
                  </span>
                  
                  <img 
                    src={product.imageUrl || "/cosmetic_1.avif"} 
                    alt={product.name} 
                    className="gift-card-image"
                    onError={(e) => { e.target.src = "/cosmetic_1.avif"; }}
                  />
                </div>

                {/* Card body */}
                <div className="gift-card-body">
                  <h3 className="gift-card-title">{product.name}</h3>
                  <p className="gift-card-desc">{product.description}</p>

                  {/* Packaging tag */}
                  {hasPackaging && (
                    <span className="gift-badge-packaging">
                      ✨ Gift Box & Wrap Available
                    </span>
                  )}

                  {/* Pricing row */}
                  <div className="gift-card-pricing">
                    <span className="gift-card-price">₹{product.price.toFixed(2)}</span>
                    {hasDiscount && (
                      <>
                        <span className="gift-card-original-price">₹{product.originalPrice.toFixed(2)}</span>
                        <span style={{ fontSize: "12px", color: "#16A34A", fontWeight: "700" }}>
                          ({discountPercent}% OFF)
                        </span>
                      </>
                    )}
                  </div>

                  {/* Add Button */}
                  <button 
                    onClick={() => handleOpenCustomize(product)} 
                    className="btn-gift-add"
                    type="button"
                  >
                    Configure Gift
                  </button>
                </div>

              </div>
            );
          })}
        </div>
      ) : (
        /* ELEGANT EMPTY STATE */
        <div className="gift-empty-state">
          <span className="gift-empty-icon">🎁</span>
          <h2 className="gift-empty-title">No Gift Collections Available</h2>
          <p className="gift-empty-desc">
            New luxury gift collections will arrive soon.
          </p>
          <Link to="/shop" className="btn-gift-continue">
            Continue Shopping
          </Link>
        </div>
      )}

      {/* GIFT CUSTOMIZATION MODAL */}
      {activeProduct && (
        <div className="gift-modal-overlay">
          <div className="gift-modal">
            <button 
              className="gift-modal-close" 
              onClick={() => setActiveProduct(null)}
              type="button"
            >
              <LuX />
            </button>

            <h3 className="gift-modal-title">Customize Gift</h3>
            <p className="gift-modal-subtitle">
              Select premium enhancements to add a bespoke finishing touch to your gift.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
              
              {/* Option: Wrap */}
              {activeProduct.giftWrapAvailable && (
                <label className="gift-option-group">
                  <input
                    type="checkbox"
                    checked={giftWrap}
                    onChange={(e) => setGiftWrap(e.target.checked)}
                    className="gift-option-input"
                  />
                  <div className="gift-option-label">
                    <span className="gift-option-title">Luxury Gift Wrap</span>
                    <span className="gift-option-desc">
                      Beautiful satin ribbon and textured eco-friendly gold foliage wrapping paper.
                    </span>
                  </div>
                </label>
              )}

              {/* Option: Luxury Gift Box */}
              {activeProduct.luxuryGiftBoxAvailable && (
                <label className="gift-option-group">
                  <input
                    type="checkbox"
                    checked={giftBox}
                    onChange={(e) => setGiftBox(e.target.checked)}
                    className="gift-option-input"
                  />
                  <div className="gift-option-label">
                    <span className="gift-option-title">Premium Keepsake Gift Box</span>
                    <span className="gift-option-desc">
                      Rigid gold-stamped sliding drawer box with soft velvet lining.
                    </span>
                  </div>
                </label>
              )}

              {/* Option: Gift Receipt */}
              <label className="gift-option-group">
                <input
                  type="checkbox"
                  checked={giftReceipt}
                  onChange={(e) => setGiftReceipt(e.target.checked)}
                  className="gift-option-input"
                />
                <div className="gift-option-label">
                  <span className="gift-option-title">Gift Receipt (Hide Prices)</span>
                  <span className="gift-option-desc">
                    Hides the product unit prices and order totals from the print invoice inside parcel.
                  </span>
                </div>
              </label>

              {/* Textarea: Personalized Message */}
              {activeProduct.giftMessageAllowed && (
                <div className="gift-textarea-container" style={{ marginTop: "10px" }}>
                  <label className="gift-textarea-label">Personalized Gift Message</label>
                  <textarea
                    rows="3"
                    className="gift-textarea"
                    placeholder="Write a warm note for your loved one..."
                    value={giftMessage}
                    onChange={(e) => setGiftMessage(e.target.value.slice(0, 150))}
                  />
                  <div className="gift-char-counter">
                    {giftMessage.length} / 150 Characters
                  </div>
                </div>
              )}

            </div>

            {/* Modal Actions */}
            <div style={{ marginTop: "24px", display: "flex", gap: "12px" }}>
              <button 
                onClick={handleAddToCart}
                className="btn-gift-add"
                style={{ flex: 2 }}
                type="button"
              >
                Add Gift To Bag
              </button>
              <button 
                onClick={() => setActiveProduct(null)}
                className="btn-gift-add"
                style={{ flex: 1, background: "#F8F5EF", color: "#1A1A1A" }}
                type="button"
              >
                Cancel
              </button>
            </div>

          </div>
        </div>
      )}

    </div>
  );
};

export default Gifting;
