import { validateGridCols, ANTD_GRID_TOTAL } from './gridColsValidation'

const TOLERATIONS = { component: 'Tolerations', count: 5, columns: 'Key, Operator, Value, Effect, actions' }
const TAINTS = { component: 'Taints', count: 4, columns: 'Key, Value, Effect, actions' }
const ANNOTATIONS = { component: 'Annotations', count: 3, columns: 'Key, Value, actions' }

describe('validateGridCols', () => {
  it('accepts a correctly-sized grid summing to 24', () => {
    expect(validateGridCols([8, 3, 8, 4, 1], TOLERATIONS)).toEqual({ valid: true })
    expect(validateGridCols([7, 7, 7, 3], TAINTS)).toEqual({ valid: true })
    expect(validateGridCols([11, 11, 2], ANNOTATIONS)).toEqual({ valid: true })
  })

  it('rejects too few spans — the real-world Tolerations [8, 8, 6] bug (Effect + actions wrap)', () => {
    const result = validateGridCols([8, 8, 6], TOLERATIONS)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.message).toContain('[Tolerations]')
      expect(result.message).toContain('length 3')
      expect(result.message).toContain('sum 22')
    }
  })

  it('rejects too many spans — the real-world Tolerations [4, 4, 4, 4, 4, 4] bug (left-clustered)', () => {
    const result = validateGridCols([4, 4, 4, 4, 4, 4], TOLERATIONS)
    expect(result.valid).toBe(false)
    if (!result.valid) {
      expect(result.message).toContain('length 6')
    }
  })

  it('validates each modal against its own column count', () => {
    // 5 spans is correct for Tolerations but wrong for Taints (4) and Annotations (3)
    expect(validateGridCols([6, 6, 4, 4, 4], TOLERATIONS).valid).toBe(true)
    expect(validateGridCols([6, 6, 4, 4, 4], TAINTS).valid).toBe(false)
    expect(validateGridCols([6, 6, 4, 4, 4], ANNOTATIONS).valid).toBe(false)
  })

  it('rejects spans that do not sum to 24 — over-fill and under-fill (option (i))', () => {
    expect(validateGridCols([8, 8, 8, 4, 2], TOLERATIONS).valid).toBe(false) // sum 30
    expect(validateGridCols([4, 4, 4, 4, 4], TOLERATIONS).valid).toBe(false) // sum 20
    expect(validateGridCols([10, 10, 2], ANNOTATIONS).valid).toBe(false) // sum 22
  })

  it('rejects missing / non-array / non-number cols without throwing', () => {
    expect(validateGridCols(undefined, TAINTS).valid).toBe(false)
    expect(validateGridCols(null, TAINTS).valid).toBe(false)
    expect(validateGridCols('11,11,2', ANNOTATIONS).valid).toBe(false)
    expect(validateGridCols([11, 11, '2'], ANNOTATIONS).valid).toBe(false)
    expect(validateGridCols([], TOLERATIONS).valid).toBe(false)
  })

  it('exposes the AntD grid total as a named constant', () => {
    expect(ANTD_GRID_TOTAL).toBe(24)
  })
})
