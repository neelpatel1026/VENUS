import { useQuery, QueryClient } from "@tanstack/react-query";
import api from "../lib/api";

// Central QueryClient instance
export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes fresh in memory
      gcTime: 10 * 60 * 1000,   // 10 minutes cache persistence
      refetchOnWindowFocus: false,
      refetchOnReconnect: false,
      retry: 1,
    },
  },
});

// Helper to read and write localStorage cache for instantaneous first-paint
const getLocalCache = (key) => {
  try {
    const cached = localStorage.getItem(key);
    if (cached) {
      const parsed = JSON.parse(cached);
      if (Array.isArray(parsed) && parsed.length > 0) return parsed;
    }
  } catch (e) {
    // Ignore storage errors
  }
  return undefined;
};

const setLocalCache = (key, data) => {
  try {
    if (Array.isArray(data) && data.length > 0) {
      localStorage.setItem(key, JSON.stringify(data));
    }
  } catch (e) {
    // Ignore storage quota errors
  }
};

// Default fallback featured products for first-time visitors before network responds
const DEFAULT_FEATURED_PRODUCTS = [
  {
    _id: "featured_1",
    name: "Radiant Vitamin C Glow Serum",
    subtitle: "Advanced Brightening & Radiance",
    category: "Serum",
    price: 899,
    originalPrice: 1299,
    stock: 25,
    rating: 4.9,
    reviewCount: 142,
    imageUrl: "/cosmetic_1.avif",
    isBestSeller: true
  },
  {
    _id: "featured_2",
    name: "Hydrating Rose Botanical Face Mist",
    subtitle: "Pure Organic Floral Waters",
    category: "Face Care",
    price: 549,
    originalPrice: 799,
    stock: 40,
    rating: 4.8,
    reviewCount: 98,
    imageUrl: "/cosmetic_1.avif",
    isBestSeller: true
  },
  {
    _id: "featured_3",
    name: "Ultra-Lightweight Invisible Sunscreen SPF 50",
    subtitle: "Broad Spectrum PA++++",
    category: "Sunscreen",
    price: 649,
    originalPrice: 899,
    stock: 50,
    rating: 4.9,
    reviewCount: 215,
    imageUrl: "/cosmetic_1.avif",
    isBestSeller: true
  },
  {
    _id: "featured_4",
    name: "Amla & Bhringraj Nourishing Hair Oil",
    subtitle: "Deep Root Strengthening Ritual",
    category: "Body Care",
    price: 749,
    originalPrice: 1099,
    stock: 30,
    rating: 4.8,
    reviewCount: 84,
    imageUrl: "/cosmetic_1.avif",
    isBestSeller: true
  }
];

// Fetch featured products (Home page)
const fetchFeaturedProducts = async () => {
  try {
    const res = await api.get("/api/products/featured");
    if (Array.isArray(res.data) && res.data.length > 0) {
      setLocalCache("venus_featured_cache", res.data);
      return res.data;
    }
  } catch (e) {
    console.warn("Featured API failed, falling back to general catalog:", e.message);
  }
  // Fallback
  const fallbackRes = await api.get("/api/products?limit=8");
  const fallbackData = Array.isArray(fallbackRes.data) ? fallbackRes.data : [];
  if (fallbackData.length > 0) {
    setLocalCache("venus_featured_cache", fallbackData);
  }
  return fallbackData.length > 0 ? fallbackData : (getLocalCache("venus_featured_cache") || DEFAULT_FEATURED_PRODUCTS);
};

export const useFeaturedProducts = () => {
  return useQuery({
    queryKey: ["products", "featured"],
    queryFn: fetchFeaturedProducts,
    placeholderData: () => getLocalCache("venus_featured_cache") || DEFAULT_FEATURED_PRODUCTS,
  });
};

// Fetch catalog products (Shop page)
const fetchProducts = async ({ queryKey }) => {
  const params = queryKey[2];
  const res = await api.get("/api/products", { params: typeof params === "object" ? params : {} });
  const data = Array.isArray(res.data) ? res.data : [];
  if (data.length > 0 && (!params || Object.keys(params).length === 0)) {
    setLocalCache("venus_catalog_cache", data);
  }
  return data;
};

export const useProducts = (params = {}) => {
  const isDefaultParams = !params || Object.keys(params).length === 0;
  return useQuery({
    queryKey: ["products", "list", params],
    queryFn: fetchProducts,
    placeholderData: isDefaultParams ? () => getLocalCache("venus_catalog_cache") : undefined,
  });
};

// Fetch single product details
const fetchProductById = async ({ queryKey }) => {
  const id = queryKey[2];
  if (!id || id === "detail") throw new Error("Valid Product ID is required");
  const res = await api.get(`/api/products/${id}`);
  return res.data;
};

export const useProduct = (id) => {
  return useQuery({
    queryKey: ["products", "detail", id],
    queryFn: fetchProductById,
    enabled: !!id && id !== "detail",
  });
};

// Prefetch helpers for background prefetching on link hover
export const prefetchProductData = (id) => {
  if (!id || id === "detail") return;
  queryClient.prefetchQuery({
    queryKey: ["products", "detail", id],
    queryFn: fetchProductById,
    staleTime: 5 * 60 * 1000,
  });
};
