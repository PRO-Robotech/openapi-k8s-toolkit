/* eslint-disable @typescript-eslint/no-explicit-any */
import { collapseManagedFieldsInEditor, findManagedFieldsLine, findManagedFieldsRange } from './utils'

describe('findManagedFieldsLine', () => {
  const makeModel = (lines: string[]) =>
    ({
      getLineCount: () => lines.length,
      getLineContent: (lineNumber: number) => lines[lineNumber - 1],
      getVersionId: () => 1,
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

describe('findManagedFieldsRange', () => {
  const makeModel = (lines: string[]) =>
    ({
      getLineCount: () => lines.length,
      getLineContent: (lineNumber: number) => lines[lineNumber - 1],
      getVersionId: () => 1,
    }) as any

  test('returns managedFields block start and end lines', () => {
    const model = makeModel([
      'apiVersion: v1',
      'metadata:',
      '  name: test',
      '  managedFields:',
      '    - manager: kubelet',
      '      operation: Update',
      '  resourceVersion: "1"',
      'spec:',
      '  replicas: 1',
    ])

    expect(findManagedFieldsRange(model)).toEqual({
      startLineNumber: 4,
      endLineNumber: 6,
    })
  })

  test('returns null when managedFields has no foldable child lines', () => {
    const model = makeModel(['metadata:', '  managedFields:'])
    expect(findManagedFieldsRange(model)).toBeNull()
  })
})

describe('collapseManagedFieldsInEditor', () => {
  const makeModel = (lines: string[]) =>
    ({
      getLineCount: () => lines.length,
      getLineContent: (lineNumber: number) => lines[lineNumber - 1],
      getVersionId: () => 1,
    }) as any

  test('does nothing when editor has no model', async () => {
    const trigger = jest.fn()
    const editor = {
      getModel: () => null,
      trigger,
    } as any

    const result = await collapseManagedFieldsInEditor(editor)

    expect(result).toBe(false)
    expect(trigger).not.toHaveBeenCalled()
  })

  test('falls back to editor.fold when folding contribution is unavailable', async () => {
    const model = makeModel([
      'apiVersion: v1',
      'metadata:',
      '  name: test',
      '  managedFields:',
      '    - manager: kubelet',
      '  resourceVersion: "1"',
      'spec:',
      '  replicas: 1',
    ])

    const trigger = jest.fn()
    const editor = {
      getModel: () => model,
      trigger,
    } as any

    const result = await collapseManagedFieldsInEditor(editor)

    expect(result).toBe(true)
    expect(trigger).toHaveBeenCalledWith('managed-fields-collapse', 'editor.fold', {
      selectionLines: [4],
      levels: 1,
      direction: 'down',
    })
  })

  test('collapses exact managedFields fold region via folding model', async () => {
    const model = makeModel([
      'metadata:',
      '  name: test',
      '  managedFields:',
      '    - manager: kubelet',
      '  resourceVersion: "1"',
    ])

    let collapsed = false
    const regions = {
      length: 3,
      getStartLineNumber: (index: number) => [2, 3, 10][index],
      isCollapsed: jest.fn(() => collapsed),
    }
    const toggleCollapseState = jest.fn(() => {
      collapsed = true
    })
    const getFoldingModel = jest.fn().mockResolvedValue({
      regions,
      toggleCollapseState,
    })
    const getContribution = jest.fn().mockReturnValue({
      getFoldingModel,
    })
    const editor = {
      getModel: () => model,
      getContribution,
      trigger: jest.fn(),
    } as any

    const result = await collapseManagedFieldsInEditor(editor)

    expect(result).toBe(true)
    expect(toggleCollapseState).toHaveBeenCalledWith([{ regionIndex: 1 }])
    expect(editor.trigger).not.toHaveBeenCalled()
  })

  test('returns true when managedFields region is already collapsed', async () => {
    const model = makeModel(['metadata:', '  managedFields:', '    - manager: kubelet', '  resourceVersion: "1"'])
    const regions = {
      length: 1,
      getStartLineNumber: () => 2,
      isCollapsed: () => true,
    }
    const toggleCollapseState = jest.fn()
    const editor = {
      getModel: () => model,
      getContribution: () => ({
        getFoldingModel: () =>
          Promise.resolve({
            regions,
            toggleCollapseState,
          }),
      }),
      trigger: jest.fn(),
    } as any

    const result = await collapseManagedFieldsInEditor(editor)

    expect(result).toBe(true)
    expect(toggleCollapseState).not.toHaveBeenCalled()
  })

  test('returns false when managedFields line is not found', async () => {
    const model = makeModel(['metadata:', '  name: test', 'spec:', '  replicas: 1'])
    const trigger = jest.fn()
    const editor = {
      getModel: () => model,
      trigger,
    } as any

    const result = await collapseManagedFieldsInEditor(editor)

    expect(result).toBe(false)
    expect(trigger).not.toHaveBeenCalled()
  })

  test('returns false when managedFields is the last line', async () => {
    const model = makeModel(['metadata:', '  managedFields:'])
    const trigger = jest.fn()
    const editor = {
      getModel: () => model,
      trigger,
    } as any

    const result = await collapseManagedFieldsInEditor(editor)

    expect(result).toBe(false)
    expect(trigger).not.toHaveBeenCalled()
  })

  test('returns false when folding model is unavailable yet', async () => {
    const model = makeModel(['metadata:', '  managedFields:', '    - manager: kubelet', '  resourceVersion: "1"'])
    const editor = {
      getModel: () => model,
      getContribution: () => ({
        getFoldingModel: () => Promise.resolve(null),
      }),
      trigger: jest.fn(),
    } as any

    const result = await collapseManagedFieldsInEditor(editor)

    expect(result).toBe(false)
  })
})
