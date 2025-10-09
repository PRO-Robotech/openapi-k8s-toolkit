import { ReactNode } from 'react'
import { NavigateFunction } from 'react-router-dom'
import { TableProps, Dropdown } from 'antd'
import {
  CheckOutlined,
  CloseOutlined,
  SearchOutlined,
  // EditOutlined,
  // DeleteOutlined,
  MoreOutlined,
} from '@ant-design/icons'
import { get } from 'lodash'
import {
  TAdditionalPrinterColumnsColWidths,
  TAdditionalPrinterColumnsTrimLengths,
  TAdditionalPrinterColumnsUndefinedValues,
  TAdditionalPrinterColumnsKeyTypeProps,
} from 'localTypes/richTable'
import { TJSON } from 'localTypes/JSON'
import { isFlatObject } from 'utils/isFlatObject'
import { TableFactory } from '../../molecules'
import { ShortenedTextWithTooltip, FilterDropdown, TrimmedTags, TextAlignContainer, TinyButton } from './atoms'
import { TInternalDataForControls } from './types'

export const getCellRender = ({
  value,
  record,
  possibleTrimLength,
  possibleUndefinedValue,
  possibleCustomTypeWithProps,
  theme,
}: {
  value: TJSON
  record: unknown
  possibleTrimLength?: number
  possibleUndefinedValue?: string
  possibleCustomTypeWithProps?: {
    type?: string
    customProps?: unknown
  }
  theme: 'dark' | 'light'
}): JSX.Element => {
  if (possibleCustomTypeWithProps) {
    const { type, customProps } = possibleCustomTypeWithProps
    if (value === undefined && possibleUndefinedValue) {
      return <ShortenedTextWithTooltip trimLength={possibleTrimLength} text={possibleUndefinedValue} />
    }
    if (value === undefined) {
      return <div>Raw: undefined</div>
    }
    if (type === 'string') {
      if (typeof value === 'string') {
        return <ShortenedTextWithTooltip trimLength={possibleTrimLength} text={value} />
      }
      return (
        <ShortenedTextWithTooltip
          trimLength={possibleTrimLength}
          text={JSON.stringify(value) || possibleUndefinedValue || ''}
        />
      )
    }
    if (type === 'float' || type === 'integer') {
      return <ShortenedTextWithTooltip trimLength={possibleTrimLength} text={String(Number(value))} />
    }
    if (type === 'boolean') {
      return <div>{Boolean(value)}</div>
    }
    if (type === 'array') {
      let tags: string[] = []
      if (typeof value === 'object' && !Array.isArray(value) && value !== null && isFlatObject(value)) {
        tags = Object.entries(value).map(([key, value]) => `${key}: ${String(value)}`)
      } else if (typeof value === 'object' && !Array.isArray(value) && value !== null && !isFlatObject(value)) {
        tags = Object.entries(value).map(([key, value]) => `${key}: ${String(value)}`)
      } else if (Array.isArray(value)) {
        tags = value.map(el => (el === null ? 'null' : el.toString()))
      } else {
        tags = [String(value)]
      }
      return <TrimmedTags tags={tags} trimLength={possibleTrimLength} />
    }
    if (type === 'factory') {
      return <TableFactory record={record} customProps={customProps} theme={theme} />
    }
  }
  if (value === null) {
    return <div>null</div>
  }
  if (typeof value === 'object' && !Array.isArray(value)) {
    if (isFlatObject(value)) {
      return (
        <TrimmedTags
          tags={Object.entries(value).map(([key, value]) => `${key}: ${String(value)}`)}
          trimLength={possibleTrimLength}
        />
      )
    }
    return <ShortenedTextWithTooltip trimLength={possibleTrimLength} text={JSON.stringify(value)} />
  }
  if (Array.isArray(value)) {
    if (value.every(el => el && !Array.isArray(el))) {
      return <TrimmedTags tags={value.map(el => (el ? el.toLocaleString() : 'null'))} trimLength={possibleTrimLength} />
    }
    return <ShortenedTextWithTooltip trimLength={possibleTrimLength} text={value.join(', ')} />
  }
  if (typeof value === 'boolean') {
    return value ? <CheckOutlined style={{ color: 'green' }} /> : <CloseOutlined style={{ color: 'red' }} />
  }
  if (typeof value === 'number') {
    return <ShortenedTextWithTooltip trimLength={possibleTrimLength} text={String(value)} />
  }
  if (typeof value === 'string') {
    return <ShortenedTextWithTooltip trimLength={possibleTrimLength} text={value} />
  }
  return <div>Raw: {JSON.stringify(value)}</div>
}

