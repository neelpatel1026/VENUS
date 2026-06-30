// import React, { useEffect, useState, useContext } from 'react';
// import { AuthContext } from '../context/AuthContext';

// const AdminUsers = () => {

//   const { user } = useContext(AuthContext);

//   const [users, setUsers] = useState([]);

//   /* ================= FETCH USERS ================= */

//   useEffect(() => {

//     const fetchUsers = async () => {

//       try {

//         const res = await fetch('/api/auth/users', {

//           headers: {
//             Authorization: `Bearer ${user.token}`
//           }
//         });

//         const data = await res.json();

//         setUsers(Array.isArray(data) ? data : []);

//       } catch (error) {

//         console.error(error);
//       }
//     };

//     fetchUsers();

//   }, [user]);

//   /* ================= ROLE BADGE ================= */

//   const getRoleStyle = (role) => {

//     return {

//       background:
//         role === 'admin'
//           ? 'rgba(249,115,22,0.15)'
//           : 'rgba(16,185,129,0.15)',

//       color:
//         role === 'admin'
//           ? '#f97316'
//           : '#10b981',

//       padding: '6px 12px',

//       borderRadius: '999px',

//       fontSize: '0.8rem',

//       fontWeight: '700',

//       textTransform: 'uppercase',

//       display: 'inline-block'
//     };
//   };

//   /* ================= UI ================= */

//   return (

//     <div style={containerStyle}>

//       {/* HEADER */}

//       <div style={headerStyle}>

//         <h2 style={headingStyle}>
//           User Directory
//         </h2>

//         <p style={subHeadingStyle}>
//           Manage all registered platform users
//         </p>

//       </div>

//       {/* MOBILE VIEW */}

//       <div style={mobileWrapperStyle}>

//         {users.map((u) => (

//           <div
//             key={u._id}
//             style={mobileCardStyle}
//           >

//             <div style={mobileRowStyle}>

//               <span style={labelStyle}>
//                 User ID
//               </span>

//               <span style={valueStyle}>
//                 {u._id.substring(0, 8)}...
//               </span>

//             </div>

//             <div style={mobileRowStyle}>

//               <span style={labelStyle}>
//                 Name
//               </span>

//               <span style={valueStyle}>
//                 {u.name}
//               </span>

//             </div>

//             <div style={mobileRowStyle}>

//               <span style={labelStyle}>
//                 Email
//               </span>

//               <span style={emailStyle}>
//                 {u.email}
//               </span>

//             </div>

//             <div style={mobileRowStyle}>

//               <span style={labelStyle}>
//                 Role
//               </span>

//               <span style={getRoleStyle(u.role)}>
//                 {u.role}
//               </span>

//             </div>

//             <div style={mobileRowStyle}>

//               <span style={labelStyle}>
//                 Joined
//               </span>

//               <span style={valueStyle}>
//                 {new Date(u.createdAt).toLocaleDateString()}
//               </span>

//             </div>

//           </div>
//         ))}

//       </div>

//       {/* DESKTOP TABLE */}

//       <div style={tableWrapperStyle}>

//         <table style={tableStyle}>

//           <thead>

//             <tr style={rowStyle}>

//               <th style={thStyle}>
//                 ID
//               </th>

//               <th style={thStyle}>
//                 NAME
//               </th>

//               <th style={thStyle}>
//                 EMAIL
//               </th>

//               <th style={thStyle}>
//                 ROLE
//               </th>

//               <th style={thStyle}>
//                 JOINED
//               </th>

//             </tr>

//           </thead>

//           <tbody>

//             {users.map((u) => (

//               <tr
//                 key={u._id}
//                 style={rowStyle}
//               >

//                 <td style={tdStyle}>
//                   {u._id.substring(0, 8)}...
//                 </td>

//                 <td style={tdStyle}>
//                   {u.name}
//                 </td>

//                 <td style={emailCellStyle}>
//                   {u.email}
//                 </td>

//                 <td style={tdStyle}>

//                   <span style={getRoleStyle(u.role)}>
//                     {u.role}
//                   </span>

//                 </td>

//                 <td style={tdStyle}>
//                   {new Date(u.createdAt).toLocaleDateString()}
//                 </td>

//               </tr>
//             ))}

//           </tbody>

//         </table>

//       </div>

//     </div>
//   );
// };

// /* ================= STYLES ================= */

// const containerStyle = {
//   background: '#FFFFFF',
//   color: '#1F2937',
//   border: '1px solid #ECE6DC',
//   boxShadow: '0 20px 50px rgba(0,0,0,.06)',
//   maxWidth: '1200px',
//   margin: '40px auto',
//   padding: '30px',
//   borderRadius: '18px',
// };

// const headerStyle = {
//   marginBottom: '30px'
// };

