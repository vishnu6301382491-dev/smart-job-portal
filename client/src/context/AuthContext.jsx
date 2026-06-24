import { createContext, useContext, useEffect, useState } from "react";
import { authService } from "../services/authService";

const AuthContext = createContext(null);

const TOKEN_KEY = "smart_job_token";
const USER_KEY = "smart_job_user";

const getStoredUser = () => {
  const rawUser = localStorage.getItem(USER_KEY);

  if (!rawUser) {
    return null;
  }

  try {
    return JSON.parse(rawUser);
  } catch {
    return null;
  }
};

const clearAuthStorage = () => {
  localStorage.removeItem(TOKEN_KEY);
  localStorage.removeItem(USER_KEY);
};

const storeAuth = (token, user) => {
  localStorage.setItem(TOKEN_KEY, token);
  localStorage.setItem(USER_KEY, JSON.stringify(user));
};

export const AuthProvider = ({ children }) => {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_KEY));
  const [user, setUser] = useState(() => getStoredUser());
  const [authReady, setAuthReady] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const warmBackend = async () => {
      try {
        await authService.health();
      } catch {
        // Ignore warm-up failures; the real request will surface any problems.
      }
    };

    const hydrateAuth = async () => {
      const storedToken = localStorage.getItem(TOKEN_KEY);

      if (!storedToken) {
        if (!cancelled) {
          setAuthReady(true);
        }
        return;
      }

      try {
        const { data } = await authService.me();

        if (cancelled) {
          return;
        }

        setToken(storedToken);
        setUser(data.user);
        storeAuth(storedToken, data.user);
      } catch {
        if (cancelled) {
          return;
        }

        setToken(null);
        setUser(null);
        clearAuthStorage();
      } finally {
        if (!cancelled) {
          setAuthReady(true);
        }
      }
    };

    void warmBackend();
    hydrateAuth();

    return () => {
      cancelled = true;
    };
  }, []);

  const login = ({ token: nextToken, user: nextUser }) => {
    setToken(nextToken);
    setUser(nextUser);
    storeAuth(nextToken, nextUser);
  };

  const logout = async () => {
    try {
      await authService.logout();
    } catch {
      // Ignore logout API failures and clear local session anyway.
    }

    setToken(null);
    setUser(null);
    clearAuthStorage();
  };

  const updateUser = (nextUser) => {
    setUser(nextUser);
    localStorage.setItem(USER_KEY, JSON.stringify(nextUser));
  };

  const value = {
    token,
    user,
    isAuthenticated: Boolean(token && user),
    authReady,
    login,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);

  if (!context) {
    throw new Error("useAuth must be used within AuthProvider");
  }

  return context;
};
