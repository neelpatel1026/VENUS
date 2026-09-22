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

// Fetch featured products (Home page)
const fetchFeaturedProducts = async () => {
  try {
    const res = await api.get("/api/products/featured");
    if (Array.isArray(res.data) && res.data.length > 0) {
      return res.data;
    }
  } catch (e) {
    console.warn("Featured API failed, falling back to general catalog:", e.message);
  }
  // Fallback
  const fallbackRes = await api.get("/api/products?limit=8");
  return Array.isArray(fallbackRes.data) ? fallbackRes.data : [];
};

export const useFeaturedProducts = () => {
  return useQuery({
    queryKey: ["products", "featured"],
    queryFn: fetchFeaturedProducts,
  });
};

// Fetch catalog products (Shop page)
const fetchProducts = async ({ queryKey }) => {
  const params = queryKey[2];
  const res = await api.get("/api/products", { params: typeof params === "object" ? params : {} });
  return Array.isArray(res.data) ? res.data : [];
};

export const useProducts = (params = {}) => {
  return useQuery({
    queryKey: ["products", "list", params],
    queryFn: fetchProducts,
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
