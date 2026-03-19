import React from 'react'
import { render, screen } from '@testing-library/react'
import { AntdResult } from './AntdResult'
import { useMultiQuery } from '../../../DynamicRendererWithProviders/providers/hybridDataProvider'
import { usePartsOfUrl } from '../../../DynamicRendererWithProviders/providers/partsOfUrlContext'

jest.mock('../../../DynamicRendererWithProviders/providers/hybridDataProvider', () => ({
  useMultiQuery: jest.fn(),
}))

jest.mock('../../../DynamicRendererWithProviders/providers/partsOfUrlContext', () => ({
  usePartsOfUrl: jest.fn(),
}))

const mockUseMultiQuery = useMultiQuery as unknown as jest.Mock
const mockUsePartsOfUrl = usePartsOfUrl as unknown as jest.Mock

const defaultPartsOfUrl = { partsOfUrl: ['openapi-ui', 'default', 'practice'] }

beforeEach(() => {
  jest.clearAllMocks()
  mockUsePartsOfUrl.mockReturnValue(defaultPartsOfUrl)
})

// ── Loading state ──────────────────────────────────────────────

describe('loading state', () => {
  it('renders nothing while loading', () => {
    mockUseMultiQuery.mockReturnValue({ data: {}, isLoading: true, isError: false, errors: [] })

    const { container } = render(
      <AntdResult data={{ id: 'test', reqIndex: 0 }}>
        <div data-testid="child" />
      </AntdResult>,
    )

    expect(container.innerHTML).toBe('')
    expect(screen.queryByTestId('child')).not.toBeInTheDocument()
  })
})

// ── Manual mode (no reqIndex) ──────────────────────────────────

describe('manual mode (no reqIndex)', () => {
  it('renders Result with static status, title, subTitle', () => {
    mockUseMultiQuery.mockReturnValue({ data: {}, isLoading: false, isError: false, errors: [] })

    render(<AntdResult data={{ id: 'manual', status: '403', title: 'Access Denied', subTitle: 'No permission' }} />)

    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.getByText('No permission')).toBeInTheDocument()
  })

  it('renders children inside Result in manual mode', () => {
    mockUseMultiQuery.mockReturnValue({ data: {}, isLoading: false, isError: false, errors: [] })

    render(
      <AntdResult data={{ id: 'manual-children', status: 'info', title: 'Info' }}>
        <div data-testid="manual-child">Extra content</div>
      </AntdResult>,
    )

    expect(screen.getByText('Info')).toBeInTheDocument()
    expect(screen.getByTestId('manual-child')).toBeInTheDocument()
  })

  it('supports template syntax in title and subTitle', () => {
    mockUseMultiQuery.mockReturnValue({
      data: { req0: { metadata: { name: 'my-pod' } } },
      isLoading: false,
      isError: false,
      errors: [],
    })

    render(
      <AntdResult
        data={{
          id: 'templates',
          status: 'warning',
          title: 'Namespace: {2}',
          subTitle: 'Cluster: {1}',
        }}
      />,
    )

    expect(screen.getByText('Namespace: practice')).toBeInTheDocument()
    expect(screen.getByText('Cluster: default')).toBeInTheDocument()
  })
})

// ── Auto-detect mode (reqIndex provided) ───────────────────────

describe('auto-detect mode (reqIndex)', () => {
  it('renders children when request succeeded and data has items', () => {
    mockUseMultiQuery.mockReturnValue({
      data: { req0: { items: [{ metadata: { name: 'nginx' } }] } },
      isLoading: false,
      isError: false,
      errors: [null],
    })

    render(
      <AntdResult data={{ id: 'ok', reqIndex: 0 }}>
        <div data-testid="page-content">Pod details here</div>
      </AntdResult>,
    )

    expect(screen.getByTestId('page-content')).toBeInTheDocument()
  })

  it('renders null when no error, has items, and no children', () => {
    mockUseMultiQuery.mockReturnValue({
      data: { req0: { items: [{ metadata: { name: 'nginx' } }] } },
      isLoading: false,
      isError: false,
      errors: [null],
    })

    const { container } = render(<AntdResult data={{ id: 'no-children', reqIndex: 0 }} />)

    expect(container.innerHTML).toBe('')
  })

  it('renders error Result when HTTP error exists', () => {
    mockUseMultiQuery.mockReturnValue({
      data: {},
      isLoading: false,
      isError: true,
      errors: [Object.assign(new Error('Request failed'), { response: { status: 403, statusText: 'Forbidden' } })],
    })

    render(
      <AntdResult data={{ id: 'http-error', reqIndex: 0 }}>
        <div data-testid="should-not-render" />
      </AntdResult>,
    )

    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.getByText('Forbidden')).toBeInTheDocument()
    expect(screen.queryByTestId('should-not-render')).not.toBeInTheDocument()
  })

  it('uses error message when statusText is empty', () => {
    mockUseMultiQuery.mockReturnValue({
      data: {},
      isLoading: false,
      isError: true,
      errors: [Object.assign(new Error('Internal Server Error'), { response: { status: 500 } })],
    })

    render(<AntdResult data={{ id: 'error-msg', reqIndex: 0 }} />)

    // Ant Design's 500 SVG also has a <title>Server Error</title>, so multiple matches
    expect(screen.getAllByText('Server Error').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Internal Server Error')).toBeInTheDocument()
  })

  it('allows YAML to override status and title on HTTP error', () => {
    mockUseMultiQuery.mockReturnValue({
      data: {},
      isLoading: false,
      isError: true,
      errors: [{ response: { status: 403 }, message: 'Forbidden' }],
    })

    render(<AntdResult data={{ id: 'override', reqIndex: 0, status: 'warning', title: 'Custom Title' }} />)

    expect(screen.getByText('Custom Title')).toBeInTheDocument()
  })
})

