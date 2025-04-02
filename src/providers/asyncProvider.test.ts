import { describe, it, expect, vi, afterEach } from 'vitest';
import { createScope, Scope } from '../scope.js';
import { stateProvider } from './stateProvider.js';
import { asyncProvider } from './asyncProvider.js';
import { isLoading, hasData, hasError } from '../types.js';

// Helper to delay execution
const delay = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

describe('asyncProvider', () => {
  let scope: Scope;

  afterEach(() => {
    scope?.dispose();
  });

  it('should initialize in loading state', () => {
    scope = createScope();
    const testProvider = asyncProvider(async () => 'data');
    const initialState = scope.read(testProvider);

    expect(isLoading(initialState)).toBe(true);
    if (isLoading(initialState)) { // Use type guard
      expect(initialState.previousData).toBeUndefined();
    }
  });

  it('should transition to data state on successful resolution', async () => {
    scope = createScope();
    const testProvider = asyncProvider(async () => {
      await delay(10);
      return 'success';
    });

    const listener = vi.fn();
    scope.watch(testProvider, listener);

    // Initial read triggers execution
    const initialState = scope.read(testProvider);
    expect(isLoading(initialState)).toBe(true);
    expect(listener).toHaveBeenCalledTimes(0); // Listener not called for initial read

    // Wait for promise to resolve
    await delay(50);

    const finalState = scope.read(testProvider);
    expect(hasData(finalState)).toBe(true);
    if (hasData(finalState)) {
      expect(finalState.data).toBe('success');
    }
    // Should be notified for loading -> data transition
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should transition to error state on promise rejection', async () => {
    scope = createScope();
    const testError = new Error('Failed');
    const testProvider = asyncProvider(async () => {
      await delay(10);
      throw testError;
    });

    const listener = vi.fn();
    scope.watch(testProvider, listener);

    // Initial read triggers execution
    const initialState = scope.read(testProvider);
    expect(isLoading(initialState)).toBe(true);
    expect(listener).toHaveBeenCalledTimes(0);

    // Wait for promise to reject
    await delay(50);

    const finalState = scope.read(testProvider);
    expect(hasError(finalState)).toBe(true);
    if (hasError(finalState)) {
      expect(finalState.error).toBe(testError);
    }
     // Should be notified for loading -> error transition
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should call onDispose when scope is disposed', async () => {
    scope = createScope();
    const disposeFn = vi.fn();
    const testProvider = asyncProvider(async (read) => {
        read.onDispose(disposeFn);
        await delay(10);
        return 'done';
    });

    scope.read(testProvider); // Initialize
    await delay(50); // Wait for completion

    expect(disposeFn).not.toHaveBeenCalled();
    scope.dispose();
    expect(disposeFn).toHaveBeenCalledTimes(1);
  });

  it('should read dependencies correctly', async () => {
    scope = createScope();
    const depProvider = stateProvider('dependency_value');
    const testProvider = asyncProvider(async (read) => {
        const depValue = read.read(depProvider); // Call the .read() method
        await delay(10);
        return `data_based_on_${depValue}`;
    });

    const initialState = scope.read(testProvider);
    expect(isLoading(initialState)).toBe(true);

    await delay(50);

    const finalState = scope.read(testProvider);
    expect(hasData(finalState)).toBe(true);
    if (hasData(finalState)) {
      expect(finalState.data).toBe('data_based_on_dependency_value');
    }
  });

  // TODO: Add tests for re-computation when dependencies change (requires enhancing Scope/AsyncProvider)
  // TODO: Add tests for cancellation if implemented
  // TODO: Add tests for previousData preservation in loading/error states
});