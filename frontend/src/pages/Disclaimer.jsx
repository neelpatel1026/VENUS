// import React from 'react';

// const textualStyle = {
//   maxWidth: '900px',
//   margin: '0 auto',
//   padding: '40px',
//   background: '#18181b',
//   borderRadius: '16px',
//   border: '1px solid rgba(255, 255, 255, 0.05)',
//   lineHeight: '1.8',
//   color: '#a1a1aa'
// };

// const Disclaimer = () => {
//   return (
//     <div style={textualStyle}>
//       <h2 style={{ color: '#fff', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '15px' }}>
//         Legal & Site Disclaimer
//       </h2>
      
//       <p style={{ marginBottom: '20px' }}>
//         The data, interfaces, and graphical components represented across the ShopNest domain strictly act uniquely as an educational development platform. This codebase models rigorous application structures and architectures for purely demonstrative, portfolio-oriented engineering usage.
//       </p>

//       <h4 style={{ color: '#f97316', marginTop: '25px', marginBottom: '10px' }}>1. Accuracy of Materials</h4>
//       <p style={{ marginBottom: '15px' }}>
//         The materials spanning the ShopNest interface may heavily include dynamic technical, typographical, or dummy photographic elements. Product matrices mapped in the DB pipeline do absolutely not correlate to strictly real physical outputs and are safely populated via generic Unsplash imagery protocols.
//       </p>

//       <h4 style={{ color: '#f97316', marginTop: '25px', marginBottom: '10px' }}>2. Payment Processing Restrictions</h4>
//       <p style={{ marginBottom: '15px' }}>
//         No authentic financial variables are handled natively within this environment. All payment endpoints forcefully bind exclusively to external testing-based networks (Sandbox Razorpay environments). No exact deductibles exist.
//       </p>

//       <h4 style={{ color: '#f97316', marginTop: '25px', marginBottom: '10px' }}>3. External Binding Links</h4>
//       <p style={{ marginBottom: '15px' }}>
//         ShopNest operates completely independent domains and takes strictly zero absolute parameter responsibility over the specific contents or behaviors populated via external routing anchors generated implicitly by third-party configurations. 
//       </p>

//       <p style={{ marginTop: '30px', fontStyle: 'italic', fontSize: '0.9rem' }}>
//         By interacting natively within this codebase, you unconditionally signal acceptance bounded by these parameters efficiently.
//       </p>
//     </div>
//   );
// };

// export default Disclaimer;

import React from 'react';

const textualStyle = {
  maxWidth: '900px',
  margin: '0 auto',
  padding: '40px',
  background: '#18181b',
  borderRadius: '16px',
  border: '1px solid rgba(255, 255, 255, 0.05)',
  lineHeight: '1.8',
  color: '#a1a1aa'
};

const Disclaimer = () => {
  return (
    <div style={textualStyle}>
      <h2
        style={{
          color: '#fff',
          marginBottom: '20px',
          borderBottom: '1px solid rgba(255,255,255,0.1)',
          paddingBottom: '15px'
        }}
      >
        Disclaimer
      </h2>

      <p style={{ marginBottom: '20px' }}>
        Welcome to ELYSORIA. We are committed to providing high-quality,
        100% acid-free skincare products designed to support healthy and
        radiant skin. Please read the following disclaimer carefully before
        using our website or products.
      </p>

      <h4 style={{ color: '#f97316', marginTop: '25px', marginBottom: '10px' }}>
        1. Product Information
      </h4>
      <p style={{ marginBottom: '15px' }}>
        We strive to ensure that all product descriptions, images,
        ingredients, and information displayed on our website are accurate.
        However, actual product packaging and appearance may vary slightly.
      </p>

      <h4 style={{ color: '#f97316', marginTop: '25px', marginBottom: '10px' }}>
        2. Individual Results May Vary
      </h4>
      <p style={{ marginBottom: '15px' }}>
        Skincare results vary from person to person depending on skin type,
        lifestyle, and individual conditions. ELYSORIA does not guarantee
        specific results from the use of any product.
      </p>

      <h4 style={{ color: '#f97316', marginTop: '25px', marginBottom: '10px' }}>
        3. Medical Advice
      </h4>
      <p style={{ marginBottom: '15px' }}>
        The information provided on this website is for general educational
        and informational purposes only and should not be considered medical
        advice. If you have a skin condition, allergy, or medical concern,
        please consult a qualified healthcare professional before using any
        skincare product.
      </p>

      <h4 style={{ color: '#f97316', marginTop: '25px', marginBottom: '10px' }}>
        4. Allergic Reactions
      </h4>
      <p style={{ marginBottom: '15px' }}>
        Although our products are formulated with carefully selected
        ingredients, individual sensitivities may occur. We recommend
        performing a patch test before regular use of any skincare product.
      </p>

      <h4 style={{ color: '#f97316', marginTop: '25px', marginBottom: '10px' }}>
        5. External Links
      </h4>
      <p style={{ marginBottom: '15px' }}>
        Our website may contain links to third-party websites for additional
        information or services. ELYSORIA is not responsible for the content,
        privacy policies, or practices of such external websites.
      </p>

      <h4 style={{ color: '#f97316', marginTop: '25px', marginBottom: '10px' }}>
        6. Limitation of Liability
      </h4>
      <p>
        ELYSORIA shall not be held liable for any direct, indirect,
        incidental, or consequential damages resulting from the use or
        misuse of our products or website. By using our website, you agree
        to these terms and conditions.
      </p>

      <p
        style={{
          marginTop: '30px',
          fontStyle: 'italic',
          fontSize: '0.9rem'
        }}
      >
        By accessing and using the ELYSORIA website, you acknowledge that
        you have read, understood, and agreed to this disclaimer.
      </p>
    </div>
  );
};

export default Disclaimer;