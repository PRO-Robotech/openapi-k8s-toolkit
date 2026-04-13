/* eslint-disable react/no-unstable-nested-components */
import React, { FC, ReactNode } from 'react'
import jp from 'jsonpath'
import { useNavigate } from 'react-router-dom'
import { Table, TableProps, PaginationProps, TablePaginationConfig } from 'antd'
import { AnyObject } from 'antd/es/_util/type'
import { get } from 'lodash'
import {
  TAdditionalPrinterColumnsColWidths,
  TAdditionalPrinterColumnsKeyTypeProps,
  TAdditionalPrinterColumnsTrimLengths,
  TAdditionalPrinterColumnsUndefinedValues,
  TAdditionalPrinterColumnsCustomSortersAndFilters,
  TAdditionalPrinterColumnsTooltips,
} from 'localTypes/richTable'
import { TableComponents } from './atoms'
import { TInternalDataForControls } from './types'
import { getEnrichedColumns, getEnrichedColumnsWithControls } from './utils'

export type TEnrichedTableProps = {
  theme: 'light' | 'dark'
  baseprefix?: string
  dataSource: TableProps['dataSource']
  columns: TableProps['columns']
  pathToNavigate?: string
  recordKeysForNavigation?: string | string[] // jsonpath or keys as string[]
  recordKeysForNavigationSecond?: string | string[] // jsonpath or keys as string[]
  recordKeysForNavigationThird?: string | string[] // jsonpath or keys as string[]
  additionalPrinterColumnsUndefinedValues?: TAdditionalPrinterColumnsUndefinedValues
  additionalPrinterColumnsTrimLengths?: TAdditionalPrinterColumnsTrimLengths
  additionalPrinterColumnsColWidths?: TAdditionalPrinterColumnsColWidths
  additionalPrinterColumnsTooltips?: TAdditionalPrinterColumnsTooltips
  additionalPrinterColumnsKeyTypeProps?: TAdditionalPrinterColumnsKeyTypeProps
  additionalPrinterColumnsCustomSortersAndFilters?: TAdditionalPrinterColumnsCustomSortersAndFilters
  selectData?: {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    onChange: (selectedRowKeys: React.Key[], selectedRowsData: { name: string; endpoint: string }[]) => void
    selectedRowKeys: React.Key[]
  }
  withoutControls?: boolean
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
}

export const EnrichedTable: FC<TEnrichedTableProps> = ({
  theme,
  baseprefix,
  dataSource,
  columns,
  pathToNavigate,
  recordKeysForNavigation,
  recordKeysForNavigationSecond,
  recordKeysForNavigationThird,
  additionalPrinterColumnsUndefinedValues,
  additionalPrinterColumnsTrimLengths,
  additionalPrinterColumnsColWidths,
  additionalPrinterColumnsTooltips,
  additionalPrinterColumnsKeyTypeProps,
  additionalPrinterColumnsCustomSortersAndFilters,
  selectData,
  withoutControls = false,
  tableProps,
}) => {
  const navigate = useNavigate()

  if (!columns) {
    return null
  }

  // for factory search
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const rowKey = (record: any) => record.key

  const enrichedColumns = getEnrichedColumns({
    columns,
    additionalPrinterColumnsUndefinedValues,
    additionalPrinterColumnsTrimLengths,
    additionalPrinterColumnsColWidths,
    additionalPrinterColumnsTooltips,
    additionalPrinterColumnsKeyTypeProps,
    additionalPrinterColumnsCustomSortersAndFilters,
    theme,
    getRowKey: rowKey, // for factory search
  })

  if (!enrichedColumns) {
    return null
  }

  const columnsWithControls = withoutControls
    ? enrichedColumns
    : getEnrichedColumnsWithControls({
        enrichedColumns,
        navigate,
        baseprefix,
        editIcon: tableProps?.editIcon,
        deleteIcon: tableProps?.deleteIcon,
      })

  if (!columnsWithControls) {
    return null
  }

  const showTotal: PaginationProps['showTotal'] = total => `Total: ${total}`

  return (
    <TableComponents.TableContainer
      $isDark={theme === 'dark'}
      $isCursorPointer={!!pathToNavigate}
      $borderless={tableProps?.borderless}
      $isTotalLeft={tableProps?.isTotalLeft}
    >
      <TableComponents.HideableControls>
        <Table<AnyObject>
          // for factory search
          rowKey={rowKey}
          dataSource={dataSource}
          columns={columnsWithControls}
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
          scroll={{ x: 'max-content', y: tableProps?.maxHeight }}
          virtual={tableProps?.virtual}
          rowSelection={
            selectData
              ? {
                  type: 'checkbox',
                  columnWidth: 48,
                  selectedRowKeys: selectData.selectedRowKeys,
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onChange: (selectedRowKeys: React.Key[], selectedRows: AnyObject[]) => {
                    const rows = selectedRows as { internalDataForControls: TInternalDataForControls }[]
                    selectData.onChange(
                      selectedRowKeys,
                      rows.map(({ internalDataForControls }) => ({
                        name: internalDataForControls.name,
                        endpoint: `${internalDataForControls.deletePathPrefix}/${
                          internalDataForControls.apiGroupAndVersion
                        }${
                          internalDataForControls.namespace ? `/namespaces/${internalDataForControls.namespace}` : ''
                        }/${internalDataForControls.plural}/${internalDataForControls.name}`,
                      })),
                    )
                  },
                }
              : undefined
          }
          onRow={record => {
            return {
              onClick: () => {
                if (pathToNavigate && recordKeysForNavigation) {
                  const recordValueRaw = Array.isArray(recordKeysForNavigation)
                    ? get(record, recordKeysForNavigation)
                    : jp.query(record || {}, `$${recordKeysForNavigation}`)[0]

                  let recordValueRawSecond: string = ''
                  if (recordKeysForNavigationSecond) {
                    recordValueRawSecond = Array.isArray(recordKeysForNavigationSecond)
                      ? get(record, recordKeysForNavigationSecond)
                      : jp.query(record || {}, `$${recordKeysForNavigationSecond}`)[0]
                  } else {
                    recordValueRawSecond = 'no-second-record-keys'
                  }

                  let recordValueRawThird: string = ''
                  if (recordKeysForNavigationThird) {
                    recordValueRawThird = Array.isArray(recordKeysForNavigationThird)
                      ? get(record, recordKeysForNavigationThird)
                      : jp.query(record || {}, `$${recordKeysForNavigationThird}`)[0]
                  } else {
                    recordValueRawThird = 'no-second-record-keys'
                  }

                  const recordValue =
                    typeof recordValueRaw === 'string' ? recordValueRaw : JSON.stringify(recordValueRaw)
                  const recordValueSecond =
                    typeof recordValueRawSecond === 'string'
                      ? recordValueRawSecond
                      : JSON.stringify(recordValueRawSecond)
                  const recordValueThird =
                    typeof recordValueRawThird === 'string' ? recordValueRawThird : JSON.stringify(recordValueRawThird)

                  const newPath = pathToNavigate
                    .replaceAll('~recordValue~', recordValue)
                    .replaceAll('~recordValueSecond~', recordValueSecond)
                    .replaceAll('~recordValueThird~', recordValueThird)
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
