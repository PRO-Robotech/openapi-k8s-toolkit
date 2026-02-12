/* eslint-disable max-lines-per-function */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React from 'react'
import { Form } from 'antd'
import { render, screen } from '@testing-library/react'
import '@testing-library/jest-dom'

// -----------------------------
// Import module under test
// -----------------------------
import {
  getStringFormItemFromSwagger,
  getEnumStringFormItemFromSwagger,
  getNumberFormItemFromSwagger,
  getRangeInputFormItemFromSwagger,
  getListInputFormItemFromSwagger,
  getStringMultilineFormItemFromSwagger,
  getBooleanFormItemFromSwagger,
  getArrayFormItemFromSwagger,
  getObjectFormItemsDraft,
  getObjectFormItemFromSwagger,
} from './utils'

// -----------------------------
// Controlled globals for mocks
// -----------------------------
let resetedFormListFields: Array<{ key: number; name: number }> = [{ key: 1, name: 0 }]
let resetedFormListErrors: any[] = []
let resetedFormListLastRules: any[] | undefined
const addFn = jest.fn()
const removeFn = jest.fn()

// -----------------------------
// Mock utils
// -----------------------------
const getSortedPropertyKeysMock = jest.fn()
jest.mock('./helpers/getSortedPropertyKeys', () => ({
  getSortedPropertyKeys: (args: any) => getSortedPropertyKeysMock(args),
}))

const getStringByNameMock = jest.fn()
jest.mock('utils/getStringByName', () => ({
  getStringByName: (name: any) => getStringByNameMock(name),
}))

const deepMergeMock = jest.fn()
jest.mock('utils/deepMerge', () => ({
  deepMerge: (...args: any[]) => deepMergeMock(...args),
}))

// -----------------------------
// Mock atoms
// -----------------------------
jest.mock('../../atoms', () => ({
  ResetedFormItem: ({ children }: any) => <div data-testid="reseted-form-item">{children}</div>,
  ArrayInsideContainer: ({ children }: any) => <div data-testid="array-inside">{children}</div>,
  HiddenContainer: ({ children, name }: any) => (
    <div data-testid="hidden-container" data-name={JSON.stringify(name)}>
      {children}
    </div>
  ),
}))

// -----------------------------
// Mock PlusIcon
// -----------------------------
jest.mock('components/atoms', () => ({
  PlusIcon: () => <span data-testid="plus-icon">+</span>,
}))

// -----------------------------
// Mock molecules (as jest.fn to inspect props)
// -----------------------------
const FormNamespaceInputMock = jest.fn((props: any) => (
  <div data-testid="namespace-input" data-name={JSON.stringify(props.name)} />
))
const FormStringInputMock = jest.fn((props: any) => (
  <div data-testid="string-input" data-name={JSON.stringify(props.name)} />
))
const FormEnumStringInputMock = jest.fn((props: any) => (
  <div data-testid="enum-string-input" data-name={JSON.stringify(props.name)} />
))
const FormNumberInputMock = jest.fn((props: any) => (
  <div data-testid="number-input" data-name={JSON.stringify(props.name)} />
))
const FormRangeInputMock = jest.fn((props: any) => (
  <div data-testid="range-input" data-name={JSON.stringify(props.name)} />
))
const FormListInputMock = jest.fn((props: any) => (
  <div data-testid="list-input" data-name={JSON.stringify(props.name)} />
))
const FormStringMultilineInputMock = jest.fn((props: any) => (
  <div data-testid="multiline-input" data-name={JSON.stringify(props.name)} data-base64={String(!!props.isBase64)} />
))
const FormBooleanInputMock = jest.fn((props: any) => (
  <div data-testid="boolean-input" data-name={JSON.stringify(props.name)} />
))
const FormArrayHeaderMock = jest.fn((props: any) => (
  <div data-testid="array-header" data-name={JSON.stringify(props.name)} />
))
const FormInlineYamlEditorMock = jest.fn((props: any) => (
  <div data-testid="inline-yaml-editor" data-path={JSON.stringify(props.path)} />
))

