/* eslint-disable @typescript-eslint/no-explicit-any */

import { parseQuotaValueCpu, parseQuotaValueMemoryAndStorage } from '../parseForQuotaValues'
import { normalizeValuesForQuotasToNumber } from './normalizeValuesForQuotas'

jest.mock('utils/parseForQuotaValues', () => ({
  parseQuotaValueCpu: jest.fn(),
  parseQuotaValueMemoryAndStorage: jest.fn(),
}))

const mockCpu = parseQuotaValueCpu as unknown as jest.Mock
const mockMem = parseQuotaValueMemoryAndStorage as unknown as jest.Mock

describe('normalizeValuesForQuotasToNumber', () => {
  beforeEach(() => {
    jest.clearAllMocks()
    mockCpu.mockImplementation((v: any) => `cpu(${v})`)
    mockMem.mockImplementation((v: any) => `mem(${v})`)
  })

  test('normalizes cpu + memory fields based on schema type markers and does not mutate original object', () => {
    const object = {
      spec: {
        limits: {
          cpu: '500m',
          memory: '1Gi',
          untouched: 'keep',
        },
      },
      topCpu: '250m',
      topMemory: '2Gi',
      other: 'x',
    }

    const properties: any = {
      spec: {
        type: 'object',
        properties: {
          limits: {
            type: 'object',
            properties: {
              cpu: { type: 'rangeInputCpu' },
              memory: { type: 'rangeInputMemory' },
            },
          },
        },
      },
      topCpu: { type: 'rangeInputCpu' },
      topMemory: { type: 'rangeInputMemory' },
    }

    const result = normalizeValuesForQuotasToNumber(object, properties)

    // ✅ original not mutated (deep clone)
    expect(object.spec.limits.cpu).toBe('500m')
    expect(object.spec.limits.memory).toBe('1Gi')
    expect(object.topCpu).toBe('250m')
    expect(object.topMemory).toBe('2Gi')

    // ✅ cleaned paths remove "properties" segments
    // expected clean paths:
    // ['spec','limits','cpu'], ['spec','limits','memory'], ['topCpu'], ['topMemory']
    expect(result.spec.limits.cpu).toBe('cpu(500m)')
    expect(result.spec.limits.memory).toBe('mem(1Gi)')
    expect(result.topCpu).toBe('cpu(250m)')
    expect(result.topMemory).toBe('mem(2Gi)')

    // ✅ parsers called with correct raw values
    expect(mockCpu).toHaveBeenCalledWith('500m')
    expect(mockCpu).toHaveBeenCalledWith('250m')
    expect(mockMem).toHaveBeenCalledWith('1Gi')
    expect(mockMem).toHaveBeenCalledWith('2Gi')
  })

  test('does not set values for paths that exist in schema but are missing in object', () => {
    const object = {
      spec: { limits: { cpu: '100m' } },
    }

    const properties: any = {
      spec: {
        type: 'object',
        properties: {
          limits: {
            type: 'object',
            properties: {
              cpu: { type: 'rangeInputCpu' },
              memory: { type: 'rangeInputMemory' }, // object missing this
            },
          },
        },
      },
    }

    const result = normalizeValuesForQuotasToNumber(object, properties)

    expect(result.spec.limits.cpu).toBe('cpu(100m)')
    expect(result.spec.limits.memory).toBeUndefined()

    expect(mockCpu).toHaveBeenCalledTimes(1)
    expect(mockMem).toHaveBeenCalledTimes(0)
  })

  test('converts when value is 0 (value || value === 0 guard)', () => {
    const object = {
      spec: { limits: { cpu: 0, memory: 0 } },
    }

    const properties: any = {
      spec: {
        type: 'object',
        properties: {
          limits: {
            type: 'object',
            properties: {
              cpu: { type: 'rangeInputCpu' },
              memory: { type: 'rangeInputMemory' },
            },
          },
        },
      },
    }

    const result = normalizeValuesForQuotasToNumber(object, properties)

    expect(result.spec.limits.cpu).toBe('cpu(0)')
    expect(result.spec.limits.memory).toBe('mem(0)')

    expect(mockCpu).toHaveBeenCalledWith(0)
    expect(mockMem).toHaveBeenCalledWith(0)
  })

  test('ignores non-object properties input safely', () => {
    const object = { cpu: '100m' }

    const result = normalizeValuesForQuotasToNumber(object, undefined as any)

    // No schema => no paths => returned clone equals original shape
    expect(result).toEqual(object)
    expect(mockCpu).not.toHaveBeenCalled()
    expect(mockMem).not.toHaveBeenCalled()
  })
})
