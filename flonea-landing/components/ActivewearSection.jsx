import Image from "next/image";
import Link from "next/link";

const CARDS = [
  {
    id: "accessories",
    tone: "lime",
    label: "Available accessories 475+",
    title: "Train smarter",
    image:
      "https://images.unsplash.com/photo-1535131749006-ba7a45ec3f78?w=400&q=80&auto=format&fit=crop",
    alt: "Golf ball on grass",
  },
  {
    id: "jersey",
    tone: "orange",
    label: "Sports jersey",
    title: "Main character energy",
    image:
      "https://images.unsplash.com/photo-1546519638-68e109498ffc?w=400&q=80&auto=format&fit=crop",
    alt: "Basketball player portrait",
  },
  {
    id: "tennis",
    tone: "sky",
    label: "Tennis bats",
    title: "Comfort · Strong",
    image:
      "https://images.unsplash.com/photo-1595435934249-5df7ed479625?w=400&q=80&auto=format&fit=crop",
    alt: "Tennis racket",
  },
];

export default function ActivewearSection() {
  return (
    <section className="flonea-activewear" id="apparel" aria-label="Activewear">
      <div className="flonea-activewear__head">
        <h2>Activewear with main character energy.</h2>
        <div className="flonea-activewear__avatars" aria-hidden="true">
          <span />
          <span />
          <span />
          <span />
        </div>
        <Link href="#shop" className="flonea-activewear__link">
          Train smarter →
        </Link>
      </div>

      <div className="flonea-activewear__grid">
        {CARDS.map((card) => (
          <article
            key={card.id}
            className={`flonea-card flonea-card--${card.tone}`}
          >
            <header>{card.label}</header>
            <Image
              src={card.image}
              alt={card.alt}
              width={400}
              height={120}
              className="flonea-img"
            />
            <footer>{card.title}</footer>
          </article>
        ))}
      </div>
    </section>
  );
}
