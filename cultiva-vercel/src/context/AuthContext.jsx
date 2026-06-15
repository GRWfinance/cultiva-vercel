import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { api, setToken, getToken } from '../api/client';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const login = useCallback(async (email, password) => {
    setError(null);
    const data = await api.post('/auth/login', { email, password });
    setToken(data.token);
    setUser(data.user);
    return data.user;
  }, []);

  const logout = useCallback(() => {
    setToken(null);
    setUser(null);
  }, []);

  // Tenta restaurar sessão a partir do token salvo
  useEffect(() => {
    const token = getToken();
    if (!token) {
      setLoading(false);
      return;
    }
    // Não há endpoint /me; decodifica o payload do JWT para manter sessão básica
    try {
      const payload = JSON.parse(atob(token.split('.')[1]));
      setUser({ id: payload.id, role: payload.role, companyId: payload.companyId });
    } catch {
      setToken(null);
    } finally {
      setLoading(false);
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, loading, error, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth deve ser usado dentro de AuthProvider');
  return ctx;
}
