/* eslint-disable react/jsx-no-useless-fragment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

import { prepareTemplate } from 'utils/prepareTemplate'
import { prepareDataForManageableSidebar } from './utils'

/**
 * Mock Link to a simple <a> so we can assert href + text.
 */
jest.mock('react-router-dom', () => ({
  Link: ({ to, children }: any) => (
    <a data-testid="router-link" href={to}>
      {children}
    </a>
  ),
}))

/**
 * Mock prepareTemplate with predictable {{key}} replacement.
 */
jest.mock('utils/prepareTemplate', () => ({
  prepareTemplate: jest.fn(),
}))

const prepareTemplateMock = prepareTemplate as jest.Mock

const simpleTemplate = (template: string, replaceValues: Record<string, string | undefined>) =>
  template.replace(/\{\{(\w+)\}\}/g, (_, k) => String(replaceValues[k] ?? ''))

const link = (key: string, label: string, linkStr?: string, children?: any[]) =>
  ({ key, label, link: linkStr, children }) as any

describe('prepareDataForManageableSidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    prepareTemplateMock.mockImplementation(({ template, replaceValues }: any) =>
      simpleTemplate(String(template), replaceValues ?? {}),
    )
  })

  test('returns undefined when no matching id and no fallback', () => {
    const data = [
      { id: 'a', menuItems: [] },
      { id: 'b', menuItems: [] },
    ] as any

    const res = prepareDataForManageableSidebar({
      data,
      replaceValues: {},
      pathname: '/x',
      idToCompare: 'missing',
    })

    expect(res).toBeUndefined()
  })

  test('uses fallbackIdToCompare when primary id not found', () => {
    const data = [
      {
        id: 'fallback',
        menuItems: [link('home', 'Home', '/')],
      },
    ] as any

    const res = prepareDataForManageableSidebar({
      data,
      replaceValues: {},
      pathname: '/',
      idToCompare: 'missing',
      fallbackIdToCompare: 'fallback',
    })

    expect(res).toBeDefined()
    expect(res!.menuItems).toHaveLength(1)
  })

  test('maps internal links to Link and stores internalMetaLink', () => {
    const data = [
      {
        id: 'main',
        menuItems: [link('cluster', 'Cluster {{c}}', '/clusters/{{c}}')],
      },
    ] as any

    const replaceValues = { c: 'c1' }

    const res = prepareDataForManageableSidebar({
      data,
      replaceValues,
      pathname: '/clusters/c1',
      idToCompare: 'main',
    })

    expect(res).toBeDefined()

    const item = res!.menuItems[0] as any
    expect(item.key).toBe('cluster')
    expect(item.internalMetaLink).toBe('/clusters/c1')
    expect(React.isValidElement(item.label)).toBe(true)

    render(<>{item.label}</>)

    const a = screen.getByTestId('router-link')
    expect(a).toHaveAttribute('href', '/clusters/c1')
    expect(a).toHaveTextContent('Cluster c1')
  })

  test('maps items without link to plain string label', () => {
    const data = [
      {
        id: 'main',
        menuItems: [link('leaf', 'Hello {{name}}')],
      },
    ] as any

    const replaceValues = { name: 'Alice' }

    const res = prepareDataForManageableSidebar({
      data,
      replaceValues,
      pathname: '/x',
      idToCompare: 'main',
    })

    const item = res!.menuItems[0] as any
    expect(item.internalMetaLink).toBeUndefined()
    expect(typeof item.label).toBe('string')
    expect(item.label).toBe('Hello Alice')
  })

  test('externalKeys: label becomes <a> that calls window.open with absolute URL for relative paths', () => {
    const openSpy = jest.spyOn(window, 'open').mockImplementation(() => null)

    const data = [
      {
        id: 'main',
        externalKeys: ['docs'],
        menuItems: [link('docs', 'Docs', '/docs/{{v}}')],
      },
    ] as any

    const replaceValues = { v: '1' }

    const res = prepareDataForManageableSidebar({
      data,
      replaceValues,
      pathname: '/x',
      idToCompare: 'main',
    })

    const item = res!.menuItems[0] as any

    render(<>{item.label}</>)

    // It's an <a> with onClick handler. We just click the text.
    fireEvent.click(screen.getByText('Docs'))

    expect(openSpy).toHaveBeenCalledTimes(1)
    const calledWith = openSpy.mock.calls[0][0] as string

    // Should be absolute because preparedLink starts with "/"
    expect(calledWith).toBe(`${window.location.origin}/docs/1`)

    openSpy.mockRestore()
  })

  test('selectedKeys includes full key path when pathname matches a nested internalMetaLink', () => {
    const data = [
      {
        id: 'main',
        menuItems: [link('root', 'Root', '/root', [link('child', 'Child', '/root/child')])],
      },
    ] as any

    const res = prepareDataForManageableSidebar({
      data,
      replaceValues: {},
      pathname: '/root/child',
      idToCompare: 'main',
    })

    // findMatchingItems returns a flattened path of keys
    expect(res!.selectedKeys).toEqual(['root', 'child'])
  })

  test('selectedKeys matches internalMetaLink with search params when provided', () => {
    const data = [
      {
        id: 'main',
        menuItems: [link('root', 'Root', '/root', [link('child', 'Child', '/root/child?tab=details')])],
      },
    ] as any

    const res = prepareDataForManageableSidebar({
      data,
      replaceValues: {},
      pathname: '/root/child',
      searchParams: '?tab=details',
      idToCompare: 'main',
    })

    expect(res!.selectedKeys).toEqual(['root', 'child'])
  })

  test('selectedKeys can be driven by tags when pathname does not match', () => {
    const data = [
      {
        id: 'main',
        keysAndTags: {
          child: ['tag-a', 'tag-b'],
        },
        menuItems: [link('root', 'Root', '/root', [link('child', 'Child', '/root/child')])],
      },
    ] as any

    const res = prepareDataForManageableSidebar({
      data,
      replaceValues: {},
      pathname: '/no-match',
      idToCompare: 'main',
      currentTags: ['tag-b'],
    })

    expect(res).toBeDefined()
    expect(res!.selectedKeys).toEqual(['root', 'child'])
  })

  test('currentTags are templated before matching', () => {
    const data = [
      {
        id: 'main',
        keysAndTags: {
          node: ['env-prod'],
        },
        menuItems: [link('node', 'Node', '/node')],
      },
    ] as any

    const replaceValues = { env: 'prod' }

    const res = prepareDataForManageableSidebar({
      data,
      replaceValues,
      pathname: '/no-match',
      idToCompare: 'main',
      currentTags: ['env-{{env}}'],
    })

    expect(res!.selectedKeys).toEqual(['node'])

    // ensure prepareTemplate was used for currentTags too
    expect(prepareTemplateMock).toHaveBeenCalledWith({
      template: 'env-{{env}}',
      replaceValues,
    })
  })
})
