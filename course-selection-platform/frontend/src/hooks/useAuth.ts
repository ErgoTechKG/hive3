import { useContext } from 'react';
import { useSelector, useDispatch } from 'react-redux';
import { RootState, AppDispatch } from '../store';
import AuthContext from '../contexts/AuthContext';
import { login, logout, register } from '../store/slices/authSlice';

export const useAuth = () => {
  const context = useContext(AuthContext);
  const dispatch = useDispatch<AppDispatch>();
  const authState = useSelector((state: RootState) => state.auth);

  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }

  return {
    ...context,
    ...authState,
    login: async (username: string, password: string) => {
      return dispatch(login({ username, password })).unwrap();
    },
    logout: async () => {
      return dispatch(logout()).unwrap();
    },
    register: async (userData: any) => {
      return dispatch(register(userData)).unwrap();
    },
  };
};