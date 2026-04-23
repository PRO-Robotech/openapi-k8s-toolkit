import { useCallback, useMemo } from 'react'
import { Form } from 'antd'
import { TFormName } from 'localTypes/form'

type TDefaultValueButtonState =
  | { visible: false }
  | { visible: true; isApplied: boolean; handleApply: () => void; handleClear: () => void }

export const useDefaultValueButton = (
  formFieldName: TFormName,
  defaultValue: string | number | boolean | string[] | undefined,
  nullable?: boolean,
): TDefaultValueButtonState => {
  const form = Form.useFormInstance()
  const currentValue = Form.useWatch(formFieldName, form)

  const handleApply = useCallback(() => {
    form.setFieldValue(formFieldName, defaultValue)
  }, [defaultValue, form, formFieldName])

  const handleClear = useCallback(() => {
    form.setFieldValue(formFieldName, undefined)
  }, [form, formFieldName])

  return useMemo(() => {
    if (defaultValue === undefined) {
      return { visible: false }
    }

    // When the field is nullable and the user has explicitly set null, yield to NullToggleButton —
    // "Apply default" would silently overwrite that deliberate null.
    if (nullable && currentValue === null) {
      return { visible: false }
    }

    const isEmpty =
      currentValue === undefined ||
      currentValue === null ||
      currentValue === '' ||
      (Array.isArray(currentValue) && currentValue.length === 0)

    if (isEmpty) {
      return { visible: true, isApplied: false, handleApply, handleClear }
    }

    const isEqualToDefault =
      Array.isArray(defaultValue) && Array.isArray(currentValue)
        ? defaultValue.length === currentValue.length && defaultValue.every((v, i) => v === currentValue[i])
        : currentValue === defaultValue

    if (isEqualToDefault) {
      return { visible: true, isApplied: true, handleApply, handleClear }
    }

    return { visible: false }
  }, [nullable, currentValue, defaultValue, handleApply, handleClear])
}
