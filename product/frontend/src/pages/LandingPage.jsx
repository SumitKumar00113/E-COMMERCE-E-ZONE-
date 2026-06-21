import ScrollMaskHero, { ProductMarquee } from "../components/ScrollMaskHero";
import ProductGrid from "../components/ProductGrid";
import { useProducts } from "../hooks/useProducts";
import AuthGuard from "../components/AuthGuard";

export default function LandingPage() {
  const { products, loading } = useProducts();

  return (
    <AuthGuard>
      <ScrollMaskHero products={products} />
      <ProductMarquee products={products} />
      <section aria-label="Latest products">
        <div className="page__header" style={{ paddingLeft: "clamp(1.5rem, 6vw, 8rem)" }}>
          <h2 className="page__title">Latest arrivals</h2>
          <p className="page__subtitle">Fresh from the catalog</p>
        </div>
        <ProductGrid products={products.slice(0, 6)} loading={loading} />
      </section>
    </AuthGuard>
  );
}
