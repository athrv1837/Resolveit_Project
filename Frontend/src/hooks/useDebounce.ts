import { useEffect, useState } from 'react';

/**
 * Debounce hook - delays state updates to prevent excessive re-renders
 * Useful for search inputs, filters, and other frequently changing values
 */
export function useDebounce<T>(value: T, delay: number = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    // Cancel the timeout if value changes before delay completes
    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}
