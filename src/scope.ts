import { Provider, ScopeReader, Dispose, Disposable, isProvider, AsyncValue, hasData } from './types.js'; // Added AsyncValue, hasData
import {
  StateProviderInstance,
  isStateProviderInstance,
  StateUpdater,
  StateProviderState,
  $stateProvider
} from './providers/stateProvider.js';
import {
    ComputedProviderInstance,
    isComputedProviderInstance,
    $computedProvider
} from './providers/computedProvider.js';
// Import Async types
import {
    AsyncProviderInstance,
    isAsyncProviderInstance,
    AsyncProviderState as AsyncProviderInternalStateDefinition, // Rename for clarity
    $asyncProvider // Now correctly exported
    // AsyncValue is imported from types.js now
} from './providers/asyncProvider.js';
// Import Stream types
import {
    StreamProviderInstance,
    isStreamProviderInstance,
    StreamProviderState as StreamProviderInternalStateDefinition, // Rename for clarity
    $streamProvider
} from './providers/streamProvider.js';


// --- Internal State Types ---

/** Common fields for all internal provider states within a scope. */
let internalStateIdCounter = 0; // Counter for unique IDs

interface BaseInternalState extends Disposable {
  /** Unique ID for debugging state instances */
  readonly internalId: number;
  /** Explicitly add dispose signature to help TS inference */
  dispose: Dispose;
  /** List of functions to call when this state is disposed. */
  disposeCallbacks: Set<Dispose>;
  /** Set of providers that this provider depends on. */
  dependencies: Set<Provider<any>>;
  /** Set of providers that depend on this provider. */
  dependents: Set<Provider<any>>;
  /** Flag indicating if the value is currently being computed (to detect circular dependencies). */
  isComputing: boolean;
  /** Flag indicating if the state has been disposed. */
  isDisposed: boolean;
  /** Flag indicating if the provider's value might be outdated due to dependency changes. */
  isStale: boolean;
  /** Set of listener callbacks subscribed via scope.watch(). */
  listeners: Set<() => void>;
  /** Function to notify listeners of state changes. */
  notifyListeners: () => void;
}

/** Internal state for regular (non-StateProvider, non-AsyncProvider) providers. */
interface GenericProviderState<T> extends BaseInternalState {
  type: 'generic';
  /** The computed value of the provider. */
  value: T;
}

/** Internal state specific to StateProviders. */
interface StateProviderInternalState<T> extends BaseInternalState {
  type: 'state';
  /** The specific state managed by the StateProvider (value, updater). */
  stateProviderState: StateProviderState<T>; // Holds value and listeners
}

/** Internal state specific to AsyncProviders. */
interface AsyncProviderInternalState<T> extends BaseInternalState {
    type: 'async';
    /** The specific state managed by the AsyncProvider. */
    asyncProviderState: AsyncProviderInternalStateDefinition<T>; // Holds AsyncValue, execution state etc.
}

/** Internal state specific to StreamProviders. */
interface StreamProviderInternalState<T> extends BaseInternalState {
    type: 'stream';
    /** The specific state managed by the StreamProvider. */
    streamProviderState: StreamProviderInternalStateDefinition<T>; // Holds AsyncValue, subscription etc.
}

/** Union type for all possible internal states stored in the scope. */
type InternalState<T> = GenericProviderState<T> | StateProviderInternalState<T> | AsyncProviderInternalState<T> | StreamProviderInternalState<T>;

// Type guard for StateProviderInternalState
function isStateProviderInternalState<T>(
  state: InternalState<any> | undefined
): state is StateProviderInternalState<any> {
  return state?.type === 'state';
}

// Type guard for AsyncProviderInternalState
function isAsyncProviderInternalState<T>(
    state: InternalState<any> | undefined
): state is AsyncProviderInternalState<any> {
    return state?.type === 'async';
}

// Type guard for StreamProviderInternalState
function isStreamProviderInternalState<T>(
    state: InternalState<any> | undefined
): state is StreamProviderInternalState<any> {
    return state?.type === 'stream';
}


