import {
  createContext,
  useCallback,
  useEffect,
  useMemo,
  useState
} from "react";
import { toast } from "sonner";
import {
  fetchCurrentUser,
  loginWithEmail,
  logoutSession,
  signupWithEmail
} from "../api/auth";
import { setUnauthorizedHandler } from "../api/client";
import {
  clearAllTokens,
  setAccessToken,
  setRefreshToken
} from "../api/tokenStore";
import { getDisplayErrorMessage } from "../utils/errors";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => { setUser(null); }, []);

  /**
   * Fetch the current user profile from GET /api/auth/me.
   * The axios interceptor automatically retries with a refreshed token if
   * the access token is expired — so this function handles both cases:
   *   - Valid access token  → resolves immediately
   *   - Expired access token + valid refresh token → interceptor refreshes silently, then resolves
   *   - No tokens at all   → throws 401
   */
  const hydrateUser = useCallback(async () => {
    const response = await fetchCurrentUser();
    // Backend returns: { user: { id, email, displayName, createdAt } }
    const profile = response?.user || response;
    
    // Prevent "fake login" if a misconfigured proxy or CDN returns HTML instead of JSON
    if (!profile || typeof profile !== 'object' || (!profile.id && !profile._id && !profile.email)) {
      throw new Error("Invalid session data received from server");
    }

    setUser(profile);
    return profile;
  }, []);

  /**
   * Store tokens and set user state after a successful login / signup.
   * Backend returns: { user, accessToken, refreshToken }
   */
  const handleSessionSuccess = useCallback((session) => {
    if (session?.accessToken)  setAccessToken(session.accessToken);
    if (session?.refreshToken) setRefreshToken(session.refreshToken);
    setUser(session?.user || null);
  }, []);

  // ── Bootstrap ────────────────────────────────────────────────────────────────
  // On mount: try to restore the session by calling GET /api/auth/me.
  // The axios interceptor handles the silent refresh transparently, so we
  // don't need to call refreshSession() explicitly here.
  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        await hydrateUser();
      } catch (error) {
        if (cancelled) return;

        // 401 just means the user isn't logged in (no tokens, or refresh failed).
        // Anything else is a network/server error worth surfacing.
        if (error?.status !== 401) {
          toast.error(getDisplayErrorMessage(error, "We couldn't load your account right now."));
        }

        clearAllTokens();
        clearSession();
      } finally {
        if (!cancelled) setLoading(false);
      }
    };

    void bootstrap();

    // Register the global "session expired" handler.
    // Fired by the interceptor when a refresh also fails mid-session.
    const removeUnauthorizedHandler = setUnauthorizedHandler(() => {
      if (!cancelled) {
        clearAllTokens();
        clearSession();
        setLoading(false);
        toast.error("Your session expired. Please sign in again.");
      }
    });

    return () => {
      cancelled = true;
      removeUnauthorizedHandler();
    };
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // ── Auth Actions ──────────────────────────────────────────────────────────────

  const login = useCallback(async ({ email, password }) => {
    const session = await loginWithEmail({ email, password });
    handleSessionSuccess(session);
    return session.user;
  }, [handleSessionSuccess]);

  const signup = useCallback(async ({ fullName, email, password }) => {
    const session = await signupWithEmail({
      email,
      password,
      displayName: fullName || email.split("@")[0],
    });
    handleSessionSuccess(session);
    return session.user;
  }, [handleSessionSuccess]);

  const logout = useCallback(async () => {
    try { await logoutSession(); } catch (_) { /* always clear local state */ }
    clearAllTokens();
    clearSession();
  }, [clearSession]);

  const value = useMemo(() => ({
    user,
    loading,
    login,
    signup,
    logout,
    refreshUser: hydrateUser,
  }), [user, loading, login, signup, logout, hydrateUser]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}
