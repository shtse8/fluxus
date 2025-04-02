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
import { Scope } from '../scope.js'; // Needed for type hints, though not used directly here

// --- Stream/Subscription Interfaces (Simplified) ---

/** Represents an object that can be subscribed to. */
interface Subscribable<T> {
  subscribe(observer: Observer<T>): Subscription;
}

/** Observer interface for stream events. */
interface Observer<T> {
  next?: (value: T) => void;
  error?: (err: unknown) => void;
  complete?: () => void;
}

/** Represents an active subscription that can be cancelled. */
interface Subscription {
  unsubscribe(): void;
}

// --- Type Definitions ---

/** Unique symbol to identify StreamProvider instances */
export const $streamProvider = Symbol('$streamProvider');

/**
 * Represents an instance of a StreamProvider.
 * It acts as a Provider<AsyncValue<T>> for reading the latest stream value.
 * It carries metadata via a symbol to distinguish it during initialization.
 * @template T The type of the data emitted by the stream.
 */
export interface StreamProviderInstance<T> extends Provider<AsyncValue<T>> {
  [$streamProvider]: {
    /** The function that creates the stream source. */
    create: (read: ScopeReader) => Subscribable<T>;
    /** An optional name for debugging. */
    name?: string;
  };
  readonly type?: 'streamProvider';
}

/**
 * Type guard to check if a value is a StreamProviderInstance.
 * @template T The potential type of the data.
 * @param value The value to check.
 * @returns True if the value is a StreamProviderInstance, false otherwise.
 */
export function isStreamProviderInstance<T>(value: unknown): value is StreamProviderInstance<T> {
  return (
    typeof value === 'function' && Object.prototype.hasOwnProperty.call(value, $streamProvider)
  );
}

/**
 * Internal state structure for a StreamProvider within a Scope.
 * @template T The type of the data.
 * @internal
 */
export interface StreamProviderState<T> {
  /** The current AsyncValue state (loading, data, or error). */
  value: AsyncValue<T>;
  /** Function to notify listeners of state changes. */
  notifyListeners: () => void;
  /** The active subscription to the stream. */
  subscription?: Subscription;
  /** Cleanup function registered via onDispose. */
  onDisposeCallback?: Dispose;
  /** Flag indicating if the stream has completed or errored. */
  isTerminated: boolean;
}

// --- Factory Function ---

/**
 * Creates a StreamProvider.
 *
 * A StreamProvider manages the state derived from an asynchronous stream
 * (like an RxJS Observable, WebSocket stream, etc.). It subscribes to the
 * stream and exposes the latest emitted value as an `AsyncValue<T>`.
 *
 * @template T The type of data the stream emits.
 * @param create A function that takes a ScopeReader and returns a Subscribable<T>
 *        (an object with a `subscribe` method).
 * @returns An StreamProviderInstance.
 *
 * @example
 * // Example with a conceptual timer stream
 * const timerProvider = streamProvider<number>((read) => {
 *   let count = 0;
 *   const intervalId = setInterval(() => {
 *     // How to push value to subscribers? Need an Observable-like object.
 *     // This example needs refinement based on actual stream implementation.
 *   }, 1000);
 *
 *   read.onDispose(() => clearInterval(intervalId));
 *
 *   // Return an object conforming to Subscribable<number>
 *   return {
 *      subscribe: (observer) => {
 *          // Simplified: Need proper implementation to emit count
 *          observer.next?.(count); // Emit initial value?
 *          // ... logic to emit subsequent values ...
 *          return { unsubscribe: () => clearInterval(intervalId) };
 *      }
 *   };
 * });
 */
export function streamProvider<T>(
  create: (read: ScopeReader) => Subscribable<T>,
  options?: ProviderOptions
): StreamProviderInstance<T> {
  // The provider function itself just returns the current AsyncValue state.
  // The actual logic happens during initialization within the Scope.
  const providerFn = (scope: Scope): AsyncValue<T> => {
    // Scope.read will handle initialization and return the current state
    return scope.read(providerFn as unknown as StreamProviderInstance<T>);
  };

  // Attach metadata using the symbol
  Object.defineProperty(providerFn, $streamProvider, {
    value: { create, name: options?.name },
    enumerable: false,
  });

  // Add type property for easier identification if needed
  Object.defineProperty(providerFn, 'type', {
    value: 'streamProvider',
    enumerable: false,
    configurable: true,
    writable: false,
  });

  return providerFn as unknown as StreamProviderInstance<T>;
}
