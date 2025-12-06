import { formatLocalDate } from './utils'

describe('formatLocalDate', () => {
  let spy: jest.SpyInstance

  beforeEach(() => {
    spy = jest.spyOn(Date.prototype, 'toLocaleString').mockReturnValue('FORMATTED')
  })

  afterEach(() => {
    spy.mockRestore()
  })

  test('formats using Date.toLocaleString with expected options', () => {
    const iso = '2024-01-02T03:04:05.000Z'

    const res = formatLocalDate(iso)

    expect(res).toBe('FORMATTED')
    expect(spy).toHaveBeenCalledTimes(1)
    expect(spy).toHaveBeenCalledWith(undefined, {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: false,
    })
  })
})
