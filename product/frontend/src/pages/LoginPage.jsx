import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import { useToast } from "../hooks/useToast";
import { mapApiError } from "../services/api";

export default function LoginPage() {
  const { login, isAuthenticated } = useAuth();
  const { showToast } = useToast();
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from?.pathname || "/";

  const [token, setToken] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const hasAuthEndpoint = Boolean(import.meta.env.VITE_AUTH_LOGIN_URL);

  if (isAuthenticated) {
    navigate(from, { replace: true });
    return null;
  }

  const handleTokenLogin = async (e) => {
    e.preventDefault();
    if (!token.trim()) {
      showToast("Paste a valid JWT token", "error");
      return;
    }

    setLoading(true);
    try {
      await login(token, true);
      showToast("Signed in successfully", "success");
      navigate(from, { replace: true });
    } catch (err) {
      showToast(mapApiError(err), "error");
    } finally {
      setLoading(false);
    }
  };

  const handleCredentialLogin = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await login({ email, password });
      showToast("Signed in successfully", "success");
      navigate(from, { replace: true });
    } catch (err) {
      showToast(mapApiError(err), "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="login">
      <div className="login__card">
        <h1 className="login__title">Sign in</h1>
        <p className="login__subtitle">
          Access the Meridian catalog with your JWT token. All API routes
          require authentication.
        </p>

        {hasAuthEndpoint && (
          <>
            <form onSubmit={handleCredentialLogin}>
              <div className="form__group">
                <label htmlFor="email" className="form__label">
                  Email
                </label>
                <input
                  id="email"
                  type="email"
                  className="form__input"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  autoComplete="email"
                  required
                />
              </div>
              <div className="form__group">
                <label htmlFor="password" className="form__label">
                  Password
                </label>
                <input
                  id="password"
                  type="password"
                  className="form__input"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoComplete="current-password"
                  required
                />
              </div>
              <button
                type="submit"
                className="btn btn--primary"
                style={{ width: "100%" }}
                disabled={loading}
              >
                {loading ? "Signing in…" : "Sign in"}
              </button>
            </form>
            <p className="login__divider">or use token</p>
          </>
        )}

        <form onSubmit={handleTokenLogin}>
          <div className="form__group">
            <label htmlFor="token" className="form__label">
              JWT access token
            </label>
            <textarea
              id="token"
              className="form__textarea"
              value={token}
              onChange={(e) => setToken(e.target.value)}
              placeholder="Paste your Bearer token here"
              rows={4}
              required={!hasAuthEndpoint}
            />
            <p className="form__hint">
              Token is stored locally and sent as{" "}
              <code>Authorization: Bearer</code>
            </p>
          </div>
          <button
            type="submit"
            className="btn btn--primary"
            style={{ width: "100%" }}
            disabled={loading}
          >
            {loading ? "Verifying…" : "Continue with token"}
          </button>
        </form>

        <p className="form__hint" style={{ marginTop: "1.5rem", textAlign: "center" }}>
          <Link to="/">← Back to home</Link>
        </p>
      </div>
    </div>
  );
}
