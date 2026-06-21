import { Link } from "react-router-dom";
import { useParams } from "react-router-dom";
import { useProduct } from "../hooks/useProduct";
import AuthGuard from "../components/AuthGuard";
import ImageGallery from "../components/ImageGallery";
import ErrorState from "../components/ErrorState";
import { formatPrice, mapApiError } from "../services/api";
import { useToast } from "../hooks/useToast";
import { useEffect } from "react";

export default function ProductDetailPage() {
  const { id } = useParams();
  const { product, loading, error } = useProduct(id);
  const { showToast } = useToast();

  useEffect(() => {
    if (error) showToast(mapApiError(error), "error");
  }, [error, showToast]);

  return (
    <AuthGuard>
      {loading && (
        <div className="product-detail" aria-busy="true">
          <div className="product-detail__grid">
            <div className="skeleton skeleton--gallery" />
            <div>
              <div className="skeleton skeleton--text skeleton--title" />
              <div className="skeleton skeleton--text" />
              <div className="skeleton skeleton--text skeleton--short" />
            </div>
          </div>
        </div>
      )}

      {!loading && error && (
        <ErrorState
          title={error.status === 404 ? "Product not found" : "Something went wrong"}
          message={mapApiError(error)}
          actionLabel="Back to catalog"
          actionTo="/products"
        />
      )}

      {!loading && product && (
        <article className="product-detail">
          <div className="product-detail__grid">
            <ImageGallery images={product.images} />

            <div className="product-detail__info">
              <h1 className="product-detail__title">{product.title}</h1>

              <div className="product-detail__price-block">
                <span className="product-detail__price price">
                  {formatPrice(product.price?.amount, product.price?.currency)}
                </span>
                <span className="product-detail__currency">
                  {product.price?.currency}
                </span>
              </div>

              {product.description && (
                <p className="product-detail__description">
                  {product.description}
                </p>
              )}

              <p className="product-detail__seller">
                Listed by <strong>{String(product.seller).slice(-6)}</strong>
              </p>

              <div className="product-detail__cta">
                <button type="button" className="btn btn--accent">
                  Contact seller
                </button>
                <Link to="/products" className="btn btn--ghost">
                  Back to catalog
                </Link>
              </div>
            </div>
          </div>
        </article>
      )}
    </AuthGuard>
  );
}
