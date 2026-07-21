import { useState, useContext } from "react";
import "../styles/ReturnRequest.css";
import toast from "react-hot-toast";
import axios from "axios";
import { useNavigate, useParams } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";

const ReturnRequest = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { user } = useContext(AuthContext);

  const [images, setImages] = useState([]);
  const [previews, setPreviews] = useState([]);
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);

  const handleImageChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    
    // Generate object URLs for immediate preview rendering
    const objectUrls = files.map((file) => URL.createObjectURL(file));
    setPreviews(objectUrls);
  };

  const submitReturn = async () => {
    if (!reason.trim()) {
      toast.error("Please enter return reason");
      return;
    }

    if (reason.length < 10) {
      toast.error("Please provide more details (minimum 10 characters)");
      return;
    }

    try {
      setLoading(true);
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
      toast.error(error.response?.data?.message || "Failed to submit request");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="return-page route-fade-in">
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

        <div className="image-upload">
          <label style={{ fontSize: "0.85rem", fontWeight: "600", color: "#4B5563", display: "block", marginBottom: "8px" }}>
            Upload Proof Images
          </label>
          <input
            type="file"
            multiple
            accept="image/*"
            onChange={handleImageChange}
          />
        </div>

        {previews.length > 0 && (
          <div className="image-preview">
            {previews.map((src, index) => (
              <img key={index} src={src} alt={`Selected Proof ${index + 1}`} />
            ))}
          </div>
        )}

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
