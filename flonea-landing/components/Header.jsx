import Link from "next/link";

export default function Header() {
  return (
    <header className="flonea-header" role="banner">
      <div className="flonea-header__inner">
        <Link href="/" className="flonea-header__logo" aria-label="FLONEA home">
          FLONEA<span>.</span>
        </Link>

        <nav className="flonea-header__nav" aria-label="Main navigation">
          <Link href="#home">Home</Link>
          <Link href="#apparel">Apparel</Link>
          <Link href="#accessories">Accessories</Link>
          <Link href="#shop">Shop All</Link>
          <Link href="#about">About</Link>
        </nav>

        <Link href="#contact" className="flonea-header__contact">
          Contact
          <span className="flonea-header__contact-icon" aria-hidden="true">
            🏀
          </span>
        </Link>
      </div>
    </header>
  );
}
