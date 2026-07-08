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
import { clearAllTokens, setAccessToken } from "../api/tokenStore";
import { getDisplayErrorMessage } from "../utils/errors";

export const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  const clearSession = useCallback(() => { setUser(null); }, []);

  const hydrateUser = useCallback(async () => {
    const response = await fetchCurrentUser();
    const profile = response?.user || response;

    if (!profile || typeof profile !== 'object' || (!profile.id && !profile._id && !profile.email)) {
      throw new Error("We couldn't connect to the server right now. Please try again later.");
    }

    setUser(profile);
    return profile;
  }, []);

  const handleSessionSuccess = useCallback((session) => {
    if (session?.accessToken) setAccessToken(session.accessToken);
    setUser(session?.user || null);
  }, []);

  useEffect(() => {
    let cancelled = false;

    const bootstrap = async () => {
      try {
        await hydrateUser();
      } catch (error) {
        if (cancelled) return;

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
