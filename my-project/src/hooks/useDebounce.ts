import { useEffect, useState } from 'react';

/**
 * Custom hook to debounce any fast-changing value (such as search text input).
 *
 * @param value The raw input value
 * @param delay Milliseconds to wait before updating the debounced value (default: 300ms)
 * @returns The debounced value
 */
export function useDebounce<T>(value: T, delay = 300): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

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

