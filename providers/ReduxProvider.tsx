'use client';

import { useRef } from 'react';
import { Provider } from 'react-redux';
import { PersistGate } from 'redux-persist/integration/react';
import { Persistor } from 'redux-persist';
import { makePersistedStore, AppStore } from '@/lib/store';

export default function ReduxProvider({ children }: { children: React.ReactNode }) {
  const storeRef = useRef<{ store: AppStore; persistor: Persistor } | null>(null);
  
  if (!storeRef.current) {
    storeRef.current = makePersistedStore();
  }

  return (
    <Provider store={storeRef.current.store}>
      <PersistGate loading={null} persistor={storeRef.current.persistor}>
        {children}
      </PersistGate>
    </Provider>
  );
}
