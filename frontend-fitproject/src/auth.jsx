import { createContext, useContext, useEffect, useMemo, useState } from 'react';
import { api } from './api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [listo, setListo] = useState(false);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      setListo(true);
      return;
    }
    api('/api/auth/me')
      .then((data) => setUsuario(data.usuario))
      .catch(() => localStorage.removeItem('token'))
      .finally(() => setListo(true));
  }, []);

  const value = useMemo(() => ({
    usuario,
    listo,
    async entrar(correo, password) {
      const data = await api('/api/auth/login', { method: 'POST', body: { correo, password }, auth: false });
      localStorage.setItem('token', data.token);
      setUsuario(data.usuario);
    },
    async registrar(payload) {
      const data = await api('/api/auth/register', { method: 'POST', body: payload, auth: false });
      localStorage.setItem('token', data.token);
      setUsuario(data.usuario);
    },
    salir() {
      localStorage.removeItem('token');
      setUsuario(null);
    },
    actualizar(next) {
      setUsuario(next);
    },
  }), [usuario, listo]);

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  return useContext(AuthContext);
}
