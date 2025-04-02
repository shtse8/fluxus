import * as React from 'react';
import { Scope } from '../src/scope.js'; // Adjust path as needed

/**
 * React Context to provide the Fluxus Scope to descendant components.
 */
export const ScopeContext = React.createContext<Scope | null>(null);

/**
 * Hook to access the current Fluxus Scope from the context.
 * Throws an error if used outside of a ProviderScope.
 * @returns The current Fluxus Scope instance.
 */
export function useScope(): Scope {
  const scope = React.useContext(ScopeContext);
  if (!scope) {
    throw new Error('useScope must be used within a ProviderScope');
  }
  return scope;
}