import { useState, useEffect } from 'react';

/**
 * Custom hook to debounce a rapidly changing value by a specified delay in milliseconds.
 * Essential for search inputs, autocomplete, and real-time filtering to avoid re-rendering
 * and heavy calculations on every keystroke.
 * 
 * @param {any} value - The input value to debounce
 * @param {number} delay - Delay in ms (default: 300ms)
 * @returns {any} debouncedValue
 */
export function useDebounce(value, delay = 300) {
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

export default useDebounce;
