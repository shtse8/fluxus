/**
 * Represents a function that can be called to clean up resources or subscriptions.
 * @returns {void}
 */
export type Dispose = () => void;

/**
 * Represents an object that holds a disposable resource or manages a lifecycle
 * that requires explicit cleanup.
 */
export interface Disposable {
  /**
   * Disposes of the resource or ends the lifecycle managed by this object.
   * Calling dispose multiple times should be safe (idempotent).
   */
  dispose: Dispose;
}

/**
 * Provides read access to other providers within the current scope and methods
 * for managing the lifecycle of the current provider's state.
 * Passed to the provider's creation function.
 */
export interface ScopeReader {
  /**
   * Reads the current value of a provider without subscribing to updates.
   * If the provider is not yet initialized in the scope, it will be created.
   * @param provider The provider to read.
   * @template P The type of the value provided by the dependency provider.

   * @param provider The dependency provider to read.
   * @returns The current value of the dependency provider within the current scope.
   */
  read<T>(provider: Provider<T>): T;

  /**
   * Watches the value of a provider and subscribes to updates.
   * This is typically used by reactive providers or UI bindings.
   * @template P The type of the value provided by the dependency provider.
   * @param provider The dependency provider to watch.
   * @returns The current value of the provider.
   */
  watch<T>(provider: Provider<T>): T; // Implementation detail: watching implies reading

  /**
   * Adds a cleanup function to be called when the provider's state
   * associated with the current scope is disposed.
   * @param callback The cleanup function to be executed.
   */
  onDispose(callback: Dispose): void;

  /**
   * An AbortSignal that is aborted when the provider's state is disposed.
   * This can be used to cancel asynchronous operations like `fetch` requests
   * when the provider is no longer needed.
   * Only relevant for async providers.
   */
  readonly signal?: AbortSignal;
}

// --- Async Value Types ---

/** Represents the state of an asynchronous operation: Loading */
/** Represents the state of an asynchronous operation: Loading. May contain previous data if reloading after an error and keepPreviousDataOnError is true. */
export type AsyncLoading = Readonly<{ state: 'loading'; previousData?: unknown }>;

/** Represents the state of an asynchronous operation: Data Available */
export type AsyncData<T> = Readonly<{ state: 'data'; data: T }>;

/** Represents the state of an asynchronous operation: Error Occurred */
/** Represents the state of an asynchronous operation: Error Occurred. May contain previous data if keepPreviousDataOnError is true. */
export type AsyncError = Readonly<{
  state: 'error';
  error: unknown;
  stackTrace?: string;
  previousData?: unknown;
}>;

/**
 * A union type representing the possible states of an asynchronous operation:
 * loading, data, or error.
 *
 * Inspired by Riverpod's AsyncValue.
 */
export type AsyncValue<T> = AsyncLoading | AsyncData<T> | AsyncError;

// --- Type Guards for AsyncValue ---

/** Type guard to check if an AsyncValue is in the loading state. */
export function isLoading<T>(value: AsyncValue<T>): value is AsyncLoading {
  return value.state === 'loading';
}

/** Type guard to check if an AsyncValue is in the data state. */
export function hasData<T>(value: AsyncValue<T>): value is AsyncData<T> {
  return value.state === 'data';
}

/**
 * Represents overriding a provider with another provider or a direct value
 * within a specific Scope.
 */
export interface ProviderOverride {
  /** The original provider to override. */
  provider: Provider<unknown>; // Changed any to unknown
  /** The overriding provider or value. */
  useValue: Provider<unknown> | unknown; // Changed any to unknown
}

/** Type guard to check if an AsyncValue is in the error state. */
export function hasError<T>(value: AsyncValue<T>): value is AsyncError {
  return value.state === 'error';
}

/**
 * Optional configuration for providers.
 */
export interface ProviderOptions {
  /**
   * An optional name for debugging purposes.
   * This name might be used in logging or error messages.
   */
  name?: string;
}

/**
 * Optional configuration specifically for AsyncProviders.
 */
export interface AsyncProviderOptions extends ProviderOptions {
  /**
   * If true, when the async operation fails after having previously succeeded,
   * the provider will continue to expose the last successful data in the
   * `AsyncError` state's `previousData` field. Defaults to false.
   */
  keepPreviousDataOnError?: boolean;
}

/**
 * The core building block of Fluxus. A Provider defines how to create a value
 * within a specific scope. Providers are functions or objects that encapsulate
 * state creation logic.
 *
 * Providers are typically created using factory functions like `stateProvider`,
 * `computedProvider`, etc.
 *
 * They are identified by object identity, meaning you don't register them
 * with strings; you use the provider function/object itself as the key.
 *
 * @template T The type of the value created by the provider.
 * @param reader A {@link ScopeReader} instance to interact with the scope.
 * @returns The created value of type T.
 */
export type Provider<T> = (reader: ScopeReader) => T;

/** A unique symbol to identify providers internally. */
export const $provider = Symbol.for('fluxus.provider');

/**
 * A basic type guard to check if an unknown value is potentially a Fluxus provider.
 * Note: This is a very basic check and might need refinement if provider
 * structures become more complex (e.g., objects with specific methods).
 * @template T The potential type provided by the provider.
 * @param obj The value to check.
 * @returns True if the value is a function (the basic form of a provider), false otherwise.
 */
export function isProvider<T>(obj: unknown): obj is Provider<T> {
  return typeof obj === 'function';
}

// More specific provider types (like StateProvider, ComputedProvider) will extend or utilize this base concept.
