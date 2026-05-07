/* eslint-disable @typescript-eslint/no-explicit-any */
import {
  collectOneOfRequiredGroupStates,
  getArrayItemsRule,
  getNumberFormatRule,
  getNumberRangeRule,
  getPatternRule,
  getRequiredRule,
  getStringFormatRule,
  getStringLengthRule,
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

  test('getPatternRule warns and ignores invalid regex patterns instead of breaking form rendering', () => {
    // eslint-disable-next-line no-console
    ;(console.warn as jest.Mock).mockClear()

    expect(getPatternRule('[', ['spec', 'url'] as any)).toBeUndefined()
    // eslint-disable-next-line no-console
    expect(console.warn).toHaveBeenCalledWith(
      '[BlackholeForm] OpenAPI pattern cannot be compiled as JavaScript RegExp',
      {
        fieldPath: 'spec.url',
        pattern: '[',
        error: expect.any(SyntaxError),
      },
    )
  })

  test('getStringLengthRule validates inclusive minLength and maxLength', async () => {
    const rule: any = getStringLengthRule({
      name: ['metadata', 'name'] as any,
      minLength: 3,
      maxLength: 10,
    })

    expect(typeof rule.validator).toBe('function')
    await expect(rule.validator(undefined, 'abc')).resolves.toBeUndefined()
    await expect(rule.validator(undefined, 'abcdefghij')).resolves.toBeUndefined()
    await expect(rule.validator(undefined, '')).resolves.toBeUndefined()
    await expect(rule.validator(undefined, undefined)).resolves.toBeUndefined()
    await expect(rule.validator(undefined, 'ab')).rejects.toThrow(
      'Value must be between 3 and 10 characters for metadata.name',
    )
    await expect(rule.validator(undefined, 'abcdefghijk')).rejects.toThrow(
      'Value must be between 3 and 10 characters for metadata.name',
    )
  })

  test('getStringFormatRule validates date values', async () => {
    const rule: any = getStringFormatRule('date', ['spec', 'startDate'] as any)

    expect(typeof rule.validator).toBe('function')
    await expect(rule.validator(undefined, '2026-05-06')).resolves.toBeUndefined()
    await expect(rule.validator(undefined, '2024-02-29')).resolves.toBeUndefined()
    await expect(rule.validator(undefined, '')).resolves.toBeUndefined()
    await expect(rule.validator(undefined, undefined)).resolves.toBeUndefined()
    await expect(rule.validator(undefined, '2026-02-29')).rejects.toThrow(
      'Value must match date format for spec.startDate: YYYY-MM-DD',
    )
    await expect(rule.validator(undefined, '06.05.2026')).rejects.toThrow(
      'Value must match date format for spec.startDate: YYYY-MM-DD',
    )
  })

  test('getStringFormatRule validates date-time values', async () => {
    const rule: any = getStringFormatRule('date-time', ['metadata', 'creationTimestamp'] as any)

    expect(typeof rule.validator).toBe('function')
    await expect(rule.validator(undefined, '2026-05-06T12:34:56Z')).resolves.toBeUndefined()
    await expect(rule.validator(undefined, '2026-05-06T12:34:56.789+03:00')).resolves.toBeUndefined()
    await expect(rule.validator(undefined, '')).resolves.toBeUndefined()
    await expect(rule.validator(undefined, '2026-05-06')).rejects.toThrow(
      'Value must match date-time format for metadata.creationTimestamp: RFC 3339 date-time',
    )
    await expect(rule.validator(undefined, '2026-05-06T25:00:00Z')).rejects.toThrow(
      'Value must match date-time format for metadata.creationTimestamp: RFC 3339 date-time',
    )
  })

  test('getStringFormatRule ignores unsupported string formats', () => {
    expect(getStringFormatRule('email', ['spec', 'owner'] as any)).toBeUndefined()
    expect(getStringFormatRule(undefined, ['spec', 'owner'] as any)).toBeUndefined()
  })

  test('getArrayItemsRule validates inclusive minItems and maxItems', async () => {
    const rule: any = getArrayItemsRule({
      name: ['spec', 'hosts'] as any,
      minItems: 2,
      maxItems: 4,
    })

    expect(typeof rule.validator).toBe('function')
    await expect(rule.validator(undefined, ['a', 'b'])).resolves.toBeUndefined()
    await expect(rule.validator(undefined, ['a', 'b', 'c', 'd'])).resolves.toBeUndefined()
    await expect(rule.validator(undefined, undefined)).resolves.toBeUndefined()
    await expect(rule.validator(undefined, null)).resolves.toBeUndefined()
    await expect(rule.validator(undefined, 'not-array')).resolves.toBeUndefined()
    await expect(rule.validator(undefined, ['a'])).rejects.toThrow(
      'Value must contain between 2 and 4 items for spec.hosts',
    )
    await expect(rule.validator(undefined, ['a', 'b', 'c', 'd', 'e'])).rejects.toThrow(
      'Value must contain between 2 and 4 items for spec.hosts',
    )
  })

  test('getNumberFormatRule validates int32 values', async () => {
    const rule: any = getNumberFormatRule('int32', ['spec', 'replicas'] as any)

    expect(typeof rule.validator).toBe('function')
    await expect(rule.validator(undefined, 0)).resolves.toBeUndefined()
    await expect(rule.validator(undefined, 2147483647)).resolves.toBeUndefined()
    await expect(rule.validator(undefined, -2147483648)).resolves.toBeUndefined()
    await expect(rule.validator(undefined, '')).resolves.toBeUndefined()
    await expect(rule.validator(undefined, 1.5)).rejects.toThrow(
      'Value must be a 32-bit signed integer for spec.replicas',
    )
    await expect(rule.validator(undefined, 2147483648)).rejects.toThrow(
      'Value must be a 32-bit signed integer for spec.replicas',
    )
  })

  test('getNumberFormatRule ignores unsupported numeric formats', () => {
    expect(getNumberFormatRule('int64', ['spec', 'id'] as any)).toBeUndefined()
    expect(getNumberFormatRule(undefined, ['spec', 'id'] as any)).toBeUndefined()
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
