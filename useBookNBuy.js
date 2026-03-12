// hooks/useBookNBuy.js
// Custom React hooks for all BookNBuy API integrations

import { useState, useCallback } from "react";

// ─── FLIGHTS HOOK ─────────────────────────────────────────────────────────────
export function useFlights() {
  const [flights, setFlights] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async ({ origin, destination, date, adults = 1, travelClass = "ECONOMY", currency = "INR" }) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ origin, destination, date, adults, class: travelClass, currency });
      const res = await fetch(`/api/flights?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setFlights(data.flights || []);
      return data.flights;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { flights, loading, error, search };
}

// ─── MOVIES HOOK ──────────────────────────────────────────────────────────────
export function useMovies() {
  const [movies, setMovies] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const fetchNowPlaying = useCallback(async (region = "IN", page = 1) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/movies?action=now_playing&region=${region}&page=${page}`);
      const data = await res.json();
      setMovies(data.movies || []);
      return data;
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  const searchMovies = useCallback(async (query) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/movies?action=search&q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setMovies(data.movies || []);
      return data.movies;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  const getMovieDetail = useCallback(async (id) => {
    const res = await fetch(`/api/movies?action=detail&id=${id}`);
    return res.json();
  }, []);

  return { movies, loading, error, fetchNowPlaying, searchMovies, getMovieDetail };
}

// ─── TRAINS/BUSES HOOK ────────────────────────────────────────────────────────
export function useTransport() {
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async ({ mode, from, to, date }) => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({ mode, from, to, date });
      const res = await fetch(`/api/trains?${params}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setResults(mode === "train" ? data.trains : data.buses);
      return data;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { results, loading, error, search };
}

// ─── SHOPPING HOOK ────────────────────────────────────────────────────────────
export function useShopping() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);

  const search = useCallback(async (query) => {
    if (!query?.trim()) return;
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/shopping?q=${encodeURIComponent(query)}`);
      const data = await res.json();
      setProducts(data.results || []);
      return data.results;
    } catch (err) {
      setError(err.message);
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  return { products, loading, error, search };
}

// ─── RAZORPAY PAYMENT HOOK ────────────────────────────────────────────────────
export function useRazorpay() {
  const [loading, setLoading] = useState(false);

  const pay = useCallback(async ({ amount, currency = "INR", bookingType, bookingId, userId, userEmail, userName, userPhone, onSuccess, onError }) => {
    setLoading(true);
    try {
      // Step 1: Create order on server
      const res = await fetch("/api/payments/razorpay", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ amount, currency, bookingType, bookingId, userId }),
      });
      const { orderId, keyId } = await res.json();

      // Step 2: Load Razorpay script if not loaded
      if (!window.Razorpay) {
        await loadScript("https://checkout.razorpay.com/v1/checkout.js");
      }

      // Step 3: Open Razorpay checkout
      const rzp = new window.Razorpay({
        key: keyId,
        amount: amount * 100,
        currency,
        name: "BookNBuy",
        description: `${bookingType} Booking`,
        image: "/logo.png",
        order_id: orderId,
        prefill: { name: userName, email: userEmail, contact: userPhone },
        theme: { color: "#6c63ff" },
        handler: async (response) => {
          // Step 4: Verify payment signature on server
          const verifyRes = await fetch("/api/payments/razorpay", {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(response),
          });
          const verified = await verifyRes.json();
          if (verified.success) onSuccess?.(verified);
          else onError?.("Verification failed");
        },
        modal: { ondismiss: () => setLoading(false) },
      });

      rzp.open();
    } catch (err) {
      onError?.(err.message);
    } finally {
      setLoading(false);
    }
  }, []);

  return { loading, pay };
}

// ─── HELPER: Load external script ────────────────────────────────────────────
function loadScript(src) {
  return new Promise((resolve) => {
    if (document.querySelector(`script[src="${src}"]`)) return resolve(true);
    const s = document.createElement("script");
    s.src = src;
    s.onload = () => resolve(true);
    document.head.appendChild(s);
  });
}
