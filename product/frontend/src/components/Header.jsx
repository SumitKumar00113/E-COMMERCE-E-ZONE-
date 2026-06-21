import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useAuth } from "../hooks/useAuth";

const NAV_LINKS = [
  { to: "/", label: "Home" },
  { to: "/products", label: "Catalog" },
  { to: "/search", label: "Search" },
  { to: "/create", label: "List Item" },
];

export default function Header() {
  const location = useLocation();
  const { isAuthenticated, logout } = useAuth();
  const [scrolled, setScrolled] = useState(false);
  const [menuOpen, setMenuOpen] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    setMenuOpen(false);
  }, [location.pathname]);

  return (
    <header
      className={`header ${scrolled ? "header--scrolled" : ""}`}
      role="banner"
    >
      <div className="header__inner">
        <Link to="/" className="header__logo" aria-label="Meridian home">
          Merid<span>i</span>an
        </Link>

        <nav className="header__nav" aria-label="Main navigation">
          {NAV_LINKS.map(({ to, label }) => (
            <Link
              key={to}
              to={to}
              className={`header__link ${
                location.pathname === to ? "header__link--active" : ""
              }`}
            >
              {label}
            </Link>
          ))}
        </nav>

        <div className="header__actions">
          {isAuthenticated ? (
            <button
              type="button"
              className="btn btn--ghost btn--sm"
              onClick={logout}
            >
              Sign out
            </button>
          ) : (
            <Link to="/login" className="btn btn--primary btn--sm">
              Sign in
            </Link>
          )}

          <button
            type="button"
            className={`header__menu-btn ${menuOpen ? "header__menu-btn--open" : ""}`}
            aria-label={menuOpen ? "Close menu" : "Open menu"}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen(!menuOpen)}
          >
            <span />
            <span />
            <span />
          </button>
        </div>
      </div>

      <nav
        className={`header__mobile-nav ${menuOpen ? "header__mobile-nav--open" : ""}`}
        aria-label="Mobile navigation"
        aria-hidden={!menuOpen}
      >
        {NAV_LINKS.map(({ to, label }) => (
          <Link key={to} to={to} className="header__link">
            {label}
          </Link>
        ))}
        {!isAuthenticated && (
          <Link to="/login" className="btn btn--primary">
            Sign in
          </Link>
        )}
      </nav>
    </header>
  );
}
