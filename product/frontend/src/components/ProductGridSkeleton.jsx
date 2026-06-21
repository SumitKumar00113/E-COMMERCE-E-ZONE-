export default function ProductGridSkeleton({ count = 6 }) {
  return (
    <div
      className="skeleton-grid"
      aria-busy="true"
      aria-label="Loading products"
    >
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="skeleton skeleton--card" />
      ))}
    </div>
  );
}
