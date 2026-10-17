import React, { createContext, useCallback, useContext, useMemo, useState } from 'react';
import { api } from '../lib/api';

const STORAGE_KEY = 'portfolio_admin_key';

function readStoredKey(): string | null {
  try {
    return sessionStorage.getItem(STORAGE_KEY);
  } catch {
    return null;
  }
}

interface AdminAuthValue {
  adminKey: string | null;
  isAdmin: boolean;
  /** Verifies the key against the API; resolves to false when it's rejected. */
  login: (key: string) => Promise<boolean>;
  logout: () => void;
}

const AdminAuthContext = createContext<AdminAuthValue | null>(null);

export const AdminAuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [adminKey, setAdminKey] = useState<string | null>(readStoredKey);

  const login = useCallback(async (key: string) => {
    const ok = await api.verifyAdminKey(key);
    if (ok) {
      sessionStorage.setItem(STORAGE_KEY, key);
      setAdminKey(key);
    }
    return ok;
  }, []);

  const logout = useCallback(() => {
    sessionStorage.removeItem(STORAGE_KEY);
    setAdminKey(null);
  }, []);

  const value = useMemo(
    () => ({ adminKey, isAdmin: adminKey !== null, login, logout }),
    [adminKey, login, logout],
  );

  return (
    <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>
  );
};

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error('useAdminAuth must be used inside AdminAuthProvider');
  return ctx;
}
