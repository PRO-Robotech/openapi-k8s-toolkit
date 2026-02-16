/* eslint-disable react/jsx-no-useless-fragment */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { render, screen, fireEvent } from '@testing-library/react'
import '@testing-library/jest-dom'

import { parseAll } from 'components/organisms/DynamicComponents/molecules/utils'
import { collectLinksWithResourcesList, prepareDataForManageableSidebar } from './utils'

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
 * Mock parseAll with predictable {key} replacement.
 */
jest.mock('components/organisms/DynamicComponents/molecules/utils', () => ({
  parseAll: jest.fn(),
}))

const parseAllMock = parseAll as jest.Mock

const simpleTemplate = (template: string, replaceValues: Record<string, string | undefined>) =>
  template.replace(/\{(\w+)\}/g, (_, k) => String(replaceValues[k] ?? ''))

const link = (key: string, label: string, linkStr?: string, children?: any[]) =>
  ({ key, label, link: linkStr, children }) as any

// eslint-disable-next-line max-lines-per-function
describe('prepareDataForManageableSidebar', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    parseAllMock.mockImplementation(({ text, replaceValues }: any) =>
      // This unit test only needs deterministic parts-of-url behavior.
      simpleTemplate(String(text), replaceValues ?? {}),
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
        menuItems: [link('cluster', 'Cluster {c}', '/clusters/{c}')],
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
    expect(item.internalMetaLink).toBeUndefined()
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
        menuItems: [link('leaf', 'Hello {name}')],
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
        menuItems: [link('docs', 'Docs', '/docs/{v}')],
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
      currentTags: ['env-{env}'],
      multiQueryData: { req0: { id: '123' } },
    })

    expect(res!.selectedKeys).toEqual(['node'])

    // ensure parseAll was used for currentTags too and gets multiQueryData
    expect(parseAllMock).toHaveBeenCalledWith({
      text: 'env-{env}',
      replaceValues,
      multiQueryData: { req0: { id: '123' } },
    })
  })

  test('creates dynamic children from resourcesList and templates child links with resourceName', () => {
    const data = [
      {
        id: 'main',
        menuItems: [
          {
            key: 'instances',
            label: 'Instances',
            resourcesList: {
              cluster: '{clusterName}',
              apiGroup: 'in-cloud.io',
              apiVersion: 'v1alpha1',
              plural: 'instances',
              namespace: '{namespace}',
              linkToResource: '/openapi-ui/{clusterName}/{namespace}/factory/instance-details/{resourceName}',
              jsonPathToName: '.metadata.name',
            },
          },
        ],
      },
    ] as any

    const replaceValues = { clusterName: 'c1', namespace: 'ns1' }

    const res = prepareDataForManageableSidebar({
      data,
      replaceValues,
      pathname: '/openapi-ui/c1/ns1/factory/instance-details/instance-a',
      idToCompare: 'main',
      resourcesListData: {
        instances: {
          items: [{ metadata: { name: 'instance-a' } }, { metadata: { name: 'instance-b' } }],
        },
      },
    })

    expect(res).toBeDefined()

    const root = res!.menuItems[0] as any
    expect(root.key).toBe('instances')
    expect(Array.isArray(root.children)).toBe(true)
    expect(root.children).toHaveLength(2)

    render(<>{root.children[0].label}</>)
    const first = screen.getByTestId('router-link')
    expect(first).toHaveAttribute('href', '/openapi-ui/c1/ns1/factory/instance-details/instance-a')
    expect(first).toHaveTextContent('instance-a')

    // matched branch should include parent + generated child key
    expect(res!.selectedKeys[0]).toBe('instances')
    expect(res!.selectedKeys[1]).toContain('instances-instance-a')
  })

  test('skips resourcesList child when jsonPathToName does not resolve', () => {
    const data = [
      {
        id: 'main',
        menuItems: [
          {
            key: 'instances',
            label: 'Instances',
            resourcesList: {
              cluster: '{clusterName}',
              apiGroup: 'in-cloud.io',
              apiVersion: 'v1alpha1',
              plural: 'instances',
              namespace: '{namespace}',
              linkToResource: '/openapi-ui/{clusterName}/{namespace}/factory/instance-details/{resourceName}',
              jsonPathToName: '.metadata.name',
            },
          },
        ],
      },
    ] as any

    const res = prepareDataForManageableSidebar({
      data,
      replaceValues: { clusterName: 'c1', namespace: 'ns1' },
      pathname: '/x',
      idToCompare: 'main',
      resourcesListData: {
        instances: {
          items: [{ metadata: {} }],
        },
      },
    })

    const root = res!.menuItems[0] as any
    expect(root.children).toBeUndefined()
  })
})

describe('collectLinksWithResourcesList', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    parseAllMock.mockImplementation(({ text, replaceValues }: any) => simpleTemplate(String(text), replaceValues ?? {}))
  })

  test('collects resourcesList entries from nested menu items and builds nodePath', () => {
    const items = [
      {
        key: 'root',
        label: 'Root',
        children: [
          {
            key: 'instances',
            label: 'Instances',
            resourcesList: {
              cluster: '{clusterName}',
              apiGroup: 'in-cloud.io',
              apiVersion: 'v1alpha1',
              plural: 'instances',
              namespace: '{namespace}',
              linkToResource: '/openapi-ui/{clusterName}/{namespace}/factory/instance-details/{resourceName}',
              jsonPathToName: '.metadata.name',
            },
          },
        ],
      },
    ] as any

    const result = collectLinksWithResourcesList({
      items,
      replaceValues: { clusterName: 'c1', namespace: 'ns1' },
      multiQueryData: {},
      isEnabled: true,
    })

    expect(result).toEqual([
      {
        nodePath: 'root/instances',
        k8sParams: {
          cluster: 'c1',
          apiGroup: 'in-cloud.io',
          apiVersion: 'v1alpha1',
          plural: 'instances',
          namespace: 'ns1',
          isEnabled: true,
        },
      },
    ])
  })

  test('marks query as disabled when required templated fields are empty', () => {
    const items = [
      {
        key: 'instances',
        label: 'Instances',
        resourcesList: {
          cluster: '{clusterName}',
          apiVersion: 'v1alpha1',
          plural: 'instances',
          linkToResource: '/x/{resourceName}',
          jsonPathToName: '.metadata.name',
        },
      },
    ] as any

    const result = collectLinksWithResourcesList({
      items,
      replaceValues: { clusterName: undefined },
      multiQueryData: {},
      isEnabled: true,
    })

    expect(result).toHaveLength(1)
    expect(result[0].k8sParams.isEnabled).toBe(false)
    expect(result[0].k8sParams.cluster).toBe('')
  })
})
