import React, { useState, useContext, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { FiUser, FiMail, FiPhone, FiLock, FiCamera, FiArrowLeft } from "react-icons/fi";
import toast from "react-hot-toast";
import axios from "axios";

export default function EditProfile() {
  const { user, login } = useContext(AuthContext);
  const navigate = useNavigate();

  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [avatarFile, setAvatarFile] = useState(null);
  const [avatarPreview, setAvatarPreview] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingData, setLoadingData] = useState(true);

  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setPhone(user.phone || "");
      setAvatarPreview(user.avatarUrl || "");
      setLoadingData(false);
    }
  }, [user]);

  const handleAvatarChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setAvatarFile(file);
      setAvatarPreview(URL.createObjectURL(file));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (saving) return;

    if (name.trim().length < 3) {
      toast.error("Name must be at least 3 characters");
      return;
    }

    const phoneRegex = /^[0-9]{10}$/;
    if (!phoneRegex.test(phone)) {
      toast.error("Phone number must be exactly 10 digits");
      return;
    }

    if (password && password.length < 6) {
      toast.error("Password must be at least 6 characters");
      return;
    }

    setSaving(true);
    const formData = new FormData();
    formData.append("name", name.trim());
    formData.append("phone", phone);
    if (password) {
      formData.append("password", password);
    }
    if (avatarFile) {
      formData.append("avatar", avatarFile);
    }

    try {
      const res = await axios.put("/api/auth/profile", formData, {
        headers: {
          "Content-Type": "multipart/form-data",
          Authorization: `Bearer ${user.token}`,
        },
      });

      toast.success("Profile updated successfully! ✨");
      
      // Update User Auth Context state
      login(res.data);
      
      navigate("/profile");
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update profile");
    } finally {
      setSaving(false);
    }
  };

  if (loadingData) {
    return (
      <div style={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "60vh" }}>
        <div style={{ width: "40px", height: "40px", borderRadius: "50%", border: "3px solid #E8DFD2", borderTopColor: "#C8A96B", animation: "spin 1s linear infinite" }}></div>
      </div>
    );
  }

  return (
    <div style={{ maxWidth: "600px", margin: "40px auto", padding: "0 20px", fontFamily: "Outfit, sans-serif" }}>
      
      {/* Back to Profile */}
      <button 
        onClick={() => navigate("/profile")}
        style={{
          display: "flex",
          alignItems: "center",
          gap: "8px",
          background: "none",
          border: "none",
          color: "#C8A165",
          fontSize: "14px",
          fontWeight: "600",
          cursor: "pointer",
          marginBottom: "24px",
          padding: 0
        }}
      >
        <FiArrowLeft /> Back to Profile
      </button>

      {/* Main Card */}
      <div 
        style={{
          background: "#FFFFFF",
          border: "1px solid #ECE7DF",
          borderRadius: "24px",
          padding: "40px 30px",
          boxShadow: "0 10px 30px rgba(200, 161, 101, 0.05)"
        }}
      >
        <h2 style={{ fontFamily: "Cinzel, serif", fontSize: "24px", color: "#1A1A1A", margin: "0 0 8px 0", textAlign: "center" }}>
          Edit Profile
        </h2>
        <p style={{ fontSize: "14px", color: "#6B7280", margin: "0 0 32px 0", textAlign: "center" }}>
          Keep your luxury skincare account credentials up to date
        </p>

        <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Avatar upload sector */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "12px", marginBottom: "8px" }}>
            <div style={{ position: "relative", width: "100px", height: "100px" }}>
              {avatarPreview ? (
                <img 
                  src={avatarPreview} 
                  alt="Avatar Preview" 
                  style={{ width: "100%", height: "100%", borderRadius: "50%", objectFit: "cover", border: "2px solid #C8A165" }} 
                />
              ) : (
                <div 
                  style={{ 
                    width: "100%", 
                    height: "100%", 
                    borderRadius: "50%", 
                    background: "#FAF7F2", 
                    border: "2px dashed #C8A165", 
                    display: "flex", 
                    alignItems: "center", 
                    justifyContent: "center", 
                    fontSize: "28px", 
                    color: "#C8A165",
                    fontWeight: "bold"
                  }}
                >
                  {name ? name.charAt(0).toUpperCase() : "U"}
                </div>
              )}
              
              <label 
                htmlFor="avatar-input" 
                style={{
                  position: "absolute",
                  bottom: "0",
                  right: "0",
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: "#C8A165",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: "#FFFFFF",
                  cursor: "pointer",
                  boxShadow: "0 4px 10px rgba(200, 161, 101, 0.3)"
                }}
              >
                <FiCamera size={16} />
              </label>
              <input 
                id="avatar-input"
                type="file" 
                accept="image/*"
                onChange={handleAvatarChange}
                style={{ display: "none" }}
              />
            </div>
            <span style={{ fontSize: "12px", color: "#9CA3AF" }}>Upload a profile photo</span>
          </div>

          {/* Full Name */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "13px", fontWeight: "600", color: "#4B5563" }}>Full Name</label>
            <div style={{ position: "relative" }}>
              <FiUser style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
              <input 
                type="text" 
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                placeholder="Your Full Name"
                style={{
                  width: "100%",
                  height: "50px",
                  padding: "0 16px 0 46px",
                  borderRadius: "12px",
                  border: "1px solid #ECE7DF",
                  outline: "none",
                  fontSize: "14.5px",
                  color: "#1A1A1A",
                  boxSizing: "border-box"
                }}
              />
            </div>
          </div>

          {/* Email (Read Only) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "13px", fontWeight: "600", color: "#4B5563" }}>Email Address</label>
            <div style={{ position: "relative" }}>
              <FiMail style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
              <input 
                type="email" 
                value={user.email}
                disabled
                style={{
                  width: "100%",
                  height: "50px",
                  padding: "0 16px 0 46px",
                  borderRadius: "12px",
                  border: "1px solid #ECE7DF",
                  background: "#FAF9F6",
                  color: "#9CA3AF",
                  cursor: "not-allowed",
                  fontSize: "14.5px",
                  boxSizing: "border-box"
                }}
              />
            </div>
            <span style={{ fontSize: "11px", color: "#9CA3AF" }}>Email address cannot be changed for security purposes.</span>
          </div>

          {/* Phone Number */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "13px", fontWeight: "600", color: "#4B5563" }}>Phone Number</label>
            <div style={{ position: "relative" }}>
              <FiPhone style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
              <input 
                type="tel" 
                value={phone}
                onChange={(e) => setPhone(e.target.value.replace(/\D/g, "").slice(0, 10))}
                required
                maxLength="10"
                placeholder="10-digit Phone Number"
                style={{
                  width: "100%",
                  height: "50px",
                  padding: "0 16px 0 46px",
                  borderRadius: "12px",
                  border: "1px solid #ECE7DF",
                  outline: "none",
                  fontSize: "14.5px",
                  color: "#1A1A1A",
                  boxSizing: "border-box"
                }}
              />
            </div>
          </div>

          {/* Change Password (Optional) */}
          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <label style={{ fontSize: "13px", fontWeight: "600", color: "#4B5563" }}>New Password (optional)</label>
            <div style={{ position: "relative" }}>
              <FiLock style={{ position: "absolute", left: "16px", top: "50%", transform: "translateY(-50%)", color: "#9CA3AF" }} />
              <input 
                type="password" 
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Leave blank to keep current password"
                style={{
                  width: "100%",
                  height: "50px",
                  padding: "0 16px 0 46px",
                  borderRadius: "12px",
                  border: "1px solid #ECE7DF",
                  outline: "none",
                  fontSize: "14.5px",
                  color: "#1A1A1A",
                  boxSizing: "border-box"
                }}
              />
            </div>
          </div>

          {/* Submit Action button */}
          <button 
            type="submit" 
            disabled={saving}
            style={{
              width: "100%",
              height: "54px",
              background: "#C8A165",
              color: "#FFFFFF",
              border: "none",
              borderRadius: "12px",
              fontSize: "15px",
              fontWeight: "700",
              textTransform: "uppercase",
              cursor: saving ? "not-allowed" : "pointer",
              transition: "background 0.3s ease",
              marginTop: "12px",
              boxShadow: "0 4px 14px rgba(200, 161, 101, 0.2)"
            }}
          >
            {saving ? "Saving Changes..." : "Save Profile Details"}
          </button>

        </form>
      </div>
    </div>
  );
}
