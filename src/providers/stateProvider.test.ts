import { describe, it, expect, vi } from 'vitest';
import { stateProvider, isStateProviderInstance } from './stateProvider.js';
import { createScope } from '../scope.js';
import { Provider } from '../types.js';

describe('stateProvider', () => {
  it('should create a valid StateProviderInstance', () => {
    const provider = stateProvider(0);
    expect(provider).toBeDefined();
    expect(typeof provider).toBe('function'); // The provider itself is a function
    // Check for the specific properties or symbols that identify it if needed
    expect(isStateProviderInstance(provider)).toBe(true);

    // Also test the type guard with a non-state provider
    const simpleProvider: Provider<string> = () => 'hello';
    expect(isStateProviderInstance(simpleProvider)).toBe(false);
  });

  it('should provide the initial value when read', () => {
    const scope = createScope();
    const counterProvider = stateProvider(123);
    const value = scope.read(counterProvider);
    expect(value).toBe(123);
  });

  it('should allow updating the value via the updater from scope', () => {
    const scope = createScope();
    const counterProvider = stateProvider(0);

    scope.read(counterProvider); // Initialize
    const updater = scope.updater(counterProvider);

    updater(scope, counterProvider, 10);
    expect(scope.read(counterProvider)).toBe(10);

    updater(scope, counterProvider, (prev) => prev * 2);
    expect(scope.read(counterProvider)).toBe(20);
  });

  it('should notify listeners attached via scope.watch when updated', () => {
    const scope = createScope();
    const counterProvider = stateProvider('initial');
    const listener = vi.fn();

    scope.read(counterProvider); // Initialize
    const unsubscribe = scope.watch(counterProvider, listener);

    const updater = scope.updater(counterProvider);
    updater(scope, counterProvider, 'updated');

    expect(listener).toHaveBeenCalledTimes(1);
    // Listener is just notified, doesn't receive the value directly in this model

    updater(scope, counterProvider, 'updated again');
    expect(listener).toHaveBeenCalledTimes(2);
    // Listener is just notified

    unsubscribe();

    updater(scope, counterProvider, 'final update');
    expect(listener).toHaveBeenCalledTimes(2); // Should not be called after unsubscribe
  });

  // Add more tests if specific behaviors of the stateProvider factory itself
  // (not its interaction with Scope) need verification.
});