import React, { useEffect, useState, useContext } from "react";

import axios from "axios";

import { AuthContext } from "../context/AuthContext";

import "../styles/MyReturns.css";

const MyReturns = () => {
  const { user } = useContext(AuthContext);

  const [returns, setReturns] = useState([]);

  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchReturns = async () => {
      try {
        const { data } = await axios.get("/api/returns/my", {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        setReturns(data);
      } catch (error) {
        console.log(error);
      } finally {
        setLoading(false);
      }
    };

    if (user) {
      fetchReturns();
    }
  }, [user]);

  if (loading) {
    return (
      <div className="myreturns-page">
        {" "}
        <h2>Loading...</h2>{" "}
      </div>
    );
  }

  return (
    <div className="myreturns-page">
      <h1>My Return Requests</h1>

      {returns.length === 0 ? (
        <div className="empty-card">No Return Requests Found</div>
      ) : (
        <div className="returns-grid">
          {returns.map((item) => (
            <div className="return-card" key={item._id}>
              <div className="return-header">
                <h3>Order #{item.orderId?._id?.slice(-8)}</h3>

                <span
                  className={`status ${item.status
                    .toLowerCase()
                    .replace(/\s/g, "-")}`}
                >
                  {item.status}
                </span>
              </div>

              <p>
                <strong>Reason:</strong> {item.reason}
              </p>

              {item.adminRemark && (
                <p>
                  <strong>Admin Remark:</strong> {item.adminRemark}
                </p>
              )}

              {item.returnImages?.length > 0 && (
                <div className="images">
                  {item.returnImages.map((img, index) => (
                    <img key={index} src={img} alt="" />
                  ))}
                </div>
              )}

              <div className="dates">
                <span>
                  Created: {new Date(item.createdAt).toLocaleDateString()}
                </span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MyReturns;
