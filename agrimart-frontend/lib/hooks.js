'use client';

import { useEffect, useState } from 'react';
import { api } from '@/lib/api';

// Builds a { [userId]: user } map so product cards can show supplier name/location
// without every product row needing a join (the backend keeps products and
// profiles separate — GET /api/users gives us public profile fields).
export function useSupplierMap() {
  const [suppliers, setSuppliers] = useState({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let active = true;
    api
      .listUsers()
      .then((users) => {
        if (!active) return;
        const map = {};
        users.forEach((u) => {
          map[u.id] = u;
        });
        setSuppliers(map);
      })
      .catch(() => {})
      .finally(() => active && setLoading(false));
    return () => {
      active = false;
    };
  }, []);

  return { suppliers, loading };
}

export function withSupplierNames(products, suppliers) {
  return products.map((p) => ({
    ...p,
    supplierName: suppliers[p.supplierId]?.name,
  }));
}
