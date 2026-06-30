const OrderStatusBadge = ({ status }) => {
  const styles = {
    Pending: {
      background: "#FFF4E5",
      color: "#D97706",
    },
    Confirmed: {
      background: "#E0F2FE",
      color: "#0369A1",
    },
    Packed: {
      background: "#EDE9FE",
      color: "#6D28D9",
    },
    Shipped: {
      background: "#DBEAFE",
      color: "#2563EB",
    },
    "Out For Delivery": {
      background: "#FCE7F3",
      color: "#BE185D",
    },
    Delivered: {
      background: "#E7F8EE",
      color: "#16A34A",
    },
    Returned: {
      background: "#FFF7ED",
      color: "#EA580C",
    },
    Cancelled: {
      background: "#FEE2E2",
      color: "#DC2626",
    },
  };

  return (
    <span
      style={{
        padding: "8px 14px",
        borderRadius: "30px",
        fontWeight: "600",
        fontSize: "13px",
        ...styles[status],
      }}
    >
      {status}
    </span>
  );
};

export default OrderStatusBadge;