[**@shtse8/fluxus v1.0.0**](../../README.md)

---

[@shtse8/fluxus](../../README.md) / [src](../README.md) / Scope

# Class: Scope

Defined in: [src/scope.ts:70](https://github.com/shtse8/fluxus/blob/4924e60e87ca8856c0bf61d7c46469f55d63d7b6/src/scope.ts#L70)

Manages the state and lifecycle of providers within a specific context.
Scopes can be nested to allow for overriding providers in different parts
of an application. Each scope maintains its own instance of provider states.

## Implements

## Implements

- [`Disposable`](../interfaces/Disposable.md)

## Constructors

### Constructor

> **new Scope**(`parent`?): `Scope`

Defined in: [src/scope.ts:93](https://github.com/shtse8/fluxus/blob/4924e60e87ca8856c0bf61d7c46469f55d63d7b6/src/scope.ts#L93)

Creates a new Scope instance.

#### Parameters

##### parent?

An optional parent scope. If provided,
this scope can potentially inherit or override providers from the parent
(behavior depends on specific provider implementations and future features).

`null` | `Scope`

#### Returns

`Scope`

## Accessors

### isDisposed

#### Get Signature

> **get** **isDisposed**(): `boolean`

Defined in: [src/scope.ts:83](https://github.com/shtse8/fluxus/blob/4924e60e87ca8856c0bf61d7c46469f55d63d7b6/src/scope.ts#L83)

Indicates whether the scope has been disposed. Once disposed, a scope
cannot be used to read or initialize providers.

##### Returns

`boolean`

True if the scope is disposed, false otherwise.

## Methods

### dispose()

> **dispose**(): `void`

Defined in: [src/scope.ts:554](https://github.com/shtse8/fluxus/blob/4924e60e87ca8856c0bf61d7c46469f55d63d7b6/src/scope.ts#L554)

Disposes of the resource or ends the lifecycle managed by this object.
Calling dispose multiple times should be safe (idempotent).

#### Returns

`void`

#### Implementation of

`Disposable.dispose`

---

### read()

> **read**\<`T`\>(`provider`): `T`

Defined in: [src/scope.ts:125](https://github.com/shtse8/fluxus/blob/4924e60e87ca8856c0bf61d7c46469f55d63d7b6/src/scope.ts#L125)

Reads the current value of a given provider within this scope.

If the provider has already been initialized in this scope, its cached value
is returned. If the provider's state is marked as stale (due to a dependency change),
it will be recomputed before returning the value.

If the provider has not been initialized, its creation function will be executed,
its dependencies tracked, and the resulting value cached and returned.

Throws an error if the scope or the specific provider state has been disposed,
or if a circular dependency is detected during initialization.

#### Type Parameters

##### T

`T`

The type of the value provided.

#### Parameters

##### provider

[`Provider`](../type-aliases/Provider.md)\<`T`\>

The provider function/object to read.

#### Returns

`T`

The current value of the provider.

#### Throws

If the scope or provider state is disposed.

#### Throws

If a circular dependency is detected.

---

### updater()

> **updater**\<`T`\>(`provider`): [`StateUpdater`](../type-aliases/StateUpdater.md)\<`T`\>

Defined in: [src/scope.ts:373](https://github.com/shtse8/fluxus/blob/4924e60e87ca8856c0bf61d7c46469f55d63d7b6/src/scope.ts#L373)

Retrieves the specialized updater function for a [StateProviderInstance](../interfaces/StateProviderInstance.md).

This method ensures the provider is initialized and is indeed a `StateProvider`.
It returns a function that, when called, will update the provider's state
within this specific scope and notify listeners and dependents.

Throws an error if the scope is disposed, the provider is not a `StateProviderInstance`,
or the provider state is disposed or inconsistent.

#### Type Parameters

##### T

`T`

The type of the state managed by the StateProvider.

#### Parameters

##### provider

[`StateProviderInstance`](../interfaces/StateProviderInstance.md)\<`T`\>

The StateProviderInstance whose updater is needed.

#### Returns

[`StateUpdater`](../type-aliases/StateUpdater.md)\<`T`\>

The updater function bound to this scope and provider.

#### Throws

If the scope is disposed.

#### Throws

If the provider is not a valid, initialized StateProvider in this scope.

---

### watch()

> **watch**\<`T`\>(`provider`, `callback`): [`Dispose`](../type-aliases/Dispose.md)

Defined in: [src/scope.ts:497](https://github.com/shtse8/fluxus/blob/4924e60e87ca8856c0bf61d7c46469f55d63d7b6/src/scope.ts#L497)

Subscribes a listener function to changes in a specific provider's state within this scope.

Currently, only [StateProviderInstance](../interfaces/StateProviderInstance.md) actively supports notifications. Watching
other provider types might read the initial value but won't trigger the callback
on changes (unless they are dependents of a changing StateProvider, triggering staleness).

Ensures the provider is initialized before attempting to add the listener.
Implements auto-disposal: when the last listener for a provider unsubscribes,
the provider's internal state is disposed.

#### Type Parameters

##### T

`T`

The type of the value provided.

#### Parameters

##### provider

[`Provider`](../type-aliases/Provider.md)\<`T`\>

The provider to watch.

##### callback

() => `void`

The function to call when the provider's state changes.

#### Returns

[`Dispose`](../type-aliases/Dispose.md)

A function to call to unsubscribe the listener.
