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

  // --- Cancellation Tests ---

  it('should abort the signal when scope is disposed', async () => {
    scope = createScope();
    let capturedSignal: AbortSignal | undefined;
    const testProvider = asyncProvider(async (reader) => {
      capturedSignal = reader.signal;
      // Simulate an operation that respects the signal
      await new Promise((_resolve, reject) => {
        // Mark resolve as unused
        if (reader.signal?.aborted) {
          return reject(new DOMException('Aborted', 'AbortError'));
        }
        reader.signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
        // Never resolve normally in this test case
      });
      return 'data'; // Should not be reached if aborted
    });

    // Initialize the provider, starting the async operation
    scope.read(testProvider);
    await delay(1); // Give time for the async function to start and capture the signal

    expect(capturedSignal).toBeDefined();
    expect(capturedSignal?.aborted).toBe(false);

    // Dispose the scope, which should trigger the abort controller
    scope.dispose();

    // Check if the captured signal is now aborted
    expect(capturedSignal?.aborted).toBe(true);
  });

  it('should abort the signal when listener count drops to zero (autoDispose)', async () => {
    scope = createScope();
    let capturedSignal: AbortSignal | undefined;
    const testProvider = asyncProvider(async (reader) => {
      capturedSignal = reader.signal;
      // Simulate an operation that respects the signal
      await new Promise((_resolve, reject) => {
        // Mark resolve as unused
        if (reader.signal?.aborted) {
          return reject(new DOMException('Aborted', 'AbortError'));
        }
        reader.signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
        // Never resolve normally in this test case
      });
      return 'data'; // Should not be reached if aborted
    });

    // Watch the provider, starting the async operation and capturing the signal
    const disposeWatcher = scope.watch(testProvider, () => {});
    await delay(1); // Give time for the async function to start and capture the signal

    expect(capturedSignal).toBeDefined();
    expect(capturedSignal?.aborted).toBe(false);

    // Dispose the watcher, which should trigger auto-disposal and abort the signal
    disposeWatcher();

    // Check if the captured signal is now aborted
    expect(capturedSignal?.aborted).toBe(true);
  });

  it('should abort the old signal and provide a new one on dependency change', async () => {
    scope = createScope();
    const dependency = stateProvider('initial');
    let capturedSignal1: AbortSignal | undefined;
    let capturedSignal2: AbortSignal | undefined;
    let executionCount = 0;

    const testProvider = asyncProvider(async (reader) => {
      executionCount++;
      const depValue = reader.read(dependency);
      if (executionCount === 1) {
        capturedSignal1 = reader.signal;
      } else {
        capturedSignal2 = reader.signal;
      }

      // Simulate an operation that respects the signal
      await new Promise((resolve, reject) => {
        if (reader.signal?.aborted) {
          return reject(new DOMException('Aborted', 'AbortError'));
        }
        reader.signal?.addEventListener('abort', () => {
          reject(new DOMException('Aborted', 'AbortError'));
        });
        // Resolve after a delay if not aborted
        setTimeout(() => resolve(`data_for_${depValue}`), 20);
      });
      return `data_for_${depValue}`; // Should not be reached if aborted early
    });

    // Initial execution
    scope.read(testProvider);
    await delay(1); // Allow execution 1 to start and capture signal 1

    expect(executionCount).toBe(1);
    expect(capturedSignal1).toBeDefined();
    expect(capturedSignal1?.aborted).toBe(false);
    expect(capturedSignal2).toBeUndefined();

    // Update dependency to trigger re-execution
    const updater = scope.updater(dependency);
    updater(scope, dependency, 'updated');
    await delay(1); // Allow re-execution to start and capture signal 2

    // Check execution count and signals
    expect(executionCount).toBe(2);
    expect(capturedSignal1?.aborted).toBe(true); // First signal should now be aborted
    expect(capturedSignal2).toBeDefined();
    expect(capturedSignal2?.aborted).toBe(false); // Second signal should be fresh

    // Wait for the second execution to complete
    await delay(50);
    const finalState = scope.read(testProvider);
    expect(hasData(finalState)).toBe(true);
    if (hasData(finalState)) {
      expect(finalState.data).toBe('data_for_updated');
    }
  });

  // --- keepPreviousDataOnError Tests ---

  describe('keepPreviousDataOnError option', () => {
    it('should NOT keep previous data on error by default (keepPreviousDataOnError: false)', async () => {
      scope = createScope();
      const trigger = stateProvider(1);
      let shouldFail = false;

      const testProvider = asyncProvider(async (read) => {
        read.read(trigger); // Depend on trigger
        await delay(10);
        if (shouldFail) {
          throw new Error('Failed');
        }
        return 'success_data';
      });

      const listener = vi.fn();
      scope.watch(testProvider, listener);

      // Initial success
      expect(isLoading(scope.read(testProvider))).toBe(true);
      await delay(50);
      let state = scope.read(testProvider);
      expect(hasData(state)).toBe(true);
      if (hasData(state)) {
        expect(state.data).toBe('success_data');
      }
      expect(listener).toHaveBeenCalledTimes(1); // loading -> data

      // Trigger failure
      shouldFail = true;
      const updater = scope.updater(trigger);
      updater(scope, trigger, 2);
      await delay(1); // Allow re-execution start

      state = scope.read(testProvider);
      expect(isLoading(state)).toBe(true);
      // Default behavior: loading state during re-fetch *after* success should have previous data
      if (isLoading(state)) {
        expect(state.previousData).toBe('success_data');
      }
      expect(listener).toHaveBeenCalledTimes(2); // data -> loading

      // Wait for failure
      await delay(50);
      state = scope.read(testProvider);
      expect(hasError(state)).toBe(true);
      if (hasError(state)) {
        expect(state.error).toBeInstanceOf(Error);
        // Default behavior: error state does NOT keep previous data
        expect(state.previousData).toBeUndefined();
      }
      expect(listener).toHaveBeenCalledTimes(3); // loading -> error
    });

    it('should keep previous data on error when keepPreviousDataOnError: true', async () => {
      scope = createScope();
      const trigger = stateProvider(1);
      let shouldFail = false;

      const testProvider = asyncProvider(
        async (read) => {
          read.read(trigger); // Depend on trigger
          await delay(10);
          if (shouldFail) {
            throw new Error('Failed');
          }
          return 'success_data_kept';
        },
        { keepPreviousDataOnError: true } // Enable the option
      );

      const listener = vi.fn();
      scope.watch(testProvider, listener);

      // Initial success
      expect(isLoading(scope.read(testProvider))).toBe(true);
      await delay(50);
      let state = scope.read(testProvider);
      expect(hasData(state)).toBe(true);
      if (hasData(state)) {
        expect(state.data).toBe('success_data_kept');
      }
      expect(listener).toHaveBeenCalledTimes(1); // loading -> data

      // Trigger failure
      shouldFail = true;
      const updater = scope.updater(trigger);
      updater(scope, trigger, 2);
      await delay(1); // Allow re-execution start

      state = scope.read(testProvider);
      expect(isLoading(state)).toBe(true);
      // Loading state during re-fetch *after* success should have previous data regardless of option
      if (isLoading(state)) {
        expect(state.previousData).toBe('success_data_kept');
      }
      expect(listener).toHaveBeenCalledTimes(2); // data -> loading

      // Wait for failure
      await delay(50);
      state = scope.read(testProvider);
      expect(hasError(state)).toBe(true);
      if (hasError(state)) {
        expect(state.error).toBeInstanceOf(Error);
        // Option enabled: error state SHOULD keep previous data
        expect(state.previousData).toBe('success_data_kept');
      }
      expect(listener).toHaveBeenCalledTimes(3); // loading -> error
    });

    it('should not keep data on error if the first execution failed (keepPreviousDataOnError: true)', async () => {
      scope = createScope();
      const testProvider = asyncProvider(
        async () => {
          await delay(10);
          throw new Error('Initial Failure');
        },
        { keepPreviousDataOnError: true }
      );

      const listener = vi.fn();
      scope.watch(testProvider, listener);

      // Initial failure
      expect(isLoading(scope.read(testProvider))).toBe(true);
      await delay(50);
      const state = scope.read(testProvider);
      expect(hasError(state)).toBe(true);
      if (hasError(state)) {
        expect(state.error).toBeInstanceOf(Error);
        // No previous successful data to keep
        expect(state.previousData).toBeUndefined();
      }
      expect(listener).toHaveBeenCalledTimes(1); // loading -> error
    });

    it('should update kept data after subsequent success (keepPreviousDataOnError: true)', async () => {
      scope = createScope();
      const trigger = stateProvider(1);
      let execution = 0;

      const testProvider = asyncProvider(
        async (read) => {
          execution++;
          read.read(trigger);
          await delay(10);
          // Fail on 2nd and 5th execution for this test
          if (execution === 2 || execution === 5) {
            throw new Error('Temporary Failure');
          }
          return `success_${execution}`;
        },
        { keepPreviousDataOnError: true }
      );

      const listener = vi.fn();
      scope.watch(testProvider, listener);

      // 1. Initial success
      expect(isLoading(scope.read(testProvider))).toBe(true);
      await delay(50);
      let state = scope.read(testProvider);
      expect(hasData(state)).toBe(true);
      if (hasData(state)) expect(state.data).toBe('success_1');
      expect(listener).toHaveBeenCalledTimes(1); // load -> data1

      // 2. Trigger failure
      const updater = scope.updater(trigger);
      updater(scope, trigger, 2);
      await delay(1);
      expect(isLoading(scope.read(testProvider))).toBe(true);
      await delay(50);
      state = scope.read(testProvider);
      expect(hasError(state)).toBe(true);
      if (hasError(state)) expect(state.previousData).toBe('success_1'); // Kept data1
      expect(listener).toHaveBeenCalledTimes(3); // data1 -> load -> error(prev:data1)

      // 3. Trigger success again
      updater(scope, trigger, 3);
      await delay(1);
      state = scope.read(testProvider);
      expect(isLoading(state)).toBe(true);
      // Loading state should still show previous *successful* data
      if (isLoading(state)) expect(state.previousData).toBe('success_1');
      expect(listener).toHaveBeenCalledTimes(4); // error -> load

      // Wait for final success
      await delay(50);
      state = scope.read(testProvider);
      expect(hasData(state)).toBe(true);
      if (hasData(state)) expect(state.data).toBe('success_3'); // New data
      expect(listener).toHaveBeenCalledTimes(5); // load -> data3

      // 4. Trigger another success (execution 4)
      updater(scope, trigger, 4);
      await delay(50);
      state = scope.read(testProvider);
      expect(hasData(state)).toBe(true);
      if (hasData(state)) expect(state.data).toBe('success_4'); // New data
      expect(listener).toHaveBeenCalledTimes(7); // load -> data4

      // 5. Trigger one more failure (execution 5) to check if previousData is now success_4
      updater(scope, trigger, 5);
      await delay(1);
      state = scope.read(testProvider);
      expect(isLoading(state)).toBe(true);
      if (isLoading(state)) expect(state.previousData).toBe('success_4'); // Loading shows last success
      expect(listener).toHaveBeenCalledTimes(8); // data4 -> load

      await delay(50);
      state = scope.read(testProvider);
      expect(hasError(state)).toBe(true);
      if (hasError(state)) expect(state.previousData).toBe('success_4'); // Kept data4
      expect(listener).toHaveBeenCalledTimes(9); // load -> error(prev:data4)
    });
  });
  // TODO: Add tests for re-computation when dependencies change (requires enhancing Scope/AsyncProvider)
  // TODO: Add tests for cancellation if implemented - DONE
  // TODO: Add tests for previousData preservation in loading/error states
});
