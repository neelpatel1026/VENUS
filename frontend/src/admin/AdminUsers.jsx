import { useEffect, useState, useContext, useMemo } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";
import AdminSidebar from "./AdminSidebar";

const AdminUsers = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    if (!user || user.role !== "admin") {
      navigate("/");
      return;
    }

    const fetchUsers = async () => {
      try {
        const res = await fetch("/api/auth/users", {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });
        const data = await res.json();
        setUsers(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error(error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
  }, [user, navigate]);

  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

  if (!user || user.role !== "admin") return null;

  return (
    <div className="admin-layout-wrapper">
      {/* LEFT COLUMN: SIDEBAR */}
      <AdminSidebar />

      {/* RIGHT COLUMN: MAIN CONTENT */}
      <div className="admin-content-console">
        <div className="admin-page-header">
          <div>
            <h2>User Directory</h2>
            <p>View and manage all registered platform customers and administrators.</p>
          </div>
        </div>

        {/* USERS TABLE */}
        <div className="admin-table-container">
          <div className="admin-table-search-bar">
            <input
              type="text"
              placeholder="Search by customer name or email..."
              className="admin-search-input"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--admin-text-muted)" }}>
              Loading user accounts...
            </div>
          ) : filteredUsers.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "var(--admin-text-muted)" }}>
              No registered user records found.
            </div>
          ) : (
            <table className="admin-premium-table">
              <thead>
                <tr>
                  <th>User ID</th>
                  <th>Customer Details</th>
                  <th>Role Badge</th>
                  <th>Account Status</th>
                  <th>Join Date</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((u) => {
                  const joinDate = new Date(u.createdAt).toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                    year: "numeric",
                  });
                  return (
                    <tr key={u._id}>
                      <td>
                        <strong style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>
                          #{u._id.slice(-8).toUpperCase()}
                        </strong>
                      </td>
                      <td>
                        <div>
                          <strong style={{ fontWeight: "600" }}>{u.name}</strong>
                          <div style={{ fontSize: "0.75rem", color: "var(--admin-text-muted)" }}>
                            {u.email}
                          </div>
                        </div>
                      </td>
                      <td>
                        <span className={`status-pill ${u.role === "admin" ? "pill-approved" : "pill-active"}`}>
                          {u.role}
                        </span>
                      </td>
                      <td>
                        <span className="status-pill pill-active">Active</span>
                      </td>
                      <td>{joinDate}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>

      </div>
    </div>
  );
};

export default AdminUsers;
