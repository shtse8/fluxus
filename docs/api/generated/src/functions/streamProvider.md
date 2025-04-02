[**@shtse8/fluxus v1.0.0**](../../README.md)

***

[@shtse8/fluxus](../../README.md) / [src](../README.md) / streamProvider

# Function: streamProvider()

> **streamProvider**\<`T`\>(`create`, `options`?): [`StreamProviderInstance`](../interfaces/StreamProviderInstance.md)\<`T`\>

Defined in: [src/providers/streamProvider.ts:119](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/providers/streamProvider.ts#L119)

Creates a StreamProvider.

A StreamProvider manages the state derived from an asynchronous stream
(like an RxJS Observable, WebSocket stream, etc.). It subscribes to the
stream and exposes the latest emitted value as an `AsyncValue&lt;T&gt;`.

## Type Parameters

### T

`T`

The type of data the stream emits.

## Parameters

### create

(`read`) => `Subscribable`\<`T`\>

A function that takes a ScopeReader and returns a Subscribable&lt;T&gt;
       (an object with a `subscribe` method).

### options?

`ProviderOptions`

## Returns

[`StreamProviderInstance`](../interfaces/StreamProviderInstance.md)\<`T`\>

An StreamProviderInstance.

## Example

```ts
// Example with a conceptual timer stream
const timerProvider = streamProvider<number>((read) => {
  let count = 0;
  const intervalId = setInterval(() => {
    // How to push value to subscribers? Need an Observable-like object.
    // This example needs refinement based on actual stream implementation.
  }, 1000);

  read.onDispose(() => clearInterval(intervalId));

  // Return an object conforming to Subscribable<number>
  return {
     subscribe: (observer) => {
         // Simplified: Need proper implementation to emit count
         observer.next?.(count); // Emit initial value?
         // ... logic to emit subsequent values ...
         return { unsubscribe: () => clearInterval(intervalId) };
     }
  };
});
```
