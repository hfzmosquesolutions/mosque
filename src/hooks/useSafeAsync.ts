'use client';

import { useEffect, useRef, useCallback } from 'react';

/**
 * Hook to safely handle async operations with cleanup
 * Prevents state updates after component unmounts
 */
export function useSafeAsync() {
  const isMountedRef = useRef(true);

  useEffect(() => {
    isMountedRef.current = true;
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  const safeSetState = useCallback(<T,>(
    setState: React.Dispatch<React.SetStateAction<T>>,
    value: T | ((prev: T) => T)
  ) => {
    if (isMountedRef.current) {
      setState(value);
    }
  }, []);

  const isMounted = useCallback(() => isMountedRef.current, []);

  return { safeSetState, isMounted };
}

/**
 * Hook to create an abort controller that's cleaned up on unmount
 */
export function useAbortController() {
  const abortControllerRef = useRef<AbortController | null>(null);

  useEffect(() => {
    abortControllerRef.current = new AbortController();
    return () => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }
    };
  }, []);

  return abortControllerRef.current;
}

