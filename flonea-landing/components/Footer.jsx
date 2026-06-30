import Link from "next/link";

export default function Footer() {
  return (
    <footer className="flonea-footer" id="contact" role="contentinfo">
      <div className="flonea-footer__inner">
        <div>
          <p className="flonea-footer__brand">FLONEA.</p>
          <p className="flonea-footer__tagline">
            Premium sports apparel &amp; accessories for every energy.
          </p>
        </div>
        <nav aria-label="Footer links">
          <Link href="#shop">Shop</Link>
          <Link href="#about">About</Link>
          <Link href="#contact">Contact</Link>
        </nav>
        <p className="flonea-footer__copy">
          &copy; {new Date().getFullYear()} FLONEA Sports
        </p>
      </div>
    </footer>
  );
}