/**
 * Manages the state and lifecycle of providers within a specific context.
 * Scopes can be nested to allow for overriding providers in different parts
 * of an application. Each scope maintains its own instance of provider states.
 *
 * @implements {Disposable}
 */
export class Scope implements Disposable {
  /** Stores the state associated with each provider within this scope. */
  private providerStates = new Map<Provider<any>, InternalState<any>>();
  /** Optional parent scope for provider overrides and nesting. */
  private parent: Scope | null;
  /** Flag indicating if the scope itself has been disposed. */
  private _isDisposed = false;

  /**
   * Indicates whether the scope has been disposed. Once disposed, a scope
   * cannot be used to read or initialize providers.
   * @returns {boolean} True if the scope is disposed, false otherwise.
   */
  public get isDisposed(): boolean {
      return this._isDisposed;
  }

  /**
   * Creates a new Scope instance.
   * @param {Scope | null} [parent=null] - An optional parent scope.
   */
  constructor(parent: Scope | null = null) {
    this.parent = parent;
  }

  /** Checks if the scope or its ancestors have been disposed. */
  private checkDisposed(): void {
    if (this._isDisposed) {
      throw new Error('Scope has been disposed');
    }
  }

  /**
   * Reads the current value of a given provider within this scope.
   * Handles initialization, caching, staleness checks, and recomputation.
   *
   * @template T The type of the value provided.
   * @param {Provider<T>} provider The provider function/object to read.
   * @returns {T} The current value of the provider.
   * @throws {Error} If the scope or provider state is disposed or a circular dependency is detected.
   */
  public read<T>(provider: Provider<T>): T {
    this.checkDisposed();

    let state = this.providerStates.get(provider) as InternalState<T> | undefined;

    if (state) {
      // State exists
      if (state.isComputing) throw new Error('Circular dependency detected');
      if (state.isDisposed) throw new Error('Cannot read provider: its state has been disposed');

      if (state.isStale) {
        // Recompute if stale (applies to generic/computed)
        if (isStateProviderInternalState(state)) {
          return state.stateProviderState.value; // State providers aren't stale this way
        } else if (isAsyncProviderInternalState(state)) {
          // If stale, execution was triggered by markDependentsStale. Return current value.
          return state.asyncProviderState.value as T;
        } else if (isStreamProviderInternalState(state)) {
          // If stale, dispose old state, re-initialize, copy listeners, return new initial value.
          const oldListeners = new Set(state.listeners); // Copy listeners
          // Explicitly unsubscribe from the old stream *before* creating the new state
          if (isStreamProviderInternalState(state)) {
              state.streamProviderState.subscription?.unsubscribe();
          }
          // Clear callbacks *before* disposing the rest of the old state to prevent
          // potential double-unsubscribe via the callback mechanism in this specific path.
          state.disposeCallbacks.clear();
          state.dispose(); // Dispose the rest (dependents, etc.)
          const newState = this._createProviderStateStructure(provider); // Create new state & subscribe
          // Copy old listeners to the new state
          oldListeners.forEach(listener => newState.listeners.add(listener));
          if (isStreamProviderInternalState(newState)) {
              return newState.streamProviderState.value as T;
          } else {
              console.error(`Inconsistent state type after re-initializing stream provider (ID: ${newState.internalId})`);
              throw new Error('Internal error: Inconsistent provider state type');
          }
        } else {
          // Generic/Computed: Recompute value directly
          return this._computeAndCacheValue(provider, state as GenericProviderState<T>);
        }
      } else {
        // Return cached value
        if (isStateProviderInternalState(state)) {
          return state.stateProviderState.value;
        } else if (isAsyncProviderInternalState(state)) {
          return state.asyncProviderState.value as T;
        } else if (isStreamProviderInternalState(state)) {
          return state.streamProviderState.value as T;
        } else {
          return (state as GenericProviderState<T>).value;
        }
      }
    } else {
      // Initialize state
      const newState = this._createProviderStateStructure(provider);
      if (isStateProviderInternalState(newState)) {
        return newState.stateProviderState.value;
      } else if (isAsyncProviderInternalState(newState)) {
        return newState.asyncProviderState.value as T;
      } else if (isStreamProviderInternalState(newState)) {
        return newState.streamProviderState.value as T;
      } else {
        // Generic/Computed needs initial computation
        return this._computeAndCacheValue(provider, newState as GenericProviderState<T>);
      }
    }
  }