const FormObjectFromSwaggerMock = jest.fn((props: any) => (
  <div
    data-testid="object-from-swagger"
    data-collapse-title={String(props.collapseTitle ?? '')}
    data-collapse-form={JSON.stringify(props.collapseFormName)}
    data-has-input-props={String(!!props.inputProps)}
  >
    {props.data}
  </div>
))

jest.mock('../../molecules', () => ({
  FormNamespaceInput: (props: any) => FormNamespaceInputMock(props),
  FormStringInput: (props: any) => FormStringInputMock(props),
  FormEnumStringInput: (props: any) => FormEnumStringInputMock(props),
  FormNumberInput: (props: any) => FormNumberInputMock(props),
  FormRangeInput: (props: any) => FormRangeInputMock(props),
  FormListInput: (props: any) => FormListInputMock(props),
  FormStringMultilineInput: (props: any) => FormStringMultilineInputMock(props),
  FormBooleanInput: (props: any) => FormBooleanInputMock(props),
  FormObjectFromSwagger: (props: any) => FormObjectFromSwaggerMock(props),
  FormArrayHeader: (props: any) => FormArrayHeaderMock(props),
  FormInlineYamlEditor: (props: any) => FormInlineYamlEditorMock(props),
}))

// -----------------------------
// Mock styled ResetedFormList
// -----------------------------
jest.mock('./styled', () => {
  const ResetedFormList = (props: any) => {
    const { children, name, rules } = props
    resetedFormListLastRules = rules
    return (
      <div data-testid="reseted-form-list" data-list-name={JSON.stringify(name)} data-has-rules={String(!!rules)}>
        {typeof children === 'function'
          ? children(resetedFormListFields, { add: addFn, remove: removeFn }, { errors: resetedFormListErrors })
          : children}
      </div>
    )
  }

  return {
    Styled: {
      ResetedFormList,
    },
  }
})

// -----------------------------
// Shared helpers
// -----------------------------
const removeField = jest.fn()
const addField = jest.fn()
const persistedControls = {
  onPersistMark: jest.fn(),
  onPersistUnmark: jest.fn(),
  persistedKeys: [],
} as any
const expandedControls = {
  onExpandOpen: jest.fn(),
  onExpandClose: jest.fn(),
  expandedKeys: [],
} as any
const urlParams = {} as any

beforeEach(() => {
  jest.clearAllMocks()

  resetedFormListFields = [{ key: 1, name: 0 }]
  resetedFormListErrors = []
  resetedFormListLastRules = undefined

  // CRUCIAL: safe default per-call implementation for recursion
  getSortedPropertyKeysMock.mockImplementation(({ properties }: any) => Object.keys(properties ?? {}))

  getStringByNameMock.mockImplementation((name: any) =>
    Array.isArray(name) ? String(name[name.length - 1]) : String(name),
  )

  deepMergeMock.mockImplementation((a: any, b: any) => ({ ...a, ...b }))
})

