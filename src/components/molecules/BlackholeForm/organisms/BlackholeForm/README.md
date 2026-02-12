# BlackholeForm (`BlackholeForm.tsx`)

## Purpose

`BlackholeForm` is a schema-driven OpenAPI form + YAML editor bridge.

It keeps three things in sync:

1. Ant Design form values (`Form` state).
2. YAML representation (via BFF transform endpoints).
3. Effective schema (`properties`) including runtime `additionalProperties` materialization/pruning.

It supports both create/edit flows, wildcard prefills, wildcard hidden/expanded paths, dynamic array item handling, permissions-based submit gating, and submit-to-K8s API calls.

---

## High-level Architecture

Main subsystems inside the component:

1. **Form state / UI state**
   - `form` from `Form.useForm()`
   - `expandedKeys`, `persistedKeys`, `resolvedHiddenPaths`
   - `properties` as the live schema state (starts from `staticProperties`)
2. **Sync orchestration**
   - Values -> YAML (`getYamlValuesByFromValues`)
   - YAML -> Values (`getFormValuesByYaml`)
   - Both sides use debounce + request ids + abort controllers to avoid race bugs.
3. **Dynamic schema evolution**
   - `materializeAdditionalFromValues`: add schema nodes when values require them.
   - `pruneAdditionalForValues`: remove schema nodes when values/blocks indicate removal.
4. **Submission**
   - Validate form.
   - Convert values to YAML body through BFF.
   - Create/update resource via `createNewEntry` / `updateEntry`.

---

## Props Contract

### Identity / routing / API context

- `cluster`
- `type` (`builtin` | `apis`)
- `apiGroupApiVersion`
- `kind`
- `plural`
- `urlParams`, `urlParamsForPermissions`
- `backlink`

### Schema + rendering behavior

- `staticProperties`
- `required`
- `sortPaths`
- `hiddenPaths`
- `expandedPaths`
- `persistedPaths`
- `designNewLayout`, `designNewLayoutHeight`

### Prefills

- `formsPrefills` (path/value array; can contain wildcards)
- `prefillValuesSchema` (flat-ish prefill object, normalized by schema)
- `prefillValueNamespaceOnly`

### Mode / namespace

- `isCreate`
- `isNameSpaced` (`false` or namespace list)

### Theme

- `theme` (passed to `YamlEditor`)

---

## State and Refs

### State

- `properties`: live schema, mutable during runtime.
- `yamlValues`: data fed into `YamlEditor`.
- `isLoading`, `error`.
- `isDebugModalOpen`.
- `expandedKeys`: expanded sections in recursive form renderer.
- `persistedKeys`: fields explicitly marked to be persisted even when empty/implicit.
- `resolvedHiddenPaths`: wildcard-resolved hidden paths based on current values.

### Refs (critical for race-safe behavior)

- `expandedKeysRef`: always-current expanded keys for restoration after YAML/schema updates.
- `blockedPathsRef`: tombstones for paths removed by YAML diff/remove actions.
- `manualBlockedPathsRef`: subset representing explicit user removals (`removeField`), not auto-unblocked.
- `overflowRef`: scroll container (used on submit/error).
- `valuesToYamlReqId`, `yamlToValuesReqId`: monotonic request sequence guards.
- `valuesToYamlAbortRef`, `yamlToValuesAbortRef`: abort in-flight sync requests.
- `isAnyFieldFocusedRef`: prevents YAML->form application while user is actively typing.
- `prevArrayLengthsRef`: detects array grow/shrink and performs cleanup/prefill logic.
- `prevInitialValues`: prevents redundant initial prefill syncing.

---

## Derived Values

### `editorUri`

`inmemory://openapi-ui/{cluster}/{apiGroupApiVersion}/{type}/{plural}/{kind}/{create|edit}.yaml`

Used both as:

- `editorUri` prop for YAML model identity.
- React `key` for `YamlEditor` to force remount when resource context changes.

