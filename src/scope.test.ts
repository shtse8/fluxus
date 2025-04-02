import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'; // Added beforeEach, afterEach
import { createScope, Scope } from './scope.js';
import { Provider, ScopeReader } from './types.js';
import { stateProvider } from './providers/stateProvider.js';
import { computedProvider } from './providers/computedProvider.js'; // Added computedProvider

describe('Scope', () => {
  it('should create a new scope instance', () => {
    const scope = createScope();
    expect(scope).toBeInstanceOf(Scope);
  });

  it('should initialize and read a simple provider', () => {
    const scope = createScope();
    const simpleProvider: Provider<string> = () => 'hello';
    const value = scope.read(simpleProvider);
    expect(value).toBe('hello');
  });

  it('should cache the value of a simple provider after first read', () => {
    const scope = createScope();
    const creationFn = vi.fn(() => 'hello');
    const simpleProvider: Provider<string> = creationFn;

    // Read multiple times
    const value1 = scope.read(simpleProvider);
    const value2 = scope.read(simpleProvider);

    expect(value1).toBe('hello');
    expect(value2).toBe('hello');
    // The creation function should only be called once
    expect(creationFn).toHaveBeenCalledTimes(1);
  });

  it('should throw error on circular dependency', () => {
    const scope = createScope();
    const providerA: Provider<string> = (reader) => reader.read(providerB);
    const providerB: Provider<string> = (reader) => reader.read(providerA); // Circular

    expect(() => scope.read(providerA)).toThrowError('Circular dependency detected');
  });

  it('should initialize and read a stateProvider', () => {
    const scope = createScope();
    const counterProvider = stateProvider(0);
    const value = scope.read(counterProvider);
    expect(value).toBe(0);
  });

  it('should update a stateProvider using the updater', () => {
    const scope = createScope();
    const counterProvider = stateProvider(0);

    // Initial read
    expect(scope.read(counterProvider)).toBe(0);

    // Get updater and update value
    const updateCounter = scope.updater(counterProvider);
    updateCounter(scope, counterProvider, 10);
    expect(scope.read(counterProvider)).toBe(10);

    // Update using a function
    updateCounter(scope, counterProvider, (prev) => prev + 5);
    expect(scope.read(counterProvider)).toBe(15);
  });

  it('should throw error when getting updater for non-state provider', () => {
    const scope = createScope();
    const simpleProvider: Provider<string> = () => 'hello';
    // Need to cast simpleProvider because updater expects StateProviderInstance

    // Match the updated error message including the provider name
    // @ts-expect-error - Intentionally passing wrong provider type to test error
    expect(() => scope.updater(simpleProvider)).toThrowError(
      "Target provider 'simpleProvider' is not a StateProvider or state is inconsistent"
    );
  });

  it('should call listener added via watch when stateProvider updates', () => {
    const scope = createScope();
    const counterProvider = stateProvider(0);
    const listener = vi.fn();

    // Initialize provider and add listener
    scope.read(counterProvider); // Ensure initialized
    const unsubscribe = scope.watch(counterProvider, listener);

    // Update the state
    const updateCounter = scope.updater(counterProvider);
    updateCounter(scope, counterProvider, 1);

    // Listener should have been called
    expect(listener).toHaveBeenCalledTimes(1);

    // Update again
    updateCounter(scope, counterProvider, 2);
    expect(listener).toHaveBeenCalledTimes(2);

    unsubscribe();
  });

  it('should stop calling listener after unsubscribe from watch', () => {
    const scope = createScope();
    const counterProvider = stateProvider(0);
    const listener = vi.fn();

    scope.read(counterProvider);
    const unsubscribe = scope.watch(counterProvider, listener);

    const updateCounter = scope.updater(counterProvider);
    updateCounter(scope, counterProvider, 1);
    expect(listener).toHaveBeenCalledTimes(1);

    // Unsubscribe
    unsubscribe();

    // Update again
    updateCounter(scope, counterProvider, 2);
    // Listener should NOT have been called again
    expect(listener).toHaveBeenCalledTimes(1);
  });

  it('should return a no-op unsubscribe when watching a non-state provider', () => {
    const scope = createScope();
    const simpleProvider: Provider<string> = () => 'hello';
    const listener = vi.fn();

    // Suppress console.warn for this test if needed, or just check return value
    const unsubscribe = scope.watch(simpleProvider, listener);
    expect(unsubscribe).toBeInstanceOf(Function); // It should return a function

    // Calling the unsubscribe function should not throw
    expect(() => unsubscribe()).not.toThrow();

    // Listener should not have been called (as there's nothing to trigger it)
    expect(listener).not.toHaveBeenCalled();
  });

  it('should dispose the scope and clean up provider states', () => {
    const scope = createScope();
    const disposeCallback = vi.fn();
    const providerWithDispose: Provider<string> = (reader) => {
      reader.onDispose(disposeCallback);
      return 'value';
    };

    // Initialize the provider
    scope.read(providerWithDispose);

    // Dispose the scope
    scope.dispose();

    // The dispose callback should have been called

    describe('Scope Overrides', () => {
      let parentScope: Scope;
      let childScope: Scope;
      const providerA = stateProvider(10);
      // const providerB = stateProvider('B'); // Unused variable
      const providerC = computedProvider(
        (read: ScopeReader) => `C based on ${read.read(providerA)}`
      ); // Add type for read

      beforeEach(() => {
        parentScope = createScope();
      });

      afterEach(() => {
        parentScope?.dispose();
        childScope?.dispose();
      });

      it('should return override value when overridden with value', () => {
        childScope = createScope(parentScope, [{ provider: providerA, useValue: 999 }]);
        expect(childScope.read(providerA)).toBe(999);
        // Parent scope should be unaffected
        expect(parentScope.read(providerA)).toBe(10);
      });

      it('should use overriding provider when overridden with provider', () => {
        const overrideProviderA = stateProvider(100);
        childScope = createScope(parentScope, [
          { provider: providerA, useValue: overrideProviderA },
        ]);

        // Reads from child scope use the override
        expect(childScope.read(providerA)).toBe(100);

        // Update via override
        const updater = childScope.updater(overrideProviderA); // Get updater for the override
        updater(childScope, overrideProviderA, (n) => n + 1);
        expect(childScope.read(providerA)).toBe(101);

        // Parent scope should be unaffected
        expect(parentScope.read(providerA)).toBe(10);
        const parentUpdater = parentScope.updater(providerA);
        parentUpdater(parentScope, providerA, (n) => n + 5);
        expect(parentScope.read(providerA)).toBe(15);
        expect(childScope.read(providerA)).toBe(101); // Child still uses its override
      });

      it('should use override in dependent providers within the same scope', () => {
        childScope = createScope(parentScope, [{ provider: providerA, useValue: 50 }]);
        // providerC reads providerA, should use the overridden value (50) in childScope
        expect(childScope.read(providerC)).toBe('C based on 50');
        // Parent scope uses original value
        expect(parentScope.read(providerC)).toBe('C based on 10');
      });

      it('should throw error when getting updater for non-stateprovider override', () => {
        childScope = createScope(parentScope, [
          { provider: providerA, useValue: () => 99 }, // Override with a generic provider
        ]);
        expect(() => childScope.updater(providerA)).toThrow(
          'Provider overridden with a non-StateProvider value, cannot get updater.'
        );
      });

      it('should allow overriding with a different state provider type', () => {
        const overrideProviderA = stateProvider('overridden');
        childScope = createScope(parentScope, [
          // Override providerA (number) with a string state provider
          { provider: providerA, useValue: overrideProviderA },
        ]);

        // Reading the original providerA in the child scope now returns the override's value
        expect(childScope.read(providerA)).toBe('overridden');

        // We need to get the updater for the *overriding* provider
        const updater = childScope.updater(overrideProviderA);
        updater(childScope, overrideProviderA, (s) => s + '!');
        expect(childScope.read(providerA)).toBe('overridden!');

        // Parent remains unaffected
        expect(parentScope.read(providerA)).toBe(10);
      });
    });

    expect(disposeCallback).toHaveBeenCalledTimes(1);

    // Reading from a disposed scope should throw
    expect(() => scope.read(providerWithDispose)).toThrowError('Scope has been disposed');
  });

  it('should clear internal state map on dispose', () => {
    const scope = createScope();
    const simpleProvider: Provider<number> = () => 1;
    scope.read(simpleProvider);

    // Check internal state exists (indirectly)
    expect(() => scope.read(simpleProvider)).not.toThrow();

    scope.dispose();

    // Accessing internal map after dispose isn't directly possible,
    // but reading should throw, indicating cleanup happened.
    expect(() => scope.read(simpleProvider)).toThrowError('Scope has been disposed');
    // We could potentially expose the map size for testing, but throwing is a good indicator.
  });

  it('should throw error when getting updater from a disposed scope', () => {
    const scope = createScope();
    const counterProvider = stateProvider(0);
    scope.read(counterProvider); // Initialize
    scope.dispose();

    expect(() => scope.updater(counterProvider)).toThrowError('Scope has been disposed');
  });

  it('should throw error when watching a disposed scope', () => {
    const scope = createScope();
    const counterProvider = stateProvider(0);
    const listener = vi.fn();
    scope.read(counterProvider); // Initialize
    scope.dispose();

    expect(() => scope.watch(counterProvider, listener)).toThrowError('Scope has been disposed');
  });
});

