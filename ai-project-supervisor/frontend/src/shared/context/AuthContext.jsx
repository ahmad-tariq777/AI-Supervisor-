import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { getRefreshToken, setSessionEndedHandler } from '../api/apiClient.js';
import * as authApi from '../../features/platform/auth/api/authApi.js';

const AuthContext = createContext(null);

const LOADING = { status: 'loading', user: null };
const ANONYMOUS = { status: 'anonymous', user: null };

export function AuthProvider({ children }) {
  const [state, setState] = useState(LOADING);

  useEffect(() => {
    let active = true;
    setSessionEndedHandler(() => setState(ANONYMOUS));

    if (!getRefreshToken()) {
      setState(ANONYMOUS);
    } else {
      authApi
        .restoreSession()
        .then((user) => {
          if (active) setState({ status: 'authenticated', user });
        })
        .catch(() => {
          if (active) setState(ANONYMOUS);
        });
    }

    return () => {
      active = false;
      setSessionEndedHandler(null);
    };
  }, []);

  const login = useCallback(async (credentials) => {
    const user = await authApi.login(credentials);
    setState({ status: 'authenticated', user });
    return user;
  }, []);

  const register = useCallback(
    async ({ fullName, email, password }) => {
      await authApi.register({ fullName, email, password });
      return login({ email, password });
    },
    [login]
  );

  const logout = useCallback(async () => {
    await authApi.logout();
    setState(ANONYMOUS);
  }, []);

  const updateUser = useCallback((user) => {
    setState((current) =>
      current.status === 'authenticated' ? { status: 'authenticated', user } : current
    );
  }, []);

  const value = useMemo(
    () => ({
      status: state.status,
      user: state.user,
      isAuthenticated: state.status === 'authenticated',
      login,
      register,
      logout,
      updateUser
    }),
    [state, login, register, logout, updateUser]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used inside AuthProvider');
  return context;
}
