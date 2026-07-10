import { useParams } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";

const AdminUserDetails = () => {
  const { id } = useParams();

  return (
    <div className="admin-layout-wrapper">
      <AdminSidebar />
      <div className="admin-content-console">
        <div className="admin-page-header">
          <h2>User Details Panel</h2>
        </div>
        <div className="admin-form-card">
          <span style={{ fontSize: "0.82rem", fontWeight: "600", color: "var(--admin-text-muted)" }}>
            Selected Account ID
          </span>
          <h3 style={{ fontSize: "1.3rem", fontWeight: "700", marginTop: "6px" }}>{id}</h3>
        </div>
      </div>
    </div>
  );
};

export default AdminUserDetails;