### `normalizedPrefill`

`normalizeValuesForQuotasToNumber(prefillValuesSchema, staticProperties)`

Important detail: this is intentionally based on `staticProperties`, not live `properties`, to avoid feedback loops.

### `initialValues`

Merged from:

1. Create defaults (`apiVersion`, `kind`) if `isCreate`.
2. Non-wildcard entries from `formsPrefills`.
3. `prefillValueNamespaceOnly` -> `metadata.namespace`.
4. `normalizedPrefill` flat keys converted to nested paths.

Then shallow key-sort for deterministic order.

### `prefillTemplates`

Wildcard templates from:

- `formsPrefills.spec.values`
- `normalizedPrefill` entries

Converted with `toWildcardPath`, sorted by path length descending (specific first).

### Wildcard hidden/expanded templates

- `hiddenWildcardTemplates` from `hiddenPaths` via `sanitizeWildcardPath`.
- `expandedWildcardTemplates` from `expandedPaths` via `sanitizeWildcardPath`.

Resolved against current values with `expandWildcardTemplates`.

---

## Lifecycle and Effects

### 1) Resource context change -> reset sync/editor

On `editorUri` change:

- Increment both request ids (invalidate stale responses).
- Abort both in-flight sync requests.
- Clear `yamlValues`.
- `YamlEditor` remount (via `key={editorUri}`) clears model-specific transient state.

### 2) Permission hooks

Runs both hooks continuously but each has mode-specific `enabler`:

- create permission enabled only in create mode.
- update permission enabled only in edit mode.

Submit button disabled when corresponding permission `allowed !== true`.

### 3) Initial wildcard resolve

When `initialValues` ready:

- Resolve hidden wildcard templates and set `resolvedHiddenPaths`.
- Resolve expanded templates and merge into `expandedKeys` (unique by JSON path key).

### 4) Form values watcher

`allValues = Form.useWatch([], form)` and effect `[allValues]` triggers `onValuesChangeCallback()`.

This is the core "react to any form change" pipeline.

### 5) Focus guard for YAML application

Listeners on `overflowRef`:

- `focusin` -> `isAnyFieldFocusedRef = true`.
- `focusout` outside root -> clear flag and trigger `onValuesChangeCallback()` (resync after typing).

### 6) Initial values re-sync guard

When computed `initialValues` changes and differs from `prevInitialValues`:

- call `onValuesChangeCallback(initialValues)`.

### 7) Persisted keys change re-sync

Whenever `persistedKeys` changes:

- call `onValuesChangeCallback()` so YAML payload includes latest persistence intent.

### 8) Initial expansion enrichment

On `[apiGroupApiVersion, formsPrefills, prefillValuesSchema, type, plural]`:

- Collect prefix paths from prefills (`getPrefixSubarrays`) and schema prefill paths.
- Merge into `expandedKeys` uniquely.

### 9) Initial schema materialization from initial values

When `initialValues` exists:

- run `materializeAdditionalFromValues`.
- if schema changed, update `properties`.
- merge returned `toPersist` into `persistedKeys`.

No auto-expand here by design (preserve user collapse/expand choices).

---

## Sync Pipeline: Form -> YAML

### Entry points

- Form `onValuesChange` callback
- `useEffect([allValues])`
- manual calls after add/remove/makeUndefined/blur/persist changes/initial sync

### `onValuesChangeCallback(values?, changedValues?)`

1. Build current value snapshot (`v`), scrubbing literal wildcard keys.
2. Resolve hidden/expanded wildcard templates against `v`.
3. Merge auto-expanded resolved paths into `expandedKeys`.
4. Detect array **shrink** and **grow** using `collectArrayLengths(v)` vs `prevArrayLengthsRef`.
5. Build payload `{ values: v, persistedKeys, properties }`.
6. Increment `valuesToYamlReqId` and call debounced values->yaml request.

