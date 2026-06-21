import { Link } from "react-router-dom";
import {
  formatPrice,
  getProductId,
  getProductImage,
  getProductAlt,
} from "../services/api";

export default function ProductCard({ product, index = 0 }) {
  const id = getProductId(product);
  const thumb = getProductImage(product, "thumbnail");
  const alt = getProductAlt(product);
  const offsetClass =
    index % 3 === 1
      ? "product-card--offset-1"
      : index % 3 === 2
        ? "product-card--offset-2"
        : "";

  return (
    <Link
      to={`/products/${id}`}
      className={`product-card ${offsetClass}`}
      aria-label={`${product.title}, ${formatPrice(product.price?.amount, product.price?.currency)}`}
    >
      <div className="product-card__image-wrap">
        {thumb ? (
          <img
            className="product-card__image"
            src={thumb}
            alt={alt}
            loading="lazy"
          />
        ) : (
          <div className="skeleton skeleton--card" aria-hidden="true" />
        )}
        <span className="product-card__index" aria-hidden="true">
          {String(index + 1).padStart(2, "0")}
        </span>
        <div className="product-card__overlay">
          <h3 className="product-card__title">{product.title}</h3>
          <p className="product-card__price price">
            {formatPrice(product.price?.amount, product.price?.currency)}
          </p>
        </div>
      </div>
    </Link>
  );
}
