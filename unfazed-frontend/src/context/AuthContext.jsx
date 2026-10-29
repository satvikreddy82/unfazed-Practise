import React, { createContext, useContext, useState, useEffect } from 'react';
import axios from 'axios';

const AuthContext = createContext();

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(() => localStorage.getItem('unfazed_token'));
  const [loading, setLoading] = useState(true);

  // Configure axios base URL and authorization header
  useEffect(() => {
    if (import.meta.env.VITE_API_URL) {
      axios.defaults.baseURL = import.meta.env.VITE_API_URL;
    }
    if (token) {
      axios.defaults.headers.common['Authorization'] = `Bearer ${token}`;
      localStorage.setItem('unfazed_token', token);
    } else {
      delete axios.defaults.headers.common['Authorization'];
      localStorage.removeItem('unfazed_token');
    }
  }, [token]);

  // Check current session on mount
  useEffect(() => {
    const fetchUser = async () => {
      if (!token) {
        setLoading(false);
        return;
      }
      try {
        const res = await axios.get('/api/auth/me');
        if (res.data.success) {
          setUser(res.data.user);
        } else {
          logout();
        }
      } catch (err) {
        console.warn('[Auth] Session check failed, clearing token:', err.message);
        logout();
      } finally {
        setLoading(false);
      }
    };

    fetchUser();
  }, [token]);

  const login = async (email, password, roleHint) => {
    const res = await axios.post('/api/auth/login', { email, password, roleHint });
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.data.message || 'Login failed');
  };

  const register = async (formData) => {
    const res = await axios.post('/api/auth/register', formData);
    if (res.data.success) {
      setToken(res.data.token);
      setUser(res.data.user);
      return res.data.user;
    }
    throw new Error(res.data.message || 'Registration failed');
  };

  const logout = () => {
    setToken(null);
    setUser(null);
    delete axios.defaults.headers.common['Authorization'];
    localStorage.removeItem('unfazed_token');
  };

  const refreshUser = async () => {
    if (!token) return;
    try {
      const res = await axios.get('/api/auth/me');
      if (res.data.success) {
        setUser(res.data.user);
      }
    } catch (e) {}
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        loading,
        login,
        register,
        logout,
        refreshUser,
        isAuthenticated: !!user,
        isTherapist: user?.role === 'therapist',
        isClient: user?.role === 'client',
        isAdmin: user?.role === 'admin',
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