// ------------------------------------------------------
// Leaf field helpers
// ------------------------------------------------------
describe('leaf form item helpers', () => {
  test('getStringFormItemFromSwagger returns FormNamespaceInput for metadata.namespace with namespaceData', () => {
    const el = getStringFormItemFromSwagger({
      name: ['metadata', 'namespace'] as any,
      namespaceData: { disabled: false, selectValues: [], filterSelectOptions: jest.fn() } as any,
      removeField,
      persistedControls,
    })

    render(<div>{el}</div>)
    expect(screen.getByTestId('namespace-input')).toBeInTheDocument()
    expect(FormNamespaceInputMock).toHaveBeenCalled()
    expect(FormStringInputMock).not.toHaveBeenCalled()
  })

  test('getStringFormItemFromSwagger returns FormStringInput default', () => {
    const el = getStringFormItemFromSwagger({
      name: ['spec', 'name'] as any,
      removeField,
      persistedControls,
    })
    render(<div>{el}</div>)
    expect(screen.getByTestId('string-input')).toBeInTheDocument()
  })

  test('getEnumStringFormItemFromSwagger returns FormEnumStringInput', () => {
    const el = getEnumStringFormItemFromSwagger({
      name: ['spec', 'mode'] as any,
      options: ['Auto', 'Manual'],
      removeField,
      persistedControls,
    })
    render(<div>{el}</div>)
    expect(screen.getByTestId('enum-string-input')).toBeInTheDocument()
  })

  test('getNumberFormItemFromSwagger returns FormNumberInput', () => {
    const el = getNumberFormItemFromSwagger({
      isNumber: true,
      name: ['spec', 'replicas'] as any,
      removeField,
      persistedControls,
    })
    render(<div>{el}</div>)
    expect(screen.getByTestId('number-input')).toBeInTheDocument()
  })

  test('getRangeInputFormItemFromSwagger returns FormRangeInput', () => {
    const el = getRangeInputFormItemFromSwagger({
      name: ['spec', 'cpu'] as any,
      isEdit: true,
      customProps: {} as any,
      urlParams,
      persistedControls,
    })
    render(<div>{el}</div>)
    expect(screen.getByTestId('range-input')).toBeInTheDocument()
  })

  test('getListInputFormItemFromSwagger returns FormListInput', () => {
    const el = getListInputFormItemFromSwagger({
      name: ['spec', 'labels'] as any,
      customProps: {} as any,
      urlParams,
      removeField,
      persistedControls,
    })
    render(<div>{el}</div>)
    expect(screen.getByTestId('list-input')).toBeInTheDocument()
  })

  test('getStringMultilineFormItemFromSwagger returns FormStringMultilineInput with base64 flag', () => {
    const el = getStringMultilineFormItemFromSwagger({
      name: ['spec', 'data'] as any,
      isBase64: true,
      removeField,
      persistedControls,
    })
    render(<div>{el}</div>)
    expect(screen.getByTestId('multiline-input')).toBeInTheDocument()
    expect(FormStringMultilineInputMock.mock.calls[0][0].isBase64).toBe(true)
  })

  test('getBooleanFormItemFromSwagger returns FormBooleanInput', () => {
    const el = getBooleanFormItemFromSwagger({
      name: ['spec', 'enabled'] as any,
      removeField,
    })
    render(<div>{el}</div>)
    expect(screen.getByTestId('boolean-input')).toBeInTheDocument()
  })
})

