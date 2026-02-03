/* eslint-disable no-restricted-syntax */
// urlParsers.test.ts
import _ from 'lodash'
import jp from 'jsonpath'
import { prepareTemplate } from 'utils/prepareTemplate'
import {
  parsePartsOfUrl,
  parseMutliqueryText,
  parseJsonPathTemplate,
  parseWithoutPartsOfUrl,
  parseAll,
  parsePromTemplate,
} from './utils'

// Mock prepareTemplate so we can assert interactions easily
jest.mock('utils/prepareTemplate', () => ({
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  prepareTemplate: jest.fn(({ template, replaceValues }) => {
    // Simple transparent mock: just return the template for easy assertions
    // You can adjust this if you need to simulate real behaviour.
    return template
  }),
}))

const prepareTemplateMock = prepareTemplate as jest.Mock

describe('parsePartsOfUrl', () => {
  beforeEach(() => {
    prepareTemplateMock.mockClear()
  })

  it('delegates to prepareTemplate with template and replaceValues', () => {
    const template = 'https://example.com/{{id}}'
    const replaceValues = { id: '123' }

    const result = parsePartsOfUrl({ template, replaceValues })

    expect(prepareTemplateMock).toHaveBeenCalledTimes(1)
    expect(prepareTemplateMock).toHaveBeenCalledWith({ template, replaceValues })
    // our mock returns template directly
    expect(result).toBe(template)
  })
})

describe('parseMutliqueryText', () => {
  it('returns empty string when text is undefined', () => {
    const result = parseMutliqueryText({
      text: undefined,
      multiQueryData: {},
    })
    expect(result).toBe('')
  })

  it('replaces a simple single-key placeholder', () => {
    const multiQueryData = {
      req0: { foo: 'bar' },
    }

    const text = 'Hello {reqs[0]["foo"]} world'
    const result = parseMutliqueryText({ text, multiQueryData })

    expect(result).toBe('Hello bar world')
  })

  it('replaces a deep path with multiple keys and mixed quotes', () => {
    const multiQueryData = {
      req1: { a: { b: { c: 'deep-value' } } },
    }

    const text = "Value: {reqs[1]['a', \"b\", 'c']}"
    const result = parseMutliqueryText({ text, multiQueryData })

    expect(result).toBe('Value: deep-value')
  })

  it('uses inline fallback when path exists but is null', () => {
    const multiQueryData = {
      req0: { foo: null },
    }

    const text = 'Value: {reqs[0]["foo"]["MyFallback"]}'
    const result = parseMutliqueryText({ text, multiQueryData })

    // null should be replaced by the inline fallback
    expect(result).toBe('Value: MyFallback')
  })

  it('uses inline fallback when path is missing', () => {
    const multiQueryData = {
      req0: {},
    }

    const text = 'Value: {reqs[0]["missing"]["InlineFallback"]}'
    const result = parseMutliqueryText({ text, multiQueryData })

    // lodash.get default param will give "InlineFallback"
    expect(result).toBe('Value: InlineFallback')
  })

  it('uses default "Undefined with no fallback" when value is missing and no fallback or customFallback', () => {
    const multiQueryData = {
      req0: {},
    }

    const text = 'Value: {reqs[0]["missing"]}'
    const result = parseMutliqueryText({ text, multiQueryData })

    expect(result).toBe('Value: Undefined with no fallback')
  })

  it('uses customFallback when value is undefined or null', () => {
    const multiQueryData = {
      req0: { someKey: undefined },
    }

    // note: no inline fallback here
    const text = 'Value: {reqs[0]["someKey"]}'
    const result = parseMutliqueryText({
      text,
      multiQueryData,
      customFallback: 'CUSTOM-FB',
    })

    expect(result).toBe('Value: CUSTOM-FB')
  })

  it('leaves placeholder unchanged when an error is thrown', () => {
    const multiQueryData = {
      req0: { foo: 'bar' },
    }

    const text = 'Value: {reqs[0]["foo"]}'
    const spy = jest.spyOn(_, 'get').mockImplementation(() => {
      throw new Error('boom')
    })

    const result = parseMutliqueryText({ text, multiQueryData })

    expect(result).toBe(text) // original match is preserved on error

    spy.mockRestore()
  })
})

