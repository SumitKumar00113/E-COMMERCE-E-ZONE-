import { useState } from "react";

export default function ImageGallery({ images = [] }) {
  const [active, setActive] = useState(0);

  if (!images.length) {
    return <div className="skeleton skeleton--gallery" aria-busy="true" />;
  }

  const current = images[active] || images[0];

  return (
    <div className="gallery" role="region" aria-label="Product images">
      <div className="gallery__main">
        <img
          className="gallery__main-image"
          src={current.url}
          alt={current.alt || "Product image"}
        />
      </div>

      {images.length > 1 && (
        <div className="gallery__thumbs" role="tablist" aria-label="Image thumbnails">
          {images.map((img, i) => (
            <button
              key={img.id || i}
              type="button"
              role="tab"
              aria-selected={i === active}
              aria-label={`View image ${i + 1}`}
              className={`gallery__thumb ${i === active ? "gallery__thumb--active" : ""}`}
              onClick={() => setActive(i)}
            >
              <img src={img.thumbnail || img.url} alt={img.alt || ""} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
