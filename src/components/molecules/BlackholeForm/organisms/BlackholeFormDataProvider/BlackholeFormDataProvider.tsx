/* eslint-disable max-lines-per-function */
/* eslint-disable no-console */
import React, { FC, useState, useEffect, ReactNode, useCallback } from 'react'
import { Alert, Spin } from 'antd'
import axios, { AxiosError } from 'axios'
import { TJSON } from 'localTypes/JSON'
import { OpenAPIV2 } from 'openapi-types'
import { TUrlParams } from 'localTypes/form'
import { TPrepareFormReq, TPrepareFormRes } from 'localTypes/bff/form'
import { TFormPrefill } from 'localTypes/formExtensions'
import { YamlEditorSingleton } from '../../molecules/YamlEditorSingleton'
import { BlackholeForm } from '../BlackholeForm'

export type TBlackholeFormDataProviderProps = {
  theme: 'light' | 'dark'
  cluster: string
  urlParams: TUrlParams
  urlParamsForPermissions: {
    apiGroup?: string
    typeName?: string
  }
  data:
    | {
        type: 'builtin'
        typeName: string
        prefillValuesSchema?: TJSON
        prefillValueNamespaceOnly?: string
      }
    | {
        type: 'apis'
        apiGroup: string
        apiVersion: string
        typeName: string
        prefillValuesSchema?: TJSON
        prefillValueNamespaceOnly?: string
      }
  customizationId?: string
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

export const BlackholeFormDataProvider: FC<TBlackholeFormDataProviderProps> = ({
  theme,
  cluster,
  urlParams,
  urlParamsForPermissions,
  data,
  customizationId,
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
    kindName: string
    isNamespaced?: boolean
    isError?: boolean
    formPrefills?: TFormPrefill
    namespacesData?: string[]
  }>()
  const [isLoading, setIsLoading] = useState(false)
  const [isNamespaced, setIsNamespaced] = useState<boolean>(false)
  const [isError, setIsError] = useState<false | string | ReactNode>(false)

  const fallbackToManualMode = useCallback(() => {
    if (modeData) {
      modeData.onChange('Manual')
      modeData.onDisabled()
    }
  }, [modeData])

  useEffect(() => {
    setIsLoading(true)
    const payload: TPrepareFormReq = {
      data,
      clusterName: cluster,
      customizationId,
    }
    axios
      .post<TPrepareFormRes>(`/api/clusters/${cluster}/openapi-bff/forms/formPrepare/prepareFormProps`, payload)
      .then(({ data }) => {
        if (data.isNamespaced) {
          setIsNamespaced(true)
        }
        if (data.result === 'error') {
          setIsError(data.error)
          console.log(data.error)
          fallbackToManualMode()
        } else {
          setPreparedData({
            properties: data.properties,
            required: data.required || [],
            hiddenPaths: data.hiddenPaths,
            expandedPaths: data.expandedPaths || [],
            persistedPaths: data.persistedPaths || [],
            sortPaths: data.sortPaths,
            kindName: data.kindName || '',
            formPrefills: data.formPrefills,
            namespacesData: data.namespacesData,
          })
        }
      })
      .catch((e: AxiosError) => {
        setIsError(e.message)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [cluster, data, customizationId, fallbackToManualMode])

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
        typeName={data.typeName}
        backlink={backlink}
        designNewLayout={designNewLayout}
        designNewLayoutHeight={designNewLayoutHeight}
      />
    )
  }

  if (!preparedData?.properties && !isError) {
    return null
  }
  if (!preparedData?.properties) {
    return null
  }

  if (isError) {
    return <Alert message={isError} type="error" />
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
      kindName={preparedData.kindName}
      typeName={data.typeName}
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
