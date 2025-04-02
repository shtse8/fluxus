[**@shtse8/fluxus v1.0.0**](../../README.md)

***

[@shtse8/fluxus](../../README.md) / [src](../README.md) / ScopeReader

# Interface: ScopeReader

Defined in: [src/types.ts:24](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/types.ts#L24)

Provides read access to other providers within the current scope and methods
for managing the lifecycle of the current provider's state.
Passed to the provider's creation function.

## Properties

### signal?

> `readonly` `optional` **signal**: `AbortSignal`

Defined in: [src/types.ts:58](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/types.ts#L58)

An AbortSignal that is aborted when the provider's state is disposed.
This can be used to cancel asynchronous operations like `fetch` requests
when the provider is no longer needed.
Only relevant for async providers.

## Methods

### onDispose()

> **onDispose**(`callback`): `void`

Defined in: [src/types.ts:50](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/types.ts#L50)

Adds a cleanup function to be called when the provider's state
associated with the current scope is disposed.

#### Parameters

##### callback

[`Dispose`](../type-aliases/Dispose.md)

The cleanup function to be executed.

#### Returns

`void`

***

### read()

> **read**\<`T`\>(`provider`): `T`

Defined in: [src/types.ts:34](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/types.ts#L34)

Reads the current value of a provider without subscribing to updates.
If the provider is not yet initialized in the scope, it will be created.

#### Type Parameters

##### T

`T`

#### Parameters

##### provider

[`Provider`](../type-aliases/Provider.md)\<`T`\>

The provider to read.

#### Returns

`T`

The current value of the dependency provider within the current scope.

***

### watch()

> **watch**\<`T`\>(`provider`): `T`

Defined in: [src/types.ts:43](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/types.ts#L43)

Watches the value of a provider and subscribes to updates.
This is typically used by reactive providers or UI bindings.

#### Type Parameters

##### T

`T`

#### Parameters

##### provider

[`Provider`](../type-aliases/Provider.md)\<`T`\>

The dependency provider to watch.

#### Returns

`T`

The current value of the provider.
