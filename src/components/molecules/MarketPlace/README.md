# MarketPlace

`MarketPlace` renders marketplace panels, search/tag filtering, edit mode controls, and create/update/delete modals.

File: `src/components/molecules/MarketPlace/MarketPlace.tsx`

## What it does

- Loads marketplace panel CRs via `useK8sSmartResource(...)`.
- Builds visible cards list:
  - in edit mode: includes hidden cards
  - in normal mode: excludes `hidden: true`
- Supports tag/search filtering.
- Renders `MarketplaceCard` for each panel.
- Shows add/edit/delete UI based on permissions from `usePermissions(...)`.

## Permissions and edit mode

- `create`, `update`, `delete` permissions are queried for the marketplace resource.
- Edit mode switch is shown only if at least one permission is allowed.
- In edit mode:
  - Add card is visible.
  - Per-card edit/delete handlers are enabled.

## Important props

- `cluster: string`
- `namespace?: string`
- `baseApiGroup: string`
- `baseApiVersion: string`
- `marketplacePlural: string`
- `marketplaceKind: string`
- `baseprefix?: string`
- `standalone?: boolean`
- `addedMode?: boolean`
- `showZeroResources?: boolean`

## `addedMode` behavior

- `MarketPlace` forwards `addedMode` to each `MarketplaceCard`.
- This controls whether cards behave like "already added" resources:
  - affects navigation target in `MarketplaceCard`
  - enables resource count behavior in `MarketplaceCard`

## `showZeroResources` behavior

- `MarketPlace` forwards `showZeroResources` to each `MarketplaceCard`.
- Actual hide/show decision for zero/uncountable resources is implemented in:
  - `src/components/molecules/MarketPlace/molecules/MarketplaceCard/MarketplaceCard.tsx`
  - documented in:
    `src/components/molecules/MarketPlace/molecules/MarketplaceCard/README.md`

