/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { render, screen } from '@testing-library/react'
import { ParsedText } from './ParsedText'
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

const defaultPartsOfUrl = { partsOfUrl: ['', 'openapi-ui', 'default', 'incloud-sgroups'] }

/** Build a mock return value for useMultiQuery with per-request helpers auto-derived from errors */
const mockMultiQuery = (base: {
  data: Record<string, unknown>
  isLoading: boolean
  isError: boolean
  errors: Array<unknown | null>
}) => ({
  ...base,
  hasErrorForReq: (idx: number) => Boolean(base.errors[idx]),
  getErrorForReq: (idx: number) => base.errors[idx] ?? null,
})

beforeEach(() => {
  jest.clearAllMocks()
  mockUsePartsOfUrl.mockReturnValue(defaultPartsOfUrl)
})

// ── Loading state ──────────────────────────────────────────────

describe('loading state', () => {
  it('renders "Loading..." when isLoading is true', () => {
    mockUseMultiQuery.mockReturnValue(mockMultiQuery({ data: {}, isLoading: true, isError: false, errors: [] }))

    render(<ParsedText data={{ id: 'test', text: '{reqs[0][".metadata.name"]}' }} />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })
})

// ── Happy path ─────────────────────────────────────────────────

describe('happy path', () => {
  it('renders parsed text from multiQuery data', () => {
    mockUseMultiQuery.mockReturnValue(
      mockMultiQuery({
        data: { req0: { metadata: { name: 'my-addressgroup' } } },
        isLoading: false,
        isError: false,
        errors: [null],
      }),
    )

    render(<ParsedText data={{ id: 'name', text: "{reqs[0]['metadata', 'name']}" }} />)

    expect(screen.getByText('my-addressgroup')).toBeInTheDocument()
  })

  it('renders text with partsOfUrl substitution', () => {
    mockUseMultiQuery.mockReturnValue(
      mockMultiQuery({
        data: {},
        isLoading: false,
        isError: false,
        errors: [],
      }),
    )

    render(<ParsedText data={{ id: 'ns', text: 'Namespace: {3}' }} />)

    expect(screen.getByText('Namespace: incloud-sgroups')).toBeInTheDocument()
  })

  it('applies inline style from data.style', () => {
    mockUseMultiQuery.mockReturnValue(
      mockMultiQuery({
        data: { req0: { metadata: { name: 'styled-text' } } },
        isLoading: false,
        isError: false,
        errors: [null],
      }),
    )

    const { container } = render(
      <ParsedText data={{ id: 'styled', text: "{reqs[0]['metadata', 'name']}", style: { color: 'red' } }} />,
    )

    const span = container.querySelector('span')
    expect(span).toHaveStyle({ color: 'rgb(255, 0, 0)' })
  })

  it('renders tooltip when tooltip prop is provided', async () => {
    mockUseMultiQuery.mockReturnValue(
      mockMultiQuery({
        data: { req0: { metadata: { name: 'hover-me' } } },
        isLoading: false,
        isError: false,
        errors: [null],
      }),
    )

    render(
      <ParsedText
        data={{
          id: 'with-tip',
          text: "{reqs[0]['metadata', 'name']}",
          tooltip: "Details for {reqs[0]['metadata', 'name']}",
        }}
      />,
    )

    expect(screen.getByText('hover-me')).toBeInTheDocument()
  })
})

// ── Per-request error isolation (the fix) ──────────────────────

describe('per-request error isolation', () => {
  it('renders text when reqIndex is set and its request succeeded, even if another request failed', () => {
    mockUseMultiQuery.mockReturnValue(
      mockMultiQuery({
        data: {
          req0: { metadata: { name: 'my-addressgroup' } },
          req1: undefined,
        },
        isLoading: false,
        isError: true,
        errors: [null, { message: 'Request failed with status code 404' }],
      }),
    )

    render(<ParsedText data={{ id: 'name-field', text: "{reqs[0]['metadata', 'name']}", reqIndex: '0' }} />)

    // With reqIndex=0, ParsedText checks only req0 which succeeded → renders data
    expect(screen.getByText('my-addressgroup')).toBeInTheDocument()
    expect(screen.queryByText('Errors:')).not.toBeInTheDocument()
  })

  it('renders error when reqIndex is set and its request failed', () => {
    mockUseMultiQuery.mockReturnValue(
      mockMultiQuery({
        data: {
          req0: { metadata: { name: 'my-addressgroup' } },
          req1: undefined,
        },
        isLoading: false,
        isError: true,
        errors: [null, { message: 'Request failed with status code 500' }],
      }),
    )

    render(<ParsedText data={{ id: 'metrics-field', text: "{reqs[1]['.items']}", reqIndex: '1' }} />)

    // reqIndex=1 points to the failed request → shows error
    expect(screen.getByText('Errors:')).toBeInTheDocument()
    expect(screen.getByText('Request failed with status code 500')).toBeInTheDocument()
  })

  it('shows only the specific request error, not all errors', () => {
    mockUseMultiQuery.mockReturnValue(
      mockMultiQuery({
        data: { req0: undefined, req1: undefined },
        isLoading: false,
        isError: true,
        errors: [
          { message: 'Request failed with status code 403' },
          { message: 'Request failed with status code 500' },
        ],
      }),
    )

    render(<ParsedText data={{ id: 'specific', text: "{reqs[1]['.items']}", reqIndex: '1' }} />)

    // Only req1 error shown, not req0
    expect(screen.getByText('Request failed with status code 500')).toBeInTheDocument()
    expect(screen.queryByText('Request failed with status code 403')).not.toBeInTheDocument()
  })

  it('falls back to global isError when reqIndex is not set (backward compat)', () => {
    mockUseMultiQuery.mockReturnValue(
      mockMultiQuery({
        data: {
          req0: { metadata: { name: 'my-addressgroup' } },
          req1: undefined,
        },
        isLoading: false,
        isError: true,
        errors: [null, { message: 'Request failed with status code 404' }],
      }),
    )

    render(<ParsedText data={{ id: 'no-reqindex', text: "{reqs[0]['metadata', 'name']}" }} />)

    // No reqIndex → falls back to global isError (true) → shows error block
    expect(screen.getByText('Errors:')).toBeInTheDocument()
    expect(screen.queryByText('my-addressgroup')).not.toBeInTheDocument()
  })
})
