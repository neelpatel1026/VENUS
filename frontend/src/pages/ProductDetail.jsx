import { useEffect, useState, useContext } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart, removeFromCart } from "../redux/cartSlice";
import toast from "react-hot-toast";
import { HiStar, HiCheckCircle, HiChevronUp, HiChevronDown } from "react-icons/hi";
import { AuthContext } from "../context/AuthContext";
import { getOptimizedImageUrl } from "../utils/imageHelper.js";
import "../styles/product.css";

const ProductDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openFaq, setOpenFaq] = useState(null);

  // Reviews States
  const [reviews, setReviews] = useState([]);
  const [stats, setStats] = useState(null);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);
  const [sortBy, setSortBy] = useState("newest");
  const [eligible, setEligible] = useState(false);
  const [eligibleOrderId, setEligibleOrderId] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editReviewId, setEditReviewId] = useState(null);
  
  // Submit Modal Input States
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState("");
  const [reviewContent, setReviewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  // Fetch Reviews
  const fetchReviews = async (resetPage = false) => {
    try {
      const nextPage = resetPage ? 1 : page;
      const res = await fetch(`/api/reviews/product/${id}?page=${nextPage}&limit=5&sort=${sortBy}`);
      if (res.ok) {
        const data = await res.json();
        if (resetPage || nextPage === 1) {
          setReviews(data.reviews || []);
        } else {
          setReviews((prev) => [...prev, ...(data.reviews || [])]);
        }
        setStats(data.stats || null);
        setTotalPages(data.pagination?.pages || 1);
        setTotalCount(data.pagination?.total || 0);
        if (resetPage) setPage(1);
      }
    } catch (err) {
      console.error("Failed to load reviews:", err);
    }
  };

  // Check Eligibility
  const checkReviewEligibility = async () => {
    if (!user || !user.token) {
      setEligible(false);
      return;
    }
    try {
      const res = await fetch(`/api/reviews/check-eligibility?productId=${id}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      if (res.ok) {
        const data = await res.json();
        setEligible(data.eligible);
        if (data.eligible) {
          setEligibleOrderId(data.orderId);
        }
      }
    } catch (err) {
      console.error("Failed to verify eligibility:", err);
    }
  };

  useEffect(() => {
    fetchReviews(true);
  }, [id, sortBy]);

  useEffect(() => {
    if (page > 1) {
      fetchReviews(false);
    }
  }, [page]);

  useEffect(() => {
    checkReviewEligibility();
  }, [id, user]);

  useEffect(() => {
    if (searchParams.get("reviewModal") === "true") {
      const orderIdFromUrl = searchParams.get("orderId");
      if (orderIdFromUrl) {
        setEligibleOrderId(orderIdFromUrl);
        setEligible(true);
      }
      setShowModal(true);
    }
  }, [searchParams]);

  // Vote Helpful
  const handleHelpfulVote = async (reviewId) => {
    if (!user || !user.token) {
      toast.error("Please login to vote");
      return;
    }
    try {
      const res = await fetch(`/api/reviews/${reviewId}/helpful`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Voted as helpful! 👍");
        setReviews((prev) =>
          prev.map((r) =>
            r._id === reviewId
              ? { ...r, helpfulCount: data.helpfulCount, helpfulUsers: [...r.helpfulUsers, user._id] }
              : r
          )
        );
      } else {
        toast.error(data.message || "Failed to vote");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    }
  };

  // Submit Review Form
  const handleSubmitReview = async (e) => {
    e.preventDefault();
    if (reviewContent.trim().length < 20) {
      toast.error("Review must be at least 20 characters");
      return;
    }
    if (reviewContent.trim().length > 1000) {
      toast.error("Review must be under 1000 characters");
      return;
    }
    try {
      setSubmitting(true);
      const url = editReviewId ? `/api/reviews/${editReviewId}` : "/api/reviews";
      const method = editReviewId ? "PUT" : "POST";
      const activeOrderId = searchParams.get("orderId") || eligibleOrderId;
      const payload = editReviewId
        ? { rating, title, review: reviewContent }
        : { productId: id, orderId: activeOrderId, rating, title, review: reviewContent };

      const res = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (res.ok) {
        toast.success(editReviewId ? "Review updated!" : "Review submitted successfully! ✨");
        setShowModal(false);
        setEditReviewId(null);
        setTitle("");
        setReviewContent("");
        setRating(5);
        fetchReviews(true);
        checkReviewEligibility();
      } else {
        toast.error(data.message || "Failed to submit review");
      }
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    } finally {
      setSubmitting(false);
    }
  };

  const openWriteReviewModal = () => {
    setEditReviewId(null);
    setRating(5);
    setTitle("");
    setReviewContent("");
    setShowModal(true);
  };

  const openEditReviewModal = (reviewObj) => {
    setEditReviewId(reviewObj._id);
    setRating(reviewObj.rating);
    setTitle(reviewObj.title);
    setReviewContent(reviewObj.review);
    setShowModal(true);
  };

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

  if (loading) {
    return (
      <div className="product-detail-wrapper route-fade-in" style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" }}>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "40px" }}>
          <div>
            <div className="shimmer-bg" style={{ width: "100%", height: "400px", borderRadius: "20px" }} />
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="shimmer-bg" style={{ height: "12px", width: "80px", borderRadius: "4px" }} />
            <div className="shimmer-bg" style={{ height: "36px", width: "80%", borderRadius: "4px" }} />
            <div className="shimmer-bg" style={{ height: "24px", width: "150px", borderRadius: "4px" }} />
            <div className="shimmer-bg" style={{ height: "70px", width: "100%", borderRadius: "16px" }} />
            <div className="shimmer-bg" style={{ height: "100px", width: "100%", borderRadius: "12px" }} />
            <div className="shimmer-bg" style={{ height: "48px", width: "100%", borderRadius: "14px" }} />
          </div>
        </div>
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
    <div className="product-detail-wrapper route-fade-in" style={{ maxWidth: "1200px", margin: "0 auto", padding: "40px 20px" }}>
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
            src={getOptimizedImageUrl(product.imageUrl || product.image, 1000)}
            alt={product.name}
            className="detail-image"
            loading="lazy"
            onError={(e) => {
              e.target.src = "/cosmetic_1.avif";
            }}
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

      {/* Reviews Section */}
      <div className="reviews-section">
        <h3>Customer Reviews</h3>

        {/* Summary box */}
        <div className="reviews-summary-box">
          <div className="reviews-stats-left">
            <h2>{stats?.averageRating || 0}</h2>
            <div className="reviews-stars-row">
              {[...Array(5)].map((_, i) => (
                <HiStar
                  key={i}
                  style={{
                    color: i < Math.round(stats?.averageRating || 0) ? "#C8A165" : "#E5E7EB",
                  }}
                />
              ))}
            </div>
            <span className="reviews-count-sub">
              Based on {totalCount} verified reviews
            </span>
          </div>

          <div className="reviews-breakdown-right">
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = stats?.breakdown[stars] || 0;
              const pct = totalCount > 0 ? Math.round((count / totalCount) * 100) : 0;
              return (
                <div key={stars} className="rating-bar-row">
                  <span className="rating-star-label">
                    {stars} <HiStar style={{ color: "#C8A165" }} />
                  </span>
                  <div className="rating-progress-track">
                    <div className="rating-progress-bar" style={{ width: `${pct}%` }} />
                  </div>
                  <span className="rating-count-label">{pct}%</span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Feed Header */}
        <div className="reviews-feed-header">
          <h4>Reviews Feed</h4>

          <div className="reviews-feed-controls">
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
              className="reviews-sort-select"
            >
              <option value="newest">Newest First</option>
              <option value="highest">Highest Rating</option>
              <option value="lowest">Lowest Rating</option>
              <option value="helpful">Most Helpful</option>
            </select>

            {eligible && (
              <button onClick={openWriteReviewModal} className="btn-write-review-luxury">
                Write a Review
              </button>
            )}
          </div>
        </div>

        {/* Feed list */}
        {reviews.length === 0 ? (
          <div
            style={{
              textAlign: "center",
              padding: "40px",
              background: "#FFFFFF",
              border: "1px dashed #ECE7DF",
              borderRadius: "16px",
              color: "#6B7280",
            }}
          >
            No verified reviews have been submitted for this skincare product yet.
          </div>
        ) : (
          <div className="reviews-stack">
            {reviews.map((rev) => {
              const initialLetters = rev.customerName
                ? rev.customerName
                    .split(" ")
                    .map((n) => n[0])
                    .join("")
                    .slice(0, 2)
                    .toUpperCase()
                : "U";

              const diffTime = Math.abs(new Date() - new Date(rev.createdAt));
              const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
              const editable = user && user._id === rev.userId && diffDays <= 30;

              const hasVotedHelpful = user && Array.isArray(rev.helpfulUsers) && rev.helpfulUsers.includes(user._id);

              return (
                <div key={rev._id} className="review-card-item">
                  <div className="review-card-header">
                    <div className="review-user-row">
                      <div className="review-user-avatar">{initialLetters}</div>
                      <div className="review-user-details">
                        <h4>{rev.customerName}</h4>
                        {rev.isVerifiedPurchase && (
                          <span className="verified-purchase-badge">
                            ✓ Verified Purchase
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="review-stars-meta">
                      <div style={{ display: "flex", gap: "2px", color: "#C8A165", fontSize: "14px" }}>
                        {[...Array(5)].map((_, idx) => (
                          <HiStar
                            key={idx}
                            style={{
                              color: idx < rev.rating ? "#C8A165" : "#E5E7EB",
                            }}
                          />
                        ))}
                      </div>
                      <span className="review-meta-date">
                        {new Date(rev.createdAt).toLocaleDateString("en-IN", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                  </div>

                  <div className="review-card-content">
                    <h5>{rev.title}</h5>
                    <p>{rev.review}</p>
                  </div>

                  <div className="review-card-actions">
                    <button
                      onClick={() => handleHelpfulVote(rev._id)}
                      disabled={hasVotedHelpful}
                      className={`helpful-btn ${hasVotedHelpful ? "voted" : ""}`}
                    >
                      👍 Helpful ({rev.helpfulCount})
                    </button>

                    {editable && (
                      <span onClick={() => openEditReviewModal(rev)} className="edit-review-link">
                        Edit Review
                      </span>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* Load More pagination */}
        {page < totalPages && (
          <button
            onClick={() => setPage((prev) => prev + 1)}
            className="btn-load-more-reviews"
          >
            Load More Reviews
          </button>
        )}
      </div>

      {/* Write/Edit Review Modal Overlay */}
      {showModal && (
        <div className="modal-overlay">
          <div className="modal-content-card">
            <h3>{editReviewId ? "Edit Your Review" : "Write a Product Review"}</h3>

            {/* Star Picker */}
            <div className="star-picker-row">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  type="button"
                  key={star}
                  onClick={() => setRating(star)}
                  className={`star-picker-btn ${star <= rating ? "selected" : ""}`}
                >
                  <HiStar />
                </button>
              ))}
            </div>

            <form onSubmit={handleSubmitReview} className="modal-form">
              <input
                type="text"
                placeholder="Review Title (e.g. Highly recommend!)"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                required
                maxLength={80}
              />

              <textarea
                placeholder="Share details of your experience with this product (minimum 20 characters)..."
                value={reviewContent}
                onChange={(e) => setReviewContent(e.target.value)}
                required
                rows={5}
                maxLength={1000}
              />
              <div style={{ textAlign: "right", fontSize: "12px", color: "#6B7280", marginTop: "-12px" }}>
                {reviewContent.length}/1000 characters (min 20)
              </div>

              <div className="modal-actions-row">
                <button type="button" onClick={() => setShowModal(false)} className="btn-modal-cancel">
                  Cancel
                </button>
                <button type="submit" disabled={submitting} className="btn-modal-submit">
                  {submitting ? "Submitting..." : "Submit Review"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Sticky Mobile Add To Cart / Buy Now Panel */}
      {user?.role !== "admin" && product.stock > 0 && (
        <div className="mobile-sticky-action-bar">
          <button 
            onClick={handleAddToCart}
            className="mobile-sticky-btn add-to-cart"
            type="button"
          >
            Add to Bag
          </button>
          <button 
            onClick={() => {
              handleAddToCart();
              navigate("/cart");
            }}
            className="mobile-sticky-btn buy-now"
            type="button"
          >
            Buy Now
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
