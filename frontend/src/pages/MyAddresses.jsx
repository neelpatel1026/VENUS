import React, { useEffect, useState, useContext } from "react";
import axios from "axios";
import AddressCard from "../components/AddressCard";
import { useGoogleMaps } from "../components/GoogleMapLoader";
import "../styles/myAddresses.css";
import { AuthContext } from "../context/AuthContext";
import toast from "react-hot-toast";
import { 
  FaSearch, 
  FaLocationArrow, 
  FaHome, 
  FaBriefcase, 
  FaBuilding, 
  FaHotel, 
  FaMapMarkerAlt
} from "react-icons/fa";

const MyAddresses = () => {
  const { user } = useContext(AuthContext);
  const { isLoaded, isMock, mockPlaces, reverseGeocodeMock } = useGoogleMaps();

  const [addresses, setAddresses] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [detectingLocation, setDetectingLocation] = useState(false);
  const [editingId, setEditingId] = useState(null);
  
  // Search parameters for autocomplete
  const [searchQuery, setSearchQuery] = useState("");
  const [suggestions, setSuggestions] = useState([]);

  // Geocoded data tracker for verification checks
  const [geocodedData, setGeocodedData] = useState({
    city: "",
    state: "",
    pincode: ""
  });

  // Simplified form inputs
  const [formData, setFormData] = useState({
    fullName: "",
    phone: "",
    houseNumber: "",
    buildingName: "",
    areaStreet: "",
    landmark: "",
    city: "",
    state: "",
    pincode: "",
    country: "India",
    label: "Home",
    isDefault: false,
    // Hidden coordinates
    placeId: "",
    lat: 23.0496,
    lng: 72.6734,
  });

  const fetchAddresses = async () => {
    if (!user?.token) return;
    try {
      setLoading(true);
      const res = await axios.get("/api/address", {
        headers: {
          Authorization: `Bearer ${user.token}`,
        },
      });
      setAddresses(res.data.addresses || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to load saved addresses");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      fetchAddresses();
    }
  }, [user]);

  // Autocomplete Suggestions for Fallback Mode
  useEffect(() => {
    if (!isMock || !searchQuery) {
      setSuggestions([]);
      return;
    }
    const q = searchQuery.toLowerCase();
    const filtered = mockPlaces.filter(p => p.description.toLowerCase().includes(q));
    setSuggestions(filtered);
  }, [searchQuery, isMock]);

  // Auto-fill Google Places Suggestion (Mock Mode)
  const handleSelectMockSuggestion = (suggestion) => {
    const details = suggestion.details;
    setFormData(prev => ({
      ...prev,
      houseNumber: "", // Intentionally empty - user must type their specific flat details
      buildingName: "", // Intentionally empty - user must type their building name
      landmark: "",     // Intentionally empty
      areaStreet: `${details.street || ''} ${details.area || ''}`.trim(),
      city: details.city || "",
      state: details.state || "",
      pincode: details.pincode || "",
      country: details.country || "India",
      placeId: suggestion.placeId,
      lat: details.lat,
      lng: details.lng,
    }));

    setGeocodedData({
      city: details.city || "",
      state: details.state || "",
      pincode: details.pincode || ""
    });

    setSearchQuery("");
    setSuggestions([]);
    toast.success("Verified location elements populated! ⚡");
  };

  // Google Places Autocomplete Focus (Live Mode)
  const handleLiveAutocompleteFocus = () => {
    if (isMock || !window.google) return;
    const inputEl = document.getElementById("google-places-search-input");
    if (!inputEl) return;

    const autocomplete = new window.google.maps.places.Autocomplete(inputEl, {
      types: ["address"],
      componentRestrictions: { country: "in" }
    });

    autocomplete.addListener("place_changed", () => {
      const place = autocomplete.getPlace();
      if (!place.geometry) {
        toast.error("No verified location details found for this selection");
        return;
      }

      const components = place.address_components || [];
      let country = "India", state = "", city = "", area = "", sublocality = "", street = "", pin = "";

      components.forEach(comp => {
        const types = comp.types;
        if (types.includes("country")) {
          country = comp.long_name;
        } else if (types.includes("administrative_area_level_1")) {
          state = comp.long_name;
        } else if (types.includes("locality")) {
          city = comp.long_name;
        } else if (types.includes("administrative_area_level_2") && !city) {
          city = comp.long_name;
        } else if (types.includes("sublocality_level_1")) {
          area = comp.long_name;
        } else if (types.includes("sublocality_level_2")) {
          sublocality = comp.long_name;
        } else if (types.includes("route")) {
          street = comp.long_name;
        } else if (types.includes("postal_code")) {
          pin = comp.long_name;
        }
      });

      const combinedArea = [street, sublocality, area].filter(Boolean).join(", ").trim();

      setFormData(prev => ({
        ...prev,
        city: city || prev.city,
        state: state || prev.state,
        pincode: pin || prev.pincode,
        country: country || prev.country,
        areaStreet: combinedArea || prev.areaStreet,
        placeId: place.place_id || "",
        lat: place.geometry.location.lat(),
        lng: place.geometry.location.lng(),
        // Intentionally left blank for customer input
        houseNumber: "",
        buildingName: "",
        landmark: ""
      }));

      setGeocodedData({
        city: city || "",
        state: state || "",
        pincode: pin || ""
      });

      toast.success("Verified location elements populated! ⚡");
    });
  };

  // Current Location Geolocation
  const handleUseCurrentLocation = () => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by your browser");
      return;
    }

    setDetectingLocation(true);
    const toastId = toast.loading("Requesting browser GPS permission...");

    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const lat = position.coords.latitude;
        const lng = position.coords.longitude;

        toast.loading("Fetching verified coordinates from Google...", { id: toastId });

        if (isMock) {
          setTimeout(() => {
            const details = reverseGeocodeMock(lat, lng);
            
            setFormData(prev => ({
              ...prev,
              city: details.city || "",
              state: details.state || "",
              pincode: details.pincode || "",
              country: details.country || "India",
              areaStreet: `${details.street || ''} ${details.area || ''}`.trim(),
              placeId: "mock-current-gps",
              lat,
              lng,
              // Intentionally blank - customer must enter their flat/building/landmark details
              houseNumber: "",
              buildingName: "",
              landmark: ""
            }));

            setGeocodedData({
              city: details.city || "",
              state: details.state || "",
              pincode: details.pincode || ""
            });

            setDetectingLocation(false);
            toast.dismiss(toastId);
            toast.success("Current location geocoded successfully! 📍");
          }, 1000);
          return;
        }

        try {
          if (!window.google || !window.google.maps) {
            throw new Error("Google Maps script not loaded yet");
          }

          const geocoder = new window.google.maps.Geocoder();
          geocoder.geocode({ location: { lat, lng } }, (results, status) => {
            if (status === "OK" && results[0]) {
              const place = results[0];
              const components = place.address_components || [];
              
              let country = "India", state = "", city = "", area = "", sublocality = "", street = "", pin = "";

              components.forEach(comp => {
                const types = comp.types;
                if (types.includes("country")) {
                  country = comp.long_name;
                } else if (types.includes("administrative_area_level_1")) {
                  state = comp.long_name;
                } else if (types.includes("locality")) {
                  city = comp.long_name;
                } else if (types.includes("administrative_area_level_2") && !city) {
                  city = comp.long_name;
                } else if (types.includes("sublocality_level_1")) {
                  area = comp.long_name;
                } else if (types.includes("sublocality_level_2")) {
                  sublocality = comp.long_name;
                } else if (types.includes("route")) {
                  street = comp.long_name;
                } else if (types.includes("postal_code")) {
                  pin = comp.long_name;
                }
              });

              const combinedArea = [street, sublocality, area].filter(Boolean).join(", ").trim();

              setFormData(prev => ({
                ...prev,
                city: city || prev.city,
                state: state || prev.state,
                pincode: pin || prev.pincode,
                country: country || prev.country,
                areaStreet: combinedArea || prev.areaStreet,
                placeId: place.place_id,
                lat,
                lng,
                // Intentionally left blank for customer input
                houseNumber: "",
                buildingName: "",
                landmark: ""
              }));

              setGeocodedData({
                city: city || "",
                state: state || "",
                pincode: pin || ""
              });

              toast.dismiss(toastId);
              toast.success("Current location geocoded successfully! 📍");
            } else if (status === "OVER_QUERY_LIMIT") {
              toast.dismiss(toastId);
              toast.error("Google quota exceeded. Please type address manually.");
            } else {
              toast.dismiss(toastId);
              toast.error(`Reverse geocoding failed: ${status}`);
            }
          });
        } catch (err) {
          console.error(err);
          toast.dismiss(toastId);
          toast.error("Google reverse geocoding API error. Please try again.");
        } finally {
          setDetectingLocation(false);
        }
      },
      (error) => {
        console.error("Browser Geolocation Error:", error);
        setDetectingLocation(false);
        toast.dismiss(toastId);
        
        switch (error.code) {
          case error.PERMISSION_DENIED:
            toast.error("Permission denied. Please allow browser location access in settings.");
            break;
          case error.POSITION_UNAVAILABLE:
            toast.error("Position unavailable. Ensure you have network connectivity.");
            break;
          case error.TIMEOUT:
            toast.error("GPS detection request timed out. Please try again.");
            break;
          default:
            toast.error("Failed to detect location. Please type manually.");
        }
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  // Submit address Details
  const handleSubmitAddress = async (e) => {
    e.preventDefault();
    if (submitting) return;

    // Validate fields
    if (!formData.fullName || !formData.phone || !formData.houseNumber || !formData.areaStreet || !formData.city || !formData.state || !formData.pincode) {
      toast.error("Please fill all required address inputs!");
      return;
    }

    // Validate Indian mobile number (10 digits starting with 6-9)
    const phoneClean = formData.phone.replace(/[\s-+()]/g, "");
    if (!/^[6-9]\d{9}$/.test(phoneClean)) {
      toast.error("Please enter a valid 10-digit Indian mobile number");
      return;
    }

    // Validate Indian Pincode
    if (!/^\d{6}$/.test(formData.pincode.trim())) {
      toast.error("Please enter a valid 6-digit Pincode");
      return;
    }

    // Prevents duplicate addresses checking matching names, pincode, flat and street
    const isDuplicate = addresses.some(addr => {
      if (editingId && addr._id === editingId) return false;
      const cleanFlat1 = `${formData.houseNumber}, ${formData.buildingName}`.trim().toLowerCase();
      const cleanFlat2 = addr.addressLine1.toLowerCase();
      const cleanStreet1 = `${formData.areaStreet}${formData.landmark ? ', ' + formData.landmark : ''}`.trim().toLowerCase();
      const cleanStreet2 = (addr.addressLine2 || "").toLowerCase();
      
      return cleanFlat1 === cleanFlat2 && 
             cleanStreet1 === cleanStreet2 && 
             addr.pincode.trim() === formData.pincode.trim() &&
             addr.fullName.trim().toLowerCase() === formData.fullName.trim().toLowerCase();
    });

    if (isDuplicate) {
      toast.error("This address has already been saved to your profile.");
      return;
    }

    try {
      setSubmitting(true);
      
      // Concatenate fields back to maintain database schema integrity
      const addressLine1 = `${formData.houseNumber}${formData.buildingName ? ', ' + formData.buildingName : ''}`.trim();
      const addressLine2 = `${formData.areaStreet}${formData.landmark ? ', ' + formData.landmark : ''}`.trim();

      const payload = {
        fullName: formData.fullName,
        phone: phoneClean,
        addressLine1,
        addressLine2,
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode.trim(),
        country: formData.country,
        label: formData.label,
        isDefault: formData.isDefault,
        placeId: formData.placeId,
        lat: formData.lat,
        lng: formData.lng
      };

      let res;
      if (editingId) {
        res = await axios.put(`/api/address/${editingId}`, payload, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        toast.success("Shipping address updated!");
      } else {
        res = await axios.post("/api/address/add", payload, {
          headers: { Authorization: `Bearer ${user.token}` }
        });
        toast.success("New address configured successfully!");
      }

      setAddresses(res.data.addresses || []);
      resetForm();
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to process address details");
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditInit = (addr) => {
    setEditingId(addr._id);
    
    // Splitting concatenated addressLines back to inputs
    const parts1 = addr.addressLine1.split(", ");
    const houseNo = parts1[0] || "";
    const bldName = parts1.slice(1).join(", ") || "";
    
    const parts2 = (addr.addressLine2 || "").split(", ");
    const street = parts2[0] || "";
    const landm = parts2.slice(1).join(", ") || "";

    setFormData({
      fullName: addr.fullName,
      phone: addr.phone,
      houseNumber: houseNo,
      buildingName: bldName,
      areaStreet: street,
      landmark: landm,
      city: addr.city,
      state: addr.state,
      pincode: addr.pincode,
      country: addr.country || "India",
      label: addr.label || "Home",
      isDefault: !!addr.isDefault,
      placeId: addr.placeId || "",
      lat: addr.lat || 23.0496,
      lng: addr.lng || 72.6734
    });

    setGeocodedData({
      city: addr.city || "",
      state: addr.state || "",
      pincode: addr.pincode || ""
    });
    
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  const handleDelete = async (id) => {
    try {
      const res = await axios.delete(`/api/address/${id}`, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.success("Address removed successfully!");
      setAddresses(res.data.addresses || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete address");
    }
  };

  const handleSetDefaultAddress = async (id) => {
    try {
      const res = await axios.put(`/api/address/${id}`, { isDefault: true }, {
        headers: { Authorization: `Bearer ${user.token}` }
      });
      toast.success("Default address updated!");
      setAddresses(res.data.addresses || []);
    } catch (error) {
      console.error(error);
      toast.error("Failed to update default address selection");
    }
  };

  const resetForm = () => {
    setEditingId(null);
    setFormData({
      fullName: "",
      phone: "",
      houseNumber: "",
      buildingName: "",
      areaStreet: "",
      landmark: "",
      city: "",
      state: "",
      pincode: "",
      country: "India",
      label: "Home",
      isDefault: false,
      placeId: "",
      lat: 23.0496,
      lng: 72.6734
    });
    setGeocodedData({
      city: "",
      state: "",
      pincode: ""
    });
    setSearchQuery("");
  };

  // Verify city, state, and pincode matches last geocoded response
  const isLocationMismatch = () => {
    if (!geocodedData.city || !geocodedData.state || !geocodedData.pincode) return false;
    
    const cityMatch = formData.city.trim().toLowerCase() === geocodedData.city.toLowerCase();
    const stateMatch = formData.state.trim().toLowerCase() === geocodedData.state.toLowerCase();
    const pinMatch = formData.pincode.trim() === geocodedData.pincode;

    return !cityMatch || !stateMatch || !pinMatch;
  };

  // Pincode Delivery Availability check
  const isPincodeValid = /^\d{6}$/.test(formData.pincode.trim());

  return (
    <div className="addresses-page route-fade-in font-outfit">
      <h2 className="page-main-title font-serif">My Saved Addresses</h2>

      <div className="addresses-split-layout-luxury">
        
        {/* Left Column: Form Details */}
        <div className="address-creation-form-box">
          <h3 className="section-subtitle-luxury font-serif">
            {editingId ? "Modify Shipping Destination" : "Add New Delivery Destination"}
          </h3>

          <form onSubmit={handleSubmitAddress} className="address-luxury-form">
            
            {/* GOOGLE PLACES SEARCH BOX */}
            <div className="form-input-block relative">
              <label>Search Address (Google Places Autocomplete)</label>
              <div className="luxury-search-input-field">
                <FaSearch className="field-icon" />
                {isMock ? (
                  <input
                    type="text"
                    placeholder="Search address (e.g. Nikol, CP, BKC)..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                  />
                ) : (
                  <input
                    id="google-places-search-input"
                    type="text"
                    placeholder="Search location globally..."
                    onFocus={handleLiveAutocompleteFocus}
                  />
                )}
              </div>

              {/* Mock suggestions */}
              {isMock && suggestions.length > 0 && (
                <div className="autocomplete-suggestions-list-luxury">
                  {suggestions.map((s) => (
                    <div 
                      key={s.placeId} 
                      className="suggestion-item-luxury"
                      onClick={() => handleSelectMockSuggestion(s)}
                    >
                      <FaMapMarkerAlt className="marker-icon" />
                      <span>{s.description}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* GPS LOCATION TRIGGER */}
            <button 
              type="button" 
              className="gps-locator-btn"
              onClick={handleUseCurrentLocation}
              disabled={detectingLocation}
              style={{ display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", gap: "8px" }}
            >
              {detectingLocation ? (
                <>
                  <span className="spinner-gps" />
                  <span>Finding your current location...</span>
                </>
              ) : (
                <>
                  <FaLocationArrow />
                  <span>Use Current Location via GPS</span>
                </>
              )}
            </button>

            {/* Address confidence indicator */}
            {(formData.lat && formData.lng) ? (
              <div className="location-confidence-badge-luxury" style={{ marginTop: "5px", marginBottom: "5px" }}>
                {!isLocationMismatch() ? (
                  <span style={{ color: "#16A34A", fontWeight: "600", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ display: "inline-block", width: "8px", height: "8px", background: "#16A34A", borderRadius: "50%" }} />
                    ✓ Location Verified
                  </span>
                ) : (
                  <span style={{ color: "#D97706", fontWeight: "600", fontSize: "12px", display: "inline-flex", alignItems: "center", gap: "5px" }}>
                    <span style={{ display: "inline-block", width: "8px", height: "8px", background: "#D97706", borderRadius: "50%" }} />
                    Location partially detected
                  </span>
                )}
              </div>
            ) : null}

            {/* SIMPLIFIED FORM INPUT FIELDS */}
            <div className="form-inputs-grid-luxury">
              <div className="form-input-block">
                <label>Receiver Full Name*</label>
                <input
                  type="text"
                  placeholder="e.g. Neel Patel"
                  value={formData.fullName}
                  onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                  required
                />
              </div>

              <div className="form-input-block">
                <label>Mobile Number*</label>
                <input
                  type="tel"
                  placeholder="10-digit mobile number"
                  value={formData.phone}
                  onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                  required
                />
              </div>

              <div className="form-input-block">
                <label>Flat / House No.*</label>
                <input
                  type="text"
                  placeholder="e.g. Flat 301, 3rd Floor"
                  value={formData.houseNumber}
                  onChange={(e) => setFormData({ ...formData, houseNumber: e.target.value })}
                  required
                />
                {!formData.houseNumber && (
                  <span className="luxury-form-helper" style={{ fontSize: "11px", color: "#C8A165", marginTop: "4px", display: "block" }}>
                    Please enter your Flat / House Number.
                  </span>
                )}
              </div>

              <div className="form-input-block">
                <label>Building Name*</label>
                <input
                  type="text"
                  placeholder="e.g. Venus Heights"
                  value={formData.buildingName}
                  onChange={(e) => setFormData({ ...formData, buildingName: e.target.value })}
                  required
                />
                {!formData.buildingName && (
                  <span className="luxury-form-helper" style={{ fontSize: "11px", color: "#8C8C8C", marginTop: "4px", display: "block" }}>
                    Building name helps our delivery partner locate you faster.
                  </span>
                )}
              </div>

              <div className="form-input-block">
                <label>Area / Street*</label>
                <input
                  type="text"
                  placeholder="e.g. Nikol Ring Road"
                  value={formData.areaStreet}
                  onChange={(e) => setFormData({ ...formData, areaStreet: e.target.value })}
                  required
                />
              </div>

              <div className="form-input-block">
                <label>Landmark (Optional)</label>
                <input
                  type="text"
                  placeholder="e.g. Behind Galaxy Mall"
                  value={formData.landmark}
                  onChange={(e) => setFormData({ ...formData, landmark: e.target.value })}
                />
                {!formData.landmark && (
                  <span className="luxury-form-helper" style={{ fontSize: "11px", color: "#8C8C8C", marginTop: "4px", display: "block" }}>
                    Add a nearby landmark (optional).
                  </span>
                )}
              </div>

              <div className="form-input-block">
                <label>City / Town*</label>
                <input
                  type="text"
                  placeholder="e.g. Ahmedabad"
                  value={formData.city}
                  onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                  required
                />
              </div>

              <div className="form-input-block">
                <label>State*</label>
                <input
                  type="text"
                  placeholder="e.g. Gujarat"
                  value={formData.state}
                  onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                  required
                />
              </div>

              <div className="form-input-block">
                <label>Pincode / ZIP*</label>
                <input
                  type="text"
                  placeholder="6-digit ZIP code"
                  value={formData.pincode}
                  onChange={(e) => setFormData({ ...formData, pincode: e.target.value })}
                  required
                />
                
                {/* Pincode Availability check indicator */}
                {formData.pincode && (
                  <div className="pincode-availability-badge">
                    {isPincodeValid ? (
                      <span className="avail-green">✓ Delivery Available</span>
                    ) : (
                      <span className="avail-red">✗ Pincode must be 6 digits</span>
                    )}
                  </div>
                )}
              </div>

              <div className="form-input-block">
                <label>Country</label>
                <input
                  type="text"
                  value={formData.country}
                  readOnly
                  style={{ background: "#FAF9F6", color: "#9CA3AF", cursor: "not-allowed" }}
                />
              </div>
            </div>

            {/* ADDRESS TYPE CHIPS */}
            <div className="address-type-selection-block">
              <label>Address Type Category</label>
              <div className="chips-list-selection">
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
                    onClick={() => setFormData({ ...formData, label: chip.value })}
                    className={`type-chip-btn ${formData.label === chip.value ? "active" : ""}`}
                  >
                    {chip.icon} {chip.value}
                  </button>
                ))}
              </div>
            </div>

            {/* DEFAULT TOGGLE */}
            <div className="default-address-toggle-row">
              <label className="checkbox-label-luxury">
                <input
                  type="checkbox"
                  checked={formData.isDefault}
                  onChange={(e) => setFormData({ ...formData, isDefault: e.target.checked })}
                />
                <span>Set as default delivery address</span>
              </label>
            </div>

            {/* ACTIONS */}
            <div className="form-submit-buttons-row">
              <button 
                type="submit" 
                className="btn-luxury-submit-gold"
                disabled={submitting}
              >
                {submitting ? "Processing..." : editingId ? "Update Address" : "Save Address"}
              </button>
              
              {editingId && (
                <button 
                  type="button" 
                  onClick={resetForm} 
                  className="btn-luxury-cancel"
                >
                  Cancel
                </button>
              )}
            </div>
          </form>
        </div>

        {/* Right Column: Saved Addresses */}
        <div className="saved-addresses-grid-panel-right">
          <h3 className="section-subtitle-luxury font-serif">Saved Destinations ({addresses.length})</h3>

          {loading ? (
            <div className="address-list-stack-shimmer">
              {[1, 2].map((i) => (
                <div key={i} className="address-card-luxury skeleton shimmer" style={{ height: "180px", marginBottom: "20px" }} />
              ))}
            </div>
          ) : addresses.length === 0 ? (
            <div className="empty-addresses-state-luxury">
              <span className="empty-icon">📍</span>
              <h4>No Saved Addresses</h4>
              <p>Add a shipping destination to enjoy one-click checkout.</p>
            </div>
          ) : (
            <div className="address-list-stack-vertical">
              {addresses.map((addr) => (
                <AddressCard
                  key={addr._id}
                  address={addr}
                  onEdit={handleEditInit}
                  onDelete={handleDelete}
                  onSetDefault={handleSetDefaultAddress}
                />
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default MyAddresses;
