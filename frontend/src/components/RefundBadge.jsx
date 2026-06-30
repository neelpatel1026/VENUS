const RefundBadge = ({ paymentStatus }) => {
  if (paymentStatus !== "Refunded") return null;

  return (
    <span
      style={{
        background: "#F3E8FF",
        color: "#7E22CE",
        padding: "8px 14px",
        borderRadius: "30px",
        fontWeight: "600",
      }}
    >
      Refunded
    </span>
  );
};

export default RefundBadge;