/* eslint-disable react/jsx-no-useless-fragment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

import { prepareTemplate } from 'utils/prepareTemplate'
import { prepareDataForManageableBreadcrumbs } from './utils'

/**
 * Mock Link to render a simple <a> so we can assert href/text easily.
 */
jest.mock('react-router-dom', () => ({
  Link: ({ to, children }: any) => <a href={to}>{children}</a>,
}))

/**
 * Mock prepareTemplate with a tiny, predictable templating behavior:
 * replaces {{key}} with replaceValues[key] (or empty string).
 */
jest.mock('utils/prepareTemplate', () => ({
  prepareTemplate: jest.fn(),
}))

const prepareTemplateMock = prepareTemplate as jest.Mock

const simpleTemplate = (template: string, replaceValues: Record<string, string | undefined>) =>
  template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(replaceValues[k] ?? ''))

describe('prepareDataForManageableBreadcrumbs', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    prepareTemplateMock.mockImplementation(({ template, replaceValues }: any) =>
      simpleTemplate(String(template), replaceValues ?? {}),
    )
  })

  test('returns undefined when matching id is not found', () => {
    const data = [{ id: 'a', breadcrumbItems: [] }, undefined, { id: 'b', breadcrumbItems: [] }] as any

    const res = prepareDataForManageableBreadcrumbs({
      data,
      replaceValues: { name: 'X' },
      pathname: '/whatever',
      idToCompare: 'c',
    })

    expect(res).toBeUndefined()
  })

  test('maps breadcrumb items with Link when link is provided', () => {
    const data = [
      {
        id: 'target',
        breadcrumbItems: [{ key: 'k1', label: 'Cluster {{cluster}}', link: '/clusters/{{cluster}}' }],
      },
    ] as any

    const replaceValues = { cluster: 'c-1' }

    const res = prepareDataForManageableBreadcrumbs({
      data,
      replaceValues,
      pathname: '/x',
      idToCompare: 'target',
    })

    expect(res).toBeDefined()
    expect(res!.breadcrumbItems).toHaveLength(1)

    const item = res!.breadcrumbItems[0] as any

    expect(item.key).toBe('k1')
    expect(React.isValidElement(item.title)).toBe(true)

    // Render the title to assert final DOM output.
    render(<>{item.title}</>)

    expect(screen.getByRole('link')).toHaveAttribute('href', '/clusters/c-1')
    expect(screen.getByRole('link')).toHaveTextContent('Cluster c-1')

    // prepareTemplate called for link + label
    expect(prepareTemplateMock).toHaveBeenCalledTimes(2)
    expect(prepareTemplateMock).toHaveBeenCalledWith({
      template: '/clusters/{{cluster}}',
      replaceValues,
    })
    expect(prepareTemplateMock).toHaveBeenCalledWith({
      template: 'Cluster {{cluster}}',
      replaceValues,
    })
  })

  test('maps breadcrumb items without Link when link is missing', () => {
    const data = [
      {
        id: 'target',
        breadcrumbItems: [
          { key: 'k1', label: 'Hello {{name}}' }, // no link
        ],
      },
    ] as any

    const replaceValues = { name: 'Alice' }

    const res = prepareDataForManageableBreadcrumbs({
      data,
      replaceValues,
      pathname: '/x',
      idToCompare: 'target',
    })

    expect(res).toBeDefined()
    expect(res!.breadcrumbItems).toHaveLength(1)

    const item = res!.breadcrumbItems[0] as any

    expect(item.key).toBe('k1')
    expect(typeof item.title).toBe('string')
    expect(item.title).toBe('Hello Alice')

    // prepareTemplate called only for label
    expect(prepareTemplateMock).toHaveBeenCalledTimes(1)
    expect(prepareTemplateMock).toHaveBeenCalledWith({
      template: 'Hello {{name}}',
      replaceValues,
    })
  })

  test('handles multiple breadcrumb items and preserves order', () => {
    const data = [
      {
        id: 'target',
        breadcrumbItems: [
          { key: 'home', label: 'Home', link: '/' },
          { key: 'cluster', label: 'Cluster {{cluster}}', link: '/clusters/{{cluster}}' },
          { key: 'leaf', label: 'Page {{page}}' }, // terminal without link
        ],
      },
    ] as any

    const replaceValues = { cluster: 'c1', page: 'p9' }

    const res = prepareDataForManageableBreadcrumbs({
      data,
      replaceValues,
      pathname: '/clusters/c1/p9',
      idToCompare: 'target',
    })

    expect(res).toBeDefined()
    expect(res!.breadcrumbItems).toHaveLength(3)

    const [i0, i1, i2] = res!.breadcrumbItems as any[]

    // Render link titles to check href/text
    render(
      <>
        {i0.title}
        {i1.title}
        <span data-testid="leaf">{i2.title}</span>
      </>,
    )

    const links = screen.getAllByRole('link')
    expect(links[0]).toHaveAttribute('href', '/')
    expect(links[0]).toHaveTextContent('Home')

    expect(links[1]).toHaveAttribute('href', '/clusters/c1')
    expect(links[1]).toHaveTextContent('Cluster c1')

    expect(screen.getByTestId('leaf')).toHaveTextContent('Page p9')
  })
})
