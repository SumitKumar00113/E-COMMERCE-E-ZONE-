import Image from "next/image";
import Link from "next/link";

const PRODUCTS = [
  {
    id: 1,
    tag: "Strike",
    title: "Tennis full brand",
    price: "$329",
    image:
      "https://images.unsplash.com/photo-1595435934249-5df7ed479625?w=300&q=80&auto=format&fit=crop",
  },
  {
    id: 2,
    tag: "Ultra grip",
    title: "Hockey kit",
    price: "$12",
    image:
      "https://images.unsplash.com/photo-1547447134-cd3f5e7161b1?w=300&q=80&auto=format&fit=crop",
  },
  {
    id: 3,
    tag: "Skateboard",
    title: "Football package",
    price: "$79",
    image:
      "https://images.unsplash.com/photo-1574629810360-7efbbe195018?w=300&q=80&auto=format&fit=crop",
  },
];

export default function SidebarColumn() {
  return (
    <aside className="flonea-sidebar" aria-label="Featured products">
      <section className="flonea-sidebar__feature flonea-sidebar__feature--blue">
        <div className="flonea-sidebar__feature-copy">
          <h2>Adorable gear for mighty mighties</h2>
          <Link href="#shop" className="flonea-pill-btn">
            Get pro assets
          </Link>
        </div>
        <Image
          src="https://images.unsplash.com/photo-1535131749006-ba7a45ec3f78?w=400&q=80&auto=format&fit=crop"
          alt="Golfer on the course"
          width={400}
          height={180}
          className="flonea-img"
        />
        <div className="flonea-sidebar__toffee">
          <span>🏆</span>
          <p>Classic toffee magic</p>
        </div>
      </section>

      <section className="flonea-sidebar__products" id="shop">
        <h2>A lot of fans adore the guy</h2>
        <div className="flonea-sidebar__product-grid">
          {PRODUCTS.map((product) => (
            <article key={product.id} className="flonea-product">
              <span className="flonea-product__tag">{product.tag}</span>
              <Image
                src={product.image}
                alt={product.title}
                width={300}
                height={72}
                className="flonea-img"
              />
              <h3>{product.title}</h3>
              <p>{product.price}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="flonea-sidebar__feature flonea-sidebar__feature--gear">
        <h2>Reliable sports the gear program</h2>
        <div className="flonea-sidebar__gear-row">
          <Image
            src="https://images.unsplash.com/photo-1553062407-98eeb64c6a62?w=200&q=80&auto=format&fit=crop"
            alt="Blue water bottle"
            width={200}
            height={100}
            className="flonea-img"
          />
          <Image
            src="https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?w=200&q=80&auto=format&fit=crop"
            alt="Soccer ball on grass"
            width={200}
            height={100}
            className="flonea-img"
          />
        </div>
        <Link href="#shop" className="flonea-pill-btn flonea-pill-btn--dark">
          Gear ready
        </Link>
      </section>

      <section className="flonea-sidebar__season" id="about">
        <h2>In every season, we&apos;ve got your reason</h2>
        <Image
          className="flonea-sidebar__season-hero"
          src="https://images.unsplash.com/photo-1560272564-c83b66b1ad12?w=600&q=80&auto=format&fit=crop"
          alt="American football player in action"
          width={600}
          height={160}
        />
        <div className="flonea-sidebar__season-cards">
          <article>
            <Image
              src="https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=200&q=80&auto=format&fit=crop"
              alt="Trophy in hand"
              width={200}
              height={72}
              className="flonea-img"
            />
            <p>Champion series</p>
          </article>
          <article>
            <Image
              src="https://images.unsplash.com/photo-1566577739112-5180d4bf9390?w=200&q=80&auto=format&fit=crop"
              alt="Baseball bats"
              width={200}
              height={72}
              className="flonea-img"
            />
            <p>Power lineup</p>
          </article>
        </div>
      </section>
    </aside>
  );
}
