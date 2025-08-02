'use client';

import React, { createContext, useContext, useState, ReactNode } from 'react';

interface PageDataLoadingContextType {
  isPageDataLoaded: boolean;
  setPageDataLoaded: (loaded: boolean) => void;
}

const PageDataLoadingContext = createContext<PageDataLoadingContextType | undefined>(undefined);

export function usePageDataLoading() {
  const ctx = useContext(PageDataLoadingContext);
  if (!ctx) throw new Error('usePageDataLoading must be used within PageDataLoadingProvider');
  return ctx;
}

export default function PageDataLoadingProvider({ children }: { children: ReactNode }) {
  const [isPageDataLoaded, setPageDataLoaded] = useState(false);
  return (
    <PageDataLoadingContext.Provider value={{ isPageDataLoaded, setPageDataLoaded }}>
      {children}
    </PageDataLoadingContext.Provider>
  );
}