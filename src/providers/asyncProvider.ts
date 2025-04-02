import {
  AsyncValue,
  // AsyncLoading, // Unused import
  // AsyncData, // Unused import
  // AsyncError, // Unused import
  Provider,
  ScopeReader,
  Dispose,
  ProviderOptions,
} from '../types.js';
import { Scope } from '../scope.js'; // Assuming Scope class handles state management

// Unique symbol to identify AsyncProvider instances
export const $asyncProvider = Symbol('$asyncProvider');

/**
 * Represents an instance of an AsyncProvider.
 * It acts as a Provider<AsyncValue<T>> for reading the async state.
 * It carries metadata via a symbol to distinguish it during initialization.
 * @template T The type of the data produced by the async operation.
 */
export interface AsyncProviderInstance<T> extends Provider<AsyncValue<T>> {
  [$asyncProvider]: {
    /** The asynchronous function that produces the value. */
    create: (read: ScopeReader) => Promise<T>;
    /** An optional name for debugging. */
    name?: string;
  };
  // Add provider type identifier for potential future use/debugging
  readonly type?: 'asyncProvider';
}

/**
 * Type guard to check if a value is an AsyncProviderInstance.
 * @template T The potential type of the data.
 * @param value The value to check.
 * @returns True if the value is an AsyncProviderInstance, false otherwise.
 */
export function isAsyncProviderInstance<T>(value: unknown): value is AsyncProviderInstance<T> {
  return typeof value === 'function' && Object.prototype.hasOwnProperty.call(value, $asyncProvider);
}

/**
 * Internal state structure for an AsyncProvider within a Scope.
 * @template T The type of the data.
 * @internal
 */
export interface AsyncProviderState<T> {
  /** The current AsyncValue state (loading, data, or error). */
  value: AsyncValue<T>;
  /** Function to notify listeners of state changes. */
  notifyListeners: () => void;
  /** Set of listener callbacks. */
  listeners: Set<() => void>;
  /** Cleanup function registered via onDispose. */
  onDisposeCallback?: Dispose;
  /** AbortController for cancellable async operations (optional). */
  abortController?: AbortController;
  /** Flag to prevent duplicate executions while pending. */
  isExecuting: boolean;
  /** The promise representing the current execution */
  currentExecution?: Promise<void>;
}

/**
 * Creates an AsyncProvider.
 *
 * An AsyncProvider manages the state of an asynchronous operation,
 * typically represented by a Promise. It exposes the state as an `AsyncValue<T>`,
 * transitioning through loading, data, and error states.
 *
 * @template T The type of data the asynchronous operation produces.
 * @param create A function that takes a ScopeReader (which includes an optional `signal` property for cancellation) and returns a Promise resolving to the data.
 * @returns An AsyncProviderInstance.
 *
 * @example
 * const userProvider = asyncProvider(async (reader) => {
 *   const userId = reader.read(userIdProvider);
 *   // Pass the signal from the reader to fetch for cancellation
 *   const response = await fetch(`/api/users/${userId}`, { signal: reader.signal });
 *   if (!response.ok) {
 *     // Handle potential AbortError if the request was cancelled
 *     if (response.status === 0 && reader.signal?.aborted) {
 *       console.log('User fetch aborted.');
 *       // You might want to throw a specific error or return a default state
 *       throw new Error('Fetch aborted');
 *     }
 *     throw new Error('Failed to fetch user');
 *   }
 *   return await response.json() as User;
 * });
 */
export function asyncProvider<T>(
  create: (read: ScopeReader) => Promise<T>,
  options?: ProviderOptions
): AsyncProviderInstance<T> {
  // The provider function itself just returns the current AsyncValue state.
  // The actual logic happens during initialization within the Scope.
  const providerFn = (scope: Scope): AsyncValue<T> => {
    // Scope.read will handle initialization and return the current state
    return scope.read(providerFn as unknown as AsyncProviderInstance<T>);
  };

  // Attach metadata using the symbol
  Object.defineProperty(providerFn, $asyncProvider, {
    value: { create, name: options?.name },
    enumerable: false,
  });

  // Add type property for easier identification if needed
  Object.defineProperty(providerFn, 'type', {
    value: 'asyncProvider',
    enumerable: false, // Don't show up in normal object iteration
    configurable: true, // Allow potential redefinition if necessary
    writable: false,
  });

  return providerFn as unknown as AsyncProviderInstance<T>;
}
