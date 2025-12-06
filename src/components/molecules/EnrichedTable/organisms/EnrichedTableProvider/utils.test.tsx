/* eslint-disable no-underscore-dangle */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { prepare } from './utils'

describe('prepare (rich table data/columns)', () => {
  test('builds columns from additionalPrinterColumns with simple dot and direct paths', () => {
    const additionalPrinterColumns = [
      { name: 'Name', jsonPath: '.metadata.name' },
      { name: 'Namespace', jsonPath: '.metadata.namespace' },
      { name: 'Foo', jsonPath: 'foo' },
    ] as any

    const dataItems = [
      {
        metadata: { name: 'n1', namespace: 'ns1' },
        foo: 'bar',
      },
    ] as any

    const { columns, dataSource } = prepare({
      dataItems,
      additionalPrinterColumns,
    })

    expect(columns).toHaveLength(3)

    const nameCol = (columns as any[]).find(c => c.key === 'Name')
    const nsCol = (columns as any[]).find(c => c.key === 'Namespace')
    const fooCol = (columns as any[]).find(c => c.key === 'Foo')

    expect(nameCol.dataIndex).toEqual(['metadata', 'name'])
    expect(nsCol.dataIndex).toEqual(['metadata', 'namespace'])
    expect(fooCol.dataIndex).toBe('foo')

    expect(dataSource).toHaveLength(1)
    expect((dataSource as any[])[0].metadata.name).toBe('n1')
  })

  test('falls back to resourceSchema to build columns when additionalPrinterColumns is missing', () => {
    const resourceSchema = { a: 1, b: 2 } as any

    const dataItems = [
      {
        metadata: { name: 'n1' },
        spec: { a: 'x', b: 'y' },
      },
    ] as any

    const { columns, dataSource } = prepare({
      dataItems,
      resourceSchema,
    })

    expect((columns as any[]).map(c => c.key)).toEqual(['a', 'b'])

    expect(dataSource).toHaveLength(1)
    expect((dataSource as any[])[0].a).toBe('x')
    expect((dataSource as any[])[0].b).toBe('y')
  })

  test('adds internalDataForControls and stable key when metadata.name exists (additionalPrinterColumns branch)', () => {
    const onDeleteHandle = jest.fn()

    const dataForControls = {
      cluster: 'c1',
      syntheticProject: 'sp1',
      pathPrefix: 'pp',
      apiVersion: 'apps/v1',
      plural: 'deployments',
      backlink: 'back',
      deletePathPrefix: '/delete',
      onDeleteHandle,
      permissions: { canUpdate: true, canDelete: true },
    }

    const additionalPrinterColumns = [{ name: 'Name', jsonPath: '.metadata.name' }] as any

    const dataItems = [
      {
        metadata: { name: 'n1', namespace: 'ns1' },
        spec: { x: 1 },
      },
    ] as any

    const { dataSource } = prepare({
      dataItems,
      additionalPrinterColumns,
      dataForControls,
    })

    expect(dataSource).toHaveLength(1)

    const row = (dataSource as any[])[0]
    expect(row.key).toBe('n1-ns1')
    expect(row.internalDataForControls).toEqual(
      expect.objectContaining({
        cluster: 'c1',
        syntheticProject: 'sp1',
        pathPrefix: 'pp',
        apiGroupAndVersion: 'apps/v1',
        plural: 'deployments',
        name: 'n1',
        namespace: 'ns1',
        backlink: 'back',
        deletePathPrefix: '/delete',
        onDeleteHandle,
        permissions: { canUpdate: true, canDelete: true },
      }),
    )
  })

  test('creates customFields for complex jsonPath (with brackets) and injects computed values into dataSource', () => {
    const complexPath = '.spec.containers[0].image'
    const complexIndex = JSON.stringify(complexPath)

    const additionalPrinterColumns = [
      { name: 'First image', jsonPath: complexPath },
      { name: 'Name', jsonPath: '.metadata.name' },
    ] as any

    const dataItems = [
      {
        metadata: { name: 'n1' },
        spec: { containers: [{ image: 'img1' }, { image: 'img2' }] },
      },
    ] as any

    const { columns, dataSource } = prepare({
      dataItems,
      additionalPrinterColumns,
    })

    const imgCol = (columns as any[]).find(c => c.key === 'First image')
    expect(imgCol.dataIndex).toBe(complexIndex)

    const row = (dataSource as any[])[0]
    expect(row[complexIndex]).toBe('img1')
  })

  test('flatMap: removes original flatMap column and expands rows into key/value pairs', () => {
    const onDeleteHandle = jest.fn()

    const dataForControls = {
      cluster: 'c1',
      pathPrefix: 'pp',
      apiVersion: 'v1',
      plural: 'pods',
      backlink: 'back',
      deletePathPrefix: '/delete',
      onDeleteHandle,
      permissions: {},
    }

    const additionalPrinterColumns = [
      // the trigger column (will be removed from columns output)
      { name: 'Labels', type: 'flatMap', jsonPath: '.metadata.labels' },

      // user-defined columns that should remain
      { name: 'Labels Key', jsonPath: '_flatMapLabels_Key' },
      { name: 'Labels Value', jsonPath: '_flatMapLabels_Value' },
    ] as any

    const dataItems = [
      {
        metadata: { name: 'n1', labels: { a: '1', b: '2' } },
      },
    ] as any

    const { columns, dataSource } = prepare({
      dataItems,
      additionalPrinterColumns,
      dataForControls,
    })

    const keys = (columns as any[]).map(c => c.key)
    expect(keys).toContain('Labels Key')
    expect(keys).toContain('Labels Value')
    expect(keys).not.toContain('Labels')

    expect(dataSource).toHaveLength(2)

    const rows = dataSource as any[]
    const kv = rows.map(r => [r._flatMapLabels_Key, r._flatMapLabels_Value]).sort()

    expect(kv).toEqual([
      ['a', '1'],
      ['b', '2'],
    ])

    // keys should be unique and derived from base row key + jsonPath + map key
    expect(rows[0].key).toContain('n1-.metadata.labels-')
    expect(rows[1].key).toContain('n1-.metadata.labels-')
  })

  test('flatMap: empty map still produces one row with null key/value', () => {
    const additionalPrinterColumns = [
      { name: 'Labels', type: 'flatMap', jsonPath: '.metadata.labels' },
      { name: 'Labels Key', jsonPath: '_flatMapLabels_Key' },
      { name: 'Labels Value', jsonPath: '_flatMapLabels_Value' },
    ] as any

    const dataItems = [
      {
        metadata: { name: 'n1', labels: {} },
      },
    ] as any

    const { dataSource } = prepare({
      dataItems,
      additionalPrinterColumns,
    })

    expect(dataSource).toHaveLength(1)
    const row = (dataSource as any[])[0]
    expect(row._flatMapLabels_Key).toBeNull()
    expect(row._flatMapLabels_Value).toBeNull()
  })
})
