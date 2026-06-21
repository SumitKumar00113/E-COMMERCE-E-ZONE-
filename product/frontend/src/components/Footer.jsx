export default function Footer() {
  return (
    <footer className="footer" role="contentinfo">
      <div className="footer__inner">
        <div>
          <p className="footer__brand">Meridian</p>
          <p className="footer__tagline">
            Curated products, considered design.
          </p>
        </div>
        <p className="footer__meta">
          &copy; {new Date().getFullYear()} Meridian Platform
        </p>
      </div>
    </footer>
  );
}