// const headingStyle = {
//   color: '#C8A96B',

//   marginBottom: '10px'
// };

// const subHeadingStyle = {
//   color: '#6B7280'
// };

// /* ================= TABLE ================= */

// const tableWrapperStyle = {
//   overflowX: 'auto'
// };

// const tableStyle = {
//   width: '100%',

//   borderCollapse: 'collapse',

//   minWidth: '750px'
// };

// const rowStyle = {
//   borderBottom: '1px solid rgba(255,255,255,0.08)'
// };

// const thStyle = {
//   padding: '18px 15px',

//   textAlign: 'left',

//   color: '#8B7355',

//   fontSize: '0.9rem',

//   fontWeight: '600'
// };

// const tdStyle = {
//   padding: '18px 15px',
//   color: '#1F2937'
// };

// const emailCellStyle = {
//   ...tdStyle,

//   color: '#4B5563'
// };

// /* ================= MOBILE ================= */

// const mobileWrapperStyle = {
//   display: 'none',

//   flexDirection: 'column',

//   gap: '18px',

//   marginBottom: '20px'
// };

// const mobileCardStyle = {
//   background: '#09090b',

//   // border: '1px solid rgba(255,255,255,0.05)',
//   borderBottom: '1px solid #ECE6DC',
//   borderRadius: '16px',
//   padding: '20px'
// };

// const mobileRowStyle = {
//   display: 'flex',

//   justifyContent: 'space-between',

//   alignItems: 'center',

//   gap: '15px',

//   marginBottom: '14px',

//   flexWrap: 'wrap'
// };

// const labelStyle = {
//   color: '#a1a1aa',

//   fontSize: '14px'
// };

// const valueStyle = {
//   color: '#fff',

//   fontWeight: '500'
// };

// const emailStyle = {
//   color: '#d4d4d8',

//   wordBreak: 'break-word'
// };

// export default AdminUsers;



import React, { useEffect, useState, useContext, useMemo } from "react";
import { AuthContext } from "../context/AuthContext";
import { useNavigate } from "react-router-dom";

