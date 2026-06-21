import { useState, useEffect, useCallback } from "react";
import { searchProducts } from "../services/api";

export function useSearch(query) {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [searched, setSearched] = useState(false);

  const search = useCallback(async (q) => {
    if (!q?.trim()) {
      setProducts([]);
      setSearched(false);
      setError(null);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const results = await searchProducts(q.trim());
      setProducts(results);
      setSearched(true);
    } catch (err) {
      setError(err);
      setProducts([]);
      setSearched(true);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    search(query);
  }, [query, search]);

  return { products, loading, error, searched };
}
