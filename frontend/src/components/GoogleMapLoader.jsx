import React, { createContext, useContext, useEffect, useState } from "react";

const GoogleMapContext = createContext({
  isLoaded: false,
  isMock: true,
  apiKey: "",
  mockPlaces: [],
  reverseGeocodeMock: () => {},
});

export const useGoogleMaps = () => useContext(GoogleMapContext);

export const MOCK_PLACES = [
  {
    description: "Flat 202, Shree Hari Apartment, Nikol, Ahmedabad, Gujarat, India",
    placeId: "mock-place-1",
    details: {
      houseNumber: "Flat 202",
      buildingName: "Shree Hari Apartment",
      street: "Nikol Road",
      area: "Nikol",
      landmark: "Near Nikol Lake",
      city: "Ahmedabad",
      district: "Ahmedabad",
      state: "Gujarat",
      country: "India",
      pincode: "382350",
      lat: 23.0496,
      lng: 72.6734,
      formattedAddress: "Flat 202, Shree Hari Apartment, Nikol Road, Nikol, Ahmedabad, Gujarat 382350"
    }
  },
  {
    description: "Apple Store, Jio World Drive, Bandra Kurla Complex, Mumbai, Maharashtra, India",
    placeId: "mock-place-2",
    details: {
      houseNumber: "G-1",
      buildingName: "Jio World Drive",
      street: "Bandra Kurla Complex",
      area: "Bandra East",
      landmark: "Jio World Plaza",
      city: "Mumbai",
      district: "Mumbai Suburban",
      state: "Maharashtra",
      country: "India",
      pincode: "400051",
      lat: 19.0596,
      lng: 72.8295,
      formattedAddress: "Apple BKC, Jio World Drive, Bandra Kurla Complex, Bandra East, Mumbai, Maharashtra 400051"
    }
  },
  {
    description: "Nykaa Cosmetics Head Office, Chanakyapuri, New Delhi, Delhi, India",
    placeId: "mock-place-3",
    details: {
      houseNumber: "Building 12",
      buildingName: "Chanakya Mall",
      street: "Yashwant Place Commercial Complex",
      area: "Chanakyapuri",
      landmark: "Opposite Nehru Park",
      city: "New Delhi",
      district: "New Delhi",
      state: "Delhi",
      country: "India",
      pincode: "110021",
      lat: 28.5833,
      lng: 77.1945,
      formattedAddress: "Nykaa Cosmetics, Chanakya Mall, Yashwant Place, Chanakyapuri, New Delhi, Delhi 110021"
    }
  },
  {
    description: "DLF Cyber Hub, Phase 3, Gurugram, Haryana, India",
    placeId: "mock-place-4",
    details: {
      houseNumber: "Tower C",
      buildingName: "DLF Cyber Hub",
      street: "DLF Cyber City Road",
      area: "Phase 3",
      landmark: "Cyber City Metro Station",
      city: "Gurugram",
      district: "Gurugram",
      state: "Haryana",
      country: "India",
      pincode: "122002",
      lat: 28.4952,
      lng: 77.0892,
      formattedAddress: "DLF Cyber Hub, Tower C, DLF Cyber City Road, Gurugram, Haryana 122002"
    }
  },
  {
    description: "Inner Circle, Connaught Place, Block E, New Delhi, Delhi, India",
    placeId: "mock-place-5",
    details: {
      houseNumber: "Shop 14",
      buildingName: "Inner Circle",
      street: "Radial Road 4",
      area: "Connaught Place",
      landmark: "Near Rajiv Chowk Metro",
      city: "New Delhi",
      district: "New Delhi",
      state: "Delhi",
      country: "India",
      pincode: "110001",
      lat: 28.6304,
      lng: 77.2177,
      formattedAddress: "Shop 14, Inner Circle, Connaught Place, New Delhi, Delhi 110001"
    }
  }
];

export const reverseGeocodeMock = (lat, lng) => {
  let closest = MOCK_PLACES[0];
  let minDist = Number.MAX_VALUE;
  
  MOCK_PLACES.forEach(p => {
    const dist = Math.pow(p.details.lat - lat, 2) + Math.pow(p.details.lng - lng, 2);
    if (dist < minDist) {
      minDist = dist;
      closest = p;
    }
  });

  return closest.details;
};

export const GoogleMapLoaderProvider = ({ children }) => {
  const apiKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY || "";
  const [isLoaded, setIsLoaded] = useState(false);
  const [isMock, setIsMock] = useState(true);

  useEffect(() => {
    if (!apiKey) {
      setIsLoaded(true);
      setIsMock(true);
      return;
    }

    const scriptId = "google-maps-api-script";
    let script = document.getElementById(scriptId);

    const handleScriptLoad = () => {
      setIsLoaded(true);
      setIsMock(false);
    };

    const handleScriptError = () => {
      console.warn("Failed to load Google Maps script. Falling back to mockup mode.");
      setIsLoaded(true);
      setIsMock(true);
    };

    if (!script) {
      script = document.createElement("script");
      script.id = scriptId;
      script.src = `https://maps.googleapis.com/maps/api/js?key=${apiKey}&libraries=places`;
      script.async = true;
      script.defer = true;
      script.addEventListener("load", handleScriptLoad);
      script.addEventListener("error", handleScriptError);
      document.head.appendChild(script);
    } else {
      if (window.google && window.google.maps) {
        setIsLoaded(true);
        setIsMock(false);
      } else {
        script.addEventListener("load", handleScriptLoad);
        script.addEventListener("error", handleScriptError);
      }
    }

    return () => {
      if (script) {
        script.removeEventListener("load", handleScriptLoad);
        script.removeEventListener("error", handleScriptError);
      }
    };
  }, [apiKey]);

  return (
    <GoogleMapContext.Provider
      value={{
        isLoaded,
        isMock,
        apiKey,
        mockPlaces: MOCK_PLACES,
        reverseGeocodeMock,
      }}
    >
      {children}
    </GoogleMapContext.Provider>
  );
};
