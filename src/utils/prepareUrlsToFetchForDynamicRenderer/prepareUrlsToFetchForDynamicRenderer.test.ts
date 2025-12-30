/* eslint-disable @typescript-eslint/no-explicit-any */
import { prepareTemplate } from '../prepareTemplate'
import { prepareUrlsToFetchForDynamicRenderer } from './prepareUrlsToFetchForDynamicRenderer'

jest.mock('utils/prepareTemplate')

const mockPrepareTemplate = prepareTemplate as unknown as jest.Mock

describe('prepareUrlsToFetchForDynamicRenderer', () => {
  beforeEach(() => {
    jest.clearAllMocks()
  })

  test('builds replaceValues from locationPathname and calls prepareTemplate for each url', () => {
    mockPrepareTemplate.mockImplementation(({ template, replaceValues }: any) => {
      // simple deterministic output so we can assert mapping was applied
      return `${template}__0:${replaceValues['0']}__1:${replaceValues['1']}__2:${replaceValues['2']}`
    })

    const urls = ['u1:{0}/{1}/{2}', 'u2:{0}/{1}']
    const locationPathname = '/clusters/c1/ns1/pods'

    const result = prepareUrlsToFetchForDynamicRenderer({ urls, locationPathname })

    // split('/clusters/c1/ns1/pods') => ["", "clusters", "c1", "ns1", "pods"]
    const expectedReplaceValues = {
      '0': '',
      '1': 'clusters',
      '2': 'c1',
      '3': 'ns1',
      '4': 'pods',
    }

    expect(mockPrepareTemplate).toHaveBeenCalledTimes(2)
    expect(mockPrepareTemplate).toHaveBeenNthCalledWith(1, {
      template: urls[0],
      replaceValues: expectedReplaceValues,
    })
    expect(mockPrepareTemplate).toHaveBeenNthCalledWith(2, {
      template: urls[1],
      replaceValues: expectedReplaceValues,
    })

    expect(result).toEqual(['u1:{0}/{1}/{2}__0:__1:clusters__2:c1', 'u2:{0}/{1}__0:__1:clusters__2:c1'])
  })

  test('handles pathname without leading slash', () => {
    mockPrepareTemplate.mockImplementation(({ template, replaceValues }: any) => {
      return `${template}__0:${replaceValues['0']}__1:${replaceValues['1']}`
    })

    const urls = ['x/{0}/{1}']
    const locationPathname = 'a/b'

    const result = prepareUrlsToFetchForDynamicRenderer({ urls, locationPathname })

    const expectedReplaceValues = {
      '0': 'a',
      '1': 'b',
    }

    expect(mockPrepareTemplate).toHaveBeenCalledWith({
      template: 'x/{0}/{1}',
      replaceValues: expectedReplaceValues,
    })

    expect(result).toEqual(['x/{0}/{1}__0:a__1:b'])
  })

  test('works with empty urls list', () => {
    const result = prepareUrlsToFetchForDynamicRenderer({
      urls: [],
      locationPathname: '/a/b',
    })

    expect(result).toEqual([])
    expect(mockPrepareTemplate).not.toHaveBeenCalled()
  })
})
