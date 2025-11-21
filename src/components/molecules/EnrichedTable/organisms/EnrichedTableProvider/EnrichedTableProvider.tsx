import React, { FC, useState, useEffect, ReactNode } from 'react'
import axios, { AxiosError } from 'axios'
import { useLocation } from 'react-router-dom'
import { Flex, Spin, Alert, TablePaginationConfig } from 'antd'
import { TJSON } from 'localTypes/JSON'
import { TPrepareTableReq, TPrepareTableRes } from 'localTypes/bff/table'
import { TAdditionalPrinterColumns } from 'localTypes/richTable'
import { usePermissions } from 'hooks/usePermissions'
import { EnrichedTable } from '../EnrichedTable'
import { prepare } from './utils'

export type TEnrichedTableProviderProps = {
  cluster: string
  namespace?: string
  theme: 'light' | 'dark'
  baseprefix?: string

  dataItems: TJSON[]
  resourceSchema?: TJSON

  k8sResource?: {
    plural: string
    apiGroup?: string
    apiVersion: string
  }
  // isNamespaced?: boolean
  // isNamespacedLoading?: boolean

  dataForControls?: {
    cluster: string
    syntheticProject?: string
    plural: string
    apiGroup?: string
    apiVersion: string
  }
  dataForControlsInternal: {
    onDeleteHandle: (name: string, endpoint: string) => void
  }

  customizationId?: string
  tableMappingsReplaceValues?: Record<string, string | undefined>
  forceDefaultAdditionalPrinterColumns?: TAdditionalPrinterColumns

  selectData?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onChange: (selectedRowKeys: React.Key[], selectedRowsData: { name: string; endpoint: string }[]) => void
    selectedRowKeys: React.Key[]
  }
  tableProps?: {
    borderless?: boolean
    paginationPosition?: TablePaginationConfig['position']
    isTotalLeft?: boolean
    editIcon?: ReactNode
    deleteIcon?: ReactNode
    maxHeight?: number
    virtual?: boolean
    disablePagination?: boolean
  }
  withoutControls?: boolean
}

export const EnrichedTableProvider: FC<TEnrichedTableProviderProps> = ({
  cluster,
  namespace,
  theme,
  baseprefix,
  dataItems,
  resourceSchema,
  k8sResource,
  // isNamespaced,
  // isNamespacedLoading,
  dataForControls,
  dataForControlsInternal,
  customizationId,
  tableMappingsReplaceValues,
  forceDefaultAdditionalPrinterColumns,
  selectData,
  tableProps,
  withoutControls,
}) => {
  const location = useLocation()

  const [preparedProps, setPreparedProps] = useState<TPrepareTableRes>()
  const [isLoading, setIsLoading] = useState(false)
  const [isError, setIsError] = useState<false | string | ReactNode>(false)

  const updatePermission = usePermissions({
    apiGroup: dataForControls?.apiGroup,
    plural: dataForControls?.plural || '',
    namespace,
    cluster,
    verb: 'update',
    refetchInterval: false,
  })

  const deletePermission = usePermissions({
    apiGroup: dataForControls?.apiGroup,
    plural: dataForControls?.plural || '',
    namespace,
    cluster,
    verb: 'delete',
    refetchInterval: false,
  })

  useEffect(() => {
    setIsError(undefined)
    setIsLoading(true)
    const payload: TPrepareTableReq = {
      cluster,
      customizationId,
      tableMappingsReplaceValues,
      forceDefaultAdditionalPrinterColumns,
      namespace,
      k8sResource,
      // namespaceScopedWithoutNamespace: isNamespaced && !namespace,
    }
    axios
      .post<TPrepareTableRes>(`/api/clusters/${cluster}/openapi-bff/tables/tablePrepare/prepareTableProps`, payload)
      .then(({ data }) => {
        setPreparedProps(data)
        setIsError(undefined)
      })
      .catch((e: AxiosError) => {
        setIsError(e.message)
      })
      .finally(() => {
        setIsLoading(false)
      })
  }, [
    cluster,
    customizationId,
    tableMappingsReplaceValues,
    forceDefaultAdditionalPrinterColumns,
    namespace,
    k8sResource,
    // isNamespaced,
  ])

  // if (isNamespacedLoading) {
  //   return (
  //     <Flex justify="center">
  //       <Spin />
  //     </Flex>
  //   )
  // }

  if (!preparedProps && isLoading) {
    return (
      <Flex justify="center">
        <Spin />
      </Flex>
    )
  }

  if (isError) {
    return <Alert message={isError} type="error" />
  }

  if (!preparedProps) {
    return (
      <Flex justify="center">
        <Spin />
      </Flex>
    )
  }

  const fullPath = `${location.pathname}${location.search}`

  const { dataSource, columns } = prepare({
    dataItems,
    resourceSchema,
    dataForControls: dataForControls
      ? {
          ...dataForControls,
          cluster: dataForControls.cluster,
          syntheticProject: dataForControls.syntheticProject,
          pathPrefix:
            !dataForControls.apiGroup || dataForControls.apiGroup.length === 0 ? 'forms/builtin' : 'forms/apis',
          plural: dataForControls.plural,
          apiVersion:
            !dataForControls.apiGroup || dataForControls.apiGroup.length === 0
              ? dataForControls.apiVersion
              : `${dataForControls.apiGroup}/${dataForControls.apiVersion}`,
          backlink: encodeURIComponent(fullPath),
          onDeleteHandle: dataForControlsInternal.onDeleteHandle,
          deletePathPrefix:
            !dataForControls.apiGroup || dataForControls.apiGroup.length === 0
              ? `/api/clusters/${cluster}/k8s/api`
              : `/api/clusters/${cluster}/k8s/apis`,
          permissions: {
            canUpdate: updatePermission.data?.status.allowed,
            canDelete: deletePermission.data?.status.allowed,
          },
        }
      : undefined,
    additionalPrinterColumns: preparedProps.additionalPrinterColumns,
  })

  return (
    <EnrichedTable
      theme={theme}
      baseprefix={baseprefix}
      dataSource={dataSource}
      columns={columns}
      pathToNavigate={preparedProps.pathToNavigate}
      recordKeysForNavigation={preparedProps.recordKeysForNavigation}
      recordKeysForNavigationSecond={preparedProps.recordKeysForNavigationSecond}
      recordKeysForNavigationThird={preparedProps.recordKeysForNavigationThird}
      additionalPrinterColumnsUndefinedValues={preparedProps.additionalPrinterColumnsUndefinedValues}
      additionalPrinterColumnsTrimLengths={preparedProps.additionalPrinterColumnsTrimLengths}
      additionalPrinterColumnsColWidths={preparedProps.additionalPrinterColumnsColWidths}
      additionalPrinterColumnsKeyTypeProps={preparedProps.additionalPrinterColumnsKeyTypeProps}
      selectData={selectData}
      tableProps={tableProps}
      withoutControls={withoutControls}
    />
  )
}