// ── checkEmpty (default: true) ────────────────────────────────

describe('checkEmpty (default: true)', () => {
  it('renders 404 Result when items is empty (default behavior)', () => {
    mockUseMultiQuery.mockReturnValue({
      data: { req0: { items: [] } },
      isLoading: false,
      isError: false,
      errors: [null],
    })

    render(
      <AntdResult data={{ id: 'empty-default', reqIndex: 0 }}>
        <div data-testid="should-not-render" />
      </AntdResult>,
    )

    expect(screen.getByText('Not Found')).toBeInTheDocument()
    expect(screen.getByText('The requested resource was not found')).toBeInTheDocument()
    expect(screen.queryByTestId('should-not-render')).not.toBeInTheDocument()
  })

  it('renders 404 Result when checkEmpty is explicitly true', () => {
    mockUseMultiQuery.mockReturnValue({
      data: { req0: { items: [] } },
      isLoading: false,
      isError: false,
      errors: [null],
    })

    render(
      <AntdResult data={{ id: 'empty-explicit', reqIndex: 0, checkEmpty: true }}>
        <div data-testid="should-not-render" />
      </AntdResult>,
    )

    expect(screen.getByText('Not Found')).toBeInTheDocument()
    expect(screen.queryByTestId('should-not-render')).not.toBeInTheDocument()
  })

  it('renders children when items is empty but checkEmpty is false', () => {
    mockUseMultiQuery.mockReturnValue({
      data: { req0: { items: [] } },
      isLoading: false,
      isError: false,
      errors: [null],
    })

    render(
      <AntdResult data={{ id: 'no-check', reqIndex: 0, checkEmpty: false }}>
        <div data-testid="page-content">Should render</div>
      </AntdResult>,
    )

    expect(screen.getByTestId('page-content')).toBeInTheDocument()
  })

  it('renders children when items has data', () => {
    mockUseMultiQuery.mockReturnValue({
      data: { req0: { items: [{ metadata: { name: 'nginx' } }] } },
      isLoading: false,
      isError: false,
      errors: [null],
    })

    render(
      <AntdResult data={{ id: 'has-data', reqIndex: 0 }}>
        <div data-testid="page-content">Pod exists</div>
      </AntdResult>,
    )

    expect(screen.getByTestId('page-content')).toBeInTheDocument()
  })

  it('allows YAML to override status and title on empty list', () => {
    mockUseMultiQuery.mockReturnValue({
      data: { req0: { items: [] } },
      isLoading: false,
      isError: false,
      errors: [null],
    })
    mockUsePartsOfUrl.mockReturnValue({ partsOfUrl: ['nginx-missing', 'default'] })

    render(
      <AntdResult
        data={{
          id: 'custom-empty',
          reqIndex: 0,
          status: 'warning',
          title: 'Pod {0} is not found',
          subTitle: 'Namespace: {1}',
        }}
      />,
    )

    expect(screen.getByText('Pod nginx-missing is not found')).toBeInTheDocument()
    expect(screen.getByText('Namespace: default')).toBeInTheDocument()
  })

  it('prefers HTTP error over empty check when both apply', () => {
    mockUseMultiQuery.mockReturnValue({
      data: { req0: { items: [] } },
      isLoading: false,
      isError: true,
      errors: [Object.assign(new Error('Forbidden'), { response: { status: 403, statusText: 'Forbidden' } })],
    })

    render(<AntdResult data={{ id: 'error-priority', reqIndex: 0 }} />)

    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.getByText('Forbidden')).toBeInTheDocument()
  })
})

