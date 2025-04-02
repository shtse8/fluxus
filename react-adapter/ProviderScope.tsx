import * as React from 'react';
import { Scope, createScope } from '../src/scope.js';
import { ScopeContext } from './context.js';
import type { ProviderOverride } from '../src/types.js'; // Import ProviderOverride type

/**
 * Props for the {@link ProviderScope} component.
 */
interface ProviderScopeProps {
  /** The child components that will have access to the scope created by this ProviderScope. */
  children: React.ReactNode;
  /** An optional array of provider overrides for this scope. */
  overrides?: ReadonlyArray<ProviderOverride>;
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
export function ProviderScope({
  children,
  overrides = [],
}: ProviderScopeProps): React.ReactElement {
  const parentScope = React.useContext(ScopeContext);
  const scopeRef = React.useRef<Scope | null>(null);

  // Initialize the scope ref *during render* if it's null.
  // useRef ensures this happens only once for the component instance's lifetime,
  // persisting across StrictMode unmount/remount cycles.
  if (scopeRef.current === null) {
    scopeRef.current = createScope(parentScope, overrides); // Pass overrides
  }

  // The scope instance is now guaranteed to exist.
  const scope = scopeRef.current;

  // Use useEffect for the disposal cleanup on final unmount.
  React.useEffect(() => {
    // Capture the ref value at the time the effect runs.
    const scopeToDispose = scopeRef.current;
    return () => {
      // Only dispose if the scope exists and hasn't already been disposed.
      if (scopeToDispose && !scopeToDispose.isDisposed) {
        scopeToDispose.dispose();
      }
    };
  }, []); // Empty dependency array ensures cleanup runs only on final unmount.

  return <ScopeContext.Provider value={scope}>{children}</ScopeContext.Provider>;
}
