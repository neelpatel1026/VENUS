import { useState, useContext, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import "../styles/contact.css";

const Contact = () => {
  const { user } = useContext(AuthContext);

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    subject: "",
    category: "General Inquiry",
    orderNumber: "",
    message: "",
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);

  // Prefill authenticated user details
  useEffect(() => {
    if (user) {
      setFormData((prev) => ({
        ...prev,
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
      }));
    }
  }, [user]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    // Clear validation error when editing
    if (errors[name]) {
      setErrors((prev) => ({ ...prev, [name]: "" }));
    }
  };

  const validateForm = () => {
    const tempErrors = {};
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    const phoneRegex = /^[0-9]{10}$/;

    if (!formData.name.trim()) tempErrors.name = "Full Name is required";
    
    if (!formData.email.trim()) {
      tempErrors.email = "Email is required";
    } else if (!emailRegex.test(formData.email)) {
      tempErrors.email = "Please enter a valid email address";
    }

    if (!formData.phone.trim()) {
      tempErrors.phone = "Phone number is required";
    } else if (!phoneRegex.test(formData.phone.replace(/\D/g, ""))) {
      tempErrors.phone = "Phone number must be exactly 10 digits";
    }

    if (!formData.subject.trim()) tempErrors.subject = "Subject is required";
    if (!formData.category) tempErrors.category = "Please select a category";
    
    if (!formData.message.trim()) {
      tempErrors.message = "Message is required";
    } else if (formData.message.trim().length < 10) {
      tempErrors.message = "Message must be at least 10 characters long";
    }

    setErrors(tempErrors);
    return Object.keys(tempErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!validateForm()) {
      toast.error("Please correct the validation errors in the form.");
      return;
    }

    setLoading(true);
    try {
      const config = {};
      if (user && user.token) {
        config.headers = {
          Authorization: `Bearer ${user.token}`,
        };
      }

      const { data } = await axios.post("/api/complaints", formData, config);

      if (data.success) {
        toast.success("Complaint submitted successfully!");
        setFormData({
          name: user ? user.name || "" : "",
          email: user ? user.email || "" : "",
          phone: user ? user.phone || "" : "",
          subject: "",
          category: "General Inquiry",
          orderNumber: "",
          message: "",
        });
      }
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="contact-container">
      {/* Editorial Hero Header Banner */}
      <div 
        className="premium-page-hero"
        style={{ 
          background: "linear-gradient(135deg, #FAF6F0 0%, #F5ECE0 100%)", 
          borderBottom: "1px solid rgba(200, 169, 107, 0.2)", 
          padding: "40px 20px", 
          textAlign: "center", 
          position: "relative",
          overflow: "hidden",
          width: "100%",
          marginBottom: "40px"
        }}
      >
        <div style={{ position: "absolute", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(200, 169, 107, 0.08)", filter: "blur(40px)", top: "-50px", left: "-50px", pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: "250px", height: "250px", borderRadius: "50%", background: "rgba(200, 169, 107, 0.05)", filter: "blur(60px)", bottom: "-80px", right: "-50px", pointerEvents: "none" }} />
        
        <div style={{ maxWidth: "800px", margin: "0 auto", position: "relative", zIndex: "2" }}>
          <div style={{ fontSize: "0.75rem", letterSpacing: "2px", textTransform: "uppercase", color: "#8B7355", marginBottom: "14px", fontWeight: "700" }}>
            <Link to="/" style={{ color: "#8B7355", textDecoration: "none" }}>Home</Link>
            <span style={{ margin: "0 8px", opacity: 0.5 }}>/</span>
            <span style={{ color: "#1F2937" }}>Contact</span>
          </div>
          
          <span style={{ display: "inline-block", fontSize: "0.8rem", letterSpacing: "3px", textTransform: "uppercase", color: "#C8A96B", fontWeight: "700", marginBottom: "8px" }}>
            Customer Experience Centre
          </span>
          <h1 style={{ fontFamily: "'Cinzel', 'Didot', 'Times New Roman', serif", fontSize: "2.5rem", fontWeight: "700", color: "#1F2937", margin: "0 0 10px 0", letterSpacing: "-0.5px", lineHeight: "1.2" }}>
            Premium Assistance
          </h1>
          <div style={{ width: "40px", height: "1px", background: "#C8A96B", margin: "14px auto" }} />
          <p style={{ fontSize: "0.95rem", color: "#6B7280", margin: "0 auto", lineHeight: "1.6", maxWidth: "600px" }}>
            Whether you have skincare questions, product recommendations or order assistance, our beauty specialists are always ready to help.
          </p>
        </div>
      </div>

      <div className="contact-layout">
        {/* Company Information Card */}
        <div className="info-card">
          <h3>Store Information</h3>
          <div className="info-details">
            <div className="info-item">
              <span>Store Name</span>
              <h4>VENUS CARE</h4>
            </div>
            <div className="info-item">
              <span>Address</span>
              <h4>Ahmedabad, Gujarat, India</h4>
            </div>
            <div className="info-item">
              <span>Phone</span>
              <h4>+91 96726 81026</h4>
            </div>
            <div className="info-item">
              <span>Support Email</span>
              <h4>support@venuscare.com</h4>
            </div>
            <div className="info-item">
              <span>Business Hours</span>
              <h4>Mon - Sat: 9:00 AM - 7:00 PM</h4>
            </div>
            <div className="info-item">
              <span>Support Availability</span>
              <h4>24/7 online ticketing response</h4>
            </div>
          </div>
        </div>

        {/* Contact / Complaint Form */}
        <div className="form-column">
          <h3>Submit a Support Ticket</h3>
          <p className="form-subtitle">Fill in the form below and our team will get back to you shortly.</p>

          <form onSubmit={handleSubmit} className="contact-form">
            <div className="form-row">
              <div className="form-group">
                <label htmlFor="name">Full Name*</label>
                <input
                  type="text"
                  id="name"
                  name="name"
                  value={formData.name}
                  onChange={handleChange}
                  placeholder="Your full name"
                />
                {errors.name && <span className="error-text">{errors.name}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="email">Email Address*</label>
                <input
                  type="email"
                  id="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  placeholder="Your email address"
                />
                {errors.email && <span className="error-text">{errors.email}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="phone">Phone Number*</label>
                <input
                  type="tel"
                  id="phone"
                  name="phone"
                  value={formData.phone}
                  onChange={(e) => {
                    // Only numbers and limit to 10
                    const value = e.target.value.replace(/\D/g, "");
                    if (value.length <= 10) {
                      setFormData((prev) => ({ ...prev, phone: value }));
                      if (errors.phone) setErrors((prev) => ({ ...prev, phone: "" }));
                    }
                  }}
                  placeholder="10-digit phone number"
                />
                {errors.phone && <span className="error-text">{errors.phone}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="category">Category*</label>
                <select
                  id="category"
                  name="category"
                  value={formData.category}
                  onChange={handleChange}
                >
                  <option value="General Inquiry">General Inquiry</option>
                  <option value="Order Issue">Order Issue</option>
                  <option value="Product Complaint">Product Complaint</option>
                  <option value="Refund">Refund</option>
                  <option value="Delivery">Delivery</option>
                  <option value="Payment">Payment</option>
                  <option value="Technical Issue">Technical Issue</option>
                  <option value="Other">Other</option>
                </select>
                {errors.category && <span className="error-text">{errors.category}</span>}
              </div>
            </div>

            <div className="form-row">
              <div className="form-group">
                <label htmlFor="subject">Subject*</label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  placeholder="What is this regarding?"
                />
                {errors.subject && <span className="error-text">{errors.subject}</span>}
              </div>

              <div className="form-group">
                <label htmlFor="orderNumber">Order Number (Optional)</label>
                <input
                  type="text"
                  id="orderNumber"
                  name="orderNumber"
                  value={formData.orderNumber}
                  onChange={handleChange}
                  placeholder="e.g. ORD17000000"
                />
              </div>
            </div>

            <div className="form-group">
              <label htmlFor="message">Message / Description*</label>
              <textarea
                id="message"
                name="message"
                value={formData.message}
                onChange={handleChange}
                rows="6"
                placeholder="Please describe your complaint or inquiry in detail..."
              />
              {errors.message && <span className="error-text">{errors.message}</span>}
            </div>

            <button type="submit" className="submit-btn" disabled={loading}>
              {loading ? (
                <>
                  <span className="spinner"></span>
                  Submitting...
                </>
              ) : (
                "Submit Support Ticket"
              )}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Contact;
