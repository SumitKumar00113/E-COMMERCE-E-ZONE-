import ProductGrid from "../components/ProductGrid";
import { useProducts } from "../hooks/useProducts";
import AuthGuard from "../components/AuthGuard";
import ErrorState from "../components/ErrorState";
import { mapApiError } from "../services/api";
import { useToast } from "../hooks/useToast";
import { useEffect } from "react";

export default function ProductsPage() {
  const { products, loading, error } = useProducts();
  const { showToast } = useToast();

  useEffect(() => {
    if (error) showToast(mapApiError(error), "error");
  }, [error, showToast]);

  return (
    <AuthGuard>
      <header className="page__header" style={{ paddingLeft: "clamp(1.5rem, 6vw, 8rem)" }}>
        <h1 className="page__title">Catalog</h1>
        <p className="page__subtitle">
          Browse the full collection — filter by currency, sort your way.
        </p>
      </header>

      {error ? (
        <ErrorState
          title="Couldn't load catalog"
          message={mapApiError(error)}
          actionLabel="Try again"
          actionTo="/products"
        />
      ) : (
        <ProductGrid products={products} loading={loading} />
      )}
    </AuthGuard>
  );
}
