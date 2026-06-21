import {
  createContext,
  useContext,
  useState,
  useEffect,
  useCallback,
} from "react";
import {
  getToken,
  setToken,
  logout as clearToken,
  loginWithCredentials,
  loginWithToken,
} from "../services/api";

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [token, setTokenState] = useState(() => getToken());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setTokenState(getToken());
    setLoading(false);
  }, []);

  const login = useCallback(async (credentialsOrToken, isToken = false) => {
    if (isToken) {
      loginWithToken(credentialsOrToken);
      setTokenState(credentialsOrToken.trim());
      return;
    }

    const token = await loginWithCredentials(
      credentialsOrToken.email,
      credentialsOrToken.password
    );
    setTokenState(token);
  }, []);

  const logout = useCallback(() => {
    clearToken();
    setTokenState(null);
  }, []);

  const isAuthenticated = Boolean(token);

  return (
    <AuthContext.Provider
      value={{ token, isAuthenticated, loading, login, logout }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
