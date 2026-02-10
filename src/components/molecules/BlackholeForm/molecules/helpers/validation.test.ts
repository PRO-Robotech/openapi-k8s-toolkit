/* eslint-disable @typescript-eslint/no-explicit-any */
import { getRequiredRule, prettyFieldPath } from './validation'

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
})
