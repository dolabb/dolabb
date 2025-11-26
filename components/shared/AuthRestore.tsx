'use client';

import { useEffect } from 'react';
import { useAppDispatch } from '@/lib/store/hooks';
import { restoreAuth } from '@/lib/store/slices/authSlice';

export default function AuthRestore() {
  const dispatch = useAppDispatch();

  useEffect(() => {
    // Restore auth state from localStorage on mount
    dispatch(restoreAuth());
  }, [dispatch]);

  return null;
}

