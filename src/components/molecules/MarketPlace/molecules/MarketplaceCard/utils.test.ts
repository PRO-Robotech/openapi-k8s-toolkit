/* eslint-disable @typescript-eslint/no-explicit-any */
import { getPathToNav, getCreatePathToNav, getListPath } from './utils'

describe('nav path helpers', () => {
  describe('getPathToNav', () => {
    test('returns direct path when type is direct and pathToNav provided', () => {
      const res = getPathToNav({
        cluster: 'c1',
        namespace: 'ns1',
        type: 'direct',
        pathToNav: '/some/direct/path',
        baseprefix: 'ui',
      })

      expect(res).toBe('/some/direct/path')
    })

    test('builds crd path', () => {
      const res = getPathToNav({
        cluster: 'c1',
        namespace: 'ns1',
        type: 'crd',
        plural: 'foos',
        apiGroup: 'example.io',
        apiVersion: 'v1alpha1',
        baseprefix: 'ui',
      })

      // apiExtensionVersion is hardcoded to v1
      expect(res).toBe('/ui/c1/ns1/crd-table/example.io/v1alpha1/v1/foos')
    })

    test('builds nonCrd path', () => {
      const res = getPathToNav({
        cluster: 'c1',
        namespace: 'ns1',
        type: 'nonCrd',
        plural: 'deployments',
        apiGroup: 'apps',
        apiVersion: 'v1',
        baseprefix: 'ui',
      })

      expect(res).toBe('/ui/c1/ns1/api-table/apps/v1/deployments')
    })

    test('falls back to builtin path for any other type', () => {
      const res = getPathToNav({
        cluster: 'c1',
        namespace: 'ns1',
        type: 'builtin',
        plural: 'pods',
        baseprefix: 'ui',
      })

      expect(res).toBe('/ui/c1/ns1/builtin-table/pods')
    })
  })

  describe('getCreatePathToNav', () => {
    const originalPathname = window.location.pathname

    beforeEach(() => {
      // Make backlink deterministic without redefining window.location
      window.history.pushState({}, '', '/current/page')
    })

    afterAll(() => {
      window.history.pushState({}, '', originalPathname)
    })

    test('returns direct path when type is direct and pathToNav provided', () => {
      const res = getCreatePathToNav({
        cluster: 'c1',
        namespace: 'ns1',
        type: 'direct',
        pathToNav: '/create/direct',
        baseprefix: 'ui',
      })

      expect(res).toBe('/create/direct')
    })

    test('builds crd create path with backlink', () => {
      const res = getCreatePathToNav({
        cluster: 'c1',
        namespace: 'ns1',
        type: 'crd',
        plural: 'foos',
        apiGroup: 'example.io',
        apiVersion: 'v1alpha1',
        baseprefix: 'ui',
      })

      expect(res).toBe('/ui/c1/ns1/forms/crds/example.io/v1alpha1/foos?backlink=/current/page')
    })

    test('builds nonCrd create path with backlink', () => {
      const res = getCreatePathToNav({
        cluster: 'c1',
        namespace: 'ns1',
        type: 'nonCrd',
        plural: 'deployments',
        apiGroup: 'apps',
        apiVersion: 'v1',
        baseprefix: 'ui',
      })

      expect(res).toBe('/ui/c1/ns1/forms/apis/apps/v1/deployments?backlink=/current/page')
    })

    test('builds builtin create path with backlink', () => {
      const res = getCreatePathToNav({
        cluster: 'c1',
        namespace: 'ns1',
        type: 'builtin',
        plural: 'pods',
        apiVersion: 'v1',
        baseprefix: 'ui',
      })

      expect(res).toBe('/ui/c1/ns1/forms/builtin/v1/pods?backlink=/current/page')
    })
  })

  describe('getListPath', () => {
    test('builds crd list path with namespace', () => {
      const res = getListPath({
        cluster: 'c1',
        namespace: 'ns1',
        type: 'crd',
        plural: 'foos',
        apiGroup: 'example.io',
        apiVersion: 'v1alpha1',
      })

      expect(res).toBe('/api/clusters/c1/k8s/apis/example.io/v1alpha1/namespaces/ns1/foos')
    })

    test('builds nonCrd list path without namespace (cluster-scope)', () => {
      const res = getListPath({
        cluster: 'c1',
        namespace: '',
        type: 'nonCrd',
        plural: 'deployments',
        apiGroup: 'apps',
        apiVersion: 'v1',
      })

      expect(res).toBe('/api/clusters/c1/k8s/apis/apps/v1/deployments')
    })

    test('builds builtin list path with namespace', () => {
      const res = getListPath({
        cluster: 'c1',
        namespace: 'ns1',
        type: 'builtin',
        plural: 'pods',
      })

      expect(res).toBe('/api/clusters/c1/k8s/api/v1/namespaces/ns1/pods')
    })

    test('builds builtin list path without namespace', () => {
      const res = getListPath({
        cluster: 'c1',
        namespace: '',
        type: 'builtin',
        plural: 'nodes',
      })

      expect(res).toBe('/api/clusters/c1/k8s/api/v1/nodes')
    })
  })
})
