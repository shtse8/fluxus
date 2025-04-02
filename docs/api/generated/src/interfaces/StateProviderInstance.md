[**@shtse8/fluxus v1.0.0**](../../README.md)

***

[@shtse8/fluxus](../../README.md) / [src](../README.md) / StateProviderInstance

# Interface: StateProviderInstance()\<T\>

Defined in: [src/providers/stateProvider.ts:49](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/providers/stateProvider.ts#L49)

A specialized [Provider](../type-aliases/Provider.md) that manages a mutable piece of state.

It provides the current state value when read and allows the state to be
updated via an updater function obtained from the [Scope](../classes/Scope.md).
StateProviders are the primary way to introduce mutable state into the Fluxus system.

## Extends

- [`Provider`](../type-aliases/Provider.md)\<`T`\>

## Type Parameters

### T

`T`

The type of the state value.

> **StateProviderInstance**(`reader`): `T`

Defined in: [src/providers/stateProvider.ts:49](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/providers/stateProvider.ts#L49)

A specialized [Provider](../type-aliases/Provider.md) that manages a mutable piece of state.

It provides the current state value when read and allows the state to be
updated via an updater function obtained from the [Scope](../classes/Scope.md).
StateProviders are the primary way to introduce mutable state into the Fluxus system.

## Parameters

### reader

[`ScopeReader`](ScopeReader.md)

## Returns

`T`

## Properties

### \_fluxus\_provider\_type

> `readonly` **\_fluxus\_provider\_type**: `"StateProvider"`

Defined in: [src/providers/stateProvider.ts:65](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/providers/stateProvider.ts#L65)

**`Internal`**

A read-only property for easier type narrowing if needed.

***

### \[$stateProvider\]

> **\[$stateProvider\]**: `object`

Defined in: [src/providers/stateProvider.ts:51](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/providers/stateProvider.ts#L51)

**`Internal`**

A unique symbol used to identify StateProvider instances.

#### initializeState()

> **initializeState**: (`reader`, `internalId`) => `StateProviderState`\<`T`\>

**`Internal`**

The function called by the Scope to create the initial state
for this provider instance within that scope.

##### Parameters

###### reader

[`ScopeReader`](ScopeReader.md)

The reader for the initializing scope.

###### internalId

`number`

A unique ID assigned by the scope for debugging.

##### Returns

`StateProviderState`\<`T`\>

The initial internal state.

#### name?

> `optional` **name**: `string`

An optional name for debugging.
