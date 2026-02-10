# ProjectInfoCard

`ProjectInfoCard` renders project-level details and related marketplace products for a selected namespace/project.

File: `src/components/molecules/ProjectInfoCard/ProjectInfoCard.tsx`

## What it does

- Loads marketplace panel definitions via `useK8sSmartResource(...)`.
- Loads the current project by `metadata.name=<namespace>` using `fieldSelector`.
- Shows action controls (update/delete) for the project when it is ready and user has permissions.
- Renders related marketplace cards as "added" products.

## Data flow

- Marketplace data source:
  - API: `baseApiGroup/baseApiVersion`
  - Resource plural: `marketplacePlural`
- Project data source:
  - API: `baseProjectApiGroup/baseProjectVersion`
  - Resource plural: `projectPlural`
  - Filter: `metadata.name=${namespace}`

## Permission logic

- Uses `usePermissions(...)` for project resource:
  - `verb: 'update'`
  - `verb: 'delete'`
- Action dropdown is shown only when:
  - project `Ready` condition is `True`
  - and at least one of update/delete is allowed

## MarketplaceCard integration

For each marketplace panel spec, component renders `MarketplaceCard` with:

- `addedMode` set to `true`
- `showZeroResources` forwarded from `ProjectInfoCard` props
- current `cluster` and `namespace`
- panel resource fields (`type`, `plural`, `apiGroup`, `apiVersion`, etc.)

This means card visibility/count behavior is delegated to:

- `src/components/molecules/MarketPlace/molecules/MarketplaceCard/MarketplaceCard.tsx`

## Props

- `cluster: string`
- `namespace?: string`
- `baseApiGroup: string`
- `baseApiVersion: string`
- `baseProjectApiGroup: string`
- `baseProjectVersion: string`
- `projectPlural: string`
- `marketplacePlural: string`
- `baseprefix?: string`
- `accessGroups: string[]`
- `showZeroResources?: boolean`
- `children?: any`

