/* eslint-disable @typescript-eslint/no-explicit-any */
import { listItemBasePath, resolveFormPath, normalizeNameToPath } from './utils'

describe('listItemBasePath', () => {
  test('returns prefix up to last numeric segment', () => {
    expect(listItemBasePath(['spec', 'hosts', 0, 'namespace'])).toEqual(['spec', 'hosts', 0])

    expect(listItemBasePath(['spec', 'hosts', 0, 'containers', 2, 'name'])).toEqual([
      'spec',
      'hosts',
      0,
      'containers',
      2,
    ])
  })

  test('falls back to parent object when there is no numeric segment', () => {
    expect(listItemBasePath(['spec', 'template', 'metadata', 'name'])).toEqual(['spec', 'template', 'metadata'])
  })

  test('handles single-segment paths', () => {
    expect(listItemBasePath(['name'])).toEqual([])
  })

  test('handles empty path', () => {
    expect(listItemBasePath([])).toEqual([])
  })
})

describe('resolveFormPath', () => {
  test('returns [] when pathInput is undefined/empty', () => {
    expect(resolveFormPath(undefined, ['a'])).toEqual([])
    expect(resolveFormPath('', ['a'])).toEqual([])
  })

  test('returns array pathInput as-is', () => {
    const arr = ['spec', 'hosts', 0] as any
    const res = resolveFormPath(arr, ['x', 'y'])
    expect(res).toBe(arr)
    expect(res).toEqual(['spec', 'hosts', 0])
  })

  test('parses absolute dot-notation with numeric segments', () => {
    expect(resolveFormPath('spec.hosts.0.namespace', [])).toEqual(['spec', 'hosts', 0, 'namespace'])
    expect(resolveFormPath('0.foo', [])).toEqual([0, 'foo'])
  })

  test('ignores empty dot segments', () => {
    expect(resolveFormPath('spec..hosts...0..name', [])).toEqual(['spec', 'hosts', 0, 'name'])
  })

  test('resolves "./" relative paths against basePathForRelative', () => {
    const base = ['spec', 'hosts', 0, 'namespace']

    expect(resolveFormPath('./foo', base)).toEqual(['spec', 'hosts', 0, 'namespace', 'foo'])
    expect(resolveFormPath('./foo.bar.1', base)).toEqual(['spec', 'hosts', 0, 'namespace', 'foo', 'bar', 1])
  })

  test('resolves "../" relative paths against basePathForRelative', () => {
    const base = ['spec', 'hosts', 0, 'namespace']

    expect(resolveFormPath('../name', base)).toEqual(['spec', 'hosts', 0, 'name'])
    expect(resolveFormPath('../../bar.1', base)).toEqual(['spec', 'hosts', 'bar', 1])
  })

  test('handles multiple "/" parts and dot-notation within each part', () => {
    const base = ['a', 'b', 0, 'c']

    // "./x/y.1/z" => keep base, then add x, then (y,1), then z
    expect(resolveFormPath('./x/y.1/z', base)).toEqual(['a', 'b', 0, 'c', 'x', 'y', 1, 'z'])
  })

  test('does not crash when ".." walks past root', () => {
    expect(resolveFormPath('../../x', ['a'])).toEqual(['x'])
    expect(resolveFormPath('../..', ['a'])).toEqual([])
  })
})

describe('normalizeNameToPath', () => {
  test('returns array input as-is', () => {
    const arr = ['a', 0, 'b'] as any
    const res = normalizeNameToPath(arr)
    expect(res).toBe(arr)
    expect(res).toEqual(['a', 0, 'b'])
  })

  test('wraps non-array values', () => {
    expect(normalizeNameToPath('field')).toEqual(['field'])
    expect(normalizeNameToPath(0)).toEqual([0])
  })

  test('handles undefined gracefully (current runtime behavior)', () => {
    // Implementation casts unknown to string in the type system,
    // but at runtime this will still be [undefined].
    expect(normalizeNameToPath(undefined)).toEqual([undefined as any])
  })
})
