import React, { createContext, useContext, useState, useCallback } from 'react';

interface LoadingContextType {
  isLoading: boolean;
  loadingMessage: string;
  showLoading: (message?: string) => void;
  hideLoading: () => void;
  withLoading: <T>(promiseFn: () => Promise<T>, message?: string) => Promise<T>;
}

const LoadingContext = createContext<LoadingContextType>({
  isLoading: false,
  loadingMessage: 'Loading Pokémon Arena...',
  showLoading: () => {},
  hideLoading: () => {},
  withLoading: async (fn) => fn(),
});

export const LoadingProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Start with true for seamless app initialization overlay
  const [isLoading, setIsLoading] = useState(true);
  const [loadingMessage, setLoadingMessage] = useState('Initializing Pokémon Arena...');

  const showLoading = useCallback((message = 'Loading data...') => {
    setLoadingMessage(message);
    setIsLoading(true);
  }, []);

  const hideLoading = useCallback(() => {
    setIsLoading(false);
  }, []);

  const withLoading = useCallback(
    async <T,>(promiseFn: () => Promise<T>, message = 'Fetching external data...'): Promise<T> => {
      showLoading(message);
      try {
        const result = await promiseFn();
        return result;
      } finally {
        hideLoading();
      }
    },
    [showLoading, hideLoading]
  );

  return (
    <LoadingContext.Provider
      value={{
        isLoading,
        loadingMessage,
        showLoading,
        hideLoading,
        withLoading,
      }}
    >
      {children}
    </LoadingContext.Provider>
  );
};

export const useLoading = () => useContext(LoadingContext);
