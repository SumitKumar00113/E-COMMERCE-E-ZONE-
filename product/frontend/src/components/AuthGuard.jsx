import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function AuthGuard({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="skeleton-grid" aria-busy="true" aria-label="Loading">
        {Array.from({ length: 3 }).map((_, i) => (
          <div key={i} className="skeleton skeleton--card" />
        ))}
      </div>
    );
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  return children;
}
