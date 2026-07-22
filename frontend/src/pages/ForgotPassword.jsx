import { useState, useEffect, useRef } from "react";
import { useNavigate, Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { FiMail, FiLock, FiCheck, FiX, FiArrowLeft, FiClock, FiCheckCircle } from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";
import Input from "../components/Input";
import "../styles/auth.css";

const STEPS = {
  EMAIL: "email",
  OTP: "otp",
  RESET: "reset",
  SUCCESS: "success",
};

const ForgotPassword = () => {
  const [step, setStep] = useState(STEPS.EMAIL);
  const [email, setEmail] = useState("");
  
  // OTP States
  const [otpArray, setOtpArray] = useState(["", "", "", "", "", ""]);
  const [timer, setTimer] = useState(60);
  const [resendDisabled, setResendDisabled] = useState(true);
  const otpRefs = useRef([]);

  // Reset Password States
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [confirmPasswordError, setConfirmPasswordError] = useState("");

  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);
  const [isConfirmPasswordValid, setIsConfirmPasswordValid] = useState(false);

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

  const handlePasswordChange = (val) => {
    setNewPassword(val);
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
    if (val !== newPassword) {
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

  // Handle countdown timer for OTP Resend
  useEffect(() => {
    let interval = null;
    if (step === STEPS.OTP && timer > 0) {
      interval = setInterval(() => {
        setTimer((prev) => prev - 1);
      }, 1000);
    } else if (timer === 0) {
      setResendDisabled(false);
    }
    return () => clearInterval(interval);
  }, [step, timer]);

  // PASSWORD VALIDATION RULES
  const passwordRules = {
    length: newPassword.length >= 8,
    uppercase: /[A-Z]/.test(newPassword),
    lowercase: /[a-z]/.test(newPassword),
    number: /[0-9]/.test(newPassword),
    special: /[^A-Za-z0-9]/.test(newPassword),
    match: newPassword === confirmPassword && confirmPassword !== "",
  };

  const isPasswordStrong = Object.values(passwordRules).every(Boolean);

  // 1. SEND OTP REQUEST
  const handleSendOtp = async (e) => {
    if (e) e.preventDefault();
    const trimmedEmail = email.trim().toLowerCase();
    
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!trimmedEmail) {
      setEmailError("Email address is required");
      setIsEmailValid(false);
      return;
    } else if (!emailRegex.test(trimmedEmail)) {
      setEmailError("Invalid email format");
      setIsEmailValid(false);
      return;
    } else {
      setEmailError("");
      setIsEmailValid(true);
    }

    setLoading(true);
    try {
      await axios.post("/api/auth/forgot-password", { email: trimmedEmail });
      toast.success("Verification code dispatched successfully!");
      setStep(STEPS.OTP);
      setTimer(60);
      setResendDisabled(true);
      setOtpArray(["", "", "", "", "", ""]);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to send OTP. Check email identity.");
    } finally {
      setLoading(false);
    }
  };

  // 2. OTP INPUT UTILITIES
  const handleOtpChange = (val, idx) => {
    if (isNaN(val)) return;
    const newOtp = [...otpArray];
    newOtp[idx] = val.slice(-1); // Take only the last entered char
    setOtpArray(newOtp);

    // Auto-advance focus to next block
    if (val !== "" && idx < 5) {
      otpRefs.current[idx + 1].focus();
    }

    // Auto verify if all fields are filled
    const fullOtp = newOtp.join("");
    if (fullOtp.length === 6) {
      handleVerifyOtp(fullOtp);
    }
  };

  const handleOtpKeyDown = (e, idx) => {
    if (e.key === "Backspace") {
      if (otpArray[idx] === "" && idx > 0) {
        otpRefs.current[idx - 1].focus();
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pasteData = e.clipboardData.getData("text").trim();
    if (pasteData.length === 6 && /^\d+$/.test(pasteData)) {
      const arr = pasteData.split("");
      setOtpArray(arr);
      otpRefs.current[5].focus();
      handleVerifyOtp(pasteData);
    }
  };

  // 3. VERIFY OTP SUBMISSION
  const handleVerifyOtp = async (codeToVerify) => {
    const finalCode = codeToVerify || otpArray.join("");
    if (finalCode.length !== 6) {
      toast.error("Please enter complete 6-digit verification code");
      return;
    }

    // Since we verify immediately on 6th digit, prevent double execution
    if (loading) return;

    setLoading(true);
    try {
      setStep(STEPS.RESET);
      toast.success("OTP Verified successfully!");
    } catch (err) {
      toast.error("Invalid OTP code entered");
    } finally {
      setLoading(false);
    }
  };

  // 4. RESET PASSWORD SUBMISSION
  const handleResetPassword = async (e) => {
    e.preventDefault();
    if (loading) return;

    let hasErrors = false;
    if (!isPasswordStrong) {
      setPasswordError("Password does not meet premium strength rules");
      setIsPasswordValid(false);
      hasErrors = true;
    } else {
      setPasswordError("");
      setIsPasswordValid(true);
    }

    if (newPassword !== confirmPassword) {
      setConfirmPasswordError("Passwords do not match");
      setIsConfirmPasswordValid(false);
      hasErrors = true;
    } else {
      setConfirmPasswordError("");
      setIsConfirmPasswordValid(true);
    }

    if (hasErrors) return;

    setLoading(true);
    try {
      await axios.post("/api/auth/reset-password", {
        email: email.trim().toLowerCase(),
        otp: otpArray.join(""),
        newPassword,
      });

      setStep(STEPS.SUCCESS);
      toast.success("Password reset completed successfully!");
      
      // Auto-redirect to Login page after 3.5 seconds
      setTimeout(() => {
        navigate("/login");
      }, 3500);
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Reset failed. OTP code might have expired.");
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
        >
          <div className="auth-header">
            <h1 className="auth-logo-text">Venus Care</h1>
            <span className="auth-tagline-text">Luxury Skincare</span>
          </div>

          <AnimatePresence mode="wait">
            {/* STEP 1: EMAIL REQUEST */}
            {step === STEPS.EMAIL && (
              <motion.div
                key="email-step"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="auth-title-text" style={{ textAlign: "center" }}>Reset Password</h2>
                <p className="auth-subtitle-text" style={{ textAlign: "center", marginBottom: "30px" }}>
                  Enter your email address to receive an OTP verification code
                </p>

                <form onSubmit={handleSendOtp} style={{ display: "flex", flexDirection: "column" }}>
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
                    style={{ marginBottom: "26px" }}
                  />

                  <button type="submit" className="auth-btn" disabled={loading}>
                    {loading ? (
                      <>
                        <div className="auth-spinner" />
                        <span>Sending OTP...</span>
                      </>
                    ) : (
                      "Send OTP"
                    )}
                  </button>

                  <Link
                    to="/login"
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      gap: "8px",
                      marginTop: "24px",
                      fontSize: "14px",
                      color: "#6B7280",
                      textDecoration: "none",
                    }}
                    className="auth-link"
                  >
                    <FiArrowLeft /> Back to Sign In
                  </Link>
                </form>
              </motion.div>
            )}

            {/* STEP 2: OTP VERIFICATION */}
            {step === STEPS.OTP && (
              <motion.div
                key="otp-step"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="auth-title-text" style={{ textAlign: "center" }}>Verify Email</h2>
                <p className="auth-subtitle-text" style={{ textAlign: "center", marginBottom: "30px" }}>
                  We've sent a 6-digit verification code to <strong>{email}</strong>
                </p>

                <div className="auth-otp-grid" onPaste={handleOtpPaste}>
                  {otpArray.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={(el) => (otpRefs.current[idx] = el)}
                      type="text"
                      className="auth-otp-input"
                      value={digit}
                      onChange={(e) => handleOtpChange(e.target.value, idx)}
                      onKeyDown={(e) => handleOtpKeyDown(e, idx)}
                      maxLength="1"
                      required
                    />
                  ))}
                </div>

                <div className="auth-otp-timer">
                  {timer > 0 ? (
                    <span style={{ display: "inline-flex", alignItems: "center", gap: "6px" }}>
                      <FiClock /> Resend OTP in <strong>{timer}s</strong>
                    </span>
                  ) : (
                    <span>Didn't receive the code?</span>
                  )}
                </div>

                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <button
                    type="button"
                    className="auth-btn"
                    onClick={() => handleVerifyOtp()}
                    disabled={loading || otpArray.join("").length !== 6}
                  >
                    {loading ? (
                      <>
                        <div className="auth-spinner" />
                        <span>Verifying...</span>
                      </>
                    ) : (
                      "Verify & Continue"
                    )}
                  </button>

                  <button
                    type="button"
                    className="auth-btn btn-secondary"
                    style={{ background: "#FFFFFF", color: "#C8A165", border: "1px solid #C8A165" }}
                    onClick={handleSendOtp}
                    disabled={resendDisabled || loading}
                  >
                    Resend Verification Code
                  </button>

                  <button
                    type="button"
                    style={{
                      background: "none",
                      border: "none",
                      color: "#6B7280",
                      cursor: "pointer",
                      fontSize: "13.5px",
                      marginTop: "12px",
                      textAlign: "center",
                    }}
                    onClick={() => setStep(STEPS.EMAIL)}
                  >
                    Change Email Address
                  </button>
                </div>
              </motion.div>
            )}

            {/* STEP 3: RESET PASSWORD */}
            {step === STEPS.RESET && (
              <motion.div
                key="reset-step"
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                transition={{ duration: 0.2 }}
              >
                <h2 className="auth-title-text" style={{ textAlign: "center" }}>New Password</h2>
                <p className="auth-subtitle-text" style={{ textAlign: "center", marginBottom: "30px" }}>
                  Configure your new luxury password credentials below
                </p>

                <form onSubmit={handleResetPassword} style={{ display: "flex", flexDirection: "column" }}>
                  {/* NEW PASSWORD */}
                  <Input
                    type="password"
                    placeholder="New Password"
                    icon={FiLock}
                    value={newPassword}
                    onChange={(e) => handlePasswordChange(e.target.value)}
                    error={passwordError}
                    isValid={isPasswordValid}
                    required
                  />

                  {/* CONFIRM PASSWORD */}
                  <Input
                    type="password"
                    placeholder="Confirm New Password"
                    icon={FiLock}
                    value={confirmPassword}
                    onChange={(e) => handleConfirmPasswordChange(e.target.value)}
                    error={confirmPasswordError}
                    isValid={isConfirmPasswordValid}
                    required
                    style={{ marginBottom: "24px" }}
                  />

                  {/* PASSWORD RULES */}
                  {newPassword.length > 0 && (
                    <div className="auth-validation-list">
                      <div className={`auth-validation-item ${passwordRules.length ? "valid" : ""}`}>
                        <span className="auth-validation-icon">
                          {passwordRules.length ? <FiCheck color="#16A34A" /> : <FiX color="#DC2626" />}
                        </span>
                        <span>Minimum 8 characters</span>
                      </div>
                      <div className={`auth-validation-item ${passwordRules.uppercase ? "valid" : ""}`}>
                        <span className="auth-validation-icon">
                          {passwordRules.uppercase ? <FiCheck color="#16A34A" /> : <FiX color="#DC2626" />}
                        </span>
                        <span>At least 1 uppercase letter (A-Z)</span>
                      </div>
                      <div className={`auth-validation-item ${passwordRules.lowercase ? "valid" : ""}`}>
                        <span className="auth-validation-icon">
                          {passwordRules.lowercase ? <FiCheck color="#16A34A" /> : <FiX color="#DC2626" />}
                        </span>
                        <span>At least 1 lowercase letter (a-z)</span>
                      </div>
                      <div className={`auth-validation-item ${passwordRules.number ? "valid" : ""}`}>
                        <span className="auth-validation-icon">
                          {passwordRules.number ? <FiCheck color="#16A34A" /> : <FiX color="#DC2626" />}
                        </span>
                        <span>At least 1 number (0-9)</span>
                      </div>
                      <div className={`auth-validation-item ${passwordRules.special ? "valid" : ""}`}>
                        <span className="auth-validation-icon">
                          {passwordRules.special ? <FiCheck color="#16A34A" /> : <FiX color="#DC2626" />}
                        </span>
                        <span>At least 1 special character</span>
                      </div>
                      <div className={`auth-validation-item ${passwordRules.match ? "valid" : ""}`}>
                        <span className="auth-validation-icon">
                          {passwordRules.match ? <FiCheck color="#16A34A" /> : <FiX color="#DC2626" />}
                        </span>
                        <span>Passwords match</span>
                      </div>
                    </div>
                  )}

                  <button type="submit" className="auth-btn" disabled={loading || !isPasswordStrong}>
                    {loading ? (
                      <>
                        <div className="auth-spinner" />
                        <span>Resetting Password...</span>
                      </>
                    ) : (
                      "Reset Password"
                    )}
                  </button>
                </form>
              </motion.div>
            )}

            {/* STEP 4: SUCCESS COMPLETED */}
            {step === STEPS.SUCCESS && (
              <motion.div
                key="success-step"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                transition={{ duration: 0.3 }}
                style={{ textAlign: "center", padding: "20px 0" }}
              >
                <div style={{ color: "#16A34A", fontSize: "56px", marginBottom: "16px", display: "flex", justifyContent: "center" }}>
                  <FiCheckCircle />
                </div>
                <h2 className="auth-title-text">Password Reset Completed</h2>
                <p className="auth-subtitle-text" style={{ marginBottom: "30px" }}>
                  Your password credentials have been successfully updated.
                </p>
                <p style={{ fontSize: "14px", color: "#6B7280" }}>
                  Redirecting to Sign In portal...
                </p>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </>
  );
};

export default ForgotPassword;