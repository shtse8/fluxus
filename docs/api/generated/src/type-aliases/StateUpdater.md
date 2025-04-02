[**@shtse8/fluxus v1.0.0**](../../README.md)

---

[@shtse8/fluxus](../../README.md) / [src](../README.md) / StateUpdater

# Type Alias: StateUpdater()\<T\>

> **StateUpdater**\<`T`\> = (`scope`, `provider`, `newValue`) => `void`

Defined in: [src/providers/stateProvider.ts:16](https://github.com/shtse8/fluxus/blob/4924e60e87ca8856c0bf61d7c46469f55d63d7b6/src/providers/stateProvider.ts#L16)

Defines the shape of the function used to update the state of a [StateProviderInstance](../interfaces/StateProviderInstance.md).
This function is retrieved via `scope.updater(provider)`.

## Type Parameters

### T

`T`

The type of the state.

## Parameters

### scope

[`Scope`](../classes/Scope.md)

The scope instance in which the update occurs.

### provider

[`StateProviderInstance`](../interfaces/StateProviderInstance.md)\<`T`\>

The specific provider instance being updated.

### newValue

`T` | (`prev`) => `T`

## Returns

`void`
