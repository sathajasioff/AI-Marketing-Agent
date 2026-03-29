import { createContext, useContext, useState, useEffect } from 'react';
import api from '../services/api';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [client,  setClient]  = useState(null);
  const [loading, setLoading] = useState(true);

  // Check if already logged in on app load
  useEffect(() => {
    const token = localStorage.getItem('elev8_token');
    if (!token) { setLoading(false); return; }

    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    api.get('/auth/me')
      .then(({ data }) => setClient(data.client))
      .catch(() => {
        localStorage.removeItem('elev8_token');
        delete api.defaults.headers.common['Authorization'];
      })
      .finally(() => setLoading(false));
  }, []);

  const login = async (email, password) => {
    const { data } = await api.post('/auth/login', { email, password });
    localStorage.setItem('elev8_token', data.token);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setClient(data.client);
    return data.client;
  };

  const register = async (name, email, password, companyName) => {
    const { data } = await api.post('/auth/register', { name, email, password, companyName });
    localStorage.setItem('elev8_token', data.token);
    api.defaults.headers.common['Authorization'] = `Bearer ${data.token}`;
    setClient(data.client);
    return data.client;
  };

  const logout = () => {
    localStorage.removeItem('elev8_token');
    delete api.defaults.headers.common['Authorization'];
    setClient(null);
  };

  const updateClient = (updates) => setClient(c => ({ ...c, ...updates }));

  return (
    <AuthContext.Provider value={{ client, loading, login, register, logout, updateClient }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => useContext(AuthContext);