// ── Custom itemsPath ─────────────────────────────────────────

describe('custom itemsPath', () => {
  it('checks emptiness at a custom path (non-K8s API)', () => {
    mockUseMultiQuery.mockReturnValue({
      data: { req0: { data: { results: [] } } },
      isLoading: false,
      isError: false,
      errors: [null],
    })

    render(
      <AntdResult data={{ id: 'custom-path', reqIndex: 0, itemsPath: '.data.results' }}>
        <div data-testid="should-not-render" />
      </AntdResult>,
    )

    expect(screen.getByText('Not Found')).toBeInTheDocument()
    expect(screen.queryByTestId('should-not-render')).not.toBeInTheDocument()
  })

  it('renders children when custom path has data', () => {
    mockUseMultiQuery.mockReturnValue({
      data: { req0: { data: { results: [{ id: 1 }] } } },
      isLoading: false,
      isError: false,
      errors: [null],
    })

    render(
      <AntdResult data={{ id: 'custom-path-ok', reqIndex: 0, itemsPath: '.data.results' }}>
        <div data-testid="page-content">Has results</div>
      </AntdResult>,
    )

    expect(screen.getByTestId('page-content')).toBeInTheDocument()
  })

  it('renders children when custom path does not exist in response', () => {
    mockUseMultiQuery.mockReturnValue({
      data: { req0: { something: 'else' } },
      isLoading: false,
      isError: false,
      errors: [null],
    })

    render(
      <AntdResult data={{ id: 'missing-path', reqIndex: 0, itemsPath: '.data.results' }}>
        <div data-testid="page-content">Path not found in response</div>
      </AntdResult>,
    )

    expect(screen.getByTestId('page-content')).toBeInTheDocument()
  })

  it('does not check default .items when custom path is set', () => {
    mockUseMultiQuery.mockReturnValue({
      data: { req0: { items: [], data: { results: [{ id: 1 }] } } },
      isLoading: false,
      isError: false,
      errors: [null],
    })

    render(
      <AntdResult data={{ id: 'custom-ignores-default', reqIndex: 0, itemsPath: '.data.results' }}>
        <div data-testid="page-content">items is empty but we check results</div>
      </AntdResult>,
    )

    // .items is empty, but we're checking .data.results which has data → children render
    expect(screen.getByTestId('page-content')).toBeInTheDocument()
  })
})

// ── WebSocket / string errors ────────────────────────────────

describe('string errors (WebSocket path)', () => {
  it('renders 404 illustration for string error with (404) suffix', () => {
    mockUseMultiQuery.mockReturnValue({
      data: {},
      isLoading: false,
      isError: true,
      errors: ['Initial list failed (404)'],
    })

    render(<AntdResult data={{ id: 'ws-404', reqIndex: 0 }} />)

    expect(screen.getByText('Not Found')).toBeInTheDocument()
    expect(screen.getByText('Initial list failed (404)')).toBeInTheDocument()
  })

  it('renders 403 illustration for string error with (403) suffix', () => {
    mockUseMultiQuery.mockReturnValue({
      data: {},
      isLoading: false,
      isError: true,
      errors: ['Access denied (403)'],
    })

    render(<AntdResult data={{ id: 'ws-403', reqIndex: 0 }} />)

    expect(screen.getByText('Access Denied')).toBeInTheDocument()
    expect(screen.getByText('Access denied (403)')).toBeInTheDocument()
  })

  it('renders 500 illustration for string error with (500) suffix', () => {
    mockUseMultiQuery.mockReturnValue({
      data: {},
      isLoading: false,
      isError: true,
      errors: ['Server error (500)'],
    })

    render(<AntdResult data={{ id: 'ws-500', reqIndex: 0 }} />)

    expect(screen.getAllByText('Server Error').length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText('Server error (500)')).toBeInTheDocument()
  })

  it('renders generic error for string without status code', () => {
    mockUseMultiQuery.mockReturnValue({
      data: {},
      isLoading: false,
      isError: true,
      errors: ['WebSocket connection closed'],
    })

    render(<AntdResult data={{ id: 'ws-generic', reqIndex: 0 }} />)

    expect(screen.getByText('Error')).toBeInTheDocument()
    expect(screen.getByText('WebSocket connection closed')).toBeInTheDocument()
  })
})

// Edge cases for extractHttpStatus, extractErrorMessage, isEmptyAtPath
// are covered in utils.test.ts
