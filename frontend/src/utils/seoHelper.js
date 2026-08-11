/**
 * Helper utility to dynamically update SEO tags in a React Single Page Application (SPA).
 */
export const updateSEOMetadata = ({
  title,
  description,
  canonicalUrl,
  ogType = "website",
  ogImage = "https://venuscare.in/cosmetic_1.avif"
}) => {
  // Title
  document.title = title ? `${title} | VENUS CARE` : "VENUS CARE | Premium Luxury Cosmetic & Skincare";

  // Description
  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute("content", description || "Premium luxury cosmetic & skincare brand, formulated with science and purity for natural radiance.");
  }

  // Canonical
  let canonicalLink = document.querySelector('link[rel="canonical"]');
  const finalCanonical = canonicalUrl || window.location.href;
  if (!canonicalLink) {
    canonicalLink = document.createElement("link");
    canonicalLink.setAttribute("rel", "canonical");
    document.head.appendChild(canonicalLink);
  }
  canonicalLink.setAttribute("href", finalCanonical);

  // Open Graph Tags
  const ogTags = {
    "og:title": title || "VENUS CARE | Premium Luxury Cosmetic & Skincare",
    "og:description": description || "Premium luxury cosmetic & skincare brand, formulated with science and purity for natural radiance.",
    "og:url": finalCanonical,
    "og:type": ogType,
    "og:image": ogImage,
    "og:site_name": "VENUS CARE"
  };

  Object.entries(ogTags).forEach(([property, content]) => {
    let tag = document.querySelector(`meta[property="${property}"]`);
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute("property", property);
      document.head.appendChild(tag);
    }
    tag.setAttribute("content", content);
  });

  // Twitter Card Tags
  const twitterTags = {
    "twitter:card": "summary_large_image",
    "twitter:title": title || "VENUS CARE | Premium Luxury Cosmetic & Skincare",
    "twitter:description": description || "Premium luxury cosmetic & skincare brand, formulated with science and purity for natural radiance.",
    "twitter:image": ogImage
  };

  Object.entries(twitterTags).forEach(([name, content]) => {
    let tag = document.querySelector(`meta[name="${name}"]`);
    if (!tag) {
      tag = document.createElement("meta");
      tag.setAttribute("name", name);
      document.head.appendChild(tag);
    }
    tag.setAttribute("content", content);
  });
};

/**
 * Injects Structured Data (JSON-LD) into the document head dynamically.
 * Automatically handles deduplication based on ID.
 */
export const injectJsonLd = (id, schemaObject) => {
  let scriptElement = document.getElementById(id);
  if (scriptElement) {
    scriptElement.textContent = JSON.stringify(schemaObject);
  } else {
    scriptElement = document.createElement("script");
    scriptElement.setAttribute("id", id);
    scriptElement.setAttribute("type", "application/ld+json");
    scriptElement.textContent = JSON.stringify(schemaObject);
    document.head.appendChild(scriptElement);
  }
};
