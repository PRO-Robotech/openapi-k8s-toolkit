/* eslint-disable no-empty */
/* eslint-disable @typescript-eslint/no-explicit-any */
import React, { FC, useEffect, useMemo, useRef, useState } from 'react'
import { Form, theme as antdtheme } from 'antd'
import Editor from '@monaco-editor/react'
import type * as monaco from 'monaco-editor'
import { TFormName, TPersistedControls } from 'localTypes/form'
import * as yaml from 'yaml'
import { useOnValuesChangeCallback } from '../../organisms/BlackholeForm/context'
import { Styled } from './styled'

type TFormInlineYamlEditorProps = {
  path: TFormName
  persistedControls: TPersistedControls
  externalValue?: unknown
}

export const FormInlineYamlEditor: FC<TFormInlineYamlEditorProps> = ({ path, persistedControls, externalValue }) => {
  const { token } = antdtheme.useToken()
  const form = Form.useFormInstance()
  const onValuesChange = useOnValuesChangeCallback()

  const [yamlText, setYamlText] = useState<string>('')
  const monacoRef = useRef<typeof monaco | null>(null)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)
  const isLocalEditRef = useRef<boolean>(false)
  const clearLocalEditTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const isFocusedRef = useRef<boolean>(false)

  // focus is tracked via Monaco events for reliability during IME/composition

  const modelUri = useMemo(() => {
    const encoded = encodeURIComponent(JSON.stringify(path))
    return `inmemory://openapi-ui/unknown/${encoded}.yaml`
  }, [path])

  // Watch specific field for external updates (e.g., main YAML editor)
  const watchedValue = Form.useWatch(path as any, form)
  useEffect(() => {
    if (isLocalEditRef.current) return
    if (isFocusedRef.current) return
    const value = watchedValue
    const isEmptyObj = value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0
    const next = value == null || isEmptyObj ? '' : yaml.stringify(value) ?? ''
    setYamlText(prev => (prev === next ? prev : next))
  }, [watchedValue])

  // Force-sync from externalValue prop (provided by parent Form.Item with shouldUpdate)
  useEffect(() => {
    if (isLocalEditRef.current) return
    if (isFocusedRef.current) return
    const value = externalValue
    const isEmptyObj = value && typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0
    const next = value == null || isEmptyObj ? '' : yaml.stringify(value) ?? ''
    setYamlText(prev => (prev === next ? prev : next))
  }, [externalValue])

  // Keep model tokenization and content in sync when not locally editing or focused
  useEffect(() => {
    if (isLocalEditRef.current) return
    if (isFocusedRef.current) return
    const ed = editorRef.current
    const m = monacoRef.current
    if (!ed || !m) return
    const uri = m.Uri.parse(modelUri)
    let model = ed.getModel() || m.editor.getModel(uri)
    if (!model) {
      model = m.editor.createModel(yamlText ?? '', 'yaml', uri)
    }
    if (model) {
      m.editor.setModelLanguage(model, 'yaml')
      const current = model.getValue()
      if ((yamlText ?? '') !== current) {
        model.setValue(yamlText ?? '')
      }
    }
  }, [yamlText, modelUri])

  return (
    <Styled.Container $colorBorder={token.colorBorder}>
      <Editor
        language="yaml"
        path={modelUri}
        keepCurrentModel
        width="100%"
        height="100%"
        defaultValue={yamlText ?? ''}
        onMount={(editor, m) => {
          editorRef.current = editor
          monacoRef.current = m
          // initialize focus state
          try {
            isFocusedRef.current = !!editor.hasTextFocus?.()
          } catch {
            isFocusedRef.current = false
          }
          editor.onDidFocusEditorText(() => {
            isFocusedRef.current = true
          })
          editor.onDidBlurEditorText(() => {
            isFocusedRef.current = false
          })
          const uri = m.Uri.parse(modelUri)
          let model = editor.getModel() || m.editor.getModel(uri)
          if (!model) {
            model = m.editor.createModel(yamlText ?? '', 'yaml', uri)
          }
          if (model) {
            const ensureYaml = () => {
              try {
                const mm = monacoRef.current
                const ee = editorRef.current
                if (!mm || !ee) return
                const u = mm.Uri.parse(modelUri)
                const mdl = ee.getModel() || mm.editor.getModel(u)
                if (!mdl) return
                const lang = (mdl as any).getLanguageId?.() || (mdl as any).getModeId?.()
                if (lang !== 'yaml') {
                  mm.editor.setModelLanguage(mdl, 'yaml')
                }
              } catch {}
            }
            // Initial apply and a few retries to cover lazy language loading/layout timing
            ensureYaml()
            try {
              requestAnimationFrame(() => ensureYaml())
            } catch {}
            setTimeout(() => ensureYaml(), 50)
            setTimeout(() => ensureYaml(), 200)
          }
        }}
        onValidate={() => {
          // Re-apply model language to restore tokenization after value changes from outside
          const m = monacoRef.current
          const ed = editorRef.current
          if (!m || !ed) return
          const uri = m.Uri.parse(modelUri)
          const model = ed.getModel() || m.editor.getModel(uri)
          if (model) {
            m.editor.setModelLanguage(model, 'yaml')
          }
        }}
        onChange={value => {
          const nextText = value || ''
          // Debounce local flag longer to avoid flicker with fast inputs and async BFF roundtrip
          isLocalEditRef.current = true
          if (clearLocalEditTimeoutRef.current) clearTimeout(clearLocalEditTimeoutRef.current)
          setYamlText(nextText)
          try {
            const parsed = yaml.parse(nextText || '')
            // Normalize empty content/null/empty object to an empty object value
            let nextValue: any
            if (!nextText.trim()) {
              nextValue = {}
            } else if (parsed === null) {
              nextValue = {}
            } else if (typeof parsed === 'object' && !Array.isArray(parsed) && Object.keys(parsed).length === 0) {
              nextValue = {}
            } else {
              nextValue = parsed
            }
            form.setFieldValue(path as any, nextValue)
            // Mark persisted to prevent cleanup from removing empty object branch
            if (!persistedControls.persistedKeys.some(k => JSON.stringify(k) === JSON.stringify(path))) {
              persistedControls.onPersistMark(path, 'obj')
            }
            onValuesChange?.()
          } catch {
            // ignore parse errors while typing
          }
          clearLocalEditTimeoutRef.current = setTimeout(() => {
            isLocalEditRef.current = false
          }, 600)
        }}
        options={{
          minimap: { enabled: false },
          lineNumbers: 'off',
          glyphMargin: false,
          folding: false,
          lineDecorationsWidth: 0,
          lineNumbersMinChars: 0,
          renderLineHighlight: 'none',
          scrollbar: { vertical: 'hidden', horizontal: 'auto' },
          overviewRulerLanes: 0,
          wordWrap: 'on',
        }}
      />
    </Styled.Container>
  )
}
