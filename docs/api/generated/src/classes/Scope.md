[**@shtse8/fluxus v1.0.0**](../../README.md)

***

[@shtse8/fluxus](../../README.md) / [src](../README.md) / Scope

# Class: Scope

Defined in: [src/scope.ts:106](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/scope.ts#L106)

Manages the state and lifecycle of providers within a specific context.

## Implements

## Implements

- [`Disposable`](../interfaces/Disposable.md)

## Constructors

### Constructor

> **new Scope**(`_parent`, `overrides`): `Scope`

Defined in: [src/scope.ts:116](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/scope.ts#L116)

#### Parameters

##### \_parent

`null` | `Scope`

##### overrides

readonly [`ProviderOverride`](../interfaces/ProviderOverride.md)[] = `[]`

#### Returns

`Scope`

## Accessors

### isDisposed

#### Get Signature

> **get** **isDisposed**(): `boolean`

Defined in: [src/scope.ts:112](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/scope.ts#L112)

##### Returns

`boolean`

## Methods

### dispose()

> **dispose**(): `void`

Defined in: [src/scope.ts:750](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/scope.ts#L750)

Disposes of the resource or ends the lifecycle managed by this object.
Calling dispose multiple times should be safe (idempotent).

#### Returns

`void`

#### Implementation of

`Disposable.dispose`

***

### read()

> **read**\<`T`\>(`provider`): `T`

Defined in: [src/scope.ts:160](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/scope.ts#L160)

#### Type Parameters

##### T

`T`

#### Parameters

##### provider

[`Provider`](../type-aliases/Provider.md)\<`T`\>

#### Returns

`T`

***

### updater()

> **updater**\<`T`\>(`provider`): [`StateUpdater`](../type-aliases/StateUpdater.md)\<`T`\>

Defined in: [src/scope.ts:612](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/scope.ts#L612)

Retrieves the updater function for a StateProviderInstance.

#### Type Parameters

##### T

`T`

#### Parameters

##### provider

[`StateProviderInstance`](../interfaces/StateProviderInstance.md)\<`T`\>

#### Returns

[`StateUpdater`](../type-aliases/StateUpdater.md)\<`T`\>

***

### watch()

> **watch**\<`T`\>(`provider`, `callback`): [`Dispose`](../type-aliases/Dispose.md)

Defined in: [src/scope.ts:722](https://github.com/shtse8/fluxus/blob/213c71c5e98d0245d85ae1e863504b6b01882dfb/src/scope.ts#L722)

Subscribes a listener to a provider's state changes.

#### Type Parameters

##### T

`T`

#### Parameters

##### provider

[`Provider`](../type-aliases/Provider.md)\<`T`\>

##### callback

() => `void`

#### Returns

[`Dispose`](../type-aliases/Dispose.md)
