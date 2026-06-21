import { useState } from "react";
import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useDebounce } from "../hooks/useDebounce";
import { useSearch } from "../hooks/useSearch";
import AuthGuard from "../components/AuthGuard";
import EmptyState from "../components/EmptyState";
import {
  formatPrice,
  getProductId,
  getProductImage,
  getProductAlt,
  mapApiError,
} from "../services/api";
import { useToast } from "../hooks/useToast";
import { useEffect } from "react";

export default function SearchPage() {
  const [query, setQuery] = useState("");
  const debouncedQuery = useDebounce(query, 400);
  const { products, loading, error, searched } = useSearch(debouncedQuery);
  const { showToast } = useToast();

  useEffect(() => {
    if (error) showToast(mapApiError(error), "error");
  }, [error, showToast]);

  return (
    <AuthGuard>
      <div className="search-page">
        <header className="page__header">
          <h1 className="page__title">Search</h1>
          <p className="page__subtitle">
            Find products by title or description
          </p>
        </header>

        <div className="search-page__input-wrap">
          <label htmlFor="search-input" className="sr-only">
            Search products
          </label>
          <input
            id="search-input"
            type="search"
            className="search-page__input"
            placeholder="What are you looking for?"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            autoFocus
            autoComplete="off"
          />
        </div>

        {loading && (
          <p className="search-page__status" aria-live="polite">
            <span className="search-page__pulse" aria-hidden="true" />
            Searching…
          </p>
        )}

        {!loading && searched && products.length === 0 && (
          <EmptyState
            title="No matches"
            message={`Nothing found for "${debouncedQuery}". Try a different term or browse the full catalog.`}
            actionLabel="Browse catalog"
            actionTo="/products"
          />
        )}

        {!loading && !searched && !query && (
          <EmptyState
            title="Start typing"
            message="Enter a keyword to search across all product titles and descriptions."
            icon="⌕"
          />
        )}

        <AnimatePresence mode="popLayout">
          <div className="search-page__results" role="list">
            {products.map((product, i) => {
              const id = getProductId(product);
              const thumb = getProductImage(product, "thumbnail");
              return (
                <motion.div
                  key={id}
                  role="listitem"
                  initial={{ opacity: 0, x: -12 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0 }}
                  transition={{ delay: i * 0.04 }}
                >
                  <Link to={`/products/${id}`} className="search-page__result">
                    {thumb ? (
                      <img
                        className="search-page__result-thumb"
                        src={thumb}
                        alt={getProductAlt(product)}
                      />
                    ) : (
                      <div
                        className="search-page__result-thumb skeleton"
                        aria-hidden="true"
                      />
                    )}
                    <div className="search-page__result-info">
                      <p className="search-page__result-title">
                        {product.title}
                      </p>
                      <p className="search-page__result-desc">
                        {product.description || "No description"}
                      </p>
                    </div>
                    <span className="price">
                      {formatPrice(
                        product.price?.amount,
                        product.price?.currency
                      )}
                    </span>
                  </Link>
                </motion.div>
              );
            })}
          </div>
        </AnimatePresence>
      </div>
    </AuthGuard>
  );
}