   /**
   * Creates the internal state structure for a given provider.
   * @private
   */
  private _createProviderStateStructure<T>(provider: Provider<T>): InternalState<T> {
    const dependencies = new Set<Provider<any>>();
    const dependents = new Set<Provider<any>>();
    const disposeCallbacks = new Set<Dispose>();
    const listeners = new Set<() => void>();
    const internalId = internalStateIdCounter++;

    const placeholderState: Partial<BaseInternalState> & { type: string } = {
        internalId, type: 'generic', isComputing: true, isDisposed: false, isStale: false,
        dependencies, dependents, disposeCallbacks, listeners,
        notifyListeners: () => {}, dispose: () => {}
    };
    this.providerStates.set(provider, placeholderState as InternalState<any>);

    const baseDisposeLogic = (stateRef: InternalState<any>, providerKey: Provider<any>) => {
        if (stateRef.isDisposed) return;
        this.markDependentsStale(providerKey, new Set());
        stateRef.isDisposed = true;
        stateRef.listeners.clear();
        stateRef.disposeCallbacks.forEach(cb => { try { cb() } catch (e) { console.error("Error during dispose callback:", e)} });
        stateRef.disposeCallbacks.clear();
        stateRef.dependencies.forEach(depProvider => {
            const depState = this.providerStates.get(depProvider);
            if (depState?.dependents) {
                 depState.dependents.delete(providerKey);
            }
        });
        stateRef.dependencies.clear();
        stateRef.dependents.clear();
        if (isAsyncProviderInternalState(stateRef)) {
            stateRef.asyncProviderState.abortController?.abort();
        }
        // Stream unsubscription is handled via disposeCallbacks added during initialization
    };

    const notifyListeners = () => {
        Array.from(listeners).forEach(listener => { try { listener() } catch(e) { console.error("Error in listener callback:", e)} });
    };

    let internalState: InternalState<T>;

    const initReader: ScopeReader = {
        read: <P>(dep: Provider<P>) => this._trackDependency(dep, provider, dependencies),
        watch: <P>(dep: Provider<P>) => this._trackDependency(dep, provider, dependencies),
        onDispose: (cb: Dispose) => disposeCallbacks.add(cb),
    };

    // --- Determine Provider Type and Initialize State ---

    if (isStateProviderInstance<T>(provider)) {
      const stateProviderState = (provider as any)[$stateProvider].initializeState(initReader, internalId);
      internalState = {
        internalId, type: 'state', stateProviderState, disposeCallbacks, dependencies,
        dependents, isComputing: false, isDisposed: false, isStale: false,
        listeners, notifyListeners, dispose: () => baseDisposeLogic(internalState, provider),
      };
    } else if (isAsyncProviderInstance<T>(provider)) {
        const initialValue: AsyncValue<any> = { state: 'loading' };
        const abortController = new AbortController();
        const asyncState: AsyncProviderInternalStateDefinition<any> = {
            value: initialValue, listeners: new Set(), notifyListeners,
            onDisposeCallback: undefined, abortController, isExecuting: false, currentExecution: undefined,
        };
        internalState = {
            internalId, type: 'async', asyncProviderState: asyncState, disposeCallbacks, dependencies,
            dependents, isComputing: false, isDisposed: false, isStale: false,
            listeners, notifyListeners, dispose: () => baseDisposeLogic(internalState, provider),
        };
        this._executeAsyncProvider(provider as AsyncProviderInstance<any>, internalState);

    } else if (isStreamProviderInstance<T>(provider)) {
        const initialValue: AsyncValue<any> = { state: 'loading' };
        const streamState: StreamProviderInternalStateDefinition<any> = {
            value: initialValue, notifyListeners, subscription: undefined,
            onDisposeCallback: undefined, isTerminated: false,
        };
        internalState = {
            internalId, type: 'stream', streamProviderState: streamState, disposeCallbacks, dependencies,
            dependents, isComputing: false, isDisposed: false, isStale: false,
            listeners, notifyListeners, dispose: () => baseDisposeLogic(internalState, provider),
        };
        try {
            const subscribable = (provider as any)[$streamProvider].create(initReader);
            let unsubscribed = false;
            const unsubscribeLogic = () => {
                if (unsubscribed) return;
                unsubscribed = true;
                streamState.subscription?.unsubscribe();
            };
            disposeCallbacks.add(unsubscribeLogic); // Add core unsubscribe logic

            streamState.subscription = subscribable.subscribe({
                next: (data: T) => {
                    if (internalState.isDisposed || streamState.isTerminated) return;
                    streamState.value = { state: 'data', data };
                    internalState.notifyListeners();
                    this.markDependentsStale(provider, new Set());
                },
                error: (error: unknown) => {
                    if (internalState.isDisposed || streamState.isTerminated) return;
                    console.error(`Error in streamProvider (ID: ${internalId}):`, error);
                    const previousData = hasData(streamState.value) ? streamState.value.data : undefined;
                    streamState.value = { state: 'error', error, previousData };
                    streamState.isTerminated = true;
                    unsubscribeLogic(); // Unsubscribe on error
                    internalState.notifyListeners();
                    this.markDependentsStale(provider, new Set());
                },
                complete: () => {
                    if (internalState.isDisposed || streamState.isTerminated) return;
                    streamState.isTerminated = true;
                    unsubscribeLogic(); // Unsubscribe on completion
                }
            });
        } catch (error: unknown) {
             console.error(`Error creating stream for streamProvider (ID: ${internalId}):`, error);
             streamState.value = { state: 'error', error };
             streamState.isTerminated = true;
        }
    } else {
      // Generic / Computed Provider
        internalState = {
          internalId, type: 'generic', value: undefined as T, disposeCallbacks, dependencies,
          dependents, isComputing: false, isDisposed: false, isStale: true, // Generic/Computed start stale
          listeners, notifyListeners, dispose: () => baseDisposeLogic(internalState, provider),
        };
    }

    // Replace placeholder and return the created structure
    this.providerStates.set(provider, internalState);
    return internalState;
  }

