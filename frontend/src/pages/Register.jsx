import { useState, useContext } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { motion } from "framer-motion";
import { FiUser, FiMail, FiPhone, FiLock, FiEye, FiEyeOff, FiCheck, FiX } from "react-icons/fi";
import toast from "react-hot-toast";
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

  // Password rules verification
  const rules = {
    length: password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number: /[0-9]/.test(password),
    special: /[^A-Za-z0-9]/.test(password),
    match: password === confirmPassword && confirmPassword !== "",
  };

  const isPasswordStrong = Object.values(rules).every(Boolean);

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
    const hasLength = val.length >= 8;
    const hasUpper = /[A-Z]/.test(val);
    const hasLower = /[a-z]/.test(val);
    const hasNum = /[0-9]/.test(val);
    const hasSpecial = /[^A-Za-z0-9]/.test(val);
    const matches = val === confirmPassword && confirmPassword !== "";

    if (hasLength && hasUpper && hasLower && hasNum && hasSpecial) {
      setPasswordError("");
      setIsPasswordValid(true);
    } else {
      setPasswordError("Password is too weak");
      setIsPasswordValid(false);
    }

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

    if (!isPasswordStrong) {
      setPasswordError("Please meet all password strength rules");
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
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          name: trimmedName,
          email: trimmedEmail,
          phone: trimmedPhone,
          password,
        }),
      });

      const data = await res.json();

      if (res.ok) {
        toast.success("Welcome! Account created successfully.");
        login(data);
        navigate("/");
      } else {
        toast.error(data.message || "Registration failed");
      }
    } catch (error) {
      console.error(error);
      toast.error("Connection error. Please try again.");
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
            <div className={`auth-input-wrapper ${nameError ? "error" : isNameValid ? "success" : ""}`}>
              <span className="auth-input-icon">
                <FiUser />
              </span>
              <input
                type="text"
                placeholder="Full Name"
                className="auth-input"
                value={name}
                onChange={(e) => handleNameChange(e.target.value)}
                autoComplete="name"
                required
              />
              {nameError && <p className="auth-error-text">{nameError}</p>}
            </div>

            {/* EMAIL */}
            <div className={`auth-input-wrapper ${emailError ? "error" : isEmailValid ? "success" : ""}`}>
              <span className="auth-input-icon">
                <FiMail />
              </span>
              <input
                type="email"
                placeholder="Email Address"
                className="auth-input"
                value={email}
                onChange={(e) => handleEmailChange(e.target.value)}
                autoComplete="email"
                required
              />
              {emailError && <p className="auth-error-text">{emailError}</p>}
            </div>

            {/* PHONE */}
            <div className={`auth-input-wrapper ${phoneError ? "error" : isPhoneValid ? "success" : ""}`}>
              <span className="auth-input-icon">
                <FiPhone />
              </span>
              <input
                type="tel"
                placeholder="Phone Number (10 digits)"
                className="auth-input"
                value={phone}
                onChange={(e) => handlePhoneChange(e.target.value)}
                pattern="[0-9]{10}"
                maxLength="10"
                autoComplete="tel"
                required
              />
              {phoneError && <p className="auth-error-text">{phoneError}</p>}
            </div>

            {/* PASSWORD */}
            <div className={`auth-input-wrapper ${passwordError ? "error" : isPasswordValid ? "success" : ""}`}>
              <span className="auth-input-icon">
                <FiLock />
              </span>
              <input
                type={showPassword ? "text" : "password"}
                placeholder="Password"
                className="auth-input"
                value={password}
                onChange={(e) => handlePasswordChange(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="auth-input-action"
                onClick={() => setShowPassword(!showPassword)}
                tabIndex="-1"
                aria-label={showPassword ? "Hide password" : "Show password"}
              >
                {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
              {passwordError && <p className="auth-error-text">{passwordError}</p>}
            </div>

            {/* CONFIRM PASSWORD */}
            <div className={`auth-input-wrapper ${confirmPasswordError ? "error" : isConfirmPasswordValid ? "success" : ""}`} style={{ marginBottom: "24px" }}>
              <span className="auth-input-icon">
                <FiLock />
              </span>
              <input
                type={showConfirmPassword ? "text" : "password"}
                placeholder="Confirm Password"
                className="auth-input"
                value={confirmPassword}
                onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                autoComplete="new-password"
                required
              />
              <button
                type="button"
                className="auth-input-action"
                onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                tabIndex="-1"
                aria-label={showConfirmPassword ? "Hide confirm password" : "Show confirm password"}
              >
                {showConfirmPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
              </button>
              {confirmPasswordError && <p className="auth-error-text">{confirmPasswordError}</p>}
            </div>

            {/* PASSWORD LIVE VALIDATION CHECKLIST */}
            {password.length > 0 && (
              <div className="auth-validation-list">
                <div className={`auth-validation-item ${rules.length ? "valid" : ""}`}>
                  <span className="auth-validation-icon">
                    {rules.length ? <FiCheck color="#16A34A" /> : <FiX color="#DC2626" />}
                  </span>
                  <span>Minimum 8 characters</span>
                </div>
                <div className={`auth-validation-item ${rules.uppercase ? "valid" : ""}`}>
                  <span className="auth-validation-icon">
                    {rules.uppercase ? <FiCheck color="#16A34A" /> : <FiX color="#DC2626" />}
                  </span>
                  <span>At least 1 uppercase letter (A-Z)</span>
                </div>
                <div className={`auth-validation-item ${rules.lowercase ? "valid" : ""}`}>
                  <span className="auth-validation-icon">
                    {rules.lowercase ? <FiCheck color="#16A34A" /> : <FiX color="#DC2626" />}
                  </span>
                  <span>At least 1 lowercase letter (a-z)</span>
                </div>
                <div className={`auth-validation-item ${rules.number ? "valid" : ""}`}>
                  <span className="auth-validation-icon">
                    {rules.number ? <FiCheck color="#16A34A" /> : <FiX color="#DC2626" />}
                  </span>
                  <span>At least 1 number (0-9)</span>
                </div>
                <div className={`auth-validation-item ${rules.special ? "valid" : ""}`}>
                  <span className="auth-validation-icon">
                    {rules.special ? <FiCheck color="#16A34A" /> : <FiX color="#DC2626" />}
                  </span>
                  <span>At least 1 special character (@, $, !, etc.)</span>
                </div>
                <div className={`auth-validation-item ${rules.match ? "valid" : ""}`}>
                  <span className="auth-validation-icon">
                    {rules.match ? <FiCheck color="#16A34A" /> : <FiX color="#DC2626" />}
                  </span>
                  <span>Passwords match</span>
                </div>
              </div>
            )}

            {/* TERMS & PRIVACY */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "26px" }}>
              <label className="auth-checkbox-label" style={{ fontSize: "13px" }}>
                <input
                  type="checkbox"
                  className="auth-checkbox"
                  checked={termsAccepted}
                  onChange={(e) => setTermsAccepted(e.target.checked)}
                />
                I agree to the <Link to="/terms" target="_blank" className="auth-link">Terms & Conditions</Link>
              </label>
              <label className="auth-checkbox-label" style={{ fontSize: "13px" }}>
                <input
                  type="checkbox"
                  className="auth-checkbox"
                  checked={privacyAccepted}
                  onChange={(e) => setPrivacyAccepted(e.target.checked)}
                />
                I agree to the <Link to="/privacy-policy" target="_blank" className="auth-link">Privacy Policy</Link>
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