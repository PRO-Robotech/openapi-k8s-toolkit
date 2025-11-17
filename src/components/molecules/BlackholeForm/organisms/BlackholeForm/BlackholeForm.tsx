/* eslint-disable no-restricted-syntax */
/* eslint-disable no-plusplus */
/* eslint-disable @typescript-eslint/no-explicit-any */
/* eslint-disable no-nested-ternary */
/* eslint-disable max-lines-per-function */
/* eslint-disable no-console */
import React, { FC, useState, useEffect, useMemo, useCallback, useRef, Suspense } from 'react'
import { useDebounceCallback } from 'usehooks-ts'
import { theme as antdtheme, Form, Button, Alert, Flex, Modal, Typography } from 'antd'
import { BugOutlined } from '@ant-design/icons'
import { useNavigate } from 'react-router-dom'
import axios, { isAxiosError } from 'axios'
import _ from 'lodash'
import { OpenAPIV2 } from 'openapi-types'
import { TJSON } from 'localTypes/JSON'
import { TFormName, TUrlParams } from 'localTypes/form'
import { TFormPrefill } from 'localTypes/formExtensions'
import { TRequestError } from 'localTypes/api'
import { TYamlByValuesReq, TYamlByValuesRes, TValuesByYamlReq, TValuesByYamlRes } from 'localTypes/bff/form'
import { usePermissions } from 'hooks/usePermissions'
import { createNewEntry, updateEntry } from 'api/forms'
import { filterSelectOptions } from 'utils/filterSelectOptions'
import { normalizeValuesForQuotasToNumber } from 'utils/normalizeValuesForQuotas'
import { getAllPathsFromObj } from 'utils/getAllPathsFromObj'
import { getPrefixSubarrays } from 'utils/getPrefixSubArrays'
import { deepMerge } from 'utils/deepMerge'
import { FlexGrow, Spacer } from 'components/atoms'
import { YamlEditor } from '../../molecules'
import { getObjectFormItemsDraft } from './utils'
import { pathKey, pruneAdditionalForValues, materializeAdditionalFromValues } from './helpers/casts'
import {
  TTemplate,
  toWildcardPath,
  collectArrayLengths,
  templateMatchesArray,
  buildConcretePathForNewItem,
  scrubLiteralWildcardKeys,
} from './helpers/prefills'
import { DEBUG_PREFILLS, dbg, group, end, wdbg, wgroup, wend, prettyPath } from './helpers/debugs'
import { sanitizeWildcardPath, expandWildcardTemplates, toStringPath, isPrefix } from './helpers/hiddenExpanded'
import { handleSubmitError, handleValidationError } from './utilsErrorHandler'
import { Styled } from './styled'
import {
  DesignNewLayoutProvider,
  HiddenPathsProvider,
  OnValuesChangeCallbackProvider,
  IsTouchedPersistedProvider,
} from './context'

export type TBlackholeFormProps = {
  cluster: string
  theme: 'light' | 'dark'
  urlParams: TUrlParams
  urlParamsForPermissions: {
    apiGroup?: string
    typeName?: string
  }
  formsPrefills?: TFormPrefill
  staticProperties: OpenAPIV2.SchemaObject['properties']
  required: string[]
  hiddenPaths?: string[][]
  expandedPaths: string[][]
  persistedPaths: string[][]
  sortPaths?: string[][]
  prefillValuesSchema?: TJSON
  prefillValueNamespaceOnly?: string
  isNameSpaced?: false | string[]
  isCreate?: boolean
  type: 'builtin' | 'apis'
  apiGroupApiVersion: string
  kindName: string
  typeName: string
  backlink?: string | null
  designNewLayout?: boolean
  designNewLayoutHeight?: number
}

const Editor = React.lazy(() => import('@monaco-editor/react'))

