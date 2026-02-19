/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/no-explicit-any */
/**
 * Tests for:
 * - getCellRender
 * - getEnrichedColumns
 * - getEnrichedColumnsWithControls
 *
 */

import React from 'react'
import { render } from '@testing-library/react'
import '@testing-library/jest-dom'

import { parseValueWithUnit, toBytes } from 'utils/converterBytes'
import { parseCoresWithUnit, toCores } from 'utils/converterCores'

import { getCellRender, getEnrichedColumns, getEnrichedColumnsWithControls } from './utils'

/* ----------------------------- mocks ----------------------------- */

// antd Dropdown mock that lets us capture the last menu prop
const DropdownMock = jest.fn(({ menu, children }: any) => {
  ;(DropdownMock as any)._lastMenu = menu
  return <div data-testid="dropdown">{children}</div>
})

jest.mock('antd', () => ({
  Dropdown: (props: any) => DropdownMock(props),
  Flex: ({ children }: any) => <div data-testid="flex">{children}</div>,
  Tooltip: ({ title, children }: any) => (
    <span data-testid="tooltip" data-title={String(title)}>
      {children}
    </span>
  ),
}))

jest.mock('@ant-design/icons', () => ({
  CheckOutlined: (props: any) => <span data-testid="check-icon" {...props} />,
  CloseOutlined: (props: any) => <span data-testid="close-icon" {...props} />,
  SearchOutlined: (props: any) => <span data-testid="search-icon" {...props} />,
  MoreOutlined: (props: any) => <span data-testid="more-icon" {...props} />,
  QuestionCircleOutlined: (props: any) => <span data-testid="question-circle-icon" {...props} />,
}))

jest.mock('../../molecules', () => ({
  TableFactory: ({ theme }: any) => <div data-testid="table-factory">{theme}</div>,
}))

jest.mock('./atoms', () => ({
  ShortenedTextWithTooltip: ({ text }: any) => <span data-testid="short">{String(text)}</span>,
  FilterDropdown: () => <div data-testid="filter-dd" />,
  TrimmedTags: ({ tags }: any) => <span data-testid="tags">{JSON.stringify(tags)}</span>,
  TextAlignContainer: ({ children }: any) => <div data-testid="align">{children}</div>,
  TinyButton: ({ onClick, icon }: any) => (
    <button data-testid="tiny" type="button" onClick={onClick}>
      {icon}
    </button>
  ),
}))

jest.mock('utils/isFlatObject', () => ({
  isFlatObject: (v: any) => {
    if (!v || typeof v !== 'object' || Array.isArray(v)) return false
    return Object.values(v).every(val => val == null || ['string', 'number', 'boolean'].includes(typeof val))
  },
}))

jest.mock('utils/converterBytes', () => ({
  parseValueWithUnit: jest.fn(),
  toBytes: jest.fn(),
}))

jest.mock('utils/converterCores', () => ({
  parseCoresWithUnit: jest.fn(),
  toCores: jest.fn(),
}))

const parseValueWithUnitMock = parseValueWithUnit as jest.Mock
const toBytesMock = toBytes as jest.Mock
const parseCoresWithUnitMock = parseCoresWithUnit as jest.Mock
const toCoresMock = toCores as jest.Mock

/* ----------------------------- helpers ----------------------------- */

const mount = (el: React.ReactElement) => render(<div>{el}</div>)

const makeTd = (rowKey: string, colKey: string, text: string) => {
  const td = document.createElement('td')
  td.setAttribute('data-rowkey', rowKey)
  td.setAttribute('data-colkey', colKey)
  td.textContent = text
  document.body.appendChild(td)
  return td
}

const cleanupTds = () => {
  document.querySelectorAll('td[data-rowkey][data-colkey]').forEach(n => n.remove())
}

/* ----------------------------- tests ----------------------------- */

