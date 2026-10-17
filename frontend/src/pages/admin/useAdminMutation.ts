import { useCallback, useState } from 'react';
import { ApiError } from '../../lib/api';
import { useAdminAuth } from '../../context/AdminAuthContext';
import { usePortfolioData } from '../../context/PortfolioDataContext';

/**
 * Runs an authenticated write, then refreshes the shared portfolio data.
 * Tracks busy/error state, and drops the session if the key stops working.
 */
export function useAdminMutation() {
  const { adminKey, logout } = useAdminAuth();
  const { reload } = usePortfolioData();
  const [isBusy, setIsBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const run = useCallback(
    async (action: (adminKey: string) => Promise<unknown>): Promise<boolean> => {
      if (!adminKey) return false;
      setIsBusy(true);
      setError(null);
      try {
        await action(adminKey);
        await reload();
        return true;
      } catch (err) {
        if (err instanceof ApiError && err.status === 401) {
          logout();
        }
        setError(err instanceof Error ? err.message : 'Something went wrong');
        return false;
      } finally {
        setIsBusy(false);
      }
    },
    [adminKey, logout, reload],
  );

  return { run, isBusy, error, clearError: () => setError(null) };
}
