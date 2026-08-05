import React from "react";
import { 
  FaHome, 
  FaBriefcase, 
  FaBuilding, 
  FaHotel, 
  FaMapMarkerAlt, 
  FaTrash, 
  FaEdit, 
  FaCopy 
} from "react-icons/fa";
import toast from "react-hot-toast";

const AddressCard = ({ 
  address, 
  onEdit, 
  onDelete, 
  onSelect, 
  isSelected, 
  onSetDefault 
}) => {
  const getIcon = () => {
    switch (address.label) {
      case "Home":
        return <FaHome />;
      case "Work":
        return <FaBriefcase />;
      case "Office":
        return <FaBuilding />;
      case "Hotel":
        return <FaHotel />;
      default:
        return <FaMapMarkerAlt />;
    }
  };

  const copyToClipboard = () => {
    const text = `${address.fullName}, ${address.phone}, ${address.addressLine1}${address.addressLine2 ? ', ' + address.addressLine2 : ''}, ${address.city}, ${address.state} - ${address.pincode}, ${address.country}`;
    navigator.clipboard.writeText(text);
    toast.success("Address copied to clipboard! 📋");
  };

  return (
    <div className={`address-card-luxury ${address.isDefault ? "default-address" : ""} ${isSelected ? "selected-address" : ""}`} style={isSelected ? { borderColor: "#C8A165", background: "#FDFBF8", boxShadow: "0 10px 25px rgba(200, 161, 101, 0.05)" } : {}}>
      
      {/* Badge indicators */}
      <div className="address-badge-row">
        <span className="address-type-badge font-outfit">
          {getIcon()} {address.label}
        </span>
        <div className="flex-badges-right">
          {isSelected && (
            <span className="default-badge-tag font-outfit" style={{ background: "#16A34A", color: "#FFFFFF", borderRadius: "20px", display: "inline-flex", alignItems: "center", gap: "3px", padding: "4px 10px", fontSize: "10px", fontWeight: "700" }}>
              ✓ Delivering Here
            </span>
          )}
          {address.isDefault && (
            <span className="default-badge-tag font-outfit" style={{ borderRadius: "20px", padding: "4px 10px", fontSize: "10px" }}>Default</span>
          )}
        </div>
      </div>

      {/* Receiver info */}
      <h4 className="buyer-name">{address.fullName}</h4>
      <p className="buyer-phone">📞 {address.phone}</p>
      
      {/* Location specifics */}
      <p className="buyer-address-text font-outfit">
        {address.addressLine1}
        {address.addressLine2 && `, ${address.addressLine2}`}
        <br />
        {address.city}, {address.state} - <strong>{address.pincode}</strong>
        <br />
        <span className="country-label">{address.country}</span>
      </p>

      {/* Delivery availability checks */}
      <div className="address-delivery-check-block font-outfit" style={{ border: "1px solid #E6F4EA", background: "#F9FDF9", borderRadius: "10px", padding: "12px 14px", marginBottom: "16px" }}>
        <span className="check-title" style={{ fontSize: "12px", color: "#16A34A", fontWeight: "600", display: "block" }}>✓ Delivery Available</span>
        <span className="check-sub" style={{ fontSize: "11px", color: "#4B5563" }}>Estimated Delivery: 2-3 Business Days • Free Shipping</span>
      </div>

      {/* Actions toolbar */}
      <div className="address-actions-grid font-outfit" style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "8px", borderTop: "1px solid #F6F4F0", paddingTop: "14px" }}>
        {!isSelected && onSelect ? (
          <button 
            type="button" 
            className="btn-card-action select-btn"
            onClick={() => onSelect(address)}
            style={{ gridColumn: "span 3", height: "38px", borderRadius: "8px", background: "#C8A165", color: "#FFFFFF", border: "none", fontWeight: "600", fontSize: "12px", cursor: "pointer", transition: "all 0.2s" }}
          >
            Deliver Here
          </button>
        ) : null}
        
        <button 
          type="button" 
          className="btn-card-action edit-btn"
          onClick={() => onEdit(address)}
          style={{ height: "36px", borderRadius: "8px", border: "1px solid #ECE7DF", background: "#FFFFFF", fontSize: "11.5px", fontWeight: "600", color: "#4B5563", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
        >
          <FaEdit size={12} /> Edit
        </button>

        <button 
          type="button" 
          className="btn-card-action delete-btn"
          onClick={() => onDelete(address._id)}
          style={{ height: "36px", borderRadius: "8px", border: "1px solid rgba(239, 68, 68, 0.15)", background: "rgba(239, 68, 68, 0.02)", fontSize: "11.5px", fontWeight: "600", color: "#EF4444", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
        >
          <FaTrash size={12} /> Delete
        </button>

        <button 
          type="button" 
          className="btn-card-action copy-btn"
          onClick={copyToClipboard}
          title="Copy Address Text"
          style={{ height: "36px", borderRadius: "8px", border: "1px solid #ECE7DF", background: "#FFFFFF", fontSize: "11.5px", fontWeight: "600", color: "#4B5563", cursor: "pointer", display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "6px" }}
        >
          <FaCopy size={12} /> Copy
        </button>
      </div>
    </div>
  );
};

export default AddressCard;