import { useEffect, useState, useContext, useRef, useMemo } from "react";
import { useParams, Link, useNavigate, useSearchParams } from "react-router-dom";
import { useDispatch } from "react-redux";
import { addToCart, removeFromCart } from "../redux/cartSlice";
import toast from "react-hot-toast";
import { HiStar, HiCheckCircle, HiChevronUp, HiChevronDown } from "react-icons/hi";
import { FiPlay, FiX, FiMapPin, FiThumbsUp, FiThumbsDown, FiCamera, FiVideo, FiMaximize2, FiLock, FiShare2 } from "react-icons/fi";
import { motion, AnimatePresence } from "framer-motion";
import { AuthContext } from "../context/AuthContext";
import { getOptimizedImageUrl } from "../utils/imageHelper.js";
import { updateSEOMetadata, injectJsonLd } from "../utils/seoHelper";
import "../styles/product.css";

import ProductCard from "../components/ProductCard";

const ProductDetail = () => {
  const { id } = useParams();
  const [searchParams] = useSearchParams();
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [openFaq, setOpenFaq] = useState(null);
  const [recommendations, setRecommendations] = useState([]);

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
  const [submitPros, setSubmitPros] = useState("");
  const [submitCons, setSubmitCons] = useState("");

  // Filter toolbar states
  const [ratingFilter, setRatingFilter] = useState("");
  const [mediaFilter, setMediaFilter] = useState("");
  const [verifiedFilter, setVerifiedFilter] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [skinTypeFilter, setSkinTypeFilter] = useState("");

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
  const modalRef = useRef(null);
  const activeTriggerRef = useRef(null);

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
        
        // Dynamically Inject Product SEO Metadata, OG tags, and Canonical Link
        updateSEOMetadata({
          title: data.name,
          description: data.description ? data.description.substring(0, 155) : "Buy premium luxury cosmetics on VENUS CARE.",
          canonicalUrl: `https://venuscare.in/product/${data._id}`,
          ogType: "product",
          ogImage: data.imageUrl || "https://venuscare.in/cosmetic_1.avif"
        });

        // Inject Product JSON-LD
        injectJsonLd("product-jsonld", {
          "@context": "https://schema.org",
          "@type": "Product",
          "name": data.name,
          "image": data.imageUrl,
          "description": data.description,
          "sku": data._id,
          "offers": {
            "@type": "Offer",
            "url": `https://venuscare.in/product/${data._id}`,
            "priceCurrency": "INR",
            "price": data.price,
            "availability": data.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock"
          }
        });

        // Inject Breadcrumb JSON-LD
        injectJsonLd("breadcrumb-jsonld", {
          "@context": "https://schema.org",
          "@type": "BreadcrumbList",
          "itemListElement": [
            {
              "@type": "ListItem",
              "position": 1,
              "name": "Home",
              "item": "https://venuscare.in"
            },
            {
              "@type": "ListItem",
              "position": 2,
              "name": data.category || "Shop",
              "item": `https://venuscare.in/shop?category=${encodeURIComponent(data.category || "")}`
            },
            {
              "@type": "ListItem",
              "position": 3,
              "name": data.name,
              "item": `https://venuscare.in/product/${data._id}`
            }
          ]
        });

        try {
          const viewed = JSON.parse(localStorage.getItem("venus_recently_viewed") || "[]");
          const updated = [data, ...viewed.filter((p) => p._id !== data._id)].slice(0, 8);
          localStorage.setItem("venus_recently_viewed", JSON.stringify(updated));
        } catch (e) {
          console.error("Failed to save recently viewed product", e);
        }

        // Fetch recommended/featured products
        try {
          const rRes = await fetch("/api/products/featured");
          if (rRes.ok) {
            const rData = await rRes.json();
            setRecommendations(rData.filter((item) => item._id !== data._id).slice(0, 4));
          }
        } catch (re) {
          console.error("Failed to fetch recommended products", re);
        }
      } catch (err) {
        console.error(err);
        setError("Failed to load product");
      } finally {
        setLoading(false);
      }
    };
    fetchProduct();
  }, [id]);

  // Focus Trap and Escape key listener for Write Review Modal (WCAG 2.1 AA Compliance)
  useEffect(() => {
    if (!showModal) {
      if (activeTriggerRef.current) {
        activeTriggerRef.current.focus();
      }
      return;
    }

    const modalElement = modalRef.current;
    if (!modalElement) return;

    // List all queryable focus elements
    const focusableSelector = 'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])';
    const focusableElements = modalElement.querySelectorAll(focusableSelector);
    
    if (focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        document.body.style.overflow = "auto";
        setShowModal(false);
        return;
      }

      if (e.key === "Tab") {
        const list = modalElement.querySelectorAll(focusableSelector);
        if (list.length === 0) return;
        const first = list[0];
        const last = list[list.length - 1];

        if (e.shiftKey) {
          if (document.activeElement === first) {
            last.focus();
            e.preventDefault();
          }
        } else {
          if (document.activeElement === last) {
            first.focus();
            e.preventDefault();
          }
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [showModal]);

  // Fetch Reviews
  const fetchReviews = async (resetPage = false) => {
    try {
      setReviewsLoading(true);
      const nextPage = resetPage ? 1 : page;
      const res = await fetch(
        `/api/reviews/product/${id}?page=${nextPage}&limit=5&sort=${sortBy}&rating=${ratingFilter}&media=${mediaFilter}&verified=${verifiedFilter}&search=${searchQuery}&skinType=${skinTypeFilter}`
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
  }, [id, sortBy, ratingFilter, mediaFilter, verifiedFilter, searchQuery, skinTypeFilter]);

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
      window.scrollTo({ top: 0, behavior: 'smooth' });
      document.body.style.overflow = 'hidden';
      setShowModal(true);
    }
  }, [searchParams]);

  // Escape key handler to close review modal and release body scroll
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && showModal) {
        document.body.style.overflow = 'auto';
        setShowModal(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [showModal]);

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
    setSubmitPros("");
    setSubmitCons("");
    setImageInputText("");
    setVideoInputText("");
    activeTriggerRef.current = document.activeElement;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.style.overflow = 'hidden';
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
    setSubmitPros(reviewObj.pros || "");
    setSubmitCons(reviewObj.cons || "");
    setImageInputText("");
    setVideoInputText("");
    activeTriggerRef.current = document.activeElement;
    window.scrollTo({ top: 0, behavior: 'smooth' });
    document.body.style.overflow = 'hidden';
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

  // Quantity selector state
  const [selectedQty, setSelectedQty] = useState(1);

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
        qty: selectedQty,
      }),
    );

    toast.success(`${product.name} added to cart! 🛍️`, { product });
  };

  const getStageClass = (index) => {
    return openFaq === index;
  };

  const toggleFaq = (index) => {
    setOpenFaq(openFaq === index ? null : index);
  };

  const discount = useMemo(() => {
    if (!product || !product.originalPrice || !product.price) return 0;
    return product.originalPrice > product.price
      ? Math.round(((product.originalPrice - product.price) / product.originalPrice) * 100)
      : 0;
  }, [product]);

  // Multi-image gallery state for premium display
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const productImages = useMemo(() => {
    if (!product) return [];
    // Prioritize product.gallery if exists, fallback to product.images, fallback to imageUrl
    if (Array.isArray(product.gallery) && product.gallery.length > 0) {
      return product.gallery.map(img => getOptimizedImageUrl(img, 1000));
    }
    if (Array.isArray(product.images) && product.images.length > 0) {
      return product.images.map(img => getOptimizedImageUrl(img, 1000));
    }
    const mainImg = getOptimizedImageUrl(product.imageUrl || product.image, 1000);
    return [
      mainImg,
      "https://images.unsplash.com/photo-1608248597481-496100c80836?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1556228720-195a672e8a03?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1601049541289-9b1b7bbbfe19?auto=format&fit=crop&w=1000&q=80",
      "https://images.unsplash.com/photo-1571781926291-c477ebfd024b?auto=format&fit=crop&w=1000&q=80"
    ];
  }, [product]);

  // State to track expanded accordion block (1, 2, 3, 4, 5, 6)
  const [expandedAccordion, setExpandedAccordion] = useState(1);

  if (loading) {
    return (
      <div className="product-detail-wrapper route-fade-in" style={{ background: "#FFFFFF" }}>
        <div className="product-detail" style={{ background: "#FFFFFF", border: "none" }}>
          <div className="detail-image-container" style={{ background: "#FFFFFF", borderRadius: "16px" }}>
            <div className="shimmer-bg" style={{ width: "100%", height: "100%", aspectRatio: "1/1", minHeight: "450px", borderRadius: "16px" }} />
          </div>
          <div className="detail-info" style={{ display: "flex", flexDirection: "column", gap: "16px", padding: "10px" }}>
            <div className="shimmer-bg" style={{ height: "12px", width: "120px", borderRadius: "4px" }} />
            <div className="shimmer-bg" style={{ height: "32px", width: "85%", borderRadius: "4px" }} />
            <div style={{ display: "flex", gap: "4px", margin: "4px 0" }}>
              {[...Array(5)].map((_, i) => (
                <div key={i} className="shimmer-bg" style={{ width: "16px", height: "16px", borderRadius: "50%" }}></div>
              ))}
            </div>
            <div className="shimmer-bg" style={{ height: "28px", width: "180px", borderRadius: "4px" }} />
            <div style={{ height: "1px", background: "rgba(0,0,0,0.06)", margin: "8px 0" }} />
            <div className="shimmer-bg" style={{ height: "60px", width: "100%", borderRadius: "12px" }} />
            <div className="shimmer-bg" style={{ height: "48px", width: "100%", borderRadius: "12px", marginTop: "12px" }} />
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

  return (
    <div className="product-detail-wrapper route-fade-in" style={{ background: "#FFFFFF", padding: "40px 24px" }}>
      {/* Breadcrumb */}
      <div className="product-detail-breadcrumb" style={{ color: "#666666", fontSize: "14px", marginBottom: "24px" }}>
        <Link to="/" style={{ color: "#B8945A", textDecoration: "none" }}>Home</Link>
        {" / "}
        <Link to="/shop" style={{ color: "#B8945A", textDecoration: "none" }}>Shop</Link>
        {" / "}
        {product.category}
        {" / "}
        <span style={{ color: "#111111", fontWeight: "600" }}>{product.name}</span>
      </div>

      {/* Main product detail */}
      <div className="product-detail-layout" style={{ display: "grid", gridTemplateColumns: "minmax(520px, 620px) minmax(420px, 520px)", gap: "64px", background: "transparent", border: "none", padding: 0, boxShadow: "none", alignItems: "start" }}>
        
        {/* Left Column (Sticky Gallery) */}
        <div className="product-gallery-column" style={{ display: "flex", flexDirection: "column", gap: "16px", position: "sticky", top: "96px", alignSelf: "start", height: "fit-content" }}>
          <div className="product-gallery-card" style={{ background: "#FFFFFF", border: "1px solid #ECECEC", borderRadius: "28px", padding: "24px", position: "relative", height: "560px", boxShadow: "none" }}>
            {discount > 0 && (
              <span className="discount-badge" style={{ top: "24px", left: "24px", background: "#B8945A", color: "#FFFFFF", padding: "6px 12px", fontSize: "11px", fontWeight: "700" }}>
                {discount}% OFF
              </span>
            )}
            <img
              src={productImages[activeImageIndex]}
              alt={product.name}
              className="detail-image"
              loading="lazy"
              style={{ width: "90%", height: "90%", objectFit: "contain", transition: "transform 0.3s ease" }}
              onError={(e) => {
                e.target.src = "/cosmetic_1.avif";
              }}
            />
          </div>

          {/* Thumbnail row */}
          <div style={{ display: "flex", gap: "12px", overflowX: "auto", paddingBottom: "8px" }}>
            {productImages.map((img, idx) => (
              <button
                key={idx}
                onClick={() => setActiveImageIndex(idx)}
                style={{
                  width: "80px",
                  height: "80px",
                  border: activeImageIndex === idx ? "2px solid #C8A96B" : "1px solid #E8E0D4",
                  borderRadius: "8px",
                  overflow: "hidden",
                  background: "#FFFFFF",
                  cursor: "pointer",
                  padding: 0
                }}
              >
                <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Info and Purchase panel */}
        <div className="product-info-column" style={{ display: "flex", flexDirection: "column", gap: "28px", minWidth: 0 }}>
          <div>
            <span style={{ color: "#C9A063", fontSize: "11px", letterSpacing: "2px", textTransform: "uppercase", fontWeight: "700" }}>
              {product.category}
            </span>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", gap: "16px" }}>
              <h1 className="product-detail-title" style={{ fontFamily: "Cinzel, serif", fontSize: "40px", color: "#111112", margin: "8px 0 4px 0", fontWeight: "600", flex: 1 }}>
                {product.name}
              </h1>
              <button
                type="button"
                onClick={async () => {
                  const shareData = {
                    title: product.name,
                    text: product.subtitle || "Check out this product from VENUS CARE",
                    url: window.location.href
                  };
                  if (navigator.share) {
                    try {
                      await navigator.share(shareData);
                    } catch (err) {
                      console.log(err);
                    }
                    navigator.clipboard.writeText(window.location.href);
                    toast.success("Product link copied to clipboard! 📋");
                  }
                }}
                style={{
                  background: "none",
                  border: "1px solid #E8E0D4",
                  borderRadius: "50%",
                  width: "44px",
                  height: "44px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  cursor: "pointer",
                  color: "#111112",
                  marginTop: "8px",
                  transition: "all 0.3s ease"
                }}
                title="Share Product"
              >
                <FiShare2 style={{ width: "20px", height: "20px" }} />
              </button>
            </div>
            {product.subtitle && (
              <p style={{ margin: "0 0 12px 0", fontSize: "14px", fontStyle: "italic", color: "#5F6368" }}>{product.subtitle}</p>
            )}
            
            {/* Stars & Reviews */}
            <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "14px", color: "#C8A96B" }}>
              <HiStar style={{ width: "18px", height: "18px", color: "#C8A96B" }} />
              <strong style={{ color: "#111112", fontWeight: "700" }}>
                {stats && stats.totalReviews > 0 ? parseFloat(stats.averageRating).toFixed(1) : "0.0"}
              </strong>
              <a href="#reviews" style={{ color: "#5F6368", textDecoration: "underline" }}>
                ({stats ? stats.totalReviews : 0} reviews)
              </a>
            </div>
          </div>

          {/* Pricing Details */}
          <div style={{ padding: "0 0 16px 0", borderBottom: "1px solid #E8E0D4" }}>
            <div style={{ display: "flex", alignItems: "baseline", gap: "12px", flexWrap: "wrap" }}>
              <span style={{ color: "#111112", fontSize: "36px", fontWeight: "800", fontFamily: "Cinzel, serif" }}>₹{product.price.toFixed(2)}</span>
              {discount > 0 && (
                <>
                  <span style={{ textDecoration: "line-through", color: "#6B6B6B", fontSize: "20px" }}>
                    ₹{product.originalPrice.toFixed(2)}
                  </span>
                  <span style={{ color: "#C9A063", fontSize: "16px", fontWeight: "700" }}>
                    ({discount}% OFF)
                  </span>
                </>
              )}
            </div>
            <p style={{ margin: "4px 0 0 0", fontSize: "12px", color: "#6B6B6B" }}>Inclusive of all taxes</p>

            {/* Prepaid discount bar */}
            <div style={{ marginTop: "16px", padding: "12px 16px", background: "#F7F2E8", border: "1px solid #E7D8BF", borderRadius: "8px", display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#1B1B1B", fontWeight: "600" }}>
              <span>🪙</span> Pay only <strong style={{ color: "#C9A063" }}>₹{(product.price * 0.95).toFixed(2)}</strong> with Prepaid Discounts
            </div>
          </div>

          {/* Where to use tags */}
          {Array.isArray(product.wearTags) && product.wearTags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: "8px", margin: "4px 0" }}>
              {product.wearTags.map((tag, i) => (
                <span key={i} style={{ background: "#FFFDF9", border: "1px solid #E7D8BF", padding: "6px 14px", borderRadius: "20px", fontSize: "12px", color: "#1B1B1B", fontWeight: "600" }}>
                  📍 {tag}
                </span>
              ))}
            </div>
          )}

          {/* Quantity and CTA Actions */}
          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {product.stock > 0 && product.stock <= 5 && (
              <div 
                style={{ 
                  background: "#FEF2F2", 
                  border: "1px solid #FEE2E2", 
                  color: "#991B1B", 
                  padding: "10px 14px", 
                  borderRadius: "8px", 
                  fontSize: "12px", 
                  fontWeight: "600",
                  display: "flex",
                  alignItems: "center",
                  gap: "6px"
                }}
              >
                ⚠️ Limited Stock: Only {product.stock} items remaining.
              </div>
            )}
            
            {user?.role !== "admin" && (
              <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
                {/* Quantity picker */}
                {product.stock > 0 && (
                  <div style={{ display: "flex", alignItems: "center", border: "1px solid #E8E0D4", borderRadius: "12px", background: "#FFFFFF", overflow: "hidden" }}>
                    <button 
                      type="button" 
                      onClick={() => setSelectedQty(prev => Math.max(1, prev - 1))}
                      style={{ padding: "12px 18px", border: "none", background: "none", cursor: "pointer", fontSize: "16px", fontWeight: "700" }}
                    >
                      -
                    </button>
                    <span style={{ padding: "0 10px", minWidth: "24px", textAlign: "center", fontWeight: "700" }}>{selectedQty}</span>
                    <button 
                      type="button" 
                      onClick={() => setSelectedQty(prev => Math.min(product.stock, prev + 1))}
                      style={{ padding: "12px 18px", border: "none", background: "none", cursor: "pointer", fontSize: "16px", fontWeight: "700" }}
                    >
                      +
                    </button>
                  </div>
                )}

                <div style={{ flex: 1 }}>
                  {product.stock === 0 ? (
                    <button
                      disabled
                      className="add-to-cart-btn"
                      style={{ background: "#9CA3AF", cursor: "not-allowed", height: "56px", width: "100%" }}
                    >
                      Out Of Stock
                    </button>
                  ) : (
                    <button
                      onClick={handleAddToCart}
                      className="product-detail-add-btn"
                      style={{ background: "#111112", height: "56px", borderRadius: "14px", color: "#FFFFFF", fontSize: "14px", fontWeight: "700", textTransform: "uppercase", letterSpacing: "1px", width: "100%" }}
                    >
                      Add to Cart
                    </button>
                  )}
                </div>
              </div>
            )}
          </div>

          {/* Best Selling Combos card */}
          {Array.isArray(product.comboProducts) && product.comboProducts.length > 0 && (
            <div style={{ border: "1px solid #E8E0D4", borderRadius: "16px", padding: "20px", background: "#FFFFFF" }}>
              <span style={{ fontSize: "10px", color: "#C8A96B", fontWeight: "800", letterSpacing: "1px" }}>BESTSELLING COMBO SAVINGS</span>
              <h4 style={{ margin: "4px 0 12px 0", fontSize: "16px", fontWeight: "700" }}>Add Pair and Save More!</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                {product.comboProducts.map((combo, idx) => (
                  <div key={idx} style={{ display: "flex", gap: "10px", alignItems: "center" }}>
                    <img src={combo.imageUrl} alt="" style={{ width: "40px", height: "40px", borderRadius: "6px", objectFit: "cover" }} />
                    <div>
                      <span style={{ fontSize: "12px", fontWeight: "700", display: "block" }}>{combo.name}</span>
                      <span style={{ fontSize: "11px", color: "#5F6368" }}>₹{combo.price.toFixed(2)}</span>
                    </div>
                  </div>
                ))}
                <button
                  type="button"
                  onClick={() => {
                    product.comboProducts.forEach(combo => {
                      dispatch(addToCart({ productId: combo._id, name: combo.name, price: combo.price, imageUrl: combo.imageUrl, stock: combo.stock, qty: 1 }));
                    });
                    handleAddToCart();
                    toast.success("Combo pack added to cart! 🛍️");
                  }}
                  style={{ marginTop: "12px", border: "none", background: "#C8A96B", color: "#FFFFFF", padding: "12px", borderRadius: "8px", fontWeight: "700", fontSize: "12px", cursor: "pointer", width: "100%" }}
                >
                  ADD COMBO TO CART
                </button>
              </div>
            </div>
          )}

          {/* Trust Icons Section */}
          <div 
            className="trust-icons-container"
            style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(4, 1fr)", 
              gap: "12px", 
              borderTop: "1px solid #E8E0D4", 
              paddingTop: "24px", 
              textAlign: "center" 
            }}
          >
            <div className="trust-card" style={{ fontSize: "12px", color: "#111112", fontWeight: "600", padding: "10px", background: "#FAF7F2", borderRadius: "10px" }}>🪔<br /><span style={{ display: "block", marginTop: "4px", color: "#6B6B6B" }}>Imported Oils</span></div>
            <div className="trust-card" style={{ fontSize: "12px", color: "#111112", fontWeight: "600", padding: "10px", background: "#FAF7F2", borderRadius: "10px" }}>🐰<br /><span style={{ display: "block", marginTop: "4px", color: "#6B6B6B" }}>Cruelty-Free</span></div>
            <div className="trust-card" style={{ fontSize: "12px", color: "#111112", fontWeight: "600", padding: "10px", background: "#FAF7F2", borderRadius: "10px" }}>📜<br /><span style={{ display: "block", marginTop: "4px", color: "#6B6B6B" }}>IFRA Certified</span></div>
            <div className="trust-card" style={{ fontSize: "12px", color: "#111112", fontWeight: "600", padding: "10px", background: "#FAF7F2", borderRadius: "10px" }}>🚚<br /><span style={{ display: "block", marginTop: "4px", color: "#6B6B6B" }}>Assured Delivery</span></div>
          </div>

          {/* Fulfillment Information Card */}
          <div style={{ background: "#FAF7F2", border: "1px solid #E6D8C3", borderRadius: "20px", padding: "24px", marginTop: "24px" }}>
            <h4 style={{ fontFamily: "Playfair Display, serif", fontSize: "18px", color: "#1A1A1A", marginBottom: "16px" }}>Delivery & fulfillment</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "13px", color: "#5F5F5F" }}>
              <div>🚚 <strong>Estimated Delivery:</strong> {product.fulfillment?.eta || "Delivered within 2 - 4 business days."}</div>
              <div>🔄 <strong>Return Policy:</strong> {product.fulfillment?.returnPolicy || "7-day return policy on unused premium cosmetics."}</div>
              <div>💳 <strong>Payment Options:</strong> {product.fulfillment?.paymentInfo || "Razorpay secure pay, UPI, and major debit/credit cards."}</div>
              <div>✨ <strong>Brand Guarantee:</strong> {product.fulfillment?.authenticity || "100% authentic formulation direct from VENUS CARE laboratory."}</div>
            </div>
            <div style={{ display: "flex", gap: "10px", marginTop: "20px", flexWrap: "wrap" }}>
              <span style={{ background: "#FFFFFF", padding: "6px 12px", borderRadius: "20px", fontSize: "11px", color: "#C9A46A", fontWeight: "700", border: "1px solid #E6D8C3" }}>✓ Secure Checkout</span>
              <span style={{ background: "#FFFFFF", padding: "6px 12px", borderRadius: "20px", fontSize: "11px", color: "#C9A46A", fontWeight: "700", border: "1px solid #E6D8C3" }}>✓ 100% Vegan</span>
              <span style={{ background: "#FFFFFF", padding: "6px 12px", borderRadius: "20px", fontSize: "11px", color: "#C9A46A", fontWeight: "700", border: "1px solid #E6D8C3" }}>✓ Acid-Free</span>
            </div>
          </div>

          {/* Formula Standards Section */}
          <div style={{ border: "1px solid #E6D8C3", borderRadius: "20px", padding: "24px", background: "#FFFFFF", marginTop: "24px" }}>
            <h4 style={{ fontFamily: "Playfair Display, serif", fontSize: "18px", color: "#1A1A1A", marginBottom: "16px" }}>Venus Purity Standards</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "13.5px", color: "#5F5F5F" }}>
              {Array.isArray(product.formulaStandards) && product.formulaStandards.length > 0 ? (
                product.formulaStandards.map((std, idx) => (
                  <div key={idx} style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ color: "#C9A46A", fontWeight: "700" }}>⭐</span> {std}
                  </div>
                ))
              ) : (
                <>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ color: "#C9A46A", fontWeight: "700" }}>⭐</span> Dermatologically Tested Purity</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ color: "#C9A46A", fontWeight: "700" }}>⭐</span> 100% Cruelty Free & Vegan-Grade</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ color: "#C9A46A", fontWeight: "700" }}>⭐</span> Formulated without Parabens or Sulfates</div>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}><span style={{ color: "#C9A46A", fontWeight: "700" }}>⭐</span> Hydrating active ingredients suited for sensitive skin</div>
                </>
              )}
            </div>
          </div>

          {/* How to Apply Section */}
          <div style={{ marginTop: "24px", background: "#FAF7F2", borderRadius: "20px", padding: "24px", border: "1px solid #E6D8C3" }}>
            <h4 style={{ fontFamily: "Playfair Display, serif", fontSize: "18px", color: "#1A1A1A", marginBottom: "16px" }}>How to Apply</h4>
            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {Array.isArray(product.howToApply) && product.howToApply.length > 0 ? (
                product.howToApply.map((step, idx) => (
                  <div key={idx} style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                    <span style={{ background: "#C9A46A", color: "#FFFFFF", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "700", flexShrink: 0 }}>{idx + 1}</span>
                    <div>
                      <strong style={{ display: "block", fontSize: "14px", color: "#1A1A1A" }}>{step.title}</strong>
                      <span style={{ fontSize: "12.5px", color: "#5F5F5F" }}>{step.description}</span>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                    <span style={{ background: "#C9A46A", color: "#FFFFFF", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "700", flexShrink: 0 }}>1</span>
                    <div>
                      <strong style={{ display: "block", fontSize: "14px", color: "#1A1A1A" }}>Dispense Application</strong>
                      <span style={{ fontSize: "12.5px", color: "#5F5F5F" }}>Apply a clean coin-sized droplet onto your fingertips.</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                    <span style={{ background: "#C9A46A", color: "#FFFFFF", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "700", flexShrink: 0 }}>2</span>
                    <div>
                      <strong style={{ display: "block", fontSize: "14px", color: "#1A1A1A" }}>Massage Skin</strong>
                      <span style={{ fontSize: "12.5px", color: "#5F5F5F" }}>Gently massage upwards using circular patterns.</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", gap: "14px", alignItems: "flex-start" }}>
                    <span style={{ background: "#C9A46A", color: "#FFFFFF", width: "24px", height: "24px", borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "11px", fontWeight: "700", flexShrink: 0 }}>3</span>
                    <div>
                      <strong style={{ display: "block", fontSize: "14px", color: "#1A1A1A" }}>Absorb Thoroughly</strong>
                      <span style={{ fontSize: "12.5px", color: "#5F5F5F" }}>Allow the formula to settle and protect for 2-3 minutes.</span>
                    </div>
                  </div>
                </>
              )}
            </div>
          </div>

        </div>
      </div>

      {/* Sticky Mobile Add to Cart Bar */}
      {product.stock > 0 && (
        <div 
          className="sticky-mobile-cart-bar"
          style={{
            position: "fixed",
            bottom: 0,
            left: 0,
            right: 0,
            background: "#FFFFFF",
            borderTop: "1px solid #E6D8C3",
            padding: "12px 16px",
            display: "flex",
            justifyContent: "space-between",
            alignItems: "center",
            zIndex: 999,
            boxShadow: "0 -4px 15px rgba(0,0,0,0.05)"
          }}
        >
          <div>
            <span style={{ fontSize: "11px", color: "#6B6B6B", display: "block" }}>Total Price</span>
            <strong style={{ fontSize: "20px", color: "#1A1A1A", fontFamily: "Playfair Display, serif" }}>₹{(product.price * selectedQty).toFixed(2)}</strong>
          </div>
          <button 
            onClick={handleAddToCart}
            style={{ background: "#111111", color: "#FFFFFF", padding: "12px 24px", borderRadius: "10px", fontWeight: "700", border: "none", fontSize: "13px", textTransform: "uppercase" }}
          >
            Add To Cart ({selectedQty})
          </button>
        </div>
      )}

      {/* SECTION 2 — PRODUCT HIGHLIGHTS */}
      {Array.isArray(product.highlights) && product.highlights.length > 0 && (
        <div style={{ marginTop: "80px", background: "#FFFFFF", borderRadius: "16px", padding: "40px", border: "1px solid #E8E0D4" }}>
          <h3 style={{ fontFamily: "Cinzel, serif", fontSize: "28px", color: "#111112", marginBottom: "28px", textAlign: "center" }}>Product Highlights</h3>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "24px" }}>
            {product.highlights.map((highlight, idx) => (
              <div key={idx} style={{ display: "flex", gap: "16px", alignItems: "center" }}>
                <span style={{ fontSize: "24px" }}>✨</span>
                <span style={{ fontSize: "15px", fontWeight: "600", color: "#111112" }}>{highlight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ingredient Stories Section */}
      {Array.isArray(product.ingredientStories) && product.ingredientStories.length > 0 && (
        <div style={{ marginTop: "60px", padding: "40px 0", background: "#FAF7F2", borderRadius: "24px", border: "1px solid #E6D8C3" }}>
          <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: "28px", color: "#1A1A1A", marginBottom: "28px", textAlign: "center" }}>Notes in This Formula</h3>
          <div style={{ display: "flex", gap: "20px", overflowX: "auto", padding: "0 24px 12px 24px", scrollSnapType: "x mandatory" }}>
            {product.ingredientStories.map((story, idx) => (
              <div 
                key={idx} 
                style={{ 
                  background: "#FFFFFF", 
                  border: "1px solid #E6D8C3", 
                  borderRadius: "20px", 
                  padding: "20px", 
                  minWidth: "260px", 
                  flex: "1 0 260px", 
                  textAlign: "center",
                  scrollSnapAlign: "start",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.02)"
                }}
              >
                {story.image && (
                  <img src={story.image} alt={story.title} style={{ width: "80px", height: "80px", borderRadius: "50%", objectFit: "cover", margin: "0 auto 12px auto", display: "block" }} />
                )}
                <h4 style={{ margin: "0 0 10px 0", fontSize: "16px", fontWeight: "700", fontFamily: "Playfair Display, serif", color: "#1A1A1A" }}>{story.title}</h4>
                <div style={{ display: "flex", gap: "6px", justifyContent: "center", flexWrap: "wrap" }}>
                  {Array.isArray(story.tags) && story.tags.map((tag, tIdx) => (
                    <span key={tIdx} style={{ background: "#FAF7F2", border: "1px solid #E6D8C3", padding: "4px 8px", borderRadius: "10px", fontSize: "11px", color: "#C9A46A", fontWeight: "600" }}>{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes In Set Section */}
      {Array.isArray(product.notesInSet) && product.notesInSet.length > 0 && (
        <div style={{ marginTop: "60px" }}>
          <h3 style={{ fontFamily: "Cinzel, serif", fontSize: "28px", color: "#111112", marginBottom: "28px", textAlign: "center" }}>Notes in This Set</h3>
          <div style={{ display: "flex", gap: "20px", overflowX: "auto", paddingBottom: "12px", scrollSnapType: "x mandatory" }}>
            {product.notesInSet.map((note, idx) => (
              <div 
                key={idx} 
                style={{ 
                  background: "#FFFFFF", 
                  border: "1px solid #E8E0D4", 
                  borderRadius: "16px", 
                  padding: "24px", 
                  minWidth: "280px", 
                  flex: "1 0 280px", 
                  textAlign: "center",
                  scrollSnapAlign: "start",
                  boxShadow: "0 4px 12px rgba(0,0,0,0.02)"
                }}
              >
                {note.image && (
                  <img src={note.image} alt="" style={{ width: "90px", height: "90px", borderRadius: "50%", objectFit: "cover", margin: "0 auto 16px auto", display: "block" }} />
                )}
                <h4 style={{ margin: "0 0 12px 0", fontSize: "18px", fontWeight: "700", fontFamily: "Cinzel, serif", color: "#111112" }}>{note.title}</h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "13px", color: "#5F6368" }}>
                  {note.note1 && <span style={{ background: "#FAF7F2", padding: "6px", borderRadius: "6px" }}>{note.note1}</span>}
                  {note.note2 && <span style={{ background: "#FAF7F2", padding: "6px", borderRadius: "6px" }}>{note.note2}</span>}
                  {note.note3 && <span style={{ background: "#FAF7F2", padding: "6px", borderRadius: "6px" }}>{note.note3}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3 — ACCORDION INFORMATION BLOCKS */}
      <div style={{ marginTop: "60px", maxWidth: "800px", margin: "60px auto 0 auto" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
          
          {/* Accordion 1: Highlights */}
          {(product.productHighlights || (Array.isArray(product.highlights) && product.highlights.length > 0)) && (
            <div style={{ borderBottom: "1px solid #E8E0D4" }}>
              <button
                type="button"
                onClick={() => setExpandedAccordion(expandedAccordion === 1 ? null : 1)}
                style={{ width: "100%", padding: "18px 0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", outline: "none", textAlign: "left" }}
              >
                <span style={{ fontSize: "18px", fontWeight: "700", color: "#111112", fontFamily: "Cinzel, serif" }}>Product Highlights</span>
                <span style={{ fontSize: "20px" }}>{expandedAccordion === 1 ? "−" : "+"}</span>
              </button>
              {expandedAccordion === 1 && (
                <div style={{ padding: "0 0 18px 0", fontSize: "15px", color: "#5F6368", lineHeight: "1.6" }}>
                  {product.productHighlights || (Array.isArray(product.highlights) && (
                    <ul style={{ paddingLeft: "20px", margin: 0 }}>
                      {product.highlights.map((h, i) => <li key={i}>{h}</li>)}
                    </ul>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Accordion 2: FAQ */}
          {Array.isArray(product.faq) && product.faq.length > 0 && (
            <div style={{ borderBottom: "1px solid #E8E0D4" }}>
              <button
                type="button"
                onClick={() => setExpandedAccordion(expandedAccordion === 2 ? null : 2)}
                style={{ width: "100%", padding: "18px 0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", outline: "none", textAlign: "left" }}
              >
                <span style={{ fontSize: "18px", fontWeight: "700", color: "#111112", fontFamily: "Cinzel, serif" }}>FAQ</span>
                <span style={{ fontSize: "20px" }}>{expandedAccordion === 2 ? "−" : "+"}</span>
              </button>
              {expandedAccordion === 2 && (
                <div style={{ padding: "0 0 18px 0", fontSize: "15px", color: "#5F6368", lineHeight: "1.6", display: "flex", flexDirection: "column", gap: "12px" }}>
                  {product.faq.map((item, idx) => (
                    <div key={idx}>
                      <strong style={{ display: "block", color: "#111112" }}>Q: {item.question}</strong>
                      <span>A: {item.answer}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Accordion 3: Ingredients */}
          {(product.ingredients) && (
            <div style={{ borderBottom: "1px solid #E8E0D4" }}>
              <button
                type="button"
                onClick={() => setExpandedAccordion(expandedAccordion === 3 ? null : 3)}
                style={{ width: "100%", padding: "18px 0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", outline: "none", textAlign: "left" }}
              >
                <span style={{ fontSize: "18px", fontWeight: "700", color: "#111112", fontFamily: "Cinzel, serif" }}>All Ingredients</span>
                <span style={{ fontSize: "20px" }}>{expandedAccordion === 3 ? "−" : "+"}</span>
              </button>
              {expandedAccordion === 3 && (
                <div style={{ padding: "0 0 18px 0", fontSize: "15px", color: "#5F6368", lineHeight: "1.6" }}>
                  {product.ingredients}
                </div>
              )}
            </div>
          )}

          {/* Accordion 4: Other Information */}
          {(product.otherInformation || product.otherInfo) && (
            <div style={{ borderBottom: "1px solid #E8E0D4" }}>
              <button
                type="button"
                onClick={() => setExpandedAccordion(expandedAccordion === 4 ? null : 4)}
                style={{ width: "100%", padding: "18px 0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", outline: "none", textAlign: "left" }}
              >
                <span style={{ fontSize: "18px", fontWeight: "700", color: "#111112", fontFamily: "Cinzel, serif" }}>Other Information</span>
                <span style={{ fontSize: "20px" }}>{expandedAccordion === 4 ? "−" : "+"}</span>
              </button>
              {expandedAccordion === 4 && (
                <div style={{ padding: "0 0 18px 0", fontSize: "15px", color: "#5F6368", lineHeight: "1.6" }}>
                  {product.otherInformation || product.otherInfo}
                </div>
              )}
            </div>
          )}

          {/* Accordion 5: How to Use */}
          {product.howToUse && (
            <div style={{ borderBottom: "1px solid #E8E0D4" }}>
              <button
                type="button"
                onClick={() => setExpandedAccordion(expandedAccordion === 5 ? null : 5)}
                style={{ width: "100%", padding: "18px 0", display: "flex", justifyContent: "space-between", alignItems: "center", background: "none", border: "none", cursor: "pointer", outline: "none", textAlign: "left" }}
              >
                <span style={{ fontSize: "18px", fontWeight: "700", color: "#111112", fontFamily: "Cinzel, serif" }}>How To Use</span>
                <span style={{ fontSize: "20px" }}>{expandedAccordion === 5 ? "−" : "+"}</span>
              </button>
              {expandedAccordion === 5 && (
                <div style={{ padding: "0 0 18px 0", fontSize: "15px", color: "#5F6368", lineHeight: "1.6" }}>
                  {product.howToUse}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      {/* SECTION 6 — PREMIUM REVIEW SYSTEM */}
      <div className="reviews-section-redesigned" id="reviews" style={{ marginTop: "80px", borderTop: "1px solid #E8E0D4", paddingTop: "60px" }}>
        
        {/* Top Summary Row */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "40px", marginBottom: "48px", background: "#FFFFFF", padding: "32px", borderRadius: "16px", border: "1px solid #E8E0D4" }}>
          
          {/* Left Column Summary */}
          <div style={{ textAlign: "center", borderRight: "1px solid #E8E0D4", paddingRight: "40px" }}>
            <h2 style={{ fontSize: "64px", fontWeight: "800", color: "#111112", margin: 0 }}>
              {stats && stats.totalReviews > 0 ? parseFloat(stats.averageRating).toFixed(1) : "0.0"}
            </h2>
            <div style={{ display: "flex", justifyContent: "center", gap: "4px", margin: "12px 0", color: "#C8A96B", fontSize: "20px" }}>
              {[...Array(5)].map((_, i) => (
                <HiStar
                  key={i}
                  style={{
                    color: stats && stats.totalReviews > 0 && i < Math.round(stats.averageRating) ? "#C8A96B" : "#E5E7EB",
                  }}
                />
              ))}
            </div>
            <span style={{ fontSize: "14px", color: "#5F6368" }}>
              Based on {stats ? stats.totalReviews : 0} reviews
            </span>
          </div>

          {/* Center Column Bars */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px", justifyCenter: "center" }}>
            {[5, 4, 3, 2, 1].map((stars) => {
              const count = stats?.breakdown?.[stars] || 0;
              const total = stats?.totalReviews || 1;
              const pct = stats?.totalReviews > 0 ? Math.round((count / total) * 100) : 0;
              return (
                <div key={stars} style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "13px", color: "#111112" }}>
                  <span style={{ width: "24px" }}>{stars}★</span>
                  <div style={{ flex: 1, height: "6px", background: "#FAF7F2", borderRadius: "3px", overflow: "hidden" }}>
                    <div style={{ width: `${pct}%`, height: "100%", background: "#C8A96B" }}></div>
                  </div>
                  <span style={{ width: "32px", textAlign: "right" }}>{pct}%</span>
                </div>
              );
            })}
          </div>

          {/* Right Column Action */}
            {eligible ? (
              <button 
                onClick={openWriteReviewModal} 
                style={{ background: "#111112", color: "#FFFFFF", padding: "16px 28px", border: "none", borderRadius: "12px", fontSize: "14px", fontWeight: "700", cursor: "pointer", textTransform: "uppercase", letterSpacing: "1px" }}
              >
                Write A Review
              </button>
            ) : (
              <div style={{ textAlign: "center", fontSize: "13px", color: "#5F6368" }}>
                🔒 Only customers who purchased this product can write a review.
              </div>
            )}
          </div>
        </div>
      {/* SECTION 7 — YOU MAY ALSO LIKE */}
      {recommendations.length > 0 && (
        <div className="related-products-section" style={{ marginTop: "80px", paddingTop: "40px", background: "#FFFFFF", borderTop: "1px solid #ECECEC" }}>
          <h2 style={{ fontSize: "32px", fontFamily: "Playfair Display, serif", fontWeight: "600", color: "#111111", marginBottom: "36px", textAlign: "center" }}>You May Also Like</h2>
          <div 
            className="related-products-grid"
            style={{ 
              display: "grid", 
              gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", 
              gap: "28px", 
              maxWidth: "1360px", 
              margin: "0 auto",
              padding: "0 24px"
            }}
          >
            {recommendations.map((item) => (
              <ProductCard key={item._id} product={item} />
            ))}
          </div>
        </div>
      )}

      {/* SECTION 8 — RECENTLY VIEWED */}
      {(() => {
        try {
          const viewed = JSON.parse(localStorage.getItem("venus_recently_viewed") || "[]");
          const items = viewed.filter((p) => p._id !== product._id).slice(0, 8);
          if (items.length === 0) return null;
          return (
            <div className="recently-viewed-section" style={{ marginTop: "80px", paddingTop: "40px", background: "#FFFFFF", borderTop: "1px solid #ECECEC" }}>
              <h2 style={{ fontSize: "32px", fontFamily: "Playfair Display, serif", fontWeight: "600", color: "#111111", marginBottom: "36px", textAlign: "center" }}>Recently Viewed</h2>
              <div 
                className="recently-viewed-grid"
                style={{ 
                  display: "grid", 
                  gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", 
                  gap: "28px", 
                  maxWidth: "1360px", 
                  margin: "0 auto",
                  padding: "0 24px"
                }}
              >
                {items.map((item) => (
                  <ProductCard key={item._id} product={item} />
                ))}
              </div>
            </div>
          );
        } catch (e) {
          return null;
        }
      })()}



      {/* Write/Edit Review Modal Overlay */}
      <AnimatePresence>
        {showModal && (
          <motion.div 
            className="modal-overlay"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => {
              document.body.style.overflow = 'auto';
              setShowModal(false);
            }}
          >
            <motion.div 
              ref={modalRef}
              className="modal-content-card-luxury"
              role="dialog"
              aria-modal="true"
              aria-labelledby="write-review-modal-title"
              initial={{ scale: 0.95, y: 15 }}
              animate={{ scale: 1, y: 0 }}
              exit={{ scale: 0.95, y: 15 }}
              onClick={(e) => e.stopPropagation()}
            >
              {/* Sticky Modal Header */}
              <div className="modal-header-row font-outfit" style={{ position: "sticky", top: 0, background: "#FCFAF6", zIndex: 10, borderBottom: "1px solid #EAE5D9", paddingBottom: "12px", marginBottom: "16px" }}>
                <div>
                  <h3 id="write-review-modal-title" style={{ margin: 0, fontSize: "1.4rem", fontFamily: "'Cinzel', serif", color: "#1A1A1A" }}>
                    Write a Review
                  </h3>
                  <span style={{ fontSize: "12px", color: "#8B7355", fontStyle: "italic" }}>
                    Share your experience with Venus Care.
                  </span>
                </div>
                <button type="button" onClick={() => {
                  document.body.style.overflow = 'auto';
                  setShowModal(false);
                }} className="modal-close-btn">
                  <FiX />
                </button>
              </div>

              {/* Star Picker Step 1 */}
              <div className="star-picker-section-luxury" style={{ display: "flex", flexDirection: "column", alignItems: "center", marginBottom: "20px" }}>
                <span className="rating-picker-label" style={{ marginBottom: "8px", fontWeight: "600", color: "#1A1A1A" }}>
                  How would you rate this product?
                </span>
                <div className="star-picker-row-luxury" style={{ display: "flex", gap: "6px" }}>
                  {[1, 2, 3, 4, 5].map((star) => (
                    <button
                      type="button"
                      key={star}
                      onClick={() => setRating(star)}
                      className={`star-picker-btn-luxury ${star <= rating ? "selected" : ""}`}
                      style={{ background: "none", border: "none", fontSize: "2rem", cursor: "pointer", color: star <= rating ? "#C8A165" : "#EAE5D9" }}
                    >
                      <HiStar />
                    </button>
                  ))}
                </div>
                <span style={{ marginTop: "6px", fontSize: "13px", fontWeight: "500", color: "#C8A165", textTransform: "uppercase", letterSpacing: "1px" }}>
                  {rating === 5 && "Excellent"}
                  {rating === 4 && "Good"}
                  {rating === 3 && "Average"}
                  {rating === 2 && "Poor"}
                  {rating === 1 && "Very Poor"}
                </span>
              </div>

              <form onSubmit={handleSubmitReview} className="modal-form-luxury" style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Step 2 — Essential fields */}
                <div className="form-input-group">
                  <label style={{ fontWeight: "600", fontSize: "13px", color: "#1A1A1A" }}>Review Title</label>
                  <input
                    type="text"
                    placeholder="Summarize your experience"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    required
                    maxLength={80}
                  />
                </div>

                <div className="form-input-group">
                  <label style={{ fontWeight: "600", fontSize: "13px", color: "#1A1A1A" }}>Review Description</label>
                  <textarea
                    placeholder="Tell us what you liked, the texture, fragrance, packaging, and results."
                    value={reviewContent}
                    onChange={(e) => setReviewContent(e.target.value)}
                    required
                    rows={4}
                    maxLength={1000}
                  />
                  <div className="character-counter-row font-outfit" style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: reviewContent.length < 20 ? "#D97706" : "#8B7355", marginTop: "4px" }}>
                    <span>{reviewContent.length}/1000 characters</span>
                    <span>{reviewContent.length < 20 ? `${20 - reviewContent.length} more needed` : "Rule Valid"}</span>
                  </div>
                </div>

                {/* Step 3 — Optional details (Collapsible accordion) */}
                <details className="premium-accordion-section" style={{ border: "1px solid #EAE5D9", borderRadius: "12px", padding: "12px", background: "#FAF8F5" }}>
                  <summary style={{ cursor: "pointer", fontWeight: "600", fontSize: "13px", color: "#1A1A1A", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span>Add more details (optional)</span>
                  </summary>
                  <div className="accordion-content-stack" style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "12px" }}>
                    <div className="form-input-group">
                      <label>Location</label>
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
                    <div className="form-input-group">
                      <label>Pros</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Radiant glow, hydration" 
                        value={submitPros}
                        onChange={(e) => setSubmitPros(e.target.value)}
                      />
                    </div>
                    <div className="form-input-group">
                      <label>Cons</label>
                      <input 
                        type="text" 
                        placeholder="e.g. Pricey, strong scent" 
                        value={submitCons}
                        onChange={(e) => setSubmitCons(e.target.value)}
                      />
                    </div>
                    <div className="form-input-group font-outfit">
                      <label>Skin Type</label>
                      <div className="pills-selection-row" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "4px" }}>
                        {["Dry", "Oily", "Sensitive", "Combination", "Normal"].map(type => (
                          <button
                            type="button"
                            key={type}
                            onClick={() => setSubmitSkinType(submitSkinType === type ? "" : type)}
                            className={`pill-selection-btn ${submitSkinType === type ? "active" : ""}`}
                            style={{ padding: "6px 14px", borderRadius: "20px", border: "1px solid #EAE5D9", background: submitSkinType === type ? "#C8A165" : "#FFFFFF", color: submitSkinType === type ? "#FFFFFF" : "#1A1A1A", cursor: "pointer", fontSize: "12px" }}
                          >
                            {type}
                          </button>
                        ))}
                      </div>
                    </div>
                    <label className="modal-toggle-label font-outfit" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#1A1A1A", cursor: "pointer" }}>
                      <input
                        type="checkbox"
                        checked={isAnonymous}
                        onChange={(e) => setIsAnonymous(e.target.checked)}
                      />
                      Post review anonymously?
                    </label>
                  </div>
                </details>

                {/* Step 4 — Premium Media Upload Box */}
                <div className="form-upload-section-luxury" style={{ border: "2px dashed #EAE5D9", borderRadius: "16px", padding: "16px", textAlign: "center", background: "#FAF8F5" }}>
                  <label style={{ display: "flex", flexDirection: "column", alignItems: "center", cursor: "pointer", gap: "6px" }}>
                    <FiCamera style={{ fontSize: "2rem", color: "#C8A165" }} />
                    <span style={{ fontSize: "14px", fontWeight: "600", color: "#1A1A1A" }}>Upload photos (optional)</span>
                    <span style={{ fontSize: "11px", color: "#8B7355" }}>Max 5 images (Up to 5MB each)</span>
                    <div style={{ display: "flex", gap: "8px", marginTop: "8px" }}>
                      <button type="button" onClick={handleAddMockPhoto} className="btn-mock-upload-choice" style={{ padding: "6px 12px", border: "1px solid #C8A165", background: "#FFFFFF", color: "#C8A165", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>
                        + Add Mock Photo
                      </button>
                      <button type="button" onClick={handleAddMockVideo} className="btn-mock-upload-choice" style={{ padding: "6px 12px", border: "1px solid #C8A165", background: "#FFFFFF", color: "#C8A165", borderRadius: "6px", cursor: "pointer", fontSize: "12px" }}>
                        + Add Mock Video
                      </button>
                    </div>
                  </label>

                  {/* Previews */}
                  {((uploadedImages.length > 0) || uploadedVideo) && (
                    <div className="uploaded-previews-flex" style={{ display: "flex", flexWrap: "wrap", gap: "8px", marginTop: "12px", justifyContent: "center" }}>
                      {uploadedImages.map((img, idx) => (
                        <div key={idx} className="preview-media-card" style={{ position: "relative", width: "60px", height: "60px", borderRadius: "8px", overflow: "hidden" }}>
                          <img src={img} alt="" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <button 
                            type="button" 
                            onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== idx))} 
                            className="remove-media-btn"
                            style={{ position: "absolute", top: "2px", right: "2px", background: "rgba(0,0,0,0.6)", border: "none", color: "#FFFFFF", borderRadius: "50%", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyItems: "center", fontSize: "10px", cursor: "pointer" }}
                          >
                            <FiX />
                          </button>
                        </div>
                      ))}
                      {uploadedVideo && (
                        <div className="preview-media-card video-card" style={{ position: "relative", width: "60px", height: "60px", borderRadius: "8px", overflow: "hidden" }}>
                          <video src={uploadedVideo} muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                          <button 
                            type="button" 
                            onClick={() => setUploadedVideo("")} 
                            className="remove-media-btn"
                            style={{ position: "absolute", top: "2px", right: "2px", background: "rgba(0,0,0,0.6)", border: "none", color: "#FFFFFF", borderRadius: "50%", width: "18px", height: "18px", display: "flex", alignItems: "center", justifyItems: "center", fontSize: "10px", cursor: "pointer" }}
                          >
                            <FiX />
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", gap: "8px", margin: "8px 0" }}>
                  <label className="modal-toggle-label font-outfit" style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#1A1A1A", cursor: "pointer" }}>
                    <input
                      type="checkbox"
                      checked={recommend}
                      onChange={(e) => setRecommend(e.target.checked)}
                    />
                    Recommend this luxury skincare formulation to other buyers?
                  </label>
                </div>

                {/* Sticky Modal Footer */}
                <div className="modal-actions-row" style={{ position: "sticky", bottom: 0, background: "#FCFAF6", zIndex: 10, borderTop: "1px solid #EAE5D9", paddingTop: "12px", display: "flex", justifyContent: "flex-end", gap: "10px" }}>
                  <button type="button" onClick={() => {
                    document.body.style.overflow = 'auto';
                    setShowModal(false);
                  }} className="btn-modal-cancel">
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
        <div className="mobile-sticky-cart">
          <button 
            onClick={handleAddToCart}
            className="mobile-sticky-btn add-to-cart"
            type="button"
            style={{ flex: 1, height: "52px", border: "1px solid #111111", background: "none", color: "#111111", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}
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
            style={{ flex: 1, height: "52px", border: "none", background: "#111111", color: "#FFFFFF", borderRadius: "8px", fontWeight: "700", cursor: "pointer" }}
          >
            Buy Now
          </button>
        </div>
      )}
    </div>
  );
};

export default ProductDetail;
