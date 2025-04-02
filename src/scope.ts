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
  stateProviderState: StateProviderState<T>; // Holds value and updater logic
}

/** Internal state specific to AsyncProviders. */
interface AsyncProviderInternalState<T> extends BaseInternalState {
    type: 'async';
    /** The specific state managed by the AsyncProvider. */
    asyncProviderState: AsyncProviderInternalStateDefinition<T>; // Holds AsyncValue, execution state etc.
}


/** Union type for all possible internal states stored in the scope. */
type InternalState<T> = GenericProviderState<T> | StateProviderInternalState<T> | AsyncProviderInternalState<T>;

// Type guard for StateProviderInternalState
function isStateProviderInternalState<T>(
  state: InternalState<any> | undefined
): state is StateProviderInternalState<any> { // Use <any> here
  return state?.type === 'state';
}

// Type guard for AsyncProviderInternalState
function isAsyncProviderInternalState<T>(
    state: InternalState<any> | undefined
): state is AsyncProviderInternalState<any> { // Use <any> here
    return state?.type === 'async';
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
  private _isDisposed = false; // Renamed internal flag

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
   * @param {Scope | null} [parent=null] - An optional parent scope. If provided,
   *        this scope can potentially inherit or override providers from the parent
   *        (behavior depends on specific provider implementations and future features).
   */
  constructor(parent: Scope | null = null) {
    this.parent = parent;
  }

  /** Checks if the scope or its ancestors have been disposed. */
  private checkDisposed(): void {
    if (this._isDisposed) { // Use internal flag
      throw new Error('Scope has been disposed');
    }
    // Recursively check parent scopes if necessary, though direct check might suffice
    // if disposal propagates correctly.
  }

  /**
   * Reads the current value of a given provider within this scope.
   *
   * If the provider has already been initialized in this scope, its cached value
   * is returned. If the provider's state is marked as stale (due to a dependency change),
   * it will be recomputed before returning the value.
   *
   * If the provider has not been initialized, its creation function will be executed,
   * its dependencies tracked, and the resulting value cached and returned.
   *
   * Throws an error if the scope or the specific provider state has been disposed,
   * or if a circular dependency is detected during initialization.
   *
   * @template T The type of the value provided.
   * @param {Provider<T>} provider The provider function/object to read.
   * @returns {T} The current value of the provider.
   * @throws {Error} If the scope or provider state is disposed.
   * @throws {Error} If a circular dependency is detected.
   */
  public read<T>(provider: Provider<T>): T {
    this.checkDisposed();

    // 1. Check local cache
    let state = this.providerStates.get(provider) as InternalState<T> | undefined;

    if (state) {
      // State exists in cache
      if (state.isComputing) {
        throw new Error('Circular dependency detected');
      }
      if (state.isDisposed) {
        throw new Error('Cannot read provider: its state has been disposed');
      }
      if (state.isStale) {
        // State is stale, recompute (only applicable to GenericProviderState and potentially Async)
        if (isStateProviderInternalState(state)) {
          // StateProvider value doesn't become stale in the same way, return current value
          return state.stateProviderState.value;
        } else if (isAsyncProviderInternalState(state)) {
            // TODO: Implement re-computation logic for async providers if needed (e.g., refetch on dependency change)
            // For now, return the current async value (loading/data/error)
            return state.asyncProviderState.value as T; // Cast needed as T is AsyncValue<Data>
        } else {
          // Recompute Generic/Computed provider
          return this._computeAndCacheValue(provider, state as GenericProviderState<T>);
        }
      } else {
        // State is valid and not stale, return cached value
        if (isStateProviderInternalState(state)) {
          return state.stateProviderState.value;
        } else if (isAsyncProviderInternalState(state)) {
            return state.asyncProviderState.value as T; // Cast needed
        } else {
          return (state as GenericProviderState<T>).value;
        }
      }
    } else {
      // State not found in cache, initialize structure and compute/trigger value
      const newState = this._createProviderStateStructure(provider);
      if (isStateProviderInternalState(newState)) {
        // StateProvider value was already computed during structure creation
        return newState.stateProviderState.value;
      } else if (isAsyncProviderInternalState(newState)) {
          // AsyncProvider initial value (loading) was set, and execution triggered
          return newState.asyncProviderState.value as T; // Cast needed
      } else {
        // For Generic/Computed, compute the value now using the newly created state structure
        return this._computeAndCacheValue(provider, newState as GenericProviderState<T>);
      }
    }
  }

   /**
   * Creates the internal state structure for a given provider within this scope,
   * but does not compute the initial value unless it's a StateProvider or AsyncProvider.
   * Sets up internal state tracking (dependencies, dependents, lifecycle callbacks).
   * This method is called internally by `read` when a provider is accessed
   * for the first time.
   *
   * @template T The type of the value provided.
   * @param {Provider<T>} provider The provider to initialize the state structure for.
   * @returns {InternalState<T>} The created internal state structure.
   * @private
   */
  private _createProviderStateStructure<T>(provider: Provider<T>): InternalState<T> {
    // --- Common setup for reader and base state ---
    const dependencies = new Set<Provider<any>>();
    const dependents = new Set<Provider<any>>();
    const disposeCallbacks = new Set<Dispose>();
    const listeners = new Set<() => void>(); // Initialize base listeners set

    // Create and store a placeholder state immediately to detect cycles
    const internalId = internalStateIdCounter++; // Assign unique ID
    // Use Partial<BaseInternalState> for placeholder to avoid strict initialization issues
    const placeholderState: Partial<BaseInternalState> & { type: 'generic' | 'state' | 'async', value?: any, stateProviderState?: any, asyncProviderState?: any } = {
        internalId,
        type: 'generic', // Placeholder type
        value: undefined,
        isComputing: true,
        isDisposed: false,
        isStale: false,
        dependencies,
        dependents,
        disposeCallbacks,
        listeners, // Add base listeners
        notifyListeners: () => { /* Placeholder */ },
        dispose: () => { /* Placeholder dispose, real one set later */ }
    };
    this.providerStates.set(provider, placeholderState as InternalState<any>); // Cast needed due to Partial

    // Define the base disposal logic here, capturing necessary variables
    const baseDisposeLogic = (stateRef: InternalState<any>, providerKey: Provider<any>) => {
        if (stateRef.isDisposed) return;

        // Mark dependents as stale *before* cleaning up this state
        this.markDependentsStale(providerKey, new Set());

        stateRef.isDisposed = true; // Mark as disposed

        // Clear base listeners
        stateRef.listeners.clear();
        // Run and clear dispose callbacks
        stateRef.disposeCallbacks.forEach(cb => { try { cb() } catch (e) { console.error("Error during dispose callback:", e)} });
        stateRef.disposeCallbacks.clear();

        // Clean up dependency links *before* clearing local dependencies set
        stateRef.dependencies.forEach(depProvider => {
            const depState = this.providerStates.get(depProvider);
            // Check if depState exists and has dependents property before accessing
            if (depState?.dependents) {
                 depState.dependents.delete(providerKey); // Use providerKey here
            }
        });
        // Clear local sets captured by the state object itself
        stateRef.dependencies.clear();
        stateRef.dependents.clear();

        // Optionally cancel async operation if applicable
        if (isAsyncProviderInternalState(stateRef)) {
            stateRef.asyncProviderState.abortController?.abort();
        }

        // Keep the state object in the map but marked as disposed.
        // Or remove it: this.providerStates.delete(providerKey); // Consider implications
    };

    // Define notifyListeners function (captures the 'listeners' set for this state)
    const notifyListeners = () => {
        // Convert to array before iterating in case a listener modifies the set
        Array.from(listeners).forEach(listener => { try { listener() } catch(e) { console.error("Error in listener callback:", e)} });
    };

    // Determine state type and create final structure
    let internalState: InternalState<T>;

    const initReader: ScopeReader = {
        read: <P>(dep: Provider<P>) => this._trackDependency(dep, provider, dependencies), // Use helper
        watch: <P>(dep: Provider<P>) => this._trackDependency(dep, provider, dependencies), // Watch behaves like read during init
        onDispose: (cb: Dispose) => disposeCallbacks.add(cb),
    };

    if (isStateProviderInstance<T>(provider)) {
      // State providers require their specific internal state initialized immediately
      const stateProviderState = (provider as any)[$stateProvider].initializeState(initReader, internalId);
      internalState = {
        internalId,
        type: 'state',
        stateProviderState: stateProviderState, // Holds value and updater
        disposeCallbacks,
        dependencies, // Use the set populated by initReader
        dependents,
        isComputing: false,
        isDisposed: false,
        isStale: false, // Initial value is never stale
        listeners, // Add base listeners
        notifyListeners, // Add base notifier
        dispose: () => baseDisposeLogic(internalState, provider),
      };
    } else if (isAsyncProviderInstance<T>(provider)) {
        // Async providers also initialize immediately to set loading state and start fetch
        const initialValue: AsyncValue<any> = { state: 'loading' }; // Start loading
        const abortController = new AbortController(); // For cancellation

        const asyncState: AsyncProviderInternalStateDefinition<any> = {
            value: initialValue,
            listeners: new Set(), // Specific listeners for async? Or use base? Using base for now.
            notifyListeners: notifyListeners, // Use base notifier
            onDisposeCallback: undefined, // Will be set via reader.onDispose
            abortController: abortController,
            isExecuting: false,
            currentExecution: undefined,
        };

        internalState = {
            internalId,
            type: 'async',
            asyncProviderState: asyncState,
            disposeCallbacks,
            dependencies, // Will be populated by the create function via initReader
            dependents,
            isComputing: false, // Use asyncState.isExecuting instead
            isDisposed: false,
            isStale: false, // Async state manages its own staleness via AsyncValue
            listeners,
            notifyListeners,
            dispose: () => baseDisposeLogic(internalState, provider),
        };

        // Trigger the async operation immediately after setting up state
        this._executeAsyncProvider(provider, internalState);

    } else {
      // For computed and generic providers, create a generic structure.
        internalState = {
          internalId,
          type: 'generic',
          value: undefined as T, // Value starts undefined
          disposeCallbacks,
          dependencies, // Will be populated by _computeAndCacheValue
          dependents,
          isComputing: false,
          isDisposed: false,
          isStale: true, // Mark as stale initially
          listeners, // Add base listeners
          notifyListeners, // Add base notifier
          dispose: () => baseDisposeLogic(internalState, provider),
        };
    }

    // Replace placeholder and return the created structure
    this.providerStates.set(provider, internalState);
    return internalState;
  }

  /**
   * Computes or recomputes the value for a generic or computed provider,
   * updates its state, and returns the new value.
   *
   * @template T The type of the value provided.
   * @param {Provider<T>} provider The provider being computed.
   * @param {GenericProviderState<T>} state The internal state object for the provider.
   * @returns {T} The computed value.
   * @private
   */
  private _computeAndCacheValue<T>(
    provider: Provider<T>,
    state: GenericProviderState<T>
  ): T {
    // Create a reader specific to this computation
    const dependencies = new Set<Provider<any>>();

    // Clear old dependencies links *before* re-computation
    state.dependencies.forEach(oldDepProvider => {
        const oldDepState = this.providerStates.get(oldDepProvider);
        if (oldDepState?.dependents) {
            oldDepState.dependents.delete(provider);
        }
    });
    state.dependencies.clear(); // Clear the local set

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
      // Determine how to get the value based on provider type
      if (isComputedProviderInstance<T>(provider)) {
        newValue = (provider as any)[$computedProvider].compute(reader);
      } else {
        // Assume it's a generic provider function if not computed
        newValue = provider(reader);
      }

      // Update state only if the value has changed
      if (!Object.is(state.value, newValue)) {
          state.value = newValue;
          // Notify listeners only if value changed (optional optimization)
          // state.notifyListeners(); // Consider if generic providers should notify directly
      }
      state.dependencies = dependencies; // Store the new dependencies
      state.isStale = false;
      state.isComputing = false;
      return state.value; // Return potentially updated value

    } catch (error) {
      state.isComputing = false;
      // TODO: Handle computation errors more gracefully? Maybe store error state?
      console.error(`Error computing provider (ID: ${state.internalId}):`, error);
      // Re-throw error but leave state potentially stale/partially cleaned?
      throw error;
    }
  }

  /**
   * Helper method for ScopeReader's read/watch to track dependencies.
   * Reads the dependency, ensures the dependent is registered with the dependency,
   * and adds the dependency to the dependent's list.
   * @private
   */
  private _trackDependency<P>(
    dependencyProvider: Provider<P>,
    dependentProvider: Provider<any>,
    currentDependenciesSet: Set<Provider<any>>
  ): P {
    currentDependenciesSet.add(dependencyProvider);
    const value = this.read(dependencyProvider); // Delegate read (initializes if needed)
    // Re-fetch state *after* reading to ensure it's initialized
    const dependencyState = this.providerStates.get(dependencyProvider);
    // Add the provider *being computed* (dependentProvider) to the dependents list of the dependency
    if (dependencyState && !dependencyState.isDisposed) {
         dependencyState.dependents.add(dependentProvider);
    }
    return value;
  }

  /**
   * Executes the async operation for an AsyncProvider.
   * Handles state transitions (loading -> data/error) and notifications.
   * @private
   */
  private _executeAsyncProvider<T>(
      provider: AsyncProviderInstance<T>,
      state: AsyncProviderInternalState<T>
  ): void {
      if (state.isDisposed || state.asyncProviderState.isExecuting) {
          return;
      }

      state.asyncProviderState.isExecuting = true;
      // Set loading state (potentially keeping previous data)
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

      // Execute the promise
      const promise = (provider as any)[$asyncProvider].create(reader);
      state.asyncProviderState.currentExecution = promise
          .then((data: T) => { // Add type for data
              if (state.isDisposed || state.asyncProviderState.abortController?.signal.aborted) return; // Check if disposed/aborted during promise execution

              state.asyncProviderState.value = { state: 'data', data };
              state.asyncProviderState.isExecuting = false;
              state.notifyListeners(); // Notify about data state
              this.markDependentsStale(provider, new Set()); // Mark dependents stale on successful data load
          })
          .catch((error: unknown) => { // Add type for error
              if (state.isDisposed || state.asyncProviderState.abortController?.signal.aborted) return; // Check if disposed/aborted

              console.error(`Error executing asyncProvider (ID: ${state.internalId}):`, error);
              const previousDataOnError = hasData(state.asyncProviderState.value) ? state.asyncProviderState.value.data : undefined;
              state.asyncProviderState.value = { state: 'error', error, previousData: previousDataOnError }; // Consider adding stack trace
              state.asyncProviderState.isExecuting = false;
              state.notifyListeners(); // Notify about error state
              this.markDependentsStale(provider, new Set()); // Also mark dependents stale on error
          });
  }


  /**
   * Retrieves the specialized updater function for a {@link StateProviderInstance}.
   *
   * This method ensures the provider is initialized and is indeed a `StateProvider`.
   * It returns a function that, when called, will update the provider's state
   * within this specific scope and notify listeners and dependents.
   *
   * Throws an error if the scope is disposed, the provider is not a `StateProviderInstance`,
   * or the provider state is disposed or inconsistent.
   *
   * @template T The type of the state managed by the StateProvider.
   * @param {StateProviderInstance<T>} provider The StateProviderInstance whose updater is needed.
   * @returns {StateUpdater<T>} The updater function bound to this scope and provider.
   * @throws {Error} If the scope is disposed.
   * @throws {Error} If the provider is not a valid, initialized StateProvider in this scope.
   */
  public updater<T>(provider: StateProviderInstance<T>): StateUpdater<T> {
    this.checkDisposed();
    // Check if the provider is initialized and is actually a StateProvider *before* returning the updater function.
    // Reading it ensures initialization.
    this.read(provider); // Ensure initialized and get potential errors early
    const state = this.providerStates.get(provider);

    // Perform the check here
    if (!isStateProviderInternalState<T>(state)) {
         throw new Error('Provider is not a StateProvider or state is inconsistent');
    }
     if (state.isDisposed) {
        // This check might be redundant if read() already threw, but keep for safety
        throw new Error('Cannot get updater for a disposed provider state');
    }


    // Return a function that performs the update using the current scope instance ('this')
    // and the specific provider key. Matches the StateUpdater<T> signature implicitly.
    // Return a function matching the StateUpdater<T> signature
    return (scope: Scope, providerInstance: StateProviderInstance<T>, newValueOrFn: T | ((prev: T) => T)) => {
        // Check scope disposal *again* inside the returned function, as it might be called later
        try {
            this.checkDisposed();
        } catch (e) {
             return;
        }

        // Re-fetch state in case it was disposed between getting the updater and calling it
        const currentState = this.providerStates.get(provider) as StateProviderInternalState<T> | undefined;

        // Check if the state exists, is the correct type, and is not disposed
        if (!currentState || !isStateProviderInternalState(currentState) || currentState.isDisposed) {
            // Log the ID we attempted to find state for, if possible
            const attemptedId = currentState ? currentState.internalId : 'unknown';
            console.warn(`Attempted to update StateProvider (ID: ${attemptedId}) but its state was not found or was disposed.`);
            return;
        }


        const stateProviderState = currentState.stateProviderState; // Get the specific state object
        const previousValue = stateProviderState.value;

        const newValue = typeof newValueOrFn === 'function'
            ? (newValueOrFn as (prev: T) => T)(previousValue)
            : newValueOrFn;

        if (!Object.is(previousValue, newValue)) {
            stateProviderState.value = newValue; // Update value within the state object
            // Notify listeners attached to *this* provider's state
            currentState.notifyListeners();

            // Mark dependents as stale and notify their listeners
            this.markDependentsStale(provider, new Set());
        }
    };
  }

  /**
   * Recursively marks dependents of a given provider as stale and notifies
   * any listeners attached to those dependents (primarily for UI updates via `watch`).
   * This is called when a provider's state changes.
   *
   * Uses a Set to track visited providers in the current propagation chain
   * to prevent infinite loops in potential (though ideally non-existent)
   * circular dependency scenarios during notification.
   *
   * @param {Provider<any>} provider The provider whose dependents should be marked stale.
   * @param {Set<Provider<any>>} visited Set of providers already visited in this notification chain.
   * @private
   */
  private markDependentsStale(provider: Provider<any>, visited: Set<Provider<any>>): void {
    // DEBUG: Log entry and the provider being processed
    const providerState = this.providerStates.get(provider);
    // console.log(`DEBUG: Entering markDependentsStale for provider (Internal ID: ${providerState?.internalId ?? 'N/A'})`);
    if (visited.has(provider)) {
        return; // Avoid infinite loops
    }
    visited.add(provider);

    const state = this.providerStates.get(provider);
    if (!state || state.isDisposed) return;

    state.dependents.forEach(dependentProvider => {
        const dependentState = this.providerStates.get(dependentProvider);
        // Check if dependent exists and is not disposed
        if (dependentState && !dependentState.isDisposed) {
            // Mark stale unconditionally if it wasn't already.
            // This ensures the staleness propagates even if listeners aren't notified directly.
            const wasAlreadyStale = dependentState.isStale;
            if (!wasAlreadyStale) {
                 // console.log(`DEBUG markDependentsStale: Marking dependent ${dependentState.internalId} as stale.`); // DEBUG
                 dependentState.isStale = true;
            }

            // Notify listeners attached to the dependent state
            // console.log(`DEBUG markDependentsStale: Notifying listeners of stale provider ${dependentState.internalId}.`); // DEBUG
            dependentState.notifyListeners();

            // Recursively mark *its* dependents as stale
            this.markDependentsStale(dependentProvider, visited);
        }
    });
  }
  /**
   * Subscribes a listener function to changes in a specific provider's state within this scope.
   *
   * Ensures the provider is initialized before attempting to add the listener.
   * Implements auto-disposal: when the last listener for a provider unsubscribes,
   * the provider's internal state is disposed.
   *
   * @template T The type of the value provided.
   * @param {Provider<T>} provider The provider to watch.
   * @param {() => void} callback The function to call when the provider's state changes.
   * @returns {Dispose} A function to call to unsubscribe the listener.
   */
  public watch<T>(provider: Provider<T>, callback: () => void): Dispose {
    this.checkDisposed();

    // Ensure the provider is initialized by reading it first.
    // This also retrieves the current state if already initialized.
    this.read(provider);
    const state = this.providerStates.get(provider);

    if (!state || state.isDisposed) {
      // Should not happen if read() succeeded, but check for safety.
      console.warn(`Attempted to watch provider (ID: ${state?.internalId ?? 'N/A'}) but its state was not found or was disposed.`);
      return () => {}; // Return a no-op unsubscribe function
    }

    // Add listener to the base state
    state.listeners.add(callback);

    // Return the unsubscribe function
    return () => {
      // Re-fetch state in case it was disposed between subscribing and unsubscribing
      const currentState = this.providerStates.get(provider);
      if (!currentState || currentState.isDisposed) return; // Don't try to modify disposed state

      currentState.listeners.delete(callback);
      // Auto-dispose if listener count drops to zero
      if (currentState.listeners.size === 0) {
          // Check if it still exists and hasn't been disposed by other means
          if (!currentState.isDisposed) {
               // console.log(`DEBUG: Auto-disposing state due to zero listeners (Internal ID: ${currentState.internalId})`); // Optional debug
               currentState.dispose(); // Dispose the internal state
          }
      }
    };
  }


  /**
   * Disposes of the scope, cleaning up all provider states created within it.
   *
   * This involves:
   * - Marking the scope itself as disposed.
   * - Iterating through all active provider states in the scope.
   * - Calling the `dispose` method on each provider state, which in turn:
   *   - Clears internal listeners.
   *   - Executes any `onDispose` callbacks registered during provider initialization.
   *   - Cleans up dependency/dependent links.
   * - Clearing the internal map of provider states.
   *
   * Once disposed, the scope and its provider states should not be used further.
   */
  public dispose(): void {
    if (this.isDisposed) {
      return;
    }
    this._isDisposed = true; // Use internal flag

    // Dispose providers in reverse order of initialization? Not strictly necessary
    // if dependencies are handled correctly, but might prevent some issues.
    // For now, dispose in map iteration order.
    // Create a copy of states to dispose, as disposal modifies the map
    const statesToDispose = Array.from(this.providerStates.values());
    statesToDispose.forEach(state => {
      // Ensure dispose is called only once via the state's internal flag
      if (!state.isDisposed) {
          state.dispose();
      }
    });

    this.providerStates.clear();
    this.parent = null; // Break potential reference cycle
    // console.log("Scope disposed");
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

// Example usage (conceptual)
// const scope = createScope();
// const value = scope.read(myProvider);
// scope.dispose();