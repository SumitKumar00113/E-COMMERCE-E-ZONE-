import { useMemo, useState } from "react";
import { getCurrentUser, loginUser, logoutUser, registerUser } from "./api/authApi";

const emptyForm = {
  firstName: "",
  lastName: "",
  userName: "",
  email: "",
  country: "+91",
  number: "",
  password: "",
  role: "user",
  remember: true,
};

function App() {
  const [mode, setMode] = useState("login");
  const [form, setForm] = useState(emptyForm);
  const [status, setStatus] = useState({ type: "idle", text: "" });
  const [currentUser, setCurrentUser] = useState(null);
  const isRegister = mode === "register";

  const welcomeText = useMemo(
    () =>
      isRegister
        ? {
            eyebrow: "Create secure access",
            title: "Start Your Account",
            copy: "Build your profile and keep your session ready for the app.",
            button: "Create Account",
            switchText: "Already have an account?",
            switchAction: "Sign in",
          }
        : {
            eyebrow: "Protected sign in",
            title: "Holla, Welcome Back",
            copy: "Use your username, email, or mobile number to continue.",
            button: "Sign In",
            switchText: "Don't have an account?",
            switchAction: "Sign up",
          },
    [isRegister]
  );

  const updateField = (event) => {
    const { name, value, checked, type } = event.target;

    setForm((current) => ({
      ...current,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

  const toggleMode = () => {
    setMode((current) => (current === "login" ? "register" : "login"));
    setStatus({ type: "idle", text: "" });
  };

  const submitForm = async (event) => {
    event.preventDefault();
    setStatus({ type: "loading", text: isRegister ? "Creating account..." : "Signing in..." });

    try {
      const payload = isRegister
        ? {
            fullName: {
              firstName: form.firstName.trim(),
              lastName: form.lastName.trim(),
            },
            userName: form.userName.trim(),
            email: form.email.trim(),
            mobNo: {
              country: form.country.trim(),
              number: form.number.trim(),
            },
            password: form.password,
            role: form.role,
          }
        : {
            userName: form.userName.trim() || undefined,
            email: form.email.trim() || undefined,
            mobNo: form.number.trim() ? { number: form.number.trim() } : undefined,
            password: form.password,
            role: form.role,
          };

      const response = isRegister ? await registerUser(payload) : await loginUser(payload);
      const { accessToken, user, message } = response.data;

      if (accessToken) {
        localStorage.setItem("accessToken", accessToken);
      }

      setCurrentUser(user);
      setStatus({ type: "success", text: message || "Authenticated successfully." });
    } catch (error) {
      setStatus({
        type: "error",
        text: error.response?.data?.message || "Something went wrong. Please try again.",
      });
    }
  };

  const fetchProfile = async () => {
    setStatus({ type: "loading", text: "Checking current user..." });

    try {
      const response = await getCurrentUser();
      setCurrentUser(response.data.user);
      setStatus({ type: "success", text: response.data.message || "Profile loaded." });
    } catch (error) {
      setStatus({
        type: "error",
        text: error.response?.data?.message || "Please sign in before loading profile.",
      });
    }
  };

  const handleLogout = async () => {
    setStatus({ type: "loading", text: "Signing out..." });

    try {
      await logoutUser();
      localStorage.removeItem("accessToken");
      setCurrentUser(null);
      setStatus({ type: "success", text: "Signed out successfully." });
    } catch (error) {
      localStorage.removeItem("accessToken");
      setCurrentUser(null);
      setStatus({
        type: "error",
        text: error.response?.data?.message || "Local session cleared.",
      });
    }
  };

  return (
    <main className="auth-shell">
      <section className="auth-card" aria-label="Authentication">
        <div className="form-panel">
          <a className="brand" href="/" aria-label="Finnger home">
            <span className="brand-mark" />
            <span>Finnger</span>
          </a>

          <p className="eyebrow">{welcomeText.eyebrow}</p>
          <h1>{welcomeText.title}</h1>
          <p className="intro">{welcomeText.copy}</p>

          <form className="auth-form" onSubmit={submitForm}>
            {isRegister && (
              <div className="name-grid">
                <label>
                  First name
                  <input
                    name="firstName"
                    value={form.firstName}
                    onChange={updateField}
                    placeholder="Sumit"
                    required
                  />
                </label>
                <label>
                  Last name
                  <input
                    name="lastName"
                    value={form.lastName}
                    onChange={updateField}
                    placeholder="Kumar"
                    required
                  />
                </label>
              </div>
            )}

            <label>
              Username
              <input
                name="userName"
                value={form.userName}
                onChange={updateField}
                placeholder="sumit_dev"
                required={isRegister}
              />
            </label>

            <label>
              Email
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={updateField}
                placeholder="sumit@example.com"
                required={isRegister}
              />
            </label>

            {isRegister && (
              <div className="phone-grid">
                <label>
                  Code
                  <input name="country" value={form.country} onChange={updateField} required />
                </label>
                <label>
                  Mobile number
                  <input
                    name="number"
                    value={form.number}
                    onChange={updateField}
                    placeholder="9876543210"
                    required
                  />
                </label>
              </div>
            )}

            {!isRegister && (
              <label>
                Mobile number
                <input
                  name="number"
                  value={form.number}
                  onChange={updateField}
                  placeholder="Optional login identifier"
                />
              </label>
            )}

            <label>
              Password
              <input
                name="password"
                type="password"
                value={form.password}
                onChange={updateField}
                placeholder="••••••••"
                required
              />
            </label>

            <div className="form-options">
              <label className="check-row">
                <input
                  name="remember"
                  type="checkbox"
                  checked={form.remember}
                  onChange={updateField}
                />
                Remember me
              </label>
              <button className="link-button" type="button">
                Forgot Password?
              </button>
            </div>

            <button className="primary-button" disabled={status.type === "loading"} type="submit">
              {status.type === "loading" ? "Please wait..." : welcomeText.button}
            </button>
          </form>

          <div className="session-actions">
            <button type="button" onClick={fetchProfile}>
              Load Profile
            </button>
            <button type="button" onClick={handleLogout}>
              Logout
            </button>
          </div>

          {status.text && <p className={`status ${status.type}`}>{status.text}</p>}

          {currentUser && (
            <aside className="profile-card" aria-label="Current user">
              <span>Signed in as</span>
              <strong>{currentUser.userName || currentUser.email}</strong>
            </aside>
          )}

          <p className="switch-copy">
            {welcomeText.switchText}{" "}
            <button type="button" onClick={toggleMode}>
              {welcomeText.switchAction}
            </button>
          </p>
        </div>

        <div className="visual-panel" aria-hidden="true">
          <div className="sky-cloud cloud-one" />
          <div className="sky-cloud cloud-two" />
          <div className="phone-scene">
            <div className="check-bubble">✓</div>
            <div className="phone">
              <span className="speaker" />
              <span className="menu-line" />
              <div className="fingerprint">
                <span />
                <span />
                <span />
                <span />
              </div>
              <div className="scan-line" />
              <small>Place your finger</small>
            </div>
            <div className="person">
              <span className="head" />
              <span className="body" />
              <span className="arm" />
              <span className="leg leg-one" />
              <span className="leg leg-two" />
            </div>
            <div className="lock">
              <span />
            </div>
          </div>
          <div className="sky-cloud cloud-three" />
        </div>
      </section>
    </main>
  );
}

export default App;
