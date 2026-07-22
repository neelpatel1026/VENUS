import React, { useState } from "react";
import { FiEye, FiEyeOff } from "react-icons/fi";

const Input = ({
  icon: Icon,
  error,
  isValid,
  type = "text",
  placeholder,
  value,
  onChange,
  required = false,
  autoComplete,
  ...props
}) => {
  const [showPassword, setShowPassword] = useState(false);
  const isPassword = type === "password";
  const finalType = isPassword ? (showPassword ? "text" : "password") : type;

  return (
    <div className={`premium-input-wrapper ${error ? "error" : isValid ? "success" : ""}`}>
      {Icon && (
        <span className="premium-input-icon">
          <Icon />
        </span>
      )}
      <input
        type={finalType}
        placeholder={placeholder}
        className={`premium-input ${Icon ? "has-icon" : ""} ${isPassword ? "has-action" : ""}`}
        value={value}
        onChange={onChange}
        autoComplete={autoComplete}
        required={required}
        {...props}
      />
      {isPassword && (
        <button
          type="button"
          className="premium-input-action"
          onClick={() => setShowPassword(!showPassword)}
          tabIndex="-1"
          aria-label={showPassword ? "Hide password" : "Show password"}
        >
          {showPassword ? <FiEyeOff size={18} /> : <FiEye size={18} />}
        </button>
      )}
      {error && <p className="premium-error-text">{error}</p>}
    </div>
  );
};

export default Input;
