import React from 'react'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import type { AnyObject } from 'antd/es/_util/type'
import { EnrichedTable } from './EnrichedTable'

const navigateMock = jest.fn()
const tableMock = jest.fn()
const tableContainerMock = jest.fn()

jest.mock('react-router-dom', () => ({
  useNavigate: () => navigateMock,
}))

jest.mock('antd', () => ({
  Table: (props: unknown) => {
    tableMock(props)
    return <div data-testid="table" />
  },
}))

jest.mock('./atoms', () => ({
  TableComponents: {
    TableContainer: ({ children, ...props }: React.PropsWithChildren<Record<string, unknown>>) => {
      tableContainerMock(props)
      return <div data-testid="table-container">{children}</div>
    },
    HideableControls: ({ children }: React.PropsWithChildren) => <div data-testid="hideable-controls">{children}</div>,
  },
}))

jest.mock('./utils', () => ({
  getEnrichedColumns: jest.fn(({ columns }) => columns),
  getEnrichedColumnsWithControls: jest.fn(({ enrichedColumns }) => enrichedColumns),
}))

describe('EnrichedTable', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const baseProps = {
    theme: 'light' as const,
    dataSource: [{ key: 'row-1', name: 'row-name' }] as AnyObject[],
    columns: [{ title: 'Name', key: 'name', dataIndex: 'name' }],
  }

  test('forwards rowClassName and enables pointer cursor with rowClickable', () => {
    const rowClassName = jest.fn(() => 'selected-row')

    render(<EnrichedTable {...baseProps} rowClassName={rowClassName} rowClickable />)

    expect(tableMock).toHaveBeenCalled()
    const tableProps = tableMock.mock.calls[0][0] as { rowClassName?: typeof rowClassName }
    expect(tableProps.rowClassName).toBe(rowClassName)

    expect(tableContainerMock).toHaveBeenCalled()
    const containerProps = tableContainerMock.mock.calls[0][0] as { $isCursorPointer?: boolean }
    expect(containerProps.$isCursorPointer).toBe(true)
  })

  test('fixes row selection column to the left when selection is enabled', () => {
    render(
      <EnrichedTable
        {...baseProps}
        selectData={{
          selectedRowKeys: ['row-1'],
          onChange: jest.fn(),
        }}
      />,
    )

    const tableProps = tableMock.mock.calls[0][0] as {
      rowSelection?: { fixed?: string; columnWidth?: number }
    }
    expect(tableProps.rowSelection?.fixed).toBe('left')
    expect(tableProps.rowSelection?.columnWidth).toBe(48)
  })

  test('merges consumer onRow click with internal navigation', () => {
    const onClick = jest.fn()

    render(
      <EnrichedTable
        {...baseProps}
        pathToNavigate="/items/~recordValue~"
        recordKeysForNavigation={['name']}
        onRow={() => ({ onClick })}
      />,
    )

    const tableProps = tableMock.mock.calls[0][0] as {
      onRow?: (record: AnyObject) => { onClick?: (event: { defaultPrevented?: boolean }) => void }
    }
    const rowProps = tableProps.onRow?.({ key: 'row-1', name: 'alpha' })
    rowProps?.onClick?.({ defaultPrevented: false })

    expect(onClick).toHaveBeenCalled()
    expect(navigateMock).toHaveBeenCalledWith('/items/alpha')
  })

  test('skips internal navigation when consumer row click prevents default', () => {
    const onClick = jest.fn(event => {
      // eslint-disable-next-line no-param-reassign
      event.defaultPrevented = true
    })

    render(
      <EnrichedTable
        {...baseProps}
        pathToNavigate="/items/~recordValue~"
        recordKeysForNavigation={['name']}
        onRow={() => ({ onClick })}
      />,
    )

    const tableProps = tableMock.mock.calls[0][0] as {
      onRow?: (record: AnyObject) => { onClick?: (event: { defaultPrevented?: boolean }) => void }
    }
    const rowProps = tableProps.onRow?.({ key: 'row-1', name: 'alpha' })
    rowProps?.onClick?.({ defaultPrevented: false })

    expect(onClick).toHaveBeenCalled()
    expect(navigateMock).not.toHaveBeenCalled()
  })
})