describe('parseJsonPathTemplate', () => {
  it('returns empty string when text is undefined', () => {
    const result = parseJsonPathTemplate({
      text: undefined,
      multiQueryData: {},
    })
    expect(result).toBe('')
  })

  it('resolves JSONPath against the correct req index', () => {
    const multiQueryData = {
      req0: { foo: { bar: 'baz' } },
    }

    const text = 'Value: {reqsJsonPath[0][".foo.bar"]}'
    const result = parseJsonPathTemplate({ text, multiQueryData })

    expect(result).toBe('Value: baz')
  })

  it('uses inline fallback when req index is missing and no customFallback', () => {
    const multiQueryData = {}

    const text = 'Value: {reqsJsonPath[0][".foo.bar"]["INLINE-FB"]}'
    const result = parseJsonPathTemplate({ text, multiQueryData })

    expect(result).toBe('Value: INLINE-FB')
  })

  it('uses customFallback when req index is missing', () => {
    const multiQueryData = {}

    const text = 'Value: {reqsJsonPath[0][".foo.bar"]["INLINE-FB"]}'
    const result = parseJsonPathTemplate({
      text,
      multiQueryData,
      customFallback: 'CUSTOM-FB',
    })

    expect(result).toBe('Value: CUSTOM-FB')
  })

  it('uses fallback when JSONPath returns empty array', () => {
    const multiQueryData = {
      req0: { foo: { bar: 'baz' } },
    }

    const spy = jest.spyOn(jp, 'query').mockReturnValue([])

    const text = 'Value: {reqsJsonPath[0][".foo.missing"]["INLINE"]}'
    const result = parseJsonPathTemplate({ text, multiQueryData })

    expect(result).toBe('Value: INLINE')

    spy.mockRestore()
  })

  it('uses customFallback when JSONPath returns empty array and customFallback is provided', () => {
    const multiQueryData = {
      req0: { foo: { bar: 'baz' } },
    }

    const spy = jest.spyOn(jp, 'query').mockReturnValue([])

    const text = 'Value: {reqsJsonPath[0][".foo.missing"]["INLINE"]}'
    const result = parseJsonPathTemplate({
      text,
      multiQueryData,
      customFallback: 'CUSTOM-FB',
    })

    expect(result).toBe('Value: CUSTOM-FB')

    spy.mockRestore()
  })

  it('stringifies the first JSONPath result', () => {
    const multiQueryData = {
      req0: { list: [1, 2, 3] },
    }

    const text = 'First: {reqsJsonPath[0][".list[1]"]}'
    const result = parseJsonPathTemplate({ text, multiQueryData })

    expect(result).toBe('First: 2')
  })

  it('leaves placeholder unchanged when JSONPath throws', () => {
    const multiQueryData = {
      req0: { foo: { bar: 'baz' } },
    }

    const text = 'Value: {reqsJsonPath[0][".foo.bar"]}'
    const spy = jest.spyOn(jp, 'query').mockImplementation(() => {
      throw new Error('boom')
    })

    const result = parseJsonPathTemplate({ text, multiQueryData })

    expect(result).toBe(text)

    spy.mockRestore()
  })

  it('resolves nested JSONPath expressions inside JSONPath correctly', () => {
    const multiQueryData = {
      req0: {
        some: { path: '.deep.value' },
        deep: { value: 'FINAL' },
      },
    }

    const text = `Value: {reqsJsonPath[0]["{reqsJsonPath[0]['.some.path']}"]}`

    const result = parseJsonPathTemplate({
      text,
      multiQueryData,
    })

    expect(result).toBe('Value: FINAL')
  })
})