export const getEnrichedColumns = ({
  columns,
  additionalPrinterColumnsUndefinedValues,
  additionalPrinterColumnsTrimLengths,
  additionalPrinterColumnsColWidths,
  additionalPrinterColumnsKeyTypeProps,
  theme,
}: {
  columns: TableProps['columns']
  additionalPrinterColumnsUndefinedValues?: TAdditionalPrinterColumnsUndefinedValues
  additionalPrinterColumnsTrimLengths?: TAdditionalPrinterColumnsTrimLengths
  additionalPrinterColumnsColWidths?: TAdditionalPrinterColumnsColWidths
  additionalPrinterColumnsKeyTypeProps?: TAdditionalPrinterColumnsKeyTypeProps
  theme: 'dark' | 'light'
}): TableProps['columns'] | undefined => {
  if (!columns) {
    return undefined
  }

  return columns.map(el => {
    const possibleUndefinedValue = additionalPrinterColumnsUndefinedValues?.find(({ key }) => key === el.key)?.value
    const possibleTrimLength = additionalPrinterColumnsTrimLengths?.find(({ key }) => key === el.key)?.value
    const possibleColWidth = additionalPrinterColumnsColWidths?.find(({ key }) => key === el.key)?.value
    const possibleCustomTypeWithProps =
      additionalPrinterColumnsKeyTypeProps && el.key
        ? additionalPrinterColumnsKeyTypeProps[el.key.toString()]
        : undefined

    return {
      ...el,
      render: (value: TJSON, record: unknown) =>
        getCellRender({
          value,
          record,
          possibleTrimLength,
          possibleUndefinedValue,
          possibleCustomTypeWithProps,
          theme,
        }),
      width: possibleColWidth,
      filterDropdown: ({ setSelectedKeys, selectedKeys, confirm, clearFilters, close }) => (
        <FilterDropdown
          setSelectedKeys={setSelectedKeys}
          selectedKeys={selectedKeys}
          confirm={confirm}
          clearFilters={clearFilters}
          close={close}
        />
      ),
      filterIcon: (filtered: boolean) => <SearchOutlined style={{ color: filtered ? '#1677ff' : undefined }} />,
      onFilter: (value, record) => {
        const { dataIndex } = el as { dataIndex: string | string[] } & unknown
        const entry = Array.isArray(dataIndex) ? get(record, dataIndex) : record[dataIndex]
        if (typeof entry === 'object' && !Array.isArray(entry)) {
          return JSON.stringify(entry)
            .toLowerCase()
            .includes((value as string).toLowerCase())
        }
        if (Array.isArray(entry)) {
          return entry.some((el: string) => el.toLowerCase().includes((value as string).toLowerCase()))
        }
        if (typeof entry === 'boolean') {
          const isTrue = (value as string).toLowerCase() === 'true'
          return entry === isTrue
        }
        if (typeof entry === 'number') {
          return String(entry).includes((value as string).toLowerCase())
        }
        if (typeof entry === 'string') {
          return entry.toLowerCase().includes((value as string).toLowerCase())
        }
        return false
      },
      sorter: (a, b) => {
        const { dataIndex } = el as { dataIndex: string | string[] } & unknown
        const aEntry = Array.isArray(dataIndex) ? get(a, dataIndex) : a[dataIndex]
        const bEntry = Array.isArray(dataIndex) ? get(b, dataIndex) : b[dataIndex]
        if (typeof aEntry === 'object' && !Array.isArray(aEntry) && aEntry !== null) {
          if (typeof bEntry === 'object' && !Array.isArray(bEntry) && bEntry !== null) {
            return Object.keys(aEntry).length - Object.keys(bEntry).length
          }
          return Object.keys(aEntry).length ? -1 : 1
        }
        if (Array.isArray(aEntry)) {
          if (Array.isArray(bEntry)) {
            return aEntry.length - bEntry.length
          }
          return aEntry.length ? -1 : 1
        }
        if (typeof aEntry === 'boolean') {
          if (aEntry === bEntry) {
            return 0
          }
          return aEntry ? -1 : 1
        }
        if (typeof aEntry === 'number') {
          if (typeof bEntry === 'number') {
            return aEntry - bEntry
          }
          return aEntry ? -1 : 1
        }
        if (typeof aEntry === 'string') {
          if (typeof bEntry === 'string') {
            return aEntry.localeCompare(bEntry)
          }
          return aEntry ? -1 : 1
        }
        return 0
      },
    }
  })
}

