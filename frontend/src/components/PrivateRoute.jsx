import { Navigate, useLocation } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export function PrivateRoute({ children }) {
  const { user, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-page-glow px-6">
        <div className="w-full max-w-sm rounded-lg border border-line bg-panel p-10 text-center">
          <p className="font-display text-xl font-semibold text-ink">Opening your account</p>
          <p className="mt-3 text-sm leading-6 text-secondary">Just a moment while we load your links and recent activity.</p>
        </div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location }} />;
  }

  return children;
}
