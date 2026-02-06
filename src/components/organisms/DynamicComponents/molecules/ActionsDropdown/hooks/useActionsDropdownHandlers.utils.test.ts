import { TEvictActionProps } from '../../../types/ActionsDropdown'
import {
  parseValueIfString,
  buildEvictModalData,
  buildEvictBody,
  TParseContext,
  TEvictModalData,
} from './useActionsDropdownHandlers'

const emptyCtx: TParseContext = {
  replaceValues: {},
  multiQueryData: {},
}

describe('parseValueIfString', () => {
  it('returns string value as-is when no interpolation is needed', () => {
    const result = parseValueIfString('hello', emptyCtx)

    expect(result).toBe('hello')
  })

  it('passes through non-string values unchanged (boolean)', () => {
    expect(parseValueIfString(true, emptyCtx)).toBe(true)
    expect(parseValueIfString(false, emptyCtx)).toBe(false)
  })

  it('passes through non-string values unchanged (number)', () => {
    expect(parseValueIfString(42, emptyCtx)).toBe(42)
    expect(parseValueIfString(0, emptyCtx)).toBe(0)
  })

  it('passes through null and undefined', () => {
    expect(parseValueIfString(null, emptyCtx)).toBeNull()
    expect(parseValueIfString(undefined, emptyCtx)).toBeUndefined()
  })

  it('passes through object values unchanged', () => {
    const obj = { key: 'value' }

    expect(parseValueIfString(obj, emptyCtx)).toBe(obj)
  })

  it('passes through array values unchanged', () => {
    const arr = [1, 2, 3]

    expect(parseValueIfString(arr, emptyCtx)).toBe(arr)
  })

  it('interpolates URL segment placeholders in strings', () => {
    const ctx: TParseContext = {
      replaceValues: { '0': 'openapi-ui', '1': 'default', '2': 'my-cluster' },
      multiQueryData: {},
    }

    expect(parseValueIfString('{2}', ctx)).toBe('my-cluster')
  })
})

describe('buildEvictModalData', () => {
  it('builds modal data with all required fields', () => {
    const props: TEvictActionProps = {
      text: 'Evict',
      endpoint: '/api/evict',
      name: 'my-pod',
    }

    const result = buildEvictModalData(props, emptyCtx)

    expect(result).toEqual({
      endpoint: '/api/evict',
      name: 'my-pod',
      namespace: undefined,
      apiVersion: 'policy/v1',
      gracePeriodSeconds: undefined,
      dryRun: undefined,
    })
  })

  it('defaults apiVersion to policy/v1 when not provided', () => {
    const props: TEvictActionProps = {
      text: 'Evict',
      endpoint: '/api/evict',
      name: 'my-pod',
    }

    const result = buildEvictModalData(props, emptyCtx)

    expect(result.apiVersion).toBe('policy/v1')
  })

  it('uses provided apiVersion when specified', () => {
    const props: TEvictActionProps = {
      text: 'Evict',
      endpoint: '/api/evict',
      name: 'my-pod',
      apiVersion: 'policy/v1beta1',
    }

    const result = buildEvictModalData(props, emptyCtx)

    expect(result.apiVersion).toBe('policy/v1beta1')
  })

  it('includes namespace when provided', () => {
    const props: TEvictActionProps = {
      text: 'Evict',
      endpoint: '/api/evict',
      name: 'my-pod',
      namespace: 'kube-system',
    }

    const result = buildEvictModalData(props, emptyCtx)

    expect(result.namespace).toBe('kube-system')
  })

  it('preserves gracePeriodSeconds and dryRun', () => {
    const props: TEvictActionProps = {
      text: 'Evict',
      endpoint: '/api/evict',
      name: 'my-pod',
      gracePeriodSeconds: 30,
      dryRun: ['All'],
    }

    const result = buildEvictModalData(props, emptyCtx)

    expect(result.gracePeriodSeconds).toBe(30)
    expect(result.dryRun).toEqual(['All'])
  })

  it('interpolates URL segment placeholders in props', () => {
    const ctx: TParseContext = {
      replaceValues: { '2': 'my-cluster' },
      multiQueryData: {},
    }
    const props: TEvictActionProps = {
      text: 'Evict',
      endpoint: '/api/clusters/{2}/evict',
      name: 'my-pod',
      namespace: 'default',
    }

    const result = buildEvictModalData(props, ctx)

    expect(result.endpoint).toBe('/api/clusters/my-cluster/evict')
  })
})

