/* eslint-disable no-restricted-syntax */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { groupsToTreeData, getBuiltinTreeData, type TGroupsToTreeDataProps } from './groupsToTreeData'

/**
 * Helpers to walk the antd-like DataNode tree.
 * We treat DataNode as a plain object in tests.
 */
type AnyNode = {
  title: any
  key: string
  children?: AnyNode[]
  isLeaf?: boolean
}

const findNodeByKey = (nodes: AnyNode[], key: string): AnyNode | undefined => {
  for (const n of nodes) {
    if (n.key === key) return n
    const child = n.children ? findNodeByKey(n.children, key) : undefined
    if (child) return child
  }
  return undefined
}

const findLeafByApi = (nodes: AnyNode[], api: string): AnyNode | undefined => findNodeByKey(nodes, api)

describe('groupsToTreeData', () => {
  test('returns empty array when given no valid apis', () => {
    const entries: TGroupsToTreeDataProps = [
      { apis: [], highlightString: '' },
      { apis: ['invalid'], highlightString: 'invalid' }, // no dot => skipped
      { apis: ['also/invalid/no-domain'], highlightString: 'also/invalid/no-domain' },
    ]

    const tree = groupsToTreeData(entries)
    expect(tree).toEqual([])
  })

  test('builds domain tree with root domain and reversed subdomain nesting', () => {
    const api = 'bar.baz.acid.zalan.do/v1'

    const entries: TGroupsToTreeDataProps = [{ apis: [api], highlightString: 'nope' }]

    const tree = groupsToTreeData(entries) as AnyNode[]

    // root domain is last two segments
    const root = findNodeByKey(tree, 'zalan.do')
    expect(root).toBeTruthy()
    expect(root?.title).toBe('zalan.do')
    expect(root?.isLeaf).toBe(false)

    // subdomains are reversed: ['acid', 'baz', 'bar']
    const acid = findNodeByKey(tree, 'zalan.do.acid')
    const baz = findNodeByKey(tree, 'zalan.do.acid.baz')
    const bar = findNodeByKey(tree, 'zalan.do.acid.baz.bar')

    expect(acid?.title).toBe('acid')
    expect(baz?.title).toBe('baz')
    expect(bar?.title).toBe('bar')

    // leaf key equals full api string
    const leaf = findLeafByApi(tree, api)
    expect(leaf).toBeTruthy()
    expect(leaf?.isLeaf).toBe(true)
    expect(leaf?.title).toBe(api) // not highlighted
  })

  test('marks exactly matching api as highlighted with "(pref)" suffix', () => {
    const api1 = 'foo.zalan.do/v1'
    const api2 = 'bar.zalan.do/v1'

    const entries: TGroupsToTreeDataProps = [{ apis: [api1, api2], highlightString: api2 }]

    const tree = groupsToTreeData(entries) as AnyNode[]

    const leaf1 = findLeafByApi(tree, api1)
    const leaf2 = findLeafByApi(tree, api2)

    expect(leaf1?.title).toBe(api1)
    expect(leaf2?.title).toBe(`${api2} (pref)`)
  })

  test('merges multiple entry groups into the same domainTree', () => {
    const apiA = 'a.example.com/v1'
    const apiB = 'b.example.com/v2'
    const apiC = 'x.other.io/v1'

    const entries: TGroupsToTreeDataProps = [
      { apis: [apiA], highlightString: apiA },
      { apis: [apiB], highlightString: 'nope' },
      { apis: [apiC], highlightString: apiC },
    ]

    const tree = groupsToTreeData(entries) as AnyNode[]

    // Two different root domains should exist
    expect(findNodeByKey(tree, 'example.com')).toBeTruthy()
    expect(findNodeByKey(tree, 'other.io')).toBeTruthy()

    // Highlighted leaves
    expect(findLeafByApi(tree, apiA)?.title).toBe(`${apiA} (pref)`)
    expect(findLeafByApi(tree, apiB)?.title).toBe(apiB)
    expect(findLeafByApi(tree, apiC)?.title).toBe(`${apiC} (pref)`)
  })
})

describe('getBuiltinTreeData', () => {
  test('maps apis to leaf nodes with "(pref)" suffix', () => {
    const apis = ['pods/v1', 'services/v1']

    const tree = getBuiltinTreeData(apis) as AnyNode[]

    expect(tree).toHaveLength(2)
    expect(tree[0]).toEqual({
      title: 'pods/v1 (pref)',
      key: 'pods/v1',
      isLeaf: true,
    })
    expect(tree[1]).toEqual({
      title: 'services/v1 (pref)',
      key: 'services/v1',
      isLeaf: true,
    })
  })
})
