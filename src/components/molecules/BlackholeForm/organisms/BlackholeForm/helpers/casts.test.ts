/* eslint-disable max-lines-per-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { OpenAPIV2 } from 'openapi-types'
import { pathKey, pruneAdditionalForValues, materializeAdditionalFromValues } from './casts'

const makeBlocked = (paths: (string | number)[][] = []) =>
  ({
    current: new Set(paths.map(p => pathKey(p))),
  }) as any

describe('casts helpers', () => {
  describe('pathKey', () => {
    it('stringifies path deterministically', () => {
      expect(pathKey(['spec', 0, 'name'])).toBe(JSON.stringify(['spec', 0, 'name']))
    })
  })

  describe('pruneAdditionalForValues', () => {
    it('removes isAdditionalProperties fields missing from values (nested object)', () => {
      const props: OpenAPIV2.SchemaObject['properties'] = {
        spec: {
          type: 'object',
          properties: {
            keep: { type: 'string' },
            extra: { type: 'string', isAdditionalProperties: true } as any,
            nested: {
              type: 'object',
              properties: {
                keep2: { type: 'number' },
                extra2: { type: 'number', isAdditionalProperties: true } as any,
              },
            },
          },
        } as any,
      }

      const values = {
        spec: {
          keep: 'ok',
          nested: {
            keep2: 1,
          },
        },
      }

      const blocked = makeBlocked()

      const next = pruneAdditionalForValues(props, values, blocked)

      // removed
      expect((next!.spec as any).properties.extra).toBeUndefined()
      expect((next!.spec as any).properties.nested.properties.extra2).toBeUndefined()

      // kept
      expect((next!.spec as any).properties.keep).toBeDefined()
      expect((next!.spec as any).properties.nested.properties.keep2).toBeDefined()

      // immutability check
      expect((props!.spec as any).properties.extra).toBeDefined()
      expect((props!.spec as any).properties.nested.properties.extra2).toBeDefined()
    })

    it('keeps isAdditionalProperties fields when present in values', () => {
      const props: OpenAPIV2.SchemaObject['properties'] = {
        spec: {
          type: 'object',
          properties: {
            extra: { type: 'string', isAdditionalProperties: true } as any,
          },
        } as any,
      }

      const values = { spec: { extra: 'present' } }
      const blocked = makeBlocked()

      const next = pruneAdditionalForValues(props, values, blocked)

      expect((next!.spec as any).properties.extra).toBeDefined()
    })

    it('removes isAdditionalProperties fields when path is blocked even if value exists', () => {
      const props: OpenAPIV2.SchemaObject['properties'] = {
        spec: {
          type: 'object',
          properties: {
            extra: { type: 'string', isAdditionalProperties: true } as any,
            keep: { type: 'string' },
          },
        } as any,
      }

      const values = { spec: { extra: 'present', keep: 'ok' } }
      const blocked = makeBlocked([['spec', 'extra']])

      const next = pruneAdditionalForValues(props, values, blocked)

      expect((next!.spec as any).properties.extra).toBeUndefined()
      expect((next!.spec as any).properties.keep).toBeDefined()
    })

    it('covers array branch: only walks items when indexed schemaNode.properties[idx] exists', () => {
      /**
       * pruneAdditionalForValues has a specific quirk:
       * for arrays it only recurses into items if schemaNode.properties?.[idx] exists.
       * We provide that shape to exercise this branch.
       */
      const props: OpenAPIV2.SchemaObject['properties'] = {
        spec: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              keep: { type: 'string' },
              extra: { type: 'string', isAdditionalProperties: true } as any,
            },
          } as any,
          // this "properties" is non-standard, but your code checks it
          properties: {
            0: { properties: {} },
          } as any,
        } as any,
      }

      const values = {
        spec: [{ keep: 'ok' }],
      }

      const blocked = makeBlocked()

      const next = pruneAdditionalForValues(props, values, blocked)

      // Because we walk items, the additional field inside items should be pruned
      const itemsProps = (next!.spec as any).items.properties
      expect(itemsProps.extra).toBeUndefined()
      expect(itemsProps.keep).toBeDefined()
    })

    it('does not crash when array value exists but indexed schema properties are missing', () => {
      const props: OpenAPIV2.SchemaObject['properties'] = {
        spec: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              extra: { type: 'string', isAdditionalProperties: true } as any,
            },
          } as any,
          // no properties here → branch should be skipped safely
        } as any,
      }

      const values = { spec: [{ extra: 'x' }] }
      const blocked = makeBlocked()

      const next = pruneAdditionalForValues(props, values, blocked)

      // We don't assert pruning here because the array-specific walk won't run
      // without schemaNode.properties[idx]. This test is mainly for branch safety.
      expect(next).toBeDefined()
    })
  })

  describe('materializeAdditionalFromValues', () => {
    it('materializes new properties from additionalProperties and tracks toExpand', () => {
      const props: OpenAPIV2.SchemaObject['properties'] = {
        spec: {
          type: 'object',
          additionalProperties: {
            type: 'string',
          } as any,
          properties: {
            fixed: { type: 'string' },
          },
        } as any,
      }

      const values = {
        spec: {
          fixed: 'ok',
          dyn1: 'hello',
          dyn2: 'world',
        },
      }

      const blocked = makeBlocked()

      const { props: next, toExpand, toPersist } = materializeAdditionalFromValues(props, values, blocked)

      expect((next!.spec as any).properties.fixed).toBeDefined()
      expect((next!.spec as any).properties.dyn1).toBeDefined()
      expect((next!.spec as any).properties.dyn2).toBeDefined()
      expect((next!.spec as any).properties.dyn1.isAdditionalProperties).toBe(true)

      // toExpand includes the object path and each dynamic path
      expect(toExpand).toEqual(expect.arrayContaining([['spec'], ['spec', 'dyn1'], ['spec', 'dyn2']]))

      // no persist for non-empty strings
      expect(toPersist).not.toEqual(expect.arrayContaining([['spec', 'dyn1']]))
      expect(toPersist).not.toEqual(expect.arrayContaining([['spec', 'dyn2']]))

      // immutability check
      expect((props!.spec as any).properties.dyn1).toBeUndefined()
    })

    it('skips materialization for blocked paths', () => {
      const props: OpenAPIV2.SchemaObject['properties'] = {
        spec: {
          type: 'object',
          additionalProperties: {
            type: 'string',
          } as any,
          properties: {},
        } as any,
      }

      const values = { spec: { blockedKey: 'nope', okKey: 'yes' } }
      const blocked = makeBlocked([['spec', 'blockedKey']])

      const { props: next } = materializeAdditionalFromValues(props, values, blocked)

      expect((next!.spec as any).properties.blockedKey).toBeUndefined()
      expect((next!.spec as any).properties.okKey).toBeDefined()
    })

    it('merges nested additionalProperties.properties into an existing additional child', () => {
      const props: OpenAPIV2.SchemaObject['properties'] = {
        spec: {
          type: 'object',
          additionalProperties: {
            type: 'object',
            properties: {
              a: { type: 'string' },
            },
          } as any,
          properties: {
            dyn: {
              type: 'object',
              isAdditionalProperties: true,
              // intentionally missing .properties to ensure merge path is used
            } as any,
          },
        } as any,
      }

      const values = { spec: { dyn: { a: 'x' } } }
      const blocked = makeBlocked()

      const { props: next } = materializeAdditionalFromValues(props, values, blocked)

      expect((next!.spec as any).properties.dyn).toBeDefined()
      expect((next!.spec as any).properties.dyn.properties).toBeDefined()
      expect((next!.spec as any).properties.dyn.properties.a).toBeDefined()
    })

    it('tracks toPersist for empty object, empty string, 0, and empty array', () => {
      const props: OpenAPIV2.SchemaObject['properties'] = {
        spec: {
          type: 'object',
          additionalProperties: {
            type: 'object',
          } as any,
          properties: {},
        } as any,
      }

      const values = {
        spec: {
          emptyObj: {},
          emptyStr: '',
          zeroNum: 0,
          emptyArr: [],
          nonEmptyObj: { x: 1 },
          nonEmptyStr: 'x',
          nonZero: 2,
          nonEmptyArr: [1],
        },
      }

      const blocked = makeBlocked()

      const { toPersist } = materializeAdditionalFromValues(props, values, blocked)

      expect(toPersist).toEqual(
        expect.arrayContaining([
          ['spec', 'emptyObj'],
          ['spec', 'emptyStr'],
          ['spec', 'zeroNum'],
          ['spec', 'emptyArr'],
        ]),
      )

      expect(toPersist).not.toEqual(expect.arrayContaining([['spec', 'nonEmptyObj']]))
      expect(toPersist).not.toEqual(expect.arrayContaining([['spec', 'nonEmptyStr']]))
      expect(toPersist).not.toEqual(expect.arrayContaining([['spec', 'nonZero']]))
      expect(toPersist).not.toEqual(expect.arrayContaining([['spec', 'nonEmptyArr']]))
    })

    it('recurses existing properties even when additionalProperties is absent', () => {
      const props: OpenAPIV2.SchemaObject['properties'] = {
        spec: {
          type: 'object',
          properties: {
            child: {
              type: 'object',
              additionalProperties: {
                type: 'string',
              } as any,
              properties: {},
            } as any,
          },
        } as any,
      }

      const values = { spec: { child: { dyn: '' } } }
      const blocked = makeBlocked()

      const { props: next, toPersist, toExpand } = materializeAdditionalFromValues(props, values, blocked)

      expect((next!.spec as any).properties.child.properties.dyn).toBeDefined()
      expect(toExpand).toEqual(
        expect.arrayContaining([
          ['spec', 'child'],
          ['spec', 'child', 'dyn'],
        ]),
      )
      expect(toPersist).toEqual(expect.arrayContaining([['spec', 'child', 'dyn']]))
    })

    it('covers array branch and nested walks', () => {
      /**
       * Here we ensure:
       * - array length triggers toExpand on array path
       * - (schemaNode as any).properties exists so the initializer path runs
       * - items are walked
       */
      const props: OpenAPIV2.SchemaObject['properties'] = {
        spec: {
          type: 'array',
          items: {
            type: 'object',
            additionalProperties: {
              type: 'string',
            } as any,
            properties: {},
          } as any,
          properties: {} as any,
        } as any,
      }

      const values = { spec: [{ a: '' }, { b: 'x' }] }
      const blocked = makeBlocked()

      const { props: next, toExpand, toPersist } = materializeAdditionalFromValues(props, values, blocked)

      // array path expanded
      expect(toExpand).toEqual(expect.arrayContaining([['spec']]))

      // items schema gets materialized keys (on items node)
      const itemsProps = (next!.spec as any).items.properties
      expect(itemsProps.a).toBeDefined()
      expect(itemsProps.b).toBeDefined()

      // empty string inside array object should trigger persist at ['spec',0,'a']
      expect(toPersist).toEqual(expect.arrayContaining([['spec', 0, 'a']]))
      expect(toPersist).not.toEqual(expect.arrayContaining([['spec', 1, 'b']]))
    })

    it('does not crash when valueNode for object is not an object', () => {
      const props: OpenAPIV2.SchemaObject['properties'] = {
        spec: {
          type: 'object',
          additionalProperties: { type: 'string' } as any,
          properties: {},
        } as any,
      }

      const values = { spec: 'not-an-object' as any }
      const blocked = makeBlocked()

      const { props: next, toExpand, toPersist } = materializeAdditionalFromValues(props, values, blocked)

      expect(next).toBeDefined()
      expect(toExpand).toEqual([])
      expect(toPersist).toEqual([])
    })
  })
})
