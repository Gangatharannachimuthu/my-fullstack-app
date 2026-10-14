import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { api, setUnauthorizedHandler } from './api';
import { Loading } from './components/ui';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  // undefined = still checking the session cookie, null = signed out.
  const [admin, setAdmin] = useState(undefined);

  useEffect(() => {
    setUnauthorizedHandler(() => setAdmin(null));
    api.get('/auth/me').then((d) => setAdmin(d.admin)).catch(() => setAdmin(null));
  }, []);

  const login = useCallback(async (loginIdentifier, password) => {
    const d = await api.post('/auth/login', { login_identifier: loginIdentifier, password });
    setAdmin(d.admin);
  }, []);

  const logout = useCallback(async () => {
    try {
      await api.post('/auth/logout');
    } finally {
      setAdmin(null);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ admin, setAdmin, login, logout }}>{children}</AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}

export function RequireAuth({ children }) {
  const { admin } = useAuth();
  const location = useLocation();
  if (admin === undefined) return <Loading label="Checking your session…" />;
  if (!admin) return <Navigate to="/login" replace state={{ from: location }} />;
  return children;
}
