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
import { handleSubmitError, handleValidationError } from './utilsErrorHandler'
import { Styled } from './styled'
const pathKey = (p: (string|number)[]) => JSON.stringify(p)
import {
  DesignNewLayoutProvider,
  HiddenPathsProvider,
  OnValuesChangeCallbackProvider,
  IsTouchedPersistedProvider,
} from './context'

type TBlackholeFormCreateProps = {
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

export const BlackholeForm: FC<TBlackholeFormCreateProps> = ({
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
  const namespaceFromFormData = Form.useWatch<string>(['metadata', 'namespace'], form)

  const [properties, setProperties] = useState<OpenAPIV2.SchemaObject['properties']>(staticProperties)
  const [yamlValues, setYamlValues] = useState<Record<string, unknown>>()
  const debouncedSetYamlValues = useDebounceCallback(setYamlValues, 500)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<TRequestError>()

  const [isDebugModalOpen, setIsDebugModalOpen] = useState<boolean>(false)

  const [expandedKeys, setExpandedKeys] = useState<TFormName[]>(expandedPaths || [])
  const [persistedKeys, setPersistedKeys] = useState<TFormName[]>(persistedPaths || [])
  const blockedPathsRef = useRef<Set<string>>(new Set())

  const overflowRef = useRef<HTMLDivElement | null>(null)
  const valuesToYamlReqId = useRef(0)
  const yamlToValuesReqId = useRef(0)
  const skipFirstPersistedKeysEffect = useRef(true)
  const valuesToYamlAbortRef = useRef<AbortController | null>(null)
  const yamlToValuesAbortRef = useRef<AbortController | null>(null)
  const isAnyFieldFocusedRef = useRef<boolean>(false)

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

        const values = form.getFieldsValue()
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
                  // if (overflowRef.current) {
                  //   const { scrollHeight, clientHeight } = overflowRef.current
                  //   overflowRef.current.scrollTo({
                  //     top: scrollHeight - clientHeight,
                  //     behavior: 'smooth',
                  //   })
                  // }
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
                  // if (overflowRef.current) {
                  //   const { scrollHeight, clientHeight } = overflowRef.current
                  //   overflowRef.current.scrollTo({
                  //     top: scrollHeight - clientHeight,
                  //     behavior: 'smooth',
                  //   })
                  // }
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

  const debouncedPostValuesToYaml = useDebounceCallback(
    (payload: TYamlByValuesReq, myId: number) => {
      try {
        // Abort previous in-flight request
        valuesToYamlAbortRef.current?.abort()
      } catch {}
      const controller = new AbortController()
      valuesToYamlAbortRef.current = controller
      axios
        .post<TYamlByValuesRes>(
          `/api/clusters/${cluster}/openapi-bff/forms/formSync/getYamlValuesByFromValues`,
          payload,
          { signal: controller.signal },
        )
        .then(({ data }) => {
          if (myId !== valuesToYamlReqId.current) return
          debouncedSetYamlValues(data)
        })
        .catch(() => {})
    },
    300,
  )

  const onValuesChangeCallback = useCallback(
    (values?: any) => {
      const v = values ?? form.getFieldsValue(true)
      const payload: TYamlByValuesReq = {
        values: v,
        persistedKeys,
        properties,
      }
      const myId = ++valuesToYamlReqId.current
      debouncedPostValuesToYaml(payload, myId)
    },
    [form, properties, persistedKeys, debouncedPostValuesToYaml],
  )

  const pruneAdditionalForValues = (
    props: OpenAPIV2.SchemaObject['properties'],
    values: Record<string, unknown>,
  ): OpenAPIV2.SchemaObject['properties'] => {
    const next = _.cloneDeep(props) || {}

    const walk = (schemaNode: any, valueNode: any, path: (string | number)[] = []) => {
      if (!schemaNode) return
      if (schemaNode.type === 'object') {
        const vo = valueNode && typeof valueNode === 'object' && !Array.isArray(valueNode) ? valueNode : {}
        if (schemaNode.properties) {
          Object.keys(schemaNode.properties).forEach(k => {
            const child = schemaNode.properties[k] as any
            const currentPath = pathKey([...path, k])
            if (child?.isAdditionalProperties && (!(k in vo) || blockedPathsRef.current.has(currentPath))) {
              delete schemaNode.properties[k]
              return
            }
            walk(child as OpenAPIV2.SchemaObject, vo?.[k], [...path, k])
          })
        }
      }
      if (schemaNode.type === 'array' && schemaNode.items && Array.isArray(valueNode)) {
        valueNode.forEach((item, idx) => {
          if ((schemaNode as any).properties?.[idx]) {
            walk(schemaNode.items as OpenAPIV2.SchemaObject, item, [...path, idx])
          }
        })
      }
    }

    Object.keys(next || {}).forEach(top => {
      walk(next[top] as OpenAPIV2.SchemaObject, (values as any)?.[top], [top])
    })

    return next
  }

  const materializeAdditionalFromValues = (
    props: OpenAPIV2.SchemaObject['properties'],
    values: Record<string, unknown>,
  ): { props: OpenAPIV2.SchemaObject['properties']; toExpand: TFormName[]; toPersist: TFormName[] } => {
    const next = _.cloneDeep(props) || {}
    const toExpand: TFormName[] = []
    const toPersist: TFormName[] = []

    const makeChildFromAP = (ap: any): OpenAPIV2.SchemaObject => {
      const t = ap?.type ?? 'object'
      const child: OpenAPIV2.SchemaObject = { type: t } as any
      if (ap?.properties) (child as any).properties = _.cloneDeep(ap.properties)
      if (ap?.items) (child as any).items = _.cloneDeep(ap.items)
      if (ap?.required) (child as any).required = _.cloneDeep(ap.required)
      ;(child as any).isAdditionalProperties = true
      return child
    }

    const walk = (
      schemaNode: OpenAPIV2.SchemaObject | undefined,
      valueNode: unknown,
      path: (string | number)[],
    ) => {
      if (!schemaNode) return

      if (schemaNode.type === 'object') {
        const ap = schemaNode.additionalProperties as any
        if (ap && valueNode && typeof valueNode === 'object' && !Array.isArray(valueNode)) {
          const vo = valueNode as Record<string, unknown>
          schemaNode.properties = schemaNode.properties || {}
          toExpand.push([...path])
          Object.keys(vo).forEach(k => {
            const current = pathKey([...path, k])
            if (blockedPathsRef.current.has(current)) return
            
            if (!schemaNode.properties![k]) {
              schemaNode.properties![k] = makeChildFromAP(ap)
            } else if ((schemaNode.properties![k] as any).isAdditionalProperties && ap?.properties) {
              ;(schemaNode.properties![k] as any).properties ??= _.cloneDeep(ap.properties)
            }
            toExpand.push([...path, k])

            // Mark for persist if it's a new field created from additionalProperties
            const v = vo[k]
            // Mark empty objects for persist
            if (v && typeof v === 'object' && !Array.isArray(v) && Object.keys(v as object).length === 0) {
              toPersist.push([...path, k])
            }
            // Mark other new fields for persist (strings, numbers, arrays)
            else if (v === '' || v === 0 || (Array.isArray(v) && v.length === 0)) {
              toPersist.push([...path, k])
            }
          })
        }
        if (schemaNode.properties && valueNode && typeof valueNode === 'object' && !Array.isArray(valueNode)) {
          const vo = valueNode as Record<string, unknown>
          Object.keys(schemaNode.properties).forEach(k => {
            walk(schemaNode.properties![k] as OpenAPIV2.SchemaObject, vo?.[k], [...path, k])
          })
        }
      }

      if (schemaNode.type === 'array' && schemaNode.items) {
        const arr = Array.isArray(valueNode) ? (valueNode as unknown[]) : []
        if (arr.length) toExpand.push([...path])
        arr.forEach((itemVal, idx) => {
          if ((schemaNode as any).properties) {
            ;(schemaNode as any).properties[idx as any] = (schemaNode as any).properties[idx as any] || { properties: {} }
          }
          walk(schemaNode.items as OpenAPIV2.SchemaObject, itemVal, [...path, idx])
        })
      }
    }

    Object.keys(next || {}).forEach(top => {
      walk(next[top] as OpenAPIV2.SchemaObject, (values as any)?.[top], [top])
    })

    return { props: next, toExpand, toPersist }
  }

  const debouncedPostYamlToValues = useDebounceCallback(
    (payload: TValuesByYamlReq, myId: number) => {
      try {
        yamlToValuesAbortRef.current?.abort()
      } catch {}
      const controller = new AbortController()
      yamlToValuesAbortRef.current = controller
      axios
        .post<TValuesByYamlRes>(
          `/api/clusters/${cluster}/openapi-bff/forms/formSync/getFormValuesByYaml`,
          payload,
          { signal: controller.signal },
        )
        .then(({ data }) => {
          if (myId !== yamlToValuesReqId.current) return
          if (!data) return

          const prevAll = form.getFieldsValue(true)
          const prevPaths = getAllPathsFromObj(prevAll)
          const nextPaths = getAllPathsFromObj(data as Record<string, unknown>)
          const nextSet = new Set(nextPaths.map(p => pathKey(p)))

          prevPaths.forEach(p => {
            const k = pathKey(p)
            if (!nextSet.has(k)) {
              form.setFieldValue(p as any, undefined)
              // Block the path that was removed from YAML
              blockedPathsRef.current.add(k)
            }
          })

          form.setFieldsValue(data)

          // Unblock paths which reappeared in data
          const dataPathSet = new Set(
            getAllPathsFromObj(data as Record<string, unknown>).map(p => pathKey(p))
          )
          blockedPathsRef.current.forEach(k => {
            if (dataPathSet.has(k)) blockedPathsRef.current.delete(k)
          })

          setProperties(prevProps => {
            const pruned = pruneAdditionalForValues(prevProps, data as Record<string, unknown>)
            const { props: materialized, toExpand, toPersist } = materializeAdditionalFromValues(
              pruned, data as Record<string, unknown>
            )
            if (toPersist.length) {
              setPersistedKeys(prev => {
                const seen = new Set(prev.map(x => JSON.stringify(x)))
                const hasNew = toPersist.some(p => !seen.has(JSON.stringify(p)))
                if (!hasNew) return prev
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
            return materialized
          })
        })
        .catch(() => {})
    },
    300,
  )

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

  const initialValues = useMemo(() => {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const allValues: Record<string, any> = {}

    if (isCreate) {
      // form.setFieldsValue({ apiVersion: apiGroupApiVersion === 'api/v1' ? 'v1' : apiGroupApiVersion, kind: kindName })
      _.set(allValues, ['apiVersion'], apiGroupApiVersion === 'api/v1' ? 'v1' : apiGroupApiVersion)
      _.set(allValues, ['kind'], kindName)
    }
    if (formsPrefills) {
      formsPrefills.spec.values.forEach(({ path, value }) => {
        // form.setFieldValue(path, value)
        _.set(allValues, path, value)
      })
    }
    if (prefillValueNamespaceOnly) {
      // form.setFieldValue(['metadata', 'namespace'], prefillValueNamespaceOnly)
      _.set(allValues, ['metadata', 'namespace'], prefillValueNamespaceOnly)
    }
    if (prefillValuesSchema) {
      const quotasPrefillValuesSchema = normalizeValuesForQuotasToNumber(prefillValuesSchema, properties)
      // form.setFieldsValue(quotasPrefillValuesSchema)
      Object.entries(quotasPrefillValuesSchema).forEach(([flatKey, v]) => {
        _.set(allValues, flatKey.split('.'), v)
      })
    }

    const sorted = Object.fromEntries(Object.entries(allValues).sort(([a], [b]) => a.localeCompare(b)))

    return sorted
  }, [
    formsPrefills,
    prefillValueNamespaceOnly,
    isCreate,
    apiGroupApiVersion,
    kindName,
    prefillValuesSchema,
    properties,
  ])

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const prevInitialValues = useRef<Record<string, any>>()

  useEffect(() => {
    const root = overflowRef.current
    if (!root) return
    const onFocusIn = () => { isAnyFieldFocusedRef.current = true }
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

  useEffect(() => {
    if (skipFirstPersistedKeysEffect.current) {
      skipFirstPersistedKeysEffect.current = false
      return
    }
    onValuesChangeCallback()
  // do not include the callback in deps to avoid re-run when its identity changes
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [persistedKeys])

  /* expanded initial */
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

  useEffect(() => {
    if (!initialValues) return
    setProperties(prev => {
      const { props: p2, toExpand, toPersist } = materializeAdditionalFromValues(prev, initialValues as Record<string, unknown>)
      // DO NOT auto-expand paths from initial values to preserve user's collapse state
      // Only update persisted keys for empty objects under additionalProperties
      if (toPersist.length) {
        setPersistedKeys(prev => {
          const seen = new Set(prev.map(x => JSON.stringify(x)))
          const hasNew = toPersist.some(p => !seen.has(JSON.stringify(p)))
          if (!hasNew) return prev // If there are no new paths, do not update the state
          
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
      return p2
    })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [initialValues])

  if (!properties) {
    return null
  }

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
    // const newProperties = _.merge(oldProperties, newObject)
    const newProperties = deepMerge(oldProperties, newObject)
    console.log('oldProperties', oldProperties)
    console.log('newObject', newObject)
    console.log('newProperties', newProperties)
    setProperties(newProperties)

    // 1) Initialize the value under the added field
    const fullPath = [...arrPath, name] as TFormName
    const currentValue = form.getFieldValue(fullPath)
    if (currentValue === undefined) {
      if (type === 'string') {
        form.setFieldValue(fullPath as any, '')
      } else if (type === 'number' || type === 'integer') {
        form.setFieldValue(fullPath as any, 0)
      } else if (type === 'array') {
        form.setFieldValue(fullPath as any, [])
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
    const pathWithProperties = arrPath.flatMap(el => [el, 'properties']).slice(0, -1)
    const modifiedProperties = _.cloneDeep(properties)
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    const result = _.unset(modifiedProperties, pathWithProperties)

    blockedPathsRef.current.add(pathKey(arrPath))
    form.setFieldValue(arrPath as any, undefined)

    setProperties(modifiedProperties)
    onValuesChangeCallback()
  }

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
            onValuesChange={() => onValuesChangeCallback()}
          >
            <DesignNewLayoutProvider value={designNewLayout}>
              <OnValuesChangeCallbackProvider value={onValuesChangeCallback}>
                <IsTouchedPersistedProvider value={{}}>
                  <HiddenPathsProvider value={hiddenPaths}>
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
          <YamlEditor theme={theme} currentValues={yamlValues || {}} onChange={onYamlChangeCallback} />
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
