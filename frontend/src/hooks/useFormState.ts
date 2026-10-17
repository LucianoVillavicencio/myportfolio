import { useCallback, useState } from 'react';

/** Minimal controlled-form state: values, a typed field setter, and reset. */
export function useFormState<T extends object>(initial: T) {
  const [values, setValues] = useState<T>(initial);

  const setField = useCallback(
    <K extends keyof T>(key: K, value: T[K]) =>
      setValues((prev) => ({ ...prev, [key]: value })),
    [],
  );

  return { values, setValues, setField };
}