  /**
   * Computes or recomputes the value for a generic or computed provider.
   * @private
   */
  private _computeAndCacheValue<T>(
    provider: Provider<T>,
    state: GenericProviderState<T>
  ): T {
    const dependencies = new Set<Provider<any>>();
    state.dependencies.forEach(oldDepProvider => {
        const oldDepState = this.providerStates.get(oldDepProvider);
        if (oldDepState?.dependents) {
            oldDepState.dependents.delete(provider);
        }
    });
    state.dependencies.clear();

    const reader: ScopeReader = {
      read: <P>(depProvider: Provider<P>): P => this._trackDependency(depProvider, provider, dependencies),
      watch: <P>(depProvider: Provider<P>): P => this._trackDependency(depProvider, provider, dependencies),
      onDispose: (callback: Dispose): void => {
        if (state.isDisposed) return;
        state.disposeCallbacks.add(callback);
      }
    };

    state.isComputing = true;
    let newValue: T;
    try {
      if (isComputedProviderInstance<T>(provider)) {
        newValue = (provider as any)[$computedProvider].compute(reader);
      } else {
        newValue = provider(reader); // Generic provider function
      }

      if (!Object.is(state.value, newValue)) {
          state.value = newValue;
          // state.notifyListeners(); // Optionally notify for generic/computed?
      }
      state.dependencies = dependencies;
      state.isStale = false;
      state.isComputing = false;
      return state.value;

    } catch (error) {
      state.isComputing = false;
      console.error(`Error computing provider (ID: ${state.internalId}):`, error);
      throw error;
    }
  }

