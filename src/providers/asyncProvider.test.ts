import { describe, it, expect, vi, afterEach } from 'vitest';
import { createScope, Scope } from '../scope.js';
import { stateProvider } from './stateProvider.js';
import { asyncProvider } from './asyncProvider.js';
import { isLoading, hasData, hasError } from '../types.js';

// Helper to delay execution
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
    if (isLoading(initialState)) {
      // Use type guard
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
    } else {
      expect.fail('Expected data state after initial execution');
    }
  }); // Close 'should read dependencies correctly' test

  it('should re-execute when a dependency changes', async () => {
    scope = createScope();
    const dependency = stateProvider('initial');
    let executionCount = 0;

    const testProvider = asyncProvider(async (read) => {
      executionCount++;
      const depValue = read.read(dependency);
      await delay(10);
      return `data_for_${depValue}`;
    });

    const listener = vi.fn();
    scope.watch(testProvider, listener);

    // Initial execution
    expect(isLoading(scope.read(testProvider))).toBe(true);
    expect(executionCount).toBe(1);
    await delay(50); // Wait for initial execution
    expect(hasData(scope.read(testProvider))).toBe(true);
    const dataState = scope.read(testProvider);
    if (hasData(dataState)) {
      expect(dataState.data).toBe('data_for_initial');
    } else {
      expect.fail('Expected data state after initial execution');
    }
    expect(listener).toHaveBeenCalledTimes(1); // loading -> data

    // Update dependency
    const updater = scope.updater(dependency);
    updater(scope, dependency, 'updated'); // Pass scope and provider
    await delay(1); // Allow state update propagation

    // Should re-execute immediately because it was marked stale
    expect(executionCount).toBe(2);
    // State should be loading again (potentially with previous data)
    const loadingState = scope.read(testProvider);
    expect(isLoading(loadingState)).toBe(true);
    if (isLoading(loadingState)) {
      expect(loadingState.previousData).toBe('data_for_initial');
    } else {
      expect.fail('Expected loading state during re-execution');
    }
    expect(listener).toHaveBeenCalledTimes(2); // data -> loading

    // Wait for second execution
    await delay(50);
    const finalState = scope.read(testProvider);
    expect(hasData(finalState)).toBe(true);
    if (hasData(finalState)) {
      expect(finalState.data).toBe('data_for_updated');
    } else {
      expect.fail('Expected data state after re-execution');
    }
    expect(listener).toHaveBeenCalledTimes(3); // loading -> data
  });

  // TODO: Add tests for re-computation when dependencies change (requires enhancing Scope/AsyncProvider)
  // TODO: Add tests for cancellation if implemented
  // TODO: Add tests for previousData preservation in loading/error states
});
