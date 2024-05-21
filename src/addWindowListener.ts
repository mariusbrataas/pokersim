export function addWindowListener<T extends keyof WindowEventMap>(
  type: T,
  listener: (event: WindowEventMap[T]) => void
) {
  window.addEventListener(type, listener);
  return () => {
    window.removeEventListener(type, listener);
  };
}
