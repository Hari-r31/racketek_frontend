import { useState, useEffect, useRef } from "react";

/** Delays updating the returned value until `ms` ms after the last change. */
export function useDebounce<T>(value: T, ms = 400): T {
  const [debounced, setDebounced] = useState<T>(value);
  useEffect(() => {
    const t = setTimeout(() => setDebounced(value), ms);
    return () => clearTimeout(t);
  }, [value, ms]);
  return debounced;
}

/** Returns a stable callback that fires at most once per `ms` ms. */
export function useDebounceCallback(fn: (...args: any[]) => void, ms = 400) {
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  return (...args: any[]) => {
    if (timer.current) clearTimeout(timer.current);
    timer.current = setTimeout(() => fn(...args), ms);
  };
}
