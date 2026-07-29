import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { motion } from "framer-motion";
import { FiUser, FiMail, FiPhone, FiLock, FiCheck, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
import axios from "axios";
import Input from "../components/Input";
import "../styles/auth.css";

const Register = () => {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  
  const [termsAccepted, setTermsAccepted] = useState(false);
  const [privacyAccepted, setPrivacyAccepted] = useState(false);
  const [accepted, setAccepted] = useState(false);
  const [loading, setLoading] = useState(false);

  const [nameError, setNameError] = useState("");
  const [emailError, setEmailError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const [isNameValid, setIsNameValid] = useState(false);
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isPhoneValid, setIsPhoneValid] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isConfirmPasswordValid, setIsConfirmPasswordValid] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Password rules verification (Length: 6-50 characters)
  const rules = {
    length: password.length >= 6 && password.length <= 50,
    match: password === confirmPassword && confirmPassword !== "",
  };

  const isPasswordStrong = rules.length;

  const handleNameChange = (val) => {
    setName(val);
    if (!val.trim()) {
      setNameError("Full name is required");
      setIsNameValid(false);
    } else if (val.trim().length < 3) {
      setNameError("Name must be at least 3 characters");
      setIsNameValid(false);
    } else {
      setNameError("");
      setIsNameValid(true);
    }
  };

  const handleEmailChange = (val) => {
    setEmail(val);
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!val.trim()) {
      setEmailError("Email is required");
      setIsEmailValid(false);
    } else if (!emailRegex.test(val.toLowerCase().trim())) {
      setEmailError("Invalid email format");
      setIsEmailValid(false);
    } else {
      setEmailError("");
      setIsEmailValid(true);
    }
  };

  const handlePhoneChange = (val) => {
    const cleaned = val.replace(/\D/g, "");
    if (cleaned.length <= 10) {
      setPhone(cleaned);
      if (cleaned.length !== 10) {
        setPhoneError("Phone must be exactly 10 digits");
        setIsPhoneValid(false);
      } else {
        setPhoneError("");
        setIsPhoneValid(true);
      }
    }
  };

  const handlePasswordChange = (val) => {
    setPassword(val);
    const hasMinLength = val.length >= 6;
    const hasMaxLength = val.length <= 50;

    if (!val) {
      setPasswordError("Password is required");
      setIsPasswordValid(false);
    } else if (!hasMinLength) {
      setPasswordError("Password must be at least 6 characters.");
      setIsPasswordValid(false);
    } else if (!hasMaxLength) {
      setPasswordError("Password cannot exceed 50 characters.");
      setIsPasswordValid(false);
    } else {
      setPasswordError("");
      setIsPasswordValid(true);
    }

    const matches = val === confirmPassword && confirmPassword !== "";
    if (matches) {
      setConfirmPasswordError("");
      setIsConfirmPasswordValid(true);
    } else if (confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      setIsConfirmPasswordValid(false);
    }
  };

  const handleConfirmPasswordChange = (val) => {
    setConfirmPassword(val);
    if (val !== password) {
      setConfirmPasswordError("Passwords do not match");
      setIsConfirmPasswordValid(false);
    } else if (val === "") {
      setConfirmPasswordError("Confirm password is required");
      setIsConfirmPasswordValid(false);
    } else {
      setConfirmPasswordError("");
      setIsConfirmPasswordValid(true);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    // Client-side trim-and-check validation
    const trimmedName = name.trim();
    const trimmedEmail = email.toLowerCase().trim();
    const trimmedPhone = phone.trim();

    let hasErrors = false;

    if (trimmedName.length < 3) {
      setNameError("Name must be at least 3 characters");
      setIsNameValid(false);
      hasErrors = true;
    } else {
      setNameError("");
      setIsNameValid(true);
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setEmailError("Invalid email format");
      setIsEmailValid(false);
      hasErrors = true;
    } else {
      setEmailError("");
      setIsEmailValid(true);
    }

    if (trimmedPhone.length !== 10) {
      setPhoneError("Phone number must be exactly 10 digits");
      setIsPhoneValid(false);
      hasErrors = true;
    } else {
      setPhoneError("");
      setIsPhoneValid(true);
    }

    if (password.length < 6) {
      setPasswordError("Password must be at least 6 characters.");
      setIsPasswordValid(false);
      hasErrors = true;
    } else if (password.length > 50) {
      setPasswordError("Password cannot exceed 50 characters.");
      setIsPasswordValid(false);
      hasErrors = true;
    } else {
      setPasswordError("");
      setIsPasswordValid(true);
    }

    if (password !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      setIsConfirmPasswordValid(false);
      hasErrors = true;
    } else {
      setConfirmPasswordError("");
      setIsConfirmPasswordValid(true);
    }

    if (!termsAccepted || !privacyAccepted) {
      toast.error("Please accept the Terms and Privacy Policy to register");
      hasErrors = true;
    }

    if (hasErrors) return;

    setLoading(true);
    try {
      const res = await axios.post("/api/auth/register", {
        name: trimmedName,
        email: trimmedEmail,
        phone: trimmedPhone,
        password,
      });

      toast.success("Welcome! Account created successfully.");
      login(res.data);
      navigate("/");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Registration failed");
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <div className="auth-background-radial" />
      <div className="auth-container">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4, ease: "easeOut" }}
          className="auth-card"
          style={{ marginTop: "40px", marginBottom: "40px" }}
        >
          <div className="auth-header">
            <h1 className="auth-logo-text">Venus Care</h1>
            <span className="auth-tagline-text">Luxury Skincare</span>
            <h2 className="auth-title-text">Create Account</h2>
            <p className="auth-subtitle-text">Join us for a premium skincare experience</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>
            {/* FULL NAME */}
            <Input
              type="text"
              placeholder="Full Name"
              icon={FiUser}
              value={name}
              onChange={(e) => handleNameChange(e.target.value)}
              error={nameError}
              isValid={isNameValid}
              autoComplete="name"
              required
            />

            {/* EMAIL */}
            <Input
              type="email"
              placeholder="Email Address"
              icon={FiMail}
              value={email}
              onChange={(e) => handleEmailChange(e.target.value)}
              error={emailError}
              isValid={isEmailValid}
              autoComplete="email"
              required
            />

            {/* PHONE */}
            <Input
              type="tel"
              placeholder="Phone Number (10 digits)"
              icon={FiPhone}
              value={phone}
              onChange={(e) => handlePhoneChange(e.target.value)}
              error={phoneError}
              isValid={isPhoneValid}
              pattern="[0-9]{10}"
              maxLength="10"
              autoComplete="tel"
              required
            />

            {/* PASSWORD */}
            <Input
              type="password"
              placeholder="Password"
              icon={FiLock}
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              error={passwordError}
              isValid={isPasswordValid}
              autoComplete="new-password"
              required
            />

            {/* CONFIRM PASSWORD */}
            <Input
              type="password"
              placeholder="Confirm Password"
              icon={FiLock}
              value={confirmPassword}
              onChange={(e) => handleConfirmPasswordChange(e.target.value)}
              error={confirmPasswordError}
              isValid={isConfirmPasswordValid}
              autoComplete="new-password"
              required
              style={{ marginBottom: "24px" }}
            />



            {/* TERMS & PRIVACY */}
            <div style={{ marginBottom: "20px" }}>
              <label 
                className="auth-checkbox-label" 
                style={{ 
                  fontSize: "13.5px", 
                  display: "flex", 
                  alignItems: "flex-start", 
                  gap: "12px", 
                  cursor: "pointer",
                  minHeight: "44px",
                  padding: "10px 4px",
                  boxSizing: "border-box",
                  width: "100%"
                }}
                aria-label="I agree to the Terms and Conditions and Privacy Policy"
              >
                <input
                  type="checkbox"
                  className="auth-checkbox"
                  checked={accepted}
                  onChange={(e) => {
                    const val = e.target.checked;
                    setAccepted(val);
                    setTermsAccepted(val);
                    setPrivacyAccepted(val);
                  }}
                  style={{
                    width: "20px",
                    height: "20px",
                    marginTop: "2px",
                    flexShrink: 0,
                    cursor: "pointer"
                  }}
                />
                <span style={{ userSelect: "none", lineHeight: "1.4" }}>
                  I agree to the{" "}
                  <Link to="/terms" target="_blank" className="auth-link" onClick={(e) => e.stopPropagation()}>
                    Terms & Conditions
                  </Link>{" "}
                  and{" "}
                  <Link to="/privacy-policy" target="_blank" className="auth-link" onClick={(e) => e.stopPropagation()}>
                    Privacy Policy
                  </Link>.
                </span>
              </label>
            </div>

            {/* SUBMIT BUTTON (Disabled until strong password & terms/privacy accepted) */}
            <button
              type="submit"
              className="auth-btn"
              disabled={loading || !termsAccepted || !privacyAccepted || !isPasswordStrong}
              style={{ width: "100%" }}
            >
              {loading ? (
                <>
                  <div className="auth-spinner" />
                  <span>Creating Account...</span>
                </>
              ) : (
                "Create Account"
              )}
            </button>

            {/* LOGIN REDIRECT LINK */}
            <p style={{ margin: "24px 0 0 0", textAlign: "center", fontSize: "14px", color: "#6B7280" }}>
              Already have an account?{" "}
              <Link to="/login" className="auth-link">
                Sign In
              </Link>
            </p>
          </form>
        </motion.div>
      </div>
    </>
  );
};

export default Register;