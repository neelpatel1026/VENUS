import { useState, useContext, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { motion } from "framer-motion";
import { FiMail, FiLock } from "react-icons/fi";
import axios from "axios";
import toast from "react-hot-toast";
import Input from "../components/Input";
import "../styles/auth.css";

const Login = () => {
  const [emailOrPhone, setEmailOrPhone] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);

  const [emailError, setEmailError] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [isEmailValid, setIsEmailValid] = useState(false);
  const [isPasswordValid, setIsPasswordValid] = useState(false);

  const { login } = useContext(AuthContext);
  const navigate = useNavigate();

  // Load saved credentials if "Remember Me" was previously selected
  useEffect(() => {
    const savedEmail = localStorage.getItem("venus_remember_me_email");
    if (savedEmail) {
      setEmailOrPhone(savedEmail);
      setIsEmailValid(true);
      setRememberMe(true);
    }
  }, []);

  const handleEmailChange = (val) => {
    setEmailOrPhone(val);
    if (!val.trim()) {
      setEmailError("Email or phone is required");
      setIsEmailValid(false);
    } else {
      setEmailError("");
      setIsEmailValid(true);
    }
  };

  const handlePasswordChange = (val) => {
    setPassword(val);
    if (!val.trim()) {
      setPasswordError("Password is required");
      setIsPasswordValid(false);
    } else if (val.trim().length < 6) {
      setPasswordError("Password must be at least 6 characters");
      setIsPasswordValid(false);
    } else {
      setPasswordError("");
      setIsPasswordValid(true);
    }
  };

  // NORMAL LOGIN SUBMIT
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (loading) return;

    // Local input trimming
    const trimmedInput = emailOrPhone.trim();
    const trimmedPassword = password.trim();

    let hasErrors = false;
    if (!trimmedInput) {
      setEmailError("Email or phone is required");
      setIsEmailValid(false);
      hasErrors = true;
    }
    if (!trimmedPassword) {
      setPasswordError("Password is required");
      setIsPasswordValid(false);
      hasErrors = true;
    }

    if (hasErrors) return;

    setLoading(true);
    try {
      const res = await axios.post("/api/auth/login", {
        emailOrPhone: trimmedInput,
        password: trimmedPassword,
      });

      const data = res.data;

      // Save "Remember Me" credentials
      if (rememberMe) {
        localStorage.setItem("venus_remember_me_email", trimmedInput);
      } else {
        localStorage.removeItem("venus_remember_me_email");
      }

      login(data);
      toast.success("Welcome back! Login Successful.");
      navigate("/");
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Invalid credentials");
    } finally {
      setLoading(false);
    }
  };

  // GOOGLE LOGIN SUCCESS CALLBACK
  const handleGoogleSuccess = async (credentialResponse) => {
    try {
      setLoading(true);
      const res = await axios.post("/api/auth/google-login", {
        credential: credentialResponse.credential,
      });

      login(res.data);
      toast.success("Google Login Successful! Welcome to VENUS CARE.");
      navigate("/");
    } catch (error) {
      console.error(error);
      toast.error(error?.response?.data?.message || "Google Authentication Failed");
    } finally {
      setLoading(false);
    }
  };

  // GSI SCRIPT INITIALIZATION
  useEffect(() => {
    const loadGsiScript = () => {
      if (document.getElementById("google-gsi-client")) {
        if (window.google) initGoogleGsi();
        return;
      }
      const script = document.createElement("script");
      script.src = "https://accounts.google.com/gsi/client";
      script.id = "google-gsi-client";
      script.async = true;
      script.defer = true;
      script.onload = () => initGoogleGsi();
      document.body.appendChild(script);
    };

    const initGoogleGsi = () => {
      if (window.google) {
        if (!window.googleGsiInitialized) {
          window.google.accounts.id.initialize({
            client_id: import.meta.env.VITE_GOOGLE_CLIENT_ID,
            callback: handleGoogleSuccess,
          });
          window.googleGsiInitialized = true;
        }

        const container = document.getElementById("google-signin-btn-container");
        if (container) {
          window.google.accounts.id.renderButton(container, {
            theme: "outline",
            size: "large",
            width: 380,
          });
        }
      }
    };

    loadGsiScript();
  }, []);

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
            <h2 className="auth-title-text">Welcome Back</h2>
            <p className="auth-subtitle-text">Sign in to your premium account</p>
          </div>

          <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column" }}>
            {/* EMAIL / PHONE INPUT */}
            <Input
              type="text"
              placeholder="Email or Phone Number"
              icon={FiMail}
              value={emailOrPhone}
              onChange={(e) => handleEmailChange(e.target.value)}
              error={emailError}
              isValid={isEmailValid}
              autoComplete="email"
              required
            />

            {/* PASSWORD INPUT */}
            <Input
              type="password"
              placeholder="Password"
              icon={FiLock}
              value={password}
              onChange={(e) => handlePasswordChange(e.target.value)}
              error={passwordError}
              isValid={isPasswordValid}
              autoComplete="current-password"
              required
            />

            {/* REMEMBER ME & FORGOT PASSWORD */}
            <div className="auth-meta-row">
              <label className="auth-checkbox-label">
                <input
                  type="checkbox"
                  className="auth-checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                />
                Remember Me
              </label>
              <Link to="/forgot-password" className="auth-link">
                Forgot Password?
              </Link>
            </div>

            {/* SUBMIT BUTTON */}
            <button
              type="submit"
              className="auth-btn"
              disabled={loading}
              style={{ width: "100%" }}
            >
              {loading ? (
                <>
                  <div className="auth-spinner" />
                  <span>Signing In...</span>
                </>
              ) : (
                "Sign In"
              )}
            </button>

            {/* OR DIVIDER */}
            <div className="auth-divider">OR</div>

            {/* GOOGLE SIGN IN */}
            <div
              style={{
                display: "flex",
                justifyContent: "center",
                marginBottom: "24px",
              }}
            >
              <div id="google-signin-btn-container" style={{ width: "100%" }}></div>
            </div>

            {/* REGISTER ROUTE LINK */}
            <p style={{ margin: 0, textAlign: "center", fontSize: "14px", color: "#6B7280" }}>
              Don't have an account?{" "}
              <Link to="/register" className="auth-link">
                Register Now
              </Link>
            </p>
          </form>
        </motion.div>
      </div>
    </>
  );
};

export default Login;