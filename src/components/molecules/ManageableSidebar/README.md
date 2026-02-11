# ManageableSidebar

`ManageableSidebar` renders a navigation menu from CR-driven config, with path/tag-based selection and template parsing.

Files:
- `src/components/molecules/ManageableSidebar/index.ts`
- `src/components/molecules/ManageableSidebar/organisms/ManageableSidebar/ManageableSidebar.tsx`
- `src/components/molecules/ManageableSidebar/organisms/ManageableSidebarProvider/ManageableSidebarProvider.tsx`
- `src/components/molecules/ManageableSidebar/organisms/ManageableSidebarProvider/utils.tsx`

## Exports

- `ManageableSidebar` (presentational menu)
- `ManageableSidebarProvider` (data fetch + mapping + render)
- `prepareDataForManageableSidebar` (pure transformer used by provider)

## Data Flow

1. `ManageableSidebarProvider` fetches sidebar CRs via `useK8sSmartResource`.
2. It maps `rawData.items[].spec` and calls `prepareDataForManageableSidebar(...)`.
3. If result exists, it renders `ManageableSidebar` with:
   - `menuItems` (AntD menu tree)
   - `selectedKeys` (resolved active branch/path)

## Important Props (`ManageableSidebarProvider`)

- `cluster`, `apiGroup`, `apiVersion`, `plural`, `isEnabled`
- `replaceValues: Record<string, string | undefined>`
- `multiQueryData?: Record<string, unknown>`
- `pathname`, `searchParams?`
- `idToCompare`, `fallbackIdToCompare?`
- `currentTags?`, `hidden?`, `noMarginTop?`

## Template Support

`utils.tsx` uses `parseAll(...)` for menu label/link/tag templating.

This means sidebar templates can resolve:
- parts-of-url placeholders via `replaceValues` (for example `{0}`, `{1}`)
- multi-query placeholders via `multiQueryData` (for example `req0`-based templates supported by `parseAll`)

## Selection Behavior

`selectedKeys` is resolved from:
- exact internal link match against `pathname`
- exact internal link match against `pathname + searchParams` (when provided)
- tag matching via `keysAndTags` + `currentTags`

For nested items, selected keys include the full ancestor path.

## Open/Close State Persistence

`ManageableSidebar` stores menu `openKeys` in `localStorage` under:
- `menuOpenKeys`

It restores this on mount and updates it on every submenu open/close change.

## External Links

If a menu item key is listed in `externalKeys`:
- label renders as `<a>`
- click opens `window.open(...)`
- relative links are converted to absolute URL using `window.location.origin`

Otherwise items render as router links via `react-router-dom` `Link`.
