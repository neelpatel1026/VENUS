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
    <div className={`address-card-luxury ${address.isDefault ? "default-address" : ""} ${isSelected ? "selected-address" : ""}`}>
      
      {/* Badge indicators */}
      <div className="address-badge-row">
        <span className="address-type-badge font-outfit">
          {getIcon()} {address.label}
        </span>
        <div className="flex-badges-right">
          {address.isDefault && (
            <span className="default-badge-tag font-outfit">Default</span>
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
      <div className="address-delivery-check-block font-outfit">
        <span className="check-title">✓ Delivery Available</span>
        <span className="check-sub">Estimated Delivery: 2-3 Business Days • Free Shipping</span>
      </div>

      {/* Actions toolbar */}
      <div className="address-actions-grid font-outfit">
        {onSelect && (
          <button 
            type="button" 
            className={`btn-card-action select-btn ${isSelected ? "active" : ""}`}
            onClick={() => onSelect(address)}
          >
            {isSelected ? "Selected Destination" : "Deliver Here"}
          </button>
        )}
        
        <button 
          type="button" 
          className="btn-card-action edit-btn"
          onClick={() => onEdit(address)}
        >
          <FaEdit /> Edit
        </button>

        <button 
          type="button" 
          className="btn-card-action delete-btn"
          onClick={() => onDelete(address._id)}
        >
          <FaTrash /> Delete
        </button>
        
        {!address.isDefault && onSetDefault && (
          <button 
            type="button" 
            className="btn-card-action default-btn"
            onClick={() => onSetDefault(address._id)}
          >
            Set Default
          </button>
        )}

        <button 
          type="button" 
          className="btn-card-action copy-btn"
          onClick={copyToClipboard}
          title="Copy Address Text"
        >
          <FaCopy /> Copy
        </button>
      </div>
    </div>
  );
};

export default AddressCard;