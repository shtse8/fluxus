[**@shtse8/fluxus v1.0.0**](../../README.md)

***

[@shtse8/fluxus](../../README.md) / [src](../README.md) / asyncProvider

# Function: asyncProvider()

> **asyncProvider**\<`T`\>(`create`, `options`?): [`AsyncProviderInstance`](../interfaces/AsyncProviderInstance.md)\<`T`\>

Defined in: [src/providers/asyncProvider.ts:96](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/providers/asyncProvider.ts#L96)

Creates an AsyncProvider.

An AsyncProvider manages the state of an asynchronous operation,
typically represented by a Promise. It exposes the state as an `AsyncValue&lt;T&gt;`,
transitioning through loading, data, and error states.

## Type Parameters

### T

`T`

The type of data the asynchronous operation produces.

## Parameters

### create

(`read`) => `Promise`\<`T`\>

A function that takes a ScopeReader (which includes an optional `signal` property for cancellation) and returns a Promise resolving to the data.

### options?

`AsyncProviderOptions`

## Returns

[`AsyncProviderInstance`](../interfaces/AsyncProviderInstance.md)\<`T`\>

An AsyncProviderInstance.

## Example

```ts
const userProvider = asyncProvider(async (reader) => {
  const userId = reader.read(userIdProvider);
  // Pass the signal from the reader to fetch for cancellation
  const response = await fetch(`/api/users/${userId}`, { signal: reader.signal });
  if (!response.ok) {
    // Handle potential AbortError if the request was cancelled
    if (response.status === 0 && reader.signal?.aborted) {
      console.log('User fetch aborted.');
      // You might want to throw a specific error or return a default state
      throw new Error('Fetch aborted');
    }
    throw new Error('Failed to fetch user');
  }
  return await response.json() as User;
});
```
