import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Link } from "react-router-dom";
import {
  getProductImage,
  getProductAlt,
  formatPrice,
  getProductId,
} from "../services/api";

export default function ScrollMaskHero({ products = [] }) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });

  const maskClip = useTransform(
    scrollYProgress,
    [0, 0.6],
    ["inset(0 100% 0 0)", "inset(0 0% 0 0)"]
  );

  const headlineY = useTransform(scrollYProgress, [0, 1], [0, 80]);
  const featured = products.slice(0, 4);

  return (
    <section className="hero" ref={ref} aria-label="Welcome">
      <div className="hero__bg-grid" aria-hidden="true">
        {Array.from({ length: 12 }).map((_, i) => (
          <div key={i} className="hero__bg-cell" />
        ))}
      </div>

      {featured.length > 0 && (
        <motion.div
          className="hero__mask-layer"
          style={{ clipPath: maskClip }}
          aria-hidden="true"
        >
          <div className="hero__mask-strip">
            {featured.map((p) => {
              const thumb = getProductImage(p, "thumbnail");
              if (!thumb) return null;
              return (
                <img
                  key={getProductId(p)}
                  src={thumb}
                  alt=""
                  loading="eager"
                />
              );
            })}
          </div>
        </motion.div>
      )}

      <motion.div className="hero__content" style={{ y: headlineY }}>
        <p className="hero__eyebrow">Product Platform</p>
        <h1 className="hero__headline">
          Objects with <em>intent</em>
        </h1>
        <p className="hero__subline">
          Meridian is where considered products find their audience — curated,
          searchable, and beautifully presented.
        </p>
        <div className="hero__actions">
          <Link to="/products" className="btn btn--primary">
            Browse catalog
          </Link>
          <Link to="/create" className="btn btn--ghost">
            List your product
          </Link>
        </div>
        <div className="hero__scroll-cue" aria-hidden="true">
          <span />
          Scroll to explore
        </div>
      </motion.div>
    </section>
  );
}

export function ProductMarquee({ products = [] }) {
  if (!products.length) return null;

  const items = [...products, ...products];

  return (
    <section className="marquee" aria-label="Featured products">
      <p className="marquee__label">Featured</p>
      <div className="marquee__track">
        {items.map((p, i) => {
          const thumb = getProductImage(p, "thumbnail");
          return (
            <div key={`${getProductId(p)}-${i}`} className="marquee__item">
              {thumb && (
                <img
                  className="marquee__thumb"
                  src={thumb}
                  alt={getProductAlt(p)}
                  loading="lazy"
                />
              )}
              <span className="marquee__title">{p.title}</span>
              <span className="marquee__price price">
                {formatPrice(p.price?.amount, p.price?.currency)}
              </span>
            </div>
          );
        })}
      </div>
    </section>
  );
}
