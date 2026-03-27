import { createContext, useContext, useReducer, useCallback, useEffect } from 'react';
import api from '../lib/api';

const AuthContext = createContext(null);

const initialState = {
  user: null,
  token: null,
  isLoading: true,
  isAuthenticated: false,
};

function authReducer(state, action) {
  switch (action.type) {
    case 'SET_USER':
      return { ...state, user: action.payload.user, token: action.payload.token,
               isAuthenticated: true, isLoading: false };
    case 'CLEAR_USER':
      return { ...initialState, isLoading: false };
    case 'SET_LOADING':
      return { ...state, isLoading: action.payload };
    default:
      return state;
  }
}

export function AuthProvider({ children }) {
  const [state, dispatch] = useReducer(authReducer, initialState);

  // Listen for 401 events fired by Axios interceptor
  useEffect(() => {
    const handler = () => {
      sessionStorage.removeItem('vg_token');
      dispatch({ type: 'CLEAR_USER' });
    };
    window.addEventListener('vg:unauthorized', handler);
    return () => window.removeEventListener('vg:unauthorized', handler);
  }, []);

  // Restore session on mount
  useEffect(() => {
    const token = sessionStorage.getItem('vg_token'); // sessionStorage, not localStorage — security
    if (token) {
      api.get('/auth/me', { headers: { Authorization: `Bearer ${token}` } })
        .then(res => dispatch({ type: 'SET_USER', payload: { user: res.data, token } }))
        .catch(() => {
          sessionStorage.removeItem('vg_token');
          dispatch({ type: 'SET_LOADING', payload: false });
        });
    } else {
      dispatch({ type: 'SET_LOADING', payload: false });
    }
  }, []);

  const login = useCallback(async (email, password) => {
    const res = await api.post('/auth/login', { email, password });
    const { token, user } = res.data;
    sessionStorage.setItem('vg_token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    dispatch({ type: 'SET_USER', payload: { user, token } });
    return user;
  }, []);

  const register = useCallback(async (data) => {
    const res = await api.post('/auth/register', data);
    const { token, user } = res.data;
    sessionStorage.setItem('vg_token', token);
    api.defaults.headers.common['Authorization'] = `Bearer ${token}`;
    dispatch({ type: 'SET_USER', payload: { user, token } });
    return user;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem('vg_token');
    delete api.defaults.headers.common['Authorization'];
    dispatch({ type: 'CLEAR_USER' });
  }, []);

  return (
    <AuthContext.Provider value={{ ...state, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be inside AuthProvider');
  return ctx;
};
