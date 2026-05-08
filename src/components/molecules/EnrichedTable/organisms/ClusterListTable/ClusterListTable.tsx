import React from 'react'
import jp from 'jsonpath'
import axios from 'axios'
import { useNavigate } from 'react-router-dom'
import { Table, TableProps, PaginationProps, TablePaginationConfig } from 'antd'
import { AnyObject } from 'antd/es/_util/type'
import { get } from 'lodash'
import { TNavigationResource } from 'localTypes/navigations'
import { getEnrichedColumns } from '../EnrichedTable'
import { TableComponents } from '../EnrichedTable/atoms'

export type TClusterListTableProps<T extends AnyObject = AnyObject> = {
  theme: 'light' | 'dark'
  dataSource: TableProps<T>['dataSource']
  columns: TableProps<T>['columns']
  pathToNavigate?: string
  recordKeysForNavigation?: string | string[] // jsonpath or keys as string[]
  rowClassName?: TableProps<T>['rowClassName']
  onRow?: TableProps<T>['onRow']
  rowClickable?: boolean
  navigationSettings?: {
    apiGroup: string
    apiVersion: string
    plural: string
    resourceName: string
  }
  tableProps?: {
    borderless?: boolean
    paginationPosition?: TablePaginationConfig['position']
    isTotalLeft?: boolean
    maxHeight?: number
    scroll?: TableProps<T>['scroll']
    virtual?: boolean
    disablePagination?: boolean
  }
}

export const ClusterListTable = <T extends AnyObject = AnyObject>({
  theme,
  dataSource,
  columns,
  pathToNavigate,
  recordKeysForNavigation,
  rowClassName,
  onRow,
  rowClickable = Boolean(pathToNavigate),
  navigationSettings,
  tableProps,
}: TClusterListTableProps<T>) => {
  const navigate = useNavigate()

  if (!columns) {
    return null
  }

  const rowKey = (record: T) => record.key

  const enrichedColumns = getEnrichedColumns({
    columns,
    theme,
    getRowKey: rowKey,
  })

  if (!enrichedColumns) {
    return null
  }

  const showTotal: PaginationProps['showTotal'] = total => `Total: ${total}`

  const tryGetPathFromNavigationResource = async (clusterName?: string): Promise<string | undefined> => {
    const resolvedCluster = clusterName
    const resolvedApiGroup = navigationSettings?.apiGroup
    const resolvedApiVersion = navigationSettings?.apiVersion
    const resolvedPlural = navigationSettings?.plural
    const resolvedResourceName = navigationSettings?.resourceName

    if (!resolvedCluster || !resolvedApiGroup || !resolvedApiVersion || !resolvedPlural || !resolvedResourceName) {
      return undefined
    }

    try {
      const { data } = await axios.get<{ items?: TNavigationResource[] }>(
        `/api/clusters/${resolvedCluster}/k8s/apis/${resolvedApiGroup}/${resolvedApiVersion}/${resolvedPlural}`,
        {
          params: {
            fieldSelector: `metadata.name=${resolvedResourceName}`,
          },
        },
      )
      const spec = data?.items?.[0]?.spec as TNavigationResource['spec'] & {
        pathToNavigateFromClusterList?: string
      }
      return spec?.pathToNavigateFromClusterList
    } catch {
      return undefined
    }
  }

  return (
    <TableComponents.TableContainer
      $isDark={theme === 'dark'}
      $isCursorPointer={Boolean(
        (recordKeysForNavigation && (!!pathToNavigate || !!navigationSettings)) || rowClickable,
      )}
      $borderless={tableProps?.borderless}
      $isTotalLeft={tableProps?.isTotalLeft}
    >
      <TableComponents.HideableControls>
        <Table<T>
          rowKey={rowKey}
          dataSource={dataSource}
          columns={enrichedColumns}
          pagination={
            tableProps?.disablePagination
              ? false
              : {
                  position: tableProps?.paginationPosition || ['bottomLeft'],
                  showSizeChanger: true,
                  defaultPageSize: 10,
                  hideOnSinglePage: false,
                  showTotal,
                }
          }
          scroll={tableProps?.scroll || { x: 'max-content', y: tableProps?.maxHeight }}
          virtual={tableProps?.virtual}
          rowClassName={rowClassName}
          onRow={record => {
            const consumerRowProps = onRow?.(record, undefined)
            return {
              ...consumerRowProps,
              onClick: async event => {
                consumerRowProps?.onClick?.(event)
                if (event.defaultPrevented) {
                  return
                }

                if (recordKeysForNavigation) {
                  const recordValueRaw = Array.isArray(recordKeysForNavigation)
                    ? get(record, recordKeysForNavigation)
                    : jp.query(record || {}, `$${recordKeysForNavigation}`)[0]

                  const clusterName = typeof recordValueRaw === 'string' ? recordValueRaw : undefined
                  const recordValue =
                    typeof recordValueRaw === 'string' ? recordValueRaw : JSON.stringify(recordValueRaw)

                  const fetchedPathToNavigate = await tryGetPathFromNavigationResource(clusterName)
                  const finalPathToNavigate = fetchedPathToNavigate || pathToNavigate
                  if (!finalPathToNavigate) {
                    return
                  }

                  const newPath = finalPathToNavigate.replaceAll('~recordValue~', recordValue)
                  navigate(newPath)
                }
              },
            }
          }}
        />
      </TableComponents.HideableControls>
    </TableComponents.TableContainer>
  )
}
