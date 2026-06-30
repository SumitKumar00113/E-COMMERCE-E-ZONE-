import Image from "next/image";
import Link from "next/link";

const ATHLETE_IMAGE =
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?w=600&q=80&auto=format&fit=crop";

export default function ToolsSection() {
  return (
    <section className="flonea-tools" id="accessories" aria-label="Sports tools">
      <div className="flonea-tools__content">
        <h2>Tools in the vicinity, for every energy.</h2>
        <Link href="#shop" className="flonea-tools__btn">
          Upgrade kit
          <span aria-hidden="true">🏀</span>
        </Link>
        <Image
          className="flonea-tools__athlete"
          src={ATHLETE_IMAGE}
          alt="Athlete drinking from a water bottle"
          width={260}
          height={320}
        />
      </div>

      <div className="flonea-tools__extras">
        <div className="flonea-tools__ball" aria-hidden="true">
          <span>🎾</span>
          <p>Pro grip · All court</p>
        </div>
        <article className="flonea-tools__trophy-card">
          <span className="flonea-tools__trophy" aria-hidden="true">
            🏆
          </span>
          <h3>Pro-level accessories for game changers</h3>
          <Link href="#shop">Explore more →</Link>
        </article>
      </div>
    </section>
  );
}
