import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import authService from '../services/authService';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  // Load user from localStorage on mount
  useEffect(() => {
    const token = localStorage.getItem('trackyt_token');
    const savedUser = localStorage.getItem('trackyt_user');

    if (token && savedUser) {
      try {
        setUser(JSON.parse(savedUser));
      } catch {
        localStorage.removeItem('trackyt_token');
        localStorage.removeItem('trackyt_user');
      }
    }
    setLoading(false);
  }, []);

  const login = useCallback(async (email, password) => {
    const response = await authService.login({ email, password });
    
    // If login requires verification
    if (response.data.requiresVerification) {
      return response.data; // Return the metadata so UI can switch to OTP screen
    }

    const { user: userData, token } = response.data.data;
    localStorage.setItem('trackyt_token', token);
    localStorage.setItem('trackyt_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const register = useCallback(async (username, email, password) => {
    const response = await authService.register({ username, email, password });
    return response.data.data; // Contains userId, email, requiresVerification: true
  }, []);

  const verifyOtp = useCallback(async (userId, otp) => {
    const response = await authService.verifyOtp({ userId, otp });
    const { user: userData, token } = response.data.data;
    localStorage.setItem('trackyt_token', token);
    localStorage.setItem('trackyt_user', JSON.stringify(userData));
    setUser(userData);
    return userData;
  }, []);

  const logout = useCallback(async () => {
    try {
      // Blacklist the token on the server so it can't be reused
      await authService.logout();
    } catch {
      // Even if the API call fails, clear local state
    } finally {
      localStorage.removeItem('trackyt_token');
      localStorage.removeItem('trackyt_user');
      setUser(null);
    }
  }, []);

  const updateUser = useCallback((newUser) => {
    localStorage.setItem('trackyt_user', JSON.stringify(newUser));
    setUser(newUser);
  }, []);

  const value = {
    user,
    loading,
    isAuthenticated: !!user,
    login,
    register,
    verifyOtp,
    logout,
    updateUser,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}

export default AuthContext;
