import React from "react";
import "../styles/AppPromo.css";
import mobileApp from "../assets/mobile-app-2-photo.png";

const AppPromo = () => {
  return (
    <section className="app-promo">
      <img
        src={mobileApp}
        alt="Mobile App"
        className="promo-image"
      />
    </section>
  );
};

export default AppPromo;