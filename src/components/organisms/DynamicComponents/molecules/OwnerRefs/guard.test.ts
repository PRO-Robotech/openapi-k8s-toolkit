/* eslint-disable @typescript-eslint/no-explicit-any */
import { isOwnerReference } from './guard'
import type { TOwnerReference } from './types'

describe('isOwnerReference', () => {
  test('returns false for non-objects / nullish', () => {
    expect(isOwnerReference(undefined)).toBe(false)
    expect(isOwnerReference(null)).toBe(false)
    expect(isOwnerReference('x' as any)).toBe(false)
    expect(isOwnerReference(123 as any)).toBe(false)
    expect(isOwnerReference(true as any)).toBe(false)
  })

  test('returns false for arrays', () => {
    expect(isOwnerReference([] as any)).toBe(false)
    expect(isOwnerReference([{ apiVersion: 'v1', kind: 'Pod', name: 'x' }] as any)).toBe(false)
  })

  test('returns false when required fields are missing', () => {
    expect(isOwnerReference({} as any)).toBe(false)
    expect(isOwnerReference({ apiVersion: 'v1' } as any)).toBe(false)
    expect(isOwnerReference({ apiVersion: 'v1', kind: 'Pod' } as any)).toBe(false)
    expect(isOwnerReference({ kind: 'Pod', name: 'x' } as any)).toBe(false)
  })

  test('returns false when required fields are wrong types', () => {
    expect(isOwnerReference({ apiVersion: 1, kind: 'Pod', name: 'x' } as any)).toBe(false)
    expect(isOwnerReference({ apiVersion: 'v1', kind: 2, name: 'x' } as any)).toBe(false)
    expect(isOwnerReference({ apiVersion: 'v1', kind: 'Pod', name: 3 } as any)).toBe(false)
  })

  test('returns true for a valid owner reference', () => {
    const v: TOwnerReference = {
      apiVersion: 'apps/v1',
      kind: 'Deployment',
      name: 'my-deploy',
      // extra fields allowed by runtime check
    } as any

    expect(isOwnerReference(v)).toBe(true)
  })

  test('returns true even with extra properties', () => {
    const v = {
      apiVersion: 'v1',
      kind: 'Pod',
      name: 'p1',
      uid: '123',
      controller: true,
      extra: { whatever: 1 },
    } as any

    expect(isOwnerReference(v)).toBe(true)
  })
})
