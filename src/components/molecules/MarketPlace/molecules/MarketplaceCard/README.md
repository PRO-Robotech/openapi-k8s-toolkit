# MarketplaceCard

`MarketplaceCard` renders a marketplace panel card and optionally shows how many resources of that type exist in the current namespace.

File: `src/components/molecules/MarketPlace/molecules/MarketplaceCard/MarketplaceCard.tsx`

## Main behavior

- Navigation target depends on mode:
  - `addedMode || standalone` -> uses `getPathToNav(...)`
  - otherwise -> uses `getCreatePathToNav(...)`
- Resource counting is fetched via `useK8sSmartResource(...)` when:
  - `apiVersion` exists
  - `addedMode` is truthy
  - `type !== 'direct'`
- Card title shows count only in `addedMode`:
  - `x{itemsCount}` where `itemsCount = k8sList?.items?.length ?? 0`

## Visibility logic

`showZeroResources` defaults to `false`.

The component evaluates two states in `addedMode`:

1. `isUncountable`

- `addedMode` and (`k8sListError` or `type === 'direct'`)
- Means resource count cannot be trusted/computed.

2. `isCountableZero`

- `addedMode` and not `isUncountable` and `itemsCount === 0`
- Means count is known and equals zero.

Hide rule:

- If `showZeroResources === false` and (`isUncountable` or `isCountableZero`) -> `return null`

## Practical matrix

- `addedMode = false`
  - Card is shown (this zero-resource filter is not applied).
- `addedMode = true`, `type = 'direct'`, `showZeroResources = false`
  - Card is hidden (uncountable).
- `addedMode = true`, fetch error, `showZeroResources = false`
  - Card is hidden (uncountable).
- `addedMode = true`, count = `0`, `showZeroResources = false`
  - Card is hidden.
- `addedMode = true`, any of the above, `showZeroResources = true`
  - Card is shown.

## Props that influence this logic

- `addedMode?: boolean`
- `standalone?: boolean`
- `showZeroResources?: boolean` (default: `false`)
- `type: string`
- `apiVersion?: string`
- `cluster: string`
- `namespace: string`
- `apiGroup?: string`
