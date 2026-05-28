'use client';

import { useEffect } from 'react';
import { initErrorTracking } from '@/lib/error-tracking';

/**
 * Client component that initializes global error tracking on mount.
 * Place once in the root layout.
 */
export function ErrorTrackingInit() {
  useEffect(() => {
    initErrorTracking();
  }, []);

  return null;
}
