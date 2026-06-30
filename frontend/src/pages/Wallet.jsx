import React, { useEffect, useState, useContext } from "react";

import axios from "axios";

import { AuthContext } from "../context/AuthContext";

import "../styles/Wallet.css";

const Wallet = () => {
  const { user } = useContext(AuthContext);

  const [wallet, setWallet] = useState(null);

  const [transactions, setTransactions] = useState([]);

  useEffect(() => {
    const fetchWallet = async () => {
      try {
        const walletRes = await axios.get("/api/wallet", {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        const txnRes = await axios.get("/api/wallet/transactions", {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        // setWallet(walletRes.data);

        // setTransactions(txnRes.data);

        setWallet(walletRes.data.wallet);

        setTransactions(txnRes.data.transactions);
      } catch (error) {
        console.log(error);
      }
    };

    if (user) {
      fetchWallet();
    }
  }, [user]);

  return (
    <div className="wallet-page">
      <div className="wallet-card">
        <h2>Wallet Balance</h2>

        {/* <h1>₹{wallet?.balance || 0}</h1> */}
        ₹{wallet?.balance?.toFixed(2) || "0.00"}
      </div>

      <div className="txn-section">
        <h2>Transactions</h2>

        {/* {transactions.length === 0 ? ( */}
        { !transactions ||transactions.length === 0 ? (
        
          <p>No Transactions Found</p>
        ) : (
          transactions.map((txn) => (
            <div key={txn._id} className="txn-card">
              <div>
                <h4>{txn.description}</h4>

                <span>{new Date(txn.createdAt).toLocaleDateString()}</span>
              </div>

              <div className={txn.type === "Credit" ? "credit" : "debit"}>
                {txn.type === "Credit" ? "+" : "-"}₹{txn.amount}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default Wallet;
