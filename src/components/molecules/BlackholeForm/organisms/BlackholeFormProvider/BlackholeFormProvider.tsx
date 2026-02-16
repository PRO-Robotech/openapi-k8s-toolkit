/* eslint-disable no-nested-ternary */
/* eslint-disable max-lines-per-function */
/* eslint-disable no-console */
import React, { FC, useState, useEffect, ReactNode, useCallback, useRef } from 'react'
import { Alert, Spin } from 'antd'
import axios, { AxiosError } from 'axios'
import { TJSON } from 'localTypes/JSON'
import { OpenAPIV2 } from 'openapi-types'
import { TUrlParams } from 'localTypes/form'
import { TPrepareFormReq, TPrepareFormRes } from 'localTypes/bff/form'
import { TFormPrefill } from 'localTypes/formExtensions'
import { useK8sSmartResource } from 'hooks/useK8sSmartResource'
import { YamlEditorSingleton } from '../../../YamlEditorSingleton'
import { BlackholeForm } from '../BlackholeForm'

type TCustomFormsOverridesResponse = {
  items?: {
    spec?: {
      customizationId?: string
    }
  }[]
}

type TCustomFormsOverridesMappingResponse = {
  items?: {
    spec?: {
      mappings?: Record<string, string | undefined>
    }
  }[]
}

export type TBlackholeFormProviderProps = {
  theme: 'light' | 'dark'
  cluster: string
  urlParams: TUrlParams
  urlParamsForPermissions: {
    apiGroup?: string
    plural?: string
  }
  data:
    | {
        type: 'builtin'
        plural: string
        prefillValuesSchema?: TJSON
        prefillValueNamespaceOnly?: string
      }
    | {
        type: 'apis'
        apiGroup: string
        apiVersion: string
        plural: string
        prefillValuesSchema?: TJSON
        prefillValueNamespaceOnly?: string
      }
  customizationId?: string
  forcingCustomization: {
    baseApiGroup: string
    baseApiVersion: string
    cfoMappingPlural: string
    cfoMappinResourceName: string
    fallbackId?: string
  }
  isCreate?: boolean
  backlink?: string | null
  modeData?: {
    current: string
    onChange: (value: string) => void
    onDisabled: () => void
  }
  designNewLayout?: boolean
  designNewLayoutHeight?: number
}

