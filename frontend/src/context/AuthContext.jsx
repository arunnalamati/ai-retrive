import React, { createContext, useContext, useState, useEffect } from 'react';
import { authApi } from '../api/authApi';

const AuthContext = createContext(null);

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [token, setToken] = useState(null);
  const [loading, setLoading] = useState(true);

  // Initialize auth state from localStorage on mount
  useEffect(() => {
    try {
      const storedToken = localStorage.getItem('farmer_token');
      const storedUser = localStorage.getItem('farmer_user');

      if (storedToken && storedUser) {
        setToken(storedToken);
        setUser(JSON.parse(storedUser));
      }
    } catch (err) {
      console.error('Error restoring session from localStorage:', err);
      localStorage.removeItem('farmer_token');
      localStorage.removeItem('farmer_user');
    } finally {
      setLoading(false);
    }
  }, []);

  // Login handler
  const login = async (email, password) => {
    const data = await authApi.login({ email, password });
    if (data.success && data.token) {
      localStorage.setItem('farmer_token', data.token);
      localStorage.setItem('farmer_user', JSON.stringify(data.user));
      setToken(data.token);
      setUser(data.user);
      return data.user;
    }
    throw new Error(data.message || 'Login failed');
  };

  // Register handler
  const register = async (userData) => {
    const data = await authApi.register(userData);
    return data;
  };

  // Logout handler
  const logout = () => {
    localStorage.removeItem('farmer_token');
    localStorage.removeItem('farmer_user');
    setToken(null);
    setUser(null);
  };

  const value = {
    user,
    token,
    loading,
    role: user?.role || null,
    isAuthenticated: !!token && !!user,
    isFarmer: user?.role === 'farmer',
    isAdmin: user?.role === 'admin',
    login,
    register,
    logout,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
