[**@shtse8/fluxus v1.0.0**](../../README.md)

---

[@shtse8/fluxus](../../README.md) / [src](../README.md) / ScopeReader

# Interface: ScopeReader

Defined in: [src/types.ts:24](https://github.com/shtse8/fluxus/blob/4924e60e87ca8856c0bf61d7c46469f55d63d7b6/src/types.ts#L24)

Provides read access to other providers within the current scope and methods
for managing the lifecycle of the current provider's state.
Passed to the provider's creation function.

## Methods

### onDispose()

> **onDispose**(`callback`): `void`

Defined in: [src/types.ts:49](https://github.com/shtse8/fluxus/blob/4924e60e87ca8856c0bf61d7c46469f55d63d7b6/src/types.ts#L49)

Adds a cleanup function to be called when the provider's state
associated with the current scope is disposed.

#### Parameters

##### callback

[`Dispose`](../type-aliases/Dispose.md)

The cleanup function to be executed.

#### Returns

`void`

---

### read()

> **read**\<`T`\>(`provider`): `T`

Defined in: [src/types.ts:33](https://github.com/shtse8/fluxus/blob/4924e60e87ca8856c0bf61d7c46469f55d63d7b6/src/types.ts#L33)

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

---

### watch()

> **watch**\<`T`\>(`provider`): `T`

Defined in: [src/types.ts:42](https://github.com/shtse8/fluxus/blob/4924e60e87ca8856c0bf61d7c46469f55d63d7b6/src/types.ts#L42)

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
