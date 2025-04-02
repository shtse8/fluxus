[**@shtse8/fluxus v1.0.0**](../../README.md)

***

[@shtse8/fluxus](../../README.md) / [src](../README.md) / computedProvider

# Function: computedProvider()

> **computedProvider**\<`T`\>(`compute`): [`ComputedProviderInstance`](../interfaces/ComputedProviderInstance.md)\<`T`\>

Defined in: [src/providers/computedProvider.ts:88](https://github.com/shtse8/fluxus/blob/4924e60e87ca8856c0bf61d7c46469f55d63d7b6/src/providers/computedProvider.ts#L88)

Creates a [ComputedProviderInstance](../interfaces/ComputedProviderInstance.md) which derives its state by computing
a value based on other providers.

The computation function is executed lazily when the provider is first read
within a scope, and its result is cached. The computed value is automatically
re-evaluated when any of the providers it `read` or `watch`ed during the
computation change their state.

## Type Parameters

### T

`T`

The type of the computed value.

## Parameters

### compute

(`reader`) => `T`

The function that computes the
  derived state. It receives a [ScopeReader](../interfaces/ScopeReader.md) to access other providers.
  It's crucial to use `reader.watch` or `reader.read` within this function
  to establish dependencies correctly for automatic recomputation.

## Returns

[`ComputedProviderInstance`](../interfaces/ComputedProviderInstance.md)\<`T`\>

The created ComputedProvider instance.

## Example

```ts
const countProvider = stateProvider(0);
const doubleCountProvider = computedProvider((reader) => {
  const count = reader.watch(countProvider); // Establish dependency
  const count = reader.watch(countProvider); // Establish dependency
  return count * 2;
});
```

## See

 - [stateProvider](stateProvider.md) for creating mutable state.
 - [ScopeReader](../interfaces/ScopeReader.md) for how to access dependencies.
});
