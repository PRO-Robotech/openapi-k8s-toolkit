/* eslint-disable max-lines-per-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { parseQuotaValueCpu, parseQuotaValueMemoryAndStorage } from 'utils/parseForQuotaValues'
import { prepareMinAndMaxValues } from './utils'

jest.mock('utils/parseForQuotaValues', () => ({
  parseQuotaValueCpu: jest.fn(),
  parseQuotaValueMemoryAndStorage: jest.fn(),
}))

const cpuMock = parseQuotaValueCpu as jest.Mock
const memMock = parseQuotaValueMemoryAndStorage as jest.Mock

describe('prepareMinAndMaxValues', () => {
  beforeEach(() => {
    jest.clearAllMocks()

    cpuMock.mockImplementation((v: any) => (typeof v === 'number' ? v : Number(v)))
    memMock.mockImplementation((v: any) => (typeof v === 'number' ? v : Number(v)))
  })

  test('min/max type=number returns raw values', () => {
    const minMaxAndStep = {
      min: { type: 'number', value: 1.5 },
      max: { type: 'number', value: 9.9 },
      step: 0.1,
    } as any

    const res = prepareMinAndMaxValues({
      minMaxAndStep,
      minValueObj: undefined,
      minSubstractFirstValueObj: undefined,
      minSubstractSecondValueObj: undefined,
      minAddFirstValueObj: undefined,
      minAddSecondValueObj: undefined,
      maxValueObj: undefined,
      maxSubstractFirstValueObj: undefined,
      maxSubstractSecondValueObj: undefined,
      maxAddFirstValueObj: undefined,
      maxAddSecondValueObj: undefined,
      logic: 'cpuLike',
    })

    expect(res).toEqual({ minValue: 1.5, maxValue: 9.9 })
    expect(cpuMock).not.toHaveBeenCalled()
    expect(memMock).not.toHaveBeenCalled()
  })

  test('resourceValue reads via jsonpath string keys and rounds to 1 decimal (cpuLike)', () => {
    const minMaxAndStep = {
      min: { type: 'resourceValue', keysToValue: '.spec.cpu' },
      max: { type: 'resourceValue', keysToValue: '.spec.cpuMax' },
      step: 0.1,
    } as any

    const minValueObj = { spec: { cpu: 1.234 } }
    const maxValueObj = { spec: { cpuMax: 5.678 } }

    const res = prepareMinAndMaxValues({
      minMaxAndStep,
      minValueObj,
      minSubstractFirstValueObj: undefined,
      minSubstractSecondValueObj: undefined,
      minAddFirstValueObj: undefined,
      minAddSecondValueObj: undefined,
      maxValueObj,
      maxSubstractFirstValueObj: undefined,
      maxSubstractSecondValueObj: undefined,
      maxAddFirstValueObj: undefined,
      maxAddSecondValueObj: undefined,
      logic: 'cpuLike',
    })

    // 1.234 -> 1.2, 5.678 -> 5.7
    expect(res).toEqual({ minValue: 1.2, maxValue: 5.7 })
    expect(cpuMock).toHaveBeenCalledTimes(2)
    expect(memMock).not.toHaveBeenCalled()
  })

  test('resourceValue reads via lodash path array and rounds to 1 decimal (memoryLike)', () => {
    const minMaxAndStep = {
      min: { type: 'resourceValue', keysToValue: ['spec', 'mem'] },
      max: { type: 'resourceValue', keysToValue: ['spec', 'memMax'] },
      step: 0.1,
    } as any

    const minValueObj = { spec: { mem: '2.04' } }
    const maxValueObj = { spec: { memMax: '7.06' } }

    const res = prepareMinAndMaxValues({
      minMaxAndStep,
      minValueObj,
      minSubstractFirstValueObj: undefined,
      minSubstractSecondValueObj: undefined,
      minAddFirstValueObj: undefined,
      minAddSecondValueObj: undefined,
      maxValueObj,
      maxSubstractFirstValueObj: undefined,
      maxSubstractSecondValueObj: undefined,
      maxAddFirstValueObj: undefined,
      maxAddSecondValueObj: undefined,
      logic: 'memoryLike',
    })

    // parse returns numbers, then toFixed(1)
    expect(res).toEqual({ minValue: 2.0, maxValue: 7.1 })
    expect(memMock).toHaveBeenCalledTimes(2)
    expect(cpuMock).not.toHaveBeenCalled()
  })

  test('min substractResourceValues computes and rounds to 1 decimal', () => {
    const minMaxAndStep = {
      min: {
        type: 'substractResourceValues',
        firstValuesKeysToValue: '.a',
        secondValuesKeysToValue: '.b',
      },
      max: { type: 'number', value: 10 },
      step: 0.1,
    } as any

    const minSubstractFirstValueObj = { a: 5.55 }
    const minSubstractSecondValueObj = { b: 2.22 }

    const res = prepareMinAndMaxValues({
      minMaxAndStep,
      minValueObj: undefined,
      minSubstractFirstValueObj,
      minSubstractSecondValueObj,
      minAddFirstValueObj: undefined,
      minAddSecondValueObj: undefined,
      maxValueObj: undefined,
      maxSubstractFirstValueObj: undefined,
      maxSubstractSecondValueObj: undefined,
      maxAddFirstValueObj: undefined,
      maxAddSecondValueObj: undefined,
      logic: 'cpuLike',
    })

    // 5.55 - 2.22 = 3.33 -> 3.3
    expect(res.minValue).toBe(3.3)
    expect(res.maxValue).toBe(10)
  })

  test('min addResourceValues computes and rounds to 1 decimal', () => {
    const minMaxAndStep = {
      min: {
        type: 'addResourceValues',
        firstValuesKeysToValue: ['x'],
        secondValuesKeysToValue: ['y'],
      },
      max: { type: 'number', value: 10 },
      step: 0.1,
    } as any

    const minAddFirstValueObj = { x: 1.11 }
    const minAddSecondValueObj = { y: 2.22 }

    const res = prepareMinAndMaxValues({
      minMaxAndStep,
      minValueObj: undefined,
      minSubstractFirstValueObj: undefined,
      minSubstractSecondValueObj: undefined,
      minAddFirstValueObj,
      minAddSecondValueObj,
      maxValueObj: undefined,
      maxSubstractFirstValueObj: undefined,
      maxSubstractSecondValueObj: undefined,
      maxAddFirstValueObj: undefined,
      maxAddSecondValueObj: undefined,
      logic: 'cpuLike',
    })

    // 1.11 + 2.22 = 3.33 -> 3.3
    expect(res.minValue).toBe(3.3)
    expect(res.maxValue).toBe(10)
  })

  test('max substractResourceValues computes and rounds to 1 decimal', () => {
    const minMaxAndStep = {
      min: { type: 'number', value: 0 },
      max: {
        type: 'substractResourceValues',
        firstValuesKeysToValue: '.a',
        secondValuesKeysToValue: '.b',
      },
      step: 0.1,
    } as any

    const maxSubstractFirstValueObj = { a: 9.99 }
    const maxSubstractSecondValueObj = { b: 1.11 }

    const res = prepareMinAndMaxValues({
      minMaxAndStep,
      minValueObj: undefined,
      minSubstractFirstValueObj: undefined,
      minSubstractSecondValueObj: undefined,
      minAddFirstValueObj: undefined,
      minAddSecondValueObj: undefined,
      maxValueObj: undefined,
      maxSubstractFirstValueObj,
      maxSubstractSecondValueObj,
      maxAddFirstValueObj: undefined,
      maxAddSecondValueObj: undefined,
      logic: 'cpuLike',
    })

    // 9.99 - 1.11 = 8.88 -> 8.9
    expect(res).toEqual({ minValue: 0, maxValue: 8.9 })
  })

  test('max addResourceValues computes and rounds to 1 decimal', () => {
    const minMaxAndStep = {
      min: { type: 'number', value: 0 },
      max: {
        type: 'addResourceValues',
        firstValuesKeysToValue: ['a'],
        secondValuesKeysToValue: ['b'],
      },
      step: 0.1,
    } as any

    const maxAddFirstValueObj = { a: 4.44 }
    const maxAddSecondValueObj = { b: 3.33 }

    const res = prepareMinAndMaxValues({
      minMaxAndStep,
      minValueObj: undefined,
      minSubstractFirstValueObj: undefined,
      minSubstractSecondValueObj: undefined,
      minAddFirstValueObj: undefined,
      minAddSecondValueObj: undefined,
      maxValueObj: undefined,
      maxSubstractFirstValueObj: undefined,
      maxSubstractSecondValueObj: undefined,
      maxAddFirstValueObj,
      maxAddSecondValueObj,
      logic: 'cpuLike',
    })

    // 4.44 + 3.33 = 7.77 -> 7.8
    expect(res).toEqual({ minValue: 0, maxValue: 7.8 })
  })

  test('keeps defaults (0) when required value objects are not objects', () => {
    const minMaxAndStep = {
      min: { type: 'resourceValue', keysToValue: '.a' },
      max: { type: 'resourceValue', keysToValue: '.b' },
      step: 0.1,
    } as any

    const res = prepareMinAndMaxValues({
      minMaxAndStep,
      minValueObj: null,
      minSubstractFirstValueObj: null,
      minSubstractSecondValueObj: null,
      minAddFirstValueObj: null,
      minAddSecondValueObj: null,
      maxValueObj: null,
      maxSubstractFirstValueObj: null,
      maxSubstractSecondValueObj: null,
      maxAddFirstValueObj: null,
      maxAddSecondValueObj: null,
      logic: 'cpuLike',
    })

    expect(res).toEqual({ minValue: 0, maxValue: 0 })
  })
})
