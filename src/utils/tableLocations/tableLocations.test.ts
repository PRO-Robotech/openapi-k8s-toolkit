import { getBackLinkToTable, getLinkToBuiltinForm, getLinkToApiForm, getLinkToForm } from './tableLocations'

describe('form link builders', () => {
  describe('getBackLinkToTable', () => {
    test('encodes fullPath', () => {
      expect(getBackLinkToTable({ fullPath: '/a/b?x=1 y=2' })).toBe(encodeURIComponent('/a/b?x=1 y=2'))
    })
  })

  describe('getLinkToBuiltinForm', () => {
    test('builds minimal builtin link', () => {
      const url = getLinkToBuiltinForm({
        cluster: 'c1',
        baseprefix: '/ui',
        plural: 'pods',
        fullPath: '/ui/c1/pods',
      })
      expect(url).toBe(`/ui/c1/forms/builtin/v1/pods?backlink=${encodeURIComponent('/ui/c1/pods')}`)
    })

    test('includes inside, namespace, and syntheticProject', () => {
      const url = getLinkToBuiltinForm({
        cluster: 'c1',
        baseprefix: '/ui',
        namespace: 'ns1',
        syntheticProject: 'proj1',
        plural: 'pods',
        inside: true,
        fullPath: '/ui/inside/c1/ns1/proj1/pods',
      })

      expect(url).toBe(
        `/ui/inside/c1/ns1/proj1/forms/builtin/v1/pods?backlink=${encodeURIComponent('/ui/inside/c1/ns1/proj1/pods')}`,
      )
    })

    test('omits namespace/syntheticProject segments when undefined', () => {
      const url = getLinkToBuiltinForm({
        cluster: 'c1',
        baseprefix: '/ui',
        plural: 'pods',
        inside: true,
        fullPath: '/x',
      })

      expect(url).toBe(`/ui/inside/c1/forms/builtin/v1/pods?backlink=${encodeURIComponent('/x')}`)
    })
  })

  describe('getLinkToApiForm', () => {
    test('builds api link with group/version', () => {
      const url = getLinkToApiForm({
        cluster: 'c1',
        baseprefix: '/ui',
        apiGroup: 'apps',
        apiVersion: 'v1',
        plural: 'deployments',
        fullPath: '/ui/c1/deployments',
      })

      expect(url).toBe(`/ui/c1/forms/apis/apps/v1/deployments?backlink=${encodeURIComponent('/ui/c1/deployments')}`)
    })

    test('includes inside, namespace, and syntheticProject', () => {
      const url = getLinkToApiForm({
        cluster: 'c1',
        baseprefix: '/ui',
        namespace: 'ns1',
        syntheticProject: 'proj1',
        apiGroup: 'apps',
        apiVersion: 'v1',
        plural: 'deployments',
        inside: true,
        fullPath: '/ui/inside/c1/ns1/proj1/deployments',
      })

      expect(url).toBe(
        `/ui/inside/c1/ns1/proj1/forms/apis/apps/v1/deployments?backlink=${encodeURIComponent(
          '/ui/inside/c1/ns1/proj1/deployments',
        )}`,
      )
    })
  })

  describe('getLinkToForm', () => {
    test('routes to builtin when apiGroup is missing', () => {
      const url = getLinkToForm({
        cluster: 'c1',
        baseprefix: '/ui',
        apiVersion: 'v1',
        plural: 'pods',
        fullPath: '/ui/c1/pods',
      })

      expect(url).toBe(`/ui/c1/forms/builtin/v1/pods?backlink=${encodeURIComponent('/ui/c1/pods')}`)
    })

    test('routes to builtin when apiGroup is empty string', () => {
      const url = getLinkToForm({
        cluster: 'c1',
        baseprefix: '/ui',
        apiGroup: '',
        apiVersion: 'v1',
        plural: 'pods',
        fullPath: '/ui/c1/pods',
      })

      expect(url).toBe(`/ui/c1/forms/builtin/v1/pods?backlink=${encodeURIComponent('/ui/c1/pods')}`)
    })

    test('routes to api when apiGroup is provided', () => {
      const url = getLinkToForm({
        cluster: 'c1',
        baseprefix: '/ui',
        apiGroup: 'apps',
        apiVersion: 'v1',
        plural: 'deployments',
        fullPath: '/ui/c1/deployments',
      })

      expect(url).toBe(`/ui/c1/forms/apis/apps/v1/deployments?backlink=${encodeURIComponent('/ui/c1/deployments')}`)
    })
  })
})
