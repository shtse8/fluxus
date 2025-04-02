[**@shtse8/fluxus v1.0.0**](../../README.md)

***

[@shtse8/fluxus](../../README.md) / [react-adapter](../README.md) / ProviderScope

# Function: ProviderScope()

> **ProviderScope**(`props`): `ReactElement`

Defined in: [react-adapter/ProviderScope.tsx:39](https://github.com/shtse8/fluxus/blob/4924e60e87ca8856c0bf61d7c46469f55d63d7b6/react-adapter/ProviderScope.tsx#L39)

A React component that creates and manages a Fluxus [Scope](../../src/classes/Scope.md) instance
and provides it to descendant components via React Context.

This is the entry point for using Fluxus providers within a React application tree.
It ensures that a stable scope is available and handles the automatic disposal
of the scope and its associated provider states when the component unmounts.

Scopes can be nested by nesting `ProviderScope` components.

## Parameters

### props

`ProviderScopeProps`

The component props.

## Returns

`ReactElement`

The provider component wrapping the children.

## Example

```tsx
ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <ProviderScope>
      <App />
    </ProviderScope>
  </React.StrictMode>,
)
```