export const BlackholeFormProvider: FC<TBlackholeFormProviderProps> = ({
  theme,
  cluster,
  urlParams,
  urlParamsForPermissions,
  data,
  customizationId,
  forcingCustomization,
  isCreate,
  backlink,
  modeData,
  designNewLayout,
  designNewLayoutHeight,
}) => {
  const [preparedData, setPreparedData] = useState<{
    properties?: {
      [name: string]: OpenAPIV2.SchemaObject
    }
    required: string[]
    hiddenPaths?: string[][]
    expandedPaths: string[][]
    persistedPaths: string[][]
    sortPaths?: string[][]
    kind: string
    isNamespaced?: boolean
    isError?: boolean
    formPrefills?: TFormPrefill
    namespacesData?: string[]
  }>()
  const [isLoading, setIsLoading] = useState(true)
  const [isNamespaced, setIsNamespaced] = useState<boolean>(false)
  const [isError, setIsError] = useState<false | string | ReactNode>(false)
  const hasAppliedBackendModeRef = useRef(false)

  const { data: overridesData, isLoading: overridesLoading } = useK8sSmartResource<TCustomFormsOverridesResponse>({
    cluster,
    apiGroup: forcingCustomization.baseApiGroup,
    apiVersion: forcingCustomization.baseApiVersion,
    plural: 'customformsoverrides',
    isEnabled: Boolean(cluster && forcingCustomization.baseApiGroup && forcingCustomization.baseApiVersion),
  })

  const { data: mappingData, isLoading: mappingLoading } = useK8sSmartResource<TCustomFormsOverridesMappingResponse>({
    cluster,
    apiGroup: forcingCustomization.baseApiGroup,
    apiVersion: forcingCustomization.baseApiVersion,
    plural: forcingCustomization.cfoMappingPlural,
    fieldSelector: `metadata.name=${forcingCustomization.cfoMappinResourceName}`,
    isEnabled: Boolean(
      cluster &&
        forcingCustomization.baseApiGroup &&
        forcingCustomization.baseApiVersion &&
        forcingCustomization.cfoMappingPlural &&
        forcingCustomization.cfoMappinResourceName,
    ),
  })

  const fallbackToManualMode = useCallback(() => {
    if (!modeData || hasAppliedBackendModeRef.current) return

    modeData.onChange('Manual')
    hasAppliedBackendModeRef.current = true
  }, [modeData])

  const applyForceViewMode = useCallback(
    (forceViewMode?: TPrepareFormRes['forceViewMode']) => {
      if (!modeData || !forceViewMode || hasAppliedBackendModeRef.current) return

      if (forceViewMode === 'Manual') {
        modeData.onChange('Manual')
        hasAppliedBackendModeRef.current = true
        return
      }

      modeData.onChange('OpenAPI')
      hasAppliedBackendModeRef.current = true
    },
    [modeData],
  )

  const forcedCustomizationId = customizationId ? mappingData?.items?.[0]?.spec?.mappings?.[customizationId] : undefined
  const hasMatchingOverride = Boolean(
    customizationId && overridesData?.items?.some(item => item?.spec?.customizationId === customizationId),
  )
  const hasForcedMatchingOverride = Boolean(
    forcedCustomizationId && overridesData?.items?.some(item => item?.spec?.customizationId === forcedCustomizationId),
  )
  const isResolutionReady = !customizationId || (!overridesLoading && !mappingLoading)
  const resolvedCustomizationId = isResolutionReady
    ? hasMatchingOverride
      ? customizationId
      : hasForcedMatchingOverride
      ? forcedCustomizationId
      : forcingCustomization.fallbackId
    : undefined

  useEffect(() => {
    if (!cluster) {
      setIsLoading(false)
      return
    }
    if (!isResolutionReady) return
    if (customizationId && !resolvedCustomizationId) return

    setIsLoading(true)
    const payload: TPrepareFormReq = {
      data,
      cluster,
      customizationId: resolvedCustomizationId,
    }
    axios
      .post<TPrepareFormRes>(`/api/clusters/${cluster}/openapi-bff/forms/formPrepare/prepareFormProps`, payload)
      .then(({ data }) => {
        if (data.isNamespaced) {
          setIsNamespaced(true)
        }
        if (data.result === 'error') {
          setIsError(data.error)
          console.warn(data.error)
          if (data.forceViewMode) {
            applyForceViewMode(data.forceViewMode)
          } else {
            fallbackToManualMode()
          }
        } else {
          applyForceViewMode(data.forceViewMode)
          setPreparedData({
            properties: data.properties,
            required: data.required || [],
            hiddenPaths: data.hiddenPaths,
            expandedPaths: data.expandedPaths || [],
            persistedPaths: data.persistedPaths || [],
            sortPaths: data.sortPaths,
            kind: data.kind || '',
            formPrefills: data.formPrefills,
            namespacesData: data.namespacesData,
          })
          setIsError(undefined)
        }
      })
      .catch((e: AxiosError) => {
        setIsError(e.message)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [
    cluster,
    data,
    customizationId,
    resolvedCustomizationId,
    isResolutionReady,
    fallbackToManualMode,
    applyForceViewMode,
  ])

  if (isLoading) {
    return <Spin />
  }

  if (modeData?.current === 'Manual') {
    return (
      <YamlEditorSingleton
        theme={theme}
        cluster={cluster}
        prefillValuesSchema={data.prefillValuesSchema}
        isCreate={isCreate}
        type={data.type}
        isNameSpaced={isNamespaced}
        apiGroupApiVersion={data.type === 'builtin' ? 'api/v1' : `${data.apiGroup}/${data.apiVersion}`}
        plural={data.plural}
        backlink={backlink}
        designNewLayout={designNewLayout}
        designNewLayoutHeight={designNewLayoutHeight}
      />
    )
  }

  if (isError) {
    return <Alert message={isError} type="error" />
  }

  if (!preparedData?.properties && !isError) {
    return null
  }

  if (!preparedData?.properties) {
    return null
  }

  return (
    <BlackholeForm
      cluster={cluster}
      theme={theme}
      urlParams={urlParams}
      urlParamsForPermissions={urlParamsForPermissions}
      formsPrefills={preparedData.formPrefills}
      staticProperties={preparedData.properties}
      required={preparedData.required}
      hiddenPaths={preparedData.hiddenPaths}
      expandedPaths={preparedData.expandedPaths}
      persistedPaths={preparedData.persistedPaths}
      sortPaths={preparedData.sortPaths}
      prefillValuesSchema={data.prefillValuesSchema}
      prefillValueNamespaceOnly={data.prefillValueNamespaceOnly}
      isCreate={isCreate}
      type={data.type}
      isNameSpaced={isNamespaced ? preparedData.namespacesData : false}
      apiGroupApiVersion={data.type === 'builtin' ? 'api/v1' : `${data.apiGroup}/${data.apiVersion}`}
      kind={preparedData.kind}
      plural={data.plural}
      backlink={backlink}
      designNewLayout={designNewLayout}
      designNewLayoutHeight={designNewLayoutHeight}
      key={
        JSON.stringify(preparedData.properties) +
        JSON.stringify(preparedData.required) +
        JSON.stringify(preparedData.hiddenPaths) +
        JSON.stringify(data)
      }
    />
  )
}
