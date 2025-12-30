import { parseApiVersion, getResourceLink, getNamespaceLink } from './getResourceLink'

describe('parseApiVersion', () => {
  test('parses core api version', () => {
    expect(parseApiVersion('v1')).toEqual({ apiGroup: undefined, apiVersion: 'v1' })
    expect(parseApiVersion('v1beta1')).toEqual({ apiGroup: undefined, apiVersion: 'v1beta1' })
  })

  test('parses grouped api version', () => {
    expect(parseApiVersion('apps/v1')).toEqual({ apiGroup: 'apps', apiVersion: 'v1' })
    expect(parseApiVersion('networking.k8s.io/v1')).toEqual({ apiGroup: 'networking.k8s.io', apiVersion: 'v1' })
  })
})

describe('getResourceLink', () => {
  const base = {
    baseprefix: '/ui',
    cluster: 'c1',
    baseFactoryNamespacedAPIKey: 'ns-api',
    baseFactoryClusterSceopedAPIKey: 'cl-api',
    baseFactoryNamespacedBuiltinKey: 'ns-builtin',
    baseFactoryClusterSceopedBuiltinKey: 'cl-builtin',
  }

  test('returns undefined when pluralName or name missing', () => {
    expect(
      getResourceLink({
        ...base,
        apiGroupVersion: 'v1',
        pluralName: undefined,
        name: 'x',
      }),
    ).toBeUndefined()

    expect(
      getResourceLink({
        ...base,
        apiGroupVersion: 'v1',
        pluralName: 'pods',
        name: undefined,
      }),
    ).toBeUndefined()
  })

  test('namespaced builtin uses baseFactoryNamespacedBuiltinKey', () => {
    const url = getResourceLink({
      ...base,
      namespace: 'ns1',
      apiGroupVersion: 'v1',
      pluralName: 'pods',
      name: 'p1',
    })

    expect(url).toBe('/ui/c1/ns1/factory/ns-builtin/v1/pods/p1')
  })

  test('cluster-scoped builtin uses baseFactoryClusterSceopedBuiltinKey', () => {
    const url = getResourceLink({
      ...base,
      apiGroupVersion: 'v1',
      pluralName: 'nodes',
      name: 'n1',
    })

    expect(url).toBe('/ui/c1/factory/cl-builtin/v1/nodes/n1')
  })

  test('namespaced API uses baseFactoryNamespacedAPIKey', () => {
    const url = getResourceLink({
      ...base,
      namespace: 'ns1',
      apiGroupVersion: 'apps/v1',
      pluralName: 'deployments',
      name: 'd1',
    })

    expect(url).toBe('/ui/c1/ns1/factory/ns-api/apps/v1/deployments/d1')
  })

  test('cluster-scoped API uses baseFactoryClusterSceopedAPIKey', () => {
    const url = getResourceLink({
      ...base,
      apiGroupVersion: 'apps/v1',
      pluralName: 'deployments',
      name: 'd1',
    })

    expect(url).toBe('/ui/c1/factory/cl-api/apps/v1/deployments/d1')
  })

  test('forced mapping overrides factory key (namespaced API)', () => {
    const baseFactoriesMapping = {
      // key format:
      // `${baseFactoryNamespacedAPIKey}-${apiGroup}-${apiVersion}-${resource}`
      'ns-api-apps-v1-deployments': 'forced-ns-api',
    }

    const url = getResourceLink({
      ...base,
      namespace: 'ns1',
      apiGroupVersion: 'apps/v1',
      pluralName: 'deployments',
      name: 'd1',
      baseFactoriesMapping,
    })

    expect(url).toBe('/ui/c1/ns1/factory/forced-ns-api/apps/v1/deployments/d1')
  })

  test('forced mapping overrides factory key (cluster-scoped builtin)', () => {
    const baseFactoriesMapping = {
      // key format:
      // `${baseFactoryClusterSceopedBuiltinKey}-${apiVersion}-${resource}`
      'cl-builtin-v1-nodes': 'forced-cl-builtin',
    }

    const url = getResourceLink({
      ...base,
      apiGroupVersion: 'v1',
      pluralName: 'nodes',
      name: 'n1',
      baseFactoriesMapping,
    })

    expect(url).toBe('/ui/c1/factory/forced-cl-builtin/v1/nodes/n1')
  })
})

describe('getNamespaceLink', () => {
  test('returns undefined when namespace missing', () => {
    const url = getNamespaceLink({
      baseprefix: '/ui',
      cluster: 'c1',
      pluralName: 'namespaces',
      apiGroupVersion: 'v1',
      namespace: undefined,
      baseNamespaceFactoryKey: 'ns-factory',
    })

    expect(url).toBeUndefined()
  })

  test('builds namespace link', () => {
    const url = getNamespaceLink({
      baseprefix: '/ui',
      cluster: 'c1',
      pluralName: 'namespaces',
      apiGroupVersion: 'v1',
      namespace: 'ns1',
      baseNamespaceFactoryKey: 'ns-factory',
    })

    expect(url).toBe('/ui/c1/factory/ns-factory/v1/namespaces/ns1')
  })
})
