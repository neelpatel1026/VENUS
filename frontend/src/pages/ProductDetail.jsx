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
  const [guestName, setGuestName] = useState("");
  const [guestEmail, setGuestEmail] = useState("");

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
    if (!user && (!guestName.trim() || !guestEmail.trim())) {
      toast.error("Please enter your name and email to submit a review");
      return;
    }
    if (!user && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestEmail)) {
      toast.error("Please enter a valid email address");
      return;
    }
    try {
      setSubmitting(true);
      
      // Fetch CSRF token safely
      let csrfToken = window._csrfToken;
      if (!csrfToken) {
        try {
          const csrfRes = await fetch("/api/csrf/token", {
            headers: { "x-csrf-bypass": "true" }
          });
          if (csrfRes.ok) {
            const csrfData = await csrfRes.json();
            csrfToken = csrfData.csrfToken;
            window._csrfToken = csrfToken;
          }
        } catch (csrfErr) {
          console.error("Failed to retrieve CSRF token during submission:", csrfErr);
        }
      }

      if (!csrfToken) {
        toast.error("Unable to load security token.");
        setSubmitting(false);
        return;
      }

      const url = editReviewId ? `/api/reviews/${editReviewId}` : "/api/reviews";
      const method = editReviewId ? "PUT" : "POST";
      const activeOrderId = searchParams.get("orderId") || eligibleOrderId;
      
      const mediaList = [];
      uploadedImages.forEach(img => {
        if (typeof img === 'string') {
          mediaList.push({ url: img, type: "image", public_id: "" });
        } else if (img && img.url) {
          mediaList.push({ url: img.url, type: "image", public_id: img.public_id || "" });
        }
      });
      if (uploadedVideo) {
        if (typeof uploadedVideo === 'string') {
          mediaList.push({ url: uploadedVideo, type: "video", public_id: "" });
        } else if (uploadedVideo.url) {
          mediaList.push({ url: uploadedVideo.url, type: "video", public_id: uploadedVideo.public_id || "" });
        }
      }

      const payload = {
        rating,
        title,
        review: reviewContent,
        images: uploadedImages.map(img => typeof img === 'string' ? img : img.url),
        video: typeof uploadedVideo === 'string' ? uploadedVideo : (uploadedVideo?.url || ""),
        media: mediaList,
        location: locationInput,
        variant: variantInput,
        recommend,
        isAnonymous,
        skinType: submitSkinType,
        pros: submitPros,
        cons: submitCons,
        guestName,
        guestEmail
      };

      if (!editReviewId) {
        payload.productId = id;
        payload.orderId = activeOrderId || "000000000000000000000000"; // Fallback placeholder ID
      }

      const headers = {
        "Content-Type": "application/json",
        "X-CSRF-Token": csrfToken
      };
      if (user && user.token) {
        headers["Authorization"] = `Bearer ${user.token}`;
      }

      const res = await fetch(url, {
        method,
        headers,
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
        setGuestName("");
        setGuestEmail("");
        fetchReviews(true);
        checkReviewEligibility();
      } else {
        toast.error(data.message || "Review submission failed.");
      }
    } catch (err) {
      console.error("Detailed submission error:", err);
      toast.error("Server error while publishing review.");
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

  const [uploadingMedia, setUploadingMedia] = useState(false);

  const handleRealUpload = async (e, type) => {
    if (uploadingMedia) return;
    const files = e.target?.files ? Array.from(e.target.files) : [];
    if (files.length === 0) return;

    if (type === "image") {
      if (uploadedImages.length + files.length > 5) {
        toast.error("Maximum 5 images allowed");
        return;
      }
      for (const file of files) {
        if (file.size > 5 * 1024 * 1024) {
          toast.error(`Image "${file.name}" exceeds 5MB size limit`);
          return;
        }
      }
    } else if (type === "video") {
      if (files.length > 1 || uploadedVideo) {
        toast.error("Only 1 video allowed");
        return;
      }
      if (files[0].size > 20 * 1024 * 1024) {
        toast.error(`Video "${files[0].name}" exceeds 20MB size limit`);
        return;
      }
    }

    try {
      setUploadingMedia(true);
      
      for (const file of files) {
        const formData = new FormData();
        formData.append("file", file);

        const headers = {};
        if (user && user.token) {
          headers["Authorization"] = `Bearer ${user.token}`;
        }

        const res = await fetch("/api/reviews/upload", {
          method: "POST",
          headers,
          body: formData,
        });

        const data = await res.json();
        if (res.ok && data.url) {
          if (type === "image") {
            setUploadedImages((prev) => [...prev, { url: data.url, secure_url: data.url, type: "image", public_id: data.public_id || "" }]);
            toast.success(`Image "${file.name}" uploaded successfully! 📸`);
          } else {
            setUploadedVideo({ url: data.url, secure_url: data.url, type: "video", public_id: data.public_id || "" });
            toast.success(`Video "${file.name}" uploaded successfully! 📹`);
          }
        } else {
          toast.error(data.message || `Upload failed for "${file.name}"`);
        }
      }
    } catch (err) {
      console.error(err);
      toast.error("Upload failed. Please try again.");
    } finally {
      setUploadingMedia(false);
    }
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
      <div className="product-detail-wrapper route-fade-in product-detail-skeleton-container">
        {/* 1. Breadcrumb skeleton */}
        <div className="product-detail-breadcrumb skeleton-breadcrumb-row">
          <div className="skeleton-pill shimmer-ivory" style={{ width: "50px", height: "13px" }} />
          <span>/</span>
          <div className="skeleton-pill shimmer-ivory" style={{ width: "45px", height: "13px" }} />
          <span>/</span>
          <div className="skeleton-pill shimmer-ivory" style={{ width: "70px", height: "13px" }} />
          <span>/</span>
          <div className="skeleton-pill shimmer-ivory" style={{ width: "110px", height: "13px" }} />
        </div>

        {/* Main Product Skeleton Layout (2-column on desktop, 1-column on mobile) */}
        <div className="product-detail-layout">
          {/* Left Column: Gallery */}
          <div className="product-gallery-column">
            <div className="product-gallery-card skeleton-gallery-card">
              <div className="skeleton-main-image shimmer-ivory" />
            </div>

            {/* Thumbnail Row */}
            <div className="product-thumbnails-row skeleton-thumbnails-row">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="skeleton-thumb shimmer-ivory" />
              ))}
            </div>
          </div>

          {/* Right Column: Info & Actions */}
          <div className="product-info-column">
            <div className="product-header-info">
              {/* Category */}
              <div className="skeleton-pill shimmer-ivory" style={{ width: "90px", height: "12px", marginBottom: "10px" }} />
              
              {/* Title */}
              <div className="skeleton-line shimmer-ivory" style={{ width: "88%", height: "26px", marginBottom: "8px" }} />
              <div className="skeleton-line shimmer-ivory" style={{ width: "55%", height: "26px", marginBottom: "14px" }} />
              
              {/* Rating */}
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "18px" }}>
                <div style={{ display: "flex", gap: "4px" }}>
                  {[...Array(5)].map((_, i) => (
                    <div key={i} className="skeleton-star-item shimmer-ivory" />
                  ))}
                </div>
                <div className="skeleton-pill shimmer-ivory" style={{ width: "28px", height: "14px" }} />
                <div className="skeleton-pill shimmer-ivory" style={{ width: "75px", height: "14px" }} />
              </div>
            </div>

            {/* Pricing Card */}
            <div className="product-pricing-card" style={{ borderBottom: "1px solid #ECE7DF", paddingBottom: "16px" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: "12px", marginBottom: "8px" }}>
                <div className="skeleton-line shimmer-ivory" style={{ width: "120px", height: "32px" }} />
                <div className="skeleton-pill shimmer-ivory" style={{ width: "75px", height: "18px" }} />
                <div className="skeleton-pill shimmer-ivory" style={{ width: "60px", height: "18px" }} />
              </div>
              <div className="skeleton-pill shimmer-ivory" style={{ width: "130px", height: "12px", marginBottom: "14px" }} />
              
              {/* Prepaid discount banner skeleton */}
              <div className="skeleton-banner shimmer-ivory" style={{ height: "42px", width: "100%", borderRadius: "8px" }} />
            </div>

            {/* Quantity + Add to Cart Row */}
            <div className="product-purchase-actions-row" style={{ marginTop: "4px" }}>
              <div className="skeleton-qty-box shimmer-ivory" />
              <div className="skeleton-cta-btn shimmer-ivory" />
            </div>

            {/* Trust Icons Grid Skeleton (2x2 on mobile, 4 on desktop) */}
            <div className="trust-icons-container">
              {[...Array(4)].map((_, i) => (
                <div key={i} className="trust-card skeleton-trust-card">
                  <div className="skeleton-circle shimmer-ivory" style={{ width: "22px", height: "22px", margin: "0 auto 6px auto" }} />
                  <div className="skeleton-pill shimmer-ivory" style={{ width: "70%", height: "10px", margin: "0 auto" }} />
                </div>
              ))}
            </div>

            {/* Delivery & Fulfillment Card Skeleton */}
            <div className="fulfillment-card skeleton-fulfillment-card">
              <div className="skeleton-line shimmer-ivory" style={{ width: "160px", height: "18px", marginBottom: "14px" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div className="skeleton-line shimmer-ivory" style={{ width: "90%", height: "13px" }} />
                <div className="skeleton-line shimmer-ivory" style={{ width: "80%", height: "13px" }} />
                <div className="skeleton-line shimmer-ivory" style={{ width: "85%", height: "13px" }} />
                <div className="skeleton-line shimmer-ivory" style={{ width: "75%", height: "13px" }} />
              </div>
            </div>

            {/* Purity Standards Card Skeleton */}
            <div className="purity-standards-card skeleton-purity-card">
              <div className="skeleton-line shimmer-ivory" style={{ width: "180px", height: "18px", marginBottom: "14px" }} />
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div className="skeleton-line shimmer-ivory" style={{ width: "70%", height: "13px" }} />
                <div className="skeleton-line shimmer-ivory" style={{ width: "85%", height: "13px" }} />
                <div className="skeleton-line shimmer-ivory" style={{ width: "80%", height: "13px" }} />
              </div>
            </div>
          </div>
        </div>

        {/* Product Highlights Box Skeleton */}
        <div className="product-highlights-box skeleton-highlights-box">
          <div className="skeleton-line shimmer-ivory" style={{ width: "200px", height: "24px", margin: "0 auto 24px auto" }} />
          <div className="highlights-grid">
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                <div className="skeleton-circle shimmer-ivory" style={{ width: "22px", height: "22px", flexShrink: 0 }} />
                <div className="skeleton-line shimmer-ivory" style={{ flex: 1, height: "15px" }} />
              </div>
            ))}
          </div>
        </div>

        {/* Reviews Section Skeleton */}
        <div className="reviews-section-redesigned skeleton-reviews-box" style={{ marginTop: "40px" }}>
          <div className="reviews-left-col">
            <div className="skeleton-line shimmer-ivory" style={{ width: "90px", height: "48px", margin: "0 auto 8px auto" }} />
            <div className="skeleton-pill shimmer-ivory" style={{ width: "120px", height: "14px", margin: "0 auto" }} />
          </div>
          <div className="reviews-center-col">
            {[...Array(4)].map((_, i) => (
              <div key={i} style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                <div className="skeleton-pill shimmer-ivory" style={{ width: "24px", height: "12px" }} />
                <div className="skeleton-line shimmer-ivory" style={{ flex: 1, height: "8px", borderRadius: "4px" }} />
                <div className="skeleton-pill shimmer-ivory" style={{ width: "24px", height: "12px" }} />
              </div>
            ))}
          </div>
          <div className="reviews-right-col">
            <div className="skeleton-line shimmer-ivory" style={{ width: "140px", height: "16px", marginBottom: "8px" }} />
            <div className="skeleton-pill shimmer-ivory" style={{ width: "180px", height: "42px", borderRadius: "8px" }} />
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
    <div className="product-detail-wrapper route-fade-in">
      {/* Breadcrumb */}
      <div className="product-detail-breadcrumb">
        <Link to="/">Home</Link>
        {" / "}
        <Link to="/shop">Shop</Link>
        {" / "}
        <span className="breadcrumb-category">{product.category}</span>
        {" / "}
        <span className="breadcrumb-product-name">{product.name}</span>
      </div>

      {/* Main product detail */}
      <div className="product-detail-layout">
        
        {/* Left Column (Sticky Gallery) */}
        <div className="product-gallery-column">
          <div className="product-gallery-card">
            {discount > 0 && (
              <span className="discount-badge">
                {discount}% OFF
              </span>
            )}
            <img
              src={productImages[activeImageIndex]}
              alt={product.name}
              className="detail-image"
              loading="lazy"
              onError={(e) => {
                e.target.src = "/cosmetic_1.avif";
              }}
            />
          </div>

          {/* Thumbnail row */}
          <div className="product-thumbnails-row">
            {productImages.map((img, idx) => (
              <button
                key={idx}
                type="button"
                onClick={() => setActiveImageIndex(idx)}
                className={`product-thumb-btn ${activeImageIndex === idx ? "active" : ""}`}
                aria-label={`Product thumbnail ${idx + 1}`}
              >
                <img src={img} alt="" />
              </button>
            ))}
          </div>
        </div>

        {/* Right Column: Info and Purchase panel */}
        <div className="product-info-column">
          <div className="product-header-info">
            <span className="product-category-tag">
              {product.category}
            </span>
            <div className="product-title-row">
              <h1 className="product-detail-title">
                {product.name}
              </h1>
              <button
                type="button"
                className="product-share-btn"
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
                  }
                  navigator.clipboard.writeText(window.location.href);
                  toast.success("Product link copied to clipboard! 📋");
                }}
                title="Share Product"
              >
                <FiShare2 />
              </button>
            </div>
            {product.subtitle && (
              <p className="product-subtitle">{product.subtitle}</p>
            )}
            
            {/* Stars & Reviews */}
            <div className="product-rating-row">
              <HiStar className="rating-star-icon" />
              <strong className="rating-score">
                {stats && stats.totalReviews > 0 ? parseFloat(stats.averageRating).toFixed(1) : "0.0"}
              </strong>
              <a href="#reviews" className="rating-count-link">
                ({stats ? stats.totalReviews : 0} reviews)
              </a>
            </div>
          </div>

          {/* Pricing Details */}
          <div className="product-pricing-card">
            <div className="product-price-row">
              <span className="product-current-price">₹{product.price.toFixed(2)}</span>
              {discount > 0 && (
                <>
                  <span className="product-original-price">
                    ₹{product.originalPrice.toFixed(2)}
                  </span>
                  <span className="product-discount-pill">
                    ({discount}% OFF)
                  </span>
                </>
              )}
            </div>
            <p className="product-tax-note">Inclusive of all taxes</p>

            {/* Prepaid discount bar */}
            <div className="product-prepaid-discount-banner">
              <span>🪙</span> Pay only <strong className="prepaid-amount">₹{(product.price * 0.95).toFixed(2)}</strong> with Prepaid Discounts
            </div>
          </div>

          {/* Where to use tags */}
          {Array.isArray(product.wearTags) && product.wearTags.length > 0 && (
            <div className="product-wear-tags-row">
              {product.wearTags.map((tag, i) => (
                <span key={i} className="product-wear-tag">
                  📍 {tag}
                </span>
              ))}
            </div>
          )}

          {/* Quantity and CTA Actions */}
          <div className="product-purchase-section">
            {product.stock > 0 && product.stock <= 5 && (
              <div className="product-stock-alert">
                ⚠️ Limited Stock: Only {product.stock} items remaining.
              </div>
            )}
            
            {user?.role !== "admin" && (
              <div className="product-purchase-actions-row">
                {/* Quantity picker */}
                {product.stock > 0 && (
                  <div className="product-quantity-selector">
                    <button 
                      type="button" 
                      onClick={() => setSelectedQty(prev => Math.max(1, prev - 1))}
                      className="qty-btn"
                    >
                      -
                    </button>
                    <span className="qty-value">{selectedQty}</span>
                    <button 
                      type="button" 
                      onClick={() => setSelectedQty(prev => Math.min(product.stock, prev + 1))}
                      className="qty-btn"
                    >
                      +
                    </button>
                  </div>
                )}

                <div className="product-cta-btn-wrapper">
                  {product.stock === 0 ? (
                    <button
                      disabled
                      className="product-add-cart-btn disabled"
                    >
                      Out Of Stock
                    </button>
                  ) : (
                    <button
                      onClick={handleAddToCart}
                      className="product-add-cart-btn"
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
            <div className="product-combos-card">
              <span className="combo-tag">BESTSELLING COMBO SAVINGS</span>
              <h4 className="combo-title">Add Pair and Save More!</h4>
              <div className="combo-items-list">
                {product.comboProducts.map((combo, idx) => (
                  <div key={idx} className="combo-item-row">
                    <img src={combo.imageUrl} alt="" className="combo-item-img" />
                    <div>
                      <span className="combo-item-name">{combo.name}</span>
                      <span className="combo-item-price">₹{combo.price.toFixed(2)}</span>
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
                  className="combo-add-all-btn"
                >
                  ADD COMBO TO CART
                </button>
              </div>
            </div>
          )}

          {/* Trust Icons Section */}
          <div className="trust-icons-container">
            <div className="trust-card"><span className="trust-icon">🪔</span><span className="trust-text">Imported Oils</span></div>
            <div className="trust-card"><span className="trust-icon">🐰</span><span className="trust-text">Cruelty-Free</span></div>
            <div className="trust-card"><span className="trust-icon">📜</span><span className="trust-text">IFRA Certified</span></div>
            <div className="trust-card"><span className="trust-icon">🚚</span><span className="trust-text">Assured Delivery</span></div>
          </div>

          {/* Fulfillment Information Card */}
          <div className="fulfillment-card">
            <h4 className="fulfillment-card-title">Delivery & fulfillment</h4>
            <div className="fulfillment-items-list">
              <div className="fulfillment-item">🚚 <strong>Estimated Delivery:</strong> <span>{product.fulfillment?.eta || "Delivered within 2 - 4 business days."}</span></div>
              <div className="fulfillment-item">🔄 <strong>Return Policy:</strong> <span>{product.fulfillment?.returnPolicy || "7-day return policy on unused premium cosmetics."}</span></div>
              <div className="fulfillment-item">💳 <strong>Payment Options:</strong> <span>{product.fulfillment?.paymentInfo || "Razorpay secure pay, UPI, and major debit/credit cards."}</span></div>
              <div className="fulfillment-item">✨ <strong>Brand Guarantee:</strong> <span>{product.fulfillment?.authenticity || "100% authentic formulation direct from VENUS CARE laboratory."}</span></div>
            </div>
            <div className="fulfillment-pills-row">
              <span className="fulfillment-pill">✓ Secure Checkout</span>
              <span className="fulfillment-pill">✓ 100% Vegan</span>
              <span className="fulfillment-pill">✓ Acid-Free</span>
            </div>
          </div>

          {/* Formula Standards Section */}
          <div className="purity-standards-card">
            <h4 className="purity-standards-title">Venus Purity Standards</h4>
            <div className="purity-standards-list">
              {Array.isArray(product.formulaStandards) && product.formulaStandards.length > 0 ? (
                product.formulaStandards.map((std, idx) => (
                  <div key={idx} className="purity-standard-item">
                    <span className="purity-star">⭐</span> <span>{std}</span>
                  </div>
                ))
              ) : (
                <>
                  <div className="purity-standard-item"><span className="purity-star">⭐</span> <span>Dermatologically Tested Purity</span></div>
                  <div className="purity-standard-item"><span className="purity-star">⭐</span> <span>100% Cruelty Free & Vegan-Grade</span></div>
                  <div className="purity-standard-item"><span className="purity-star">⭐</span> <span>Formulated without Parabens or Sulfates</span></div>
                  <div className="purity-standard-item"><span className="purity-star">⭐</span> <span>Hydrating active ingredients suited for sensitive skin</span></div>
                </>
              )}
            </div>
          </div>

          {/* How to Apply Section */}
          <div className="how-to-apply-card">
            <h4 className="how-to-apply-title">How to Apply</h4>
            <div className="how-to-apply-list">
              {Array.isArray(product.howToApply) && product.howToApply.length > 0 ? (
                product.howToApply.map((step, idx) => (
                  <div key={idx} className="how-to-apply-step">
                    <span className="step-number">{idx + 1}</span>
                    <div className="step-text">
                      <strong className="step-title">{step.title}</strong>
                      <span className="step-desc">{step.description}</span>
                    </div>
                  </div>
                ))
              ) : (
                <>
                  <div className="how-to-apply-step">
                    <span className="step-number">1</span>
                    <div className="step-text">
                      <strong className="step-title">Dispense Application</strong>
                      <span className="step-desc">Apply a clean coin-sized droplet onto your fingertips.</span>
                    </div>
                  </div>
                  <div className="how-to-apply-step">
                    <span className="step-number">2</span>
                    <div className="step-text">
                      <strong className="step-title">Massage Skin</strong>
                      <span className="step-desc">Gently massage upwards using circular patterns.</span>
                    </div>
                  </div>
                  <div className="how-to-apply-step">
                    <span className="step-number">3</span>
                    <div className="step-text">
                      <strong className="step-title">Absorb Thoroughly</strong>
                      <span className="step-desc">Allow the formula to settle and protect for 2-3 minutes.</span>
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
        <div className="sticky-mobile-cart-bar">
          <div className="sticky-cart-price-info">
            <span className="sticky-cart-price-label">Total Price</span>
            <strong className="sticky-cart-price-val">₹{(product.price * selectedQty).toFixed(2)}</strong>
          </div>
          <button 
            type="button"
            onClick={handleAddToCart}
            className="sticky-cart-submit-btn"
          >
            Add To Cart ({selectedQty})
          </button>
        </div>
      )}

      {/* SECTION 2 — PRODUCT HIGHLIGHTS */}
      {Array.isArray(product.highlights) && product.highlights.length > 0 && (
        <div className="product-highlights-box">
          <h3 className="section-title-luxury">Product Highlights</h3>
          <div className="highlights-grid">
            {product.highlights.map((highlight, idx) => (
              <div key={idx} className="highlight-item">
                <span className="highlight-sparkle">✨</span>
                <span className="highlight-text">{highlight}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Ingredient Stories Section */}
      {Array.isArray(product.ingredientStories) && product.ingredientStories.length > 0 && (
        <div className="product-ingredient-stories-section">
          <h3 className="section-title-luxury">Notes in This Formula</h3>
          <div className="ingredient-stories-scroll">
            {product.ingredientStories.map((story, idx) => (
              <div key={idx} className="ingredient-story-card">
                {story.image && (
                  <img src={story.image} alt={story.title} className="story-img" />
                )}
                <h4 className="story-title">{story.title}</h4>
                <div className="story-tags-row">
                  {Array.isArray(story.tags) && story.tags.map((tag, tIdx) => (
                    <span key={tIdx} className="story-tag">{tag}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Notes In Set Section */}
      {Array.isArray(product.notesInSet) && product.notesInSet.length > 0 && (
        <div className="product-notes-set-section">
          <h3 className="section-title-luxury">Notes in This Set</h3>
          <div className="notes-set-scroll">
            {product.notesInSet.map((note, idx) => (
              <div key={idx} className="note-set-card">
                {note.image && (
                  <img src={note.image} alt="" className="note-img" />
                )}
                <h4 className="note-title">{note.title}</h4>
                <div className="note-tags-column">
                  {note.note1 && <span className="note-pill">{note.note1}</span>}
                  {note.note2 && <span className="note-pill">{note.note2}</span>}
                  {note.note3 && <span className="note-pill">{note.note3}</span>}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* SECTION 3 — ACCORDION INFORMATION BLOCKS */}
      <div className="product-accordions-container">
        <div className="accordions-list">
          
          {/* Accordion 1: Highlights */}
          {(product.productHighlights || (Array.isArray(product.highlights) && product.highlights.length > 0)) && (
            <div className="accordion-item">
              <button
                type="button"
                onClick={() => setExpandedAccordion(expandedAccordion === 1 ? null : 1)}
                className="accordion-header-btn"
              >
                <span className="accordion-heading">Product Highlights</span>
                <span className="accordion-toggle-icon">{expandedAccordion === 1 ? "−" : "+"}</span>
              </button>
              {expandedAccordion === 1 && (
                <div className="accordion-body-content">
                  {product.productHighlights || (Array.isArray(product.highlights) && (
                    <ul className="accordion-list-bullets">
                      {product.highlights.map((h, i) => <li key={i}>{h}</li>)}
                    </ul>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Accordion 2: FAQ */}
          {Array.isArray(product.faq) && product.faq.length > 0 && (
            <div className="accordion-item">
              <button
                type="button"
                onClick={() => setExpandedAccordion(expandedAccordion === 2 ? null : 2)}
                className="accordion-header-btn"
              >
                <span className="accordion-heading">FAQ</span>
                <span className="accordion-toggle-icon">{expandedAccordion === 2 ? "−" : "+"}</span>
              </button>
              {expandedAccordion === 2 && (
                <div className="accordion-body-content">
                  <div className="faq-list">
                    {product.faq.map((item, idx) => (
                      <div key={idx} className="faq-item">
                        <strong className="faq-question">Q: {item.question}</strong>
                        <span className="faq-answer">A: {item.answer}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Accordion 3: Ingredients */}
          {(product.ingredients) && (
            <div className="accordion-item">
              <button
                type="button"
                onClick={() => setExpandedAccordion(expandedAccordion === 3 ? null : 3)}
                className="accordion-header-btn"
              >
                <span className="accordion-heading">All Ingredients</span>
                <span className="accordion-toggle-icon">{expandedAccordion === 3 ? "−" : "+"}</span>
              </button>
              {expandedAccordion === 3 && (
                <div className="accordion-body-content">
                  {product.ingredients}
                </div>
              )}
            </div>
          )}

          {/* Accordion 4: Other Information */}
          {(product.otherInformation || product.otherInfo) && (
            <div className="accordion-item">
              <button
                type="button"
                onClick={() => setExpandedAccordion(expandedAccordion === 4 ? null : 4)}
                className="accordion-header-btn"
              >
                <span className="accordion-heading">Other Information</span>
                <span className="accordion-toggle-icon">{expandedAccordion === 4 ? "−" : "+"}</span>
              </button>
              {expandedAccordion === 4 && (
                <div className="accordion-body-content">
                  {product.otherInformation || product.otherInfo}
                </div>
              )}
            </div>
          )}

          {/* Accordion 5: How to Use */}
          {product.howToUse && (
            <div className="accordion-item">
              <button
                type="button"
                onClick={() => setExpandedAccordion(expandedAccordion === 5 ? null : 5)}
                className="accordion-header-btn"
              >
                <span className="accordion-heading">How To Use</span>
                <span className="accordion-toggle-icon">{expandedAccordion === 5 ? "−" : "+"}</span>
              </button>
              {expandedAccordion === 5 && (
                <div className="accordion-body-content">
                  {product.howToUse}
                </div>
              )}
            </div>
          )}

        </div>
      </div>

      <div className="reviews-section-redesigned" id="reviews">
        {/* Column 1 (Left) */}
        <div className="reviews-left-col">
          <div className="reviews-stars-summary-row">
            {[...Array(5)].map((_, i) => (
              <HiStar
                key={i}
                className={stats && stats.totalReviews > 0 && i < Math.round(stats.averageRating) ? "star-active" : "star-inactive"}
              />
            ))}
          </div>
          <h2 className="reviews-avg-rating-score">
            {stats && stats.totalReviews > 0 ? parseFloat(stats.averageRating).toFixed(2) : "0.0"}
          </h2>
          <span className="reviews-total-count-label">
            Based on {stats ? stats.totalReviews : 0} reviews
          </span>
        </div>

        {/* Column 2 (Center) */}
        <div className="reviews-center-col">
          {[5, 4, 3, 2, 1].map((stars) => {
            const count = stats?.breakdown?.[stars] || 0;
            const total = stats?.totalReviews || 1;
            const pct = stats?.totalReviews > 0 ? Math.round((count / total) * 100) : 0;
            return (
              <div key={stars} className="review-bar-row">
                <span className="review-bar-star-label">{stars}★</span>
                <div className="review-bar-track">
                  <div style={{ width: `${pct}%` }} className="review-bar-fill"></div>
                </div>
                <span className="review-bar-count">{count}</span>
              </div>
            );
          })}
        </div>

        {/* Column 3 (Right) */}
        <div className="reviews-right-col">
          <h4 className="reviews-cta-title">Share your experience</h4>
          <p className="reviews-cta-subtitle">Help other shoppers by reviewing this product.</p>
          <button 
            type="button"
            onClick={openWriteReviewModal} 
            className="write-review-btn-luxury"
          >
            Write a review
          </button>
        </div>
      </div>

      {/* Customer photos & videos gallery (Bellavita Style) */}
      {customerGallery && customerGallery.length > 0 && (
        <div className="customer-media-gallery-section">
          <h4 className="customer-media-title">Customer photos & videos</h4>
          <div className="customer-media-scroll">
            {customerGallery.slice(0, 10).map((media, idx) => {
              let mediaUrl = "";
              if (typeof media === "string") {
                mediaUrl = media;
              } else if (media && typeof media === "object") {
                mediaUrl = media.url || media.secure_url || media.path || "";
              }
              
              if (!mediaUrl) return null;
              const isVideo = mediaUrl.includes(".mp4") || mediaUrl.includes(".mov") || mediaUrl.includes(".webm");
              
              return (
                <div 
                  key={idx} 
                  onClick={() => handleOpenLightbox(customerGallery.map(m => typeof m === "string" ? m : (m?.url || m?.secure_url || m?.path || "")).filter(Boolean), idx)}
                  className="customer-media-thumb"
                >
                  {isVideo ? (
                    <video src={mediaUrl} muted playsInline />
                  ) : (
                    <img src={mediaUrl} alt="" />
                  )}
                  {isVideo && (
                    <div className="video-play-overlay">
                      ▶
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* SECTION 7 — YOU MAY ALSO LIKE */}
      {recommendations.length > 0 && (
        <div className="related-products-section">
          <h2 className="section-title-luxury">You May Also Like</h2>
          <div className="related-products-grid">
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
            <div className="recently-viewed-section">
              <h2 className="section-title-luxury">Recently Viewed</h2>
              <div className="recently-viewed-grid">
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
                 {!user && (
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="guest-info-fields">
                      <div className="form-input-group">
                        <label style={{ fontWeight: "600", fontSize: "13px", color: "#1A1A1A" }}>Your Name</label>
                        <input
                          type="text"
                          placeholder="Enter your name"
                          value={guestName}
                          onChange={(e) => setGuestName(e.target.value)}
                          required
                        />
                      </div>
                      <div className="form-input-group">
                        <label style={{ fontWeight: "600", fontSize: "13px", color: "#1A1A1A" }}>Your Email</label>
                        <input
                          type="email"
                          placeholder="Enter your email"
                          value={guestEmail}
                          onChange={(e) => setGuestEmail(e.target.value)}
                          required
                        />
                        <span style={{ fontSize: "11px", color: "#6B7280", marginTop: "4px", display: "block" }}>
                          Your email will not be displayed publicly.
                        </span>
                      </div>
                    </div>
                  )}
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

                                     {/* Step 4 — Premium Media Upload Box (Bellavita Style with Real Picker & Drag & Drop) */}
                 <div 
                   className="form-upload-section-luxury" 
                   onDragOver={(e) => e.preventDefault()}
                   onDrop={(e) => {
                     e.preventDefault();
                     const files = Array.from(e.dataTransfer.files);
                     const isVideo = files.some(f => f.type.startsWith("video/"));
                     handleRealUpload({ target: { files: e.dataTransfer.files } }, isVideo ? "video" : "image");
                   }}
                   style={{ 
                     border: "2px dashed #DCCFB6", 
                     borderRadius: "20px", 
                     padding: "32px", 
                     textAlign: "center", 
                     background: "#FBF8F2",
                     cursor: "pointer"
                   }}
                 >
                   <FiCamera style={{ fontSize: "56px", color: "#C59B5A", marginBottom: "12px" }} />
                   <h4 style={{ fontSize: "18px", fontWeight: "600", color: "#111111", margin: "0 0 4px 0" }}>Add photos or a video</h4>
                   <p style={{ fontSize: "14px", color: "#6B7280", margin: "0 0 24px 0" }}>Drag and drop files here, or choose from your device.</p>
                   
                   <div style={{ display: "flex", gap: "12px", justifyContent: "center", flexWrap: "wrap", marginBottom: "16px" }} className="upload-buttons-row">
                     <label 
                       className="upload-btn-premium"
                       style={{ 
                         display: "inline-flex", 
                         alignItems: "center", 
                         justifyContent: "center", 
                         background: "#FFFFFF", 
                         border: "1px solid #D9C8A8", 
                         borderRadius: "12px", 
                         height: "44px", 
                         padding: "0 22px", 
                         cursor: "pointer", 
                         fontSize: "13px", 
                         fontWeight: "600",
                         color: "#111111",
                         minWidth: "140px"
                       }}
                     >
                       📷 Choose Photos
                       <input 
                         type="file" 
                         accept="image/*" 
                         multiple 
                         onChange={(e) => handleRealUpload(e, "image")} 
                         style={{ display: "none" }} 
                       />
                     </label>
                     
                     <label 
                       className="upload-btn-premium"
                       style={{ 
                         display: "inline-flex", 
                         alignItems: "center", 
                         justifyContent: "center", 
                         background: "#FFFFFF", 
                         border: "1px solid #D9C8A8", 
                         borderRadius: "12px", 
                         height: "44px", 
                         padding: "0 22px", 
                         cursor: "pointer", 
                         fontSize: "13px", 
                         fontWeight: "600",
                         color: "#111111",
                         minWidth: "140px"
                       }}
                     >
                       📸 Take Photo
                       <input 
                         type="file" 
                         accept="image/*" 
                         capture="environment"
                         onChange={(e) => handleRealUpload(e, "image")} 
                         style={{ display: "none" }} 
                       />
                     </label>

                     <label 
                       className="upload-btn-premium"
                       style={{ 
                         display: "inline-flex", 
                         alignItems: "center", 
                         justifyContent: "center", 
                         background: "#FFFFFF", 
                         border: "1px solid #D9C8A8", 
                         borderRadius: "12px", 
                         height: "44px", 
                         padding: "0 22px", 
                         cursor: "pointer", 
                         fontSize: "13px", 
                         fontWeight: "600",
                         color: "#111111",
                         minWidth: "140px"
                       }}
                     >
                       🎥 Choose Video
                       <input 
                         type="file" 
                         accept="video/*" 
                         onChange={(e) => handleRealUpload(e, "video")} 
                         style={{ display: "none" }} 
                       />
                     </label>
                   </div>

                   {uploadingMedia && (
                     <div style={{ fontSize: "13px", color: "#C59B5A", fontWeight: "600", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px", margin: "12px 0" }}>
                       <span className="spinner" style={{ display: "inline-block", width: "16px", height: "16px", border: "2px solid #C59B5A", borderTopColor: "transparent", borderRadius: "50%", animation: "spin 1s linear infinite" }}></span>
                       Uploading media to Cloudinary...
                     </div>
                   )}

                   {/* Previews */}
                   {((uploadedImages.length > 0) || uploadedVideo) && (
                     <div className="uploaded-previews-flex" style={{ display: "flex", flexWrap: "wrap", gap: "12px", marginTop: "20px", justifyContent: "center" }}>
                       {uploadedImages.map((img, idx) => {
                         const imgSrc = typeof img === "string" ? img : (img?.url || img?.secure_url || "");
                         return (
                           <div key={idx} className="preview-media-card" style={{ position: "relative", width: "88px", height: "88px", borderRadius: "14px", overflow: "hidden", border: "1px solid #ECECEC" }}>
                             <img src={imgSrc} alt="Preview attachment" style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                             <button 
                               type="button" 
                               onClick={() => setUploadedImages(prev => prev.filter((_, i) => i !== idx))} 
                               className="remove-media-btn"
                               aria-label="Remove image"
                               style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.6)", border: "none", color: "#FFFFFF", borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", cursor: "pointer" }}
                             >
                               <FiX />
                             </button>
                           </div>
                         );
                       })}
                       {uploadedVideo && (
                         <div className="preview-media-card video-card" style={{ position: "relative", width: "88px", height: "88px", borderRadius: "14px", overflow: "hidden", border: "1px solid #ECECEC" }}>
                           <video src={typeof uploadedVideo === "string" ? uploadedVideo : (uploadedVideo?.url || uploadedVideo?.secure_url || "")} muted playsInline style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                           <div style={{ position: "absolute", inset: 0, background: "rgba(0,0,0,0.2)", display: "flex", alignItems: "center", justifyContent: "center", color: "#FFFFFF", pointerEvents: "none" }}>▶</div>
                           <button 
                             type="button" 
                             onClick={() => setUploadedVideo("")} 
                             className="remove-media-btn"
                             aria-label="Remove video"
                             style={{ position: "absolute", top: "4px", right: "4px", background: "rgba(0,0,0,0.6)", border: "none", color: "#FFFFFF", borderRadius: "50%", width: "22px", height: "22px", display: "flex", alignItems: "center", justifyContent: "center", fontSize: "12px", cursor: "pointer" }}
                           >
                             <FiX />
                           </button>
                         </div>
                       )}
                     </div>
                   )}

                   {/* Privacy text */}
                   <p style={{ fontSize: "11px", color: "#8B7355", margin: "16px 0 0 0" }}>
                     Your email is used only for review communication and verification purposes.
                   </p>
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
