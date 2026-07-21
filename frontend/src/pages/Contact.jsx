import { useState, useContext, useEffect } from "react";
import axios from "axios";
import toast from "react-hot-toast";
import { AuthContext } from "../context/AuthContext";
import { useLocation } from "react-router-dom";
import { FiMapPin, FiPhone, FiMail, FiClock, FiShield, FiSmile } from "react-icons/fi";
import "../styles/contact.css";

const Contact = () => {
  const { user } = useContext(AuthContext);
  const location = useLocation();

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

  // Prefill dynamic assistance requests from order details page
  useEffect(() => {
    if (location.state) {
      const { orderId, productDetails } = location.state;
      setFormData((prev) => ({
        ...prev,
        orderNumber: orderId || prev.orderNumber,
        subject: orderId ? `Assistance Request for Order #${orderId.slice(-8).toUpperCase()}` : prev.subject,
        message: productDetails 
          ? `Hi VENUS CARE Support Team,\n\nI need assistance with my order containing: ${productDetails}.\n\n[Please describe your issue here]\n`
          : prev.message,
        category: "Order Issue"
      }));
    }
  }, [location.state]);

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
        toast.success("Message sent successfully!");
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
    <div className="contact-page-wrapper route-fade-in">
      <div className="contact-container">
        {/* Two-Column Main Layout */}
        <div className="contact-layout">
          
          {/* Left Column: Contact Information Card */}
          <div className="info-card">
            <h3>Store Information</h3>
            <p className="info-card-desc">Reach out directly to our luxury experience centres.</p>
            
            <div className="info-details">
              <div className="info-item">
                <FiMapPin className="info-icon" />
                <div className="info-text">
                  <span>Store Name & Address</span>
                  <h4>VENUS CARE</h4>
                  <p>Ahmedabad, Gujarat, India</p>
                </div>
              </div>

              <div className="info-item">
                <FiPhone className="info-icon" />
                <div className="info-text">
                  <span>Phone Support</span>
                  <h4>+91 96726 81026</h4>
                  <p>Mon - Sat: 9:00 AM - 7:00 PM</p>
                </div>
              </div>

              <div className="info-item">
                <FiMail className="info-icon" />
                <div className="info-text">
                  <span>Customer Care Email</span>
                  <h4>support@venuscare.com</h4>
                  <p>Online ticketing response</p>
                </div>
              </div>

              <div className="info-item">
                <FiClock className="info-icon" />
                <div className="info-text">
                  <span>Business Hours</span>
                  <h4>Mon - Sat: 9:00 AM - 7:00 PM</h4>
                  <p>Closed on Sundays & National Holidays</p>
                </div>
              </div>

              <div className="info-item">
                <FiSmile className="info-icon" />
                <div className="info-text">
                  <span>Support Availability</span>
                  <h4>24/7 online response</h4>
                  <p>Fast review processing</p>
                </div>
              </div>
            </div>
          </div>

          {/* Right Column: Support Form */}
          <div className="form-column">
            <h3>Send Us a Message</h3>
            <p className="form-subtitle">Fill in the form below and our beauty specialists will get back to you shortly.</p>

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
                  rows="7"
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
                  "Send Message"
                )}
              </button>
            </form>
          </div>
        </div>

        {/* Bottom Trust Section (3 Premium Trust Items) */}
        <div className="trust-section">
          <div className="trust-item">
            <FiClock className="trust-icon" />
            <div className="trust-text">
              <h4>Fast Response</h4>
              <p>Usually within 24 hours</p>
            </div>
          </div>
          
          <div className="trust-item">
            <FiShield className="trust-icon" />
            <div className="trust-text">
              <h4>Secure Communication</h4>
              <p>Your information stays private</p>
            </div>
          </div>

          <div className="trust-item">
            <FiSmile className="trust-icon" />
            <div className="trust-text">
              <h4>Premium Customer Care</h4>
              <p>Dedicated beauty specialists</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
};

export default Contact;