describe('getCellRender', () => {
  afterEach(() => {
    cleanupTds()
    jest.clearAllMocks()
  })

  test('renders TableFactory when custom type is factory', () => {
    const el = getCellRender({
      value: 'whatever' as any,
      record: { id: 1 },
      possibleCustomTypeWithProps: { type: 'factory', customProps: { x: 1 } },
      theme: 'dark',
    })

    const { getByTestId } = mount(el)
    expect(getByTestId('table-factory')).toHaveTextContent('dark')
  })

  test('renders undefined placeholder text when value undefined and possibleUndefinedValue provided', () => {
    const el = getCellRender({
      value: undefined as any,
      record: {},
      possibleUndefinedValue: 'N/A',
      possibleTrimLength: 10,
      possibleCustomTypeWithProps: { type: 'string' },
      theme: 'light',
    })

    const { getByTestId } = mount(el)
    expect(getByTestId('short')).toHaveTextContent('N/A')
  })

  test('renders boolean icons for custom boolean type', () => {
    const elTrue = getCellRender({
      value: true as any,
      record: {},
      possibleCustomTypeWithProps: { type: 'boolean' },
      theme: 'light',
    })
    const elFalse = getCellRender({
      value: false as any,
      record: {},
      possibleCustomTypeWithProps: { type: 'boolean' },
      theme: 'light',
    })

    expect(mount(elTrue).getByTestId('check-icon')).toBeInTheDocument()
    expect(mount(elFalse).getByTestId('close-icon')).toBeInTheDocument()
  })

  test('renders null as text "null" when no custom type', () => {
    const el = getCellRender({
      value: null as any,
      record: {},
      theme: 'light',
    })

    const { getByText } = mount(el)
    expect(getByText('null')).toBeInTheDocument()
  })

  test('renders array as TrimmedTags when no custom type', () => {
    const el = getCellRender({
      value: ['a', 'b'] as any,
      record: {},
      possibleTrimLength: 20,
      theme: 'light',
    })

    const { getByTestId } = mount(el)
    expect(getByTestId('tags')).toHaveTextContent(JSON.stringify(['a', 'b']))
  })
})