  /**
   * Helper method for ScopeReader's read/watch to track dependencies.
   * @private
   */
  private _trackDependency<P>(
    dependencyProvider: Provider<P>,
    dependentProvider: Provider<any>,
    currentDependenciesSet: Set<Provider<any>>
  ): P {
    currentDependenciesSet.add(dependencyProvider);
    const value = this.read(dependencyProvider); // Delegate read
    const dependencyState = this.providerStates.get(dependencyProvider);
    if (dependencyState && !dependencyState.isDisposed) {
         dependencyState.dependents.add(dependentProvider);
    }
    return value;
  }

  /**
   * Executes the async operation for an AsyncProvider.
   * @private
   */
  private _executeAsyncProvider<T>(
      provider: AsyncProviderInstance<T>,
      state: AsyncProviderInternalState<T>
  ): void {
      // Prevent re-execution if already executing or disposed
      if (state.isDisposed || state.asyncProviderState.isExecuting) {
          return;
      }
      // Also prevent starting a new execution if the previous promise hasn't settled yet
      // (though isExecuting flag should normally cover this)
      // if (state.asyncProviderState.currentExecution) {
      //     return;
      // }

      state.asyncProviderState.isExecuting = true;
      const previousData = hasData(state.asyncProviderState.value) ? state.asyncProviderState.value.data : undefined;
      state.asyncProviderState.value = { state: 'loading', previousData };
      state.notifyListeners(); // Notify about loading state

      const reader: ScopeReader = {
          read: <P>(depProvider: Provider<P>): P => this._trackDependency(depProvider, provider, state.dependencies),
          watch: <P>(depProvider: Provider<P>): P => this._trackDependency(depProvider, provider, state.dependencies),
          onDispose: (callback: Dispose): void => {
              if (state.isDisposed) return;
              state.disposeCallbacks.add(callback);
          }
      };

      const promise = (provider as any)[$asyncProvider].create(reader);
      state.asyncProviderState.currentExecution = promise
          .then((data: T) => {
              if (state.isDisposed || state.asyncProviderState.abortController?.signal.aborted) return;
              state.asyncProviderState.value = { state: 'data', data };
              state.asyncProviderState.isExecuting = false;
              state.asyncProviderState.currentExecution = undefined; // Clear current execution promise
              state.notifyListeners();
              this.markDependentsStale(provider, new Set());
          })
          .catch((error: unknown) => {
              if (state.isDisposed || state.asyncProviderState.abortController?.signal.aborted) return;
              console.error(`Error executing asyncProvider (ID: ${state.internalId}):`, error);
              const previousDataOnError = hasData(state.asyncProviderState.value) ? state.asyncProviderState.value.data : undefined;
              state.asyncProviderState.value = { state: 'error', error, previousData: previousDataOnError };
              state.asyncProviderState.isExecuting = false;
              state.asyncProviderState.currentExecution = undefined; // Clear current execution promise
              state.notifyListeners();
              this.markDependentsStale(provider, new Set());
          });
  }


  /**
   * Retrieves the specialized updater function for a StateProviderInstance.
   * @template T The type of the state managed by the StateProvider.
   * @param {StateProviderInstance<T>} provider The StateProviderInstance whose updater is needed.
   * @returns {StateUpdater<T>} The updater function.
   */
  public updater<T>(provider: StateProviderInstance<T>): StateUpdater<T> {
    this.checkDisposed();
    this.read(provider); // Ensure initialized
    const state = this.providerStates.get(provider);

    if (!isStateProviderInternalState<T>(state)) {
         throw new Error('Provider is not a StateProvider or state is inconsistent');
    }
     if (state.isDisposed) {
        throw new Error('Cannot get updater for a disposed provider state');
    }

    // Return a function matching the StateUpdater<T> signature
    return (scope: Scope, providerInstance: StateProviderInstance<T>, newValueOrFn: T | ((prev: T) => T)) => {
        // Check scope disposal *again* inside the returned function
        try {
            // Use the passed scope instance, not 'this'
            scope.checkDisposed();
        } catch (e) {
             return;
        }

        // Use passed providerInstance to get state from the passed scope
        const currentState = scope.providerStates.get(providerInstance) as StateProviderInternalState<T> | undefined;

        if (!currentState || !isStateProviderInternalState(currentState) || currentState.isDisposed) {
            const attemptedId = currentState ? currentState.internalId : 'unknown';
            console.warn(`Attempted to update StateProvider (ID: ${attemptedId}) but its state was not found or was disposed.`);
            return;
        }

        const stateProviderState = currentState.stateProviderState;
        const previousValue = stateProviderState.value;
        const newValue = typeof newValueOrFn === 'function'
            ? (newValueOrFn as (prev: T) => T)(previousValue)
            : newValueOrFn;

        if (!Object.is(previousValue, newValue)) {
            stateProviderState.value = newValue;
            currentState.notifyListeners(); // Notify base listeners
            scope.markDependentsStale(providerInstance, new Set()); // Use passed scope/provider
        }
    };
  }

