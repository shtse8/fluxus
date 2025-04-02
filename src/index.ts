/**
 * @module fluxus/core
 * This is the main entry point for the core Fluxus library.
 * It exports the essential building blocks for creating and managing state.
 */

// Core Scope Functionality
export { Scope, createScope } from './scope.js';

// Provider Types & Utilities
export type {
  Provider,
  ScopeReader,
  Dispose,
  Disposable,
    // AsyncValue types
    AsyncValue,
    AsyncLoading,
    AsyncData,
    AsyncError
} from './types.js';
export { isProvider } from './types.js'; // Export value separately
export { isLoading, hasData, hasError } from './types.js'; // Export AsyncValue type guards

// StateProvider
export {
  stateProvider,
  isStateProviderInstance
} from './providers/stateProvider.js';

// Export types related to StateProvider separately if needed for clarity
export type {
  StateProviderInstance,
  StateUpdater
} from './providers/stateProvider.js';

// ComputedProvider
export {
  computedProvider,
  isComputedProviderInstance
} from './providers/computedProvider.js';
export type { ComputedProviderInstance } from './providers/computedProvider.js';


// AsyncProvider
export { asyncProvider, isAsyncProviderInstance } from './providers/asyncProvider.js';
export type { AsyncProviderInstance } from './providers/asyncProvider.js';
// Future exports:
// export * from './providers/futureProvider';
// export * from './utils/pipe';