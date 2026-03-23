import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import {
  activateGHLAccount,
  getGHLAccounts,
} from '../services/api';

const GHLAccountsContext = createContext(null);

export function GHLAccountsProvider({ children }) {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [switching, setSwitching] = useState(false);

  const refreshAccounts = useCallback(async () => {
    setLoading(true);
    try {
      const { data } = await getGHLAccounts();
      setAccounts(data.accounts || []);
      return data.accounts || [];
    } catch {
      return [];
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshAccounts();
  }, [refreshAccounts]);

  const setActiveAccount = useCallback(async (id) => {
    setSwitching(true);
    try {
      await activateGHLAccount(id);
      const updated = await refreshAccounts();
      return {
        success: true,
        account: updated.find((item) => item._id === id) || null,
      };
    } catch (err) {
      return {
        success: false,
        message: err.response?.data?.message || 'Failed to activate account',
      };
    } finally {
      setSwitching(false);
    }
  }, [refreshAccounts]);

  const activeAccount = useMemo(
    () => accounts.find((account) => account.isActive) || null,
    [accounts]
  );

  return (
    <GHLAccountsContext.Provider
      value={{
        accounts,
        activeAccount,
        loading,
        switching,
        refreshAccounts,
        setActiveAccount,
      }}
    >
      {children}
    </GHLAccountsContext.Provider>
  );
}

export const useGHLAccounts = () => useContext(GHLAccountsContext);