  /**
   * Recursively marks dependents as stale and notifies listeners.
   * @private
   */
  private markDependentsStale(provider: Provider<any>, visited: Set<Provider<any>>): void {
    const providerState = this.providerStates.get(provider);
    if (visited.has(provider) || !providerState || providerState.isDisposed) {
        return;
    }
    visited.add(provider);

    providerState.dependents.forEach(dependentProvider => {
        const dependentState = this.providerStates.get(dependentProvider);
        if (dependentState && !dependentState.isDisposed) {
            const wasAlreadyStale = dependentState.isStale;
            if (!wasAlreadyStale) {
                 dependentState.isStale = true;
            }
            // If the stale dependent is an async provider, trigger its re-execution.
            // The notification will happen inside _executeAsyncProvider when it sets the loading state.
            if (isAsyncProviderInternalState(dependentState)) {
                this._executeAsyncProvider(dependentProvider as unknown as AsyncProviderInstance<any>, dependentState);
            } else if (isStreamProviderInternalState(dependentState)) {
                // For stream providers, becoming stale means we need to re-subscribe on next read.
                // Do not notify listeners here; notification happens when the *new* stream emits.
            } else {
                // For other types (computed, state), notify listeners about the staleness/change now.
                dependentState.notifyListeners();
            }

            // Recursively mark *its* dependents as stale
            this.markDependentsStale(dependentProvider, visited);
        }
    });
  }

  /**
   * Subscribes a listener function to changes in a specific provider's state.
   * Handles auto-disposal when listener count drops to zero.
   *
   * @template T The type of the value provided.
   * @param {Provider<T>} provider The provider to watch.
   * @param {() => void} callback The function to call on change.
   * @returns {Dispose} A function to call to unsubscribe.
   */
  public watch<T>(provider: Provider<T>, callback: () => void): Dispose {
    this.checkDisposed();
    this.read(provider); // Ensure initialized
    const state = this.providerStates.get(provider);

    if (!state || state.isDisposed) {
      console.warn(`Attempted to watch provider (ID: ${state?.internalId ?? 'N/A'}) but its state was not found or was disposed.`);
      return () => {};
    }

    state.listeners.add(callback); // Add to base listeners

    return () => {
      // Re-fetch state in case it was disposed
      const currentState = this.providerStates.get(provider);
      if (!currentState || currentState.isDisposed) return;

      currentState.listeners.delete(callback);
      if (currentState.listeners.size === 0 && !currentState.isDisposed) {
           // console.log(`DEBUG: Auto-disposing state due to zero listeners (Internal ID: ${currentState.internalId})`);
           currentState.dispose();
      }
    };
  }


  /**
   * Disposes of the scope, cleaning up all provider states.
   */
  public dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._isDisposed = true;

    const statesToDispose = Array.from(this.providerStates.values());
    statesToDispose.forEach(state => {
      if (!state.isDisposed) {
          state.dispose();
      }
    });

    this.providerStates.clear();
    this.parent = null;
  }
}

/**
 * Factory function to create a new {@link Scope}.
 * @param {Scope | null} [parent=null] - An optional parent scope.
 * @returns {Scope} A new Scope instance.
 */
export function createScope(parent: Scope | null = null): Scope {
    return new Scope(parent);
}