describe('getEnrichedColumns', () => {
  afterEach(() => {
    cleanupTds()
    jest.clearAllMocks()
  })

  test('returns undefined when columns is undefined', () => {
    const res = getEnrichedColumns({
      columns: undefined as any,
      theme: 'light',
      getRowKey: r => r.id,
    })
    expect(res).toBeUndefined()
  })

  test('applies width, render, onCell and disables sorter when configured', () => {
    const columns = [
      { title: 'Name', key: 'name', dataIndex: 'name' },
      { title: 'Disabled', key: 'disabled', dataIndex: 'disabled' },
    ] as any

    const res = getEnrichedColumns({
      columns,
      additionalPrinterColumnsColWidths: [{ key: 'name', value: '123' }],
      additionalPrinterColumnsCustomSortersAndFilters: [{ key: 'disabled', type: 'disabled' }],
      theme: 'dark',
      getRowKey: r => r.id,
    }) as any[]

    expect(res).toHaveLength(2)
    expect(res[0].width).toBe('123')
    expect(res[0].showSorterTooltip).toBe(false)
    expect(res[1].showSorterTooltip).toBe(false)
    expect(typeof res[0].render).toBe('function')
    expect(typeof res[0].onCell).toBe('function')
    expect(res[1].sorter).toBe(false)

    const onCellAttrs = res[0].onCell({ id: 'r1' })
    expect(onCellAttrs['data-rowkey']).toBe('r1')
    expect(String(onCellAttrs['data-colkey'])).toContain('name')
  })

  test('shows question icon with tooltip near title when additionalPrinterColumnsTooltips is configured', () => {
    const columns = [{ title: 'Name', key: 'name', dataIndex: 'name' }] as any

    const res = getEnrichedColumns({
      columns,
      additionalPrinterColumnsTooltips: [{ key: 'name', value: 'Column description' }],
      theme: 'light',
      getRowKey: r => r.id,
    }) as any[]

    // eslint-disable-next-line react/jsx-no-useless-fragment
    const { getByTestId } = mount(<>{res[0].title}</>)
    expect(getByTestId('tooltip')).toHaveAttribute('data-title', 'Column description')
    expect(getByTestId('question-circle-icon')).toBeInTheDocument()
  })

  test('filterDropdown/filterIcon return null for memory/cpu/disabled', () => {
    const columns = [
      { title: 'Mem', key: 'mem', dataIndex: 'mem' },
      { title: 'CPU', key: 'cpu', dataIndex: 'cpu' },
      { title: 'Off', key: 'off', dataIndex: 'off' },
    ] as any

    const res = getEnrichedColumns({
      columns,
      additionalPrinterColumnsCustomSortersAndFilters: [
        { key: 'mem', type: 'memory' },
        { key: 'cpu', type: 'cpu' },
        { key: 'off', type: 'disabled' },
      ],
      theme: 'light',
      getRowKey: r => r.id,
    }) as any[]

    const dummyFilterArgs = {
      setSelectedKeys: jest.fn(),
      selectedKeys: [],
      confirm: jest.fn(),
      clearFilters: jest.fn(),
      close: jest.fn(),
    }

    expect(res[0].filterDropdown(dummyFilterArgs)).toBeNull()
    expect(res[1].filterDropdown(dummyFilterArgs)).toBeNull()
    expect(res[2].filterDropdown(dummyFilterArgs)).toBeNull()

    expect(res[0].filterIcon(false)).toBeNull()
    expect(res[1].filterIcon(false)).toBeNull()
    expect(res[2].filterIcon(false)).toBeNull()
  })

  test('factory search: onFilter uses DOM cell text', () => {
    const columns = [{ title: 'Factory', key: 'name', dataIndex: 'name' }] as any

    const res = getEnrichedColumns({
      columns,
      additionalPrinterColumnsKeyTypeProps: {
        name: { type: 'factory' },
      } as any,
      theme: 'light',
      getRowKey: r => r.id,
    }) as any[]

    const record = { id: 'row-1', name: 'irrelevant' }
    makeTd('row-1', 'name', 'FooBar Baz')

    expect(res[0].onFilter('foo', record)).toBe(true)
    expect(res[0].onFilter('qux', record)).toBe(false)
  })

  test('factory search: sorter compares DOM cell text', () => {
    const columns = [{ title: 'Factory', key: 'name', dataIndex: 'name' }] as any

    const res = getEnrichedColumns({
      columns,
      additionalPrinterColumnsKeyTypeProps: {
        name: { type: 'factory' },
      } as any,
      theme: 'light',
      getRowKey: r => r.id,
    }) as any[]

    const a = { id: 'a' }
    const b = { id: 'b' }

    makeTd('a', 'name', 'alpha')
    makeTd('b', 'name', 'beta')

    const cmp = res[0].sorter(a, b)
    expect(cmp).toBeLessThan(0)
  })

  test('factory search: falls back to record value when cell is not in DOM', () => {
    const columns = [{ title: 'Factory', key: 'name', dataIndex: 'name' }] as any

    const res = getEnrichedColumns({
      columns,
      additionalPrinterColumnsKeyTypeProps: {
        name: { type: 'factory' },
      } as any,
      theme: 'light',
      getRowKey: r => r.id,
    }) as any[]

    const a = { id: 'a', name: 'alpha' }
    const b = { id: 'b', name: 'beta' }

    expect(res[0].onFilter('alp', a)).toBe(true)
    expect(res[0].onFilter('zzz', a)).toBe(false)
    expect(res[0].sorter(a, b)).toBeLessThan(0)
  })

  test('memory sorter uses parseValueWithUnit + toBytes and compares safely', () => {
    const columns = [{ title: 'Mem', key: 'mem', dataIndex: 'mem' }] as any

    parseValueWithUnitMock.mockImplementation((text: string) => {
      if (text.includes('782')) return { value: 782, unit: 'mb' }
      if (text.includes('1 gb')) return { value: 1, unit: 'gb' }
      return null
    })
    toBytesMock.mockImplementation((value: number, unit: string) => {
      if (unit === 'mb') return value * 1000
      if (unit === 'gb') return value * 1000 * 1000
      return value
    })

    const res = getEnrichedColumns({
      columns,
      additionalPrinterColumnsCustomSortersAndFilters: [{ key: 'mem', type: 'memory' }],
      theme: 'light',
      getRowKey: r => r.id,
    }) as any[]

    const a = { id: 'a' }
    const b = { id: 'b' }

    makeTd('a', 'mem', '782 MB')
    makeTd('b', 'mem', '1 GB')

    const cmp = res[0].sorter(a, b)
    expect(cmp).toBeLessThan(0)
    expect(parseValueWithUnitMock).toHaveBeenCalled()
    expect(toBytesMock).toHaveBeenCalled()
  })

  test('cpu sorter uses parseCoresWithUnit + toCores and compares safely', () => {
    const columns = [{ title: 'CPU', key: 'cpu', dataIndex: 'cpu' }] as any

    parseCoresWithUnitMock.mockImplementation((text: string) => {
      if (text.includes('500')) return { value: 500, unit: 'm' }
      if (text.includes('1 core')) return { value: 1, unit: 'core' }
      return null
    })
    toCoresMock.mockImplementation((value: number, unit: string) => {
      if (unit === 'm') return value / 1000
      if (unit === 'core') return value
      return value
    })

    const res = getEnrichedColumns({
      columns,
      additionalPrinterColumnsCustomSortersAndFilters: [{ key: 'cpu', type: 'cpu' }],
      theme: 'light',
      getRowKey: r => r.id,
    }) as any[]

    const a = { id: 'a' }
    const b = { id: 'b' }

    makeTd('a', 'cpu', '500 mcore')
    makeTd('b', 'cpu', '1 core')

    const cmp = res[0].sorter(a, b)
    expect(cmp).toBeLessThan(0)
    expect(parseCoresWithUnitMock).toHaveBeenCalled()
    expect(toCoresMock).toHaveBeenCalled()
  })
})

