import { useMemo, useState } from "react";
import ProductCard from "./ProductCard";
import ProductGridSkeleton from "./ProductGridSkeleton";
import EmptyState from "./EmptyState";

const CURRENCIES = ["ALL", "INR", "USD"];
const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price ↑" },
  { value: "price-desc", label: "Price ↓" },
  { value: "title", label: "A → Z" },
];

export default function ProductGrid({ products, loading }) {
  const [currencyFilter, setCurrencyFilter] = useState("ALL");
  const [sort, setSort] = useState("newest");

  const filtered = useMemo(() => {
    let list = [...products];

    if (currencyFilter !== "ALL") {
      list = list.filter((p) => p.price?.currency === currencyFilter);
    }

    switch (sort) {
      case "price-asc":
        list.sort((a, b) => (a.price?.amount || 0) - (b.price?.amount || 0));
        break;
      case "price-desc":
        list.sort((a, b) => (b.price?.amount || 0) - (a.price?.amount || 0));
        break;
      case "title":
        list.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break;
    }

    return list;
  }, [products, currencyFilter, sort]);

  if (loading) return <ProductGridSkeleton />;

  if (!products.length) {
    return (
      <EmptyState
        title="No products yet"
        message="Be the first to list an item, or try searching for something specific."
        actionLabel="List a product"
        actionTo="/create"
      />
    );
  }

  return (
    <section className="product-grid" aria-label="Product catalog">
      <div className="product-grid__toolbar">
        <div
          className="product-grid__filters"
          role="group"
          aria-label="Filter by currency"
        >
          {CURRENCIES.map((c) => (
            <button
              key={c}
              type="button"
              className={`product-grid__filter-btn ${
                currencyFilter === c ? "product-grid__filter-btn--active" : ""
              }`}
              onClick={() => setCurrencyFilter(c)}
              aria-pressed={currencyFilter === c}
            >
              {c === "ALL" ? "All" : c}
            </button>
          ))}
        </div>

        <div className="product-grid__sort">
          <label htmlFor="sort-select" className="product-grid__sort-label">
            Sort
          </label>
          <select
            id="sort-select"
            className="product-grid__sort-select"
            value={sort}
            onChange={(e) => setSort(e.target.value)}
          >
            {SORT_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      <p className="product-grid__count" aria-live="polite">
        {filtered.length} {filtered.length === 1 ? "item" : "items"}
      </p>

      <div className="product-grid__masonry" role="list">
        {filtered.map((product, i) => (
          <div key={product._id || product.id} role="listitem">
            <ProductCard product={product} index={i} />
          </div>
        ))}
      </div>
    </section>
  );
}
