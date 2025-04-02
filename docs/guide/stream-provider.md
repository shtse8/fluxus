# Providers: `streamProvider`

While `asyncProvider` handles single asynchronous operations (like fetching data
once), `streamProvider` is designed for handling continuous streams of
asynchronous data. Think of WebSockets, timers emitting values periodically, or
real-time database updates.

## Purpose

`streamProvider` subscribes to a stream source and exposes the latest value
emitted by that stream as an `AsyncValue<T>`. It manages the subscription
lifecycle automatically.

## The `Subscribable` Interface

Unlike `asyncProvider` which expects a function returning a `Promise`,
`streamProvider` expects a function that returns a `Subscribable<T>`. This is a
simple interface representing anything that can be subscribed to:

```typescript
interface Subscribable<T> {
  subscribe(observer: Observer<T>): Subscription;
}

interface Observer<T> {
  next?: (value: T) => void;
  error?: (err: unknown) => void;
  complete?: () => void;
}

interface Subscription {
  unsubscribe(): void;
}
```

This pattern is common in libraries like RxJS (where `Observable` implements
`Subscribable`). You might need to wrap other stream sources (like raw
WebSockets) to conform to this interface.

## `AsyncValue<T>` States

Just like `asyncProvider`, `streamProvider` uses `AsyncValue<T>` to represent
the state:

1. **Loading (`AsyncLoading`):** The initial state before the stream emits its
   first value.
2. **Data (`AsyncData<T>`):** The state when the stream has emitted at least one
   value. `data` holds the _latest_ value emitted.
3. **Error (`AsyncError`):** The state if the stream emits an error.

## Usage

Define a `streamProvider` by passing it a function that accepts a `ScopeReader`
and returns your `Subscribable` stream source.

```typescript
import { streamProvider } from '@shtse8/fluxus';
import { webSocket } from 'rxjs/webSocket'; // Example using RxJS

interface Message {
  /* ... */
}

// Example: Provider for a WebSocket connection
const messagesProvider = streamProvider<Message>((read) => {
  const url = 'wss://example.com/socket';
  const stream$ = webSocket<Message>(url); // Returns an RxJS Observable

  // Optional: Use onDispose for cleanup if needed beyond unsubscription
  // read.onDispose(() => console.log('WebSocket provider disposed'));

  return stream$; // RxJS Observables are Subscribable
});

// Example: Simple interval timer (using a helper to create a Subscribable)
function createIntervalStream(ms: number): Subscribable<number> {
  let count = 0;
  let intervalId: NodeJS.Timeout | null = null;
  return {
    subscribe: (observer) => {
      intervalId = setInterval(() => {
        observer.next?.(count++);
      }, ms);
      // Emit initial value immediately?
      observer.next?.(0);
      return {
        unsubscribe: () => {
          if (intervalId) clearInterval(intervalId);
        },
      };
    },
  };
}

const counterStreamProvider = streamProvider<number>((read) => {
  const stream = createIntervalStream(1000);
  read.onDispose(() => console.log('Interval stream disposed'));
  return stream;
});
```

## Handling `AsyncValue` in Components (React)

Using `streamProvider` in components is identical to `asyncProvider`. You use
`useProvider` to get the current `AsyncValue` and render based on its state
(`isLoading`, `hasData`, `hasError`). The component will automatically re-render
whenever the stream emits a new value (transitioning to `AsyncData`) or an error
(transitioning to `AsyncError`).

```tsx
import React from 'react';
import { useProvider } from '@shtse8/fluxus/react-adapter';
import { hasData, hasError, isLoading } from '@shtse8/fluxus';
import { messagesProvider } from './providers'; // Assuming messagesProvider exists

function MessageDisplay() {
  const messageValue = useProvider(messagesProvider);

  if (isLoading(messageValue)) {
    return <div>Connecting to messages...</div>;
  }

  if (hasError(messageValue)) {
    return <div style={{ color: 'red' }}>Message stream error: {String(messageValue.error)}</div>;
  }

  // Show the latest message
  if (hasData(messageValue)) {
    const latestMessage = messageValue.data;
    return <div>Last Message: {JSON.stringify(latestMessage)}</div>;
  }

  return <div>Waiting for messages...</div>;
}
```

`streamProvider` provides a reactive way to integrate continuous data sources
into your application state.
