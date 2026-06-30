import React, { useState, useEffect, useContext } from "react";

import axios from "axios";

import { AuthContext } from "../context/AuthContext";

import "../styles/AdminReturns.css";

const AdminReturns = () => {
  const { user } = useContext(AuthContext);

  const [returns, setReturns] = useState([]);
  const [loading, setLoading] = useState(true);

  const fetchReturns = async () => {
    try {
      const { data } = await axios.get("/api/returns", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });

      setReturns(data);
    } catch (error) {
      console.log(error);
      alert("Failed to load return requests");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchReturns();
    }
  }, [user]);

  const updateStatus = async (id, status) => {
    try {
      await axios.put(
        `/api/returns/${id}`,
        { status },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );

      //   alert(`Return ${status}`);
      alert(`Return request ${status}`);

      fetchReturns();
    } catch (error) {
      console.log(error);

      alert("Failed to update status");
    }
  };

  if (loading) {
    return (
      <div className="returns-page">
        <h2>Loading Return Requests...</h2>
      </div>
    );
  }

  return (
    <div className="returns-page">
      <h1>Return Requests</h1>

      {returns.length === 0 ? (
        <div className="empty-state">No Return Requests Found</div>
      ) : (
        <table>
          <thead>
            <tr>
              <th>Order ID</th>
              <th>Reason</th>
              <th>Status</th>
              <th>Images</th>
              <th>Action</th>
            </tr>
          </thead>

          <tbody>
            {returns.map((item) => (
              <tr key={item._id}>
                <td>{item.orderId?._id?.slice(-8)}</td>

                <td>{item.reason}</td>

                <td>
                  <span className={`status-badge ${item.status.toLowerCase()}`}>
                    {item.status}
                  </span>
                </td>

                {/* <td>
                  {item.status === "Pending" ? (
                    <>
                      <select
                        value={item.status}
                        onChange={(e) => updateStatus(item._id, e.target.value)}
                      >
                        <option>Pending</option>
                        <option>Approved</option>
                        <option>Pickup Scheduled</option>
                        <option>Picked Up</option>
                        <option>Refund Initiated</option>
                        <option>Refunded</option>
                        <option>Rejected</option>
                      </select>
                    </>
                  ) : (
                    <span>Completed</span>
                  )}
                </td> */}
                
                <td>
                  {item.returnImages?.length > 0 ? (
                    <img
                      src={item.returnImages[0]}
                      alt=""
                      style={{
                        width: "60px",
                        height: "60px",
                        objectFit: "cover",
                        borderRadius: "8px",
                      }}
                    />
                  ) : (
                    "No Image"
                  )}
                </td>
                <td>
                  <select
                    value={item.status}
                    onChange={(e) => updateStatus(item._id, e.target.value)}
                  >
                    <option>Pending</option>
                    <option>Approved</option>
                    <option>Pickup Scheduled</option>
                    <option>Picked Up</option>
                    <option>Refund Initiated</option>
                    <option>Refunded</option>
                    <option>Rejected</option>
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default AdminReturns;
