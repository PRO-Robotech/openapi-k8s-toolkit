import type * as monaco from 'monaco-editor'

export const findManagedFieldsLine = (model: monaco.editor.ITextModel): number | null => {
  let inMetadata = false
  let metadataIndent = -1

  for (let lineNumber = 1; lineNumber <= model.getLineCount(); lineNumber++) {
    const line = model.getLineContent(lineNumber)
    const trimmed = line.trim()
    const indent = line.match(/^\s*/)?.[0].length ?? 0

    if (!inMetadata && /^metadata\s*:\s*$/.test(trimmed)) {
      inMetadata = true
      metadataIndent = indent
    } else if (inMetadata) {
      if (trimmed && indent <= metadataIndent) {
        inMetadata = false
      } else if (/^managedFields\s*:\s*$/.test(trimmed)) {
        return lineNumber
      }
    }
  }

  return null
}

export const findManagedFieldsRange = (
  model: monaco.editor.ITextModel
): { startLineNumber: number; endLineNumber: number } | null => {
  const startLineNumber = findManagedFieldsLine(model)
  if (startLineNumber === null) return null

  const startLine = model.getLineContent(startLineNumber)
  const managedFieldsIndent = startLine.match(/^\s*/)?.[0].length ?? 0

  for (let lineNumber = startLineNumber + 1; lineNumber <= model.getLineCount(); lineNumber++) {
    const line = model.getLineContent(lineNumber)
    const trimmed = line.trim()
    const indent = line.match(/^\s*/)?.[0].length ?? 0

    if (trimmed && indent <= managedFieldsIndent) {
      const endLineNumber = lineNumber - 1
      if (endLineNumber <= startLineNumber) return null
      return { startLineNumber, endLineNumber }
    }
  }

  if (startLineNumber >= model.getLineCount()) return null
  return { startLineNumber, endLineNumber: model.getLineCount() }
}

export const collapseManagedFieldsInEditor = async (
  editor: monaco.editor.IStandaloneCodeEditor
): Promise<boolean> => {
  const model = editor.getModel()
  if (!model) return false

  const range = findManagedFieldsRange(model)
  if (!range) return false

  const managedFieldsLine = range.startLineNumber
  const foldingController = (editor as unknown as { getContribution?: (id: string) => unknown }).getContribution?.(
    'editor.contrib.folding'
  ) as
    | {
        getFoldingModel?: () => Promise<{
          regions: {
            length: number
            getStartLineNumber: (index: number) => number
            isCollapsed: (index: number) => boolean
          }
          toggleCollapseState: (regions: Array<{ regionIndex: number }>) => void
        } | null>
      }
    | undefined

  if (!foldingController?.getFoldingModel) {
    editor.trigger('managed-fields-collapse', 'editor.fold', {
      selectionLines: [managedFieldsLine],
      levels: 1,
      direction: 'down',
    })
    return true
  }

  const foldingModel = await foldingController.getFoldingModel()
  if (!foldingModel) return false

  const { regions } = foldingModel
  let managedFieldsRegionIndex = -1

  for (let index = 0; index < regions.length; index++) {
    if (regions.getStartLineNumber(index) === managedFieldsLine) {
      managedFieldsRegionIndex = index
      break
    }
  }

  if (managedFieldsRegionIndex === -1) return false
  if (regions.isCollapsed(managedFieldsRegionIndex)) return true

  foldingModel.toggleCollapseState([{ regionIndex: managedFieldsRegionIndex }])
  return regions.isCollapsed(managedFieldsRegionIndex)
}