export const BlackholeForm: FC<TBlackholeFormProps> = ({
  cluster,
  theme,
  urlParams,
  urlParamsForPermissions,
  formsPrefills,
  staticProperties,
  required,
  hiddenPaths,
  expandedPaths,
  persistedPaths,
  sortPaths,
  prefillValuesSchema,
  prefillValueNamespaceOnly,
  isNameSpaced,
  isCreate,
  type,
  apiGroupApiVersion,
  kindName,
  typeName,
  backlink,
  designNewLayout,
  designNewLayoutHeight,
}) => {
  const { token } = antdtheme.useToken()
  const navigate = useNavigate()

  const [form] = Form.useForm()

  // onValuesChange do not work properly
  const allValues = Form.useWatch([], form)
  const namespaceFromFormData = Form.useWatch<string>(['metadata', 'namespace'], form)

  const [properties, setProperties] = useState<OpenAPIV2.SchemaObject['properties']>(staticProperties)
  const [yamlValues, setYamlValues] = useState<Record<string, unknown>>()
  const debouncedSetYamlValues = useDebounceCallback(setYamlValues, 500)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<TRequestError>()

  const [isDebugModalOpen, setIsDebugModalOpen] = useState<boolean>(false)

  //     Create a React state variable called `expandedKeys` to store the current expanded form paths.
  //     `_setExpandedKeys` is the internal setter returned by `useState`, but we’ll wrap it below.
  const [expandedKeys, _setExpandedKeys] = useState<TFormName[]>(expandedPaths || [])
  //     Create a mutable ref that always holds the latest value of `expandedKeys`.
  //     Unlike React state, updating a ref does *not* trigger a re-render —
  //     this lets us access the most recent expansion list even inside stale closures or async callbacks.
  const expandedKeysRef = useRef<TFormName[]>(expandedPaths || [])
  //     Define our own wrapper function `setExpandedKeys`
  //     so we can update *both* the state and the ref at the same time.
  //     This ensures they always stay in sync.
  const setExpandedKeys = (
    next: TFormName[] | ((prev: TFormName[]) => TFormName[]), // can pass a new array OR an updater function
  ) => {
    //     Call the internal React setter `_setExpandedKeys`.
    //     It can accept a callback that receives the previous value (`prev`).
    _setExpandedKeys(prev => {
      //     Determine the new value:
      //     - If `next` is a function, call it with the previous array to get the new one.
      //     - If it’s already an array, use it directly.
      const value = typeof next === 'function' ? (next as (p: TFormName[]) => TFormName[])(prev) : next
      //     Immediately update the ref so it always mirrors the latest value.
      //     This is crucial because state updates are asynchronous,
      //     but ref updates are synchronous and happen right away.
      expandedKeysRef.current = value
      // 7️⃣  Return the new value to React so it updates the state as usual.
      return value
    })
  }
  const [persistedKeys, setPersistedKeys] = useState<TFormName[]>(persistedPaths || [])
  const [resolvedHiddenPaths, setResolvedHiddenPaths] = useState<TFormName[]>([])

  const blockedPathsRef = useRef<Set<string>>(new Set())
  const overflowRef = useRef<HTMLDivElement | null>(null)
  const valuesToYamlReqId = useRef(0)
  const yamlToValuesReqId = useRef(0)
  // const skipFirstPersistedKeysEffect = useRef(true)
  const valuesToYamlAbortRef = useRef<AbortController | null>(null)
  const yamlToValuesAbortRef = useRef<AbortController | null>(null)
  const isAnyFieldFocusedRef = useRef<boolean>(false)

  // --- Feature: clear editor after resource change ---
  // A unique identifier for the YAML model of the currently selected resource
  const editorUri = useMemo(
    () =>
      `inmemory://openapi-ui/${cluster}/${apiGroupApiVersion}/${type}/${typeName}/${kindName}${
        isCreate ? '/create' : '/edit'
      }.yaml`,
    [cluster, apiGroupApiVersion, type, typeName, kindName, isCreate],
  )

  // When the resource changes, cancel any in-flight requests and clear YAML to avoid bleed-through
  useEffect(() => {
    // bump req ids so late responses are ignored
    valuesToYamlReqId.current++
    yamlToValuesReqId.current++

    // cancel in-flight calls
    try {
      valuesToYamlAbortRef.current?.abort()
    } catch (err) {
      console.error(err)
    }
    try {
      yamlToValuesAbortRef.current?.abort()
    } catch (err) {
      console.error(err)
    }

    // clear current YAML shown in the editor; it will be repopulated by onValuesChangeCallback
    setYamlValues(undefined)
    // also clear any pending external update flags inside the YAML editor by forcing a remount
    // (done by passing key={editorUri} below)
  }, [editorUri])

  // --- Feature: permissions ---
  const createPermission = usePermissions({
    group: type === 'builtin' ? undefined : urlParamsForPermissions.apiGroup ? urlParamsForPermissions.apiGroup : '',
    resource: urlParamsForPermissions.typeName || '',
    namespace: isNameSpaced ? namespaceFromFormData : undefined,
    clusterName: cluster,
    verb: 'create',
    refetchInterval: false,
    enabler: isCreate === true,
  })

  const updatePermission = usePermissions({
    group: type === 'builtin' ? undefined : urlParamsForPermissions.apiGroup ? urlParamsForPermissions.apiGroup : '',
    resource: urlParamsForPermissions.typeName || '',
    namespace: isNameSpaced ? namespaceFromFormData : undefined,
    clusterName: cluster,
    verb: 'update',
    refetchInterval: false,
    enabler: isCreate !== true,
  })

  // --- Feature: submit handler ---
  const onSubmit = () => {
    if (overflowRef.current) {
      const { scrollHeight, clientHeight } = overflowRef.current
      overflowRef.current.scrollTo({
        top: scrollHeight - clientHeight,
        behavior: 'smooth',
      })
    }
    form
      .validateFields()
      .then(() => {
        setIsLoading(true)
        setError(undefined)
        const name = form.getFieldValue(['metadata', 'name'])
        const namespace = form.getFieldValue(['metadata', 'namespace'])

        const valuesRaw = form.getFieldsValue()
        const values = scrubLiteralWildcardKeys(valuesRaw)
        const payload: TYamlByValuesReq = {
          values,
          persistedKeys,
          properties,
        }

        axios
          .post<TYamlByValuesRes>(
            `/api/clusters/${cluster}/openapi-bff/forms/formSync/getYamlValuesByFromValues`,
            payload,
          )
          .then(({ data }) => {
            const body = data
            const endpoint = `/api/clusters/${cluster}/k8s/${type === 'builtin' ? '' : 'apis/'}${apiGroupApiVersion}${
              isNameSpaced ? `/namespaces/${namespace}` : ''
            }/${typeName}/${isCreate ? '' : name}`

            if (isCreate) {
              createNewEntry({ endpoint, body })
                .then(res => {
                  console.log(res)
                  if (backlink) {
                    navigate(backlink)
                  }
                })
                .catch(error => {
                  console.log('Form submit error', error)
                  setIsLoading(false)
                  if (isAxiosError(error) && error.response?.data.message.includes('Required value')) {
                    const keys = handleSubmitError({ error, expandedKeys })
                    setExpandedKeys([...keys])
                  }
                  setError(error)
                })
            } else {
              updateEntry({ endpoint, body })
                .then(res => {
                  console.log(res)
                  if (backlink) {
                    navigate(backlink)
                  }
                })
                .catch(error => {
                  console.log('Form submit error', error)
                  setIsLoading(false)
                  if (isAxiosError(error) && error.response?.data.message.includes('Required value')) {
                    const keys = handleSubmitError({ error, expandedKeys })
                    setExpandedKeys([...keys])
                  }
                  setError(error)
                })
            }
          })
          .catch(error => {
            console.log('BFF Transform Error', error)
            setIsLoading(false)
            if (overflowRef.current) {
              const { scrollHeight, clientHeight } = overflowRef.current
              overflowRef.current.scrollTo({
                top: scrollHeight - clientHeight,
                behavior: 'smooth',
              })
            }
            setError(error)
          })
      })
      .catch((error: { errorFields: { name: TFormName; errors: string[]; warnings: string[] }[] } & unknown) => {
        console.log('Validating error', error)
        const keys = handleValidationError({ error, expandedKeys })
        setExpandedKeys([...keys])
      })
  }

  // --- Feature: initial values ---
  /*
   Compute the initial form values once per relevant dependency change.
   This gathers defaults from multiple sources (create-mode defaults, form-specific
   prefills, namespace-only prefill, and a schema-driven prefill), merges them into
   a single nested object, and returns a shallowly sorted object for stable key order.

   + FIX: decouple from `properties`. We precompute a normalized prefill using `staticProperties`,
   then keep `initialValues` independent of `properties` to avoid feedback loops.
  */

  // Precompute normalized prefill once based on staticProperties (stable), not on `properties`
  const normalizedPrefill = useMemo(() => {
    if (!prefillValuesSchema) return undefined
    return normalizeValuesForQuotasToNumber(prefillValuesSchema, staticProperties)
  }, [prefillValuesSchema, staticProperties])

  const initialValues = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allValues: Record<string, any> = {}

    if (isCreate) {
      _.set(allValues, ['apiVersion'], apiGroupApiVersion === 'api/v1' ? 'v1' : apiGroupApiVersion)
      _.set(allValues, ['kind'], kindName)
    }

    if (formsPrefills) {
      formsPrefills.spec.values.forEach(({ path, value }) => {
        const hasWildcard = path.some(seg => seg === '*')
        if (!hasWildcard) {
          _.set(allValues, path, value)
        }
        // Wildcard templates are handled later by prefillTemplates/applyPrefillForNewArrayItem
      })
    }

    if (prefillValueNamespaceOnly) {
      _.set(allValues, ['metadata', 'namespace'], prefillValueNamespaceOnly)
    }

    if (normalizedPrefill) {
      Object.entries(normalizedPrefill).forEach(([flatKey, v]) => {
        _.set(allValues, flatKey.split('.'), v)
      })
    }

    const sorted = Object.fromEntries(Object.entries(allValues).sort(([a], [b]) => a.localeCompare(b)))
    return sorted
  }, [formsPrefills, prefillValueNamespaceOnly, isCreate, apiGroupApiVersion, kindName, normalizedPrefill])

  // --- Feature: wild card prefills ---
  // Build wildcard-based prefill templates from both formsPrefills and normalizedPrefill
  const prefillTemplates = useMemo<TTemplate[]>(() => {
    const templates: TTemplate[] = []

    // From formsPrefills (authoritative, uses path arrays already)
    if (formsPrefills?.spec?.values?.length) {
      // eslint-disable-next-line no-restricted-syntax
      for (const { path, value } of formsPrefills.spec.values) {
        templates.push({ wildcardPath: toWildcardPath(path), value })
      }
    }

    // From normalizedPrefill (flat dot-keys)
    if (normalizedPrefill) {
      // eslint-disable-next-line no-restricted-syntax
      for (const [flatKey, v] of Object.entries(normalizedPrefill)) {
        const parts = flatKey.split('.').map(seg => (/^\d+$/.test(seg) ? Number(seg) : seg))
        templates.push({ wildcardPath: toWildcardPath(parts), value: v })
      }
    }

    // stable order: longer (more specific) templates first
    return templates.sort((a, b) => b.wildcardPath.length - a.wildcardPath.length)
  }, [formsPrefills, normalizedPrefill])

  useEffect(() => {
    if (!DEBUG_PREFILLS) return
    dbg('templates (wildcards, ordered specific→generic):')
    prefillTemplates.forEach((t, i) => dbg(`#${i}`, t.wildcardPath.join('.'), '=>', t.value))
  }, [prefillTemplates])

  // track previous array lengths (just under your other useRefs)
  const prevArrayLengthsRef = useRef<Map<string, number>>(new Map())

  const applyPrefillForNewArrayItem = useCallback(
    (arrayPath: (string | number)[], newIndex: number) => {
      group(`apply for ${JSON.stringify(arrayPath)}[${newIndex}]`)
      // eslint-disable-next-line no-restricted-syntax
      for (const tpl of prefillTemplates) {
        const matches = templateMatchesArray(tpl, arrayPath)
        dbg(matches ? '✅ match' : '❌ no match', tpl.wildcardPath.join('.'))
        // eslint-disable-next-line no-continue
        if (!matches) continue

        const concretePath = buildConcretePathForNewItem(tpl, arrayPath, newIndex)
        const current = form.getFieldValue(concretePath as any)
        dbg('current value at path', concretePath, ':', current)

        if (typeof current === 'undefined') {
          const toSet = _.cloneDeep(tpl.value)
          dbg('setting value', { path: concretePath, value: toSet })
          form.setFieldValue(concretePath as any, toSet)
        } else {
          dbg('skipping set (already has value)')
        }
      }
      end() // apply group
    },
    [form, prefillTemplates],
  )

  // --- Feature: wildcard hidden/expanded items ---
  // Raw props: hiddenPaths?: string[][], expandedPaths: string[][]
  // Normalize: strings/nums/objects → allow '*' wildcards
  const hiddenWildcardTemplates = useMemo<(string | number)[][]>(() => {
    const raw = hiddenPaths ?? []
    wgroup('hidden raw templates')
    raw.forEach((p, i) => wdbg(`#${i}`, p))
    wend()
    const sanitized = raw.map(p => sanitizeWildcardPath(p as (string | number | unknown)[]))
    wgroup('hidden sanitized templates')
    sanitized.forEach((p, i) => wdbg(`#${i}`, prettyPath(p)))
    wend()
    return sanitized
  }, [hiddenPaths])

  const expandedWildcardTemplates = useMemo<(string | number)[][]>(() => {
    const raw = expandedPaths ?? []
    wgroup('expanded raw templates')
    raw.forEach((p, i) => wdbg(`#${i}`, p))
    wend()
    const sanitized = raw.map(p => sanitizeWildcardPath(p as (string | number | unknown)[]))
    wgroup('expanded sanitized templates')
    sanitized.forEach((p, i) => wdbg(`#${i}`, prettyPath(p)))
    wend()
    return sanitized
  }, [expandedPaths])

  useEffect(() => {
    if (!initialValues) return
    wgroup('initial resolve')

    const hiddenResolved = expandWildcardTemplates(hiddenWildcardTemplates, initialValues as any, {
      includeMissingExact: true,
      includeMissingFinalForWildcard: true,
    })
    wdbg('hidden resolved', hiddenResolved.map(prettyPath))
    setResolvedHiddenPaths(hiddenResolved as TFormName[])

    const expandedResolved = expandWildcardTemplates(expandedWildcardTemplates, initialValues as any)
    wdbg('expanded resolved', expandedResolved.map(prettyPath))
    setExpandedKeys(prev => {
      const seen = new Set(prev.map(x => JSON.stringify(x)))
      const merged = [...prev]
      // eslint-disable-next-line no-restricted-syntax
      for (const p of expandedResolved) {
        const k = JSON.stringify(p as any)
        if (!seen.has(k)) {
          seen.add(k)
          merged.push(p as any)
        }
      }
      return merged
    })

    wend()
  }, [initialValues, hiddenWildcardTemplates, expandedWildcardTemplates])

  const resolvedHiddenStringPaths = useMemo<string[][]>(
    () => resolvedHiddenPaths.map(toStringPath),
    [resolvedHiddenPaths],
  )

  // --- Feature: form and yaml editor syncs ---
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prevInitialValues = useRef<Record<string, any>>()

  /**
   * Debounced function that synchronizes form values to YAML using a backend API.
   * It cancels previous requests when new ones are triggered, ensuring only the latest state is processed.
   *
   * @param payload - Data to send to the API (form values + metadata)
   * @param myId - Unique identifier for this particular request (to ignore stale responses)
   */
  const debouncedPostValuesToYaml = useDebounceCallback((payload: TYamlByValuesReq, myId: number) => {
    try {
      // Abort previous in-flight request
      valuesToYamlAbortRef.current?.abort()
    } catch (err) {
      console.error(err)
    }

    // Create a new AbortController for this request
    const controller = new AbortController()
    valuesToYamlAbortRef.current = controller
    axios
      .post<TYamlByValuesRes>(
        `/api/clusters/${cluster}/openapi-bff/forms/formSync/getYamlValuesByFromValues`,
        payload,
        { signal: controller.signal },
      )
      .then(({ data }) => {
        // Ignore the response if it's from an outdated request
        if (myId !== valuesToYamlReqId.current) return
        debouncedSetYamlValues(data)
      })
      // Silent catch to ignore abort errors or user-triggered cancels
      .catch(() => {})
  }, 300)

  /**
   * Callback triggered whenever the form values change.
   * Builds the payload and triggers the debounced sync-to-YAML call.
   */
  const onValuesChangeCallback = useCallback(
    (values?: any, changedValues?: any) => {
      // Get the most recent form values (or use the provided ones)
      const vRaw = values ?? form.getFieldsValue(true)
      const v = scrubLiteralWildcardKeys(vRaw)

      // resolve wildcard templates for hidden & expanded against current values ---
      wgroup('values→resolve wildcards')

      const hiddenResolved = expandWildcardTemplates(
        hiddenWildcardTemplates,
        v,
        { includeMissingExact: true, includeMissingFinalForWildcard: true }, // only hidden opts in
      )
      wdbg('hidden resolved', hiddenResolved.map(prettyPath))

      setResolvedHiddenPaths(hiddenResolved as TFormName[])

      const expandedResolved = expandWildcardTemplates(expandedWildcardTemplates, v)
      wdbg('expanded resolved', expandedResolved.map(prettyPath))

      // Merge auto-expanded with current expandedKeys (preserve user choices)
      if (expandedResolved.length) {
        setExpandedKeys(prev => {
          const seen = new Set(prev.map(x => JSON.stringify(x)))
          const merged = [...prev]
          // eslint-disable-next-line no-restricted-syntax
          for (const p of expandedResolved) {
            const k = JSON.stringify(p as any)
            if (!seen.has(k)) {
              seen.add(k)
              merged.push(p as any)
            }
          }
          return merged
        })
      }
      wend()

      // show a snapshot of current values at a shallow level
      group('values change')
      dbg('values snapshot keys', Object.keys(v || {}))

      // 🔹 Helper function to extract a "root" or "head" portion of a path array.
      //    Example: if a full path is ['spec', 'addressGroups', 0, 'name']
      //    then headPath(p) → ['spec', 'addressGroups', 0]
      //    This helps us identify which top-level object/array the change happened in.
      const headPath = (p: (string | number)[]) => {
        // You can control how deep you consider something to be the "root" of a change.
        // slice(0, 3) means we take the first three segments.
        // So a path like ['spec','containers',0,'env',0,'name'] becomes ['spec','containers',0].
        // If you want broader or narrower scoping, adjust this number.
        return p.slice(0, 3)
      }

      // 🔹 Create a Set to hold the unique "root paths" of everything that changed in this render.
      //    We’ll use these roots later to decide which arrays are safe to purge expansions for.
      const changedRoots = new Set<string>()

      // 🔹 If Ant Design’s `onValuesChange` gave us a `changedValues` object (it does),
      //    and it’s a normal object, collect all the individual field paths inside it.
      if (changedValues && typeof changedValues === 'object') {
        // `getAllPathsFromObj` returns arrays of keys/indexes for every nested field.
        // Example:
        //   changedValues = { spec: { addressGroups: [ { name: "new" } ] } }
        //   → getAllPathsFromObj(changedValues)
        //     returns [ ['spec'], ['spec','addressGroups'], ['spec','addressGroups',0], ['spec','addressGroups',0,'name'] ]
        const changedPaths = getAllPathsFromObj(changedValues)

        // 🔹 For each changed path, derive its "root" using headPath(),
        //    then store it as a JSON string in our Set.
        //    Using JSON.stringify lets us easily compare path arrays later.
        for (const p of changedPaths) {
          changedRoots.add(JSON.stringify(headPath(p)))
        }
      }

      const newLengths = collectArrayLengths(v)
      const prevLengths = prevArrayLengthsRef.current

      // We previously had no purge when you delete an array element and add it again.
      // This block adds a *safe* purge for array SHRIΝKs (when items are actually removed).

      // --- handle SHRINK: indices removed ---
      // IMPORTANT: Only treat an array as "shrunk" if it appears in *both* snapshots.
      // If it's missing from `newLengths`, we don't know its real length (could be a transient omission),
      // so we must NOT assume length 0 and accidentally purge unrelated expansions.
      for (const [k, prevLen] of prevLengths.entries()) {
        if (!newLengths.has(k)) {
          // Array is absent in the new snapshot → consider length "unknown", skip purging.
          // (Prevents false positives where another part of the form caused a temporary omission.)
          // eslint-disable-next-line no-continue
          continue
        }

        // Safe: the array exists in both snapshots; compare lengths.
        const newLen = newLengths.get(k)!
        if (newLen < prevLen) {
          // We detected a real shrink: some trailing indices were removed.
          const arrayPath = JSON.parse(k) as (string | number)[]

          // OPTIONAL SCOPE: If we captured change roots via `changedValues`,
          // only purge when this array is inside one of those roots.
          // This prevents edits under A from purging expansions under B.
          if (changedRoots.size) {
            const shouldPurge = [...changedRoots].some(rootJson =>
              isPrefix(arrayPath, JSON.parse(rootJson) as (string | number)[]),
            )
            if (!shouldPurge) {
              console.debug('[shrink] skipped unrelated array:', arrayPath)
              // eslint-disable-next-line no-continue
              continue
            }
          }

          // Purge UI state for each removed index (from newLen up to prevLen - 1).
          for (let i = newLen; i < prevLen; i++) {
            const removedPrefix = [...arrayPath, i] // e.g., ['spec','addressGroups', 2]

            // Drop EXPANSION state anywhere under the removed element's subtree.
            // (Prevents "phantom" expanded panels for items that no longer exist.)
            setExpandedKeys(prev => {
              const before = prev.length
              const next = prev.filter(p => {
                const full = Array.isArray(p) ? p : [p]
                return !isPrefix(full, removedPrefix)
              })
              console.debug('[shrink] expanded pruned:', before - next.length, 'under', removedPrefix)
              return next
            })

            // Drop PERSISTED markers under the same subtree.
            // (Prevents keeping persistence flags for fields that were deleted.)
            setPersistedKeys(prev => {
              const before = prev.length
              const next = prev.filter(p => {
                const full = Array.isArray(p) ? p : [p]
                return !isPrefix(full, removedPrefix)
              })
              console.debug('[shrink] persisted pruned:', before - next.length, 'under', removedPrefix)
              return next
            })

            // Clear any "tombstone" blocks for paths under the removed element,
            // so that if a new element is added later, it won't be blocked from materializing.
            for (const bk of [...blockedPathsRef.current]) {
              const path = JSON.parse(bk) as (string | number)[]
              if (isPrefix(path, removedPrefix)) blockedPathsRef.current.delete(bk)
            }
          }
        }
      }

      const getArrayItemType = (schemaProps: OpenAPIV2.SchemaObject['properties'], path: (string | number)[]) => {
        // Walk the schema roughly along the data path:
        // - string key → go into `.properties[key]`
        // - number index → for arrays, go into `.items`
        let node: any = { type: 'object', properties: schemaProps }
        for (const seg of path) {
          if (typeof seg === 'string') {
            node = node?.properties?.[seg]
          } else {
            node = node?.items // numeric index → array item
          }
          if (!node) break
        }
        return node?.type === 'array' ? (node.items as any)?.type : node?.items?.type ?? node?.type
      }

      // --- handle GROW: indices added ---
      for (const [k, newLen] of newLengths.entries()) {
        const prevLen = prevLengths.get(k) ?? 0
        if (newLen > prevLen) {
          const arrayPath = JSON.parse(k) as (string | number)[]
          for (let i = prevLen; i < newLen; i++) {
            const itemPath = [...arrayPath, i]

            // ensure the node exists to stabilize render/hidden resolution
            const itemVal = form.getFieldValue(itemPath as any)
            if (typeof itemVal === 'undefined') {
              const itemType = getArrayItemType(properties, arrayPath as (string | number)[])
              if (itemType === 'object') form.setFieldValue(itemPath as any, {})
              else if (itemType === 'array') form.setFieldValue(itemPath as any, [])
              else if (itemType === 'listInput') form.setFieldValue(itemPath as any, undefined)
              else if (
                itemType === 'number' ||
                itemType === 'integer' ||
                itemType === 'rangeInputCpu' ||
                itemType === 'rangeInputMemory'
              )
                form.setFieldValue(itemPath as any, 0)
              else if (itemType === 'boolean') form.setFieldValue(itemPath as any, false)
              else form.setFieldValue(itemPath as any, '') // string / unknown
            }

            // guarantee no stale tombstone blocks this subtree
            blockedPathsRef.current.delete(JSON.stringify(itemPath))

            // your existing prefills (wildcards etc.)
            applyPrefillForNewArrayItem(arrayPath, i)
          }
        }
      }

      // keep tracker in sync
      prevArrayLengthsRef.current = newLengths

      // dump lengths (readable)
      dbg('array lengths (prev → new)')
      const allKeys = new Set([...prevLengths.keys(), ...newLengths.keys()])
      ;[...allKeys].forEach(k => dbg(k, ' : ', prevLengths.get(k), '→', newLengths.get(k)))

      // eslint-disable-next-line no-restricted-syntax
      for (const [k, newLen] of newLengths.entries()) {
        const prevLen = prevLengths.get(k) ?? 0
        if (newLen > prevLen) {
          const arrayPath = JSON.parse(k) as (string | number)[]
          dbg('🟢 detected growth', { pathKey: k, arrayPath, prevLen, newLen })

          for (let i = prevLen; i < newLen; i++) {
            dbg('…prefilling new index', i, 'under', arrayPath)
            applyPrefillForNewArrayItem(arrayPath, i)
          }
        }
      }
      prevArrayLengthsRef.current = newLengths

      end() // values change

      const payload: TYamlByValuesReq = {
        values: v,
        persistedKeys,
        properties,
      }

      // Increment the request ID to track the most recent sync call
      const myId = ++valuesToYamlReqId.current
      debouncedPostValuesToYaml(payload, myId)
    },
    [
      form,
      properties,
      persistedKeys,
      debouncedPostValuesToYaml,
      applyPrefillForNewArrayItem,
      hiddenWildcardTemplates,
      expandedWildcardTemplates,
    ],
  )

  useEffect(() => {
    onValuesChangeCallback()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [allValues])

  /**
   * Debounced function that converts YAML → form values via the backend and
   * carefully merges the result into the current form & schema state.
   *
   * - Cancels in-flight requests when new ones start.
   * - Ignores stale responses using a monotonically increasing request id.
   * - Diffs previous form paths vs. next data paths to clear removed fields and block them.
   * - Updates the schema by pruning & materializing additionalProperties according to new data.
   *
   * @param payload - YAML payload and schema context for the API
   * @param myId - A request-sequencing id to guard against stale responses
   */
  const debouncedPostYamlToValues = useDebounceCallback((payload: TValuesByYamlReq, myId: number) => {
    try {
      // Abort any previous YAML→values request still in flight
      yamlToValuesAbortRef.current?.abort()
    } catch (err) {
      console.error(err)
    }

    // Create a fresh controller for this request
    const controller = new AbortController()
    yamlToValuesAbortRef.current = controller

    axios
      .post<TValuesByYamlRes>(`/api/clusters/${cluster}/openapi-bff/forms/formSync/getFormValuesByYaml`, payload, {
        signal: controller.signal,
      })
      .then(({ data }) => {
        // Discard if this is not the latest request
        if (myId !== yamlToValuesReqId.current) return
        // No data, nothing to merge
        if (!data) return

        // --- Compute paths present in previous form state vs. incoming data ---

        // Get full snapshot of current form values (all fields)
        const prevAll = form.getFieldsValue(true)
        // Extract path arrays (e.g., ['spec','env',0,'name']) from objects
        const prevPaths = getAllPathsFromObj(prevAll)
        const nextPaths = getAllPathsFromObj(data as Record<string, unknown>)
        const nextSet = new Set(nextPaths.map(p => pathKey(p)))

        // For any path that existed before but not in new YAML data:
        // - Clear the form value
        // - Block the path so it won't be re-added by schema materialization
        prevPaths.forEach(p => {
          const k = pathKey(p)
          if (!nextSet.has(k)) {
            form.setFieldValue(p as any, undefined)
            // Prevent re-creation of removed paths on the next materialization pass
            blockedPathsRef.current.add(k)
          }
        })

        // Merge the new YAML-derived values into the form
        form.setFieldsValue(data)

        // Unblock paths that reappeared in the new YAML-derived data
        const dataPathSet = new Set(getAllPathsFromObj(data as Record<string, unknown>).map(p => pathKey(p)))
        blockedPathsRef.current.forEach(k => {
          if (dataPathSet.has(k)) blockedPathsRef.current.delete(k)
        })

        // 🧩 When YAML → values sync finishes, the backend sends a brand-new `data` object,
        //     and we immediately call `form.setFieldsValue(data)` to replace all form fields.
        //
        // ⚠️  That replacement often causes parts of the form UI (especially dynamic arrays
        //     and nested objects) to unmount and remount — because React sees new keys,
        //     new field paths, or different schema nodes.
        //
        // 👇  This line restores the user’s previous expansion state (`expandedKeysRef.current`)
        //     right after we inject the new values, so any sections the user had expanded
        //     stay visible instead of collapsing back to their default closed state.
        //
        // TL;DR — Without this line, every time YAML updates the form, all expanded panels
        //         would snap shut; this re-applies the last known expansion model immediately
        //         to preserve a stable, intuitive editing experience.
        setExpandedKeys(expandedKeysRef.current)

        // --- Bring schema in sync: prune missing additional props, then materialize new ones ---
        setProperties(prevProps => {
          // Remove additionalProperties entries that are now absent or blocked
          const pruned = pruneAdditionalForValues(prevProps, data as Record<string, unknown>, blockedPathsRef)

          // Add schema nodes for any new values allowed by additionalProperties
          const { props: materialized, toPersist } = materializeAdditionalFromValues(
            pruned,
            data as Record<string, unknown>,
            blockedPathsRef,
          )

          // ✅ Guard against no-op updates to break feedback loops
          if (_.isEqual(prevProps, materialized)) {
            return prevProps
          }

          // Ensure new/empty fields discovered during materialization are tracked for persistence
          if (toPersist.length) {
            setPersistedKeys(prev => {
              const seen = new Set(prev.map(x => JSON.stringify(x)))
              const merged = [...prev]
              toPersist.forEach(p => {
                const k = JSON.stringify(p)
                if (!seen.has(k)) {
                  seen.add(k)
                  merged.push(p)
                }
              })
              return merged
            })
          }

          // 🧠 Why we need this:
          //     Updating `setProperties(...)` can cause the form schema to re-render.
          //     That re-render might temporarily unmount and recreate form sections
          //     (especially when `additionalProperties` or dynamic arrays change).
          //
          // ⚠️  React applies the `setProperties` state update asynchronously.
          //     If we immediately call `setExpandedKeys` *inside* this callback,
          //     the UI may not yet reflect the new schema — our expansion restore
          //     could run too early and be lost during the render that follows.
          //
          // ✅  Wrapping it in `queueMicrotask(...)` schedules the restore to run
          //     right after React finishes applying the `setProperties` update,
          //     but before the browser paints. That guarantees the expansion state
          //     is re-applied *after* the new schema has stabilized.
          //
          // TL;DR — Wait one micro-tick after schema update, then re-apply expansions
          //         so newly materialized fields appear in the correct expanded state
          //         and nothing collapses due to the schema refresh.
          queueMicrotask(() => setExpandedKeys(expandedKeysRef.current))

          return materialized
        })
      })
      // Silent catch: ignore abort/cancel or transient errors here
      .catch(() => {})
  }, 300)

  /**
   * Handler for when the YAML editor changes.
   * Skips applying YAML-driven updates while the user is actively typing in a form field
   * (prevents clobbering in-progress input), then triggers the debounced YAML→values sync.
   */
  const onYamlChangeCallback = useCallback(
    (values: Record<string, unknown>) => {
      // If a form field is focused, ignore YAML-driven updates to avoid overwriting user's typing
      if (isAnyFieldFocusedRef.current) return
      const payload: TValuesByYamlReq = { values, properties }
      const myId = ++yamlToValuesReqId.current
      debouncedPostYamlToValues(payload, myId)
    },
    [properties, debouncedPostYamlToValues],
  )

  useEffect(() => {
    const root = overflowRef.current
    if (!root) return undefined
    const onFocusIn = () => {
      isAnyFieldFocusedRef.current = true
    }
    const onFocusOut = () => {
      const active = document.activeElement
      if (!active || !root.contains(active)) {
        isAnyFieldFocusedRef.current = false
        // After blur, re-sync to apply any queued YAML changes
        onValuesChangeCallback()
      }
    }

    root.addEventListener('focusin', onFocusIn)
    root.addEventListener('focusout', onFocusOut)

    return () => {
      root.removeEventListener('focusin', onFocusIn)
      root.removeEventListener('focusout', onFocusOut)
    }
  }, [onValuesChangeCallback])

  /*
    Whenever the computed `initialValues` change, trigger a form update if the new
    values differ from the previous ones. This ensures the form syncs properly with
    refreshed or recalculated defaults (e.g., after switching resource kind or schema).
  */
  useEffect(() => {
    const prev = prevInitialValues.current
    if (!_.isEqual(prev, initialValues)) {
      if (initialValues) {
        console.log('fired initial values', initialValues)
        onValuesChangeCallback(initialValues)
      }
      prevInitialValues.current = initialValues
    }
  }, [onValuesChangeCallback, initialValues])

  /* watch persisted and trigger values change callback */
  useEffect(() => {
    // if (skipFirstPersistedKeysEffect.current) {
    //   skipFirstPersistedKeysEffect.current = false
    //   return
    // }
    onValuesChangeCallback()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistedKeys])

  // --- Feature: expanded initial ---
  useEffect(() => {
    let allPaths: (string | number)[][] = []
    if (formsPrefills) {
      allPaths = formsPrefills.spec.values.flatMap(({ path }) => getPrefixSubarrays(path))
    }
    if (prefillValuesSchema) {
      if (typeof prefillValuesSchema === 'object' && prefillValuesSchema !== null) {
        allPaths = [...allPaths, ...getAllPathsFromObj(prefillValuesSchema)]
      }
    }
    const possibleNewKeys = [...expandedKeys, ...allPaths]
    const seen = new Set<TFormName>()
    const uniqueKeys = possibleNewKeys.filter(item => {
      const key = Array.isArray(item) ? JSON.stringify(item) : item
      if (seen.has(key as TFormName)) {
        return false
      }
      seen.add(key as TFormName)
      return true
    })
    setExpandedKeys([...uniqueKeys])
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [apiGroupApiVersion, formsPrefills, prefillValuesSchema, type, typeName])

  // --- Feature: casting properties both sides ---
  /*
   When `initialValues` become available or change, update the schema (`properties`)
   to include any fields derived from `additionalProperties` that appear in the
   initial data. This ensures that all dynamic fields are represented in the schema
   before rendering or editing begins.

   + FIX: guard against no-op updates to `properties`.
  */
  useEffect(() => {
    // Skip if there are no initial values yet
    if (!initialValues) return

    setProperties(prev => {
      // Expand the schema based on any dynamic keys in initialValues that are allowed
      // by `additionalProperties`. This process returns:
      //  - `p2`: the updated schema with new child nodes added where needed
      //  - `toPersist`: a list of new paths that should be persisted (usually empty objects)
      const { props: p2, toPersist } = materializeAdditionalFromValues(
        prev,
        initialValues as Record<string, unknown>,
        blockedPathsRef,
      )

      // ✅ Guard: do not update if nothing changed
      if (_.isEqual(prev, p2)) return prev

      // 🧠 NOTE:
      // We intentionally do *not* auto-expand paths from initial values here.
      // This preserves the user's UI collapse/expand state (e.g., in a form tree view).
      if (toPersist.length) {
        setPersistedKeys(prevPk => {
          const seen = new Set(prevPk.map(x => JSON.stringify(x)))
          const merged = [...prevPk]
          toPersist.forEach(p => {
            const k = JSON.stringify(p)
            if (!seen.has(k)) {
              seen.add(k)
              merged.push(p)
            }
          })
          return merged
        })
      }

      // Return the updated schema to be stored in state
      return p2
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues])

  if (!properties) {
    return null
  }

  // --- Feature: disable namespace edit ---
  const namespaceData = isNameSpaced
    ? {
        filterSelectOptions,
        selectValues: isNameSpaced.map(name => ({
          label: name,
          value: name,
        })),
        // disabled: !!prefillValueNamespaceOnly,
        disabled: !isCreate,
      }
    : undefined

  // --- Feature: additional properties methods ---
  const makeValueUndefined = (path: TFormName) => {
    /* eslint-disable-next-line @typescript-eslint/no-explicit-any */
    form.setFieldValue(path as any, undefined)
    onValuesChangeCallback()
  }

  const addField = ({
    path,
    name,
    type,
    items,
    nestedProperties,
    required,
  }: {
    path: TFormName
    name: string
    type: string
    items?: { type: string }
    nestedProperties?: OpenAPIV2.SchemaObject['properties']
    required?: string
  }) => {
    const arrPath = Array.isArray(path) ? path : [path]
    const newObject = arrPath.reduceRight<Record<string, unknown>>(
      (acc, key) => {
        return { [key]: { properties: acc } } // Create a new object with the current key and the accumulator as its value
      },
      { [name]: { type, items, properties: nestedProperties, required, isAdditionalProperties: true } },
    )
    const oldProperties = _.cloneDeep(properties)
    const newProperties = deepMerge(oldProperties, newObject)
    setProperties(newProperties)

    // 1) Initialize the value under the added field
    const fullPath = [...arrPath, name] as TFormName
    const currentValue = form.getFieldValue(fullPath)
    if (currentValue === undefined) {
      if (type === 'string' || type === 'multilineString' || type === 'multilineStringBase64') {
        form.setFieldValue(fullPath as any, '')
      } else if (type === 'number' || type === 'integer') {
        form.setFieldValue(fullPath as any, 0)
      } else if (type === 'array') {
        form.setFieldValue(fullPath as any, [])
      } else if (type === 'rangeInputCpu' || type === 'rangeInputMemory') {
        form.setFieldValue(fullPath as any, 0)
      } else if (type === 'listInput') {
        form.setFieldValue(fullPath as any, undefined)
      } else {
        // object / unknown -> make it an object
        form.setFieldValue(fullPath as any, {})
      }
    }

    // 2) Auto-mark for persist
    setPersistedKeys(prev => {
      const seen = new Set(prev.map(x => JSON.stringify(x)))
      const k = JSON.stringify(fullPath)
      if (seen.has(k)) return prev
      return [...prev, fullPath]
    })

    // 3) Trigger YAML update to ensure new field is properly handled
    onValuesChangeCallback()
  }

  const removeField = ({ path }: { path: TFormName }) => {
    const arrPath = Array.isArray(path) ? path : [path]
    // const pathWithProperties = arrPath.flatMap(el => [el, 'properties']).slice(0, -1)
    const modifiedProperties = _.cloneDeep(properties)
    // /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    // const result = _.unset(modifiedProperties, pathWithProperties)

    blockedPathsRef.current.add(pathKey(arrPath))
    form.setFieldValue(arrPath as any, undefined)

    setProperties(modifiedProperties)
    onValuesChangeCallback()
  }

  // --- Feature: expand/persist methods ---
  const onExpandOpen = (value: TFormName) => {
    setExpandedKeys([...expandedKeys, value])
  }

  const onExpandClose = (value: TFormName) => {
    setExpandedKeys([...expandedKeys.filter(arr => JSON.stringify(arr) !== JSON.stringify(value))])
  }

  const onPersistMark = (value: TFormName, type?: 'str' | 'number' | 'arr' | 'obj') => {
    if (type) {
      const currentValue = form.getFieldValue(value)
      if (currentValue === undefined) {
        if (type === 'str') {
          form.setFieldValue(value, '')
        }
        if (type === 'number') {
          form.setFieldValue(value, 0)
        }
        if (type === 'arr') {
          form.setFieldValue(value, [])
        }
        if (type === 'obj') {
          form.setFieldValue(value, {})
        }
      }
    }
    setPersistedKeys(prev => {
      const keyStr = JSON.stringify(value)
      const alreadyExists = prev.some(p => JSON.stringify(p) === keyStr)
      if (alreadyExists) return prev
      return [...prev, value]
    })
  }

  const onPersistUnmark = (value: TFormName) => {
    console.log(value)
    setPersistedKeys([...persistedKeys.filter(arr => JSON.stringify(arr) !== JSON.stringify(value))])
  }

  return (
    <>
      <Styled.Container $designNewLayout={designNewLayout} $designNewLayoutHeight={designNewLayoutHeight}>
        <Styled.OverflowContainer ref={overflowRef}>
          <Form
            form={form}
            initialValues={initialValues}
            onValuesChange={(_changedValues, all) => onValuesChangeCallback(all, _changedValues)}
          >
            <DesignNewLayoutProvider value={designNewLayout}>
              <OnValuesChangeCallbackProvider value={onValuesChangeCallback}>
                <IsTouchedPersistedProvider value={{}}>
                  <HiddenPathsProvider value={resolvedHiddenStringPaths}>
                    {getObjectFormItemsDraft({
                      properties,
                      name: [],
                      required,
                      namespaceData,
                      makeValueUndefined,
                      addField,
                      removeField,
                      isEdit: !isCreate,
                      expandedControls: { onExpandOpen, onExpandClose, expandedKeys },
                      persistedControls: { onPersistMark, onPersistUnmark, persistedKeys },
                      sortPaths,
                      urlParams,
                    })}
                  </HiddenPathsProvider>
                </IsTouchedPersistedProvider>
              </OnValuesChangeCallbackProvider>
            </DesignNewLayoutProvider>
            {!designNewLayout && (
              <>
                <Spacer $space={10} $samespace />
                <Alert
                  type="warning"
                  message="Only the data from the form will be sent. Empty fields will be removed recursively."
                />
              </>
            )}
            {isCreate && createPermission.data?.status.allowed === false && (
              <>
                <Spacer $space={10} $samespace />
                <Alert type="warning" message="Insufficient rights to create" />
              </>
            )}
            {!isCreate && updatePermission.data?.status.allowed === false && (
              <>
                <Spacer $space={10} $samespace />
                <Alert type="warning" message="Insufficient rights to edit" />
              </>
            )}
            {/* {error && (
              <>
                <Spacer $space={10} $samespace />
                <Alert message={`An error has occurred: ${error?.response?.data?.message} `} type="error" />
              </>
            )} */}
          </Form>
        </Styled.OverflowContainer>
        <div>
          <YamlEditor
            key={editorUri} // force a fresh editor when resource changes
            editorUri={editorUri} // tell the editor which Monaco model to use
            theme={theme}
            currentValues={yamlValues || {}}
            onChange={onYamlChangeCallback}
          />
        </div>
      </Styled.Container>
      <FlexGrow />
      <Styled.ControlsRowContainer $bgColor={token.colorPrimaryBg} $designNewLayout={designNewLayout}>
        <Flex gap={designNewLayout ? 10 : 16} align="center">
          <Button type="primary" onClick={onSubmit} loading={isLoading}>
            Submit
          </Button>
          {backlink && <Button onClick={() => navigate(backlink)}>Cancel</Button>}
          <Button onClick={() => setIsDebugModalOpen(true)} icon={<BugOutlined />} />
          {designNewLayout && (
            <div>
              <Typography.Text>
                Only the data from the form will be sent. Empty fields will be removed recursively.
              </Typography.Text>
            </div>
          )}
        </Flex>
      </Styled.ControlsRowContainer>
      {error && (
        <Modal
          open={!!error}
          onOk={() => setError(undefined)}
          // onClose={() => setError(undefined)}
          onCancel={() => setError(undefined)}
          title={
            <Typography.Text type="danger">
              <Styled.BigText>Error!</Styled.BigText>
            </Typography.Text>
          }
          cancelButtonProps={{ style: { display: 'none' } }}
        >
          An error has occurred: {error?.response?.data?.message}
        </Modal>
      )}
      {isDebugModalOpen && (
        <Modal
          open={isDebugModalOpen}
          onOk={() => setIsDebugModalOpen(false)}
          onCancel={() => setIsDebugModalOpen(false)}
          // onClose={() => setIsDebugModalOpen(false)}
          title="Debug for properties"
          width="90vw"
        >
          <Styled.DebugContainer $designNewLayoutHeight={designNewLayoutHeight}>
            <Suspense fallback={<div>Loading...</div>}>
              <Editor
                defaultLanguage="json"
                width="100%"
                height={designNewLayoutHeight || '75vh'}
                theme="vs-dark"
                value={JSON.stringify(properties, null, 2)}
                options={{
                  theme: 'vs-dark',
                  minimap: { enabled: false },
                }}
              />
            </Suspense>
          </Styled.DebugContainer>
        </Modal>
      )}
    </>
  )
}
