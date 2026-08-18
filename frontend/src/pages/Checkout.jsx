import React, { useState, useContext, useEffect } from "react";
import axios from "axios";
import { useSelector, useDispatch } from "react-redux";
import { useNavigate, Link } from "react-router-dom";
import { AuthContext } from "../context/AuthContext";
import { clearCart } from "../redux/cartSlice";
import toast from "react-hot-toast";
import { 
  LuMapPin, 
  LuShieldCheck, 
  LuTruck, 
  LuWallet, 
  LuCreditCard, 
  LuMail, 
  LuTicket, 
  LuPlus, 
  LuTrash2, 
  LuCheck 
} from "react-icons/lu";
import AddressCard from "../components/AddressCard";
import { useGoogleMaps } from "../components/GoogleMapLoader";
import { motion } from "framer-motion";
import { 
  FaSearch, 
  FaMapMarkerAlt, 
  FaLocationArrow, 
  FaChevronUp, 
  FaChevronDown, 
  FaHome, 
  FaBriefcase, 
  FaBuilding, 
  FaHotel 
} from "react-icons/fa";
import "../styles/checkout.css";
import "../styles/myAddresses.css";

const Checkout = () => {
  const [isPlacingOrder, setIsPlacingOrder] = useState(false);
  const { user } = useContext(AuthContext);
  const cartItems = useSelector((state) => state.cart.cartItems);

  const dispatch = useDispatch();
  const navigate = useNavigate();

  const handleBackClick = () => {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      if (cartItems.length > 0) {
        navigate("/cart");
      } else {
        navigate("/shop");
      }
    }
  };

  const [paymentMethod, setPaymentMethod] = useState("COD");
  const [addresses, setAddresses] = useState([]);
  const [selectedAddress, setSelectedAddress] = useState("");
  const [loading, setLoading] = useState(true);

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

  const [otpValues, setOtpValues] = useState(["", "", "", "", "", ""]);
  const [otpSent, setOtpSent] = useState(false);
  const [otpVerified, setOtpVerified] = useState(false);
  const [resendTimer, setResendTimer] = useState(0);
  const [resendCount, setResendCount] = useState(0);
  const [otpErrorMsg, setOtpErrorMsg] = useState("");

  const [couponCode, setCouponCode] = useState("");
  const [discount, setDiscount] = useState(0);
  const [appliedCouponDetails, setAppliedCouponDetails] = useState(null);
  const [couponApplied, setCouponApplied] = useState(false);
  const [applyingCoupon, setApplyingCoupon] = useState(false);
  const [sendingOtp, setSendingOtp] = useState(false);
  const [verifyingOtp, setVerifyingOtp] = useState(false);
  
  // Subtle coupon micro-interaction states
  const [couponShake, setCouponShake] = useState(false);
  const [couponFocused, setCouponFocused] = useState(false);
  const [couponErrorMsgState, setCouponErrorMsgState] = useState("");

  const { isLoaded, isMock, apiKey, mockPlaces, reverseGeocodeMock } = useGoogleMaps();
  const [checkoutSearchQuery, setCheckoutSearchQuery] = useState("");
  const [checkoutSuggestions, setCheckoutSuggestions] = useState([]);
  const [detectingCheckoutLocation, setDetectingCheckoutLocation] = useState(false);
  const [showCheckoutAdvanced, setShowCheckoutAdvanced] = useState(false);

  // Rewards Wallet Balance & Coin usage states
  const [walletCoinsBalance, setWalletCoinsBalance] = useState(0);
  const [useCoins, setUseCoins] = useState(false);
  const [coinsUsed, setCoinsUsed] = useState(0);

  useEffect(() => {
    if (!user?.token) return;
    const fetchWalletBalance = async () => {
      try {
        const res = await axios.get("/api/rewards/wallet", {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        if (res.data?.success) {
          setWalletCoinsBalance(res.data.walletBalance || 0);
        }
      } catch (err) {
        console.error(err);
      }
    };
    fetchWalletBalance();
  }, [user]);

  // Inline address form states
  const [showAddForm, setShowAddForm] = useState(false);
  const [newAddr, setNewAddr] = useState({
    label: "Home",
    fullName: "",
    phone: "",
    addressLine1: "",
    addressLine2: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    placeId: "",
    lat: 23.0496,
    lng: 72.6734,
    formattedAddress: "",
    isDefault: false,
  });

  const fetchAddresses = async () => {
    if (!user?.token) return;
    setLoading(true);
    try {
      const res = await axios.get("/api/address", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      const userAddresses = res.data.addresses || [];
      setAddresses(userAddresses);

      if (userAddresses.length > 0) {
        // Maintain selection if previously set and still valid
        const stillValid = userAddresses.find(a => a._id === selectedAddress);
        if (stillValid) {
          setAddress(stillValid);
        } else {
          const defaultAddr = userAddresses.find(a => a.isDefault);
          const selectTarget = defaultAddr || userAddresses[0];
          setSelectedAddress(selectTarget._id);
          setAddress(selectTarget);
        }
      } else {
        setSelectedAddress("");
        setAddress({
          fullName: "",
          phone: "",
          addressLine1: "",
          addressLine2: "",
          city: "",
          state: "",
          pincode: "",
          country: "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch saved addresses:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAddresses();
  }, [user]);

  // Handle suggestion filtering in mock mode
  useEffect(() => {
    if (!isMock || !checkoutSearchQuery) {
      setCheckoutSuggestions([]);
      return;
    }
    const q = checkoutSearchQuery.toLowerCase();
    const filtered = mockPlaces.filter(p => p.description.toLowerCase().includes(q));
    setCheckoutSuggestions(filtered);
  }, [checkoutSearchQuery, isMock]);

  // Handle OTP resend countdown timer
  useEffect(() => {
    if (resendTimer <= 0) return;
    const interval = setInterval(() => {
      setResendTimer((prev) => prev - 1);
    }, 1000);
    return () => clearInterval(interval);
  }, [resendTimer]);

  // Handle select suggestion in mock mode
  const handleSelectCheckoutMockSuggestion = (suggestion) => {
    const details = suggestion.details;
    setNewAddr(prev => ({
      ...prev,
      addressLine1: `${details.houseNumber} ${details.buildingName}`,
      addressLine2: details.landmark || details.street,
      city: details.city,
      state: details.state,
      pincode: details.pincode,
      country: details.country,
      placeId: suggestion.placeId,
      lat: details.lat,
      lng: details.lng,
      formattedAddress: details.formattedAddress
    }));
    setCheckoutSearchQuery("");
    setCheckoutSuggestions([]);
    toast.success("Checkout shipping address filled! ⚡");
  };

  // Reverse geocoding for GPS coordinate input in checkout
  const handleCheckoutReverseGeocode = async (lat, lng) => {
    if (isMock) {
      const details = reverseGeocodeMock(lat, lng);
      setNewAddr(prev => ({
        ...prev,
        city: details.city,
        state: details.state,
        pincode: details.pincode,
        country: details.country,
        lat,
        lng,
        placeId: details.placeId || "mock-geo-marker-checkout",
        formattedAddress: details.formattedAddress,
        addressLine2: details.landmark || details.area || ""
      }));
      return;
    }

    try {
      const geocoder = new window.google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        if (status === "OK" && results[0]) {
          const place = results[0];
          const components = place.address_components || [];
          let city = "", state = "", pincode = "", country = "";

          components.forEach(comp => {
            const types = comp.types;
            if (types.includes("locality")) city = comp.long_name;
            else if (types.includes("administrative_area_level_1")) state = comp.long_name;
            else if (types.includes("postal_code")) pincode = comp.long_name;
            else if (types.includes("country")) country = comp.long_name;
          });

          setNewAddr(prev => ({
            ...prev,
            city: city || prev.city,
            state: state || prev.state,
            pincode: pincode || prev.pincode,
            country: country || prev.country,
            lat,
            lng,
            placeId: place.place_id,
            formattedAddress: place.formatted_address
          }));
        }
      });
    } catch (err) {
      console.error(err);
    }
  };

  // GPS current location detection for checkout shipping addition
  const handleCheckoutUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setDetectingCheckoutLocation(true);
    toast.loading("Locating coordinate points...", { id: "checkout-gps" });

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;
        await handleCheckoutReverseGeocode(lat, lng);
        setDetectingCheckoutLocation(false);
        toast.dismiss("checkout-gps");
        toast.success("GPS locked! Destination address filled.");
      },
      (error) => {
        console.error(error);
        setDetectingCheckoutLocation(false);
        toast.dismiss("checkout-gps");
        toast.error("Failed to detect location. Grant browser permissions.");
      },
      { enableHighAccuracy: true, timeout: 8000 }
    );
  };

  // Live Autocomplete for Checkout page
  const handleLiveCheckoutAutocompleteFocus = () => {
    if (isMock || !window.google) return;
    const inputEl = document.getElementById("checkout-search-autocomplete-input");
    if (!inputEl) return;

    const autocomplete = new window.google.maps.places.Autocomplete(inputEl, {
      types: ["address"],
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) return;

      const components = place.address_components || [];
      let houseNumber = "", street = "", area = "", city = "", state = "", country = "", pincode = "";

      components.forEach(comp => {
        const types = comp.types;
        if (types.includes("street_number")) houseNumber = comp.long_name;
        else if (types.includes("route")) street = comp.long_name;
        else if (types.includes("sublocality_level_1")) area = comp.long_name;
        else if (types.includes("locality")) city = comp.long_name;
        else if (types.includes("administrative_area_level_1")) state = comp.long_name;
        else if (types.includes("country")) country = comp.long_name;
        else if (types.includes("postal_code")) pincode = comp.long_name;
      });

      setNewAddr(prev => ({
        ...prev,
        addressLine1: `${houseNumber} ${street}`.trim() || place.name || "",
        addressLine2: area || "",
        city: city || "",
        state: state || "",
        pincode: pincode || "",
        country: country || "India",
        placeId: place.place_id || "",
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        formattedAddress: place.formatted_address || ""
      }));
      toast.success("Address autocompleted!");
    });
  };

  const sendOtp = async () => {
    if (sendingOtp) return;
    setSendingOtp(true);
    setOtpErrorMsg("");
    try {
      const { data } = await axios.post(
        "/api/email-otp/send",
        {},
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
          timeout: 20000, // 20 seconds timeout
        }
      );
      setOtpSent(true);
      setResendTimer(30); // Start 30 seconds countdown
      setResendCount((prev) => prev + 1);
      setOtpValues(["", "", "", "", "", ""]); // Reset input boxes
      toast.success(data.message || "OTP sent successfully to your email!");
      
      // Auto focus first OTP digit input box on next tick
      setTimeout(() => {
        const firstBox = document.getElementById("otp-input-0");
        if (firstBox) firstBox.focus();
      }, 100);
    } catch (error) {
      if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        toast.error("Connection timed out. Please try sending OTP again.");
      } else {
        const errText = error.response?.data?.message || "Failed to send verification OTP";
        setOtpErrorMsg(errText);
        toast.error(errText);
      }
    } finally {
      setSendingOtp(false);
    }
  };

  const verifyEmailOtpDirect = async (otpString) => {
    if (verifyingOtp) return;
    setVerifyingOtp(true);
    setOtpErrorMsg("");
    try {
      const res = await axios.post(
        "/api/email-otp/verify",
        { otp: otpString },
        {
          headers: {
            Authorization: `Bearer ${user.token}`,
          },
          timeout: 20000,
        }
      );
      if (res.data.success) {
        setOtpVerified(true);
        toast.success("Email verified successfully! 🎉");
      }
    } catch (error) {
      if (error.code === "ECONNABORTED" || error.message?.includes("timeout")) {
        toast.error("Connection timed out. Please verify again.");
      } else {
        const errText = error.response?.data?.message || "Invalid OTP code entered";
        setOtpErrorMsg(errText);
        toast.error(errText);
      }
    } finally {
      setVerifyingOtp(false);
    }
  };

  const verifyEmailOtp = async () => {
    const otpString = otpValues.join("");
    if (otpString.length < 6) {
      toast.error("Please enter the full 6-digit OTP");
      return;
    }
    await verifyEmailOtpDirect(otpString);
  };

  const handleOtpChange = (index, value) => {
    // allow numbers only
    if (value && !/^\d+$/.test(value)) return;
    const newValues = [...otpValues];
    newValues[index] = value.slice(-1); // only keep last character
    setOtpValues(newValues);
    setOtpErrorMsg("");

    // Auto focus next box
    if (value && index < 5) {
      const nextInput = document.getElementById(`otp-input-${index + 1}`);
      if (nextInput) nextInput.focus();
    }

    // Auto verify when the last digit is entered and all boxes are populated
    const finalOtp = newValues.join("");
    if (finalOtp.length === 6 && !newValues.includes("")) {
      // Small timeout to allow input rendering and prevent blocking focus transitions
      setTimeout(() => {
        verifyEmailOtpDirect(finalOtp);
      }, 80);
    }
  };

  const handleOtpKeyDown = (index, e) => {
    if (e.key === "Backspace") {
      if (!otpValues[index] && index > 0) {
        const prevInput = document.getElementById(`otp-input-${index - 1}`);
        if (prevInput) {
          prevInput.focus();
          const newValues = [...otpValues];
          newValues[index - 1] = "";
          setOtpValues(newValues);
          setOtpErrorMsg("");
        }
      }
    }
  };

  const handleOtpPaste = (e) => {
    e.preventDefault();
    const pastedData = e.clipboardData.getData("text").trim();
    if (/^\d{6}$/.test(pastedData)) {
      const newValues = pastedData.split("");
      setOtpValues(newValues);
      setOtpErrorMsg("");
      const lastInput = document.getElementById("otp-input-5");
      if (lastInput) lastInput.focus();
    }
  };

  const handleNewAddrChange = (e) => {
    setNewAddr({ ...newAddr, [e.target.name]: e.target.value });
  };

  const handleAddNewAddressSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("/api/address/add", newAddr, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      toast.success("Delivery address saved!");
      setNewAddr({
        label: "Home",
        fullName: "",
        phone: "",
        addressLine1: "",
        addressLine2: "",
        city: "",
        state: "",
        pincode: "",
        country: "India",
      });
      setShowAddForm(false);
      await fetchAddresses();
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to save address details");
    }
  };

  const handleDeleteAddress = async (addrId, e) => {
    e.stopPropagation();
    e.preventDefault();
    try {
      await axios.delete(`/api/address/${addrId}`, {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      toast.success("Saved address removed!");
      if (selectedAddress === addrId) {
        setSelectedAddress("");
      }
      await fetchAddresses();
    } catch (error) {
      toast.error("Failed to delete address");
    }
  };

  const totalPrice = cartItems.reduce(
    (acc, item) => acc + item.price * item.qty,
    0
  );

  const discountAmount = appliedCouponDetails
    ? (appliedCouponDetails.discountType === "percentage"
        ? Math.min(appliedCouponDetails.maxDiscount > 0 ? appliedCouponDetails.maxDiscount : Infinity, (totalPrice * appliedCouponDetails.discountValue) / 100)
        : appliedCouponDetails.discountValue)
    : 0;

  // Recalculate dynamic coin deductions to never exceed order total
  const rawPostCouponTotal = Math.max(0, totalPrice - discountAmount);
  const actualCoinsUsed = useCoins ? Math.min(rawPostCouponTotal, walletCoinsBalance) : 0;
  
  const codFee = paymentMethod === "COD" ? 50 : 0;
  const finalTotal = parseFloat(Math.max(0, rawPostCouponTotal - actualCoinsUsed + codFee).toFixed(2));

  const applyCoupon = async () => {
    if (!couponCode.trim()) {
      toast.error("Please enter a valid coupon code");
      return;
    }
    if (cartItems.length === 0 || totalPrice <= 0) {
      toast.error("Cart is empty or total is ₹0");
      return;
    }

    setApplyingCoupon(true);
    setCouponErrorMsgState("");
    try {
      const res = await axios.post("/api/coupons/validate", {
        code: couponCode,
        items: cartItems
      }, {
        headers: {
          Authorization: `Bearer ${user.token}`
        }
      });

      const data = res.data;
      setAppliedCouponDetails({
        code: data.code,
        discountType: data.discountType,
        discountValue: data.discountValue,
        discountAmount: data.discountAmount,
        maxDiscount: data.maxDiscount || 0
      });
      setDiscount(data.discountValue);
      setCouponApplied(true);
      toast.success(data.message || "Coupon Applied Successfully! 🎉");
    } catch (error) {
      const msg = error.response?.data?.message || "Invalid coupon code";
      toast.error(msg);
      setCouponErrorMsgState(msg);
      setCouponApplied(false);
      setAppliedCouponDetails(null);
      
      // Fire subtle Apple/Stripe-like error shake
      setCouponShake(true);
      setTimeout(() => setCouponShake(false), 500);
    } finally {
      setApplyingCoupon(false);
    }
  };

  const removeCoupon = () => {
    setCouponApplied(false);
    setAppliedCouponDetails(null);
    setCouponCode("");
    setDiscount(0);
    toast.success("Coupon Removed Successfully");
  };

  // Razorpay Payment Gateway integration
  const handlePayment = async () => {
    try {
      const orderRes = await fetch("/api/payment/order", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          amount: finalTotal,
        }),
      });

      if (!orderRes.ok) {
        const errData = await orderRes.json().catch(() => ({}));
        toast.error(errData.message || "Razorpay order creation failed");
        setIsPlacingOrder(false);
        return;
      }

      const orderData = await orderRes.json();

      const options = {
        key: import.meta.env.VITE_RAZORPAY_KEY_ID || "rzp_test_dummykey123",
        amount: orderData.amount,
        currency: orderData.currency,
        name: "VENUS CARE",
        description: "Secure Order Checkout",
        order_id: orderData.id,
        modal: {
          ondismiss: function () {
            setIsPlacingOrder(false);
          },
        },
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
              toast.error("Razorpay verification signature failed");
              setIsPlacingOrder(false);
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
                totalAmount: finalTotal,
                address,
                paymentMethod,
                paymentId: response.razorpay_payment_id,
                couponCode: couponApplied ? couponCode.toUpperCase() : "",
                coinsUsed: actualCoinsUsed,
                isGift: cartItems.some(i => i.isGift),
                giftWrap: cartItems.some(i => i.giftWrap),
                giftBox: cartItems.some(i => i.giftBox),
                giftReceipt: cartItems.some(i => i.giftReceipt),
                giftMessage: cartItems.find(i => i.giftMessage)?.giftMessage || "",
              }),
            });

            const createdOrder = await saveOrderRes.json();
            if (saveOrderRes.ok) {
              saveOrderToLocalStorage("Razorpay", "Paid", response.razorpay_payment_id);
              dispatch(clearCart());
              navigate("/ordersuccess", {
                state: {
                  orderId: createdOrder._id,
                  paymentMethod: "Razorpay",
                  paymentStatus: "Paid",
                },
              });
            } else {
              toast.error(createdOrder.message || "Failed to save order details");
              setIsPlacingOrder(false);
            }
          } catch (err) {
            console.error("Save order error:", err);
            toast.error("An error occurred while saving your order");
            setIsPlacingOrder(false);
          }
        },
        prefill: {
          name: address.fullName,
          email: user?.email,
          contact: address.phone,
        },
        theme: {
          color: "#C8A165",
        },
      };

      const razorpay = new window.Razorpay(options);
      razorpay.open();
    } catch (error) {
      console.error(error);
      toast.error("Razorpay setup initialization failed");
      setIsPlacingOrder(false);
    }
  };

  // Cash on Delivery Order placement
  const placeCODOrder = async () => {
    try {
       const saveOrderRes = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${user.token}`,
        },
        body: JSON.stringify({
          items: cartItems,
          totalAmount: finalTotal,
          address,
          customerPhone: address.phone,
          paymentMethod: "COD",
          paymentId: "COD_" + Date.now(),
          couponCode: couponApplied ? couponCode.toUpperCase() : "",
          coinsUsed: actualCoinsUsed,
          isGift: cartItems.some(i => i.isGift),
          giftWrap: cartItems.some(i => i.giftWrap),
          giftBox: cartItems.some(i => i.giftBox),
          giftReceipt: cartItems.some(i => i.giftReceipt),
          giftMessage: cartItems.find(i => i.giftMessage)?.giftMessage || "",
        }),
      });

      const createdOrder = await saveOrderRes.json();
      if (saveOrderRes.ok) {
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
      } else {
        toast.error(createdOrder.message || "Failed to place Cash on Delivery order");
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to place Cash on Delivery order");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (isPlacingOrder) return;

    if (!user) {
      toast.error("Authentication expired. Please log in first.");
      navigate("/login");
      return;
    }

    if (cartItems.length === 0) {
      toast.error("Your shopping bag is empty");
      return;
    }

    if (!selectedAddress) {
      toast.error("Please select a delivery address");
      return;
    }

    setIsPlacingOrder(true);
    try {
      if (paymentMethod === "COD") {
        await placeCODOrder();
        setIsPlacingOrder(false);
      } else {
        await handlePayment();
        // Note: isPlacingOrder stays true during Razorpay payment interaction.
        // It will be reset to false in the ondismiss handler or verify handlers if payment fails.
      }
    } catch (error) {
      console.error(error);
      toast.error("An error occurred during checkout processing");
      setIsPlacingOrder(false);
    }
  };

  if (loading) {
    return (
      <div className="checkout-main-wrapper route-fade-in">
        <div className="checkout-page-container">
          <div className="checkout-two-columns-layout">
            <div className="checkout-left-column">
              {/* Shipping Address Section Skeleton */}
              <div className="checkout-section-block" style={{ padding: "24px", background: "#FFFFFF", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.05)", marginBottom: "20px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <div className="shimmer-bg" style={{ height: "22px", width: "160px", borderRadius: "4px" }} />
                  <div className="shimmer-bg" style={{ height: "30px", width: "120px", borderRadius: "6px" }} />
                </div>
                <div className="checkout-address-cards-grid">
                  {[1, 2].map((i) => (
                    <div key={i} style={{ border: "1px solid rgba(0,0,0,0.05)", borderRadius: "12px", padding: "16px", display: "flex", flexDirection: "column", gap: "10px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <div className="shimmer-bg" style={{ height: "16px", width: "80px", borderRadius: "4px" }} />
                        <div className="shimmer-bg" style={{ height: "16px", width: "16px", borderRadius: "50%" }} />
                      </div>
                      <div className="shimmer-bg" style={{ height: "14px", width: "90%", borderRadius: "4px" }} />
                      <div className="shimmer-bg" style={{ height: "14px", width: "70%", borderRadius: "4px" }} />
                      <div className="shimmer-bg" style={{ height: "14px", width: "50%", borderRadius: "4px" }} />
                    </div>
                  ))}
                </div>
              </div>
              
              {/* Payment Methods Section Skeleton */}
              <div className="checkout-section-block" style={{ padding: "24px", background: "#FFFFFF", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.05)" }}>
                <div className="shimmer-bg" style={{ height: "22px", width: "140px", borderRadius: "4px", marginBottom: "20px" }} />
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {[1, 2, 3].map((i) => (
                    <div key={i} style={{ border: "1px solid rgba(0,0,0,0.05)", borderRadius: "12px", padding: "16px", display: "flex", alignItems: "center", gap: "12px" }}>
                      <div className="shimmer-bg" style={{ height: "18px", width: "18px", borderRadius: "50%" }} />
                      <div className="shimmer-bg" style={{ height: "16px", width: "120px", borderRadius: "4px" }} />
                      <div className="shimmer-bg" style={{ height: "16px", width: "40px", borderRadius: "4px", marginLeft: "auto" }} />
                    </div>
                  ))}
                </div>
              </div>
            </div>
            
            <div className="checkout-right-column">
              <div className="order-summary-box-card" style={{ padding: "24px", background: "#FFFFFF", borderRadius: "16px", border: "1px solid rgba(0,0,0,0.05)" }}>
                <div className="shimmer-bg" style={{ height: "22px", width: "150px", borderRadius: "4px", marginBottom: "24px" }} />
                
                {/* Items in summary list */}
                {[1, 2].map((i) => (
                  <div key={i} style={{ display: "flex", gap: "14px", marginBottom: "16px" }}>
                    <div className="shimmer-bg" style={{ width: "60px", height: "60px", borderRadius: "8px", flexShrink: 0 }} />
                    <div style={{ flex: 1, display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div className="shimmer-bg" style={{ height: "14px", width: "85%", borderRadius: "4px" }} />
                      <div className="shimmer-bg" style={{ height: "12px", width: "40%", borderRadius: "4px" }} />
                      <div className="shimmer-bg" style={{ height: "14px", width: "30%", borderRadius: "4px", marginTop: "auto" }} />
                    </div>
                  </div>
                ))}
                
                <div style={{ height: "1px", background: "rgba(0,0,0,0.06)", margin: "20px 0" }} />
                
                {/* Price calculations details */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginBottom: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div className="shimmer-bg" style={{ height: "12px", width: "80px", borderRadius: "4px" }} />
                    <div className="shimmer-bg" style={{ height: "12px", width: "50px", borderRadius: "4px" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div className="shimmer-bg" style={{ height: "12px", width: "60px", borderRadius: "4px" }} />
                    <div className="shimmer-bg" style={{ height: "12px", width: "40px", borderRadius: "4px" }} />
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <div className="shimmer-bg" style={{ height: "14px", width: "70px", borderRadius: "4px" }} />
                    <div className="shimmer-bg" style={{ height: "14px", width: "60px", borderRadius: "4px" }} />
                  </div>
                </div>
                
                <div className="shimmer-bg" style={{ height: "48px", borderRadius: "12px" }} />
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="checkout-main-wrapper route-fade-in">
      <div className="checkout-page-container">
        
        {/* BACK NAV ACTION */}
        <button 
          type="button" 
          onClick={handleBackClick}
          className="checkout-back-nav-btn font-outfit"
        >
          ← Continue Shopping
        </button>

        <form className="checkout-two-columns-layout" onSubmit={handleSubmit}>
          
          {/* LEFT COLUMN: Shipping details, Payments, OTP */}
          <div className="checkout-left-column">
            
            {/* Shipping Address Selector Section */}
            <div className="checkout-section-block">
              <div className="section-header-row">
                <h2>Shipping & Delivery</h2>
                <LuTruck className="section-header-icon" />
              </div>
              <p className="section-desc-subtext">Choose a destination address for your premium delivery.</p>

              <div className="address-cards-stack-luxury font-outfit">
                {addresses.length === 0 ? (
                  <div className="empty-addresses-box-luxury">
                    <span className="empty-icon">📍</span>
                    <p>No shipping addresses saved to your profile yet.</p>
                  </div>
                ) : (
                  <div className="checkout-address-cards-grid">
                    {addresses.map((addr) => (
                      <AddressCard
                        key={addr._id}
                        address={addr}
                        onEdit={() => navigate("/profile?tab=addresses")}
                        onDelete={async (id) => {
                          await axios.delete(`/api/address/${id}`, {
                            headers: { Authorization: `Bearer ${user.token}` }
                          });
                          toast.success("Address deleted!");
                          fetchAddresses();
                        }}
                        onSelect={(selected) => {
                          setSelectedAddress(selected._id);
                          setAddress(selected);
                          toast.success("Delivery destination locked! 🚚");
                        }}
                        isSelected={selectedAddress === addr._id}
                        apiKey={apiKey}
                      />
                    ))}
                  </div>
                )}
              </div>

              {/* Add New Address Action Block */}
              {!showAddForm ? (
                <button 
                  type="button" 
                  className="add-address-trigger-btn-luxury"
                  onClick={() => setShowAddForm(true)}
                >
                  <LuPlus className="btn-icon" /> Add New Address
                </button>
              ) : (
                <form onSubmit={(e) => {
                  e.preventDefault();
                  handleAddNewAddressSubmit();
                }} className="inline-add-address-form-box-luxury">
                  <h4 className="inline-form-title">New Shipping Details</h4>
                  
                  {/* Google Autocomplete input */}
                  <div className="form-group-item full-width relative" style={{ marginBottom: "12px" }}>
                    <label className="form-label-luxury">Search Address (Google Places Lookup)</label>
                    <div className="luxury-search-input-field">
                      <FaSearch className="field-icon" style={{ marginRight: "8px", color: "#9CA3AF" }} />
                      {isMock ? (
                        <input
                          type="text"
                          placeholder="Search address (e.g. Nikol, CP, BKC)..."
                          value={checkoutSearchQuery}
                          onChange={(e) => setCheckoutSearchQuery(e.target.value)}
                          className="luxury-search-input-field-input"
                        />
                      ) : (
                        <input
                          id="checkout-search-autocomplete-input"
                          type="text"
                          placeholder="Search location globally..."
                          onFocus={handleLiveCheckoutAutocompleteFocus}
                          className="luxury-search-input-field-input"
                        />
                      )}
                    </div>

                    {/* Autocomplete suggestion popovers */}
                    {isMock && checkoutSuggestions.length > 0 && (
                      <div className="autocomplete-suggestions-list-luxury">
                        {checkoutSuggestions.map((s) => (
                          <div 
                            key={s.placeId} 
                            className="suggestion-item-luxury"
                            onClick={() => handleSelectCheckoutMockSuggestion(s)}
                          >
                            <FaMapMarkerAlt className="marker-icon" />
                            <span>{s.description}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* GPS Locator button */}
                  <button 
                    type="button" 
                    className="gps-locator-btn font-outfit"
                    style={{ width: "100%", marginBottom: "16px" }}
                    onClick={handleCheckoutUseCurrentLocation}
                    disabled={detectingCheckoutLocation}
                  >
                    <FaLocationArrow className="arrow-icon" />
                    {detectingCheckoutLocation ? "Locating position..." : "Use Current Location via GPS"}
                  </button>

                  <div className="form-inputs-grid-luxury" style={{ gap: "12px" }}>
                    <div className="form-input-block">
                      <label>Full Name*</label>
                      <input 
                        type="text" 
                        name="fullName" 
                        value={newAddr.fullName} 
                        onChange={(e) => setNewAddr({ ...newAddr, fullName: e.target.value })}
                        placeholder="Receiver Name" 
                        required 
                        autocomplete="name"
                        enterkeyhint="next"
                      />
                    </div>
                    <div className="form-input-block">
                      <label>Phone Number*</label>
                      <input 
                        type="tel" 
                        name="phone" 
                        value={newAddr.phone} 
                        onChange={(e) => setNewAddr({ ...newAddr, phone: e.target.value })}
                        placeholder="10-digit contact number" 
                        required 
                        autocomplete="tel"
                        pattern="[0-9]*"
                        inputmode="numeric"
                        enterkeyhint="next"
                      />
                    </div>
                    <div className="form-input-block">
                      <label>Flat / House No. / Building*</label>
                      <input 
                        type="text" 
                        name="addressLine1" 
                        value={newAddr.addressLine1} 
                        onChange={(e) => setNewAddr({ ...newAddr, addressLine1: e.target.value })}
                        placeholder="Flat no., Floor..." 
                        required 
                        autocomplete="address-line1"
                        enterkeyhint="next"
                      />
                    </div>
                    <div className="form-input-block">
                      <label>Street / Area / Landmark</label>
                      <input 
                        type="text" 
                        name="addressLine2" 
                        value={newAddr.addressLine2} 
                        onChange={(e) => setNewAddr({ ...newAddr, addressLine2: e.target.value })}
                        placeholder="e.g. Near Metro Hub" 
                        autocomplete="address-line2"
                        enterkeyhint="next"
                      />
                    </div>
                  </div>

                  {/* Collapsible advanced address drawers */}
                  <div className="advanced-fields-drawer-block" style={{ marginTop: "12px" }}>
                    <button 
                      type="button" 
                      className="drawer-toggle-btn font-outfit"
                      onClick={() => setShowCheckoutAdvanced(!showCheckoutAdvanced)}
                    >
                      {showCheckoutAdvanced ? "Hide Location Details" : "View Auto-Filled Location Details"}
                      {showCheckoutAdvanced ? <FaChevronUp /> : <FaChevronDown />}
                    </button>

                    {showCheckoutAdvanced && (
                      <div className="drawer-collapsed-inputs font-outfit" style={{ border: "1px solid #ECE7DF", background: "#FAF9F6" }}>
                        <div className="form-inputs-grid-luxury" style={{ gap: "10px" }}>
                          <div className="form-input-block">
                            <label>City</label>
                            <input 
                              type="text" 
                              name="city"
                              value={newAddr.city} 
                              onChange={(e) => setNewAddr({ ...newAddr, city: e.target.value })}
                              required 
                              autocomplete="address-level2"
                              enterkeyhint="next"
                            />
                          </div>
                          <div className="form-input-block">
                            <label>State</label>
                            <input 
                              type="text" 
                              name="state"
                              value={newAddr.state} 
                              onChange={(e) => setNewAddr({ ...newAddr, state: e.target.value })}
                              required 
                              autocomplete="address-level1"
                              enterkeyhint="next"
                            />
                          </div>
                          <div className="form-input-block">
                            <label>Pincode</label>
                            <input 
                              type="text" 
                              name="pincode"
                              value={newAddr.pincode} 
                              onChange={(e) => setNewAddr({ ...newAddr, pincode: e.target.value })}
                              required 
                              autocomplete="postal-code"
                              pattern="[0-9]*"
                              inputmode="numeric"
                              enterkeyhint="next"
                            />
                          </div>
                          <div className="form-input-block">
                            <label>Country</label>
                            <input 
                              type="text" 
                              name="country"
                              value={newAddr.country} 
                              onChange={(e) => setNewAddr({ ...newAddr, country: e.target.value })}
                              required 
                              autocomplete="country-name"
                              enterkeyhint="done"
                            />
                          </div>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Chips Selection for Address Type label */}
                  <div className="address-type-selection-block font-outfit" style={{ marginTop: "14px" }}>
                    <label style={{ fontSize: "11px", fontWeight: "700", color: "#4B5563" }}>Select Address Label</label>
                    <div className="chips-list-selection" style={{ marginTop: "6px" }}>
                      {[
                        { value: "Home", icon: <FaHome /> },
                        { value: "Work", icon: <FaBriefcase /> },
                        { value: "Office", icon: <FaBuilding /> },
                        { value: "Hotel", icon: <FaHotel /> },
                        { value: "Other", icon: <FaMapMarkerAlt /> }
                      ].map((chip) => (
                        <button
                          type="button"
                          key={chip.value}
                          onClick={() => setNewAddr({ ...newAddr, label: chip.value })}
                          className={`type-chip-btn ${newAddr.label === chip.value ? "active" : ""}`}
                          style={{ padding: "6px 12px", fontSize: "11px" }}
                        >
                          {chip.icon} {chip.value}
                        </button>
                      ))}
                    </div>
                  </div>

                  {/* Submit actions */}
                  <div className="form-buttons-row" style={{ display: "flex", gap: "10px", marginTop: "18px" }}>
                    <button type="button" className="btn-luxury-cancel" style={{ flex: 1 }} onClick={() => setShowAddForm(false)}>Cancel</button>
                    <button type="submit" className="btn-luxury-submit-gold" style={{ flex: 1 }}>Save & Deliver</button>
                  </div>
                </form>
              )}
            </div>

            {/* Payment Method Cards Selection */}
            <div className="checkout-section-block">
              <div className="section-header-row">
                <h2>Payment Method</h2>
                <LuCreditCard className="section-header-icon" />
              </div>
              <p className="section-desc-subtext">Select a secure billing path for final transaction verification.</p>

              <div className="payment-options-grid" style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                
                {/* Cash on Delivery (ACTIVE) */}
                <div 
                  className={`payment-option-card ${paymentMethod === "COD" ? "selected" : ""}`}
                  onClick={() => setPaymentMethod("COD")}
                  style={{
                    border: paymentMethod === "COD" ? "2px solid #C8A165" : "1px solid #FAF7F2",
                    background: paymentMethod === "COD" ? "#FFFDF9" : "#FFFFFF",
                    padding: "16px",
                    borderRadius: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    cursor: "pointer"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div className="radio-circle" style={{ width: "18px", height: "18px", borderRadius: "50%", border: "2px solid #C8A165", display: "flex", alignItems: "center", justifyCenter: "center", justifyContent: "center" }}>
                      <div className="checked-dot" style={{ width: "10px", height: "10px", borderRadius: "50%", background: "#C8A165" }} />
                    </div>
                    <div>
                      <h4 style={{ margin: "0 0 4px 0", fontSize: "14.5px", fontWeight: "700" }}>Cash On Delivery (COD)</h4>
                      <p style={{ margin: 0, fontSize: "12px", color: "#6B7280" }}>₹50 COD fee added. A small handling fee applies for COD orders.</p>
                    </div>
                  </div>
                  <LuWallet style={{ fontSize: "22px", color: "#C8A165" }} />
                </div>

                {/* Option 2: Razorpay Secure (Coming Soon / Disabled) */}
                <div 
                  className="payment-option-card disabled"
                  style={{
                    border: "1px solid #FAF7F2",
                    background: "#FAFAFA",
                    padding: "16px",
                    borderRadius: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    opacity: 0.6,
                    cursor: "not-allowed"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div className="radio-circle" style={{ width: "18px", height: "18px", borderRadius: "50%", border: "2px solid #D1D5DB" }} />
                    <div>
                      <h4 style={{ margin: "0 0 4px 0", fontSize: "14.5px", fontWeight: "700", color: "#9CA3AF" }}>Online Payments (Cards / NetBanking)</h4>
                      <p style={{ margin: 0, fontSize: "12px", color: "#9CA3AF" }}>Coming Soon — Temporarily disabled for system upgrades</p>
                    </div>
                  </div>
                  <span style={{ fontSize: "10px", fontWeight: "700", background: "#E5E7EB", color: "#4B5563", padding: "4px 8px", borderRadius: "12px" }}>Coming Soon</span>
                </div>

                {/* UPI (Coming Soon / Disabled) */}
                <div 
                  className="payment-option-card disabled"
                  style={{
                    border: "1px solid #FAF7F2",
                    background: "#FAFAFA",
                    padding: "16px",
                    borderRadius: "14px",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    opacity: 0.6,
                    cursor: "not-allowed"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                    <div className="radio-circle" style={{ width: "18px", height: "18px", borderRadius: "50%", border: "2px solid #D1D5DB" }} />
                    <div>
                      <h4 style={{ margin: "0 0 4px 0", fontSize: "14.5px", fontWeight: "700", color: "#9CA3AF" }}>UPI (GooglePay, PhonePe, Paytm)</h4>
                      <p style={{ margin: 0, fontSize: "12px", color: "#9CA3AF" }}>Coming Soon — Temporarily disabled for system upgrades</p>
                    </div>
                  </div>
                  <span style={{ fontSize: "10px", fontWeight: "700", background: "#E5E7EB", color: "#4B5563", padding: "4px 8px", borderRadius: "12px" }}>Coming Soon</span>
                </div>

              </div>
            </div>

            {/* Email OTP Verification Section (COD Only) */}
            {paymentMethod === "COD" && (
              <div className="checkout-section-block email-otp-verification-card">
                <div className="section-header-row">
                  <h2>Email Verification</h2>
                  <LuShieldCheck className="section-header-icon" />
                </div>
                <p className="section-desc-subtext font-outfit">
                  An email validation code is required to finalize order placement under Cash on Delivery options.
                </p>

                <div className="email-status-container">
                  <div className="email-address-badge">
                    <LuMail className="mail-icon" />
                    <span>{user?.email}</span>
                  </div>

                  {otpVerified ? (
                    <div className="otp-state-badge success-badge">
                      <LuCheck className="verified-success-icon" />
                      <span>Verified ✓</span>
                    </div>
                  ) : (
                    <div className="otp-verification-container">
                      {!otpSent ? (
                        <button 
                          type="button" 
                          onClick={sendOtp} 
                          disabled={sendingOtp}
                          className="send-otp-primary-action-btn"
                          style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                        >
                          {sendingOtp ? (
                            <>
                              <span className="spinner-border animate-spin inline-block w-4 h-4 border-2 rounded-full mr-2"></span>
                              Sending...
                            </>
                          ) : (
                            "Send OTP"
                          )}
                        </button>
                      ) : (
                        <div style={{ width: "100%" }}>
                          <span className="otp-timer-text font-outfit" style={{ display: "block", marginBottom: "8px" }}>
                            We have sent a verification code to your email.
                          </span>
                          
                          {/* 6 individual OTP digit boxes */}
                          <div className="otp-boxes-wrapper">
                            {otpValues.map((val, idx) => (
                              <input
                                key={idx}
                                id={`otp-input-${idx}`}
                                type="text"
                                inputMode="numeric"
                                pattern="[0-9]*"
                                maxLength="1"
                                value={val}
                                onChange={(e) => handleOtpChange(idx, e.target.value)}
                                onKeyDown={(e) => handleOtpKeyDown(idx, e)}
                                onPaste={handleOtpPaste}
                                className={`otp-digit-box ${otpErrorMsg ? "error-state" : ""} ${otpVerified ? "success-state" : ""}`}
                                disabled={verifyingOtp}
                                autoComplete="one-time-code"
                              />
                            ))}
                          </div>

                          {otpErrorMsg && (
                            <div className="otp-state-badge error-badge" style={{ marginBottom: "12px" }}>
                              <span>{otpErrorMsg}</span>
                            </div>
                          )}

                          <div className="otp-row-controls">
                            <button 
                              type="button" 
                              onClick={verifyEmailOtp}
                              disabled={verifyingOtp || otpValues.some(v => v === "")}
                              className="verify-otp-action-submit-btn"
                              style={{ display: "flex", alignItems: "center", gap: "6px" }}
                            >
                              {verifyingOtp ? "Verifying..." : "Verify OTP"}
                            </button>

                            {resendTimer > 0 ? (
                              <span className="otp-timer-text font-outfit" style={{ fontSize: "12.5px" }}>
                                Resend OTP in <span className="otp-timer-highlight">{resendTimer}s</span>
                              </span>
                            ) : (
                              <button
                                type="button"
                                onClick={sendOtp}
                                disabled={resendCount >= 5 || sendingOtp}
                                className="otp-resend-link-btn font-outfit"
                              >
                                {resendCount >= 5 ? "Resend Limit Reached" : "Resend OTP"}
                              </button>
                            )}
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

          </div>

          {/* RIGHT COLUMN: Sticky Order summary & Coupon Apply */}
          <div className="checkout-right-column">
            <div className="sticky-order-summary-card">
              
              <div className="summary-title-header">
                <h3>Order Summary</h3>
                <span className="items-count-badge">{cartItems.length} {cartItems.length === 1 ? "Item" : "Items"}</span>
              </div>

              {/* Cart Items stack thumbnails */}
              <div className="summary-cart-items-list">
                {cartItems.map((item, index) => (
                  <div className="summary-item-row" key={item.productId || item._id || index}>
                    <img 
                      src={item.imageUrl || item.image || item.productImage || "/cosmetic_1.avif"} 
                      alt={item.productName || item.name} 
                      className="summary-item-thumb" 
                      loading="lazy"
                      onError={(e) => {
                        e.target.src = "/cosmetic_1.avif";
                      }}
                    />
                    <div className="summary-item-details">
                      <h4>{item.productName || item.name}</h4>
                      <div className="item-qty-and-price-col">
                        <span>Qty: {item.qty}</span>
                        <strong>₹{item.price.toFixed(2)}</strong>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {cartItems.some(i => i.isGift) && (
                <div style={{ marginTop: "14px", padding: "14px", background: "#F8F5EF", border: "1px solid #EFE8DF", borderRadius: "10px", textAlign: "left" }}>
                  <span style={{ fontSize: "11px", fontWeight: "700", color: "#C8A165", textTransform: "uppercase", letterSpacing: "1px", display: "block", marginBottom: "8px" }}>
                    🎁 Luxury Gifting Customization
                  </span>
                  <div style={{ display: "flex", flexDirection: "column", gap: "6px", fontSize: "12.5px", color: "#6B7280" }}>
                    {cartItems.some(i => i.giftWrap) && <div>• Gift Wrap Selected</div>}
                    {cartItems.some(i => i.giftBox) && <div>• Luxury Gift Box Selected</div>}
                    {cartItems.some(i => i.giftReceipt) && <div>• Gift Receipt (Prices Hidden in Parcel)</div>}
                    {cartItems.find(i => i.giftMessage)?.giftMessage && (
                      <div style={{ marginTop: "4px", paddingLeft: "8px", borderLeft: "2px solid #C8A165", fontStyle: "italic", color: "#1A1A1A" }}>
                        "{cartItems.find(i => i.giftMessage).giftMessage}"
                      </div>
                    )}
                  </div>
                </div>
              )}

               {/* USE VENUS COINS SECTION */}
               {walletCoinsBalance > 0 && (
                 <div style={{ background: "#FFFFFF", border: "1px solid rgba(0,0,0,0.05)", borderRadius: "12px", padding: "14px", marginBottom: "14px", textAlign: "left" }}>
                   <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "10px" }}>
                     <label style={{ fontSize: "13.5px", fontWeight: "700", color: "#1A1A1A", display: "flex", alignItems: "center", gap: "6px" }}>
                       ⭐ Use VENUS Coins
                     </label>
                     <span style={{ fontSize: "12px", color: "#C8A165", fontWeight: "600" }}>
                       Bal: {walletCoinsBalance} Coins (₹{walletCoinsBalance})
                     </span>
                   </div>

                   <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "12px" }}>
                     <input 
                       type="checkbox"
                       id="checkbox-use-coins"
                       checked={useCoins}
                       onChange={(e) => setUseCoins(e.target.checked)}
                       style={{ width: "16px", height: "16px", accentColor: "#C8A165", cursor: "pointer" }}
                     />
                     <label htmlFor="checkbox-use-coins" style={{ fontSize: "13px", color: "#4B5563", cursor: "pointer", fontWeight: "500" }}>
                       Redeem Coins on this purchase
                     </label>
                   </div>

                   {useCoins && (
                     <div>
                       <span style={{ fontSize: "12px", color: "#16A34A", fontWeight: "600", display: "block", marginBottom: "8px" }}>
                         Applying ₹{actualCoinsUsed} discount from wallet
                       </span>
                     </div>
                   )}
                 </div>
               )}

               <hr className="summary-divider-line" />

              {/* Coupon code apply inputs */}
              <motion.div 
                className={`summary-coupon-box ${couponShake ? "coupon-shake-active" : ""}`}
                animate={{
                  scale: couponFocused ? 1.02 : 1.00,
                  boxShadow: couponFocused ? "0 8px 24px rgba(200, 161, 101, 0.08)" : "0 0 0 rgba(0,0,0,0)",
                  borderColor: couponErrorMsgState ? "#DC2626" : (couponFocused ? "#C8A165" : "rgba(0,0,0,0.05)")
                }}
                transition={{ duration: 0.2, ease: "easeOut" }}
                style={{
                  borderRadius: "12px",
                  border: "1px solid",
                  padding: "10px",
                  transformOrigin: "center"
                }}
              >
                <label><LuTicket className="coupon-label-icon" /> Have a Coupon?</label>
                <div className="coupon-input-and-button-row">
                  <input 
                    type="text" 
                    placeholder="ENTER COUPON CODE" 
                    value={couponCode}
                    onChange={(e) => {
                      setCouponCode(e.target.value.toUpperCase());
                      setCouponErrorMsgState("");
                    }}
                    onFocus={() => setCouponFocused(true)}
                    onBlur={() => setCouponFocused(false)}
                    disabled={couponApplied || applyingCoupon}
                  />
                  {couponApplied ? (
                    <motion.button 
                      type="button" 
                      onClick={removeCoupon}
                      className="coupon-remove-btn"
                      style={{ background: "#DC2626", color: "#FFFFFF" }}
                      whileTap={{ scale: 0.96 }}
                    >
                      Remove
                    </motion.button>
                  ) : (
                    <motion.button 
                      type="button" 
                      onClick={applyCoupon}
                      disabled={applyingCoupon || !couponCode.trim()}
                      style={{ display: "flex", alignItems: "center", justifyContent: "center" }}
                      whileTap={{ scale: 0.96 }}
                    >
                      {applyingCoupon ? (
                        <span className="spinner-border animate-spin inline-block w-4 h-4 border-2 border-t-transparent border-white rounded-full"></span>
                      ) : (
                        "Apply"
                      )}
                    </motion.button>
                  )}
                </div>
                {couponErrorMsgState && (
                  <motion.div 
                    initial={{ opacity: 0, y: -4 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="coupon-error-notice-message"
                    style={{ fontSize: "11px", color: "#DC2626", marginTop: "6px", fontWeight: "600" }}
                  >
                    ⚠️ {couponErrorMsgState}
                  </motion.div>
                )}
                {couponApplied && appliedCouponDetails && (
                  <motion.div 
                    initial={{ opacity: 0, y: -6 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="applied-coupon-success-pill" 
                    style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "10px" }}
                  >
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <LuCheck className="success-icon" style={{ color: "#16A34A" }} />
                      <span style={{ fontWeight: "600", color: "#16A34A" }}>
                        Applied: {appliedCouponDetails.code} (₹{discountAmount.toFixed(2)} off)
                      </span>
                    </div>
                  </motion.div>
                )}
              </motion.div>

              <hr className="summary-divider-line" />

              {/* Math breakdown lines */}
              <div className="summary-breakdown-details-stack">
                <div className="breakdown-item-line">
                  <span>Subtotal</span>
                  <span>₹{totalPrice.toFixed(2)}</span>
                </div>
                
                <div className="breakdown-item-line">
                  <span>Shipping charges</span>
                  <span className="free-shipping-tag">FREE</span>
                </div>

                {couponApplied && (
                  <div className="breakdown-item-line discount-amount-row">
                    <span>
                      Coupon Discount {appliedCouponDetails?.discountType === "percentage" ? `(${discount}%)` : ""}
                    </span>
                    <span>-₹{discountAmount.toFixed(2)}</span>
                  </div>
                )}

                {useCoins && actualCoinsUsed > 0 && (
                  <div className="breakdown-item-line discount-amount-row" style={{ color: "#C8A165" }}>
                    <span>VENUS Coins Used</span>
                    <span>-₹{actualCoinsUsed.toFixed(2)}</span>
                  </div>
                )}

                 {paymentMethod === "COD" && (
                   <div className="breakdown-item-line" style={{ color: "#D97706" }}>
                     <span>COD Handling Fee</span>
                     <span>₹50.00</span>
                   </div>
                 )}

                 <div className="breakdown-item-line gst-tax-line">
                   <span>GST / Taxes</span>
                   <span>Included</span>
                 </div>

                <hr className="summary-divider-line" />

                <div className="breakdown-item-line grand-total-amount-row">
                  <span>Grand Total</span>
                  <strong>₹{finalTotal.toFixed(2)}</strong>
                </div>
              </div>

              {/* Secure checkout footer place order button */}
              <button 
                type="submit"
                className="summary-checkout-place-order-action-submit-btn"
                disabled={isPlacingOrder || (paymentMethod === "COD" && !otpVerified)}
              >
                {isPlacingOrder ? (
                  <>
                    <span className="btn-loading-spinner-circle"></span>
                    Processing Securely...
                  </>
                ) : paymentMethod === "COD" ? (
                  "Place Order (COD)"
                ) : (
                  "Secure Payment & Checkout"
                )}
              </button>

              <div className="checkout-trust-badges-row">
                <LuShieldCheck className="trust-icon" />
                <span>100% Safe Payments • Authentic Skincare Ingredients Only</span>
              </div>

            </div>
          </div>

        </form>
      </div>
    </div>
  );
};

export default Checkout;
