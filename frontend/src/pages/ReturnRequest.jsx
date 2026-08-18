import React, { useState, useEffect, useContext } from "react";
import { useNavigate, useParams, Link } from "react-router-dom";
import axios from "axios";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import { motion, AnimatePresence } from "framer-motion";
import {
  FiArrowLeft,
  FiUploadCloud,
  FiX,
  FiCheckCircle,
  FiAlertCircle,
  FiClock,
  FiPackage,
  FiShield,
  FiInfo
} from "react-icons/fi";
import "../styles/ReturnRequest.css";

const REASON_CATEGORIES = [
  { id: "Product Damaged", label: "Product Damaged / Broken", icon: "💥" },
  { id: "Wrong Product Received", label: "Wrong Product Received", icon: "📦" },
  { id: "Product Arrived Opened / Leaking", label: "Arrived Opened / Leaking", icon: "💧" },
  { id: "Product Quality Issue", label: "Product Quality Issue", icon: "⚠️" },
  { id: "Product Expired", label: "Product Expired / Old Stock", icon: "⏳" },
  { id: "Product Different from Description", label: "Different from Description", icon: "🔍" },
  { id: "Missing Item", label: "Missing Item from Box", icon: "❓" },
  { id: "Product Does Not Meet Expectations", label: "Does Not Meet Expectations", icon: "👎" },
  { id: "Other", label: "Other Issue", icon: "📝" },
];

