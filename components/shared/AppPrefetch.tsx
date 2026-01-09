'use client';

import { useAppPrefetch } from '@/hooks/useAppPrefetch';

/**
 * Component that prefetches common data on app initialization
 * Add this to the root layout to ensure data is ready before navigation
 */
export default function AppPrefetch() {
  useAppPrefetch();
  return null;
}
