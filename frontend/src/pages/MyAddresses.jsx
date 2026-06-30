import React, { useEffect, useState } from "react";
import axios from "axios";
import AddressCard from "../components/AddressCard";
import "../styles/myAddresses.css";
import { useContext } from "react";
import { AuthContext } from "../context/AuthContext";

const MyAddresses = () => {
  const [addresses, setAddresses] = useState([]);
  const { user } = useContext(AuthContext);
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
    try {
      //   const res = await axios.get("/api/address");
      const res = await axios.get("/api/address", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      setAddresses(res.data.addresses);
    } catch (error) {
      console.log(error);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, []);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const addAddress = async (e) => {
    e.preventDefault();

    try {
      //   await axios.post("/api/address/add", formData);
      await axios.post("/api/address/add", formData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

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
      console.log(error);
    }
  };

  const deleteAddress = async (id) => {
    try {
      //   await axios.delete(`/api/address/${id}`);
      await axios.delete(`/api/address/${id}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      fetchAddresses();
    } catch (error) {
      console.log(error);
    }
  };

  return (
    <div className="addresses-page">
      <div className="address-form-container">
        <h2>Add New Address</h2>

        <form onSubmit={addAddress} className="address-form">
          <select name="label" value={formData.label} onChange={handleChange}>
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
          />

          <input
            name="phone"
            placeholder="Phone Number"
            value={formData.phone}
            onChange={handleChange}
            required
          />

          <input
            name="addressLine1"
            placeholder="Address Line 1"
            value={formData.addressLine1}
            onChange={handleChange}
            required
          />

          <input
            name="addressLine2"
            placeholder="Address Line 2"
            value={formData.addressLine2}
            onChange={handleChange}
          />

          <input
            name="city"
            placeholder="City"
            value={formData.city}
            onChange={handleChange}
            required
          />

          <input
            name="state"
            placeholder="State"
            value={formData.state}
            onChange={handleChange}
            required
          />

          <input
            name="pincode"
            placeholder="Pincode"
            value={formData.pincode}
            onChange={handleChange}
            required
          />

          <button type="submit">Save Address</button>
        </form>
      </div>

      <div className="saved-addresses">
        <h2>Saved Addresses</h2>

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
      </div>
    </div>
  );
};

export default MyAddresses;
