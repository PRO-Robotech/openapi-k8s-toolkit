/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  collectOneOfRequiredGroupStates,
  getNumberRangeRule,
  getPatternRule,
  getRequiredRule,
  prettyFieldPath,
} from './validation'

describe('validation helpers', () => {
  test('prettyFieldPath formats array path with dots', () => {
    expect(prettyFieldPath(['metadata', 'namespace'] as any)).toBe('metadata.namespace')
  })

  test('prettyFieldPath handles numeric segments', () => {
    expect(prettyFieldPath(['spec', 'containers', 0, 'name'] as any)).toBe('spec.containers.0.name')
  })

  test('prettyFieldPath handles non-array values', () => {
    expect(prettyFieldPath('name' as any)).toBe('name')
  })

  test('getRequiredRule returns required rule with pretty message', () => {
    expect(getRequiredRule(true, ['metadata', 'namespace'] as any)).toEqual({
      required: true,
      message: 'Please enter metadata.namespace',
    })
  })

  test('getRequiredRule without nullable returns a plain required rule (antd treats null as empty)', () => {
    const rule: any = getRequiredRule(true, 'foo' as any)
    expect(rule.required).toBe(true)
    expect(rule.validator).toBeUndefined()
  })

  test('getRequiredRule with nullable uses a custom validator that accepts null', async () => {
    const rule: any = getRequiredRule(true, 'foo' as any, true)
    expect(rule.required).toBe(true)
    expect(typeof rule.validator).toBe('function')

    await expect(rule.validator(undefined, null)).resolves.toBeUndefined()
    await expect(rule.validator(undefined, 'some-value')).resolves.toBeUndefined()
    await expect(rule.validator(undefined, 0)).resolves.toBeUndefined()
    await expect(rule.validator(undefined, false)).resolves.toBeUndefined()

    await expect(rule.validator(undefined, undefined)).rejects.toThrow('Please enter foo')
    await expect(rule.validator(undefined, '')).rejects.toThrow('Please enter foo')
    await expect(rule.validator(undefined, [])).rejects.toThrow('Please enter foo')
  })

  test('getRequiredRule with isRequired=false ignores nullable', () => {
    expect(getRequiredRule(false, 'foo' as any, true)).toEqual({
      required: false,
      message: 'Please enter foo',
    })
  })

  test('getPatternRule validates string values against OpenAPI pattern', async () => {
    const rule: any = getPatternRule('^https?://', ['spec', 'url'] as any)

    expect(typeof rule.validator).toBe('function')
    await expect(rule.validator(undefined, 'https://example.com')).resolves.toBeUndefined()
    await expect(rule.validator(undefined, 'http://example.com')).resolves.toBeUndefined()
    await expect(rule.validator(undefined, '')).resolves.toBeUndefined()
    await expect(rule.validator(undefined, undefined)).resolves.toBeUndefined()
    await expect(rule.validator(undefined, 'ftp://example.com')).rejects.toThrow(
      'Value must match pattern for spec.url: ^https?://',
    )
  })

  test('getPatternRule ignores invalid regex patterns instead of breaking form rendering', () => {
    expect(getPatternRule('[', ['spec', 'url'] as any)).toBeUndefined()
  })

  test('getNumberRangeRule validates inclusive minimum and maximum', async () => {
    const rule: any = getNumberRangeRule({
      name: ['spec', 'service', 'port'] as any,
      minimum: 1,
      maximum: 65535,
    })

    expect(typeof rule.validator).toBe('function')
    await expect(rule.validator(undefined, 1)).resolves.toBeUndefined()
    await expect(rule.validator(undefined, 65535)).resolves.toBeUndefined()
    await expect(rule.validator(undefined, undefined)).resolves.toBeUndefined()
    await expect(rule.validator(undefined, 0)).rejects.toThrow(
      'Value must be between 1 and 65535 for spec.service.port',
    )
    await expect(rule.validator(undefined, 65536)).rejects.toThrow(
      'Value must be between 1 and 65535 for spec.service.port',
    )
  })

  test('collectOneOfRequiredGroupStates accepts exactly one satisfied group', () => {
    expect(
      collectOneOfRequiredGroupStates({
        properties: {
          spec: {
            type: 'object',
            properties: {
              command: { type: 'string' },
              shell: { type: 'string' },
            },
            oneOfRequiredGroups: [['command'], ['shell']],
          },
        },
        values: {
          spec: {
            command: 'echo ok',
          },
        },
      }),
    ).toEqual([{ name: ['spec'], errors: [] }])
  })

  test('collectOneOfRequiredGroupStates reports error when no group is satisfied on a present object', () => {
    expect(
      collectOneOfRequiredGroupStates({
        properties: {
          spec: {
            type: 'object',
            properties: {
              command: { type: 'string' },
              shell: { type: 'string' },
              mode: { type: 'string' },
            },
            oneOfRequiredGroups: [['command'], ['shell']],
          },
        },
        values: {
          spec: {
            mode: 'interactive',
          },
        },
      }),
    ).toEqual([
      {
        name: ['spec'],
        errors: ['Please provide exactly one of the following for spec: [command], [shell]'],
      },
    ])
  })

  test('collectOneOfRequiredGroupStates reports error when multiple groups are satisfied', () => {
    expect(
      collectOneOfRequiredGroupStates({
        properties: {
          spec: {
            type: 'object',
            properties: {
              command: { type: 'string' },
              shell: { type: 'string' },
            },
            oneOfRequiredGroups: [['command'], ['shell']],
          },
        },
        values: {
          spec: {
            command: 'echo ok',
            shell: '/bin/sh',
          },
        },
      }),
    ).toEqual([
      {
        name: ['spec'],
        errors: ['Please provide exactly one of the following for spec: [command], [shell]'],
      },
    ])
  })

  test('collectOneOfRequiredGroupStates skips absent optional objects', () => {
    expect(
      collectOneOfRequiredGroupStates({
        properties: {
          spec: {
            type: 'object',
            properties: {
              command: { type: 'string' },
              shell: { type: 'string' },
            },
            oneOfRequiredGroups: [['command'], ['shell']],
          },
        },
        values: {},
      }),
    ).toEqual([{ name: ['spec'], errors: [] }])
  })

  test('collectOneOfRequiredGroupStates validates active oneOf branch required and forbidden fields', () => {
    expect(
      collectOneOfRequiredGroupStates({
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
                forbidden: ['url'],
              },
              {
                match: { type: 'url' },
                required: ['url'],
                forbidden: ['service'],
              },
            ],
          },
        },
        values: {
          spec: {
            type: 'service',
            url: 'https://example.com',
          },
        },
      }),
    ).toEqual([
      {
        name: ['spec'],
        errors: [
          'Please provide required fields for spec when type=service: [service]',
          'Please remove forbidden fields for spec when type=service: [url]',
        ],
      },
    ])
  })

  test('collectOneOfRequiredGroupStates accepts valid oneOf branch state', () => {
    expect(
      collectOneOfRequiredGroupStates({
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
                forbidden: ['url'],
              },
              {
                match: { type: 'url' },
                required: ['url'],
                forbidden: ['service'],
              },
            ],
          },
        },
        values: {
          spec: {
            type: 'url',
            url: 'https://example.com',
          },
        },
      }),
    ).toEqual([{ name: ['spec'], errors: [] }])
  })

  test('collectOneOfRequiredGroupStates skips branch validation until a selector branch is active', () => {
    expect(
      collectOneOfRequiredGroupStates({
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
                forbidden: ['url'],
              },
              {
                match: { type: 'url' },
                required: ['url'],
                forbidden: ['service'],
              },
            ],
          },
        },
        values: {
          spec: {
            type: '',
          },
        },
      }),
    ).toEqual([{ name: ['spec'], errors: [] }])
  })

  test('collectOneOfRequiredGroupStates validates oneOf groups on array items', () => {
    expect(
      collectOneOfRequiredGroupStates({
        properties: {
          containers: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                command: { type: 'string' },
                shell: { type: 'string' },
              },
              oneOfRequiredGroups: [['command'], ['shell']],
            },
          },
        },
        values: {
          containers: [
            {
              command: 'echo ok',
              shell: '/bin/sh',
            },
          ],
        },
      }),
    ).toEqual([
      {
        name: ['containers', 0],
        errors: ['Please provide exactly one of the following for containers.0: [command], [shell]'],
      },
    ])
  })

  test('collectOneOfRequiredGroupStates validates oneOf branches on array items', () => {
    expect(
      collectOneOfRequiredGroupStates({
        properties: {
          backends: {
            type: 'array',
            items: {
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
          },
        },
        values: {
          backends: [
            {
              type: 'url',
              service: {
                name: 'demo',
              },
            },
          ],
        },
      }),
    ).toEqual([
      {
        name: ['backends', 0],
        errors: [
          'Please provide required fields for backends.0 when type=url: [url]',
          'Please remove forbidden fields for backends.0 when type=url: [service]',
        ],
      },
    ])
  })
})