// ------------------------------------------------------
// Array helper coverage
// ------------------------------------------------------
describe('getArrayFormItemFromSwagger', () => {
  test('returns null if schema.type is not array', () => {
    const el = getArrayFormItemFromSwagger({
      schema: { type: 'string' } as any,
      name: ['spec', 'oops'] as any,
      addField,
      removeField,
      isEdit: true,
      expandedControls,
      persistedControls,
      urlParams,
    })
    expect(el).toBeNull()
  })

  test('renders array header + list and applies "required" rules when not forceNonRequired', () => {
    const el = getArrayFormItemFromSwagger({
      schema: { type: 'array', items: { type: 'string' } } as any,
      name: ['spec', 'names'] as any,
      required: ['names'],
      forceNonRequired: false,
      addField,
      removeField,
      isEdit: true,
      expandedControls,
      persistedControls,
      urlParams,
    })

    render(<div>{el}</div>)

    expect(screen.getByTestId('array-header')).toBeInTheDocument()
    expect(screen.getByTestId('reseted-form-list')).toBeInTheDocument()
    expect(screen.getByTestId('reseted-form-list')).toHaveAttribute('data-has-rules', 'true')
    expect(screen.getByTestId('string-input')).toBeInTheDocument()
  })

  test('required array validator returns pretty-printed message', async () => {
    const el = getArrayFormItemFromSwagger({
      schema: { type: 'array', items: { type: 'string' } } as any,
      name: ['spec', 'names'] as any,
      required: ['names'],
      forceNonRequired: false,
      addField,
      removeField,
      isEdit: true,
      expandedControls,
      persistedControls,
      urlParams,
    })

    render(<div>{el}</div>)

    const validator = resetedFormListLastRules?.[0]?.validator
    expect(typeof validator).toBe('function')
    await expect(validator({}, undefined)).rejects.toThrow('Please enter spec.names')
  })

  test('array of numbers routes to FormNumberInput', () => {
    const el = getArrayFormItemFromSwagger({
      schema: { type: 'array', items: { type: 'integer' } } as any,
      name: ['spec', 'ints'] as any,
      addField,
      removeField,
      isEdit: true,
      expandedControls,
      persistedControls,
      urlParams,
    })

    render(<div>{el}</div>)
    expect(screen.getByTestId('number-input')).toBeInTheDocument()
  })

  test('array of range inputs routes to FormRangeInput', () => {
    const el = getArrayFormItemFromSwagger({
      schema: { type: 'array', items: { type: 'rangeInputCpu', customProps: {} } } as any,
      name: ['spec', 'cpuRanges'] as any,
      addField,
      removeField,
      isEdit: true,
      expandedControls,
      persistedControls,
      urlParams,
    })

    render(<div>{el}</div>)
    expect(screen.getByTestId('range-input')).toBeInTheDocument()
  })

  test('array of listInput routes to FormListInput', () => {
    const el = getArrayFormItemFromSwagger({
      schema: { type: 'array', items: { type: 'listInput', customProps: {} } } as any,
      name: ['spec', 'list'] as any,
      addField,
      removeField,
      isEdit: true,
      expandedControls,
      persistedControls,
      urlParams,
    })

    render(<div>{el}</div>)
    expect(screen.getByTestId('list-input')).toBeInTheDocument()
  })

  test('array of multilineStringBase64 routes to FormStringMultilineInput', () => {
    const el = getArrayFormItemFromSwagger({
      schema: { type: 'array', items: { type: 'multilineStringBase64' } } as any,
      name: ['spec', 'ml'] as any,
      addField,
      removeField,
      isEdit: true,
      expandedControls,
      persistedControls,
      urlParams,
    })

    render(<div>{el}</div>)
    expect(screen.getByTestId('multiline-input')).toBeInTheDocument()
  })

  test('array of booleans routes to FormBooleanInput', () => {
    const el = getArrayFormItemFromSwagger({
      schema: { type: 'array', items: { type: 'boolean' } } as any,
      name: ['spec', 'flags'] as any,
      addField,
      removeField,
      isEdit: true,
      expandedControls,
      persistedControls,
      urlParams,
    })

    render(<div>{el}</div>)
    expect(screen.getByTestId('boolean-input')).toBeInTheDocument()
  })

  test('nested array routes recursively (array of arrays)', () => {
    const el = getArrayFormItemFromSwagger({
      schema: { type: 'array', items: { type: 'array', items: { type: 'string' } } } as any,
      name: ['spec', 'matrix'] as any,
      addField,
      removeField,
      isEdit: true,
      expandedControls,
      persistedControls,
      urlParams,
    })

    render(<div>{el}</div>)
    expect(screen.getAllByTestId('reseted-form-list').length).toBeGreaterThanOrEqual(2)
  })

  test('array of objects with enum field as property is covered', () => {
    resetedFormListFields = [{ key: 5, name: 0 }]

    const el = getArrayFormItemFromSwagger({
      schema: {
        type: 'array',
        items: {
          type: 'object',
          required: ['mode'],
          properties: {
            mode: { type: 'string', enum: ['Auto', 'Manual'] },
            name: { type: 'string' },
          },
        },
      } as any,
      name: ['spec', 'rules'] as any,
      addField,
      removeField,
      isEdit: true,
      expandedControls,
      persistedControls,
      urlParams,
    })

    render(<div>{el}</div>)

    expect(screen.getAllByTestId('object-from-swagger').length).toBeGreaterThan(0)
    expect(FormEnumStringInputMock).toHaveBeenCalled()
    expect(FormStringInputMock).toHaveBeenCalled()
  })

  test('array object branch merges additionalProperties per index using deepMerge', () => {
    resetedFormListFields = [{ key: 5, name: 0 }]

    const entryProps = { mode: { type: 'string' } }
    const additionalPropsForIndex = { extra: { type: 'string' } }

    const el = getArrayFormItemFromSwagger({
      schema: {
        type: 'array',
        items: { type: 'object', properties: entryProps },
        properties: { 5: { properties: additionalPropsForIndex } },
      } as any,
      name: ['spec', 'objs'] as any,
      addField,
      removeField,
      isEdit: true,
      expandedControls,
      persistedControls,
      urlParams,
    })

    render(<div>{el}</div>)

    expect(deepMergeMock).toHaveBeenCalledWith(entryProps, additionalPropsForIndex)
  })
})

