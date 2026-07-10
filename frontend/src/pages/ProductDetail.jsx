import { useEffect, useState, useContext } from "react";
import { useParams, Link } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart, removeFromCart } from "../redux/cartSlice";
import toast from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";
import { HiStar, HiCheckCircle, HiChevronDown, HiChevronUp } from "react-icons/hi";
import "../styles/product.css";

const ProductDetail = () => {
  const { id } = useParams();
  const { user } = useContext(AuthContext);
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openFaq, setOpenFaq] = useState(null);

  const dispatch = useDispatch();

  // Fetch Product
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await fetch(`/api/products/${id}`);
        if (!res.ok) {
          throw new Error("Failed to fetch product");
        }
        const data = await res.json();
        setProduct(data);
      } catch (err) {
        console.error(err);
        setError("Failed to load product");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // Add To Cart
  const handleAddToCart = () => {
    if (!product || product.stock === 0) return;

    dispatch(
      addToCart({
        productId: product._id,
        name: product.name,
        price: product.price,
        imageUrl: product.imageUrl,
        stock: product.stock,
        qty: 1,
      }),
    );

    toast((t) => (
      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
        <span style={{ fontWeight: "600" }}>Added {product.name} to cart!</span>
        <button
          onClick={() => {
            dispatch(removeFromCart(product._id));
            toast.dismiss(t.id);
            toast.success("Add to cart undone", { id: "cart-undo" });
          }}
          className="toast-action-btn"
          style={{ alignSelf: "flex-start", background: "#C8A165", color: "#fff", border: "none", padding: "4px 8px", borderRadius: "4px", fontSize: "0.75rem", cursor: "pointer" }}
        >
          Undo Add
        </button>
      </div>
    ), {
      duration: 5000,
      icon: "🎉",
    });
  };

  const getStageClass = (index) => {
    return openFaq === index;
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  // Loading UI
  if (loading) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0", color: "#C8A165", fontSize: "20px" }}>
        Loading Product...
      </div>
    );
  }

  // Error UI
  if (error || !product) {
    return (
      <div style={{ textAlign: "center", padding: "100px 0", color: "#ef4444", fontSize: "20px" }}>
        {error || "Product Not Found"}
      </div>
    );
  }

  const discount =
    product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;

  return (
    <div className="product-detail-wrapper" style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" }}>
      {/* Breadcrumb */}
      <div style={{ color: "#6B7280", marginBottom: "30px", fontSize: "0.85rem", letterSpacing: "0.5px" }}>
        <Link to="/" style={{ color: "#C8A165", textDecoration: "none" }}>Home</Link>
        {" / "}
        <Link to="/shop" style={{ color: "#C8A165", textDecoration: "none" }}>Shop</Link>
        {" / "}
        {product.category}
        {" / "}
        <span style={{ color: "#1F2937", fontWeight: "600" }}>{product.name}</span>
      </div>

      {/* Main product detail */}
      <div className="product-detail">
        {/* Left Column: Image wrapper */}
        <div className="detail-image-container" style={{ position: "sticky", top: "120px" }}>
          {discount > 0 && (
            <span className="discount-badge" style={{ top: "20px", left: "20px" }}>
              {discount}% OFF
            </span>
          )}
          <img
            src={product.imageUrl}
            alt={product.name}
            className="detail-image"
          />
        </div>

        {/* Right Column: Info and Purchase panel */}
        <div className="detail-info" style={{ gap: "24px" }}>
          <div>
            <span style={{ color: "#8B7355", fontSize: "0.8rem", letterSpacing: "2px", textTransform: "uppercase", fontWeight: "700" }}>
              {product.category}
            </span>
            <h1 style={{ fontSize: "2.4rem", fontWeight: "700", color: "#1F2937", margin: "8px 0 12px 0", lineHeight: "1.2" }}>
              {product.name}
            </h1>
            
            {/* Stars & Reviews */}
            <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "0.9rem", color: "#F59E0B" }}>
              <HiStar style={{ width: "18px", height: "18px" }} />
              <strong style={{ color: "#1F2937" }}>{product.rating || 4.8}</strong>
              <span style={{ color: "#6B7280" }}>({product.reviewCount || 245} reviews)</span>
              <span style={{ color: "#C8A165", margin: "0 8px" }}>|</span>
              <span style={{ color: "#10B981", fontWeight: "600" }}>Verified Buyer Trust</span>
            </div>
          </div>

          {/* Pricing Details */}
          <div style={{ background: "#FAF7F2", padding: "20px 24px", borderRadius: "16px", border: "1px solid #E8DFD2" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "12px" }}>
              <span className="detail-price" style={{ color: "#1F2937" }}>₹{product.price.toFixed(2)}</span>
              {discount > 0 && (
                <>
                  <span style={{ textDecoration: "line-through", color: "#9CA3AF", fontSize: "1.25rem" }}>
                    ₹{product.originalPrice.toFixed(2)}
                  </span>
                  <span style={{ color: "#16A34A", fontSize: "0.95rem", fontWeight: "700" }}>
                    Save ₹{(product.originalPrice - product.price).toFixed(2)}
                  </span>
                </>
              )}
            </div>
            <p style={{ margin: "8px 0 0 0", fontSize: "0.8rem", color: "#6B7280" }}>Inclusive of all taxes</p>
          </div>

          {/* Description */}
          <div>
            <h3 style={{ fontSize: "1.1rem", fontWeight: "700", color: "#1F2937", marginBottom: "10px" }}>
              Product Formula Overview
            </h3>
            <p style={{ color: "#6B7280", lineHeight: "1.8", margin: 0 }}>
              {product.description}
            </p>
          </div>

          {/* Actions */}
          <div>
            {user?.role !== "admin" && (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {product.stock === 0 ? (
                  <button
                    disabled
                    className="add-to-cart-btn"
                    style={{ background: "#9CA3AF", cursor: "not-allowed" }}
                  >
                    Out Of Stock
                  </button>
                ) : (
                  <button
                    onClick={handleAddToCart}
                    className="add-to-cart-btn"
                    style={{ background: "#C8A165", padding: "18px", fontSize: "1rem", borderRadius: "14px", transition: "0.3s" }}
                  >
                    Add to Shopping Cart
                  </button>
                )}
              </div>
            )}
            
            <p style={{ marginTop: "12px", fontSize: "0.9rem", color: product.stock > 0 ? "#10B981" : "#EF4444", fontWeight: "600", display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: product.stock > 0 ? "#10B981" : "#EF4444" }}></span>
              {product.stock > 0
                ? `In Stock (${product.stock} items remaining)`
                : `Temporarily Out of Stock`}
            </p>
          </div>

          {/* Delivery & Timeline metadata */}
          <div style={{ borderTop: "1px solid #ECE6DC", paddingTop: "20px" }}>
            <h4 style={{ fontSize: "0.95rem", fontWeight: "700", color: "#1F2937", marginBottom: "12px" }}>Fulfillment Information</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", fontSize: "0.85rem", color: "#4B5563" }}>
              <div>🚚 Delivery ETA: <strong>3-4 business days</strong></div>
              <div>🛡️ Return Policy: <strong>7-Days Returns</strong></div>
              <div>⚡ Payments: <strong>COD & Online available</strong></div>
              <div>✨ Brand Purity: <strong>100% Authentic Product</strong></div>
            </div>
          </div>
        </div>
      </div>

      {/* Highlights checklist & How to use below details */}
      <div style={{ marginTop: "60px", display: "grid", gridTemplateColumns: "1fr 1.2fr", gap: "50px" }}>
        
        {/* Why choose us */}
        <div style={{ background: "#FAF7F2", padding: "35px", borderRadius: "24px", border: "1px solid #E8DFD2" }}>
          <h3 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#1F2937", marginBottom: "20px" }}>Formula Standards</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <HiCheckCircle style={{ color: "#C8A165", width: "22px", height: "22px" }} />
              <span style={{ fontSize: "0.95rem", color: "#4B5563" }}>Dermatologically Tested Purity</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <HiCheckCircle style={{ color: "#C8A165", width: "22px", height: "22px" }} />
              <span style={{ fontSize: "0.95rem", color: "#4B5563" }}>100% Cruelty Free & Vegan-Grade</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <HiCheckCircle style={{ color: "#C8A165", width: "22px", height: "22px" }} />
              <span style={{ fontSize: "0.95rem", color: "#4B5563" }}>Formulated without Parabens or Sulfates</span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              <HiCheckCircle style={{ color: "#C8A165", width: "22px", height: "22px" }} />
              <span style={{ fontSize: "0.95rem", color: "#4B5563" }}>Hydrating active ingredients suited for sensitive skin</span>
            </div>
          </div>
        </div>

        {/* How to use */}
        <div>
          <h3 style={{ fontSize: "1.25rem", fontWeight: "700", color: "#1F2937", marginBottom: "20px" }}>How to Apply</h3>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#C8A165", color: "#fff", display: "flex", alignItems: "center", justifyCenter: "center", flexShrink: 0, fontWeight: "700", fontSize: "0.9rem", justifyContent: "center" }}>1</div>
              <div>
                <h4 style={{ margin: "0 0 4px 0", fontSize: "0.95rem", color: "#1F2937" }}>Dispense Application</h4>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#6B7280", lineHeight: "1.5" }}>Take a small coin-sized drop onto dry fingertips.</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#C8A165", color: "#fff", display: "flex", alignItems: "center", justifyCenter: "center", flexShrink: 0, fontWeight: "700", fontSize: "0.9rem", justifyContent: "center" }}>2</div>
              <div>
                <h4 style={{ margin: "0 0 4px 0", fontSize: "0.95rem", color: "#1F2937" }}>Massage Skin</h4>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#6B7280", lineHeight: "1.5" }}>Gently sweep over face and neck area in smooth upward circular motions.</p>
              </div>
            </div>
            <div style={{ display: "flex", gap: "16px" }}>
              <div style={{ width: "30px", height: "30px", borderRadius: "50%", background: "#C8A165", color: "#fff", display: "flex", alignItems: "center", justifyCenter: "center", flexShrink: 0, fontWeight: "700", fontSize: "0.9rem", justifyContent: "center" }}>3</div>
              <div>
                <h4 style={{ margin: "0 0 4px 0", fontSize: "0.95rem", color: "#1F2937" }}>Absorb Thoroughly</h4>
                <p style={{ margin: 0, fontSize: "0.85rem", color: "#6B7280", lineHeight: "1.5" }}>Let formula sit for 1 minute before following up with sunscreen or beauty tools.</p>
              </div>
            </div>
          </div>
        </div>

      </div>

      {/* Accordion FAQ section */}
      <div style={{ marginTop: "60px", borderTop: "1px solid #ECE6DC", paddingTop: "40px" }}>
        <h3 style={{ fontSize: "1.4rem", fontWeight: "700", color: "#1F2937", marginBottom: "25px", textAlign: "center" }}>Frequently Asked Questions</h3>
        <div style={{ maxWidth: "800px", margin: "0 auto", display: "flex", flexDirection: "column", gap: "12px" }}>
          
          {/* FAQ 1 */}
          <div style={{ border: "1px solid #E8DFD2", borderRadius: "12px", overflow: "hidden" }}>
            <button
              onClick={() => toggleFaq(0)}
              style={{ width: "100%", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FAF7F2", border: "none", cursor: "pointer", outline: "none", textAlign: "left" }}
            >
              <span style={{ fontSize: "0.95rem", fontWeight: "600", color: "#1F2937" }}>Is this formula suitable for sensitive skin?</span>
              {getStageClass(0) ? <HiChevronUp style={{ width: "20px", height: "20px" }} /> : <HiChevronDown style={{ width: "20px", height: "20px" }} />}
            </button>
            {getStageClass(0) && (
              <div style={{ padding: "16px 20px", background: "#fff", borderTop: "1px solid #E8DFD2", fontSize: "0.9rem", color: "#6B7280", lineHeight: "1.6" }}>
                Yes, VENUS CARE formulations undergo clinical checks and are blended without harsh parabens, toxic sulfates, or artificial fragrances.
              </div>
            )}
          </div>

          {/* FAQ 2 */}
          <div style={{ border: "1px solid #E8DFD2", borderRadius: "12px", overflow: "hidden" }}>
            <button
              onClick={() => toggleFaq(1)}
              style={{ width: "100%", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FAF7F2", border: "none", cursor: "pointer", outline: "none", textAlign: "left" }}
            >
              <span style={{ fontSize: "0.95rem", fontWeight: "600", color: "#1F2937" }}>How long does delivery take?</span>
              {getStageClass(1) ? <HiChevronUp style={{ width: "20px", height: "20px" }} /> : <HiChevronDown style={{ width: "20px", height: "20px" }} />}
            </button>
            {getStageClass(1) && (
              <div style={{ padding: "16px 20px", background: "#fff", borderTop: "1px solid #E8DFD2", fontSize: "0.9rem", color: "#6B7280", lineHeight: "1.6" }}>
                Orders dispatch within 24 hours of confirmation and are delivered to destinations across India in 3 to 4 business days.
              </div>
            )}
          </div>

          {/* FAQ 3 */}
          <div style={{ border: "1px solid #E8DFD2", borderRadius: "12px", overflow: "hidden" }}>
            <button
              onClick={() => toggleFaq(2)}
              style={{ width: "100%", padding: "16px 20px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#FAF7F2", border: "none", cursor: "pointer", outline: "none", textAlign: "left" }}
            >
              <span style={{ fontSize: "0.95rem", fontWeight: "600", color: "#1F2937" }}>What is the returns and refund workflow?</span>
              {getStageClass(2) ? <HiChevronUp style={{ width: "20px", height: "20px" }} /> : <HiChevronDown style={{ width: "20px", height: "20px" }} />}
            </button>
            {getStageClass(2) && (
              <div style={{ padding: "16px 20px", background: "#fff", borderTop: "1px solid #E8DFD2", fontSize: "0.9rem", color: "#6B7280", lineHeight: "1.6" }}>
                If you are unsatisfied, you can request a return from your profile order section within 7 days of delivery.
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
};

export default ProductDetail;
