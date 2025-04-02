# Fluxus

A functional, reactive state management library for TypeScript inspired by
Riverpod.

[![npm version](https://badge.fury.io/js/fluxus.svg)](https://badge.fury.io/js/fluxus)
[![License: ISC](https://img.shields.io/badge/License-ISC-blue.svg)](https://opensource.org/licenses/ISC)

## Overview

Fluxus aims to provide a TypeScript-native state management solution inspired by
the best ideas from libraries like Riverpod, Jotai, Zustand, and Valtio, while
emphasizing functional programming principles.

**Core Principles:**

- **No Pre-registration Dependency Injection:** Dynamically create and use
  providers without a central registry. Optimal tree-shaking.
- **Functional Programming:** Embrace function composition, pure functions, and
  immutability.
- **Fine-grained Reactivity:** Automatic and precise dependency tracking.
- **Robust Lifecycle Management:** Clear resource cleanup APIs and automatic
  lifecycle handling.

## Installation

```bash
npm install fluxus
# or
yarn add fluxus
# or
pnpm add fluxus
```

## Basic Usage (React)

```tsx
import React from 'react';
import {
  ProviderScope,
  stateProvider,
  useProvider,
  useProviderUpdater,
} from 'fluxus/react-adapter';

// 1. Define a provider (just a function)
const counterProvider = stateProvider(0);

// 2. Wrap your app (or relevant part) in ProviderScope
function App() {
  return (
    <ProviderScope>
      <CounterDisplay />
      <CounterControls />
    </ProviderScope>
  );
}

// 3. Use providers in components
function CounterDisplay() {
  // Reads the value and subscribes to updates
  const count = useProvider(counterProvider);
  return <div>Count: {count}</div>;
}

function CounterControls() {
  // Gets the updater function (doesn't cause re-renders itself)
  const updateCounter = useProviderUpdater(counterProvider);
  return (
    <div>
      <button onClick={() => updateCounter((c) => c + 1)}>Increment</button>
      <button onClick={() => updateCounter((c) => c - 1)}>Decrement</button>
    </div>
  );
}

export default App;
```

## Documentation

(Full documentation coming soon!)

## Contributing

(Contribution guidelines coming soon!)

## License

ISC