describe('getEnrichedColumnsWithControls', () => {
  afterEach(() => {
    cleanupTds()
    jest.clearAllMocks()
  })

  test('returns undefined if enrichedColumns is undefined', () => {
    const res = getEnrichedColumnsWithControls({
      enrichedColumns: undefined as any,
      navigate: jest.fn(),
    })
    expect(res).toBeUndefined()
  })

  test('adds controls column', () => {
    const base = [{ title: 'Name', key: 'name', dataIndex: 'name' }] as any

    const res = getEnrichedColumnsWithControls({
      enrichedColumns: base,
      navigate: jest.fn(),
      baseprefix: '/base',
    }) as any[]

    expect(res).toHaveLength(2)
    expect(res[1].key).toBe('controls')
    expect(typeof res[1].render).toBe('function')
  })

  test('controls menu edit calls navigate with expected path', () => {
    const base = [{ title: 'Name', key: 'name', dataIndex: 'name' }] as any
    const navigate = jest.fn()
    const onDeleteHandle = jest.fn()

    const res = getEnrichedColumnsWithControls({
      enrichedColumns: base,
      navigate,
      baseprefix: '/base',
    }) as any[]

    const controlsCol = res[1]

    const value = {
      cluster: 'c1',
      namespace: 'ns1',
      syntheticProject: 'sp1',
      pathPrefix: 'pp',
      apiGroupAndVersion: 'apps/v1',
      plural: 'deployments',
      name: 'my-dep',
      backlink: 'back-here',
      deletePathPrefix: '/delete',
      onDeleteHandle,
      permissions: { canUpdate: true, canDelete: true },
    }

    // Render the controls cell to invoke Dropdown mock and capture menu
    render(<div>{controlsCol.render(value)}</div>)

    const menu = (DropdownMock as any)._lastMenu
    expect(menu).toBeTruthy()
    expect(Array.isArray(menu.items)).toBe(true)

    const domEvent = { stopPropagation: jest.fn(), preventDefault: jest.fn() }

    menu.onClick({ key: 'edit', domEvent })

    expect(domEvent.stopPropagation).toHaveBeenCalled()
    expect(domEvent.preventDefault).toHaveBeenCalled()

    expect(navigate).toHaveBeenCalledWith(
      `/base/${value.cluster}/${value.namespace}/${value.syntheticProject}/${value.pathPrefix}/${value.apiGroupAndVersion}/${value.plural}/${value.name}?backlink=${value.backlink}`,
    )
  })

  test('controls menu delete calls onDeleteHandle with expected params', () => {
    const base = [{ title: 'Name', key: 'name', dataIndex: 'name' }] as any
    const navigate = jest.fn()
    const onDeleteHandle = jest.fn()

    const res = getEnrichedColumnsWithControls({
      enrichedColumns: base,
      navigate,
      baseprefix: '/base',
    }) as any[]

    const controlsCol = res[1]

    const value = {
      cluster: 'c1',
      namespace: 'ns1',
      syntheticProject: undefined,
      pathPrefix: 'pp',
      apiGroupAndVersion: 'apps/v1',
      plural: 'deployments',
      name: 'my-dep',
      backlink: 'back-here',
      deletePathPrefix: '/delete',
      onDeleteHandle,
      permissions: { canUpdate: true, canDelete: true },
    }

    render(<div>{controlsCol.render(value)}</div>)

    const menu = (DropdownMock as any)._lastMenu
    const domEvent = { stopPropagation: jest.fn(), preventDefault: jest.fn() }

    menu.onClick({ key: 'delete', domEvent })

    expect(onDeleteHandle).toHaveBeenCalledWith(
      value.name,
      `/delete/${value.apiGroupAndVersion}/namespaces/${value.namespace}/${value.plural}/${value.name}`,
    )
    expect(navigate).not.toHaveBeenCalled()
  })
})
