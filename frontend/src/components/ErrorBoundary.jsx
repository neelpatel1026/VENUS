import React from "react";

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("❌ [React Error Boundary caught an exception]:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{ minHeight: "80vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "40px 20px", background: "#FFFFFF", fontFamily: "'Inter', sans-serif" }}>
          <div style={{ maxWidth: "520px", width: "100%", background: "#FAFAFA", padding: "40px 30px", borderRadius: "24px", border: "1px solid #ECE7DF", textAlign: "center", boxShadow: "0 10px 30px rgba(0,0,0,0.03)" }}>
            <div style={{ color: "#C8A165", fontWeight: "700", letterSpacing: "2px", fontSize: "12px", textTransform: "uppercase", marginBottom: "12px" }}>
              VENUS CARE
            </div>
            
            <h2 style={{ fontSize: "1.8rem", color: "#1A1A1A", fontFamily: "'Cinzel', serif", marginBottom: "16px" }}>
              Something Went Wrong
            </h2>

            <p style={{ fontSize: "0.95rem", color: "#6B7280", lineHeight: "1.6", marginBottom: "28px" }}>
              An unexpected error occurred while rendering this component. Don't worry, your cart and session data remain safe.
            </p>

            <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "12px" }}>
              <button
                onClick={() => (window.location.href = "/")}
                style={{
                  padding: "12px 28px",
                  background: "#C8A165",
                  color: "#FFFFFF",
                  border: "none",
                  borderRadius: "25px",
                  fontWeight: "700",
                  fontSize: "13px",
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(200, 161, 101, 0.25)",
                }}
              >
                Back To Home
              </button>

              <button
                onClick={() => window.location.reload()}
                style={{
                  padding: "12px 24px",
                  background: "#FFFFFF",
                  color: "#1A1A1A",
                  border: "1px solid #ECE7DF",
                  borderRadius: "25px",
                  fontWeight: "600",
                  fontSize: "13px",
                  cursor: "pointer",
                }}
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;
