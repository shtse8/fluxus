[**@shtse8/fluxus v1.0.0**](../../README.md)

***

[@shtse8/fluxus](../../README.md) / [src](../README.md) / AsyncProviderInstance

# Interface: AsyncProviderInstance()\<T\>

Defined in: [src/providers/asyncProvider.ts:23](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/providers/asyncProvider.ts#L23)

Represents an instance of an AsyncProvider.
It acts as a Provider<AsyncValue&lt;T&gt;> for reading the async state.
It carries metadata via a symbol to distinguish it during initialization.

## Extends

- [`Provider`](../type-aliases/Provider.md)\<[`AsyncValue`](../type-aliases/AsyncValue.md)\<`T`\>\>

## Type Parameters

### T

`T`

The type of the data produced by the async operation.

> **AsyncProviderInstance**(`reader`): [`AsyncValue`](../type-aliases/AsyncValue.md)

Defined in: [src/providers/asyncProvider.ts:23](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/providers/asyncProvider.ts#L23)

Represents an instance of an AsyncProvider.
It acts as a Provider<AsyncValue&lt;T&gt;> for reading the async state.
It carries metadata via a symbol to distinguish it during initialization.

## Parameters

### reader

[`ScopeReader`](ScopeReader.md)

## Returns

[`AsyncValue`](../type-aliases/AsyncValue.md)

## Properties

### \[$asyncProvider\]

> **\[$asyncProvider\]**: `object`

Defined in: [src/providers/asyncProvider.ts:24](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/providers/asyncProvider.ts#L24)

#### create()

> **create**: (`read`) => `Promise`\<`T`\>

The asynchronous function that produces the value.

##### Parameters

###### read

[`ScopeReader`](ScopeReader.md)

##### Returns

`Promise`\<`T`\>

#### options?

> `optional` **options**: `AsyncProviderOptions`

Optional configuration for the provider.

***

### type?

> `readonly` `optional` **type**: `"asyncProvider"`

Defined in: [src/providers/asyncProvider.ts:31](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/providers/asyncProvider.ts#L31)
