import React from "react";
import { FaHome, FaBuilding, FaMapMarkerAlt, FaEdit, FaTrash } from "react-icons/fa";

const AddressCard = ({ address, onEdit, onDelete }) => {
  const getIcon = () => {
    switch (address.label) {
      case "Home":
        return <FaHome />;
      case "Office":
        return <FaBuilding />;
      default:
        return <FaMapMarkerAlt />;
    }
  };

  return (
    <div className="address-card">
      <div className="address-header">
        <span className="address-label">
          {getIcon()} {address.label}
        </span>
      </div>

      <h4>{address.fullName}</h4>

      <p>{address.phone}</p>

      <p>
        {address.addressLine1}
        {address.addressLine2 && `, ${address.addressLine2}`}
      </p>

      <p>
        {address.city}, {address.state}
      </p>

      <p>
        {address.pincode}, {address.country}
      </p>

      <div className="address-actions">
        <button
          className="edit-btn"
          onClick={() => onEdit(address)}
        >
          <FaEdit /> Edit
        </button>

        <button
          className="delete-btn"
          onClick={() => onDelete(address._id)}
        >
          <FaTrash /> Delete
        </button>
      </div>
    </div>
  );
};

export default AddressCard;