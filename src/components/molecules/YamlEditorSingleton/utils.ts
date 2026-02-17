import type * as monaco from 'monaco-editor'

const collapsedVersionByModel = new WeakMap<monaco.editor.ITextModel, number>()

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

export const collapseManagedFieldsInEditor = (editor: monaco.editor.IStandaloneCodeEditor): void => {
  const model = editor.getModel()
  if (!model) return

  const currentVersion = model.getVersionId()
  if (collapsedVersionByModel.get(model) === currentVersion) return

  const managedFieldsLine = findManagedFieldsLine(model)
  if (managedFieldsLine === null) return
  if (managedFieldsLine >= model.getLineCount()) return

  editor.setPosition({ lineNumber: managedFieldsLine, column: 1 })
  editor.trigger('managed-fields-collapse', 'editor.fold', null)
  collapsedVersionByModel.set(model, currentVersion)
}
