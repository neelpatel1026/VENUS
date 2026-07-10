// import React, { useState, useContext } from "react";
import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { clearCart } from "../redux/cartSlice";
import "../styles/checkout.css";

const Checkout = () => {
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const { user } = useContext(AuthContext);
  const cartItems = useSelector((state) => state.cart.cartItems);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState("");

  const [address, setAddress] = useState({
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "",
  });

  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);

  const [couponCode, setCouponCode] = useState("");

  const [discount, setDiscount] = useState(0);

  const [couponApplied, setCouponApplied] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  // const [resendTimer, setResendTimer] = useState(0);

  const sendOtp = async () => {
    try {
      setOtpSent(true);
      alert("OTP sent to your email");
      const { data } = await axios.post(
        "/api/email-otp/send",
        {},
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );

      alert(data.message);
    } catch (error) {
      alert(error.response?.data?.message);
    } finally {
      setSendingOtp(false);
    }
  };

  useEffect(() => {
    const fetchAddresses = async () => {
      if (!user?.token) return;

      try {
        const res = await axios.get("/api/address", {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        });

        const userAddresses = res.data.addresses || [];

        setAddresses(userAddresses);

        if (userAddresses.length > 0) {
          setSelectedAddress(userAddresses[0]._id);
          setAddress(userAddresses[0]);
        }
      } catch (error) {
        console.log(error);
      }
    };

    fetchAddresses();
  }, [user]);

  const saveOrderToLocalStorage = (paymentMethod, paymentStatus, paymentId) => {
    const orderData = {
      orderId: "ORD" + Date.now(),
      items: cartItems,
      address,
      totalAmount: totalPrice,
      paymentMethod,
      paymentStatus,
      paymentId,
      status: "Processing",
      orderDate: new Date().toISOString(),
    };

    const existingOrders = JSON.parse(localStorage.getItem("orders")) || [];

    existingOrders.push(orderData);

    localStorage.setItem("orders", JSON.stringify(existingOrders));
  };

  const totalPrice = cartItems.reduce(
    (acc, item) => acc + item.price * item.qty,
    0,
  );

  const discountAmount = (totalPrice * discount) / 100;

  const finalTotal = totalPrice - discountAmount;

  // Razorpay Payment

  const verifyEmailOtp = async () => {
    try {
      setVerifyingOtp(true);

      const res = await axios.post(
        "/api/email-otp/verify",
        { otp },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
        },
      );

      if (res.data.success) {
        setOtpVerified(true);
        alert("Email verified");
      }
    } catch (error) {
      alert(error.response?.data?.message);
    } finally {
      setVerifyingOtp(false);
    }
  };
  // const sendEmailOtp = async () => {
  //   try {
  //     const res = await axios.post(
  //       "/api/email-otp/send",
  //       {},
  //       {
  //         headers: {
  //           Authorization: `Bearer ${user.token}`,
  //         },
  //       },
  //     );

  //     if (res.data.success) {
  //       setOtpSent(true);
  //       alert("OTP sent to your email");
  //     }
  //   } catch (error) {
  //     alert(error.response?.data?.message);
  //   }
  // };

  const applyCoupon = async () => {
    try {
      const res = await axios.post("/api/coupons/validate", {
        code: couponCode,
      });

      setDiscount(res.data.discount);

      setCouponApplied(true);

      alert(`${res.data.discount}% Coupon Applied`);
    } catch (error) {
      alert(error.response?.data?.message || "Invalid coupon");
    }
  };

  const handlePayment = async () => {
    try {
      const orderRes = await fetch("/api/payment/create-order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          // amount: totalPrice,
          amount: finalTotal,
        }),
      });

      const orderData = await orderRes.json();

      const options = {
        key: "rzp_test_dummykey123",
        amount: orderData.amount,
        currency: orderData.currency,
        name: "ELYSORIA",
        description: "Order Payment",
        order_id: orderData.id,

        handler: async function (response) {
          try {
            const verifyRes = await fetch("/api/payment/verify", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
              },
              body: JSON.stringify(response),
            });

            if (!verifyRes.ok) {
              alert("Payment Verification Failed");
              return;
            }

            const saveOrderRes = await fetch("/api/orders", {
              method: "POST",
              headers: {
                "Content-Type": "application/json",
                Authorization: `Bearer ${user.token}`,
              },
              body: JSON.stringify({
                items: cartItems,
                totalAmount: totalPrice,
                address,
                paymentMethod,
                paymentId: response.razorpay_payment_id,
              }),
            });
          } catch (err) {
            console.error(err);
          }
        },

        prefill: {
          name: address.fullName,
          email: user?.email,
          contact: address.phone,
        },

        theme: {
          color: "#C8A96B",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error(error);
      alert("Payment Failed");
    }
  };

  // COD Order
  const placeCODOrder = async () => {
    if (isPlacingOrder) return;

    // setIsPlacingOrder(true);
    try {
      const saveOrderRes = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },

        body: JSON.stringify({
          items: cartItems,
          // totalAmount: totalPrice,
          totalAmount: finalTotal,
          address,
          customerPhone: address.phone,
          paymentMethod: "COD",
          paymentId: "COD_" + Date.now(),
        }),
      });
      // const data = await saveOrderRes.json();

      // console.log(data);
      const createdOrder = await saveOrderRes.json();

      console.log(createdOrder);

      if (saveOrderRes.ok) {
        // const createdOrder = await saveOrderRes.json();

        console.log("Created Order:", createdOrder);

        const paymentId = "COD_" + Date.now();

        saveOrderToLocalStorage("COD", "Pending", paymentId);

        dispatch(clearCart());

        navigate("/ordersuccess", {
          state: {
            orderId: createdOrder._id,
            paymentMethod: "COD",
            paymentStatus: "Pending",
          },
        });
      }
    } catch (error) {
      console.error(error);
    }
  };
  const handleSubmit = async (e) => {
    e.preventDefault();

    if (isPlacingOrder) return;

    setIsPlacingOrder(true);

    try {
      if (!user) {
        alert("Please login first");
        navigate("/login");
        return;
      }

      if (cartItems.length === 0) {
        alert("Cart is empty");
        return;
      }
      if (!selectedAddress) {
        alert("Please select a delivery address");
        return;
      }

      if (paymentMethod === "COD") {
        await placeCODOrder();
      } else {
        await handlePayment();
      }
    } catch (error) {
      console.error(error);
      alert("Something went wrong");
    } finally {
      setIsPlacingOrder(false);
    }
  };

  return (
    <div className="checkout-container" style={{ padding: "0 0 40px 0" }}>
      {/* Editorial Hero Header Banner */}
      <div 
        className="premium-page-hero"
        style={{ 
          background: "linear-gradient(135deg, #FAF6F0 0%, #F5ECE0 100%)", 
          borderBottom: "1px solid rgba(200, 169, 107, 0.2)", 
          padding: "40px 20px", 
          textAlign: "center", 
          position: "relative",
          overflow: "hidden",
          width: "100%",
          marginBottom: "40px"
        }}
      >
        <div style={{ position: "absolute", width: "200px", height: "200px", borderRadius: "50%", background: "rgba(200, 169, 107, 0.08)", filter: "blur(40px)", top: "-50px", left: "-50px", pointerEvents: "none" }} />
        <div style={{ position: "absolute", width: "250px", height: "250px", borderRadius: "50%", background: "rgba(200, 169, 107, 0.05)", filter: "blur(60px)", bottom: "-80px", right: "-50px", pointerEvents: "none" }} />
        
        <div style={{ maxWidth: "800px", margin: "0 auto", position: "relative", zIndex: "2" }}>
          <div style={{ fontSize: "0.75rem", letterSpacing: "2px", textTransform: "uppercase", color: "#8B7355", marginBottom: "14px", fontWeight: "700" }}>
            <Link to="/" style={{ color: "#8B7355", textDecoration: "none" }}>Home</Link>
            <span style={{ margin: "0 8px", opacity: 0.5 }}>/</span>
            <span style={{ color: "#1F2937" }}>Checkout</span>
          </div>
          
          <span style={{ display: "inline-block", fontSize: "0.8rem", letterSpacing: "3px", textTransform: "uppercase", color: "#C8A96B", fontWeight: "700", marginBottom: "8px" }}>
            Secure Transaction
          </span>
          <h1 style={{ fontFamily: "'Cinzel', 'Didot', 'Times New Roman', serif", fontSize: "2.5rem", fontWeight: "700", color: "#1F2937", margin: "0 0 10px 0", letterSpacing: "-0.5px", lineHeight: "1.2" }}>
            Secure Checkout Center
          </h1>
          <div style={{ width: "40px", height: "1px", background: "#C8A96B", margin: "14px auto" }} />
          <p style={{ fontSize: "0.95rem", color: "#6B7280", margin: "0 auto", lineHeight: "1.6", maxWidth: "600px" }}>
            Input your shipping credentials and payment methods to finalize your purchase order.
          </p>
        </div>
      </div>

      <form className="checkout-layout" onSubmit={handleSubmit}>
        {/* Shipping Form */}

        <div className="checkout-form">
          <h3>Shipping Address</h3>

          <h3>Select Delivery Address</h3>

          <div className="saved-address-list">
            {addresses.length === 0 ? (
              <div className="no-address">
                <p>No saved address found.</p>

                <button type="button" onClick={() => navigate("/my-addresses")}>
                  Add Address
                </button>
              </div>
            ) : (
              addresses.map((addr) => (
                <label
                  key={addr._id}
                  className={`saved-address-card ${
                    selectedAddress === addr._id ? "active-address" : ""
                  }`}
                >
                  <input
                    type="radio"
                    name="selectedAddress"
                    checked={selectedAddress === addr._id}
                    // onChange={() => {
                    //   setSelectedAddress(addr._id);
                    //   setAddress(addr);
                    // }}
                    onChange={() => {
                      // setSelectedAddress(addr._id);
                      // setAddress(addr);
                      // setOtpVerified(false);
                      // setOtpSent(false);
                      // setOtp("");

                      setSelectedAddress(addr._id);
                      setAddress(addr);
                    }}
                  />

                  <div>
                    <span className="address-type">{addr.label}</span>

                    <h4>{addr.fullName}</h4>

                    <p>{addr.phone}</p>

                    <p>
                      {addr.addressLine1}
                      {addr.addressLine2 && `, ${addr.addressLine2}`}
                    </p>

                    <p>
                      {addr.city}, {addr.state}
                    </p>

                    <p>{addr.pincode}</p>
                  </div>
                </label>
              ))
            )}
          </div>

          <h3>Payment Method</h3>
          {paymentMethod === "COD" && (
            <div className="otp-container">
              <h3>Email Verification</h3>

              <p>{user?.email}</p>

              {!otpSent && (
                // <button type="button" onClick={sendEmailOtp}>
                //   Send OTP
                // </button>
                <button
                  onClick={sendOtp}
                  disabled={sendingOtp}
                  className="otp-btn"
                >
                  {sendingOtp ? "Sending..." : "Send OTP"}
                </button>
              )}

              {otpSent && !otpVerified && (
                <>
                  <input
                    type="text"
                    placeholder="Enter OTP"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                  />

                  {/* <button type="button" onClick={verifyEmailOtp}>
                    Verify OTP
                  </button> */}
                  <button
                    type="button"
                    onClick={verifyEmailOtp}
                    disabled={verifyingOtp}
                    className="verify-btn"
                  >
                    {verifyingOtp ? "Verifying..." : "Verify OTP"}
                  </button>
                </>
              )}

              {otpVerified && <p>✅ Email Verified</p>}
            </div>
          )}

          {/* {paymentMethod === "COD" && (
            <div className="otp-container">
              <h3>Phone Verification</h3>

              <div className="otp-phone">
                <input type="text" value={address.phone} disabled />

                {!otpVerified && (
                  <button
                    type="button"
                    onClick={sendOtp}
                    disabled={resendTimer > 0}
                  >
                    {resendTimer > 0 ? `Resend ${resendTimer}s` : "Send OTP"}
                  </button>
                )}

                {otpVerified && (
                  <span className="verified-badge">✓ Verified</span>
                )}
              </div>

              {otpSent && !otpVerified && (
                <div className="otp-verify">
                  <input
                    type="text"
                    value={otp}
                    onChange={(e) => setOtp(e.target.value)}
                    placeholder="Enter OTP"
                  />

                  <button type="button" onClick={verifyOtp}>
                    Verify OTP
                  </button>
                </div>
              )}
            </div>
          )} */}

          {/* <label className="payment-option">
            <input
              type="radio"
              value="COD"
              checked={paymentMethod === "COD"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            Cash On Delivery
          </label> */}
          <label className="payment-option">
            <input
              type="radio"
              value="COD"
              checked={paymentMethod === "COD"}
              // onChange={(e) => {
              //   setPaymentMethod(e.target.value);

              //   setOtpVerified(false);

              //   setOtp("");

              //   setOtpSent(false);
              // }}

              onChange={(e) => {
                setPaymentMethod(e.target.value);
              }}
            />
            Cash On Delivery
          </label>

          {/* <label className="payment-option">
            <input
              type="radio"
              value="Razorpay"
              checked={paymentMethod === "Razorpay"}
              onChange={(e) => setPaymentMethod(e.target.value)}
            />
            Razorpay
          </label> */}
          <label className="payment-option">
            <input
              type="radio"
              value="Razorpay"
              checked={paymentMethod === "Razorpay"}
              // onChange={(e) => {
              //   setPaymentMethod(e.target.value);

              //   setOtpVerified(false);

              //   setOtp("");

              //   setOtpSent(false);
              // }}
              onChange={(e) => {
                setPaymentMethod(e.target.value);
              }}
            />
            Razorpay
          </label>
        </div>

        {/* Order Summary */}

        <div className="coupon-box">
          <h3>Coupon Code</h3>

          <div className="coupon-row">
            <input
              type="text"
              placeholder="Enter Coupon"
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
            />

            <button type="button" onClick={applyCoupon}>
              Apply
            </button>
          </div>
        </div>

        <div className="checkout-summary">
          <h3>Order Summary</h3>

          <div className="summary-row">
            <span>Items</span>
            <span>{cartItems.length}</span>
          </div>

          <div className="summary-row">
            <span>Shipping</span>
            <span>FREE</span>
          </div>

          {/* <div className="summary-row total">
            <span>Total</span>
            <span>₹{totalPrice.toFixed(2)}</span>
          </div> */}

          <div className="summary-row">
            <span>Subtotal</span>
            <span>₹{totalPrice.toFixed(2)}</span>
          </div>

          {couponApplied && (
            <div className="summary-row discount">
              <span>Coupon ({discount}%)</span>

              <span>-₹{discountAmount.toFixed(2)}</span>
            </div>
          )}

          <div className="summary-row total">
            <span>Total</span>

            <span>₹{finalTotal.toFixed(2)}</span>
          </div>

          <button
            type="submit"
            className="place-order-btn"
            disabled={
              isPlacingOrder || (paymentMethod === "COD" && !otpVerified)
            }
          >
            {isPlacingOrder ? (
              <>
                <span className="spinner"></span>
                Processing...
              </>
            ) : paymentMethod === "COD" ? (
              "Place Order"
            ) : (
              "Pay Now"
            )}
          </button>
        </div>
      </form>
    </div>
  );
};

export default Checkout;
