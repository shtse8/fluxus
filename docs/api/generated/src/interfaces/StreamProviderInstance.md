[**@shtse8/fluxus v1.0.0**](../../README.md)

***

[@shtse8/fluxus](../../README.md) / [src](../README.md) / StreamProviderInstance

# Interface: StreamProviderInstance()\<T\>

Defined in: [src/providers/streamProvider.ts:43](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/providers/streamProvider.ts#L43)

Represents an instance of a StreamProvider.
It acts as a Provider<AsyncValue&lt;T&gt;> for reading the latest stream value.
It carries metadata via a symbol to distinguish it during initialization.

## Extends

- [`Provider`](../type-aliases/Provider.md)\<[`AsyncValue`](../type-aliases/AsyncValue.md)\<`T`\>\>

## Type Parameters

### T

`T`

The type of the data emitted by the stream.

> **StreamProviderInstance**(`reader`): [`AsyncValue`](../type-aliases/AsyncValue.md)

Defined in: [src/providers/streamProvider.ts:43](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/providers/streamProvider.ts#L43)

Represents an instance of a StreamProvider.
It acts as a Provider<AsyncValue&lt;T&gt;> for reading the latest stream value.
It carries metadata via a symbol to distinguish it during initialization.

## Parameters

### reader

[`ScopeReader`](ScopeReader.md)

## Returns

[`AsyncValue`](../type-aliases/AsyncValue.md)

## Properties

### \[$streamProvider\]

> **\[$streamProvider\]**: `object`

Defined in: [src/providers/streamProvider.ts:44](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/providers/streamProvider.ts#L44)

#### create()

> **create**: (`read`) => `Subscribable`\<`T`\>

The function that creates the stream source.

##### Parameters

###### read

[`ScopeReader`](ScopeReader.md)

##### Returns

`Subscribable`\<`T`\>

#### name?

> `optional` **name**: `string`

An optional name for debugging.

***

### type?

> `readonly` `optional` **type**: `"streamProvider"`

Defined in: [src/providers/streamProvider.ts:50](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/providers/streamProvider.ts#L50)
