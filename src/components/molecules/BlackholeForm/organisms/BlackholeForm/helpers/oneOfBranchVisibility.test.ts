import { TFormSchemaProperties } from 'localTypes/formSchema'
import { collectOneOfBranchHiddenPaths } from './oneOfBranchVisibility'

describe('oneOf branch visibility helpers', () => {
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

  test('hides inactive service/url branch fields after selector value is chosen', () => {
    expect(
      collectOneOfBranchHiddenPaths({
        properties: backendProperties,
        values: {
          spec: {
            type: 'service',
          },
        },
      }),
    ).toEqual([['spec', 'url']])

    expect(
      collectOneOfBranchHiddenPaths({
        properties: backendProperties,
        values: {
          spec: {
            type: 'url',
          },
        },
      }),
    ).toEqual([['spec', 'service']])
  })

  test('keeps selector fields visible', () => {
    expect(
      collectOneOfBranchHiddenPaths({
        properties: {
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
                forbidden: ['type', 'url'],
              },
            ],
          },
        } satisfies TFormSchemaProperties,
        values: {
          spec: {
            type: 'service',
          },
        },
      }),
    ).toEqual([['spec', 'url']])
  })

  test('does not hide contradictory existing data so edit mode can show what must be fixed', () => {
    expect(
      collectOneOfBranchHiddenPaths({
        properties: backendProperties,
        values: {
          spec: {
            type: 'service',
            url: 'https://example.com',
          },
        },
      }),
    ).toEqual([])
  })

  test('does not hide branches before selector value activates exactly one branch', () => {
    expect(
      collectOneOfBranchHiddenPaths({
        properties: backendProperties,
        values: {
          spec: {
            type: '',
          },
        },
      }),
    ).toEqual([])
  })

  test('hides inactive branch fields for array items independently', () => {
    expect(
      collectOneOfBranchHiddenPaths({
        properties: {
          backends: {
            type: 'array',
            items: backendProperties.spec,
          },
        } satisfies TFormSchemaProperties,
        values: {
          backends: [
            {
              type: 'service',
            },
            {
              type: 'url',
            },
          ],
        },
      }),
    ).toEqual([
      ['backends', 0, 'url'],
      ['backends', 1, 'service'],
    ])
  })
})