### Array shrink handling

For arrays present in old and new snapshots where `newLen < prevLen`:

- Optionally scope purge to changed roots from `changedValues`.
- For each removed index subtree:
  - remove matching `expandedKeys`
  - remove matching `persistedKeys`
  - clear blocked/manualBlocked tombstones under removed subtree

This prevents ghost UI state and stale persist markers after item deletions.

### Array grow handling

For each new index:

- Initialize missing item with type-aware default based on schema inference:
  - object -> `{}`
  - array -> `[]`
  - number/integer/range -> `0`
  - boolean -> `false`
  - listInput -> `undefined`
  - fallback -> `''`
- Unblock that item path in `blockedPathsRef`.
- Apply wildcard prefill templates via `applyPrefillForNewArrayItem`.

### Debounced request: `debouncedPostValuesToYaml`

- Abort previous request.
- Call `/openapi-bff/forms/formSync/getYamlValuesByFromValues`.
- Ignore stale response if `myId` no longer current.
- On fresh success, `debouncedSetYamlValues(data)` updates editor payload.
- Errors are intentionally swallowed (abort/transient noise).

---

## Sync Pipeline: YAML -> Form

### Entry point

`onYamlChangeCallback(values)` from `YamlEditor`.

Behavior:

1. If a form field is currently focused, ignore this change (avoid clobbering typed input).
2. Build payload `{ values, properties }`.
3. Increment `yamlToValuesReqId`.
4. Call debounced YAML->values request.

### Debounced request: `debouncedPostYamlToValues`

1. Abort previous YAML->values request.
2. POST to `/openapi-bff/forms/formSync/getFormValuesByYaml`.
3. Ignore stale responses by request id.
4. Diff previous form paths vs incoming data paths:
   - Any path missing in incoming data:
     - `form.setFieldValue(path, undefined)`
     - add to `blockedPathsRef` (prevent immediate re-materialization)
5. `form.setFieldsValue(data)` to apply incoming values.
6. Unblock paths that reappeared in data, except manually blocked ones.
7. Restore expand state immediately with `setExpandedKeys(expandedKeysRef.current)`.
8. Reconcile schema:
   - prune (`pruneAdditionalForValues`)
   - materialize (`materializeAdditionalFromValues`)
   - no-op guard using `_.isEqual`
   - merge `toPersist` into `persistedKeys`
9. `queueMicrotask(() => setExpandedKeys(expandedKeysRef.current))` to restore expansion after schema-render churn.

Errors are silently ignored (mostly cancellations/transients).

---

## Additional Properties Lifecycle

### Add (`addField`)

1. Build nested schema patch rooted at `path` for `name`.
2. Merge into `properties` via `deepMerge`.
3. Unblock path in both blocked refs.
4. Initialize form value by declared type.
5. Add full path to `persistedKeys` if absent.
6. Trigger `onValuesChangeCallback()` for YAML sync.

### Remove (`removeField`)

1. Add full path to `blockedPathsRef` and `manualBlockedPathsRef`.
2. Set form value to `undefined`.
3. Remove matching subtrees from `expandedKeys` and `persistedKeys`.
4. Prune schema immediately with `pruneAdditionalForValues`.
5. Trigger `onValuesChangeCallback()`.

Manual block means path should not auto-return from generic unblocking until genuinely reintroduced.

---

## Submit Flow

`onSubmit`:

1. Scroll overflow container to bottom.
2. `form.validateFields()`.
3. Build values payload:
   - read all form fields
   - `scrubLiteralWildcardKeys`
   - include `persistedKeys` and current `properties`
4. Convert values -> YAML body via BFF endpoint `getYamlValuesByFromValues`.
5. Build K8s endpoint:
   - base: `/api/clusters/{cluster}/k8s/`
   - builtin uses no `apis/` prefix; apis includes it
   - include `/namespaces/{namespace}` when namespaced
   - include `{name}` only in edit mode
