import type { InjectionKey } from 'vue';
import type { Scope } from '../src/index.js';

/**
 * Injection key for the Fluxus Scope instance.
 * Used by ProviderScope to provide the scope and by hooks to inject it.
 */
export const scopeSymbol: InjectionKey<Scope> = Symbol('fluxusScope');