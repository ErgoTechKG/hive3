import React, { createContext, useEffect, useState, useCallback } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { useNavigate } from 'react-router-dom';
import { RootState, AppDispatch } from '../store';
import { getCurrentUser, refreshAccessToken, logout } from '../store/slices/authSlice';
import { setAuthToken } from '../utils/axios';
import { User } from '../types';

interface AuthContextProps {
  isAuthenticated: boolean;
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  refreshToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextProps | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const dispatch = useDispatch<AppDispatch>();
  const navigate = useNavigate();
  const authState = useSelector((state: RootState) => state.auth);
  const { user, accessToken, refreshToken, isAuthenticated } = authState;
  const [loading, setLoading] = useState(true);

  // Initialize auth state on mount
  useEffect(() => {
    const initAuth = async () => {
      if (accessToken) {
        setAuthToken(accessToken);
        try {
          await dispatch(getCurrentUser()).unwrap();
        } catch (error) {
          // Token might be expired, try to refresh
          if (refreshToken) {
            try {
              await dispatch(refreshAccessToken(refreshToken)).unwrap();
              await dispatch(getCurrentUser()).unwrap();
            } catch (refreshError) {
              // Refresh failed, logout
              await dispatch(logout());
              navigate('/login');
            }
          }
        }
      }
      setLoading(false);
    };

    initAuth();
  }, [accessToken, refreshToken, dispatch, navigate]);

  // Set up token refresh interval
  useEffect(() => {
    if (isAuthenticated && refreshToken) {
      const interval = setInterval(async () => {
        try {
          await dispatch(refreshAccessToken(refreshToken)).unwrap();
        } catch (error) {
          console.error('Token refresh failed:', error);
        }
      }, 25 * 60 * 1000); // Refresh every 25 minutes

      return () => clearInterval(interval);
    }
    return undefined;
  }, [isAuthenticated, refreshToken, dispatch]);

  const handleLogin = useCallback(async (username: string, password: string) => {
    const { login } = await import('../store/slices/authSlice');
    await dispatch(login({ username, password })).unwrap();
    navigate('/');
  }, [dispatch, navigate]);

  const handleLogout = useCallback(async () => {
    await dispatch(logout()).unwrap();
    navigate('/login');
  }, [dispatch, navigate]);

  const handleRefreshToken = useCallback(async () => {
    if (refreshToken) {
      await dispatch(refreshAccessToken(refreshToken)).unwrap();
    }
  }, [dispatch, refreshToken]);

  const value = {
    isAuthenticated,
    user,
    loading,
    login: handleLogin,
    logout: handleLogout,
    refreshToken: handleRefreshToken,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
};

export const useAuthContext = () => {
  const context = React.useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuthContext must be used within an AuthProvider');
  }
  return context;
};

export default AuthContext;