describe('parseWithoutPartsOfUrl', () => {
  it('chains parseMutliqueryText and parseJsonPathTemplate for mixed placeholders', () => {
    const multiQueryData = {
      req0: {
        foo: 'bar',
        json: { items: [{ name: 'item-1' }] },
      },
    }

    const text = 'Foo={reqs[0]["foo"]}&Name={reqsJsonPath[0][".json.items[0].name"]}'
    const result = parseWithoutPartsOfUrl({
      text,
      multiQueryData,
    })

    expect(result).toBe('Foo=bar&Name=item-1')
  })

  it('applies customFallback across both multiquery and JSONPath placeholders', () => {
    const multiQueryData = {
      req0: {},
    }

    const text = 'Foo={reqs[0]["missing"]}&Name={reqsJsonPath[0][".missing"]["INLINE"]}'
    const result = parseWithoutPartsOfUrl({
      text,
      multiQueryData,
      customFallback: 'CF',
    })

    expect(result).toBe('Foo=CF&Name=CF')
  })
})

describe('parseAll', () => {
  beforeEach(() => {
    prepareTemplateMock.mockClear()
    // ensure mock returns template unchanged for easier expectations
    prepareTemplateMock.mockImplementation(({ template }) => template)
  })

  it('chains multiquery, JSONPath, and prepareTemplate with replaceValues', () => {
    const multiQueryData = {
      req0: {
        foo: 'bar',
        json: { name: 'json-name' },
      },
    }

    const text = 'id={{id}}&foo={reqs[0]["foo"]}&name={reqsJsonPath[0][".json.name"]}'
    const replaceValues = {
      id: '123',
    }

    const result = parseAll({
      text,
      replaceValues,
      multiQueryData,
    })

    // Because our prepareTemplate mock returns the template unchanged,
    // parseAll's result is the intermediate template after multiquery/JSONPath.
    const expectedTemplate = 'id={{id}}&foo=bar&name=json-name'
    expect(result).toBe(expectedTemplate)

    // We don't care how many times prepareTemplate was called total
    expect(prepareTemplateMock).toHaveBeenCalled()

    // Assert that the LAST call was for the final full template
    const lastCallArgs = prepareTemplateMock.mock.calls[prepareTemplateMock.mock.calls.length - 1][0]

    expect(lastCallArgs).toEqual({
      template: expectedTemplate,
      replaceValues,
    })
  })
})

it('supports {7} placeholder inside JSONPath expressions via replaceValues', () => {
  const multiQueryData = {
    req0: {
      spec: {
        containers: [
          { name: 'nginx', readinessProbe: 'READY' },
          { name: 'other', readinessProbe: 'NOT_READY' },
        ],
      },
    },
  }

  // JSONPath contains {7} in the name predicate
  const text = 'probe={reqsJsonPath[0][".spec.containers[?(@.name==\'{7}\')].readinessProbe"]}'

  const replaceValues = {
    '7': 'nginx',
  }

  // For this test, make prepareTemplate actually replace {7}
  prepareTemplateMock.mockImplementation(({ template, replaceValues }) => {
    let result = template
    if (replaceValues) {
      for (const [key, value] of Object.entries(replaceValues)) {
        result = result.replace(`{${key}}`, value ?? '')
      }
    }
    return result
  })

  const jpSpy = jest.spyOn(jp, 'query')

  const result = parseAll({
    text,
    replaceValues,
    multiQueryData,
  })

  // JSONPath should have been called with name == 'nginx'
  expect(jpSpy).toHaveBeenCalled()
  const jsonPathUsed = jpSpy.mock.calls[0][1] as string
  expect(jsonPathUsed).toContain('nginx')

  // And the final resolved value should be the readinessProbe
  expect(result).toBe('probe=READY')

  jpSpy.mockRestore()
})

describe('parsePromTemplate', () => {
  it('preserves prom label braces and resolves reqsJsonPath placeholders', () => {
    const multiQueryData = {
      req0: {
        items: [{ metadata: { name: 'node-1' } }],
      },
    }

    const text =
      'sum(kube_pod_container_resource_limits{resource="memory",node=~"{reqsJsonPath[0][\'.items.0.metadata.name\'][\'-\']}"})'

    const result = parsePromTemplate({
      text,
      replaceValues: {},
      multiQueryData,
    })

    expect(result).toBe('sum(kube_pod_container_resource_limits{resource="memory",node=~"node-1"})')
  })
})
