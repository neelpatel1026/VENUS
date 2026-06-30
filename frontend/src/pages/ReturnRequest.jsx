import React, { useState, useContext } from "react";

import "../styles/ReturnRequest.css";

import axios from "axios";

import { useNavigate, useParams } from "react-router-dom";

import { AuthContext } from "../context/AuthContext";

const ReturnRequest = () => {
  const { id } = useParams();

  const navigate = useNavigate();

  const { user } = useContext(AuthContext);

  const [images, setImages] = useState([]);

  const [reason, setReason] = useState("");

  const [loading, setLoading] = useState(false);

  const submitReturn = async () => {
    if (!reason.trim()) {
      alert("Please enter return reason");
      return;
    }

    if (reason.length < 10) {
      alert("Please provide more details");
      return;
    }

    try {
      setLoading(true);

      // await axios.post(
      //   "/api/returns",
      //   {
      //     orderId: id,
      //     reason,
      //   },
      const formData = new FormData();

      formData.append("orderId", id);
      formData.append("reason", reason);

      for (let i = 0; i < images.length; i++) {
        formData.append("images", images[i]);
      }

      await axios.post("/api/returns", formData, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      navigate("/return-success");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="return-page">
      <div className="return-card">
        <h1>Return Request</h1>

        <p className="return-subtitle">
          Tell us why you want to return this product. Our team will review your
          request within 24-48 hours.
        </p>

        <textarea
          placeholder="Example: Product arrived damaged, wrong item received, allergic reaction, etc."
          value={reason}
          maxLength={500}
          onChange={(e) => setReason(e.target.value)}
        />

        <div className="char-count">{reason.length}/500</div>
        <input
          type="file"
          multiple
          accept="image/*"
          onChange={(e) => setImages(Array.from(e.target.files))}
        />

        <button
          className="return-btn"
          onClick={submitReturn}
          disabled={loading}
        >
          {loading ? "Submitting..." : "Submit Return Request"}
        </button>
      </div>
    </div>
  );
};

export default ReturnRequest;
