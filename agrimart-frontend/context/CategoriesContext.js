'use client';

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import { api } from '@/lib/api';

const CategoriesContext = createContext(null);

export function CategoriesProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const refreshCategories = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      setCategories(await api.listCategories());
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    refreshCategories();
  }, [refreshCategories]);

  const value = useMemo(
    () => ({
      categories,
      loading,
      error,
      refreshCategories,
      categoryById: (id) => categories.find((category) => category.id === id),
    }),
    [categories, loading, error, refreshCategories]
  );

  return <CategoriesContext.Provider value={value}>{children}</CategoriesContext.Provider>;
}

export function useCategories() {
  const context = useContext(CategoriesContext);
  if (!context) throw new Error('useCategories must be used within CategoriesProvider');
  return context;
}
