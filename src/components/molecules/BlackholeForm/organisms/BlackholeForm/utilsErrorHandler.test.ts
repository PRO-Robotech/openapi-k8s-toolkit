/* eslint-disable @typescript-eslint/no-explicit-any */
import { handleSubmitError, handleValidationError } from './utilsErrorHandler'

describe('utilsErrorHandler', () => {
  describe('handleSubmitError', () => {
    test('expands prefixes from "is invalid:" path and merges with expandedKeys without duplicates', () => {
      const expandedKeys: any[] = [['spec'], ['metadata']]

      const error: any = {
        response: {
          data: {
            message: 'Deployment is invalid: spec.template.spec: Required value',
          },
        },
      }

      const res = handleSubmitError({ error, expandedKeys })

      // errorPath = ['spec','template','spec']
      // keys = [['spec'], ['spec','template'], ['spec','template','spec']]
      // merged with expandedKeys, keep order, dedupe
      expect(res).toEqual([['spec'], ['metadata'], ['spec', 'template'], ['spec', 'template', 'spec']])
    })

    test('returns unique expandedKeys when message does not contain "is invalid:" segment', () => {
      const expandedKeys: any[] = [['spec'], ['spec'], ['metadata']]

      const error: any = {
        response: {
          data: {
            message: 'Something else entirely',
          },
        },
      }

      const res = handleSubmitError({ error, expandedKeys })

      // No parsed path => no extra keys
      // Dedup should still occur inside expandedKeys
      expect(res).toEqual([['spec'], ['metadata']])
    })

    test('handles completely missing response/message safely', () => {
      const expandedKeys: any[] = [['spec'], ['spec']]

      const error: any = {} // no response

      const res = handleSubmitError({ error, expandedKeys })

      expect(res).toEqual([['spec']])
    })

    test('handles path with single segment', () => {
      const expandedKeys: any[] = [['metadata']]
      const error: any = {
        response: {
          data: {
            message: 'X is invalid: spec: Required value',
          },
        },
      }

      const res = handleSubmitError({ error, expandedKeys })

      expect(res).toEqual([['metadata'], ['spec']])
    })
  })

  describe('handleValidationError', () => {
    test('expands prefixes for array field names and merges with non-array keys + expandedKeys', () => {
      const expandedKeys: any[] = [['spec']] // will collide with prefixes

      const error: any = {
        errorFields: [
          {
            name: ['spec', 'containers', 0, 'image'],
            errors: ['Required'],
            warnings: [],
          },
          {
            name: 'metadata',
            errors: ['Bad'],
            warnings: [],
          },
          {
            name: ['spec', 'containers', 0, 'env', 1, 'name'],
            errors: ['Required'],
            warnings: [],
          },
          {
            name: ['spec', 'containers', 0, 'image'], // duplicate path
            errors: ['Required again'],
            warnings: [],
          },
        ],
      }

      const res = handleValidationError({ error, expandedKeys })

      // We don't need to assert exact full ordering of all prefixes,
      // but we want to ensure the important branches are covered and
      // key items exist exactly once.
      expect(res).toEqual(
        expect.arrayContaining([
          ['spec'], // from expandedKeys
          'metadata', // non-array key
          ['spec', 'containers'],
          ['spec', 'containers', 0],
          ['spec', 'containers', 0, 'image'],
          ['spec', 'containers', 0, 'env'],
          ['spec', 'containers', 0, 'env', 1],
          ['spec', 'containers', 0, 'env', 1, 'name'],
        ]),
      )

      // ensure duplicates removed for array key that appears twice
      const stringified = res.map((k: any) => (Array.isArray(k) ? JSON.stringify(k) : String(k)))
      const imagePathKey = JSON.stringify(['spec', 'containers', 0, 'image'])
      expect(stringified.filter(k => k === imagePathKey)).toHaveLength(1)
    })

    test('handles only non-array validation errors', () => {
      const expandedKeys: any[] = ['a', 'a', ['x']]

      const error: any = {
        errorFields: [
          { name: 'b', errors: ['err'], warnings: [] },
          { name: 'a', errors: ['err'], warnings: [] }, // duplicate with expandedKeys
        ],
      }

      const res = handleValidationError({ error, expandedKeys })

      // arrayedKeys empty => no prefix expansion
      // dedupe should still apply across mixed types
      expect(res).toEqual(['a', ['x'], 'b'])
    })

    test('handles empty errorFields list', () => {
      const expandedKeys: any[] = [['spec'], ['spec']]

      const error: any = {
        errorFields: [],
      }

      const res = handleValidationError({ error, expandedKeys })

      expect(res).toEqual([['spec']])
    })
  })
})