export const getEnrichedColumnsWithControls = ({
  enrichedColumns,
  navigate,
  baseprefix,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  editIcon,
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  deleteIcon,
}: {
  enrichedColumns: TableProps['columns']
  navigate: NavigateFunction
  baseprefix?: string
  editIcon?: ReactNode
  deleteIcon?: ReactNode
}): TableProps['columns'] | undefined => {
  if (!enrichedColumns) {
    return undefined
  }

  return [
    ...enrichedColumns,
    {
      title: '',
      dataIndex: 'internalDataForControls',
      key: 'controls',
      className: 'controls',
      width: 60,
      render: (value: TInternalDataForControls) => {
        return (
          // <TextAlignContainer $align="right" className="hideable">
          <TextAlignContainer $align="center">
            <Dropdown
              menu={{
                items: [
                  {
                    label: 'Edit',
                    key: 'edit',
                    // icon: editIcon || <EditOutlined size={12} />,
                    disabled: value.permissions && value.permissions.canUpdate ? !value.permissions?.canUpdate : false,
                  },
                  {
                    label: 'Delete',
                    key: 'delete',
                    // icon: deleteIcon || <DeleteOutlined size={12} />,
                    disabled: value.permissions && value.permissions.canDelete ? !value.permissions?.canDelete : false,
                  },
                ],
                onClick: ({ key, domEvent }) => {
                  domEvent.stopPropagation()
                  domEvent.preventDefault()
                  if (key === 'edit') {
                    navigate(
                      `${baseprefix}/${value.cluster}${value.namespace ? `/${value.namespace}` : ''}${
                        value.syntheticProject ? `/${value.syntheticProject}` : ''
                      }/${value.pathPrefix}/${value.apiGroupAndVersion}/${value.typeName}/${value.entryName}?backlink=${
                        value.backlink
                      }`,
                    )
                  }
                  if (key === 'delete') {
                    value.onDeleteHandle(
                      value.entryName,
                      `${value.deletePathPrefix}/${value.apiGroupAndVersion}${
                        value.namespace ? `/namespaces/${value.namespace}` : ''
                      }/${value.typeName}/${value.entryName}`,
                    )
                  }
                },
              }}
              trigger={['click']}
              placement="bottomRight"
            >
              <TinyButton
                type="text"
                size="large"
                onClick={e => {
                  e.stopPropagation()
                  e.preventDefault()
                }}
                icon={<MoreOutlined size={16} />}
              />
            </Dropdown>
            {/* <TinyButton
              type="text"
              size="small"
              onClick={e => {
                e.stopPropagation()
                navigate(
                  `${baseprefix}/${value.cluster}${value.namespace ? `/${value.namespace}` : ''}${
                    value.syntheticProject ? `/${value.syntheticProject}` : ''
                  }/${value.pathPrefix}/${value.apiGroupAndVersion}/${value.typeName}/${value.entryName}?backlink=${
                    value.backlink
                  }`,
                )
              }}
              icon={editIcon || <EditOutlined size={14} />}
              disabled={value.permissions && value.permissions.canUpdate ? !value.permissions?.canUpdate : false}
            />
            <TinyButton
              type="text"
              size="small"
              onClick={e => {
                e.stopPropagation()
                value.onDeleteHandle(
                  value.entryName,
                  `${value.deletePathPrefix}/${value.apiGroupAndVersion}${
                    value.namespace ? `/namespaces/${value.namespace}` : ''
                  }/${value.typeName}/${value.entryName}`,
                )
              }}
              icon={deleteIcon || <DeleteOutlined size={14} />}
              disabled={value.permissions && value.permissions.canDelete ? !value.permissions?.canDelete : false}
            /> */}
          </TextAlignContainer>
        )
      },
    },
  ]
}
