import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import AddressCard from "../components/AddressCard";
import "../styles/myAddresses.css";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";

const MyAddresses = () => {
  const { user } = useContext(AuthContext);
  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [formData, setFormData] = useState({
    label: "Home",
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
  });

  const fetchAddresses = async () => {
    if (!user?.token) return;
    try {
      setLoading(true);
      const res = await axios.get("/api/address", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      setAddresses(res.data.addresses || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load saved addresses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const addAddress = async (e) => {
    e.preventDefault();
    if (submitting) return;

    try {
      setSubmitting(true);
      const loadingToast = toast.loading("Saving new address...");
      await axios.post("/api/address/add", formData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      toast.dismiss(loadingToast);
      toast.success("Address saved successfully! 🏠");
      
      setFormData({
        label: "Home",
        fullName: "",
        phone: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
      });

      fetchAddresses();
    } catch (error) {
      console.error(error);
      toast.error("Failed to save address. Please verify your fields.");
    } finally {
      setSubmitting(false);
    }
  };

  const deleteAddress = async (id) => {
    try {
      const loadingToast = toast.loading("Deleting address...");
      await axios.delete(`/api/address/${id}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      toast.dismiss(loadingToast);
      toast.success("Address removed successfully");
      fetchAddresses();
    } catch (error) {
      console.error(error);
      toast.error("Failed to remove address");
    }
  };

  return (
    <div className="addresses-page route-fade-in">
      <div className="address-form-container">
        <h2>Add New Address</h2>

        <form onSubmit={addAddress} className="address-form">
          <select name="label" value={formData.label} onChange={handleChange} disabled={submitting}>
            <option>Home</option>
            <option>Office</option>
            <option>Other</option>
          </select>

          <input
            name="fullName"
            placeholder="Full Name"
            value={formData.fullName}
            onChange={handleChange}
            required
            disabled={submitting}
          />

          <input
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            required
            disabled={submitting}
          />

          <input
            name="addressLine1"
            placeholder="Address Line 1"
            value={formData.addressLine1}
            onChange={handleChange}
            required
            disabled={submitting}
          />

          <input
            name="addressLine2"
            placeholder="Address Line 2"
            value={formData.addressLine2}
            onChange={handleChange}
            disabled={submitting}
          />

          <input
            name="city"
            placeholder="City"
            value={formData.city}
            onChange={handleChange}
            required
            disabled={submitting}
          />

          <input
            name="state"
            placeholder="State"
            value={formData.state}
            onChange={handleChange}
            required
            disabled={submitting}
          />

          <input
            name="pincode"
            placeholder="Pincode"
            value={formData.pincode}
            onChange={handleChange}
            required
            disabled={submitting}
          />

          <button type="submit" disabled={submitting}>
            {submitting ? "Saving Address..." : "Save Address"}
          </button>
        </form>
      </div>

      <div className="saved-addresses">
        <h2>Saved Addresses</h2>

        {loading ? (
          <div className="address-grid">
            {[1, 2].map((i) => (
              <div key={i} style={{ border: "1px solid #ECE7DF", background: "#FFFFFF", padding: "24px", borderRadius: "16px", height: "200px", display: "flex", flexDirection: "column", gap: "14px" }}>
                <div className="shimmer-bg" style={{ height: "24px", width: "80px", borderRadius: "20px" }} />
                <div className="shimmer-bg" style={{ height: "18px", width: "160px", borderRadius: "4px" }} />
                <div className="shimmer-bg skeleton-text-line" />
                <div className="shimmer-bg skeleton-text-line short" />
              </div>
            ))}
          </div>
        ) : addresses.length === 0 ? (
          <div 
            style={{ 
              textAlign: "center", 
              padding: "40px 20px", 
              background: "#FFFFFF", 
              border: "1px dashed #ECE7DF", 
              borderRadius: "16px",
              color: "#6B7280"
            }}
          >
            No addresses configured yet.
          </div>
        ) : (
          <div className="address-grid">
            {addresses.map((address) => (
              <AddressCard
                key={address._id}
                address={address}
                onDelete={deleteAddress}
                onEdit={() => {}}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default MyAddresses;
