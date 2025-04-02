/**
 * Creates a debounced function that delays invoking the input function until
 * after `wait` milliseconds have elapsed since the last time the debounced
 * function was invoked.
 *
 * @template T A function type that takes any number of arguments and returns any value.
 * @param func The function to debounce.
 * @param wait The number of milliseconds to delay.
 * @returns Returns the new debounced function.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  wait: number
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;

  return (...args: Parameters<T>): void => {
    if (timeoutId !== null) {
      clearTimeout(timeoutId);
    }

    timeoutId = setTimeout(() => {
      func(...args);
      timeoutId = null; // Clear timeoutId after execution
    }, wait);
  };
}