const AdminUsers = () => {
  const { user } = useContext(AuthContext);
  const navigate = useNavigate();

  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
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

    if (user) {
      fetchUsers();
    }
  }, [user]);

  const filteredUsers = useMemo(() => {
    return users.filter(
      (u) =>
        u.name?.toLowerCase().includes(search.toLowerCase()) ||
        u.email?.toLowerCase().includes(search.toLowerCase())
    );
  }, [users, search]);

  const getRoleStyle = (role) => ({
    background:
      role === "admin"
        ? "rgba(249,115,22,0.15)"
        : "rgba(16,185,129,0.15)",

    color: role === "admin" ? "#f97316" : "#10b981",

    padding: "6px 12px",

    borderRadius: "999px",

    fontSize: "0.8rem",

    fontWeight: "700",

    textTransform: "uppercase",

    display: "inline-block",
  });

  return (
    <div style={containerStyle}>
      {/* Header */}

      <div style={headerStyle}>
        <h2 style={headingStyle}>User Directory</h2>

        <p style={subHeadingStyle}>
          Manage all registered platform users
        </p>
      </div>

      {/* Statistics */}

      <div style={statsGridStyle}>
        <div style={statCardStyle}>
          <h4>Total Users</h4>
          <h2>{users.length}</h2>
        </div>

        <div style={statCardStyle}>
          <h4>Admins</h4>
          <h2>
            {users.filter((u) => u.role === "admin").length}
          </h2>
        </div>

        <div style={statCardStyle}>
          <h4>Customers</h4>
          <h2>
            {users.filter((u) => u.role !== "admin").length}
          </h2>
        </div>
      </div>

      {/* Search */}

      <div style={{ marginBottom: "25px" }}>
        <input
          type="text"
          placeholder="Search user by name or email..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          style={searchInputStyle}
        />
      </div>

      {/* Loading */}

      {loading ? (
        <div style={loadingStyle}>
          Loading users...
        </div>
      ) : filteredUsers.length === 0 ? (
        <div style={emptyStyle}>
          No users found.
        </div>
      ) : (
        <>
          {/* Mobile Cards */}

          <div style={mobileWrapperStyle}>
            {filteredUsers.map((u) => (
              <div key={u._id} style={mobileCardStyle}>
                <div style={mobileRowStyle}>
                  <span style={labelStyle}>User ID</span>
                  <span style={valueStyle}>
                    {u._id.substring(0, 8)}...
                  </span>
                </div>

                <div style={mobileRowStyle}>
                  <span style={labelStyle}>Name</span>
                  <span style={valueStyle}>{u.name}</span>
                </div>

                <div style={mobileRowStyle}>
                  <span style={labelStyle}>Email</span>
                  <span style={emailStyle}>{u.email}</span>
                </div>

                <div style={mobileRowStyle}>
                  <span style={labelStyle}>Role</span>
                  <span style={getRoleStyle(u.role)}>
                    {u.role}
                  </span>
                </div>

                <div style={mobileRowStyle}>
                  <span style={labelStyle}>Joined</span>
                  <span style={valueStyle}>
                    {new Date(
                      u.createdAt
                    ).toLocaleDateString()}
                  </span>
                </div>

                <button
                  style={viewButtonStyle}
                  onClick={() =>
                    navigate(`/admin/users/${u._id}`)
                  }
                >
                  View Customer
                </button>
              </div>
            ))}
          </div>

          {/* Desktop Table */}

          <div style={tableWrapperStyle}>
            <table style={tableStyle}>
              <thead>
                <tr>
                  <th style={thStyle}>ID</th>
                  <th style={thStyle}>NAME</th>
                  <th style={thStyle}>EMAIL</th>
                  <th style={thStyle}>ROLE</th>
                  <th style={thStyle}>JOINED</th>
                  <th style={thStyle}>ACTION</th>
                </tr>
              </thead>

              <tbody>
                {filteredUsers.map((u) => (
                  <tr key={u._id} style={rowStyle}>
                    <td style={tdStyle}>
                      {u._id.substring(0, 8)}...
                    </td>

                    <td style={tdStyle}>{u.name}</td>

                    <td style={emailCellStyle}>
                      {u.email}
                    </td>

                    <td style={tdStyle}>
                      <span style={getRoleStyle(u.role)}>
                        {u.role}
                      </span>
                    </td>

                    <td style={tdStyle}>
                      {new Date(
                        u.createdAt
                      ).toLocaleDateString()}
                    </td>

                    <td style={tdStyle}>
                      <button
                        style={viewButtonStyle}
                        onClick={() =>
                          navigate(
                            `/admin/users/${u._id}`
                          )
                        }
                      >
                        View
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
};

/* STYLES */

const containerStyle = {
  background: "#FFFFFF",
  color: "#1F2937",
  border: "1px solid #ECE6DC",
  boxShadow: "0 20px 50px rgba(0,0,0,.06)",
  maxWidth: "1200px",
  margin: "40px auto",
  padding: "30px",
  borderRadius: "18px",
};

const headerStyle = {
  marginBottom: "25px",
};

const headingStyle = {
  color: "#C8A96B",
  marginBottom: "8px",
};

const subHeadingStyle = {
  color: "#6B7280",
};

const statsGridStyle = {
  display: "grid",
  gridTemplateColumns:
    "repeat(auto-fit,minmax(220px,1fr))",
  gap: "20px",
  marginBottom: "25px",
};

const statCardStyle = {
  background: "#fff",
  padding: "20px",
  borderRadius: "16px",
  border: "1px solid #ECE6DC",
  boxShadow: "0 4px 15px rgba(0,0,0,.05)",
};

const searchInputStyle = {
  width: "100%",
  padding: "12px 15px",
  border: "1px solid #E8DFD2",
  borderRadius: "12px",
  outline: "none",
};

const tableWrapperStyle = {
  overflowX: "auto",
};

const tableStyle = {
  width: "100%",
  borderCollapse: "collapse",
  minWidth: "900px",
};

const rowStyle = {
  borderBottom: "1px solid #ECE6DC",
};

const thStyle = {
  padding: "18px 15px",
  textAlign: "left",
  color: "#8B7355",
};

const tdStyle = {
  padding: "18px 15px",
};

const emailCellStyle = {
  ...tdStyle,
  color: "#4B5563",
};

const mobileWrapperStyle = {
  display: "none",
};

const mobileCardStyle = {
  background: "#FFFFFF",
  border: "1px solid #ECE6DC",
  borderRadius: "16px",
  padding: "20px",
  marginBottom: "16px",
};

const mobileRowStyle = {
  display: "flex",
  justifyContent: "space-between",
  marginBottom: "12px",
  gap: "10px",
};

const labelStyle = {
  color: "#6B7280",
};

const valueStyle = {
  color: "#1F2937",
  fontWeight: "600",
};

const emailStyle = {
  color: "#4B5563",
  wordBreak: "break-word",
};

const viewButtonStyle = {
  background: "#C8A96B",
  color: "#fff",
  border: "none",
  padding: "10px 16px",
  borderRadius: "8px",
  cursor: "pointer",
  fontWeight: "600",
};

const loadingStyle = {
  textAlign: "center",
  padding: "40px",
};

const emptyStyle = {
  textAlign: "center",
  padding: "40px",
  color: "#6B7280",
};

export default AdminUsers;



