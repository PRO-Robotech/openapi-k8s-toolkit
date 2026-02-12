/* eslint-disable @typescript-eslint/no-explicit-any */
import { collapseManagedFieldsInEditor, findManagedFieldsLine } from './utils'

describe('findManagedFieldsLine', () => {
  const makeModel = (lines: string[]) =>
    ({
      getLineCount: () => lines.length,
      getLineContent: (lineNumber: number) => lines[lineNumber - 1],
    }) as any

  test('returns line number for metadata.managedFields', () => {
    const model = makeModel([
      'apiVersion: v1',
      'kind: Pod',
      'metadata:',
      '  name: test',
      '  managedFields:',
      '    - manager: kubectl',
    ])

    expect(findManagedFieldsLine(model)).toBe(5)
  })

  test('returns null when metadata does not exist', () => {
    const model = makeModel(['spec:', '  replicas: 1'])
    expect(findManagedFieldsLine(model)).toBeNull()
  })

  test('returns null when managedFields exists outside metadata', () => {
    const model = makeModel(['managedFields:', '  - manager: x', 'metadata:', '  name: test'])
    expect(findManagedFieldsLine(model)).toBeNull()
  })

  test('returns null when managedFields is not under metadata scope', () => {
    const model = makeModel(['metadata:', '  name: test', 'spec:', '  managedFields:', '    - manager: x'])
    expect(findManagedFieldsLine(model)).toBeNull()
  })
})

describe('collapseManagedFieldsInEditor', () => {
  const makeModel = (lines: string[]) =>
    ({
      getLineCount: () => lines.length,
      getLineContent: (lineNumber: number) => lines[lineNumber - 1],
    }) as any

  test('does nothing when editor has no model', () => {
    const setPosition = jest.fn()
    const trigger = jest.fn()
    const editor = {
      getModel: () => null,
      setPosition,
      trigger,
    } as any

    collapseManagedFieldsInEditor(editor)

    expect(setPosition).not.toHaveBeenCalled()
    expect(trigger).not.toHaveBeenCalled()
  })

  test('folds managedFields when present under metadata', () => {
    const model = makeModel([
      'apiVersion: v1',
      'metadata:',
      '  name: test',
      '  managedFields:',
      '    - manager: kubelet',
      'spec:',
      '  replicas: 1',
    ])

    const setPosition = jest.fn()
    const trigger = jest.fn()
    const editor = {
      getModel: () => model,
      setPosition,
      trigger,
    } as any

    collapseManagedFieldsInEditor(editor)

    expect(setPosition).toHaveBeenCalledWith({ lineNumber: 4, column: 1 })
    expect(trigger).toHaveBeenCalledWith('managed-fields-collapse', 'editor.fold', null)
  })

  test('does nothing when managedFields line is not found', () => {
    const model = makeModel(['metadata:', '  name: test', 'spec:', '  replicas: 1'])
    const setPosition = jest.fn()
    const trigger = jest.fn()
    const editor = {
      getModel: () => model,
      setPosition,
      trigger,
    } as any

    collapseManagedFieldsInEditor(editor)

    expect(setPosition).not.toHaveBeenCalled()
    expect(trigger).not.toHaveBeenCalled()
  })

  test('does nothing when managedFields is the last line', () => {
    const model = makeModel(['metadata:', '  managedFields:'])
    const setPosition = jest.fn()
    const trigger = jest.fn()
    const editor = {
      getModel: () => model,
      setPosition,
      trigger,
    } as any

    collapseManagedFieldsInEditor(editor)

    expect(setPosition).not.toHaveBeenCalled()
    expect(trigger).not.toHaveBeenCalled()
  })
})
