import { useEffect, useState, useContext } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart, removeFromCart } from "../redux/cartSlice";
import toast from "react-hot-toast";
import { HiStar, HiCheckCircle, HiChevronUp, HiChevronDown } from "react-icons/hi";
import { FiPlay, FiX, FiMapPin, FiThumbsUp, FiThumbsDown, FiCamera, FiVideo, FiMaximize2, FiLock } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
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

  // Redesigned Review states
  const [uploadedImages, setUploadedImages] = useState([]);
  const [uploadedVideo, setUploadedVideo] = useState("");
  const [imageInputText, setImageInputText] = useState("");
  const [videoInputText, setVideoInputText] = useState("");
  const [locationInput, setLocationInput] = useState("");
  const [variantInput, setVariantInput] = useState("");
  const [recommend, setRecommend] = useState(true);
  const [isAnonymous, setIsAnonymous] = useState(false);
  const [submitSkinType, setSubmitSkinType] = useState("");
  const [submitAgeGroup, setSubmitAgeGroup] = useState("");
  const [submitPros, setSubmitPros] = useState("");
  const [submitCons, setSubmitCons] = useState("");

  // Filter toolbar states
  const [ratingFilter, setRatingFilter] = useState("");
  const [mediaFilter, setMediaFilter] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [skinTypeFilter, setSkinTypeFilter] = useState("");
  const [ageGroupFilter, setAgeGroupFilter] = useState("");

  // Extracted statistics states
  const [customerGallery, setCustomerGallery] = useState([]);
  const [featuredReviews, setFeaturedReviews] = useState(null);
  const [highlights, setHighlights] = useState([]);
  const [reviewsLoading, setReviewsLoading] = useState(false);

  // Lightbox overlay states
  const [showLightbox, setShowLightbox] = useState(false);
  const [lightboxImages, setLightboxImages] = useState([]);
  const [lightboxIndex, setLightboxIndex] = useState(0);

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
      setReviewsLoading(true);
      const nextPage = resetPage ? 1 : page;
      const res = await fetch(
        `/api/reviews/product/${id}?page=${nextPage}&limit=5&sort=${sortBy}&rating=${ratingFilter}&media=${mediaFilter}&verified=${verifiedFilter}&search=${searchQuery}&skinType=${skinTypeFilter}&ageGroup=${ageGroupFilter}`
      );
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
        setCustomerGallery(data.customerGallery || []);
        setFeaturedReviews(data.featuredReviews || null);
        setHighlights(data.highlights || []);
        if (resetPage) setPage(1);
      }
    } catch (err) {
      console.error("Failed to load reviews:", err);
    } finally {
      setReviewsLoading(false);
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
  }, [id, sortBy, ratingFilter, mediaFilter, verifiedFilter, searchQuery, skinTypeFilter, ageGroupFilter]);

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

  const handleUnhelpfulVote = async (reviewId) => {
    if (!user || !user.token) {
      toast.error("Please login to vote");
      return;
    }
    try {
      const res = await fetch(`/api/reviews/${reviewId}/unhelpful`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const data = await res.json();
      if (res.ok) {
        toast.success("Voted as unhelpful! 👎");
        setReviews((prev) =>
          prev.map((r) =>
            r._id === reviewId
              ? { ...r, unhelpfulCount: data.unhelpfulCount, unhelpfulUsers: [...(r.unhelpfulUsers || []), user._id] }
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

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete your review? This cannot be undone.")) return;
    if (!user || !user.token) return;
    try {
      const res = await fetch(`/api/reviews/${reviewId}`, {
        method: "DELETE",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      if (res.ok) {
        toast.success("Review deleted successfully");
        fetchReviews(true);
        checkReviewEligibility();
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to delete review");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error deleting review");
    }
  };

  const handleReportReview = async (reviewId) => {
    if (!user || !user.token) {
      toast.error("Please login to report a review");
      return;
    }
    try {
      const res = await fetch(`/api/reviews/${reviewId}/report`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      if (res.ok) {
        toast.success("Review reported successfully. Thank you!");
        setReviews((prev) =>
          prev.map((r) => (r._id === reviewId ? { ...r, reported: true } : r))
        );
      } else {
        const data = await res.json();
        toast.error(data.message || "Failed to report review");
      }
    } catch (err) {
      console.error(err);
      toast.error("Error reporting review");
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
      
      const payload = {
        rating,
        title,
        review: reviewContent,
        images: uploadedImages,
        video: uploadedVideo,
        location: locationInput,
        variant: variantInput,
        recommend,
        isAnonymous,
        skinType: submitSkinType,
        ageGroup: submitAgeGroup,
        pros: submitPros,
        cons: submitCons
      };

      if (!editReviewId) {
        payload.productId = id;
        payload.orderId = activeOrderId;
      }

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
        setUploadedImages([]);
        setUploadedVideo("");
        setLocationInput("");
        setVariantInput("");
        setRecommend(true);
        setIsAnonymous(false);
        setSubmitSkinType("");
        setSubmitAgeGroup("");
        setSubmitPros("");
        setSubmitCons("");
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
    setUploadedImages([]);
    setUploadedVideo("");
    setLocationInput("");
    setVariantInput("");
    setRecommend(true);
    setIsAnonymous(false);
    setSubmitSkinType("");
    setSubmitAgeGroup("");
    setSubmitPros("");
    setSubmitCons("");
    setImageInputText("");
    setVideoInputText("");
    setShowModal(true);
  };

  const openEditReviewModal = (reviewObj) => {
    setEditReviewId(reviewObj._id);
    setRating(reviewObj.rating);
    setTitle(reviewObj.title);
    setReviewContent(reviewObj.review);
    setUploadedImages(reviewObj.images || []);
    setUploadedVideo(reviewObj.video || "");
    setLocationInput(reviewObj.location || "");
    setVariantInput(reviewObj.variant || "");
    setRecommend(reviewObj.recommend !== false);
    setIsAnonymous(reviewObj.isAnonymous === true);
    setSubmitSkinType(reviewObj.skinType || "");
    setSubmitAgeGroup(reviewObj.ageGroup || "");
    setSubmitPros(reviewObj.pros || "");
    setSubmitCons(reviewObj.cons || "");
    setImageInputText("");
    setVideoInputText("");
    setShowModal(true);
  };

  const handleAddMockPhoto = () => {
    const mockPhotos = [
      "https://images.unsplash.com/photo-1608248597481-496100c80836?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=600&q=80",
      "https://images.unsplash.com/photo-1612817288484-6f916006741a?auto=format&fit=crop&w=600&q=80"
    ];
    const randomPhoto = mockPhotos[Math.floor(Math.random() * mockPhotos.length)];
    setUploadedImages((prev) => [...prev, randomPhoto]);
    toast.success("Mock photo uploaded successfully! 📸");
  };

  const handleAddMockVideo = () => {
    setUploadedVideo("https://www.w3schools.com/html/mov_bbb.mp4");
    toast.success("Mock video uploaded successfully! 📹");
  };

  const handleOpenLightbox = (imagesList, startIndex) => {
    setLightboxImages(imagesList);
    setLightboxIndex(startIndex);
    setShowLightbox(true);
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
      <div className="reviews-section-redesigned" id="reviews">
        <h3 className="section-title-luxury">Customer Feedbacks & Ratings</h3>

        <div className="reviews-layout-grid-luxury">
          {/* Left Column: Summary Analytics Panel */}
          <div className="reviews-summary-panel-luxury">
            
            {/* Section 1: Customer Ratings Summary */}
            <div className="reviews-stats-card-luxury">
              <div className="stats-header-gold">
                <h2>{stats?.averageRating || 4.8}</h2>
                <div className="reviews-stars-row-luxury">
                  {[...Array(5)].map((_, i) => (
                    <HiStar
                      key={i}
                      style={{
                        color: i < Math.round(stats?.averageRating || 4.8) ? "#C8A165" : "#E5E7EB",
                      }}
                    />
                  ))}
                </div>
                <span className="reviews-count-sub font-outfit">
                  Based on {stats?.totalReviews || 245} verified purchase reviews
                </span>
              </div>

              {stats?.recommendRate !== undefined && (
                <div className="reviews-recommendation-block-luxury">
                  <div className="recommend-circle">
                    <span className="pct-text">{stats.recommendRate}%</span>
                  </div>
                  <p className="recommendation-desc font-outfit">
                    of verified owners highly recommend this skincare formula.
                  </p>
                </div>
              )}

              {/* Trust Indicators */}
              <div className="reviews-trust-badges-grid">
                <div className="trust-badge-item">
                  <span className="badge-icon">✓</span>
                  <div className="badge-text">
                    <strong>Verified Buyers</strong>
                    <span>100% authenticated</span>
                  </div>
                </div>
                <div className="trust-badge-item">
                  <span className="badge-icon">↩</span>
                  <div className="badge-text">
                    <strong>Repeat Purchase</strong>
                    <span>High formula loyalty</span>
                  </div>
                </div>
                <div className="trust-badge-item">
                  <span className="badge-icon">📸</span>
                  <div className="badge-text">
                    <strong>Photo Reviews</strong>
                    <span>Real skincare results</span>
                  </div>
                </div>
                <div className="trust-badge-item">
                  <span className="badge-icon">🎥</span>
                  <div className="badge-text">
                    <strong>Video Reviews</strong>
                    <span>Formulation demos</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Section 2: Star Breakdown Progress Bars */}
            <div className="reviews-breakdown-card-luxury">
              <h4 className="card-sub-title-luxury">Rating Distribution</h4>
              <div className="breakdown-bars-list">
                {[5, 4, 3, 2, 1].map((stars) => {
                  const count = stats?.breakdown?.[stars] || 0;
                  const total = stats?.totalReviews || 1;
                  const pct = stats?.totalReviews > 0 ? Math.round((count / total) * 100) : 0;
                  return (
                    <div 
                      key={stars} 
                      className={`rating-bar-row-luxury ${ratingFilter === String(stars) ? "active-row" : ""}`}
                      onClick={() => setRatingFilter(ratingFilter === String(stars) ? "" : String(stars))}
                      style={{ cursor: "pointer" }}
                      title={`Filter by ${stars} Stars`}
                    >
                      <span className="rating-star-label-luxury">
                        {stars} ★
                      </span>
                      <div className="rating-progress-track-luxury">
                        <div className="rating-progress-bar-luxury" style={{ width: `${pct}%` }} />
                      </div>
                      <span className="rating-count-label-luxury">{pct}%</span>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Featured editorial reviews summary */}
            {featuredReviews && (featuredReviews.topPositiveReview || featuredReviews.topCriticalReview || featuredReviews.latestReview) && (
              <div className="reviews-editorials-box-luxury">
                <h4 className="card-sub-title-luxury">Editorial Reviews</h4>
                
                {featuredReviews.topPositiveReview && (
                  <div className="editorial-mini-card positive">
                    <span className="editorial-badge positive">Top Positive Review</span>
                    <h5>{featuredReviews.topPositiveReview.title}</h5>
                    <p>"{featuredReviews.topPositiveReview.review.slice(0, 120)}..."</p>
                    <span className="editorial-author">— {featuredReviews.topPositiveReview.customerName}</span>
                  </div>
                )}

                {featuredReviews.topCriticalReview && (
                  <div className="editorial-mini-card critical">
                    <span className="editorial-badge critical">Top Critical Review</span>
                    <h5>{featuredReviews.topCriticalReview.title}</h5>
                    <p>"{featuredReviews.topCriticalReview.review.slice(0, 120)}..."</p>
                    <span className="editorial-author">— {featuredReviews.topCriticalReview.customerName}</span>
                  </div>
                )}
              </div>
            )}
          </div>

          {/* Right Column: Interactive Review Feed */}
          <div className="reviews-feed-panel-luxury">
            
            {/* Customer Media Gallery Header Grid */}
            {customerGallery.length > 0 && (
              <div className="feed-gallery-preview-luxury">
                <h4 className="feed-sub-title-luxury">Customer Gallery ({customerGallery.length} media uploads)</h4>
                <div className="gallery-preview-horizontal">
                  {customerGallery.slice(0, 6).map((media, idx) => {
                    const isVideo = media.video && !media.images?.length;
                    const activeImg = media.images?.[0] || "";
                    return (
                      <div 
                        key={idx} 
                        className="gallery-preview-thumb-card"
                        onClick={() => handleOpenLightbox(
                          customerGallery.map(m => m.video || m.images?.[0]).filter(Boolean),
                          idx
                        )}
                      >
                        {isVideo ? (
                          <div className="video-thumb-placeholder">
                            <video src={media.video} muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            <span className="play-btn-overlay"><FiPlay /></span>
                          </div>
                        ) : (
                          <img src={activeImg} alt="" loading="lazy" />
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Section 3: Toolbar & Luxury Filter Chips */}
            <div className="reviews-toolbar-card-luxury">
              
              {/* Toolbar search & sort */}
              <div className="toolbar-search-sort-row">
                <div className="luxury-search-input-box">
                  <input
                    type="text"
                    placeholder="Search buyer reviews (e.g. glow, dry, texture)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                  {searchQuery && (
                    <button type="button" onClick={() => setSearchQuery("")} className="clear-btn">
                      <FiX />
                    </button>
                  )}
                </div>

                {/* Custom Styled Sort Dropdown (No default select controls) */}
                <div className="luxury-custom-sort-dropdown-container">
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="luxury-sort-select-element"
                  >
                    <option value="newest">Newest First</option>
                    <option value="highest">Highest Rating</option>
                    <option value="lowest">Lowest Rating</option>
                    <option value="helpful">Most Helpful</option>
                    <option value="oldest">Oldest First</option>
                  </select>
                </div>

                {/* Write review button if eligible */}
                {eligible && (
                  <button onClick={openWriteReviewModal} className="btn-write-review-luxury-gold">
                    Write review
                  </button>
                )}
              </div>

              {/* Advanced Filter Chips Rows */}
              <div className="toolbar-filter-chips-rows font-outfit">
                
                {/* Standard filters */}
                <div className="filter-chips-flex">
                  <button 
                    className={`filter-chip-pill ${ratingFilter === "" && mediaFilter === "" && !verifiedFilter ? "active" : ""}`}
                    onClick={() => {
                      setRatingFilter("");
                      setMediaFilter("");
                      setVerifiedFilter(false);
                    }}
                  >
                    All Reviews
                  </button>
                  {[5, 4, 3, 2, 1].map(stars => (
                    <button 
                      key={stars}
                      className={`filter-chip-pill ${ratingFilter === String(stars) ? "active" : ""}`}
                      onClick={() => setRatingFilter(ratingFilter === String(stars) ? "" : String(stars))}
                    >
                      {stars}★
                    </button>
                  ))}
                  <button 
                    className={`filter-chip-pill ${verifiedFilter ? "active" : ""}`}
                    onClick={() => setVerifiedFilter(!verifiedFilter)}
                  >
                    Verified Purchase
                  </button>
                  <button 
                    className={`filter-chip-pill ${mediaFilter === "photos" ? "active" : ""}`}
                    onClick={() => setMediaFilter(mediaFilter === "photos" ? "" : "photos")}
                  >
                    With Photos
                  </button>
                  <button 
                    className={`filter-chip-pill ${mediaFilter === "videos" ? "active" : ""}`}
                    onClick={() => setMediaFilter(mediaFilter === "videos" ? "" : "videos")}
                  >
                    With Videos
                  </button>
                </div>

                {/* Skin Type filter chips */}
                <div className="filter-chips-flex chips-row-border">
                  <span className="row-label">Skin:</span>
                  <button 
                    className={`filter-chip-pill ${skinTypeFilter === "" ? "active" : ""}`}
                    onClick={() => setSkinTypeFilter("")}
                  >
                    All Types
                  </button>
                  {["Dry", "Oily", "Sensitive", "Combination", "Normal"].map(type => (
                    <button 
                      key={type}
                      className={`filter-chip-pill ${skinTypeFilter === type ? "active" : ""}`}
                      onClick={() => setSkinTypeFilter(skinTypeFilter === type ? "" : type)}
                    >
                      {type}
                    </button>
                  ))}
                </div>

                {/* Age Group filter chips */}
                <div className="filter-chips-flex">
                  <span className="row-label">Age:</span>
                  <button 
                    className={`filter-chip-pill ${ageGroupFilter === "" ? "active" : ""}`}
                    onClick={() => setAgeGroupFilter("")}
                  >
                    All Ages
                  </button>
                  {["Under 18", "18-24", "25-34", "35-44", "45+"].map(group => (
                    <button 
                      key={group}
                      className={`filter-chip-pill ${ageGroupFilter === group ? "active" : ""}`}
                      onClick={() => setAgeGroupFilter(ageGroupFilter === group ? "" : group)}
                    >
                      {group}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            {/* Feed Reviews Stack */}
            {reviewsLoading && reviews.length === 0 ? (
              /* Skeleton Loader */
              <div className="reviews-skeleton-stack-luxury">
                {[...Array(3)].map((_, i) => (
                  <div key={i} className="review-skeleton-card-luxury">
                    <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                      <div className="skeleton-avatar shimmer" />
                      <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div className="skeleton-text shimmer" style={{ width: "30%" }} />
                        <div className="skeleton-text shimmer" style={{ width: "15%" }} />
                      </div>
                    </div>
                    <div className="skeleton-text shimmer" style={{ width: "60%", marginTop: "12px" }} />
                    <div className="skeleton-text shimmer" style={{ width: "90%" }} />
                    <div className="skeleton-text shimmer" style={{ width: "100%" }} />
                  </div>
                ))}
              </div>
            ) : reviews.length === 0 ? (
              /* Empty State */
              <div className="reviews-empty-state-luxury">
                <span className="empty-state-icon">✨</span>
                <h4>No Customer Reviews Yet</h4>
                <p>Become the first verified customer to share your luxury skincare journey with this formula.</p>
                {eligible ? (
                  <button onClick={openWriteReviewModal} className="btn-write-review-luxury-gold" style={{ marginTop: "12px" }}>
                    Publish the First Review
                  </button>
                ) : (
                  <Link to="/shop" className="btn-browse-shop-luxury-gold" style={{ marginTop: "12px", textDecoration: "none" }}>
                    Browse Formulations
                  </Link>
                )}
              </div>
            ) : (
              /* Feed Stack */
              <div className="reviews-feed-stack-luxury">
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
                  const hasVotedUnhelpful = user && Array.isArray(rev.unhelpfulUsers) && rev.unhelpfulUsers.includes(user._id);

                  const handleShareReview = (reviewId) => {
                    const shareUrl = `${window.location.origin}/product/${id}?reviewId=${reviewId}`;
                    navigator.clipboard.writeText(shareUrl);
                    toast.success("Review link copied to clipboard! 🔗");
                  };

                  return (
                    <div key={rev._id} className="review-card-item-luxury">
                      {/* Card Header details */}
                      <div className="review-card-header-luxury">
                        <div className="review-user-row-luxury">
                          <div className="review-user-avatar-luxury">{initialLetters}</div>
                          <div className="review-user-details-luxury">
                            <div className="user-name-badges font-outfit">
                              <h4>{rev.isAnonymous ? "Anonymous Verified Buyer" : rev.customerName}</h4>
                              {rev.isVerifiedPurchase && (
                                <span className="verified-purchase-badge-green">
                                  ✓ Verified purchase
                                </span>
                              )}
                              {rev.location && (
                                <span className="location-badge-gray">
                                  📍 {rev.location}
                                </span>
                              )}
                            </div>
                            {rev.variant && (
                              <div className="variant-label-text font-outfit">
                                Variant: <strong>{rev.variant}</strong>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* Stars & Date */}
                        <div className="review-stars-date-luxury">
                          <div className="stars-row-luxury">
                            {[...Array(5)].map((_, idx) => (
                              <HiStar
                                key={idx}
                                style={{
                                  color: idx < rev.rating ? "#C8A165" : "#E5E7EB",
                                }}
                              />
                            ))}
                          </div>
                          <span className="date-meta-text font-outfit">
                            {new Date(rev.createdAt).toLocaleDateString("en-IN", {
                              day: "numeric",
                              month: "short",
                              year: "numeric",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Card Content body */}
                      <div className="review-card-body-luxury">
                        <div className="title-row-badges">
                          <h5>{rev.title}</h5>
                          {rev.reported && (
                            <span className="reported-badge-luxury">🚨 Flagged/Reported</span>
                          )}
                          {rev.edited && (
                            <span className="edited-badge-luxury font-outfit">Edited</span>
                          )}
                          {rev.recommend !== false && (
                            <span className="recommend-badge-luxury">✓ Recommends formulation</span>
                          )}
                        </div>

                        <p className="detailed-feedback-text">"{rev.review}"</p>

                        {/* Pros & Cons styled list */}
                        {(rev.pros || rev.cons) && (
                          <div className="pros-cons-grid-luxury font-outfit">
                            {rev.pros && (
                              <div className="pro-con-item pro">
                                <span className="icon-badge pro">+</span>
                                <div className="text-content">
                                  <strong>Pros:</strong> {rev.pros}
                                </div>
                              </div>
                            )}
                            {rev.cons && (
                              <div className="pro-con-item con">
                                <span className="icon-badge con">-</span>
                                <div className="text-content">
                                  <strong>Cons:</strong> {rev.cons}
                                </div>
                              </div>
                            )}
                          </div>
                        )}

                        {/* Metadata tags (Skin Type / Age Group) */}
                        {(rev.skinType || rev.ageGroup) && (
                          <div className="meta-tags-flex font-outfit">
                            {rev.skinType && (
                              <span className="meta-tag-pill">Skin: {rev.skinType}</span>
                            )}
                            {rev.ageGroup && (
                              <span className="meta-tag-pill">Age: {rev.ageGroup}</span>
                            )}
                          </div>
                        )}

                        {/* Media Attached Gallery List */}
                        {((Array.isArray(rev.images) && rev.images.length > 0) || rev.video) && (
                          <div className="attached-media-preview-luxury-row">
                            {Array.isArray(rev.images) && rev.images.map((img, idx) => (
                              <div 
                                key={idx} 
                                className="media-thumbnail-card-luxury"
                                onClick={() => handleOpenLightbox(rev.images, idx)}
                              >
                                <img src={img} alt="" loading="lazy" />
                                <span className="zoom-overlay-icon"><FiMaximize2 /></span>
                              </div>
                            ))}
                            {rev.video && (
                              <div 
                                className="media-thumbnail-card-luxury video-card"
                                onClick={() => handleOpenLightbox([rev.video], 0)}
                              >
                                <video src={rev.video} muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                                <span className="play-overlay-icon"><FiPlay /></span>
                              </div>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Official merchant replies nested card */}
                      {rev.merchantReply && rev.merchantReply.replyText && (
                        <div className="merchant-reply-card-luxury">
                          <div className="reply-header font-outfit">
                            <strong>Official VENUS CARE Response</strong>
                            <span className="reply-date">
                              {new Date(rev.merchantReply.repliedAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="reply-body-text">{rev.merchantReply.replyText}</p>
                        </div>
                      )}

                      {/* Card Footer Actions (Helpful, Report, Share, Edit/Delete) */}
                      <div className="review-card-actions-luxury">
                        <div className="vote-actions-flex-luxury font-outfit">
                          <button
                            onClick={() => handleHelpfulVote(rev._id)}
                            disabled={hasVotedHelpful}
                            className={`helpful-vote-btn-luxury ${hasVotedHelpful ? "voted" : ""}`}
                            type="button"
                          >
                            <FiThumbsUp /> Helpful ({rev.helpfulCount || 0})
                          </button>

                          <button
                            onClick={() => handleUnhelpfulVote(rev._id)}
                            disabled={hasVotedUnhelpful}
                            className={`helpful-vote-btn-luxury ${hasVotedUnhelpful ? "voted" : ""}`}
                            type="button"
                          >
                            <FiThumbsDown /> Not Helpful ({rev.unhelpfulCount || 0})
                          </button>
                        </div>

                        <div className="meta-actions-flex-luxury font-outfit">
                          <button
                            onClick={() => handleShareReview(rev._id)}
                            className="share-action-btn-luxury"
                            type="button"
                          >
                            Share
                          </button>

                          <button
                            onClick={() => handleReportReview(rev._id)}
                            disabled={rev.reported}
                            className="report-action-btn-luxury"
                            type="button"
                          >
                            {rev.reported ? "Reported" : "Report"}
                          </button>

                          {editable && (
                            <div className="owner-edits-group font-outfit">
                              <button onClick={() => openEditReviewModal(rev)} className="edit-link-btn" type="button">
                                Edit
                              </button>
                              <span className="divider">|</span>
                              <button onClick={() => handleDeleteReview(rev._id)} className="delete-link-btn" type="button">
                                Delete
                              </button>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* Load More Pagination */}
            {page < totalPages && (
              <button
                onClick={() => setPage((prev) => prev + 1)}
                className="btn-load-more-reviews-luxury-gold"
              >
                Load More Reviews
              </button>
            )}
          </div>
        </div>
      </div>


      {/* Write/Edit Review Modal Overlay */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <motion.div 
              className="modal-content-card-luxury"
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
            >
              <div className="modal-header-row">
                <h3>{editReviewId ? "Refine Your Feedback" : "Share Your Skincare Journey"}</h3>
                <button type="button" onClick={() => setShowModal(false)} className="modal-close-btn">
                  <FiX />
                </button>
              </div>

              {/* Star Picker */}
              <div className="star-picker-section-luxury">
                <span className="rating-picker-label">Overall Rating:</span>
                <div className="star-picker-row-luxury">
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className={`star-picker-btn-luxury ${star <= rating ? "selected" : ""}`}
                    >
                      <HiStar />
                    </button>
                  ))}
                </div>
              </div>

              <form onSubmit={handleSubmitReview} className="modal-form-luxury">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  <div className="form-input-group">
                    <label>Your Location</label>
                    <input 
                      type="text" 
                      placeholder="e.g. New Delhi, IN" 
                      value={locationInput}
                      onChange={(e) => setLocationInput(e.target.value)}
                    />
                  </div>
                  <div className="form-input-group">
                    <label>Product Variant</label>
                    <input 
                      type="text" 
                      placeholder="e.g. 50ml, Standard Pack" 
                      value={variantInput}
                      onChange={(e) => setVariantInput(e.target.value)}
                    />
                  </div>
                </div>

                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "12px" }}>
                  <div className="form-input-group">
                    <label>Pros (What you liked)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Radiant glow, hydration" 
                      value={submitPros}
                      onChange={(e) => setSubmitPros(e.target.value)}
                    />
                  </div>
                  <div className="form-input-group">
                    <label>Cons (What could be improved)</label>
                    <input 
                      type="text" 
                      placeholder="e.g. Pricey, strong scent" 
                      value={submitCons}
                      onChange={(e) => setSubmitCons(e.target.value)}
                    />
                  </div>
                </div>

                <div className="form-input-group">
                  <label>Review Title</label>
                  <input
                    type="text"
                    placeholder="Summarize your experience (e.g. Radiantly soft skin!)"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    maxLength={80}
                  />
                </div>

                <div className="form-input-group">
                  <label>Detailed Feedback</label>
                  <textarea
                    placeholder="Share specific details about the texture, fragrance, packaging, and results (minimum 20 characters)..."
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    required
                    rows={4}
                    maxLength={1000}
                  />
                  <div className="character-counter-row font-outfit">
                    <span>{reviewContent.length}/1000 characters</span>
                    <span>{reviewContent.length < 20 ? `${20 - reviewContent.length} more needed` : "Rule Valid"}</span>
                  </div>
                </div>

                <div className="form-input-group font-outfit" style={{ marginBottom: "12px" }}>
                  <label>Select Skin Type</label>
                  <div className="pills-selection-row">
                    {["Dry", "Oily", "Sensitive", "Combination", "Normal"].map(type => (
                      <button
                        type="button"
                        key={type}
                        onClick={() => setSubmitSkinType(submitSkinType === type ? "" : type)}
                        className={`pill-selection-btn ${submitSkinType === type ? "active" : ""}`}
                      >
                        {type}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="form-input-group font-outfit" style={{ marginBottom: "12px" }}>
                  <label>Select Age Group</label>
                  <div className="pills-selection-row">
                    {["Under 18", "18-24", "25-34", "35-44", "45+"].map(group => (
                      <button
                        type="button"
                        key={group}
                        onClick={() => setSubmitAgeGroup(submitAgeGroup === group ? "" : group)}
                        className={`pill-selection-btn ${submitAgeGroup === group ? "active" : ""}`}
                      >
                        {group}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Mock Upload Section */}
                <div className="form-upload-section-luxury">
                  <label>Attach Media Files (Simulated Upload)</label>
                  <div style={{ display: "flex", gap: "10px", marginTop: "4px" }}>
                    <button 
                      type="button" 
                      onClick={handleAddMockPhoto} 
                      className="btn-mock-upload-choice"
                    >
                      <FiCamera /> Add Mock Photo
                    </button>
                    <button 
                      type="button" 
                      onClick={handleAddMockVideo} 
                      className="btn-mock-upload-choice"
                    >
                      <FiVideo /> Add Mock Video
                    </button>
                  </div>

                  {/* Previews */}
                  {((uploadedImages.length > 0) || uploadedVideo) && (
                    <div className="uploaded-previews-flex">
                      {uploadedImages.map((img, idx) => (
                        <div key={idx} className="preview-media-card">
                          <img src={img} alt="" />
                          <button 
                            type="button" 
                            onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== idx))} 
                            className="remove-media-btn"
                          >
                            <FiX />
                          </button>
                        </div>
                      ))}
                      {uploadedVideo && (
                        <div className="preview-media-card video-card">
                          <video src={uploadedVideo} muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <button 
                            type="button" 
                            onClick={() => setUploadedVideo("")} 
                            className="remove-media-btn"
                          >
                            <FiX />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                {/* Toggles */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", margin: "16px 0" }}>
                  <label className="modal-toggle-label font-outfit">
                    <input
                      type="checkbox"
                      checked={recommend}
                      onChange={(e) => setRecommend(e.target.checked)}
                    />
                    Recommend this luxury skincare formulation to other buyers?
                  </label>

                  <label className="modal-toggle-label font-outfit">
                    <input
                      type="checkbox"
                      checked={isAnonymous}
                      onChange={(e) => setIsAnonymous(e.target.checked)}
                    />
                    Post review anonymously? (Hides account name from customer feed)
                  </label>
                </div>

                <div className="modal-actions-row">
                  <button type="button" onClick={() => setShowModal(false)} className="btn-modal-cancel">
                    Cancel
                  </button>
                  <button type="submit" disabled={submitting} className="btn-modal-submit">
                    {submitting ? "Submitting review..." : "Publish Review"}
                  </button>
                </div>
              </form>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Fullscreen Lightbox Overlay Modal */}
      {showLightbox && (
        <div className="lightbox-overlay" onClick={() => setShowLightbox(false)}>
          <button className="lightbox-close-btn" onClick={() => setShowLightbox(false)}>
            <FiX />
          </button>
          
          <div className="lightbox-container" onClick={(e) => e.stopPropagation()}>
            {lightboxImages[lightboxIndex]?.includes(".mp4") ? (
              <video src={lightboxImages[lightboxIndex]} controls autoPlay playsInline className="lightbox-main-media" />
            ) : (
              <img src={lightboxImages[lightboxIndex]} alt="" className="lightbox-main-media" />
            )}

            {lightboxImages.length > 1 && (
              <div className="lightbox-navigation-row">
                <button 
                  onClick={() => setLightboxIndex(prev => (prev - 1 + lightboxImages.length) % lightboxImages.length)}
                  className="nav-btn"
                >
                  ◀
                </button>
                <span className="nav-index font-outfit">
                  {lightboxIndex + 1} / {lightboxImages.length}
                </span>
                <button 
                  onClick={() => setLightboxIndex(prev => (prev + 1) % lightboxImages.length)}
                  className="nav-btn"
                >
                  ▶
                </button>
              </div>
            )}
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
