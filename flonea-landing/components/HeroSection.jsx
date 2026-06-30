import Image from "next/image";
import Link from "next/link";

const HERO_IMAGE =
  "https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=800&q=80&auto=format&fit=crop";
const FOOTBALL_INSET =
  "https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=200&q=80&auto=format&fit=crop";
const SNEAKER_IMAGE =
  "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=300&q=80&auto=format&fit=crop";

export default function HeroSection() {
  return (
    <section className="flonea-hero" id="home" aria-label="Hero">
      <div className="flonea-hero__aside">
        <div className="flonea-hero__badge-circle">
          <span className="flonea-hero__badge-icon">⚾</span>
          <p>Best playing accessories for you</p>
        </div>
        <div className="flonea-hero__mini-card">
          <Image
            src={SNEAKER_IMAGE}
            alt="Elite sports sneaker"
            width={300}
            height={80}
            className="flonea-img"
          />
          <p>Elite accessories built for winners</p>
        </div>
      </div>

      <div className="flonea-hero__main">
        <span className="flonea-hero__pill">Elevate your sports</span>
        <div className="flonea-hero__title-row">
          <h1 className="flonea-hero__title">
            Choose right sports accessories
          </h1>
          <Image
            className="flonea-hero__inset"
            src={FOOTBALL_INSET}
            alt="Football player"
            width={72}
            height={72}
          />
        </div>
        <p className="flonea-hero__copy">
          Performance tech meets street-ready style. Gear up with pro-level
          equipment designed for every season and every energy.
        </p>
        <Link href="#shop" className="flonea-hero__cta">
          Let&apos;s get moving
          <span aria-hidden="true">✉</span>
        </Link>
        <Image
          className="flonea-hero__athlete"
          src={HERO_IMAGE}
          alt="Baseball player holding a bat"
          width={340}
          height={420}
          priority
        />
      </div>
    </section>
  );
}
