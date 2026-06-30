import { Link } from "react-router-dom";

const ReturnSuccess = () => {
  return (
    <div className="success-page">
      <div className="success-card">
        <div className="success-icon">✓</div>

        <h1>Return Request Submitted</h1>

        <p>Your request has been sent to our team.</p>

        <p>We will review it within 24-48 hours.</p>

        {/* <Link
          to="/profile"
          className="btn"
        >
          View My Orders
        </Link> */}
        <Link to="/my-returns" className="btn">
          Track Return Request
        </Link>
      </div>
    </div>
  );
};

export default ReturnSuccess;
