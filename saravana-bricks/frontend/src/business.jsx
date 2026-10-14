import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import { api } from './api';

const BusinessContext = createContext(null);

/** Business profile (name, address, payment-tracking switch) shared by every page. */
export function BusinessProvider({ children }) {
  const [business, setBusiness] = useState(null);
  const [error, setError] = useState(null);

  const refresh = useCallback(() => {
    setError(null);
    return api.get('/profile/business').then(setBusiness).catch(setError);
  }, []);

  useEffect(() => {
    refresh();
  }, [refresh]);

  return (
    <BusinessContext.Provider value={{ business, setBusiness, refresh, error }}>
      {children}
    </BusinessContext.Provider>
  );
}

export function useBusiness() {
  return useContext(BusinessContext);
}
