import * as React from 'react';
import { a as Scope, P as Provider, e as StateProviderInstance } from './scope-CW2T5Ey7.js';
export { D as Dispose, f as StateUpdater } from './scope-CW2T5Ey7.js';

/**
 * Props for the {@link ProviderScope} component.
 */
interface ProviderScopeProps {
    /** The child components that will have access to the scope created by this ProviderScope. */
    children: React.ReactNode;
}
/**
 * A React component that creates and manages a Fluxus {@link Scope} instance
 * and provides it to descendant components via React Context.
 *
 * This is the entry point for using Fluxus providers within a React application tree.
 * It ensures that a stable scope is available and handles the automatic disposal
 * of the scope and its associated provider states when the component unmounts.
 *
 * Scopes can be nested by nesting `ProviderScope` components.
 *
 * @param {ProviderScopeProps} props - The component props.
 * @returns {React.ReactElement} The provider component wrapping the children.
 *
 * @example
 * ```tsx
 * ReactDOM.createRoot(document.getElementById('root')!).render(
 *   <React.StrictMode>
 *     <ProviderScope>
 *       <App />
 *     </ProviderScope>
 *   </React.StrictMode>,
 * )
 * ```
 */
declare function ProviderScope({ children }: ProviderScopeProps): React.ReactElement;

/**
 * Hook to access the current Fluxus Scope from the context.
 * Throws an error if used outside of a ProviderScope.
 * @returns The current Fluxus Scope instance.
 */
declare function useScope(): Scope;

/**
 * A React hook that reads a provider's value from the current {@link Scope}
 * and subscribes to updates.
 *
 * The component calling this hook will re-render whenever the provider's
 * state changes in the scope. It uses `useSyncExternalStore` internally
 * to ensure compatibility with concurrent rendering features in React.
 *
 * Must be used within a {@link ProviderScope}.
 *
 * @template T The type of the value provided by the provider.
 * @param {Provider<T>} provider The provider whose value is to be read and watched.
 * @returns {T} The current value of the provider.
 * @throws {Error} If used outside of a `ProviderScope`.
 * @throws {Error} If the provider state has been disposed.
 * @throws {Error} If a circular dependency is detected during initialization.
 */
declare function useProvider<T>(provider: Provider<T>): T;
/**
 * A React hook that returns the updater function for a {@link StateProviderInstance}.
 *
 * This hook allows components to update the state of a `StateProvider` without
 * needing to subscribe to its value (and thus avoiding re-renders when the
 * value changes if the component doesn't display it).
 *
 * The returned function has a stable identity across re-renders as long as the
 * provider and scope remain the same, making it safe to use in dependency arrays
 * of other hooks like `useEffect` or `useCallback`.
 *
 * Must be used within a {@link ProviderScope}.
 *
 * @template T The type of the state managed by the StateProvider.
 * @param {StateProviderInstance<T>} provider The StateProvider instance whose updater is needed.
 * @returns {(newValueOrFn: T | ((prev: T) => T)) => void} A stable function to update the provider's state.
 * @throws {Error} If used outside of a `ProviderScope`.
 * @throws {Error} If the provider is not a valid, initialized StateProvider in the scope.
 */
declare function useProviderUpdater<T>(provider: StateProviderInstance<T>): (newValueOrFn: T | ((prev: T) => T)) => void;

export { Provider, ProviderScope, Scope, StateProviderInstance, useProvider, useProviderUpdater, useScope };
