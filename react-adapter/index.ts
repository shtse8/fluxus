// Main component to provide the scope
export { ProviderScope } from './ProviderScope.js';

// Hooks for accessing scope and providers
export { useScope } from './context.js';
export { useProvider, useProviderUpdater } from './hooks.js';

// Re-export core types needed for using the React adapter effectively
export type { Scope } from '../src/scope.js';
export type { Provider, Dispose } from '../src/types.js';
export type { StateProviderInstance, StateUpdater } from '../src/providers/stateProvider.js';
