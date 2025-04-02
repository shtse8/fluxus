[**@shtse8/fluxus v1.0.0**](../../README.md)

***

[@shtse8/fluxus](../../README.md) / [src](../README.md) / ComputedProviderInstance

# Interface: ComputedProviderInstance()\<T\>

Defined in: [src/providers/computedProvider.ts:28](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/providers/computedProvider.ts#L28)

Represents an instance of a ComputedProvider.
It acts as a Provider&lt;T&gt; for reading the computed value. It carries metadata
via a symbol to distinguish it during initialization.

## Extends

- [`Provider`](../type-aliases/Provider.md)\<`T`\>

## Type Parameters

### T

`T`

The type of the computed value.

> **ComputedProviderInstance**(`reader`): `T`

Defined in: [src/providers/computedProvider.ts:28](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/providers/computedProvider.ts#L28)

Represents an instance of a ComputedProvider.
It acts as a Provider&lt;T&gt; for reading the computed value. It carries metadata
via a symbol to distinguish it during initialization.

## Parameters

### reader

[`ScopeReader`](ScopeReader.md)

## Returns

`T`

## Properties

### \_fluxus\_provider\_type

> `readonly` **\_fluxus\_provider\_type**: `"ComputedProvider"`

Defined in: [src/providers/computedProvider.ts:42](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/providers/computedProvider.ts#L42)

**`Internal`**

A read-only property for easier type narrowing if needed.

***

### \[$computedProvider\]

> **\[$computedProvider\]**: `object`

Defined in: [src/providers/computedProvider.ts:30](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/providers/computedProvider.ts#L30)

**`Internal`**

A unique symbol used to identify ComputedProvider instances.

#### compute()

> **compute**: (`reader`) => `T`

**`Internal`**

The computation function provided when the provider was created.
This function is called by the Scope during initialization or recomputation.

##### Parameters

###### reader

[`ScopeReader`](ScopeReader.md)

The reader for the current scope.

##### Returns

`T`

The computed value.

#### name?

> `optional` **name**: `string`

An optional name for debugging.
