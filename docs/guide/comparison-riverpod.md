# Comparison with Riverpod

Fluxus draws significant inspiration from [Riverpod](https://riverpod.dev/), a
popular state management solution for Flutter/Dart applications. While sharing
some core philosophies, Fluxus adapts and evolves these concepts for the
TypeScript/JavaScript ecosystem, leading to key differences in design and
implementation.

This page highlights the main similarities and differences.

## Core Similarities

- **Provider-Based:** Both libraries use the concept of "providers" to
  encapsulate and provide state or computed values.
- **Declarative:** State is declared and composed, rather than imperatively
  managed.
- **Reactivity:** Both aim for efficient reactivity, updating consumers only
  when necessary.
- **Dependency Injection:** Providers can depend on other providers, forming a
  dependency graph.
- **Testability:** The provider pattern generally leads to more testable
  application logic.

## Key Differences

| Feature                 | Fluxus (TypeScript)                                      | Riverpod (Dart/Flutter)                                    | Notes                                                                                                |
| :---------------------- | :------------------------------------------------------- | :--------------------------------------------------------- | :--------------------------------------------------------------------------------------------------- |
| **Provider Definition** | Functions (`stateProvider`, `computedProvider`, etc.)    | Global variables (`StateProvider`, `FutureProvider`, etc.) | Fluxus providers are values, dynamically creatable, enhancing tree-shaking and composition.          |
| **Registration**        | **None required.** Providers are used directly.          | Implicit registration via global provider variables.       | Fluxus avoids the need for any central registry or pre-declaration.                                  |
| **Scope/Container**     | Explicit `Scope` objects. Nested scopes supported.       | Implicit `ProviderContainer` or `ProviderScope` widget.    | Fluxus uses explicit `Scope` instances for clearer boundaries and lifecycle management.              |
| **Reading Providers**   | `scope.read(provider)` / `reader.read(provider)`         | `ref.read(provider)`                                       | Similar concept, but tied to the explicit `Scope` or `ScopeReader` in Fluxus.                        |
| **Watching Providers**  | `scope.watch(provider)` / `reader.watch(provider)`       | `ref.watch(provider)`                                      | Similar concept for establishing reactive dependencies.                                              |
| **Framework Agnostic**  | **Yes.** Core is independent; adapters provided (React). | Primarily Flutter-focused, though core is separable.       | Fluxus is designed from the ground up for the broader JS/TS ecosystem.                               |
| **Functional Emphasis** | Strong focus (e.g., `pipe` utility planned).             | Supports functional patterns but less emphasis on utils.   | Fluxus aims to provide more built-in functional utilities.                                           |
| **Type System**         | Leverages TypeScript's advanced types.                   | Leverages Dart's strong type system.                       | Both prioritize type safety within their respective language contexts.                               |
| **Auto-Dispose**        | Default behavior based on listener count.                | Configurable via `.autoDispose` modifier.                  | Fluxus currently defaults to auto-disposal without an explicit `keepAlive` or `.autoDispose` syntax. |
| **Async Handling**      | `asyncProvider` returning `AsyncValue<T>`.               | `FutureProvider`, `StreamProvider`.                        | Both provide dedicated solutions for async operations. Fluxus uses an `AsyncValue` wrapper.          |
| **Cancellation**        | Via `AbortSignal` passed in `ScopeReader`.               | Via `ref.onDispose` or stream cancellation.                | Fluxus integrates standard `AbortSignal` for async cancellation.                                     |

## Why Fluxus?

Fluxus aims to bring the benefits of Riverpod's provider model to the TypeScript
world while:

1. **Eliminating Globals:** Avoiding global provider variables enhances
   modularity and testability.
2. **Improving Tree-Shaking:** Dynamic provider creation ensures only used
   providers are included in bundles.
3. **Strengthening Functional Patterns:** Providing first-class support for
   functional composition.
4. **Explicit Scope Management:** Offering clearer control over state lifecycles
   and boundaries.
5. **Broad Ecosystem Compatibility:** Designing a framework-agnostic core from
   the start.

By understanding these differences, developers familiar with Riverpod can
leverage their existing knowledge while appreciating the specific advantages
Fluxus offers within the TypeScript ecosystem.
