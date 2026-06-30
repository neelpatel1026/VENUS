
import { GiRabbit, GiPerfumeBottle } from "react-icons/gi";

import { BsWallet2, BsGenderAmbiguous } from "react-icons/bs";

import "../styles/whyVenus.css";

const WhyVenus = () => {
  return (
    <section className="why-venus">
      <h2>WHY VENUS?</h2>

      <div className="why-grid">
        <div className="why-card">
          {/* <FaLeaf />
          <h3>Cruelty Free</h3> */}
          <GiRabbit />
          <h3>Cruelty Free</h3>
          <p>
            Kindness in every bottle. Our commitment to cruelty-free products.
          </p>
        </div>

        <div className="why-card">
          {/* <FaGem />
          <h3>Premium Quality</h3> */}
          <GiPerfumeBottle />
          <h3>Fragrance Forward</h3>
          <p>Luxury ingredients carefully selected for superior skincare.</p>
        </div>

        <div className="why-card">
          {/* <FaAward />
          <h3>Affordable Luxury</h3> */}
          <BsWallet2 />
          <h3>Affordable Luxury</h3>
          <p>Premium quality and elegance at a reasonable price.</p>
        </div>

        <div className="why-card">
          {/* <FaHeart />
          <h3>Skin Friendly</h3> */}
          <BsGenderAmbiguous />
          <h3>Gender Neutral</h3>
          <p>Safe and gentle for every skin type.</p>
        </div>
      </div>
    </section>
  );
};

export default WhyVenus;