// --- Auto-Dispose Tests ---

it('should auto-dispose state when last listener unsubscribes', () => {
  const scope = createScope();
  const counterProvider = stateProvider(0);
  const listener1 = vi.fn();
  const listener2 = vi.fn();

  // Initialize and add listeners
  scope.read(counterProvider);
  const unsubscribe1 = scope.watch(counterProvider, listener1);
  const unsubscribe2 = scope.watch(counterProvider, listener2);

  // Check state exists (indirectly)
  expect(() => scope.read(counterProvider)).not.toThrow();

  // Unsubscribe one listener - should NOT dispose
  unsubscribe1();
  expect(() => scope.read(counterProvider)).not.toThrow();

  // Unsubscribe the last listener - should dispose
  unsubscribe2();

  // Attempting to read should now throw because the state is disposed
  // Match error message including potential provider name/ID
  expect(() => scope.read(counterProvider)).toThrowError(/its state has been disposed/);
});

it('should NOT auto-dispose state if other listeners exist', () => {
  const scope = createScope();
  const counterProvider = stateProvider(0);
  const listener1 = vi.fn();
  const listener2 = vi.fn();

  scope.read(counterProvider);
  const unsubscribe1 = scope.watch(counterProvider, listener1);
  scope.watch(counterProvider, listener2); // Keep listener2 active

  // Unsubscribe listener1
  unsubscribe1();

  // State should still exist
  expect(() => scope.read(counterProvider)).not.toThrow();
  expect(scope.read(counterProvider)).toBe(0);
});

it('should throw error when watching an auto-disposed provider state', () => {
  const scope = createScope();
  const counterProvider = stateProvider(0);
  const listener1 = vi.fn();
  const listener2 = vi.fn();

  scope.read(counterProvider);
  const unsubscribe = scope.watch(counterProvider, listener1);
  unsubscribe(); // Auto-dispose

  // Attempting to watch again should fail during the initial read
  // Match error message including potential provider name/ID
  expect(() => scope.watch(counterProvider, listener2)).toThrowError(/its state has been disposed/);
});

it('should throw error when getting updater for an auto-disposed provider state', () => {
  const scope = createScope();
  const counterProvider = stateProvider(0);
  const listener = vi.fn();

  scope.read(counterProvider);
  const unsubscribe = scope.watch(counterProvider, listener);
  unsubscribe(); // Auto-dispose

  // Attempting to get updater should fail during the initial read
  // Match error message including potential provider name/ID
  expect(() => scope.updater(counterProvider)).toThrowError(/its state has been disposed/);
});
