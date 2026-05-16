import React from 'react'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'
import type { AnyObject } from 'antd/es/_util/type'
import { ClusterListTable } from './ClusterListTable'

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

jest.mock('../EnrichedTable', () => ({
  getEnrichedColumns: jest.fn(({ columns }) => columns),
}))

jest.mock('../EnrichedTable/atoms', () => ({
  TableComponents: {
    TableContainer: React.forwardRef<HTMLDivElement, React.PropsWithChildren<Record<string, unknown>>>((props, ref) => {
      // eslint-disable-next-line react/prop-types
      const { children, ...restProps } = props

      tableContainerMock(restProps)
      return (
        <div ref={ref} data-testid="table-container">
          {children}
        </div>
      )
    }),
    HideableControls: ({ children }: React.PropsWithChildren) => <div data-testid="hideable-controls">{children}</div>,
  },
}))

describe('ClusterListTable', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  const baseProps = {
    theme: 'light' as const,
    dataSource: [{ key: 'row-1', clusterName: 'alpha' }] as AnyObject[],
    columns: [{ title: 'Cluster', key: 'clusterName', dataIndex: 'clusterName' }],
  }

  test('forwards rowClassName and enables pointer cursor with rowClickable', () => {
    const rowClassName = jest.fn(() => 'selected-row')

    render(<ClusterListTable {...baseProps} rowClassName={rowClassName} rowClickable />)

    const tableProps = tableMock.mock.calls[0][0] as { rowClassName?: typeof rowClassName }
    expect(tableProps.rowClassName).toBe(rowClassName)

    const containerProps = tableContainerMock.mock.calls[0][0] as { $isCursorPointer?: boolean }
    expect(containerProps.$isCursorPointer).toBe(true)
  })

  test('merges consumer onRow click with internal navigation', async () => {
    const onClick = jest.fn()

    render(
      <ClusterListTable
        {...baseProps}
        pathToNavigate="/clusters/~recordValue~"
        recordKeysForNavigation={['clusterName']}
        onRow={() => ({ onClick })}
      />,
    )

    const tableProps = tableMock.mock.calls[0][0] as {
      onRow?: (record: AnyObject) => { onClick?: (event: { defaultPrevented?: boolean }) => Promise<void> }
    }
    const rowProps = tableProps.onRow?.({ key: 'row-1', clusterName: 'alpha' })
    await rowProps?.onClick?.({ defaultPrevented: false })

    expect(onClick).toHaveBeenCalled()
    expect(navigateMock).toHaveBeenCalledWith('/clusters/alpha')
  })

  test('skips internal navigation when consumer row click prevents default', async () => {
    const onClick = jest.fn(event => {
      // eslint-disable-next-line no-param-reassign
      event.defaultPrevented = true
    })

    render(
      <ClusterListTable
        {...baseProps}
        pathToNavigate="/clusters/~recordValue~"
        recordKeysForNavigation={['clusterName']}
        onRow={() => ({ onClick })}
      />,
    )

    const tableProps = tableMock.mock.calls[0][0] as {
      onRow?: (record: AnyObject) => { onClick?: (event: { defaultPrevented?: boolean }) => Promise<void> }
    }
    const rowProps = tableProps.onRow?.({ key: 'row-1', clusterName: 'alpha' })
    await rowProps?.onClick?.({ defaultPrevented: false })

    expect(onClick).toHaveBeenCalled()
    expect(navigateMock).not.toHaveBeenCalled()
  })
})
