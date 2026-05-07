import { TFormSchemaProperties } from 'localTypes/formSchema'
import { collectInactiveBranchCleanupPaths } from './oneOfBranchCleanup'

describe('oneOf branch cleanup helpers', () => {
  const backendProperties: TFormSchemaProperties = {
    spec: {
      type: 'object',
      properties: {
        type: { type: 'string', enum: ['service', 'url'] },
        service: { type: 'object' },
        url: { type: 'string' },
      },
      oneOfBranches: [
        {
          match: { type: 'service' },
          required: ['service'],
          forbidden: ['url'],
        },
        {
          match: { type: 'url' },
          required: ['url'],
          forbidden: ['service'],
        },
      ],
    },
  }

  test('returns empty when changedValues is undefined (initial mount or programmatic update)', () => {
    expect(
      collectInactiveBranchCleanupPaths({
        properties: backendProperties,
        values: { spec: { type: 'service', service: { name: 'foo' } } },
        changedValues: undefined,
      }),
    ).toEqual([])
  })

  test('returns empty when changedValues do not touch any selector path', () => {
    expect(
      collectInactiveBranchCleanupPaths({
        properties: backendProperties,
        values: { spec: { type: 'service', service: { name: 'foo' } } },
        changedValues: { spec: { service: { name: 'foo' } } },
      }),
    ).toEqual([])
  })

  test('cleans previous service data when selector switches service→url', () => {
    expect(
      collectInactiveBranchCleanupPaths({
        properties: backendProperties,
        values: { spec: { type: 'url', service: { name: 'foo', port: 80 } } },
        changedValues: { spec: { type: 'url' } },
      }),
    ).toEqual([['spec', 'service']])
  })

  test('cleans previous url data when selector switches url→service', () => {
    expect(
      collectInactiveBranchCleanupPaths({
        properties: backendProperties,
        values: { spec: { type: 'service', url: 'https://example.com' } },
        changedValues: { spec: { type: 'service' } },
      }),
    ).toEqual([['spec', 'url']])
  })

  test('returns empty when no branch matches the new selector value', () => {
    expect(
      collectInactiveBranchCleanupPaths({
        properties: backendProperties,
        values: { spec: { type: '', service: { name: 'foo' } } },
        changedValues: { spec: { type: '' } },
      }),
    ).toEqual([])
  })

  test('returns empty when multiple branches match the new selector value', () => {
    const ambiguousProperties: TFormSchemaProperties = {
      spec: {
        type: 'object',
        oneOfBranches: [
          { match: { type: 'shared' }, required: ['fieldA'], forbidden: ['fieldB'] },
          { match: { type: 'shared' }, required: ['fieldB'], forbidden: ['fieldA'] },
        ],
      },
    }
    expect(
      collectInactiveBranchCleanupPaths({
        properties: ambiguousProperties,
        values: { spec: { type: 'shared', fieldA: 'a', fieldB: 'b' } },
        changedValues: { spec: { type: 'shared' } },
      }),
    ).toEqual([])
  })

  test('three-branch selector: cleans required and forbidden of all inactive branches', () => {
    const triProperties: TFormSchemaProperties = {
      spec: {
        type: 'object',
        oneOfBranches: [
          { match: { mode: 'a' }, required: ['fieldA'] },
          { match: { mode: 'b' }, required: ['fieldB'] },
          { match: { mode: 'c' }, required: ['fieldC'] },
        ],
      },
    }
    expect(
      collectInactiveBranchCleanupPaths({
        properties: triProperties,
        values: { spec: { mode: 'a', fieldA: 'A', fieldB: 'B', fieldC: 'C' } },
        changedValues: { spec: { mode: 'a' } },
      }),
    ).toEqual([
      ['spec', 'fieldB'],
      ['spec', 'fieldC'],
    ])
  })

  test('keeps fields that are required by the active branch even if forbidden by inactive', () => {
    const overlapProperties: TFormSchemaProperties = {
      spec: {
        type: 'object',
        oneOfBranches: [
          { match: { mode: 'A' }, required: ['shared', 'aOnly'], forbidden: ['bOnly'] },
          { match: { mode: 'B' }, required: ['shared', 'bOnly'], forbidden: ['aOnly'] },
        ],
      },
    }
    expect(
      collectInactiveBranchCleanupPaths({
        properties: overlapProperties,
        values: { spec: { mode: 'A', shared: 'X', aOnly: 'Y', bOnly: 'Z' } },
        changedValues: { spec: { mode: 'A' } },
      }),
    ).toEqual([['spec', 'bOnly']])
  })

  test('does not clean the selector field itself even if it is listed in forbidden', () => {
    expect(
      collectInactiveBranchCleanupPaths({
        properties: {
          spec: {
            type: 'object',
            oneOfBranches: [
              {
                match: { type: 'service' },
                required: ['service'],
                forbidden: ['type', 'url'],
              },
            ],
          },
        } satisfies TFormSchemaProperties,
        values: { spec: { type: 'service', url: 'https://example.com' } },
        changedValues: { spec: { type: 'service' } },
      }),
    ).toEqual([['spec', 'url']])
  })

  test('cleans nested array items independently when their selectors change', () => {
    expect(
      collectInactiveBranchCleanupPaths({
        properties: {
          backends: {
            type: 'array',
            items: backendProperties.spec,
          },
        } satisfies TFormSchemaProperties,
        values: {
          backends: [
            { type: 'service', service: { name: 'a' } },
            { type: 'url', url: 'https://example.com', service: { name: 'leak' } },
          ],
        },
        changedValues: {
          backends: { 1: { type: 'url' } },
        } as unknown as Record<string, unknown>,
      }),
    ).toEqual([['backends', 1, 'service']])
  })
})
