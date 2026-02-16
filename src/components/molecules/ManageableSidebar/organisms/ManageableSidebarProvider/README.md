# ManageableSidebarProvider

Provider file: `src/components/molecules/ManageableSidebar/organisms/ManageableSidebarProvider/ManageableSidebarProvider.tsx`

Utils file: `src/components/molecules/ManageableSidebar/organisms/ManageableSidebarProvider/utils.tsx`

## What It Does

- Fetches sidebar resources from Kubernetes CR API (`useK8sSmartResource`).
- Selects one sidebar spec by `idToCompare` (or `fallbackIdToCompare`).
- Transforms CR `menuItems` into AntD `ItemType[]`.
- Resolves `selectedKeys` from current URL and optional tags.

## Input CR Shape

From `types.ts`:
- `spec.id: string`
- `spec.menuItems: TLink[]`
- `spec.keysAndTags?: Record<string, string[]>`
- `spec.externalKeys?: string[]`

`TLink`:
- `key: string`
- `label: string`
- `link?: string`
- `resourcesList?: { cluster: string; apiGroup?: string; apiVersion: string; plural: string; namespace?: string; linkToResource: string; jsonPathToName: string }`
- `children?: TLink[]`

`resourcesList` behavior:
- Provider fetches via `useK8sSmartResource` using templated GVR fields (`cluster/apiGroup/apiVersion/plural/namespace`), one fetcher per `resourcesList` entry.
- For each returned list item, `jsonPathToName` extracts item name.
- A child item is generated under this node:
  - `label = extracted name`
  - `link = linkToResource` with `{resourceName}` + regular placeholders resolved

## `prepareDataForManageableSidebar(...)`

Signature summary:
- `data`: array of sidebar specs
- `replaceValues`: template replacements
- `multiQueryData?`: extra values for `parseAll`
- `pathname`, `searchParams?`
- `idToCompare`, `fallbackIdToCompare?`
- `currentTags?`

Return:
- `{ menuItems: ItemType[]; selectedKeys: string[] }`
- or `undefined` when target sidebar id is not found

## Utils Logic

1. `mapLinksFromRaw(...)`
- Recursively maps raw `TLink[]` to AntD menu items.
- Builds `internalMetaLink` per node for matching.
- Parses `label` and `link` with:
  - `parseAll({ text, replaceValues, multiQueryData })`
- If `resourcesList` is defined, appends generated children from fetched list data.

2. `getLabel(...)`
- If node has link and key is in `externalKeys`, returns `<a>` with `window.open(...)`.
- If node has link and is not external, returns `<Link to=...>`.
- If no link, returns plain parsed string.

3. `findMatchingItems(...)`
- Traverses menu tree and returns flattened key paths for matches.
- Match conditions:
  - `internalMetaLink === pathname` (normalized)
  - `internalMetaLink === pathname + searchParams` (normalized)
  - tag match (`keysAndTags[node.key]` intersects parsed `currentTags`)

4. Selection output
- Collected `React.Key[]` is converted to `string[]` as `selectedKeys`.
- Internal `internalMetaLink` is stripped from final returned `menuItems` before rendering.

## Provider Early Returns

`ManageableSidebarProvider` returns `null` when:
- fetch error
- no data
- `hidden === true`
- id/fallback resolution fails (`prepareDataForManageableSidebar` returns `undefined`)

Returns `<Spin />` while loading.

## Notes

- `multiQueryData` defaults to `{}` inside `prepareDataForManageableSidebar`.
- URL matching is exact, not partial.
- Query matching supports either `searchParams` prop or query already inside `pathname`.