6. If create mode -> `createNewEntry`; else -> `updateEntry`.
7. On success: navigate to `backlink` if provided.
8. On failure:
   - set loading false
   - for "Required value" Axios errors, derive expansion paths via `handleSubmitError`
   - set `error` (error modal)
9. Validation errors use `handleValidationError` to auto-expand failing paths.

---

## Rendering Structure

1. `Styled.Container`
2. `Styled.OverflowContainer`
3. `Form` with:
   - `initialValues={initialValues}`
   - `onValuesChange={(_changedValues, all) => onValuesChangeCallback(all, _changedValues)}`
4. Providers wrapping recursive renderer:
   - `DesignNewLayoutProvider`
   - `OnValuesChangeCallbackProvider`
   - `IsTouchedPersistedProvider`
   - `HiddenPathsProvider`
5. Recursive fields via `getObjectFormItemsDraft(...)`, passed:
   - schema, required list, sort paths
   - namespace select metadata
   - add/remove/makeUndefined callbacks
   - expanded controls and persisted controls
6. Right pane `YamlEditor` with `key={editorUri}`, `currentValues={yamlValues || {}}`.
7. Bottom controls row:
   - Submit
   - optional Cancel (backlink)
   - debug button (opens schema JSON modal)
   - warning text (layout dependent)
8. Error modal when `error` exists.
9. Debug modal with lazy Monaco editor displaying live `properties`.

---

## Namespace Behavior

`namespaceData` is only passed when `isNameSpaced` is truthy:

- selectable namespaces come from `isNameSpaced` array.
- selector is disabled in edit mode (`disabled: !isCreate`).

Permissions query namespace uses current form `metadata.namespace`.

---

## Endpoint Summary

### BFF form sync

- Values -> YAML:
  - `POST /api/clusters/{cluster}/openapi-bff/forms/formSync/getYamlValuesByFromValues`
- YAML -> Values:
  - `POST /api/clusters/{cluster}/openapi-bff/forms/formSync/getFormValuesByYaml`

### Resource write

- Create: `createNewEntry({ endpoint, body })`
- Update: `updateEntry({ endpoint, body })`

Endpoint format:

- Builtin: `/api/clusters/{cluster}/k8s/{apiGroupApiVersion}/{plural}/{name?}`
- APIS: `/api/clusters/{cluster}/k8s/apis/{apiGroupApiVersion}/{plural}/{name?}`
- Namespaced inserts `/namespaces/{namespace}` before `{plural}`.

---

## Race-condition and Stability Guards

1. Debounce both sync directions.
2. Abort previous requests on new request start.
3. Request-id freshness checks for stale-response drop.
4. No-op schema update guards (`_.isEqual`) to avoid feedback loops.
5. Expansion restoration after YAML and after schema updates (`queueMicrotask`).
6. Focus guard to avoid YAML clobbering active input.
7. Manual blocked-path tombstones to preserve explicit user deletes.

---

## Known Intentional Behaviors

1. Sync request errors are swallowed in debounced sync functions (non-blocking editor experience).
2. Namespace field is not editable in edit mode.
3. Warning about recursive empty-field removal is always shown (layout variant differs).
4. Inline permission/error Alerts in form body are currently commented out; modal path is active for errors.
5. Debug button is always visible and shows live schema JSON.

---

## Relevant Tests

Primary behavioral tests are in:

- `src/components/molecules/BlackholeForm/organisms/BlackholeForm/BlackholeForm.test.tsx`

Covered scenarios include:

- create/edit submit endpoint/body correctness
- permission-based submit disable
- builtin vs apis endpoint format
- namespaced create endpoint
- additionalProperties add/edit/remove cycles
- materialization from YAML paste
- array add/remove sync stability
- deep nested additionalProperties lifecycle
- transform/submit error modal behavior
- cancel navigation
