import { DEFAULT_MENU_MAX_HEIGHT_PX, getDropdownPlacement } from './dropdownPlacement'

describe('getDropdownPlacement', () => {
  it('returns bottomLeft when there is enough space below', () => {
    const result = getDropdownPlacement({
      triggerTop: 200,
      triggerBottom: 232,
      viewportHeight: 900,
      actionsCount: 5,
    })

    expect(result.placement).toBe('bottomLeft')
    expect(result.maxMenuHeightPx).toBe(420)
  })

  it('returns topLeft when below space is insufficient and above space is larger', () => {
    const result = getDropdownPlacement({
      triggerTop: 700,
      triggerBottom: 732,
      viewportHeight: 820,
      actionsCount: 10,
    })

    expect(result.placement).toBe('topLeft')
    expect(result.maxMenuHeightPx).toBe(420)
  })

  it('keeps maxMenuHeight within available tiny viewport space', () => {
    const result = getDropdownPlacement({
      triggerTop: 28,
      triggerBottom: 40,
      viewportHeight: 100,
      actionsCount: 10,
    })

    expect(result.placement).toBe('bottomLeft')
    expect(result.maxMenuHeightPx).toBe(48)
  })

  it('returns default height fallback when geometry is invalid', () => {
    const result = getDropdownPlacement({
      triggerTop: Number.NaN,
      triggerBottom: 100,
      viewportHeight: 900,
      actionsCount: 2,
    })

    expect(result.placement).toBe('bottomLeft')
    expect(result.maxMenuHeightPx).toBe(DEFAULT_MENU_MAX_HEIGHT_PX)
  })
})
