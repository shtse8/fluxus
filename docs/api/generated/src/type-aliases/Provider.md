[**@shtse8/fluxus v1.0.0**](../../README.md)

***

[@shtse8/fluxus](../../README.md) / [src](../README.md) / Provider

# Type Alias: Provider()\<T\>

> **Provider**\<`T`\> = (`reader`) => `T`

Defined in: [src/types.ts:67](https://github.com/shtse8/fluxus/blob/4924e60e87ca8856c0bf61d7c46469f55d63d7b6/src/types.ts#L67)

The core building block of Fluxus. A Provider defines how to create a value
within a specific scope. Providers are functions or objects that encapsulate
state creation logic.

Providers are typically created using factory functions like `stateProvider`,
`computedProvider`, etc.

They are identified by object identity, meaning you don't register them
with strings; you use the provider function/object itself as the key.

## Type Parameters

### T

`T`

The type of the value created by the provider.

## Parameters

### reader

[`ScopeReader`](../interfaces/ScopeReader.md)

A [ScopeReader](../interfaces/ScopeReader.md) instance to interact with the scope.

## Returns

`T`

The created value of type T.