describe('buildEvictBody', () => {
  it('builds minimal eviction body', () => {
    const data: TEvictModalData = {
      name: 'my-pod',
      endpoint: '/api/evict',
      apiVersion: 'policy/v1',
    }

    const body = buildEvictBody(data)

    expect(body).toEqual({
      apiVersion: 'policy/v1',
      kind: 'Eviction',
      metadata: {
        name: 'my-pod',
      },
    })
  })

  it('includes namespace in metadata when provided', () => {
    const data: TEvictModalData = {
      name: 'my-pod',
      endpoint: '/api/evict',
      apiVersion: 'policy/v1',
      namespace: 'kube-system',
    }

    const body = buildEvictBody(data)

    expect(body.metadata).toEqual({
      name: 'my-pod',
      namespace: 'kube-system',
    })
  })

  it('omits namespace from metadata when not provided', () => {
    const data: TEvictModalData = {
      name: 'my-pod',
      endpoint: '/api/evict',
      apiVersion: 'policy/v1',
    }

    const body = buildEvictBody(data)

    expect(body.metadata).toEqual({ name: 'my-pod' })
    expect(body.metadata).not.toHaveProperty('namespace')
  })

  it('includes deleteOptions with gracePeriodSeconds', () => {
    const data: TEvictModalData = {
      name: 'my-pod',
      endpoint: '/api/evict',
      apiVersion: 'policy/v1',
      gracePeriodSeconds: 30,
    }

    const body = buildEvictBody(data)

    expect(body).toHaveProperty('deleteOptions')
    expect((body as Record<string, unknown>).deleteOptions).toEqual({ gracePeriodSeconds: 30 })
  })

  it('includes deleteOptions with dryRun', () => {
    const data: TEvictModalData = {
      name: 'my-pod',
      endpoint: '/api/evict',
      apiVersion: 'policy/v1',
      dryRun: ['All'],
    }

    const body = buildEvictBody(data)

    expect((body as Record<string, unknown>).deleteOptions).toEqual({ dryRun: ['All'] })
  })

  it('includes both gracePeriodSeconds and dryRun in deleteOptions', () => {
    const data: TEvictModalData = {
      name: 'my-pod',
      endpoint: '/api/evict',
      apiVersion: 'policy/v1',
      gracePeriodSeconds: 0,
      dryRun: ['All'],
    }

    const body = buildEvictBody(data)

    expect((body as Record<string, unknown>).deleteOptions).toEqual({
      gracePeriodSeconds: 0,
      dryRun: ['All'],
    })
  })

  it('omits deleteOptions when neither gracePeriodSeconds nor dryRun provided', () => {
    const data: TEvictModalData = {
      name: 'my-pod',
      endpoint: '/api/evict',
      apiVersion: 'policy/v1',
    }

    const body = buildEvictBody(data)

    expect(body).not.toHaveProperty('deleteOptions')
  })

  it('omits deleteOptions when dryRun is empty array', () => {
    const data: TEvictModalData = {
      name: 'my-pod',
      endpoint: '/api/evict',
      apiVersion: 'policy/v1',
      dryRun: [],
    }

    const body = buildEvictBody(data)

    expect(body).not.toHaveProperty('deleteOptions')
  })

  it('handles gracePeriodSeconds of 0 (immediate eviction)', () => {
    const data: TEvictModalData = {
      name: 'my-pod',
      endpoint: '/api/evict',
      apiVersion: 'policy/v1',
      gracePeriodSeconds: 0,
    }

    const body = buildEvictBody(data)

    expect((body as Record<string, unknown>).deleteOptions).toEqual({ gracePeriodSeconds: 0 })
  })

  it('uses provided apiVersion in body', () => {
    const data: TEvictModalData = {
      name: 'my-pod',
      endpoint: '/api/evict',
      apiVersion: 'policy/v1beta1',
    }

    const body = buildEvictBody(data)

    expect(body.apiVersion).toBe('policy/v1beta1')
  })
})
