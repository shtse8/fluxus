import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { debounce } from './debounce.js'; // Added .js extension

describe('debounce utility', () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it('should not call the function immediately', () => {
    const func = vi.fn();
    const debouncedFunc = debounce(func, 100);

    debouncedFunc();
    expect(func).not.toHaveBeenCalled();
  });

  it('should call the function after the wait time', () => {
    const func = vi.fn();
    const debouncedFunc = debounce(func, 100);

    debouncedFunc();
    expect(func).not.toHaveBeenCalled();

    vi.advanceTimersByTime(100);
    expect(func).toHaveBeenCalledTimes(1);
  });

  it('should only call the function once for multiple calls within the wait time', () => {
    const func = vi.fn();
    const debouncedFunc = debounce(func, 100);

    debouncedFunc(); // Call 1
    vi.advanceTimersByTime(50);
    debouncedFunc(); // Call 2 (resets timer)
    expect(func).not.toHaveBeenCalled();

    vi.advanceTimersByTime(99);
    expect(func).not.toHaveBeenCalled(); // Still waiting for Call 2's timer

    vi.advanceTimersByTime(1); // Total time = 50 + 99 + 1 = 150 (100ms after Call 2)
    expect(func).toHaveBeenCalledTimes(1);
  });

  it('should call the function with the arguments from the last invocation', () => {
    const func = vi.fn();
    const debouncedFunc = debounce(func, 100);

    debouncedFunc(1);
    vi.advanceTimersByTime(50);
    debouncedFunc(2); // Last call with args (2)

    vi.advanceTimersByTime(100);
    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenCalledWith(2);
  });

  it('should allow subsequent calls after the debounce period', () => {
    const func = vi.fn();
    const debouncedFunc = debounce(func, 100);

    // First call sequence
    debouncedFunc('first');
    vi.advanceTimersByTime(100);
    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenCalledWith('first');

    // Second call sequence
    debouncedFunc('second');
    expect(func).toHaveBeenCalledTimes(1); // Not called immediately
    vi.advanceTimersByTime(100);
    expect(func).toHaveBeenCalledTimes(2);
    expect(func).toHaveBeenCalledWith('second');
  });

  it('should handle calls with multiple arguments', () => {
    const func = vi.fn();
    const debouncedFunc = debounce(func, 100);

    debouncedFunc(1, 'a', true);
    vi.advanceTimersByTime(50);
    debouncedFunc(2, 'b', false); // Last call

    vi.advanceTimersByTime(100);
    expect(func).toHaveBeenCalledTimes(1);
    expect(func).toHaveBeenCalledWith(2, 'b', false);
  });
});