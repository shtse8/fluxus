[**@shtse8/fluxus v1.0.0**](../../README.md)

***

[@shtse8/fluxus](../../README.md) / [src](../README.md) / stateProvider

# Function: stateProvider()

> **stateProvider**\<`T`\>(`initialValue`, `options`?): [`StateProviderInstance`](../interfaces/StateProviderInstance.md)\<`T`\>

Defined in: [src/providers/stateProvider.ts:113](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/providers/stateProvider.ts#L113)

Creates a [StateProviderInstance](../interfaces/StateProviderInstance.md) which manages a mutable piece of state.

## Type Parameters

### T

`T`

The type of the state value.

## Parameters

### initialValue

The initial value for the state,
  or a function that computes the initial value using a [ScopeReader](../interfaces/ScopeReader.md).
  If a function is provided, it will be called once per scope when the provider
  is first initialized within that scope.

`T` | (`reader`) => `T`

### options?

`ProviderOptions`

## Returns

[`StateProviderInstance`](../interfaces/StateProviderInstance.md)\<`T`\>

The created StateProvider instance.

## Example

```ts
// Simple counter state provider
const counterProvider = stateProvider(0);

// State provider with initial value computed from another provider
const userProvider = stateProvider<{ name: string; id: number } | null>(null);
const userIdProvider = stateProvider((reader) => reader.read(userProvider)?.id ?? -1);
```
