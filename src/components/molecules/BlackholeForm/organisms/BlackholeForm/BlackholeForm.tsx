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
  const namespaceFromFormData = Form.useWatch<string>(['metadata', 'namespace'], form)

  const [properties, setProperties] = useState<OpenAPIV2.SchemaObject['properties']>(staticProperties)
  const [yamlValues, setYamlValues] = useState<Record<string, unknown>>()
  const debouncedSetYamlValues = useDebounceCallback(setYamlValues, 500)

  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<TRequestError>()

  const [isDebugModalOpen, setIsDebugModalOpen] = useState<boolean>(false)

  const [expandedKeys, setExpandedKeys] = useState<TFormName[]>(expandedPaths || [])
  const [persistedKeys, setPersistedKeys] = useState<TFormName[]>(persistedPaths || [])

  const overflowRef = useRef<HTMLDivElement | null>(null)

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

  const onValuesChangeCallback = useCallback(
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    (values?: any) => {
      const v = values || form.getFieldsValue()

      const payload: TYamlByValuesReq = {
        values: v,
        persistedKeys,
        properties,
      }
      axios
        .post<TYamlByValuesRes>(
          `/api/clusters/${cluster}/openapi-bff/forms/formSync/getYamlValuesByFromValues`,
          payload,
        )
        .then(({ data }) => debouncedSetYamlValues(data))
    },
    [form, debouncedSetYamlValues, properties, persistedKeys, cluster],
  )

  const onYamlChangeCallback = useCallback(
    (values: Record<string, unknown>) => {
      const payload: TValuesByYamlReq = {
        values,
        properties,
      }
      axios
        .post<TValuesByYamlRes>(`/api/clusters/${cluster}/openapi-bff/forms/formSync/getFormValuesByYaml`, payload)
        .then(({ data }) => {
          if (data) {
            form.setFieldsValue(data)
          }
        })
    },
    [form, properties, cluster],
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
    onValuesChangeCallback()
  }, [onValuesChangeCallback, persistedKeys])

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
  }

  const removeField = ({ path }: { path: TFormName }) => {
    const arrPath = Array.isArray(path) ? path : [path]
    const pathWithProperties = arrPath.flatMap(el => [el, 'properties']).slice(0, -1)
    const modifiedProperties = _.cloneDeep(properties)
    /* eslint-disable-next-line @typescript-eslint/no-unused-vars */
    const result = _.unset(modifiedProperties, pathWithProperties)
    setProperties(modifiedProperties)
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
    setPersistedKeys([...persistedKeys, value])
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
            onValuesChange={(_, allValues) => onValuesChangeCallback(allValues)}
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
