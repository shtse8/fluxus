import { describe, it, expect, vi } from 'vitest';
import { computedProvider, isComputedProviderInstance } from './computedProvider.js';
import { stateProvider } from './stateProvider.js';
import { createScope } from '../scope.js';
import { Provider } from '../types.js';

describe('computedProvider', () => {
  it('should create a valid ComputedProviderInstance', () => {
    const provider = computedProvider(() => 'test');
    expect(provider).toBeDefined();
    expect(typeof provider).toBe('function');
    expect(isComputedProviderInstance(provider)).toBe(true);

    const simpleProvider: Provider<string> = () => 'hello';
    expect(isComputedProviderInstance(simpleProvider)).toBe(false);
  });

  it('should compute the initial value when read', () => {
    const scope = createScope();
    const baseProvider = stateProvider(5);
    const derivedProvider = computedProvider((reader) => reader.read(baseProvider) * 2);

    const value = scope.read(derivedProvider);
    expect(value).toBe(10);
  });

  it('should cache the computed value', () => {
    const scope = createScope();
    const computeFn = vi.fn(() => 'computed');
    const derivedProvider = computedProvider(computeFn);

    scope.read(derivedProvider); // First read, computes
    scope.read(derivedProvider); // Second read, should be cached

    expect(computeFn).toHaveBeenCalledTimes(1);
    expect(scope.read(derivedProvider)).toBe('computed');
  });

  it('should recompute when a dependency changes (using read in compute)', () => {
    const scope = createScope();
    const counterProvider = stateProvider(1);
    const computeFn = vi.fn((reader) => reader.read(counterProvider) * 10);
    const derivedProvider = computedProvider(computeFn);

    // Initial read
    expect(scope.read(derivedProvider)).toBe(10);
    expect(computeFn).toHaveBeenCalledTimes(1);

    // Update dependency
    const updater = scope.updater(counterProvider);
    updater(scope, counterProvider, 5);

    // Read derived again - should recompute because it was marked stale
    expect(scope.read(derivedProvider)).toBe(50);
    expect(computeFn).toHaveBeenCalledTimes(2); // Called again

    // Read again - should be cached now
    expect(scope.read(derivedProvider)).toBe(50);
    expect(computeFn).toHaveBeenCalledTimes(2);
  });

   it('should recompute when a dependency changes (using watch in compute)', () => {
    // Note: reader.watch currently behaves like reader.read for dependency tracking,
    // but using it signifies intent to react to changes.
    const scope = createScope();
    const counterProvider = stateProvider(1);
    const computeFn = vi.fn((reader) => reader.watch(counterProvider) * 10); // Use watch
    const derivedProvider = computedProvider(computeFn);

    expect(scope.read(derivedProvider)).toBe(10);
    expect(computeFn).toHaveBeenCalledTimes(1);

    const updater = scope.updater(counterProvider);
    updater(scope, counterProvider, 5);

    expect(scope.read(derivedProvider)).toBe(50);
    expect(computeFn).toHaveBeenCalledTimes(2);

    expect(scope.read(derivedProvider)).toBe(50);
    expect(computeFn).toHaveBeenCalledTimes(2);
  });


  it('should handle multiple dependencies', () => {
    const scope = createScope();
    const providerA = stateProvider(10);
    const providerB = stateProvider(5);
    const computeFn = vi.fn((reader) => reader.read(providerA) + reader.read(providerB));
    const derivedProvider = computedProvider(computeFn);

    expect(scope.read(derivedProvider)).toBe(15);
    expect(computeFn).toHaveBeenCalledTimes(1);

    // Update A
    scope.updater(providerA)(scope, providerA, 20);
    expect(scope.read(derivedProvider)).toBe(25);
    expect(computeFn).toHaveBeenCalledTimes(2);

    // Update B
    scope.updater(providerB)(scope, providerB, 7);
    expect(scope.read(derivedProvider)).toBe(27);
    expect(computeFn).toHaveBeenCalledTimes(3);

    // Read again, should be cached
    expect(scope.read(derivedProvider)).toBe(27);
    expect(computeFn).toHaveBeenCalledTimes(3);
  });

  it('should handle chained computed providers', () => {
      const scope = createScope();
      const baseProvider = stateProvider(2);
      const computeFn1 = vi.fn((reader) => reader.read(baseProvider) * 2);
      const derived1 = computedProvider(computeFn1);
      const computeFn2 = vi.fn((reader) => reader.read(derived1) + 1);
      const derived2 = computedProvider(computeFn2);

      expect(scope.read(derived2)).toBe(5); // 2*2 + 1
      expect(computeFn1).toHaveBeenCalledTimes(1);
      expect(computeFn2).toHaveBeenCalledTimes(1);

      // Update base
      scope.updater(baseProvider)(scope, baseProvider, 3);

      // Read final derived - should trigger recomputation down the chain
      expect(scope.read(derived2)).toBe(7); // 3*2 + 1
      expect(computeFn1).toHaveBeenCalledTimes(2); // Recomputed
      expect(computeFn2).toHaveBeenCalledTimes(2); // Recomputed

      // Read again - cached
      expect(scope.read(derived2)).toBe(7);
      expect(computeFn1).toHaveBeenCalledTimes(2);
      expect(computeFn2).toHaveBeenCalledTimes(2);
  });

  // Test interaction with auto-dispose (if applicable - computed might not auto-dispose itself directly)
  // For now, computed providers rely on their dependencies for lifecycle.
  // If a computed provider reads a state provider that auto-disposes, reading the computed
  // provider again should fail because the dependency read fails.
  it('should fail read if dependency was auto-disposed', () => {
      const scope = createScope();
      const counterProvider = stateProvider(100);
      const listener = vi.fn();
      const derivedProvider = computedProvider((reader) => reader.read(counterProvider) + 5);

      // Initialize both
      scope.read(derivedProvider);
      const unsubscribe = scope.watch(counterProvider, listener); // Add listener to counter

      // Unsubscribe - should auto-dispose counterProvider state
      unsubscribe();

      // Reading derived should now fail because its dependency (counterProvider) is disposed
  
  
      expect(() => scope.read(derivedProvider)).toThrowError(
          'Cannot read provider: its state has been disposed'
      );
  });

});