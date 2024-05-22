import { useCallback, useEffect, useState } from 'react';

export function useSearchParam<
  T extends number | string | (number | string | undefined)[]
>(
  key: string,
  defaultState: T
): [T, (newState: T | ((prevState: T) => T)) => void] {
  const encodeValue = (value: T): string => {
    if (Array.isArray(value)) {
      return value.map(v => (v === undefined ? '' : v)).join(',');
    }
    return value.toString();
  };

  const decodeValue = (value: string): T => {
    if (Array.isArray(defaultState)) {
      return value.split(',').map(v => (v === '' ? undefined : v)) as T;
    }
    if (typeof defaultState === 'number') {
      return parseFloat(value) as T;
    }
    return value as T;
  };

  const getSearchParam = useCallback((): T => {
    const searchParams = new URLSearchParams(window.location.search);
    const param = searchParams.get(key);

    if (param === null) {
      return defaultState;
    }

    return decodeValue(param);
  }, [key, defaultState]);

  const [state, setState] = useState<T>(getSearchParam);

  useEffect(() => {
    const handlePopState = () => {
      setState(getSearchParam());
    };

    window.addEventListener('popstate', handlePopState);
    return () => {
      window.removeEventListener('popstate', handlePopState);
    };
  }, [getSearchParam]);

  const setSearchParam = (newState: T | ((prevState: T) => T)) => {
    const searchParams = new URLSearchParams(window.location.search);
    const nextState =
      typeof newState === 'function' ? newState(state) : newState;
    searchParams.set(key, encodeValue(nextState));

    const newUrl = `${window.location.pathname}?${searchParams.toString()}`;
    window.history.pushState(null, '', newUrl);

    setState(nextState);
  };

  return [state, setSearchParam] as const;
}
