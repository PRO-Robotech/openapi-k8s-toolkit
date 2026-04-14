import { useCallback, useMemo } from 'react'
import { Form } from 'antd'
import { TFormName } from 'localTypes/form'

type TDefaultValueButtonState =
  | { visible: false }
  | { visible: true; isApplied: boolean; onApply: () => void; onClear: () => void }

/**
 * Encapsulates the show/hide logic and apply/clear actions for the
 * DefaultValueButton atom. Must be called inside a Form context.
 *
 * Rules:
 * - If `defaultValue` is undefined → button hidden (no default in schema)
 * - If the field is empty (undefined, null, '') → show "Apply default"
 * - If the field's current value === defaultValue → show "Clear"
 * - Otherwise (user typed something else, or prefill set a different value) → hidden
 *
 * This automatically respects the Prefill > Default > Empty priority:
 * if a prefill filled the field with a non-default value, the button stays hidden.
 */
export const useDefaultValueButton = (
  formFieldName: TFormName,
  defaultValue: string | number | boolean | string[] | undefined,
): TDefaultValueButtonState => {
  const form = Form.useFormInstance()
  const currentValue = Form.useWatch(formFieldName, form)

  const onApply = useCallback(() => {
    form.setFieldValue(formFieldName, defaultValue)
  }, [form, formFieldName, defaultValue])

  const onClear = useCallback(() => {
    form.setFieldValue(formFieldName, undefined)
  }, [form, formFieldName])

  return useMemo(() => {
    if (defaultValue === undefined) {
      return { visible: false }
    }

    const isEmpty = currentValue === undefined || currentValue === null || currentValue === ''

    if (isEmpty) {
      return { visible: true, isApplied: false, onApply, onClear }
    }

    if (currentValue === defaultValue) {
      return { visible: true, isApplied: true, onApply, onClear }
    }

    return { visible: false }
  }, [defaultValue, currentValue, onApply, onClear])
}
