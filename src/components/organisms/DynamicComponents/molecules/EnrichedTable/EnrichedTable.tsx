/* eslint-disable max-lines-per-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC, useState } from 'react'
import jp from 'jsonpath'
import _ from 'lodash'
import { useLocation, useNavigate, useParams } from 'react-router-dom'
import { Flex, Spin, Button } from 'antd'
import { PlusOutlined, ClearOutlined, MinusOutlined } from '@ant-design/icons'
import { EditIcon, DeleteIcon, PaddingContainer, DeleteModal, DeleteModalMany } from 'components/atoms'
import { EnrichedTableProvider } from 'components/molecules'
import { usePermissions } from 'hooks/usePermissions'
import { useDirectUnknownResource } from 'hooks/useDirectUnknownResource'
import { getLinkToForm } from 'utils/tableLocations'
import { prepareTemplate } from 'utils/prepareTemplate'
import { TDynamicComponentsAppTypeMap } from '../../types'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/multiQueryProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/partsOfUrlContext'
import { useTheme } from '../../../DynamicRendererWithProviders/themeContext'
import { parseAll } from '../utils'
import { serializeLabelsWithNoEncoding } from './utils'

export const EnrichedTable: FC<{ data: TDynamicComponentsAppTypeMap['EnrichedTable']; children?: any }> = ({
  data,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  children,
}) => {
  const location = useLocation()
  const params = useParams()
  const navigate = useNavigate()

  const [selectedRowKeys, setSelectedRowKeys] = useState<React.Key[]>([])
  const [selectedRowsData, setSelectedRowsData] = useState<{ name: string; endpoint: string }[]>([])
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState<false | { name: string; endpoint: string }>(false)
  const [isDeleteModalManyOpen, setIsDeleteModalManyOpen] = useState<false | { name: string; endpoint: string }[]>(
    false,
  )

  const { data: multiQueryData, isLoading: isMultiqueryLoading } = useMultiQuery()

  const {
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    id,
    fetchUrl,
    pathToItems,
    clusterNamePartOfUrl,
    labelSelector,
    labelSelectorFull,
    fieldSelector,
    namespace,
    k8sResource,
    dataForControls,
    baseprefix,
    ...props
  } = data

  const theme = useTheme()
  const partsOfUrl = usePartsOfUrl()

  const replaceValues = partsOfUrl.partsOfUrl.reduce<Record<string, string | undefined>>((acc, value, index) => {
    acc[index.toString()] = value
    return acc
  }, {})

  const clusterName = prepareTemplate({
    template: clusterNamePartOfUrl,
    replaceValues,
  })

  const namespacePrepared = namespace ? parseAll({ text: namespace, replaceValues, multiQueryData }) : undefined

  const k8sResourcePrePrepared = k8sResource
    ? {
        apiGroup: k8sResource.apiGroup
          ? parseAll({ text: k8sResource.apiGroup, replaceValues, multiQueryData })
          : undefined,
        apiVersion: parseAll({ text: k8sResource.apiVersion, replaceValues, multiQueryData }),
        resource: parseAll({ text: k8sResource.resource, replaceValues, multiQueryData }),
      }
    : undefined

  const k8sResourcePrepared =
    k8sResourcePrePrepared?.apiGroup === '-'
      ? { apiVersion: k8sResourcePrePrepared.apiVersion, resource: k8sResourcePrePrepared.resource }
      : k8sResourcePrePrepared

  const dataForControlsPrepared = dataForControls
    ? {
        cluster: clusterName,
        syntheticProject: dataForControls.syntheticProject
          ? parseAll({ text: dataForControls.syntheticProject, replaceValues, multiQueryData })
          : undefined,
        resource: parseAll({ text: dataForControls.resource, replaceValues, multiQueryData }),
        apiGroup: dataForControls.apiGroup
          ? parseAll({ text: dataForControls.apiGroup, replaceValues, multiQueryData })
          : undefined,
        apiVersion: parseAll({ text: dataForControls.apiVersion, replaceValues, multiQueryData }),
      }
    : undefined

  const createPermission = usePermissions({
    group: dataForControlsPrepared?.apiGroup,
    resource: dataForControlsPrepared?.resource || '',
    namespace: namespacePrepared,
    clusterName,
    verb: 'create',
    refetchInterval: false,
  })

  const fetchUrlPrepared = parseAll({ text: fetchUrl, replaceValues, multiQueryData })

  const sParams = new URLSearchParams()

  if (labelSelector && Object.keys(labelSelector).length > 0) {
    const parsedObject: Record<string, string> = Object.fromEntries(
      Object.entries(labelSelector).map(
        ([k, v]) => [k, parseAll({ text: v, replaceValues, multiQueryData })] as [string, string],
      ),
    )
    const serializedLabels = serializeLabelsWithNoEncoding(parsedObject)
    if (serializedLabels.length > 0) sParams.set('labelSelector', serializedLabels)
  }

  if (labelSelectorFull) {
    const root = multiQueryData[`req${labelSelectorFull.reqIndex}`]
    const value = Array.isArray(labelSelectorFull.pathToLabels)
      ? _.get(root, labelSelectorFull.pathToLabels)
      : jp.query(root, `$${labelSelectorFull.pathToLabels}`)[0]

    const serializedLabels = serializeLabelsWithNoEncoding(value)
    if (serializedLabels.length > 0) sParams.set('labelSelector', serializedLabels)
  }

  if (fieldSelector) {
    const parsedObject: Record<string, string> = Object.fromEntries(
      Object.entries(fieldSelector).map(
        ([k, v]) =>
          [
            parseAll({ text: k, replaceValues, multiQueryData }),
            parseAll({ text: v, replaceValues, multiQueryData }),
          ] as [string, string],
      ),
    )
    const serializedFields = serializeLabelsWithNoEncoding(parsedObject)

    if (serializedFields.length > 0) sParams.set('fieldSelector', serializedFields)
  }

  const searchParams = sParams.toString()

  const {
    data: fetchedData,
    isLoading: isFetchedDataLoading,
    error: fetchedDataError,
  } = useDirectUnknownResource<unknown>({
    uri: `${fetchUrlPrepared}${searchParams ? `?${searchParams}` : ''}`,
    queryKey: [`${fetchUrlPrepared}${searchParams ? `?${searchParams}` : ''}`],
    isEnabled: !isMultiqueryLoading,
  })

  if (isMultiqueryLoading) {
    return <div>Loading multiquery</div>
  }

  // if (!fetchedData) {
  //   return <div>No data has been fetched</div>
  // }

  if (isFetchedDataLoading) {
    return (
      <Flex justify="center">
        <Spin />
      </Flex>
    )
  }

  if (fetchedDataError) {
    return <div>Error: {JSON.stringify(fetchedDataError)}</div>
  }

  const items = Array.isArray(pathToItems)
    ? _.get(fetchedData, pathToItems)
    : jp.query(fetchedData, `$${pathToItems}`)[0]

  if (!items) {
    return <div>No data on this path {JSON.stringify(pathToItems)}</div>
  }

  const clearSelected = () => {
    setSelectedRowKeys([])
    setSelectedRowsData([])
  }

  const onDeleteHandle = (name: string, endpoint: string) => {
    setIsDeleteModalOpen({ name, endpoint })
  }

  const fullPath = `${location.pathname}${location.search}`

  return (
    <>
      <EnrichedTableProvider
        tableMappingsReplaceValues={replaceValues}
        cluster={clusterName}
        namespace={namespacePrepared}
        theme={theme}
        dataItems={items}
        tableProps={{
          borderless: true,
          paginationPosition: ['bottomRight'],
          isTotalLeft: true,
          editIcon: <EditIcon />,
          deleteIcon: <DeleteIcon />,
          disablePagination: true,
        }}
        selectData={
          dataForControlsPrepared
            ? {
                selectedRowKeys,
                onChange: (selectedRowKeys: React.Key[], selectedRowsData: { name: string; endpoint: string }[]) => {
                  setSelectedRowKeys(selectedRowKeys)
                  setSelectedRowsData(selectedRowsData)
                },
              }
            : undefined
        }
        k8sResource={k8sResourcePrepared}
        dataForControlsInternal={{ onDeleteHandle }}
        dataForControls={dataForControlsPrepared}
        withoutControls={!dataForControlsPrepared}
        baseprefix={baseprefix}
        {...props}
      />
      {dataForControlsPrepared && (
        <PaddingContainer $padding="4px">
          <Flex justify="space-between">
            <Button
              type="primary"
              onClick={() => {
                const url = getLinkToForm({
                  cluster: clusterName,
                  baseprefix,
                  namespace: namespacePrepared,
                  syntheticProject: params.syntheticProject,
                  apiGroup: dataForControlsPrepared.apiGroup,
                  apiVersion: dataForControlsPrepared.apiVersion,
                  typeName: dataForControlsPrepared.resource,
                  fullPath,
                })
                navigate(url)
              }}
              loading={createPermission.isPending}
              disabled={!createPermission.data?.status.allowed}
            >
              <PlusOutlined />
              Add
            </Button>
            {selectedRowKeys.length > 0 && (
              <Flex gap={16}>
                <Button type="primary" onClick={clearSelected}>
                  <ClearOutlined />
                  Clear
                </Button>
                <Button type="primary" onClick={() => setIsDeleteModalManyOpen(selectedRowsData)}>
                  <MinusOutlined />
                  Delete
                </Button>
              </Flex>
            )}
          </Flex>
        </PaddingContainer>
      )}
      {isDeleteModalOpen && (
        <DeleteModal
          name={isDeleteModalOpen.name}
          onClose={() => {
            setIsDeleteModalOpen(false)
            clearSelected()
          }}
          endpoint={isDeleteModalOpen.endpoint}
        />
      )}
      {isDeleteModalManyOpen !== false && (
        <DeleteModalMany
          data={isDeleteModalManyOpen}
          onClose={() => {
            setIsDeleteModalManyOpen(false)
            clearSelected()
          }}
        />
      )}
      {children}
    </>
  )
}
