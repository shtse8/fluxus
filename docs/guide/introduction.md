# What is Fluxus?

Fluxus is a modern state management library for TypeScript applications, heavily
inspired by the elegant concepts found in Dart's
[Riverpod](https://riverpod.dev/) library. It aims to provide a powerful,
flexible, and developer-friendly solution by embracing functional programming
principles and addressing common pain points found in other
JavaScript/TypeScript state management libraries.

## The Problem Space

Developing complex applications often involves managing intricate state
interactions. While many libraries exist (like Redux, Zustand, Jotai, Valtio),
they can sometimes introduce challenges:

- **Boilerplate:** Requiring significant setup or pre-registration of state
  units (stores, atoms).
- **Tree-Shaking:** Difficulty in ensuring that unused state logic is completely
  removed from the final bundle.
- **Functional Ergonomics:** Lack of first-class support for functional
  composition and patterns.
- **Reactivity Granularity:** Coarse-grained updates leading to unnecessary
  re-renders.
- **Async Complexity:** Managing asynchronous operations and their states can
  become cumbersome.

## The Fluxus Approach

Fluxus tackles these challenges with a fresh perspective:

1. **Zero Pre-registration:** Providers (the core unit of state in Fluxus) are
   simply functions or values. They can be defined anywhere and used directly
   without needing a central registry. This inherently optimizes tree-shaking.
2. **Functional Core:** Fluxus encourages a functional style. Providers compose
   naturally, and the library aims to provide utilities for common functional
   patterns.
3. **Fine-grained Reactivity:** An intelligent dependency tracking system
   ensures that only the components or providers that depend on a specific piece
   of changed state are notified and updated.
4. **Type Safety First:** Built from the ground up with TypeScript, Fluxus
   prioritizes strong typing and excellent developer experience through
   autocompletion and compile-time checks.
5. **Framework Agnostic:** While the initial focus includes a seamless React
   adapter, the core library is designed to be independent of any specific UI
   framework.

## Core Principles Recap

- **No Pre-registration Dependency Injection:** Dynamic, tree-shakeable
  providers.
- **Functional Programming:** Composition, pure functions, immutability.
- **Fine-grained Reactivity:** Precise and automatic updates.
- **Robust Lifecycle Management:** Automatic resource cleanup.

Ready to dive deeper? Head to the [Getting Started](./getting-started.md) guide!
