/**
 * Google Analytics 4 (GA4) Integration Helper
 * Initializes gtag script tags and logs navigation parameters.
 */

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;
const isProd = import.meta.env.PROD;

export const initGA = () => {
  if (!isProd || !GA_ID) {
    return;
  }

  // Load gtag script tag dynamically
  const script = document.createElement("script");
  script.async = true;
  script.src = `https://www.googletagmanager.com/gtag/js?id=${GA_ID}`;
  document.head.appendChild(script);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function () {
    window.dataLayer.push(arguments);
  };
  
  window.gtag("js", new Date());
  window.gtag("config", GA_ID, {
    send_page_view: false // Prevent duplicate page views on load
  });
};

export const trackPageView = (path) => {
  if (!isProd || !GA_ID || !window.gtag) {
    return;
  }
  
  window.gtag("event", "page_view", {
    page_path: path,
    page_title: document.title,
    send_to: GA_ID
  });
};
