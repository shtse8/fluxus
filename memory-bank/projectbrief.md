# Project Brief: Fluxus State Management Library

**Goal:** Develop an innovative TypeScript state management library, "Fluxus,"
inspired by Dart's Riverpod, emphasizing functional programming principles and
aiming to overcome limitations of existing solutions like Jotai, Zustand, and
Valtio.

**Core Principles:**

1. **No Pre-registration Dependency Injection:** Allow dynamic creation and use
   of providers without a central registry, ensuring optimal tree-shaking.
2. **Functional Programming:** Utilize function composition, pure functions,
   immutability, and provide FP utilities (e.g., `pipe`).
3. **Fine-grained Reactivity:** Implement automatic, precise dependency tracking
   and updates.
4. **Robust Lifecycle Management:** Provide clear resource cleanup APIs and
   automatic handling of dependency lifecycles.

**Target Audience:** TypeScript developers building applications across various
frameworks (React, Vue, Angular, Svelte, or framework-agnostic).

**Success Criteria:**

- A core library demonstrating the principles above.
- Functional adapters for key frameworks (React: `useProvider` hook, Vue:
  `useProvider` composable).
- Clear advantages over existing libraries in terms of DX, performance, or type
  safety.
- Comprehensive documentation and examples.