// ------------------------------------------------------
// Object draft routing coverage
// ------------------------------------------------------
describe('getObjectFormItemsDraft', () => {
  test('handles x-kubernetes-preserve-unknown-fields branch', () => {
    const properties = {
      raw: { type: 'object', description: 'raw data', 'x-kubernetes-preserve-unknown-fields': true },
    } as any

    getSortedPropertyKeysMock.mockReturnValueOnce(['raw'])

    const el = getObjectFormItemsDraft({
      properties,
      name: ['spec'] as any,
      required: [],
      addField,
      removeField,
      isEdit: true,
      expandedControls,
      persistedControls,
      urlParams,
    })

    render(<Form>{el}</Form>)

    expect(FormObjectFromSwaggerMock).toHaveBeenCalled()
    expect(screen.getByTestId('inline-yaml-editor')).toBeInTheDocument()
  })

  test('routes enum string property', () => {
    const properties = { mode: { type: 'string', enum: ['A', 'B'] } } as any

    const el = getObjectFormItemsDraft({
      properties,
      name: ['spec'] as any,
      required: ['mode'],
      addField,
      removeField,
      isEdit: true,
      expandedControls,
      persistedControls,
      urlParams,
    })

    render(<div>{el}</div>)
    expect(screen.getByTestId('enum-string-input')).toBeInTheDocument()
  })

  test('routes string property', () => {
    const properties = { name: { type: 'string', description: 'n' } } as any

    const el = getObjectFormItemsDraft({
      properties,
      name: ['spec'] as any,
      required: ['name'],
      addField,
      removeField,
      isEdit: true,
      expandedControls,
      persistedControls,
      urlParams,
    })

    render(<div>{el}</div>)
    expect(screen.getByTestId('string-input')).toBeInTheDocument()
  })

  test('routes x-kubernetes-int-or-string branch', () => {
    const properties = { size: { type: 'string', 'x-kubernetes-int-or-string': true } } as any

    const el = getObjectFormItemsDraft({
      properties,
      name: ['spec'] as any,
      required: [],
      addField,
      removeField,
      isEdit: true,
      expandedControls,
      persistedControls,
      urlParams,
    })

    render(<div>{el}</div>)
    expect(screen.getByTestId('string-input')).toBeInTheDocument()
  })

  test('routes number/integer', () => {
    const properties = { replicas: { type: 'integer' } } as any

    const el = getObjectFormItemsDraft({
      properties,
      name: ['spec'] as any,
      required: ['replicas'],
      addField,
      removeField,
      isEdit: true,
      expandedControls,
      persistedControls,
      urlParams,
    })

    render(<div>{el}</div>)
    expect(screen.getByTestId('number-input')).toBeInTheDocument()
  })

  test('routes range input', () => {
    const properties = { cpu: { type: 'rangeInputCpu', customProps: {} } } as any

    const el = getObjectFormItemsDraft({
      properties,
      name: ['spec'] as any,
      required: [],
      addField,
      removeField,
      isEdit: true,
      expandedControls,
      persistedControls,
      urlParams,
    })

    render(<div>{el}</div>)
    expect(screen.getByTestId('range-input')).toBeInTheDocument()
  })

  test('routes listInput', () => {
    const properties = { tags: { type: 'listInput', customProps: {} } } as any

    const el = getObjectFormItemsDraft({
      properties,
      name: ['spec'] as any,
      required: [],
      addField,
      removeField,
      isEdit: true,
      expandedControls,
      persistedControls,
      urlParams,
    })

    render(<div>{el}</div>)
    expect(screen.getByTestId('list-input')).toBeInTheDocument()
  })

  test('routes multilineString + multilineStringBase64', () => {
    const properties = {
      a: { type: 'multilineString' },
      b: { type: 'multilineStringBase64' },
    } as any

    const el = getObjectFormItemsDraft({
      properties,
      name: ['spec'] as any,
      required: [],
      addField,
      removeField,
      isEdit: true,
      expandedControls,
      persistedControls,
      urlParams,
    })

    render(<div>{el}</div>)
    expect(FormStringMultilineInputMock).toHaveBeenCalled()
  })

  test('routes boolean', () => {
    const properties = { enabled: { type: 'boolean' } } as any

    const el = getObjectFormItemsDraft({
      properties,
      name: ['spec'] as any,
      required: [],
      addField,
      removeField,
      isEdit: true,
      expandedControls,
      persistedControls,
      urlParams,
    })

    render(<div>{el}</div>)
    expect(screen.getByTestId('boolean-input')).toBeInTheDocument()
  })

  test('routes array property', () => {
    const properties = { names: { type: 'array', items: { type: 'string' } } } as any

    const el = getObjectFormItemsDraft({
      properties,
      name: ['spec'] as any,
      required: ['names'],
      addField,
      removeField,
      isEdit: true,
      expandedControls,
      persistedControls,
      urlParams,
    })

    render(<div>{el}</div>)
    expect(screen.getByTestId('array-header')).toBeInTheDocument()
    expect(screen.getByTestId('reseted-form-list')).toBeInTheDocument()
  })

  test('routes additionalProperties branch with nested properties present', () => {
    const properties = {
      extra: {
        type: 'object',
        description: 'desc',
        additionalProperties: { type: 'string' },
        properties: {
          inner: { type: 'string' },
        },
      },
    } as any

    const el = getObjectFormItemsDraft({
      properties,
      name: ['spec'] as any,
      required: [],
      description: 'parent',
      addField,
      removeField,
      isEdit: true,
      expandedControls,
      persistedControls,
      urlParams,
    })

    render(<div>{el}</div>)

    const node = screen.getByTestId('object-from-swagger')
    expect(node).toHaveAttribute('data-has-input-props', 'true')
    expect(screen.getByTestId('string-input')).toBeInTheDocument()
  })

  test('routes additionalProperties branch when no properties present (data undefined)', () => {
    const properties = {
      extra: {
        type: 'object',
        additionalProperties: { type: 'string' },
      },
    } as any

    const el = getObjectFormItemsDraft({
      properties,
      name: ['spec'] as any,
      required: [],
      addField,
      removeField,
      isEdit: true,
      expandedControls,
      persistedControls,
      urlParams,
    })

    render(<div>{el}</div>)
    expect(screen.getByTestId('object-from-swagger')).toBeInTheDocument()
  })

  test('routes object with properties branch via getObjectFormItemFromSwagger', () => {
    const properties = {
      obj: {
        type: 'object',
        description: 'o',
        properties: {
          inner: { type: 'string' },
        },
      },
    } as any

    const el = getObjectFormItemsDraft({
      properties,
      name: ['spec'] as any,
      required: ['obj'],
      addField,
      removeField,
      isEdit: true,
      expandedControls,
      persistedControls,
      urlParams,
    })

    render(<div>{el}</div>)

    expect(screen.getByTestId('object-from-swagger')).toBeInTheDocument()
    expect(screen.getByTestId('string-input')).toBeInTheDocument()
  })

  test('returns null for unknown/unhandled property', () => {
    const properties = { weird: { type: 'mysteryType' } } as any

    const el = getObjectFormItemsDraft({
      properties,
      name: ['spec'] as any,
      required: [],
      addField,
      removeField,
      isEdit: true,
      expandedControls,
      persistedControls,
      urlParams,
    })

    render(<div>{el}</div>)
    expect(screen.queryByTestId('string-input')).not.toBeInTheDocument()
    expect(screen.queryByTestId('number-input')).not.toBeInTheDocument()
  })
})

// ------------------------------------------------------
// Wrapper helper coverage
// ------------------------------------------------------
describe('getObjectFormItemFromSwagger', () => {
  test('wraps getObjectFormItemsDraft into FormObjectFromSwagger', () => {
    const properties = { inner: { type: 'string' } } as any

    const el = getObjectFormItemFromSwagger({
      properties,
      name: ['spec', 'obj'] as any,
      addField,
      removeField,
      isEdit: true,
      expandedControls,
      persistedControls,
      urlParams,
    })

    render(<div>{el}</div>)

    expect(screen.getByTestId('object-from-swagger')).toBeInTheDocument()
    expect(screen.getByTestId('string-input')).toBeInTheDocument()
  })
})