const ReturnRequest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [order, setOrder] = useState(null);
  const [loadingOrder, setLoadingOrder] = useState(true);
  const [orderError, setOrderError] = useState("");

  const [reasonCategory, setReasonCategory] = useState("");
  const [reason, setReason] = useState("");
  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [refundMethod, setRefundMethod] = useState("Original Payment Method");
  const [upiId, setUpiId] = useState("");
  const [bankName, setBankName] = useState("");
  const [accountHolder, setAccountHolder] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [ifscCode, setIfscCode] = useState("");

  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});

  // 1. Fetch Order Details & Verify Return Eligibility
  useEffect(() => {
    const fetchOrderDetails = async () => {
      if (!user?.token) return;
      setLoadingOrder(true);
      setOrderError("");
      try {
        const { data } = await axios.get(`/api/returns/order/${id}`, {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        if (data.success) {
          setOrder(data.order);
        }
      } catch (error) {
        console.error("Fetch return order error:", error);
        const errMsg = error.response?.data?.message || "Order is not eligible for return.";
        setOrderError(errMsg);
      } finally {
        setLoadingOrder(false);
      }
    };

    fetchOrderDetails();
  }, [id, user]);

  // 2. Handle File Selection with Validation
  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    if (!files.length) return;

    if (images.length + files.length > 5) {
      toast.error("You can upload a maximum of 5 product photos.");
      return;
    }

    const validFiles = [];
    const newPreviews = [...previews];

    for (const file of files) {
      // Validate file type
      if (!file.type.startsWith("image/")) {
        toast.error(`${file.name} is not a valid image file.`);
        continue;
      }
      // Validate file size (10MB max)
      if (file.size > 10 * 1024 * 1024) {
        toast.error(`${file.name} exceeds the 10MB size limit.`);
        continue;
      }

      validFiles.push(file);
      newPreviews.push(URL.createObjectURL(file));
    }

    setImages((prev) => [...prev, ...validFiles]);
    setPreviews(newPreviews);

    if (validFiles.length > 0) {
      setFormErrors((prev) => ({ ...prev, images: null }));
    }
  };

  // 3. Remove Selected Photo
  const handleRemoveImage = (indexToRemove) => {
    setImages((prev) => prev.filter((_, idx) => idx !== indexToRemove));
    setPreviews((prev) => {
      // Revoke memory URL
      URL.revokeObjectURL(prev[indexToRemove]);
      return prev.filter((_, idx) => idx !== indexToRemove);
    });
  };

  // 4. Validate Form
  const validateForm = () => {
    const errors = {};

    if (!reasonCategory) {
      errors.reasonCategory = "Please select a return reason category.";
    }

    if (!reason.trim()) {
      errors.reason = "Please enter a detailed explanation of the issue.";
    } else if (reason.trim().length < 15) {
      errors.reason = "Please provide more details (minimum 15 characters).";
    }

    if (!images || images.length === 0) {
      errors.images = "At least one clear photo of the received product is required.";
    }

    if (refundMethod === "UPI" && !upiId.trim()) {
      errors.upiId = "Please provide a valid UPI ID (e.g. name@okhdfcbank).";
    }

    if (refundMethod === "Bank") {
      if (!accountNumber.trim()) errors.accountNumber = "Account number is required.";
      if (!ifscCode.trim()) errors.ifscCode = "IFSC code is required.";
    }

    setFormErrors(errors);
    return Object.keys(errors).length === 0;
  };

  // 5. Submit Return Request
  const handleSubmitReturn = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please fill in all required fields marked in red.");
      return;
    }

    setSubmitting(true);
    try {
      const formData = new FormData();
      formData.append("orderId", id);
      formData.append("reasonCategory", reasonCategory);
      formData.append("reason", reason.trim());
      formData.append("refundMethod", refundMethod);

      if (refundMethod === "UPI") {
        formData.append("upiId", upiId.trim());
      } else if (refundMethod === "Bank") {
        formData.append("bankName", bankName.trim());
        formData.append("accountHolder", accountHolder.trim());
        formData.append("accountNumber", accountNumber.trim());
        formData.append("ifscCode", ifscCode.trim().toUpperCase());
      }

      for (let i = 0; i < images.length; i++) {
        formData.append("images", images[i]);
      }

      const res = await axios.post("/api/returns", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${user.token}`,
        },
      });

      if (res.data.success) {
        toast.success("Return request submitted successfully! 🎉");
        navigate("/return-success");
      }
    } catch (error) {
      console.error("Submit return error:", error);
      const msg = error.response?.data?.message || "Failed to submit return request. Please try again.";
      toast.error(msg);
    } finally {
      setSubmitting(false);
    }
  };

  // Loading State
  if (loadingOrder) {
    return (
      <div className="return-page route-fade-in">
        <div className="return-card-skeleton">
          <div className="shimmer-bg" style={{ height: "24px", width: "180px", borderRadius: "6px", marginBottom: "16px" }} />
          <div className="shimmer-bg" style={{ height: "14px", width: "80%", borderRadius: "4px", marginBottom: "24px" }} />
          <div className="shimmer-bg" style={{ height: "140px", width: "100%", borderRadius: "14px", marginBottom: "20px" }} />
          <div className="shimmer-bg" style={{ height: "200px", width: "100%", borderRadius: "14px" }} />
        </div>
      </div>
    );
  }

  // Error or Ineligible State
  if (orderError) {
    return (
      <div className="return-page route-fade-in">
        <div className="return-ineligible-card">
          <div className="ineligible-icon-wrap">
            <FiAlertCircle size={36} color="#DC2626" />
          </div>
          <h2>Cannot Process Return</h2>
          <p>{orderError}</p>
          <div className="ineligible-actions">
            <Link to="/MyOrders" className="btn-return-back">
              <FiArrowLeft /> Back to My Orders
            </Link>
            <Link to="/contact" className="btn-return-help">
              Contact Customer Care
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="return-page route-fade-in font-outfit">
      <div className="return-container-luxury">
        
        {/* Navigation Breadcrumb */}
        <div className="return-nav-bar">
          <Link to={`/order/${id}`} className="return-back-link">
            <FiArrowLeft size={16} /> Back to Order Details
          </Link>
          <span className="return-order-tag">Order #{id?.slice(-8).toUpperCase()}</span>
        </div>

        {/* Header Block */}
        <div className="return-header-block">
          <h1 className="return-main-title font-serif">Request Product Return / Replacement</h1>
          <p className="return-header-sub">
            We are dedicated to your satisfaction. Please provide the reason and a clear photo of the received items to expedite inspection and pickup.
          </p>
        </div>

        {/* 1. ORDER SUMMARY CARD */}
        {order && (
          <div className="return-order-summary-card">
            <div className="summary-card-header">
              <span className="summary-section-label">
                <FiPackage size={14} /> ORDER ITEMS FOR RETURN
              </span>
              <span className="summary-status-badge">
                <FiCheckCircle size={12} /> Delivered
              </span>
            </div>

            <div className="return-items-list">
              {(order.items || []).map((item, index) => (
                <div key={item._id || index} className="return-item-row">
                  <img
                    src={item.productImage || "/cosmetic_1.avif"}
                    alt={item.productName}
                    className="return-item-thumb"
                  />
                  <div className="return-item-info">
                    <h4 className="return-item-name">{item.productName}</h4>
                    <span className="return-item-qty">Qty: {item.qty} • ₹{item.price?.toFixed(2)}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="return-guarantee-note">
              <FiShield size={14} color="#C8A165" />
              <span>Venus Care 7-Day Quality Guarantee • Free doorstep reverse pickup upon approval.</span>
            </div>
          </div>
        )}

        <form onSubmit={handleSubmitReturn} className="return-form-body">
          
          {/* 2. REASON CATEGORY SELECTION (MANDATORY) */}
          <div className="form-section-card">
            <label className="section-field-label">
              1. Select Return Reason <span className="required-star">*</span>
            </label>
            <p className="field-hint-text">Choose the primary reason for requesting a return or replacement.</p>

            <div className="reason-categories-grid">
              {REASON_CATEGORIES.map((cat) => {
                const isSelected = reasonCategory === cat.id;
                return (
                  <button
                    key={cat.id}
                    type="button"
                    onClick={() => {
                      setReasonCategory(cat.id);
                      setFormErrors((prev) => ({ ...prev, reasonCategory: null }));
                    }}
                    className={`reason-pill-btn ${isSelected ? "selected" : ""}`}
                  >
                    <span className="reason-pill-icon">{cat.icon}</span>
                    <span className="reason-pill-text">{cat.label}</span>
                  </button>
                );
              })}
            </div>
            {formErrors.reasonCategory && (
              <span className="form-error-msg"><FiAlertCircle size={13} /> {formErrors.reasonCategory}</span>
            )}
          </div>

          {/* 3. MEANINGFUL EXPLANATION (MANDATORY) */}
          <div className="form-section-card">
            <div className="label-with-counter">
              <label className="section-field-label">
                2. Explain the Issue in Detail <span className="required-star">*</span>
              </label>
              <span className={`char-counter-pill ${reason.length < 15 ? "invalid" : "valid"}`}>
                {reason.length} / 500 chars (min 15)
              </span>
            </div>
            <p className="field-hint-text">
              Describe what was received, damage details, missing components, or packaging issues.
            </p>

            <textarea
              className={`return-textarea ${formErrors.reason ? "error-border" : ""}`}
              placeholder="Please provide specific details. Example: 'The bottle seal arrived broken and leaked inside the package.' or 'Received variant A instead of the ordered variant B.'"
              value={reason}
              maxLength={500}
              onChange={(e) => {
                setReason(e.target.value);
                if (e.target.value.trim().length >= 15) {
                  setFormErrors((prev) => ({ ...prev, reason: null }));
                }
              }}
              rows={4}
            />
            {formErrors.reason && (
              <span className="form-error-msg"><FiAlertCircle size={13} /> {formErrors.reason}</span>
            )}
          </div>

          {/* 4. MANDATORY PHOTO PROOF UPLOAD */}
          <div className="form-section-card">
            <div className="label-with-counter">
              <label className="section-field-label">
                3. Upload Received Product Photos <span className="required-star">* (Mandatory)</span>
              </label>
              <span className="photo-count-pill">{images.length} / 5 Photos</span>
            </div>
            <p className="field-hint-text">
              Please take and attach clear photos of the physical product, packaging box, batch number, or damaged area for fast verification.
            </p>

            {/* Dropzone / Upload Box */}
            <div className="photo-upload-dropzone">
              <input
                type="file"
                id="return-photo-picker"
                multiple
                accept="image/*"
                onChange={handleImageChange}
                className="hidden-file-input"
                disabled={images.length >= 5}
              />
              <label htmlFor="return-photo-picker" className="dropzone-inner-content">
                <div className="upload-icon-circle">
                  <FiUploadCloud size={24} color="#C8A165" />
                </div>
                <div className="dropzone-text-block">
                  <span className="dropzone-main-text">
                    {images.length >= 5 ? "Maximum 5 photos selected" : "Click to select or capture photos from camera"}
                  </span>
                  <span className="dropzone-subtext">JPEG, PNG, WEBP, AVIF up to 10MB each</span>
                </div>
              </label>
            </div>

            {formErrors.images && (
              <span className="form-error-msg"><FiAlertCircle size={13} /> {formErrors.images}</span>
            )}

            {/* Previews Grid */}
            {previews.length > 0 && (
              <div className="photo-previews-grid">
                {previews.map((src, index) => (
                  <motion.div
                    key={index}
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="preview-thumb-card"
                  >
                    <img src={src} alt={`Product Proof ${index + 1}`} className="preview-img" />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(index)}
                      className="preview-remove-btn"
                      aria-label="Remove photo"
                    >
                      <FiX size={14} />
                    </button>
                    <span className="preview-badge">Photo {index + 1}</span>
                  </motion.div>
                ))}
              </div>
            )}
          </div>

          {/* 5. REFUND PREFERENCE */}
          <div className="form-section-card">
            <label className="section-field-label">
              4. Refund Preference
            </label>
            <p className="field-hint-text">Choose where you want the refund credited once the return is inspected.</p>

            <div className="refund-method-options">
              <label className={`refund-radio-card ${refundMethod === "Original Payment Method" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="refundMethod"
                  value="Original Payment Method"
                  checked={refundMethod === "Original Payment Method"}
                  onChange={() => setRefundMethod("Original Payment Method")}
                />
                <div className="radio-text-wrap">
                  <strong>Original Payment Source</strong>
                  <span>Prepaid card/netbanking or store wallet</span>
                </div>
              </label>

              <label className={`refund-radio-card ${refundMethod === "UPI" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="refundMethod"
                  value="UPI"
                  checked={refundMethod === "UPI"}
                  onChange={() => setRefundMethod("UPI")}
                />
                <div className="radio-text-wrap">
                  <strong>UPI Transfer (Direct to VPA)</strong>
                  <span>Instant transfer to GPay, PhonePe, Paytm, etc.</span>
                </div>
              </label>

              <label className={`refund-radio-card ${refundMethod === "Bank" ? "selected" : ""}`}>
                <input
                  type="radio"
                  name="refundMethod"
                  value="Bank"
                  checked={refundMethod === "Bank"}
                  onChange={() => setRefundMethod("Bank")}
                />
                <div className="radio-text-wrap">
                  <strong>Bank Account (NEFT / IMPS)</strong>
                  <span>Account Number & IFSC Code</span>
                </div>
              </label>
            </div>

            {/* UPI Input */}
            {refundMethod === "UPI" && (
              <div className="conditional-fields-block">
                <label className="input-sublabel">Enter UPI ID (VPA) *</label>
                <input
                  type="text"
                  placeholder="e.g. yourname@oksbi / 9876543210@paytm"
                  value={upiId}
                  onChange={(e) => setUpiId(e.target.value)}
                  className="return-input-field"
                />
                {formErrors.upiId && <span className="form-error-msg">{formErrors.upiId}</span>}
              </div>
            )}

            {/* Bank Inputs */}
            {refundMethod === "Bank" && (
              <div className="conditional-fields-block bank-fields-grid">
                <div>
                  <label className="input-sublabel">Bank Name</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC Bank"
                    value={bankName}
                    onChange={(e) => setBankName(e.target.value)}
                    className="return-input-field"
                  />
                </div>
                <div>
                  <label className="input-sublabel">Account Holder Name</label>
                  <input
                    type="text"
                    placeholder="Full name as on passbook"
                    value={accountHolder}
                    onChange={(e) => setAccountHolder(e.target.value)}
                    className="return-input-field"
                  />
                </div>
                <div>
                  <label className="input-sublabel">Account Number *</label>
                  <input
                    type="text"
                    placeholder="Bank account number"
                    value={accountNumber}
                    onChange={(e) => setAccountNumber(e.target.value)}
                    className="return-input-field"
                  />
                  {formErrors.accountNumber && <span className="form-error-msg">{formErrors.accountNumber}</span>}
                </div>
                <div>
                  <label className="input-sublabel">IFSC Code *</label>
                  <input
                    type="text"
                    placeholder="e.g. HDFC0001234"
                    value={ifscCode}
                    onChange={(e) => setIfscCode(e.target.value.toUpperCase())}
                    className="return-input-field"
                  />
                  {formErrors.ifscCode && <span className="form-error-msg">{formErrors.ifscCode}</span>}
                </div>
              </div>
            )}
          </div>

          {/* 6. SUBMIT BUTTON & DISCLAIMER */}
          <div className="return-submit-footer">
            <div className="return-policy-info-box">
              <FiInfo size={16} color="#6B7280" />
              <span>
                By submitting this return request, you confirm that the product will be kept intact with all original accessories and packaging for reverse pickup.
              </span>
            </div>

            <button
              type="submit"
              disabled={submitting}
              className="btn-submit-return-luxury"
            >
              {submitting ? "Uploading Proof & Submitting Request..." : "Submit Return Request"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};

export default ReturnRequest;
