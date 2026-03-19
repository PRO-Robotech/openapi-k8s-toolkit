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

beforeEach(() => {
  jest.clearAllMocks()
  mockUsePartsOfUrl.mockReturnValue(defaultPartsOfUrl)
})

// ── Loading state ──────────────────────────────────────────────

describe('loading state', () => {
  it('renders "Loading..." when isLoading is true', () => {
    mockUseMultiQuery.mockReturnValue({ data: {}, isLoading: true, isError: false, errors: [] })

    render(<ParsedText data={{ id: 'test', text: '{reqs[0][".metadata.name"]}' }} />)

    expect(screen.getByText('Loading...')).toBeInTheDocument()
  })
})

// ── Happy path ─────────────────────────────────────────────────

describe('happy path', () => {
  it('renders parsed text from multiQuery data', () => {
    mockUseMultiQuery.mockReturnValue({
      data: { req0: { metadata: { name: 'my-addressgroup' } } },
      isLoading: false,
      isError: false,
      errors: [null],
    })

    render(<ParsedText data={{ id: 'name', text: "{reqs[0]['metadata', 'name']}" }} />)

    expect(screen.getByText('my-addressgroup')).toBeInTheDocument()
  })

  it('renders text with partsOfUrl substitution', () => {
    mockUseMultiQuery.mockReturnValue({
      data: {},
      isLoading: false,
      isError: false,
      errors: [],
    })

    render(<ParsedText data={{ id: 'ns', text: 'Namespace: {3}' }} />)

    expect(screen.getByText('Namespace: incloud-sgroups')).toBeInTheDocument()
  })

  it('applies inline style from data.style', () => {
    mockUseMultiQuery.mockReturnValue({
      data: { req0: { metadata: { name: 'styled-text' } } },
      isLoading: false,
      isError: false,
      errors: [null],
    })

    const { container } = render(
      <ParsedText data={{ id: 'styled', text: "{reqs[0]['metadata', 'name']}", style: { color: 'red' } }} />,
    )

    const span = container.querySelector('span')
    expect(span).toHaveStyle({ color: 'rgb(255, 0, 0)' })
  })

  it('renders tooltip when tooltip prop is provided', async () => {
    mockUseMultiQuery.mockReturnValue({
      data: { req0: { metadata: { name: 'hover-me' } } },
      isLoading: false,
      isError: false,
      errors: [null],
    })

    render(
      <ParsedText
        data={{ id: 'with-tip', text: "{reqs[0]['metadata', 'name']}", tooltip: "Details for {reqs[0]['metadata', 'name']}" }}
      />,
    )

    expect(screen.getByText('hover-me')).toBeInTheDocument()
  })
})

// ── Bug proof: aggregated isError poisons unrelated molecules ──

describe('aggregated isError bug', () => {
  it('renders error block when isError=true even though errors=[null, Error] and req0 data is valid', () => {
    /**
     * This is THE BUG. ParsedText only uses req0 data, but because req1
     * failed, isError is true and ParsedText early-returns with the error
     * block instead of rendering the perfectly valid req0 data.
     */
    mockUseMultiQuery.mockReturnValue({
      data: {
        req0: { metadata: { name: 'my-addressgroup' }, spec: { defaultAction: 'DROP' } },
        req1: undefined,
      },
      isLoading: false,
      isError: true,
      errors: [null, { message: 'Request failed with status code 404' }],
    })

    render(<ParsedText data={{ id: 'name-field', text: "{reqs[0]['metadata', 'name']}" }} />)

    // BUG: instead of rendering "my-addressgroup", it renders the error block
    expect(screen.getByText('Errors:')).toBeInTheDocument()
    expect(screen.getByText('Request failed with status code 404')).toBeInTheDocument()

    // The valid data is NOT rendered — this is what we want to fix
    expect(screen.queryByText('my-addressgroup')).not.toBeInTheDocument()
  })

  it('shows ALL errors in the error block even though only one request failed', () => {
    /**
     * Even worse: the error block renders errors.map() which lists ALL
     * errors including null ones. When there are many requests, a molecule
     * that only uses req0 shows errors from req2, req3, etc.
     */
    mockUseMultiQuery.mockReturnValue({
      data: {
        req0: { metadata: { name: 'valid-resource' } },
        req1: undefined,
        req2: { items: [{ name: 'ns-1' }] },
      },
      isLoading: false,
      isError: true,
      errors: [null, { message: 'Request failed with status code 404' }, null],
    })

    render(<ParsedText data={{ id: 'name-field', text: "{reqs[0]['metadata', 'name']}" }} />)

    // BUG: error block is shown instead of the valid data
    expect(screen.getByText('Errors:')).toBeInTheDocument()
    expect(screen.queryByText('valid-resource')).not.toBeInTheDocument()
  })
})
