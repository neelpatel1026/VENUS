/**
 * Route prefetch helper utilities to download dynamic chunks on hover/touch
 * eliminating navigation delay and PageLoader flashes.
 */

const prefetched = new Set();

const runPrefetch = (key, importFn) => {
  if (prefetched.has(key)) return;
  prefetched.add(key);
  try {
    importFn();
  } catch (err) {
    // Graceful ignore
  }
};

export const prefetchShop = () => runPrefetch('shop', () => import('../pages/Shop.jsx'));
export const prefetchProductDetail = () => runPrefetch('product_detail', () => import('../pages/ProductDetail.jsx'));
export const prefetchAbout = () => runPrefetch('about', () => import('../pages/About.jsx'));
export const prefetchContact = () => runPrefetch('contact', () => import('../pages/Contact.jsx'));
export const prefetchCart = () => runPrefetch('cart', () => import('../pages/Cart.jsx'));
export const prefetchGifting = () => runPrefetch('gifting', () => import('../pages/Gifting.jsx'));
export const prefetchOffers = () => runPrefetch('offers', () => import('../pages/Offers.jsx'));
