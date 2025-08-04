'use client';

import { useCallback, useRef, useState, useEffect } from 'react';

/**
 * Hook para criar callbacks estÃ¡veis que previnem loops infinitos
 * Baseado em prÃ¡ticas recomendadas para resolver "Maximum update depth exceeded"
 */
export function useStableCallback<T extends (...args: any[]) => any>(fn: T): T {
  const fnRef = useRef(fn);
  fnRef.current = fn;

  return useCallback((...args: any[]) => {
    return fnRef.current(...args);
  }, []) as T;
}

/**
 * Hook para debounce de valores que previne re-renderizaÃ§Ãµes excessivas
 */
export function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}

/**
 * Hook para executar efeitos apenas uma vez
 */
export function useOnce(effect: () => void | (() => void)) {
  const hasRun = useRef(false);
  const cleanup = useRef<(() => void) | void>();

  useEffect(() => {
    if (!hasRun.current) {
      hasRun.current = true;
      cleanup.current = effect();
    }

    return () => {
      if (cleanup.current) {
        cleanup.current();
      }
    };
  }, [effect]);
}
